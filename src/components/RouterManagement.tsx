
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, TestTube, Router, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
}

interface RouterManagementProps {
  routers: Router[];
  setRouters: (routers: Router[]) => void;
}

const RouterManagement = ({ routers, setRouters }: RouterManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);
  const [newRouter, setNewRouter] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
    port: '22',
    apiPort: '8728'
  });
  const { toast } = useToast();

  const handleAddRouter = () => {
    if (!newRouter.name || !newRouter.ip) {
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
      status: 'connecting',
      version: 'Unknown',
      lastBackup: 'Never'
    };

    setRouters([...routers, router]);
    setNewRouter({
      name: '',
      ip: '',
      username: '',
      password: '',
      port: '22',
      apiPort: '8728'
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Router Added",
      description: `${newRouter.name} has been added successfully.`,
    });

    // Simulate connection test
    setTimeout(() => {
      setRouters(prev => prev.map(r => 
        r.id === router.id 
          ? { ...r, status: 'online', version: '7.12' }
          : r
      ));
    }, 2000);
  };

  const handleTestConnection = (router: Router) => {
    toast({
      title: "Testing Connection",
      description: `Connecting to ${router.name}...`,
    });

    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${router.name}`,
      });
    }, 1500);
  };

  const handleDeleteRouter = (routerId: number) => {
    setRouters(routers.filter(r => r.id !== routerId));
    toast({
      title: "Router Removed",
      description: "Router has been removed from management.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Router Management</h2>
          <p className="text-slate-400">Manage your MikroTik router fleet</p>
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
              <DialogTitle className="text-white">Add New MikroTik Router</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure connection settings for a new router.
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right text-slate-200">SSH Port</Label>
                <Input
                  id="port"
                  value={newRouter.port}
                  onChange={(e) => setNewRouter({...newRouter, port: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="22"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiPort" className="text-right text-slate-200">API Port</Label>
                <Input
                  id="apiPort"
                  value={newRouter.apiPort}
                  onChange={(e) => setNewRouter({...newRouter, apiPort: e.target.value})}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="8728"
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

      <div className="grid gap-6">
        {routers.map((router) => (
          <Card key={router.id} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(router.status)}`}></div>
                  <div>
                    <CardTitle className="text-white">{router.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {router.ip} • RouterOS {router.version}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={router.status === 'online' ? 'default' : 'destructive'}>
                    {router.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(router)}
                    className="border-slate-600"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                  >
                    <Edit className="h-4 w-4" />
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
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="backup">Backup</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">IP Address</p>
                      <p className="text-white font-mono">{router.ip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">RouterOS Version</p>
                      <p className="text-white">{router.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Status</p>
                      <p className="text-white capitalize">{router.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Last Backup</p>
                      <p className="text-white">{router.lastBackup}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="security" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-green-400" />
                        <p className="text-sm text-slate-200">SSH Connection</p>
                      </div>
                      <p className="text-xs text-slate-400">Port 22 - Encrypted</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="h-4 w-4 text-blue-400" />
                        <p className="text-sm text-slate-200">API Connection</p>
                      </div>
                      <p className="text-xs text-slate-400">Port 8728 - Secure</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="backup" className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div>
                      <p className="text-sm text-slate-200">Auto Backup</p>
                      <p className="text-xs text-slate-400">Daily at 02:00 AM</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      Configure
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RouterManagement;
