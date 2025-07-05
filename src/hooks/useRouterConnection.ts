
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { mikrotikApi, RouterConnection } from "@/services/mikrotikApi";
import { Router } from "@/types/router";

export const useRouterConnection = (routers: Router[], setRouters: (routers: Router[]) => void) => {
  const [connectingRouters, setConnectingRouters] = useState<Set<number>>(new Set());
  const { toast } = useToast();

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

  const handleDeleteRouter = async (routerId: number) => {
    try {
      const router = routers.find(r => r.id === routerId);
      
      if (router && router.status === 'online') {
        try {
          await mikrotikApi.disconnectRouter(routerId);
        } catch (disconnectError) {
          console.log('Disconnect failed, but proceeding with deletion:', disconnectError);
        }
      }
      
      setRouters(routers.filter(r => r.id !== routerId));
      toast({
        title: "Router Deleted",
        description: `${router?.name || 'Router'} has been removed from management.`,
      });
    } catch (error) {
      setRouters(routers.filter(r => r.id !== routerId));
      toast({
        title: "Router Deleted",
        description: "Router has been removed from management (connection error ignored).",
      });
    }
  };

  const isConnecting = (routerId: number) => connectingRouters.has(routerId);

  return {
    handleConnectRouter,
    handleDisconnectRouter,
    handleDeleteRouter,
    isConnecting
  };
};
