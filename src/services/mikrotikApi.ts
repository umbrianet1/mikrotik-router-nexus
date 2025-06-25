
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
    const response = await fetch(`${API_BASE}/routers/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(router),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Connection failed');
    }

    return response.json();
  }

  async getAddressLists(routerId: number): Promise<AddressList> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get address lists');
    }

    return response.json();
  }

  async addAddressToList(routerId: number, listName: string, address: string, comment: string = ''): Promise<{success: boolean}> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists/${listName}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, comment }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add address');
    }

    return response.json();
  }

  async removeAddressFromList(routerId: number, listName: string, address: string): Promise<{success: boolean}> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/address-lists/${listName}/addresses/${encodeURIComponent(address)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove address');
    }

    return response.json();
  }

  async createBackup(routerId: number, backupName: string): Promise<{success: boolean; filename: string; size: string}> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: backupName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create backup');
    }

    return response.json();
  }

  async executeCommand(routerId: number, command: string): Promise<{success: boolean; output: string}> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute command');
    }

    return response.json();
  }

  async disconnectRouter(routerId: number): Promise<{success: boolean}> {
    const response = await fetch(`${API_BASE}/routers/${routerId}/disconnect`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect');
    }

    return response.json();
  }
}

export const mikrotikApi = new MikroTikApiService();
