
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
import { Plus, Edit, Trash2, Download, Upload, RefreshCw, Users, Search, Filter } from "lucide-react";
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
      addresses: ["192.168.1.100", "10.0.0.50", "172.16.1.25"],
      lastSync: "2024-06-25 10:30",
      dynamic: false
    },
    {
      id: 2,
      name: "VPN_Clients",
      routerId: 1,
      routerName: "Main Gateway",
      addresses: ["10.8.0.2", "10.8.0.3", "10.8.0.4", "10.8.0.5"],
      lastSync: "2024-06-25 10:30",
      dynamic: true
    },
    {
      id: 3,
      name: "Internal_Servers",
      routerId: 2,
      routerName: "Branch Office",
      addresses: ["192.168.2.10", "192.168.2.11", "192.168.2.12"],
      lastSync: "2024-06-25 09:15",
      dynamic: false
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<AddressList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouter, setSelectedRouter] = useState<string>('all');
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

  const handleSyncList = (listId: number) => {
    toast({
      title: "Synchronizing",
      description: "Syncing address list with router...",
    });

    setTimeout(() => {
      setAddressLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, lastSync: new Date().toLocaleString() }
          : list
      ));
      toast({
        title: "Sync Complete",
        description: "Address list synchronized successfully.",
      });
    }, 1500);
  };

  const handleDeleteList = (listId: number) => {
    setAddressLists(addressLists.filter(l => l.id !== listId));
    toast({
      title: "Address List Deleted",
      description: "Address list has been removed.",
    });
  };

  const handleExportList = (list: AddressList) => {
    const content = list.addresses.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name}_addresses.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${list.name} exported successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Address List Management</h2>
          <p className="text-slate-400">Manage IP address lists across your router fleet</p>
        </div>
        <div className="flex gap-2">
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

      {/* Address Lists */}
      <div className="grid gap-6">
        {filteredLists.map((list) => (
          <Card key={list.id} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">{list.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {list.routerName} • {list.addresses.length} addresses
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {list.dynamic && (
                    <Badge variant="secondary" className="bg-yellow-600">
                      Dynamic
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncList(list.id)}
                    className="border-slate-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportList(list)}
                    className="border-slate-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
                    onClick={() => handleDeleteList(list.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="addresses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger value="addresses">Addresses ({list.addresses.length})</TabsTrigger>
                  <TabsTrigger value="info">Information</TabsTrigger>
                </TabsList>
                <TabsContent value="addresses" className="space-y-4">
                  <div className="max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {list.addresses.map((address, index) => (
                        <div key={index} className="p-2 rounded bg-slate-700/30 border border-slate-600">
                          <code className="text-sm text-slate-200 font-mono">{address}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Router</p>
                      <p className="text-white">{list.routerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Addresses</p>
                      <p className="text-white">{list.addresses.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Last Sync</p>
                      <p className="text-white">{list.lastSync}</p>
                    </div>
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
