
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Router, Shield, Database, Activity, Plus, Settings, Users, History, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RouterManagement from "@/components/RouterManagement";
import AddressListManager from "@/components/AddressListManager";
import BackupScheduler from "@/components/BackupScheduler";
import CommandCenter from "@/components/CommandCenter";
import SystemSettings from "@/components/SystemSettings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [routers, setRouters] = useState([
    { id: 1, name: "Main Gateway", ip: "192.168.1.1", status: "online", version: "7.12", lastBackup: "2024-06-25 10:30" },
    { id: 2, name: "Branch Office", ip: "192.168.2.1", status: "online", version: "7.11", lastBackup: "2024-06-25 09:15" },
    { id: 3, name: "Remote Site", ip: "10.0.0.1", status: "offline", version: "7.10", lastBackup: "2024-06-24 22:00" }
  ]);
  const [stats, setStats] = useState({
    totalRouters: 3,
    onlineRouters: 2,
    totalAddressLists: 147,
    lastSyncTime: "2024-06-25 10:45:32"
  });
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const handleRefreshAll = () => {
    toast({
      title: "Refreshing Status",
      description: "Updating router status and address lists...",
    });
    // Simulate refresh
    setTimeout(() => {
      toast({
        title: "Refresh Complete",
        description: "All router data has been updated successfully.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Router className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MikroTik Manager</h1>
                <p className="text-sm text-slate-400">Centralized Router Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleRefreshAll} variant="outline" size="sm" className="border-slate-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
              <div className="text-right">
                <p className="text-sm text-white">Admin User</p>
                <p className="text-xs text-slate-400">Last login: Today 09:30</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="routers" className="data-[state=active]:bg-blue-600">
              <Router className="h-4 w-4 mr-2" />
              Routers
            </TabsTrigger>
            <TabsTrigger value="addresslists" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Address Lists
            </TabsTrigger>
            <TabsTrigger value="backups" className="data-[state=active]:bg-blue-600">
              <Database className="h-4 w-4 mr-2" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="commands" className="data-[state=active]:bg-blue-600">
              <Shield className="h-4 w-4 mr-2" />
              Commands
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Total Routers</CardTitle>
                  <Router className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalRouters}</div>
                  <p className="text-xs text-slate-400">
                    {stats.onlineRouters} online, {stats.totalRouters - stats.onlineRouters} offline
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Network Health</CardTitle>
                  <Activity className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((stats.onlineRouters / stats.totalRouters) * 100)}%
                  </div>
                  <Progress 
                    value={(stats.onlineRouters / stats.totalRouters) * 100} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Address Lists</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalAddressLists}</div>
                  <p className="text-xs text-slate-400">Across all routers</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Last Sync</CardTitle>
                  <History className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold text-white">{stats.lastSyncTime.split(' ')[1]}</div>
                  <p className="text-xs text-slate-400">{stats.lastSyncTime.split(' ')[0]}</p>
                </CardContent>
              </Card>
            </div>

            {/* Router Status Overview */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Router Status Overview</CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time status of all managed MikroTik routers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routers.map((router) => (
                    <div key={router.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(router.status)}`}></div>
                        <div>
                          <h3 className="text-white font-medium">{router.name}</h3>
                          <p className="text-sm text-slate-400">{router.ip} • RouterOS {router.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={router.status === 'online' ? 'default' : 'destructive'}>
                          {router.status}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-slate-300">Last backup</p>
                          <p className="text-xs text-slate-400">{router.lastBackup}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routers">
            <RouterManagement routers={routers} setRouters={setRouters} />
          </TabsContent>

          <TabsContent value="addresslists">
            <AddressListManager routers={routers} />
          </TabsContent>

          <TabsContent value="backups">
            <BackupScheduler routers={routers} />
          </TabsContent>

          <TabsContent value="commands">
            <CommandCenter routers={routers} />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
