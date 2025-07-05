
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RefreshCw, Users, Search, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mikrotikApi, AddressList } from "@/services/mikrotikApi";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
}

interface RouterAddressList {
  routerId: number;
  routerName: string;
  lists: AddressList;
  lastSync: string;
  error?: string;
}

interface AddressListManagerProps {
  routers: Router[];
}

const AddressListManager = ({ routers }: AddressListManagerProps) => {
  const [routerAddressLists, setRouterAddressLists] = useState<RouterAddressList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouter, setSelectedRouter] = useState<string>('all');
  const [newAddress, setNewAddress] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { toast } = useToast();

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    const isOnline = await mikrotikApi.testBackendConnection();
    setBackendStatus(isOnline ? 'online' : 'offline');
    
    if (!isOnline) {
      toast({
        title: "Backend Offline",
        description: "Cannot connect to MikroTik API backend. Make sure the backend server is running on port 3001.",
        variant: "destructive",
      });
    }
  };

  const loadAddressLists = async (routerId: number) => {
    const router = routers.find(r => r.id === routerId);
    if (!router || router.status !== 'online') {
      toast({
        title: "Router Not Connected",
        description: "Router must be connected to load address lists.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLists(prev => new Set([...prev, routerId]));

    try {
      console.log('Loading address lists for router:', routerId);
      const lists = await mikrotikApi.getAddressLists(routerId);
      
      const routerListData: RouterAddressList = {
        routerId,
        routerName: router.name,
        lists,
        lastSync: new Date().toLocaleString(),
      };

      setRouterAddressLists(prev => {
        const filtered = prev.filter(ral => ral.routerId !== routerId);
        return [...filtered, routerListData];
      });

      toast({
        title: "Address Lists Loaded",
        description: `Loaded ${Object.keys(lists).length} address lists from ${router.name}`,
      });
    } catch (error) {
      console.error('Error loading address lists:', error);
      
      const errorData: RouterAddressList = {
        routerId,
        routerName: router.name,
        lists: {},
        lastSync: new Date().toLocaleString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setRouterAddressLists(prev => {
        const filtered = prev.filter(ral => ral.routerId !== routerId);
        return [...filtered, errorData];
      });

      toast({
        title: "Failed to Load Address Lists",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(routerId);
        return newSet;
      });
    }
  };

  const addAddressToList = async (routerId: number, listName: string, address: string) => {
    if (!address.trim()) return;

    try {
      await mikrotikApi.addAddressToList(routerId, listName, address.trim());
      
      // Reload the address lists for this router
      await loadAddressLists(routerId);
      
      toast({
        title: "Address Added",
        description: `Added ${address} to ${listName}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Add Address",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const removeAddressFromList = async (routerId: number, listName: string, address: string) => {
    try {
      await mikrotikApi.removeAddressFromList(routerId, listName, address);
      
      // Reload the address lists for this router
      await loadAddressLists(routerId);
      
      toast({
        title: "Address Removed",
        description: `Removed ${address} from ${listName}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Remove Address",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const filteredRouterLists = routerAddressLists.filter(ral => {
    const matchesRouter = selectedRouter === 'all' || ral.routerId.toString() === selectedRouter;
    if (!matchesRouter) return false;

    if (!searchTerm) return true;

    // Search in list names and addresses
    return Object.entries(ral.lists).some(([listName, addresses]) => {
      return listName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             addresses.some(addr => addr.address.includes(searchTerm));
    });
  });

  const onlineRouters = routers.filter(r => r.status === 'online');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Address List Management</h2>
          <p className="text-slate-400">Load and manage IP address lists from connected routers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {backendStatus === 'checking' && (
              <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
            {backendStatus === 'online' && (
              <Badge variant="outline" className="border-green-600 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Backend Online
              </Badge>
            )}
            {backendStatus === 'offline' && (
              <Badge variant="outline" className="border-red-600 text-red-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Backend Offline
              </Badge>
            )}
          </div>
          <Button 
            onClick={checkBackendStatus}
            variant="outline" 
            size="sm"
            className="border-slate-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Backend
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search address lists or IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Select value={selectedRouter} onValueChange={setSelectedRouter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by router" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-white">All Routers</SelectItem>
                {routers.map((router) => (
                  <SelectItem key={router.id} value={router.id.toString()} className="text-white">
                    {router.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Online Routers - Load Address Lists */}
      {onlineRouters.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Connected Routers</CardTitle>
            <CardDescription className="text-slate-400">
              Load address lists from your connected routers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {onlineRouters.map(router => (
                <div key={router.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                  <div>
                    <p className="text-white font-medium">{router.name}</p>
                    <p className="text-slate-400 text-sm">{router.ip}</p>
                  </div>
                  <Button
                    onClick={() => loadAddressLists(router.id)}
                    disabled={isLoadingLists.has(router.id) || backendStatus !== 'online'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoadingLists.has(router.id) ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Load Lists
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Lists from Routers */}
      <div className="grid gap-6">
        {filteredRouterLists.map(routerList => (
          <Card key={routerList.routerId} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">{routerList.routerName}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {routerList.error ? (
                        <span className="text-red-400">Error: {routerList.error}</span>
                      ) : (
                        `${Object.keys(routerList.lists).length} address lists • Last sync: ${routerList.lastSync}`
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAddressLists(routerList.routerId)}
                  disabled={isLoadingLists.has(routerList.routerId)}
                  className="border-slate-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            {!routerList.error && Object.keys(routerList.lists).length > 0 && (
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(routerList.lists).map(([listName, addresses]) => (
                    <Card key={listName} className="bg-slate-700/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">{listName}</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          {addresses.length} addresses
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="max-h-40 overflow-y-auto mb-3">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-600">
                                <TableHead className="text-slate-300">Address</TableHead>
                                <TableHead className="text-slate-300">Comment</TableHead>
                                <TableHead className="text-slate-300 w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {addresses.map((addr, index) => (
                                <TableRow key={index} className="border-slate-600">
                                  <TableCell className="text-slate-200 font-mono text-sm">
                                    {addr.address}
                                  </TableCell>
                                  <TableCell className="text-slate-400 text-sm">
                                    {addr.comment || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAddressFromList(routerList.routerId, listName, addr.address)}
                                      className="h-6 w-6 p-0 hover:bg-red-600/20"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder="Add new IP address"
                            className="flex-1 bg-slate-600 border-slate-500 text-white text-sm h-8"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addAddressToList(routerList.routerId, listName, newAddress);
                                setNewAddress('');
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              addAddressToList(routerList.routerId, listName, newAddress);
                              setNewAddress('');
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 h-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* No Data State */}
      {routerAddressLists.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Address Lists Loaded</h3>
            <p className="text-slate-400 mb-4">
              {onlineRouters.length === 0 
                ? "Connect to a router first, then load its address lists."
                : "Click 'Load Lists' on a connected router to see its address lists."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressListManager;
