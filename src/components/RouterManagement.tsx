
import { useState } from 'react';
import { RouterManagementProps, Router } from "@/types/router";
import { useRouterConnection } from "@/hooks/useRouterConnection";
import AddRouterDialog from "./router/AddRouterDialog";
import EditRouterDialog from "./router/EditRouterDialog";
import RouterCard from "./router/RouterCard";
import EmptyRouterState from "./router/EmptyRouterState";

const RouterManagement = ({ routers, setRouters }: RouterManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);

  const {
    handleConnectRouter,
    handleDisconnectRouter,
    handleDeleteRouter,
    isConnecting
  } = useRouterConnection(routers, setRouters);

  const openEditDialog = (router: Router) => {
    setEditingRouter({ ...router });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingRouter(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Router Management</h2>
          <p className="text-slate-400">Manage your MikroTik router fleet with real connections</p>
        </div>
        <AddRouterDialog routers={routers} setRouters={setRouters} />
      </div>

      <EditRouterDialog
        router={editingRouter}
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        routers={routers}
        setRouters={setRouters}
      />

      <div className="grid gap-6">
        {routers.map((router) => (
          <RouterCard
            key={router.id}
            router={router}
            isConnecting={isConnecting(router.id)}
            onConnect={handleConnectRouter}
            onDisconnect={handleDisconnectRouter}
            onEdit={openEditDialog}
            onDelete={handleDeleteRouter}
          />
        ))}
      </div>

      {routers.length === 0 && (
        <EmptyRouterState onAddRouter={() => setIsAddDialogOpen(true)} />
      )}
    </div>
  );
};

export default RouterManagement;
