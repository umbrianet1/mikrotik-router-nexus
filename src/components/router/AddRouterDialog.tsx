
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Router } from "@/types/router";

interface AddRouterDialogProps {
  routers: Router[];
  setRouters: (routers: Router[]) => void;
}

const AddRouterDialog = ({ routers, setRouters }: AddRouterDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newRouter, setNewRouter] = useState({
    name: '',
    ip: '',
    username: '',
    password: ''
  });
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
    setIsOpen(false);

    toast({
      title: "Router Added",
      description: `${newRouter.name} has been added successfully.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-slate-600">
            Cancel
          </Button>
          <Button onClick={handleAddRouter} className="bg-blue-600 hover:bg-blue-700">
            Add Router
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRouterDialog;
