
const { RouterOSAPI } = require('node-routeros');
const { Client } = require('ssh2');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

class MikroTikManager {
  constructor() {
    this.connections = new Map();
  }

  // Detect RouterOS version for compatibility
  async detectOSVersion(host, username, password) {
    try {
      const api = new RouterOSAPI({
        host,
        user: username,
        password,
        port: 8728,
        timeout: 5000
      });

      await api.connect();
      const system = await api.write('/system/resource/print');
      await api.disconnect();
      
      const version = system[0].version;
      return {
        version,
        isV7: version.startsWith('7.'),
        isV6: version.startsWith('6.')
      };
    } catch (error) {
      console.error('Error detecting OS version:', error.message);
      throw error;
    }
  }

  // Connect via API (preferred method)
  async connectAPI(routerId, host, username, password) {
    try {
      const api = new RouterOSAPI({
        host,
        user: username,
        password,
        port: 8728,
        timeout: 10000
      });

      await api.connect();
      this.connections.set(routerId, { type: 'api', connection: api, host });
      
      // Get system info to confirm connection
      const system = await api.write('/system/resource/print');
      const identity = await api.write('/system/identity/print');
      
      return {
        connected: true,
        version: system[0].version,
        identity: identity[0].name,
        uptime: system[0].uptime,
        method: 'api'
      };
    } catch (error) {
      console.error('API connection failed:', error.message);
      throw error;
    }
  }

  // Connect via SSH (fallback method)
  async connectSSH(routerId, host, username, password) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', async () => {
        this.connections.set(routerId, { type: 'ssh', connection: conn, host });
        
        // Get system info via SSH
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
        reject(err);
      });

      conn.connect({
        host,
        username,
        password,
        port: 22,
        readyTimeout: 10000
      });
    });
  }

  // Execute SSH command
  executeSSHCommand(conn, command) {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) reject(err);
        
        let output = '';
        stream.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Command failed with code ${code}`));
          }
        });
        
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.stderr.on('data', (data) => {
          console.error('SSH Error:', data.toString());
        });
      });
    });
  }

  // Get address lists (compatible with v6 and v7)
  async getAddressLists(routerId) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      if (conn.type === 'api') {
        const lists = await conn.connection.write('/ip/firewall/address-list/print');
        return this.formatAddressLists(lists);
      } else {
        const output = await this.executeSSHCommand(
          conn.connection, 
          '/ip firewall address-list print'
        );
        return this.parseAddressListsFromSSH(output);
      }
    } catch (error) {
      console.error('Error getting address lists:', error.message);
      throw error;
    }
  }

  // Add address to list
  async addAddressToList(routerId, listName, address, comment = '') {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      if (conn.type === 'api') {
        await conn.connection.write('/ip/firewall/address-list/add', {
          list: listName,
          address: address,
          comment: comment
        });
      } else {
        await this.executeSSHCommand(
          conn.connection,
          `/ip firewall address-list add list=${listName} address=${address} comment="${comment}"`
        );
      }
      return { success: true };
    } catch (error) {
      console.error('Error adding address:', error.message);
      throw error;
    }
  }

  // Remove address from list
  async removeAddressFromList(routerId, listName, address) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      if (conn.type === 'api') {
        const items = await conn.connection.write('/ip/firewall/address-list/print', {
          '?list': listName,
          '?address': address
        });
        
        if (items.length > 0) {
          await conn.connection.write('/ip/firewall/address-list/remove', {
            '.id': items[0]['.id']
          });
        }
      } else {
        await this.executeSSHCommand(
          conn.connection,
          `/ip firewall address-list remove [find list=${listName} address=${address}]`
        );
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing address:', error.message);
      throw error;
    }
  }

  // Create backup
  async createBackup(routerId, backupName) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      if (conn.type === 'api') {
        await conn.connection.write('/system/backup/save', {
          name: backupName
        });
        
        // Wait a moment for backup to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get backup file
        const files = await conn.connection.write('/file/print', {
          '?name': `${backupName}.backup`
        });
        
        return {
          success: true,
          filename: `${backupName}.backup`,
          size: files[0]?.size || 'Unknown'
        };
      } else {
        await this.executeSSHCommand(
          conn.connection,
          `/system backup save name=${backupName}`
        );
        
        return {
          success: true,
          filename: `${backupName}.backup`,
          size: 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error creating backup:', error.message);
      throw error;
    }
  }

  // Execute custom command
  async executeCommand(routerId, command) {
    const conn = this.connections.get(routerId);
    if (!conn) throw new Error('Router not connected');

    try {
      if (conn.type === 'api') {
        const result = await conn.connection.write(command);
        return {
          success: true,
          output: JSON.stringify(result, null, 2)
        };
      } else {
        const output = await this.executeSSHCommand(conn.connection, command);
        return {
          success: true,
          output: output
        };
      }
    } catch (error) {
      return {
        success: false,
        output: error.message
      };
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
      if (conn.type === 'api') {
        conn.connection.disconnect();
      } else {
        conn.connection.end();
      }
      this.connections.delete(routerId);
    }
  }
}

const mikrotikManager = new MikroTikManager();

// API Routes
app.post('/api/routers/connect', async (req, res) => {
  try {
    const { id, host, username, password } = req.body;
    
    // Try API first, fallback to SSH
    let result;
    try {
      result = await mikrotikManager.connectAPI(id, host, username, password);
    } catch (apiError) {
      console.log('API failed, trying SSH...');
      result = await mikrotikManager.connectSSH(id, host, username, password);
    }
    
    res.json(result);
  } catch (error) {
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
app.listen(PORT, () => {
  console.log(`MikroTik Manager API Server running on port ${PORT}`);
});

module.exports = { MikroTikManager };
