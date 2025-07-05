
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Router } from "@/types/router";

interface EditRouterDialogProps {
  router: Router | null;
  isOpen: boolean;
  onClose: () => void;
  routers: Router[];
  setRouters: (routers: Router[]) => void;
}

const EditRouterDialog = ({ router, isOpen, onClose, routers, setRouters }: EditRouterDialogProps) => {
  const [editingRouter, setEditingRouter] = useState<Router | null>(router);
  const { toast } = useToast();

  // Update local state when router prop changes
  useState(() => {
    setEditingRouter(router);
  }, [router]);

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
    onClose();

    toast({
      title: "Router Updated",
      description: `${editingRouter.name} has been updated successfully.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button variant="outline" onClick={onClose} className="border-slate-600">
            Cancel
          </Button>
          <Button onClick={handleEditRouter} className="bg-blue-600 hover:bg-blue-700">
            Update Router
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRouterDialog;
