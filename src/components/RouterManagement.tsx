
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, Router as RouterIcon, Settings } from "lucide-react";
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
  const [newRouter, setNewRouter] = useState({
    name: '',
    ip: '',
    username: '',
    password: ''
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

  const handleDeleteRouter = (routerId: number) => {
    setRouters(routers.filter(r => r.id !== routerId));
    toast({
      title: "Router Deleted",
      description: "Router has been removed from management.",
    });
  };

  const handleRefreshRouter = (routerId: number) => {
    toast({
      title: "Connecting",
      description: "Checking router status...",
    });

    setTimeout(() => {
      const updatedRouters = routers.map(router => 
        router.id === routerId 
          ? { ...router, status: Math.random() > 0.5 ? 'online' : 'offline', version: '7.12' }
          : router
      );
      setRouters(updatedRouters);
      toast({
        title: "Status Updated",
        description: "Router status has been refreshed.",
      });
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
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
                    onClick={() => handleRefreshRouter(router.id)}
                    className="border-slate-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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
                  <p className="text-white capitalize">{router.status}</p>
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
