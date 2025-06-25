
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Calendar, Clock, Database, Play, Pause, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
}

interface Backup {
  id: number;
  routerId: number;
  routerName: string;
  filename: string;
  size: string;
  date: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'running';
}

interface BackupSchedulerProps {
  routers: Router[];
}

const BackupScheduler = ({ routers }: BackupSchedulerProps) => {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: 1,
      routerId: 1,
      routerName: "Main Gateway",
      filename: "main-gateway-20240625-1030.backup",
      size: "2.3 MB",
      date: "2024-06-25 10:30",
      type: "automatic",
      status: "completed"
    },
    {
      id: 2,
      routerId: 2,
      routerName: "Branch Office",
      filename: "branch-office-20240625-0915.backup",
      size: "1.8 MB",
      date: "2024-06-25 09:15",
      type: "automatic",
      status: "completed"
    },
    {
      id: 3,
      routerId: 3,
      routerName: "Remote Site",
      filename: "remote-site-20240624-2200.backup",
      size: "1.5 MB",
      date: "2024-06-24 22:00",
      type: "automatic",
      status: "failed"
    }
  ]);

  const [schedule, setSchedule] = useState({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retention: '30'
  });

  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const { toast } = useToast();

  const handleManualBackup = (routerId?: number) => {
    setIsRunningBackup(true);
    setBackupProgress(0);

    const routersToBackup = routerId ? routers.filter(r => r.id === routerId) : routers.filter(r => r.status === 'online');
    
    toast({
      title: "Backup Started",
      description: `Starting backup for ${routersToBackup.length} router(s)...`,
    });

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunningBackup(false);
          
          // Add new backup entries
          const newBackups = routersToBackup.map((router, index) => ({
            id: Date.now() + index,
            routerId: router.id,
            routerName: router.name,
            filename: `${router.name.toLowerCase().replace(' ', '-')}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.backup`,
            size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
            date: new Date().toLocaleString(),
            type: 'manual' as const,
            status: 'completed' as const
          }));

          setBackups(prev => [...newBackups, ...prev]);
          
          toast({
            title: "Backup Complete",
            description: `Successfully backed up ${routersToBackup.length} router(s).`,
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDownloadBackup = (backup: Backup) => {
    toast({
      title: "Download Started",
      description: `Downloading ${backup.filename}...`,
    });
    
    // Simulate download
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: "Backup file has been downloaded successfully.",
      });
    }, 1000);
  };

  const handleUpdateSchedule = () => {
    toast({
      title: "Schedule Updated",
      description: "Backup schedule has been updated successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Backup Management</h2>
          <p className="text-slate-400">Automated and manual backup scheduling for your router fleet</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleManualBackup()}
            disabled={isRunningBackup}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Database className="h-4 w-4 mr-2" />
            {isRunningBackup ? 'Backing Up...' : 'Backup All'}
          </Button>
        </div>
      </div>

      {/* Backup Progress */}
      {isRunningBackup && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Backup in Progress</h3>
                <Badge variant="secondary">{backupProgress}%</Badge>
              </div>
              <Progress value={backupProgress} className="h-2" />
              <p className="text-sm text-slate-400">
                Creating backup files for selected routers...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Backup Schedule
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure automatic backup scheduling for your routers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={schedule.enabled}
                onCheckedChange={(enabled) => setSchedule({...schedule, enabled})}
              />
              <Label className="text-slate-200">Enable Automatic Backups</Label>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-200">Frequency</Label>
              <Select value={schedule.frequency} onValueChange={(frequency) => setSchedule({...schedule, frequency})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="daily" className="text-white">Daily</SelectItem>
                  <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                  <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Time</Label>
              <Input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule({...schedule, time: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Retention (days)</Label>
              <Input
                type="number"
                value={schedule.retention}
                onChange={(e) => setSchedule({...schedule, retention: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="30"
              />
            </div>
          </div>

          <Button onClick={handleUpdateSchedule} className="bg-blue-600 hover:bg-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            Update Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Backup Actions</CardTitle>
          <CardDescription className="text-slate-400">
            Perform manual backups for individual routers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routers.filter(r => r.status === 'online').map((router) => (
              <div key={router.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{router.name}</h3>
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    Online
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-3">{router.ip}</p>
                <Button
                  size="sm"
                  onClick={() => handleManualBackup(router.id)}
                  disabled={isRunningBackup}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Backup History</CardTitle>
          <CardDescription className="text-slate-400">
            Recent backup files and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(backup.status)}`}></div>
                  <div>
                    <h3 className="text-white font-medium">{backup.filename}</h3>
                    <p className="text-sm text-slate-400">
                      {backup.routerName} • {backup.size} • {backup.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusVariant(backup.status)} className={backup.type === 'manual' ? 'border-blue-500' : ''}>
                    {backup.status}
                  </Badge>
                  <Badge variant="outline" className="border-slate-500">
                    {backup.type}
                  </Badge>
                  {backup.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup)}
                      className="border-slate-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupScheduler;
