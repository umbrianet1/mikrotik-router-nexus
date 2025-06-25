
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Database, Bell, Users, Key, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    appName: "MikroTik Manager",
    defaultTimeout: "30",
    maxConcurrentConnections: "5",
    logLevel: "info",
    
    // Security Settings
    sessionTimeout: "8",
    enableTwoFactor: false,
    passwordPolicy: "strong",
    enableAuditLog: true,
    
    // Backup Settings
    backupRetention: "30",
    backupCompression: true,
    backupEncryption: false,
    backupLocation: "/var/backups/mikrotik",
    
    // Notifications
    enableEmailNotifications: true,
    emailServer: "smtp.example.com",
    emailPort: "587",
    emailUsername: "admin@example.com",
    enableSlackNotifications: false,
    slackWebhook: ""
  });

  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    });
  };

  const handleExportSettings = () => {
    const configData = JSON.stringify(settings, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mikrotik-manager-config.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Configuration file has been downloaded.",
    });
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target?.result as string);
            setSettings(config);
            toast({
              title: "Settings Imported",
              description: "Configuration has been loaded successfully.",
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Invalid configuration file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">System Settings</h2>
          <p className="text-slate-400">Configure application settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportSettings} className="border-slate-600">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportSettings} className="border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-blue-600">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Basic application configuration and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appName" className="text-slate-200">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) => setSettings({...settings, appName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTimeout" className="text-slate-200">Default Timeout (seconds)</Label>
                  <Input
                    id="defaultTimeout"
                    type="number"
                    value={settings.defaultTimeout}
                    onChange={(e) => setSettings({...settings, defaultTimeout: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConnections" className="text-slate-200">Max Concurrent Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={settings.maxConcurrentConnections}
                    onChange={(e) => setSettings({...settings, maxConcurrentConnections: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logLevel" className="text-slate-200">Log Level</Label>
                  <Select value={settings.logLevel} onValueChange={(value) => setSettings({...settings, logLevel: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="debug" className="text-white">Debug</SelectItem>
                      <SelectItem value="info" className="text-white">Info</SelectItem>
                      <SelectItem value="warning" className="text-white">Warning</SelectItem>
                      <SelectItem value="error" className="text-white">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Authentication and access control configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-slate-200">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy" className="text-slate-200">Password Policy</Label>
                  <Select value={settings.passwordPolicy} onValueChange={(value) => setSettings({...settings, passwordPolicy: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="basic" className="text-white">Basic (8+ chars)</SelectItem>
                      <SelectItem value="strong" className="text-white">Strong (12+ chars, mixed case, numbers)</SelectItem>
                      <SelectItem value="complex" className="text-white">Complex (16+ chars, symbols required)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-400">Enable TOTP-based 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => setSettings({...settings, enableTwoFactor: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">Audit Logging</Label>
                    <p className="text-sm text-slate-400">Log all user actions and system events</p>
                  </div>
                  <Switch
                    checked={settings.enableAuditLog}
                    onCheckedChange={(checked) => setSettings({...settings, enableAuditLog: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Backup Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure backup storage and retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupRetention" className="text-slate-200">Retention Period (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => setSettings({...settings, backupRetention: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupLocation" className="text-slate-200">Backup Location</Label>
                  <Input
                    id="backupLocation"
                    value={settings.backupLocation}
                    onChange={(e) => setSettings({...settings, backupLocation: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">Backup Compression</Label>
                    <p className="text-sm text-slate-400">Compress backup files to save storage space</p>
                  </div>
                  <Switch
                    checked={settings.backupCompression}
                    onCheckedChange={(checked) => setSettings({...settings, backupCompression: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">Backup Encryption</Label>
                    <p className="text-sm text-slate-400">Encrypt backup files for additional security</p>
                  </div>
                  <Switch
                    checked={settings.backupEncryption}
                    onCheckedChange={(checked) => setSettings({...settings, backupEncryption: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Email Notifications</CardTitle>
              <CardDescription className="text-slate-400">
                Configure email alerts for system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Enable Email Notifications</Label>
                  <p className="text-sm text-slate-400">Send email alerts for critical events</p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, enableEmailNotifications: checked})}
                />
              </div>

              {settings.enableEmailNotifications && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailServer" className="text-slate-200">SMTP Server</Label>
                    <Input
                      id="emailServer"
                      value={settings.emailServer}
                      onChange={(e) => setSettings({...settings, emailServer: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailPort" className="text-slate-200">SMTP Port</Label>
                    <Input
                      id="emailPort"
                      value={settings.emailPort}
                      onChange={(e) => setSettings({...settings, emailPort: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emailUsername" className="text-slate-200">Email Username</Label>
                    <Input
                      id="emailUsername"
                      type="email"
                      value={settings.emailUsername}
                      onChange={(e) => setSettings({...settings, emailUsername: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Slack Notifications</CardTitle>
              <CardDescription className="text-slate-400">
                Configure Slack integration for team notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Enable Slack Notifications</Label>
                  <p className="text-sm text-slate-400">Send alerts to Slack channels</p>
                </div>
                <Switch
                  checked={settings.enableSlackNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, enableSlackNotifications: checked})}
                />
              </div>

              {settings.enableSlackNotifications && (
                <div className="space-y-2">
                  <Label htmlFor="slackWebhook" className="text-slate-200">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    value={settings.slackWebhook}
                    onChange={(e) => setSettings({...settings, slackWebhook: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
