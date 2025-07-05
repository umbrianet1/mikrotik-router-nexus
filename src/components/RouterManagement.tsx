
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, Router as RouterIcon, Settings, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikApi, RouterConnection } from "@/services/mikrotikApi";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
  username?: string;
  password?: string;
  identity?: string;
  method?: 'api' | 'ssh';
}

interface RouterManagementProps {
  routers: Router[];
  setRouters: (routers: Router[]) => void;
}

const RouterManagement = ({ routers, setRouters }: RouterManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);
  const [newRouter, setNewRouter] = useState({
    name: '',
    ip: '',
    username: '',
    password: ''
  });
  const [connectingRouters, setConnectingRouters] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleAddRouter = () => {
    if (!newRouter.name || !newRouter.ip || !newRouter.username || !newRouter.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const router: Router = {
      id: Date.now(),
      name: newRouter.name,
      ip: newRouter.ip,
      username: newRouter.username,
      password: newRouter.password,
      status: "offline",
      version: "Unknown",
      lastBackup: "Never"
    };

    setRouters([...routers, router]);
    setNewRouter({
      name: '',
      ip: '',
      username: '',
      password: ''
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Router Added",
      description: `${newRouter.name} has been added successfully.`,
    });
  };

  const handleEditRouter = () => {
    if (!editingRouter || !editingRouter.name || !editingRouter.ip || !editingRouter.username || !editingRouter.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedRouters = routers.map(r => 
      r.id === editingRouter.id ? { ...editingRouter } : r
    );
    setRouters(updatedRouters);
    setIsEditDialogOpen(false);
    setEditingRouter(null);

    toast({
      title: "Router Updated",
      description: `${editingRouter.name} has been updated successfully.`,
    });
  };

  const openEditDialog = (router: Router) => {
    setEditingRouter({ ...router });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRouter = async (routerId: number) => {
    try {
      const router = routers.find(r => r.id === routerId);
      
      // Solo se il router è davvero online, prova a disconnetterlo
      if (router && router.status === 'online') {
        try {
          await mikrotikApi.disconnectRouter(routerId);
        } catch (disconnectError) {
          console.log('Disconnect failed, but proceeding with deletion:', disconnectError);
          // Non bloccare la cancellazione se la disconnessione fallisce
        }
      }
      
      // Procedi sempre con la cancellazione
      setRouters(routers.filter(r => r.id !== routerId));
      toast({
        title: "Router Deleted",
        description: `${router?.name || 'Router'} has been removed from management.`,
      });
    } catch (error) {
      // Anche se c'è un errore, rimuovi comunque il router dalla lista
      setRouters(routers.filter(r => r.id !== routerId));
      toast({
        title: "Router Deleted",
        description: "Router has been removed from management (connection error ignored).",
      });
    }
  };

  const handleConnectRouter = async (router: Router) => {
    if (!router.username || !router.password) {
      toast({
        title: "Missing Credentials",
        description: "Username and password are required to connect.",
        variant: "destructive",
      });
      return;
    }

    setConnectingRouters(prev => new Set([...prev, router.id]));
    
    try {
      // Prima controlliamo la connettività del backend
      const backendConnected = await mikrotikApi.testBackendConnection();
      if (!backendConnected) {
        throw new Error('Backend API server is not reachable. Please ensure the backend is running on port 3001.');
      }

      const connectionData: RouterConnection = {
        id: router.id,
        host: router.ip,
        username: router.username,
        password: router.password
      };

      console.log('Attempting connection with:', { host: router.ip, username: router.username });
      const result = await mikrotikApi.connectRouter(connectionData);
      
      const updatedRouters = routers.map(r => 
        r.id === router.id 
          ? { 
              ...r, 
              status: 'online', 
              version: result.version,
              identity: result.identity,
              method: result.method
            }
          : r
      );
      setRouters(updatedRouters);

      toast({
        title: "Connection Successful",
        description: `Connected to ${router.name} via ${result.method.toUpperCase()}`,
      });
    } catch (error) {
      const updatedRouters = routers.map(r => 
        r.id === router.id ? { ...r, status: 'offline' } : r
      );
      setRouters(updatedRouters);

      const errorMessage = error instanceof Error ? error.message : "Failed to connect to router";
      console.error('Connection failed:', errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConnectingRouters(prev => {
        const newSet = new Set(prev);
        newSet.delete(router.id);
        return newSet;
      });
    }
  };

  const handleDisconnectRouter = async (router: Router) => {
    try {
      await mikrotikApi.disconnectRouter(router.id);
      
      const updatedRouters = routers.map(r => 
        r.id === router.id ? { ...r, status: 'offline' } : r
      );
      setRouters(updatedRouters);

      toast({
        title: "Disconnected",
        description: `Disconnected from ${router.name}`,
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const isConnecting = (routerId: number) => connectingRouters.has(routerId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Router Management</h2>
          <p className="text-slate-400">Manage your MikroTik router fleet with real connections</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Router
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Router</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new MikroTik router to your management fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-slate-200">Name</Label>
                <Input
                  id="name"
                  value={newRouter.name}
                  onChange={(e) => setNewRouter({...newRouter, name: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="Main Gateway"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right text-slate-200">IP Address</Label>
                <Input
                  id="ip"
                  value={newRouter.ip}
                  onChange={(e) => setNewRouter({...newRouter, ip: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right text-slate-200">Username</Label>
                <Input
                  id="username"
                  value={newRouter.username}
                  onChange={(e) => setNewRouter({...newRouter, username: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="admin"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newRouter.password}
                  onChange={(e) => setNewRouter({...newRouter, password: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleAddRouter} className="bg-blue-600 hover:bg-blue-700">
                Add Router
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Router Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Router</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update router configuration details.
            </DialogDescription>
          </DialogHeader>
          {editingRouter && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right text-slate-200">Name</Label>
                <Input
                  id="edit-name"
                  value={editingRouter.name}
                  onChange={(e) => setEditingRouter({...editingRouter, name: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ip" className="text-right text-slate-200">IP Address</Label>
                <Input
                  id="edit-ip"
                  value={editingRouter.ip}
                  onChange={(e) => setEditingRouter({...editingRouter, ip: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right text-slate-200">Username</Label>
                <Input
                  id="edit-username"
                  value={editingRouter.username || ''}
                  onChange={(e) => setEditingRouter({...editingRouter, username: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right text-slate-200">Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editingRouter.password || ''}
                  onChange={(e) => setEditingRouter({...editingRouter, password: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-600">
              Cancel
            </Button>
            <Button onClick={handleEditRouter} className="bg-blue-600 hover:bg-blue-700">
              Update Router
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        {routers.map((router) => (
          <Card key={router.id} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(router.status)}`}></div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {router.name}
                      {router.method && (
                        <Badge variant="outline" className="text-xs">
                          {router.method.toUpperCase()}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {router.ip} • RouterOS {router.version}
                      {router.identity && ` • ${router.identity}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={router.status === 'online' ? 'default' : 'destructive'}>
                    {isConnecting(router.id) ? 'Connecting...' : router.status}
                  </Badge>
                  
                  {router.status === 'offline' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectRouter(router)}
                      disabled={isConnecting(router.id)}
                      className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    >
                      {isConnecting(router.id) ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wifi className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectRouter(router)}
                      className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(router)}
                    className="border-slate-600"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRouter(router.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-white capitalize flex items-center gap-2">
                    {router.status}
                    {router.status === 'online' && router.method && (
                      <span className="text-xs text-slate-400">via {router.method.toUpperCase()}</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Version</p>
                  <p className="text-white">{router.version}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Last Backup</p>
                  <p className="text-white">{router.lastBackup}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routers.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <RouterIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Routers Added</h3>
            <p className="text-slate-400 mb-4">
              Add your first MikroTik router to start managing your network.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Router
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouterManagement;
