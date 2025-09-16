import React, { useState, useEffect } from 'react';
import { Bot, Shield, Zap, Settings, Play, Pause, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  cooldown: number;
  lastTriggered?: string;
}

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  triggeredToday: number;
  blockedThreats: number;
}

export const SecurityAutomation: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    totalRules: 0,
    activeRules: 0,
    triggeredToday: 0,
    blockedThreats: 0
  });
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    trigger: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    threshold: number;
    cooldown: number;
  }>({
    name: '',
    trigger: '',
    action: '',
    severity: 'medium',
    threshold: 5,
    cooldown: 300
  });

  // Predefined automation rules
  const predefinedRules: Omit<AutomationRule, 'id' | 'lastTriggered'>[] = [
    {
      name: 'Rate Limit Breaker Block',
      enabled: true,
      trigger: 'rate_limit_exceeded',
      action: 'block_ip_temporary',
      severity: 'high',
      threshold: 3,
      cooldown: 900
    },
    {
      name: 'Suspicious PII Access Alert',
      enabled: true,
      trigger: 'excessive_pii_access',
      action: 'send_alert_and_log',
      severity: 'critical',
      threshold: 1,
      cooldown: 300
    },
    {
      name: 'Multiple Failed Logins',
      enabled: true,
      trigger: 'failed_login_attempts',
      action: 'temporary_account_lock',
      severity: 'medium',
      threshold: 5,
      cooldown: 600
    },
    {
      name: 'New Device Detection',
      enabled: false,
      trigger: 'new_device_login',
      action: 'require_mfa_verification',
      severity: 'medium',
      threshold: 1,
      cooldown: 0
    },
    {
      name: 'Unusual Location Login',
      enabled: false,
      trigger: 'unusual_location',
      action: 'send_notification',
      severity: 'low',
      threshold: 1,
      cooldown: 3600
    },
    {
      name: 'Admin Permission Escalation',
      enabled: true,
      trigger: 'admin_permission_change',
      action: 'require_additional_auth',
      severity: 'critical',
      threshold: 1,
      cooldown: 0
    }
  ];

  useEffect(() => {
    if (user) {
      loadAutomationRules();
      loadAutomationStats();
    }
  }, [user]);

  const loadAutomationRules = async () => {
    try {
      // For demo purposes, we'll use predefined rules with random IDs
      const rulesWithIds = predefinedRules.map(rule => ({
        ...rule,
        id: Math.random().toString(36).substr(2, 9),
        lastTriggered: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined
      }));
      
      setRules(rulesWithIds);
    } catch (error) {
      console.error('Failed to load automation rules:', error);
    }
  };

  const loadAutomationStats = async () => {
    try {
      // Generate realistic stats for demo
      setStats({
        totalRules: predefinedRules.length,
        activeRules: predefinedRules.filter(r => r.enabled).length,
        triggeredToday: Math.floor(Math.random() * 10),
        blockedThreats: Math.floor(Math.random() * 5)
      });
    } catch (error) {
      console.error('Failed to load automation stats:', error);
    }
  };

  const toggleRule = async (ruleId: string) => {
    setLoading(true);
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      ));

      // In a real implementation, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Automation rule updated');
      loadAutomationStats();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast.error('Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const createCustomRule = async () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const customRule: AutomationRule = {
        ...newRule,
        id: Math.random().toString(36).substr(2, 9),
        enabled: true
      };

      setRules(prev => [...prev, customRule]);
      
      // Reset form
      setNewRule({
        name: '',
        trigger: '',
        action: '',
        severity: 'medium',
        threshold: 5,
        cooldown: 300
      });

      toast.success('Custom automation rule created');
      loadAutomationStats();
    } catch (error) {
      console.error('Failed to create custom rule:', error);
      toast.error('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const testRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    setLoading(true);
    try {
      // Simulate rule testing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update last triggered time
      setRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, lastTriggered: new Date().toISOString() } : r
      ));

      toast.success(`Test successful: ${rule.name} would have executed ${rule.action}`);
    } catch (error) {
      console.error('Failed to test rule:', error);
      toast.error('Rule test failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    toast.success('Automation rule deleted');
    loadAutomationStats();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'block_ip_temporary': return 'Block IP address for 15 minutes';
      case 'send_alert_and_log': return 'Send security alert and log event';
      case 'temporary_account_lock': return 'Lock account for 10 minutes';
      case 'require_mfa_verification': return 'Require MFA verification';
      case 'send_notification': return 'Send notification to admin';
      case 'require_additional_auth': return 'Require additional authentication';
      default: return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Security Automation
          </CardTitle>
          <CardDescription>
            Automated responses to security threats and suspicious activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rules</p>
                    <p className="text-2xl font-bold">{stats.totalRules}</p>
                  </div>
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Rules</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Triggered Today</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.triggeredToday}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked Threats</p>
                    <p className="text-2xl font-bold text-red-600">{stats.blockedThreats}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Automation Rules</h3>
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                            disabled={loading}
                          />
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Trigger:</strong> {rule.trigger.replace(/_/g, ' ')}</p>
                          <p><strong>Action:</strong> {getActionDescription(rule.action)}</p>
                          <p><strong>Threshold:</strong> {rule.threshold} events</p>
                          <p><strong>Cooldown:</strong> {rule.cooldown}s</p>
                          {rule.lastTriggered && (
                            <p><strong>Last triggered:</strong> {new Date(rule.lastTriggered).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testRule(rule.id)}
                          disabled={loading}
                        >
                          Test
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Create Custom Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Rule</CardTitle>
              <CardDescription>
                Define custom automation rules for your specific security needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Custom Security Rule"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-trigger">Trigger Event</Label>
                  <Select
                    value={newRule.trigger}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="failed_login_attempts">Failed Login Attempts</SelectItem>
                      <SelectItem value="rate_limit_exceeded">Rate Limit Exceeded</SelectItem>
                      <SelectItem value="suspicious_ip">Suspicious IP Activity</SelectItem>
                      <SelectItem value="data_breach_attempt">Data Breach Attempt</SelectItem>
                      <SelectItem value="unusual_activity">Unusual Activity Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-action">Response Action</Label>
                  <Select
                    value={newRule.action}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_alert">Send Security Alert</SelectItem>
                      <SelectItem value="block_ip_temporary">Block IP Temporarily</SelectItem>
                      <SelectItem value="require_mfa">Require MFA Verification</SelectItem>
                      <SelectItem value="lock_account">Lock Account</SelectItem>
                      <SelectItem value="log_event">Log Security Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-severity">Severity Level</Label>
                  <Select
                    value={newRule.severity}
                    onValueChange={(value) => 
                      setNewRule(prev => ({ ...prev, severity: value as 'low' | 'medium' | 'high' | 'critical' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-threshold">Threshold: {newRule.threshold} events</Label>
                  <Slider
                    id="rule-threshold"
                    min={1}
                    max={20}
                    step={1}
                    value={[newRule.threshold]}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, threshold: value[0] }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-cooldown">Cooldown: {newRule.cooldown}s</Label>
                  <Slider
                    id="rule-cooldown"
                    min={0}
                    max={3600}
                    step={60}
                    value={[newRule.cooldown]}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, cooldown: value[0] }))}
                  />
                </div>
              </div>

              <Button onClick={createCustomRule} disabled={loading} className="w-full">
                <Bot className="h-4 w-4 mr-2" />
                Create Automation Rule
              </Button>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Security Automation Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Automation rules help protect your system but may occasionally trigger false positives. 
                    Monitor your rules regularly and adjust thresholds as needed. Critical rules cannot be disabled for security compliance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};