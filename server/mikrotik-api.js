const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Try to load optional dependencies
let RouterOSAPI, Client;
try {
  const routeros = require('node-routeros');
  RouterOSAPI = routeros.RouterOSAPI;
} catch (error) {
  console.warn('node-routeros not available, API connections will fail');
}

try {
  const ssh2 = require('ssh2');
  Client = ssh2.Client;
} catch (error) {
  console.warn('ssh2 not available, SSH connections will fail');
}

class MikroTikManager {
  constructor() {
    this.connections = new Map();
  }

  // Try REST API first (RouterOS 7.1+)
  async connectREST(routerId, host, username, password) {
    try {
      console.log(`Attempting REST connection to ${host}...`);
      
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      const restUrl = `http://${host}/rest/system/resource`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        console.log('REST connection successful');
        
        // Store REST connection info
        this.connections.set(routerId, { 
          type: 'rest', 
          host, 
          auth,
          connection: { host, auth }
        });
        
        return {
          connected: true,
          version: data.version || 'Unknown',
          identity: data['board-name'] || 'RouterOS',
          method: 'rest'
        };
      } else {
        throw new Error(`REST API returned ${response.status}`);
      }
    } catch (error) {
      console.log(`REST connection failed: ${error.message}`);
      throw error;
    }
  }

  // API connection (node-routeros)
  async connectAPI(routerId, host, username, password) {
    if (!RouterOSAPI) {
      throw new Error('RouterOS API not available');
    }
    
    try {
      console.log(`Attempting API connection to ${host}...`);
      
      const api = new RouterOSAPI({
        host,
        user: username,
        password,
        port: 8728,
        timeout: 10000
      });

      await api.connect();
      
      // Get system info
      const system = await api.write('/system/resource/print');
      const identity = await api.write('/system/identity/print');
      
      this.connections.set(routerId, { 
        type: 'api', 
        connection: api, 
        host 
      });
      
      console.log('API connection successful');
      
      return {
        connected: true,
        version: system[0]?.version || 'Unknown',
        identity: identity[0]?.name || 'RouterOS',
        method: 'api'
      };
    } catch (error) {
      console.log(`API connection failed: ${error.message}`);
      throw error;
    }
  }

  // SSH connection (fallback)
  async connectSSH(routerId, host, username, password) {
    if (!Client) {
      throw new Error('SSH client not available');
    }
    
    return new Promise((resolve, reject) => {
      console.log(`Attempting SSH connection to ${host}...`);
      
      const conn = new Client();
      const connectionTimeout = setTimeout(() => {
        conn.end();
        reject(new Error(`SSH connection timeout`));
      }, 15000);
      
      conn.on('ready', async () => {
        clearTimeout(connectionTimeout);
        console.log('SSH connection successful');
        
        this.connections.set(routerId, { 
          type: 'ssh', 
          connection: conn, 
          host 
        });
        
        try {
          const sysInfo = await this.executeSSHCommand(conn, '/system resource print');
          const identity = await this.executeSSHCommand(conn, '/system identity print');
          
          resolve({
            connected: true,
            version: this.parseVersion(sysInfo),
            identity: this.parseIdentity(identity),
            method: 'ssh'
          });
        } catch (error) {
          reject(error);
        }
      });

      conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        reject(new Error(`SSH connection failed: ${err.message}`));
      });

      conn.connect({
        host,
        username,
        password,
        port: 22,
        readyTimeout: 12000,
        algorithms: {
          kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1'],
          cipher: ['aes128-ctr', 'aes256-ctr', 'aes128-cbc'],
          hmac: ['hmac-sha2-256', 'hmac-sha1']
        }
      });
    });
  }

  // Main connection method with fallback
  async connect(routerId, host, username, password) {
    const methods = ['REST', 'API', 'SSH'];
    let lastError;
    
    for (const method of methods) {
      try {
        console.log(`Trying ${method} connection...`);
        
        switch (method) {
          case 'REST':
            return await this.connectREST(routerId, host, username, password);
          case 'API':
            return await this.connectAPI(routerId, host, username, password);
          case 'SSH':
            return await this.connectSSH(routerId, host, username, password);
        }
      } catch (error) {
        console.log(`${method} failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`All connection methods failed. Last error: ${lastError.message}`);
  }

  // Execute REST request
  async executeREST(host, auth, endpoint, method = 'GET', data = null) {
    const url = `http://${host}/rest${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`REST request failed: ${response.status}`);
    }
  }

  // Execute SSH command
  executeSSHCommand(conn, command, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const commandTimeout = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(commandTimeout);
          reject(err);
          return;
        }
        
        let output = '';
        
        stream.on('close', (code) => {
          clearTimeout(commandTimeout);
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Command failed with code ${code}`));
          }
        });
        
        stream.on('data', (data) => {
          output += data.toString();
        });
      });
    });
  }

  // Get address lists with method detection
  async getAddressLists(routerId) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      switch (conn.type) {
        case 'rest':
          const lists = await this.executeREST(conn.host, conn.auth, '/ip/firewall/address-list');
          return this.formatAddressLists(lists);
          
        case 'api':
          const apiLists = await conn.connection.write('/ip/firewall/address-list/print');
          return this.formatAddressLists(apiLists);
          
        case 'ssh':
          const output = await this.executeSSHCommand(conn.connection, '/ip firewall address-list print');
          return this.parseAddressListsFromSSH(output);
          
        default:
          throw new Error('Unknown connection type');
      }
    } catch (error) {
      console.error('Error getting address lists:', error.message);
      throw error;
    }
  }

  // Add address with method detection
  async addAddressToList(routerId, listName, address, comment = '') {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      switch (conn.type) {
        case 'rest':
          await this.executeREST(conn.host, conn.auth, '/ip/firewall/address-list', 'POST', {
            list: listName,
            address: address,
            comment: comment
          });
          break;
          
        case 'api':
          await conn.connection.write('/ip/firewall/address-list/add', {
            list: listName,
            address: address,
            comment: comment
          });
          break;
          
        case 'ssh':
          await this.executeSSHCommand(
            conn.connection,
            `/ip firewall address-list add list=${listName} address=${address} comment="${comment}"`
          );
          break;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding address:', error.message);
      throw error;
    }
  }

  // Remove address with method detection
  async removeAddressFromList(routerId, listName, address) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      switch (conn.type) {
        case 'rest':
          // Find the item first
          const items = await this.executeREST(conn.host, conn.auth, `/ip/firewall/address-list?list=${listName}&address=${address}`);
          if (items.length > 0) {
            await this.executeREST(conn.host, conn.auth, `/ip/firewall/address-list/${items[0]['.id']}`, 'DELETE');
          }
          break;
          
        case 'api':
          const apiItems = await conn.connection.write('/ip/firewall/address-list/print', {
            '?list': listName,
            '?address': address
          });
          if (apiItems.length > 0) {
            await conn.connection.write('/ip/firewall/address-list/remove', {
              '.id': apiItems[0]['.id']
            });
          }
          break;
          
        case 'ssh':
          await this.executeSSHCommand(
            conn.connection,
            `/ip firewall address-list remove [find list=${listName} address=${address}]`
          );
          break;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error removing address:', error.message);
      throw error;
    }
  }

  // Create backup with method detection
  async createBackup(routerId, backupName) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      switch (conn.type) {
        case 'rest':
          await this.executeREST(conn.host, conn.auth, '/system/backup', 'POST', { name: backupName });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, filename: `${backupName}.backup`, size: 'Unknown' };
          
        case 'api':
          await conn.connection.write('/system/backup/save', { name: backupName });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, filename: `${backupName}.backup`, size: 'Unknown' };
          
        case 'ssh':
          await this.executeSSHCommand(conn.connection, `/system backup save name=${backupName}`, 20000);
          return { success: true, filename: `${backupName}.backup`, size: 'Unknown' };
      }
    } catch (error) {
      console.error('Error creating backup:', error.message);
      throw error;
    }
  }

  // Execute command with method detection
  async executeCommand(routerId, command) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      switch (conn.type) {
        case 'rest':
          // REST commands need to be mapped to endpoints
          return { success: false, output: 'Custom commands not supported via REST API' };
          
        case 'api':
          const result = await conn.connection.write(command);
          return { success: true, output: JSON.stringify(result, null, 2) };
          
        case 'ssh':
          const output = await this.executeSSHCommand(conn.connection, command, 15000);
          return { success: true, output: output };
      }
    } catch (error) {
      return { success: false, output: `Error: ${error.message}` };
    }
  }

  // Helper methods
  formatAddressLists(lists) {
    const grouped = {};
    lists.forEach(item => {
      if (!grouped[item.list]) {
        grouped[item.list] = [];
      }
      grouped[item.list].push({
        address: item.address,
        comment: item.comment || '',
        id: item['.id']
      });
    });
    return grouped;
  }

  parseAddressListsFromSSH(output) {
    const lines = output.split('\n');
    const grouped = {};
    
    lines.forEach(line => {
      const match = line.match(/(\d+)\s+(.+?)\s+(.+?)\s+(.+)/);
      if (match) {
        const [, id, list, address, comment] = match;
        if (!grouped[list]) {
          grouped[list] = [];
        }
        grouped[list].push({
          address: address,
          comment: comment || '',
          id: id
        });
      }
    });
    
    return grouped;
  }

  parseVersion(output) {
    const match = output.match(/version:\s*(.+)/);
    return match ? match[1].trim() : 'Unknown';
  }

  parseIdentity(output) {
    const match = output.match(/name:\s*(.+)/);
    return match ? match[1].trim() : 'Unknown';
  }

  disconnect(routerId) {
    const conn = this.connections.get(routerId);
    if (conn) {
      try {
        if (conn.type === 'api') {
          conn.connection.disconnect();
        } else if (conn.type === 'ssh') {
          conn.connection.end();
        }
        // REST connections don't need explicit disconnection
      } catch (error) {
        console.warn(`Error disconnecting ${routerId}:`, error.message);
      } finally {
        this.connections.delete(routerId);
      }
    }
  }
}

const mikrotikManager = new MikroTikManager();

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'MikroTik Manager API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      connect: 'POST /api/routers/connect',
      addressLists: 'GET /api/routers/:id/address-lists',
      addAddress: 'POST /api/routers/:id/address-lists/:listName/addresses',
      removeAddress: 'DELETE /api/routers/:id/address-lists/:listName/addresses/:address',
      backup: 'POST /api/routers/:id/backup',
      command: 'POST /api/routers/:id/command',
      disconnect: 'POST /api/routers/:id/disconnect'
    },
    connectionMethods: ['REST (RouterOS 7.1+)', 'API (node-routeros)', 'SSH'],
    dependencies: {
      'node-routeros': RouterOSAPI ? 'available' : 'missing',
      'ssh2': Client ? 'available' : 'missing'
    }
  });
});

// API Routes
app.post('/api/routers/connect', async (req, res) => {
  try {
    const { id, host, username, password } = req.body;
    console.log(`Connection request for router ${id} at ${host}`);
    
    const result = await mikrotikManager.connect(id, host, username, password);
    console.log(`Connection successful via ${result.method}`);
    
    res.json(result);
  } catch (error) {
    console.error('Connection failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/routers/:id/address-lists', async (req, res) => {
  try {
    const { id } = req.params;
    const lists = await mikrotikManager.getAddressLists(parseInt(id));
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers/:id/address-lists/:listName/addresses', async (req, res) => {
  try {
    const { id, listName } = req.params;
    const { address, comment } = req.body;
    const result = await mikrotikManager.addAddressToList(parseInt(id), listName, address, comment);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/routers/:id/address-lists/:listName/addresses/:address', async (req, res) => {
  try {
    const { id, listName, address } = req.params;
    const result = await mikrotikManager.removeAddressFromList(parseInt(id), listName, address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers/:id/backup', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await mikrotikManager.createBackup(parseInt(id), name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;
    const result = await mikrotikManager.executeCommand(parseInt(id), command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;
    mikrotikManager.disconnect(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`Port ${PORT} is busy, using port ${availablePort} instead`);
    }
    
    app.listen(availablePort, () => {
      console.log(`MikroTik Manager API Server running on port ${availablePort}`);
      console.log(`Connection methods: REST -> API -> SSH (fallback)`);
      console.log(`Server available at: http://localhost:${availablePort}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = { MikroTikManager };
