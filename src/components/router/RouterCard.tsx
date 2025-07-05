
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings, Trash2, Wifi, WifiOff } from "lucide-react";
import { Router } from "@/types/router";

interface RouterCardProps {
  router: Router;
  isConnecting: boolean;
  onConnect: (router: Router) => void;
  onDisconnect: (router: Router) => void;
  onEdit: (router: Router) => void;
  onDelete: (routerId: number) => void;
}

const RouterCard = ({ 
  router, 
  isConnecting, 
  onConnect, 
  onDisconnect, 
  onEdit, 
  onDelete 
}: RouterCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(router.status)}`}></div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                {router.name}
                {router.method && (
                  <Badge variant="outline" className="text-xs">
                    {router.method.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {router.ip} • RouterOS {router.version}
                {router.identity && ` • ${router.identity}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={router.status === 'online' ? 'default' : 'destructive'}>
              {isConnecting ? 'Connecting...' : router.status}
            </Badge>
            
            {router.status === 'offline' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConnect(router)}
                disabled={isConnecting}
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                Connect
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(router)}
                className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(router)}
              className="border-slate-600"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(router.id)}
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-400">Status</p>
            <p className="text-white capitalize flex items-center gap-2">
              {router.status}
              {router.status === 'online' && router.method && (
                <span className="text-xs text-slate-400">via {router.method.toUpperCase()}</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Version</p>
            <p className="text-white">{router.version}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Last Backup</p>
            <p className="text-white">{router.lastBackup}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouterCard;
