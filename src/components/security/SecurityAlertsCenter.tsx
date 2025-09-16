import React, { useState, useEffect } from 'react';
import { Bell, Shield, AlertTriangle, X, Settings, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

interface AlertSettings {
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
  alertEmail: string;
  discordWebhook: string;
  slackWebhook: string;
}

export const SecurityAlertsCenter: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    emailNotifications: true,
    criticalAlertsOnly: false,
    alertEmail: '',
    discordWebhook: '',
    slackWebhook: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSecurityAlerts();
      loadAlertSettings();
      setupRealTimeAlerts();
    }
  }, [user]);

  const fetchSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .or('action.like.%SECURITY_VIOLATION%,action.like.%CRITICAL%,action.like.%suspicious%')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedAlerts: SecurityAlert[] = data.map(log => ({
        id: log.id,
        type: determineSeverity(log.action),
        title: getAlertTitle(log.action),
        message: log.action,
        timestamp: log.created_at,
        acknowledged: false,
        source: (log.details as any)?.source || 'System'
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    }
  };

  const loadAlertSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setSettings({
          emailNotifications: data.email_notifications,
          criticalAlertsOnly: false,
          alertEmail: user?.email || '',
          discordWebhook: '',
          slackWebhook: ''
        });
      }
    } catch (error) {
      console.error('Failed to load alert settings:', error);
    }
  };

  const setupRealTimeAlerts = () => {
    if (!user) return;

    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newLog = payload.new as any;
          if (newLog.action.includes('SECURITY_VIOLATION') || 
              newLog.action.includes('CRITICAL') || 
              newLog.action.includes('suspicious')) {
            
            const newAlert: SecurityAlert = {
              id: newLog.id,
              type: determineSeverity(newLog.action),
              title: getAlertTitle(newLog.action),
              message: newLog.action,
              timestamp: newLog.created_at,
              acknowledged: false,
              source: newLog.details?.source || 'System'
            };

            setAlerts(prev => [newAlert, ...prev]);
            showRealTimeAlert(newAlert);
            
            if (settings.emailNotifications) {
              sendEmailAlert(newAlert);
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const showRealTimeAlert = (alert: SecurityAlert) => {
    const toastFn = alert.type === 'critical' ? toast.error : 
                    alert.type === 'high' ? toast.error : 
                    alert.type === 'medium' ? toast.warning : toast.info;

    toastFn(`Security Alert: ${alert.title}`, {
      description: alert.message,
      duration: alert.type === 'critical' ? 0 : 5000,
      action: {
        label: 'View Details',
        onClick: () => acknowledgeAlert(alert.id)
      }
    });
  };

  const sendEmailAlert = async (alert: SecurityAlert) => {
    if (!settings.criticalAlertsOnly || alert.type === 'critical') {
      try {
        await supabase.functions.invoke('send-security-alert', {
          body: {
            to: settings.alertEmail || user?.email,
            alert: alert,
            discordWebhook: settings.discordWebhook,
            slackWebhook: settings.slackWebhook
          }
        });
      } catch (error) {
        console.error('Failed to send security alert:', error);
      }
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    
    toast.success('Alert acknowledged');
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications: settings.emailNotifications,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Alert settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const determineSeverity = (action: string): 'critical' | 'high' | 'medium' | 'low' => {
    if (action.includes('CRITICAL') || action.includes('breach')) return 'critical';
    if (action.includes('VIOLATION') || action.includes('suspicious')) return 'high';
    if (action.includes('WARN') || action.includes('unusual')) return 'medium';
    return 'low';
  };

  const getAlertTitle = (action: string): string => {
    if (action.includes('suspicious_pii_access')) return 'Suspicious PII Access';
    if (action.includes('rate_limit_exceeded')) return 'Rate Limit Exceeded';
    if (action.includes('unauthorized_access')) return 'Unauthorized Access Attempt';
    if (action.includes('data_breach')) return 'Potential Data Breach';
    return 'Security Event';
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Security Alerts Center
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive">
                {unacknowledgedAlerts.length} New
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time security alerts and notification management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alert Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Alert Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="critical-only">Critical Alerts Only</Label>
                <Switch
                  id="critical-only"
                  checked={settings.criticalAlertsOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, criticalAlertsOnly: checked }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-email">Alert Email</Label>
                <Input
                  id="alert-email"
                  type="email"
                  value={settings.alertEmail}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, alertEmail: e.target.value }))
                  }
                  placeholder="security@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                <Input
                  id="discord-webhook"
                  value={settings.discordWebhook}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, discordWebhook: e.target.value }))
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
            </div>
            <Button onClick={saveSettings} disabled={loading} className="mt-4">
              <Mail className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>

          {/* Active Alerts */}
          <div className="space-y-3">
            <h3 className="font-semibold">Active Alerts</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No security alerts</p>
                <p className="text-sm">Your system is secure</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded border ${
                    alert.acknowledged ? 'opacity-60' : ''
                  } ${alert.type === 'critical' ? 'border-red-500 bg-red-50' : 
                     alert.type === 'high' ? 'border-orange-500 bg-orange-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(alert.type)}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {alert.source}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.type === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};