
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Play, History, Code, Zap, Router, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
}

interface CommandHistory {
  id: number;
  command: string;
  routerId: number;
  routerName: string;
  timestamp: string;
  status: 'success' | 'error' | 'running';
  output: string;
  method: 'ssh' | 'api';
}

interface CommandCenterProps {
  routers: Router[];
}

const CommandCenter = ({ routers }: CommandCenterProps) => {
  const [selectedRouter, setSelectedRouter] = useState<string>('');
  const [command, setCommand] = useState('');
  const [commandMethod, setCommandMethod] = useState<'ssh' | 'api'>('ssh');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([
    {
      id: 1,
      command: '/system resource print',
      routerId: 1,
      routerName: "Main Gateway",
      timestamp: "2024-06-25 10:30:15",
      status: "success",
      output: "uptime: 15d23h45m30s\nversion: 7.12\ncpu-load: 5%\nfree-memory: 128MB",
      method: "ssh"
    },
    {
      id: 2,
      command: '/ip address print',
      routerId: 2,
      routerName: "Branch Office",
      timestamp: "2024-06-25 09:15:22",
      status: "success",
      output: "0   192.168.2.1/24  ether1\n1   10.0.0.1/30     ether2",
      method: "api"
    },
    {
      id: 3,
      command: '/interface print',
      routerId: 3,
      routerName: "Remote Site",
      timestamp: "2024-06-25 08:45:10",
      status: "error",
      output: "connection timeout",
      method: "ssh"
    }
  ]);

  const { toast } = useToast();

  const commonCommands = {
    system: [
      { name: "System Resource", command: "/system resource print" },
      { name: "System Info", command: "/system routerboard print" },
      { name: "Interface List", command: "/interface print" },
      { name: "IP Addresses", command: "/ip address print" }
    ],
    network: [
      { name: "Routing Table", command: "/ip route print" },
      { name: "ARP Table", command: "/ip arp print" },
      { name: "DHCP Leases", command: "/ip dhcp-server lease print" },
      { name: "Firewall Rules", command: "/ip firewall filter print" }
    ],
    security: [
      { name: "User List", command: "/user print" },
      { name: "Active Sessions", command: "/user active print" },
      { name: "Certificate List", command: "/certificate print" },
      { name: "Address Lists", command: "/ip firewall address-list print" }
    ]
  };

  const handleExecuteCommand = () => {
    if (!selectedRouter || !command.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a router and enter a command.",
        variant: "destructive",
      });
      return;
    }

    const router = routers.find(r => r.id.toString() === selectedRouter);
    if (!router) return;

    setIsExecuting(true);

    const newCommand: CommandHistory = {
      id: Date.now(),
      command: command.trim(),
      routerId: router.id,
      routerName: router.name,
      timestamp: new Date().toLocaleString(),
      status: 'running',
      output: '',
      method: commandMethod
    };

    setCommandHistory([newCommand, ...commandHistory]);

    toast({
      title: "Executing Command",
      description: `Running command on ${router.name} via ${commandMethod.toUpperCase()}...`,
    });

    // Simulate command execution
    setTimeout(() => {
      const successScenarios = [
        "Command executed successfully",
        "uptime: 15d23h45m30s\nversion: 7.12\ncpu-load: 5%\nfree-memory: 128MB",
        "0   192.168.1.1/24  ether1\n1   10.0.0.1/30     ether2\n2   172.16.1.1/16   bridge1",
        "Flags: X - disabled, I - invalid, D - dynamic\n 0   192.168.1.0/24     ether1     0"
      ];

      const isSuccess = Math.random() > 0.2; // 80% success rate
      const output = isSuccess 
        ? successScenarios[Math.floor(Math.random() * successScenarios.length)]
        : "Error: command failed or connection timeout";

      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === newCommand.id 
          ? { ...cmd, status: isSuccess ? 'success' : 'error', output }
          : cmd
      ));

      setIsExecuting(false);
      setCommand('');

      toast({
        title: isSuccess ? "Command Completed" : "Command Failed",
        description: isSuccess ? "Command executed successfully." : "Command execution failed.",
        variant: isSuccess ? "default" : "destructive",
      });
    }, 2000);
  };

  const handleQuickCommand = (cmd: string) => {
    setCommand(cmd);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Command Center</h2>
          <p className="text-slate-400">Execute commands on your MikroTik routers via SSH or API</p>
        </div>
      </div>

      {/* Command Execution Interface */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Terminal className="h-5 w-5 mr-2" />
            Execute Command
          </CardTitle>
          <CardDescription className="text-slate-400">
            Run RouterOS commands on selected routers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Target Router</Label>
              <Select value={selectedRouter} onValueChange={setSelectedRouter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select router" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {routers.filter(r => r.status === 'online').map((router) => (
                    <SelectItem key={router.id} value={router.id.toString()} className="text-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{router.name} ({router.ip})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Execution Method</Label>
              <Select value={commandMethod} onValueChange={(value: 'ssh' | 'api') => setCommandMethod(value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="ssh" className="text-white">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>SSH (Port 22)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="api" className="text-white">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>API (Port 8728)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Command</Label>
            <div className="relative">
              <Textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="/system resource print"
                className="bg-slate-700 border-slate-600 text-white font-mono min-h-24"
              />
            </div>
          </div>

          <Button
            onClick={handleExecuteCommand}
            disabled={isExecuting || !selectedRouter || !command.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute Command'}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Commands */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Commands</CardTitle>
          <CardDescription className="text-slate-400">
            Common RouterOS commands for quick execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            {Object.entries(commonCommands).map(([category, commands]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commands.map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleQuickCommand(cmd.command)}
                      className="justify-start h-auto p-3 border-slate-600 hover:bg-slate-700"
                    >
                      <div className="text-left">
                        <div className="font-medium text-white">{cmd.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{cmd.command}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <History className="h-5 w-5 mr-2" />
            Command History
          </CardTitle>
          <CardDescription className="text-slate-400">
            Recently executed commands and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commandHistory.map((cmd) => (
              <div key={cmd.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(cmd.status)} mt-1`}></div>
                    <div>
                      <code className="text-sm text-blue-300 font-mono">{cmd.command}</code>
                      <p className="text-xs text-slate-400 mt-1">
                        {cmd.routerName} • {cmd.timestamp} • {cmd.method.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(cmd.status)}>
                    {cmd.status}
                  </Badge>
                </div>
                
                {cmd.output && (
                  <div className="mt-3 p-3 rounded bg-slate-800/50 border border-slate-600">
                    <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap overflow-x-auto">
                      {cmd.output}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandCenter;
