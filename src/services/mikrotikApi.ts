
const API_BASE = 'http://localhost:3001/api';

export interface RouterConnection {
  id: number;
  host: string;
  username: string;
  password: string;
}

export interface AddressList {
  [listName: string]: {
    address: string;
    comment: string;
    id: string;
  }[];
}

export interface RouterStatus {
  connected: boolean;
  version: string;
  identity: string;
  uptime?: string;
  method: 'api' | 'ssh';
}

class MikroTikApiService {
  async connectRouter(router: RouterConnection): Promise<RouterStatus> {
    try {
      console.log('Attempting to connect to router:', router.host);
      
      const response = await fetch(`${API_BASE}/routers/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(router),
      });

      console.log('Connection response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Connection failed:', error);
        throw new Error(error.error || 'Connection failed');
      }

      const result = await response.json();
      console.log('Connection successful:', result);
      return result;
    } catch (error) {
      console.error('Network error during connection:', error);
      throw error;
    }
  }

  async getAddressLists(routerId: number): Promise<AddressList> {
    try {
      console.log('Fetching address lists for router:', routerId);
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to get address lists:', error);
        throw new Error(error.error || 'Failed to get address lists');
      }

      const result = await response.json();
      console.log('Address lists retrieved:', result);
      return result;
    } catch (error) {
      console.error('Network error getting address lists:', error);
      throw error;
    }
  }

  async addAddressToList(routerId: number, listName: string, address: string, comment: string = ''): Promise<{success: boolean}> {
    try {
      console.log('Adding address to list:', { routerId, listName, address, comment });
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists/${listName}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to add address:', error);
        throw new Error(error.error || 'Failed to add address');
      }

      const result = await response.json();
      console.log('Address added successfully:', result);
      return result;
    } catch (error) {
      console.error('Network error adding address:', error);
      throw error;
    }
  }

  async removeAddressFromList(routerId: number, listName: string, address: string): Promise<{success: boolean}> {
    try {
      console.log('Removing address from list:', { routerId, listName, address });
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists/${listName}/addresses/${encodeURIComponent(address)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to remove address:', error);
        throw new Error(error.error || 'Failed to remove address');
      }

      const result = await response.json();
      console.log('Address removed successfully:', result);
      return result;
    } catch (error) {
      console.error('Network error removing address:', error);
      throw error;
    }
  }

  async createBackup(routerId: number, backupName: string): Promise<{success: boolean; filename: string; size: string}> {
    try {
      console.log('Creating backup:', { routerId, backupName });
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: backupName }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create backup:', error);
        throw new Error(error.error || 'Failed to create backup');
      }

      const result = await response.json();
      console.log('Backup created successfully:', result);
      return result;
    } catch (error) {
      console.error('Network error creating backup:', error);
      throw error;
    }
  }

  async executeCommand(routerId: number, command: string): Promise<{success: boolean; output: string}> {
    try {
      console.log('Executing command:', { routerId, command });
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to execute command:', error);
        throw new Error(error.error || 'Failed to execute command');
      }

      const result = await response.json();
      console.log('Command executed successfully:', result);
      return result;
    } catch (error) {
      console.error('Network error executing command:', error);
      throw error;
    }
  }

  async disconnectRouter(routerId: number): Promise<{success: boolean}> {
    try {
      console.log('Disconnecting router:', routerId);
      
      const response = await fetch(`${API_BASE}/routers/${routerId}/disconnect`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to disconnect:', error);
        throw new Error(error.error || 'Failed to disconnect');
      }

      const result = await response.json();
      console.log('Disconnected successfully:', result);
      return result;
    } catch (error) {
      console.error('Network error disconnecting:', error);
      throw error;
    }
  }

  // Test backend connectivity
  async testBackendConnection(): Promise<boolean> {
    try {
      console.log('Testing backend connection...');
      
      const response = await fetch(`${API_BASE.replace('/api', '')}`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend is available:', result);
        return true;
      } else {
        console.error('Backend returned error:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Backend is not reachable:', error);
      return false;
    }
  }
}

export const mikrotikApi = new MikroTikApiService();
