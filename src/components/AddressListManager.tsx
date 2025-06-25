import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Download, Upload, RefreshCw, Users, Search, Send, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
}

interface AddressList {
  id: number;
  name: string;
  routerId: number;
  routerName: string;
  addresses: string[];
  lastSync: string;
  dynamic: boolean;
}

interface AddressListManagerProps {
  routers: Router[];
}

const AddressListManager = ({ routers }: AddressListManagerProps) => {
  const [addressLists, setAddressLists] = useState<AddressList[]>([
    {
      id: 1,
      name: "Blocked_IPs",
      routerId: 1,
      routerName: "Main Gateway",
      addresses: ["192.168.1.100", "10.0.0.50", "172.16.1.25", "192.168.1.200"],
      lastSync: "2024-06-25 10:30",
      dynamic: false
    },
    {
      id: 2,
      name: "Blocked_IPs",
      routerId: 2,
      routerName: "Branch Office",
      addresses: ["192.168.1.100", "10.0.0.50", "192.168.2.99"],
      lastSync: "2024-06-25 10:30",
      dynamic: false
    },
    {
      id: 3,
      name: "VPN_Clients",
      routerId: 1,
      routerName: "Main Gateway",
      addresses: ["10.8.0.2", "10.8.0.3", "10.8.0.4", "10.8.0.5"],
      lastSync: "2024-06-25 10:30",
      dynamic: true
    },
    {
      id: 4,
      name: "Internal_Servers",
      routerId: 2,
      routerName: "Branch Office",
      addresses: ["192.168.2.10", "192.168.2.11", "192.168.2.12"],
      lastSync: "2024-06-25 09:15",
      dynamic: false
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<AddressList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouter, setSelectedRouter] = useState<string>('all');
  const [editingAddress, setEditingAddress] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [sourceList, setSourceList] = useState<AddressList | null>(null);
  const [targetRouters, setTargetRouters] = useState<number[]>([]);
  const [newList, setNewList] = useState({
    name: '',
    routerId: '',
    addresses: '',
    dynamic: false
  });
  const { toast } = useToast();

  const filteredLists = addressLists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.addresses.some(addr => addr.includes(searchTerm));
    const matchesRouter = selectedRouter === 'all' || list.routerId.toString() === selectedRouter;
    return matchesSearch && matchesRouter;
  });

  // Group lists by name to show differences
  const groupedLists = filteredLists.reduce((acc, list) => {
    if (!acc[list.name]) {
      acc[list.name] = [];
    }
    acc[list.name].push(list);
    return acc;
  }, {} as Record<string, AddressList[]>);

  const handleAddList = () => {
    if (!newList.name || !newList.routerId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const router = routers.find(r => r.id.toString() === newList.routerId);
    const addresses = newList.addresses.split('\n').filter(addr => addr.trim());

    const list: AddressList = {
      id: Date.now(),
      name: newList.name,
      routerId: parseInt(newList.routerId),
      routerName: router?.name || 'Unknown',
      addresses,
      lastSync: new Date().toLocaleString(),
      dynamic: newList.dynamic
    };

    setAddressLists([...addressLists, list]);
    setNewList({
      name: '',
      routerId: '',
      addresses: '',
      dynamic: false
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Address List Created",
      description: `${newList.name} has been created successfully.`,
    });
  };

  const handleAddAddress = (listId: number) => {
    if (!newAddress.trim()) return;

    setAddressLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, addresses: [...list.addresses, newAddress.trim()] }
        : list
    ));
    
    setNewAddress('');
    toast({
      title: "Address Added",
      description: "New address has been added to the list.",
    });
  };

  const handleRemoveAddress = (listId: number, address: string) => {
    setAddressLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, addresses: list.addresses.filter(addr => addr !== address) }
        : list
    ));
    
    toast({
      title: "Address Removed",
      description: "Address has been removed from the list.",
    });
  };

  const handleSyncToRouters = () => {
    if (!sourceList || targetRouters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select source list and target routers.",
        variant: "destructive",
      });
      return;
    }

    targetRouters.forEach(routerId => {
      const router = routers.find(r => r.id === routerId);
      const existingList = addressLists.find(l => l.name === sourceList.name && l.routerId === routerId);
      
      if (existingList) {
        // Update existing list
        setAddressLists(prev => prev.map(list => 
          list.id === existingList.id 
            ? { ...list, addresses: [...sourceList.addresses], lastSync: new Date().toLocaleString() }
            : list
        ));
      } else {
        // Create new list
        const newList: AddressList = {
          id: Date.now() + routerId,
          name: sourceList.name,
          routerId: routerId,
          routerName: router?.name || 'Unknown',
          addresses: [...sourceList.addresses],
          lastSync: new Date().toLocaleString(),
          dynamic: sourceList.dynamic
        };
        setAddressLists(prev => [...prev, newList]);
      }
    });

    setIsSyncDialogOpen(false);
    setSourceList(null);
    setTargetRouters([]);

    toast({
      title: "Sync Complete",
      description: `Address list synchronized to ${targetRouters.length} router(s).`,
    });
  };

  const handleDeleteList = (listId: number) => {
    setAddressLists(addressLists.filter(l => l.id !== listId));
    toast({
      title: "Address List Deleted",
      description: "Address list has been removed.",
    });
  };

  const getAllAddressesForList = (listName: string) => {
    const lists = addressLists.filter(l => l.name === listName);
    const allAddresses = new Set<string>();
    lists.forEach(list => list.addresses.forEach(addr => allAddresses.add(addr)));
    return Array.from(allAddresses);
  };

  const getAddressDifferences = (listName: string, address: string) => {
    const lists = addressLists.filter(l => l.name === listName);
    const routersWithAddress = lists.filter(l => l.addresses.includes(address));
    const routersWithoutAddress = lists.filter(l => !l.addresses.includes(address));
    return { with: routersWithAddress, without: routersWithoutAddress };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Address List Management</h2>
          <p className="text-slate-400">Manage IP address lists across your router fleet</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                <Send className="h-4 w-4 mr-2" />
                Sync Lists
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Sync Address List</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select target routers to sync the address list to.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {sourceList && (
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Source: {sourceList.name}</h4>
                    <p className="text-slate-400 text-sm">From: {sourceList.routerName}</p>
                    <p className="text-slate-400 text-sm">{sourceList.addresses.length} addresses</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-slate-200 mb-2 block">Select Target Routers:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {routers.filter(r => r.status === 'online' && r.id !== sourceList?.routerId).map(router => (
                      <label key={router.id} className="flex items-center space-x-2 p-2 bg-slate-700/30 rounded border border-slate-600">
                        <input
                          type="checkbox"
                          checked={targetRouters.includes(router.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetRouters([...targetRouters, router.id]);
                            } else {
                              setTargetRouters(targetRouters.filter(id => id !== router.id));
                            }
                          }}
                          className="text-blue-600"
                        />
                        <span className="text-white text-sm">{router.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} className="border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleSyncToRouters} className="bg-green-600 hover:bg-green-700">
                  Sync to {targetRouters.length} Router(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Address List</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Create a new address list on a selected router.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="listName" className="text-right text-slate-200">Name</Label>
                  <Input
                    id="listName"
                    value={newList.name}
                    onChange={(e) => setNewList({...newList, name: e.target.value})}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Blocked_IPs"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="router" className="text-right text-slate-200">Router</Label>
                  <Select value={newList.routerId} onValueChange={(value) => setNewList({...newList, routerId: value})}>
                    <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select router" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {routers.filter(r => r.status === 'online').map((router) => (
                        <SelectItem key={router.id} value={router.id.toString()} className="text-white">
                          {router.name} ({router.ip})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="addresses" className="text-right text-slate-200 mt-2">Addresses</Label>
                  <Textarea
                    id="addresses"
                    value={newList.addresses}
                    onChange={(e) => setNewList({...newList, addresses: e.target.value})}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white min-h-32"
                    placeholder="192.168.1.100&#10;10.0.0.50&#10;172.16.1.25"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleAddList} className="bg-blue-600 hover:bg-blue-700">
                  Create List
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      {/* Address Lists with Differences */}
      <div className="grid gap-6">
        {Object.entries(groupedLists).map(([listName, lists]) => (
          <Card key={listName} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">{listName}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {lists.length} router(s) • {getAllAddressesForList(listName).length} unique addresses
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSourceList(lists[0]);
                      setIsSyncDialogOpen(true);
                    }}
                    className="border-slate-600"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Sync
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="comparison">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger value="comparison">Address Comparison</TabsTrigger>
                  <TabsTrigger value="individual">Individual Lists</TabsTrigger>
                </TabsList>
                
                <TabsContent value="comparison" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300">IP Address</TableHead>
                        {lists.map(list => (
                          <TableHead key={list.id} className="text-slate-300 text-center">
                            {list.routerName}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAllAddressesForList(listName).map(address => {
                        const differences = getAddressDifferences(listName, address);
                        return (
                          <TableRow key={address} className="border-slate-600">
                            <TableCell className="text-slate-200 font-mono text-sm">
                              {address}
                            </TableCell>
                            {lists.map(list => (
                              <TableCell key={list.id} className="text-center">
                                {list.addresses.includes(address) ? (
                                  <Check className="h-4 w-4 text-green-400 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-red-400 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="individual" className="space-y-4">
                  <div className="grid gap-4">
                    {lists.map(list => (
                      <Card key={list.id} className="bg-slate-700/30 border-slate-600">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm text-white">{list.routerName}</CardTitle>
                              <CardDescription className="text-xs text-slate-400">
                                {list.addresses.length} addresses • Last sync: {list.lastSync}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedList(list);
                                  setIsEditDialogOpen(true);
                                }}
                                className="border-slate-600 h-8"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteList(list.id)}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white h-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="max-h-32 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {list.addresses.map((address, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-600/30 border border-slate-500">
                                  <code className="text-xs text-slate-200 font-mono">{address}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAddress(list.id, address)}
                                    className="h-6 w-6 p-0 hover:bg-red-600/20"
                                  >
                                    <X className="h-3 w-3 text-red-400" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Input
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="Add new IP address"
                              className="flex-1 bg-slate-600 border-slate-500 text-white text-sm h-8"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddAddress(list.id);
                                }
                              }}
                            />
                            <Button
                              onClick={() => handleAddAddress(list.id)}
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLists.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Address Lists Found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || selectedRouter !== 'all' 
                ? "No address lists match your current filters."
                : "Get started by creating your first address list."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressListManager;
