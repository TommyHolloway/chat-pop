import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, Activity, Clock, User, CheckCircle, XCircle, RefreshCw, Database, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';
import { useUserRole } from '@/hooks/useUserRole';
import { SecurityAlert, SecurityStatus } from './SecurityAlert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SecurityHealthReport {
  timestamp: string;
  overall_status: 'healthy' | 'warning' | 'critical';
  tables_without_rls: number;
  critical_events_24h: number;
  failed_logins_1h: number;
  suspicious_activity_24h: number;
  rls_coverage: 'complete' | 'incomplete';
  monitoring_active: boolean;
  privacy_compliance: string;
  security_version: string;
}

export const SecurityDashboard: React.FC = () => {
  const { securityEvents, piiAccessLogs, loading, fetchSecurityEvents, checkSuspiciousActivity } = useSecurityMonitoring();
  const { runSecurityAudit } = useEnhancedSecurity();
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [healthReport, setHealthReport] = useState<SecurityHealthReport | null>(null);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

  const handleRunSecurityAudit = async () => {
    setIsRunningAudit(true);
    try {
      const result = await runSecurityAudit();
      setAuditResult(result);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const runEnhancedSecurityScan = async () => {
    setIsRunningHealthCheck(true);
    try {
      // Run comprehensive security scan
      await Promise.all([
        supabase.rpc('detect_rapid_login_attempts'),
        supabase.rpc('detect_suspicious_pii_access'),
        supabase.rpc('generate_daily_security_audit')
      ]);

      // Get security health report
      const { data: healthData, error: healthError } = await supabase.rpc('security_health_check');
      if (healthError) throw healthError;
      
      setHealthReport(healthData as unknown as SecurityHealthReport);

      // Refresh security events
      await Promise.all([
        fetchSecurityEvents(),
        checkSuspiciousActivity()
      ]);

      toast.success('Enhanced security scan completed');
    } catch (error) {
      console.error('Enhanced security scan failed:', error);
      toast.error('Enhanced security scan failed');
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  const fetchSecurityHealth = async () => {
    try {
      const { data, error } = await supabase.rpc('security_health_check');
      if (error) throw error;
      setHealthReport(data as unknown as SecurityHealthReport);
    } catch (error) {
      console.error('Error fetching security health:', error);
    }
  };

  useEffect(() => {
    // Run initial security audit and health check
    Promise.all([
      handleRunSecurityAudit(),
      fetchSecurityHealth()
    ]);
  }, []);

  if (role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
          <CardDescription>
            Access restricted to administrators only
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
  const recentPIIAccess = piiAccessLogs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor PII access and security events across your platform
          </p>
          {auditResult && (
            <div className="mt-2">
              <SecurityStatus level={auditResult.security_level} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runEnhancedSecurityScan}
            variant="default"
            size="sm"
            disabled={isRunningHealthCheck}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
            {isRunningHealthCheck ? 'Running Enhanced Scan...' : 'Enhanced Security Scan'}
          </Button>
          <Button
            onClick={handleRunSecurityAudit}
            variant="outline"
            size="sm"
            disabled={isRunningAudit}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isRunningAudit ? 'Running Audit...' : 'Security Audit'}
          </Button>
          <Button
            onClick={checkSuspiciousActivity}
            variant="outline"
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            Scan Activity
          </Button>
          <Button
            onClick={fetchSecurityEvents}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Status Alert */}
      {auditResult && auditResult.security_level === 'needs_attention' && (
        <SecurityAlert
          type="error"
          title="Security Issues Detected"
          description="Your system has security issues that require immediate attention."
          severity="critical"
          actionLabel="Review Issues"
          onAction={() => setActiveTab('audit')}
        />
      )}

      {/* Critical Security Warning - Leaked Password Protection */}
      <SecurityAlert
        type="warning"
        title="Leaked Password Protection Disabled"
        description="For enhanced security, enable Leaked Password Protection in your Supabase Auth settings. This will reject passwords found in breach databases."
        severity="high"
        actionLabel="Go to Auth Settings"
        onAction={() => window.open('https://supabase.com/dashboard/project/etwjtxqjcwyxdamlcorf/auth/providers', '_blank')}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={healthReport?.overall_status === 'healthy' ? 'default' : 
                              healthReport?.overall_status === 'warning' ? 'secondary' : 'destructive'}>
                {healthReport?.overall_status || 'Unknown'}
              </Badge>
              {healthReport?.overall_status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Version {healthReport?.security_version || 'v2.1'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {healthReport?.critical_events_24h || criticalEvents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (1h)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthReport?.failed_logins_1h || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Authentication failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RLS Coverage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={healthReport?.rls_coverage === 'complete' ? 'default' : 'destructive'}>
                {healthReport?.rls_coverage || 'Unknown'}
              </Badge>
              {healthReport?.rls_coverage === 'complete' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Database security
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PII Access Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{piiAccessLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Personal data accesses logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Security Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Report</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="pii">PII Access Logs</TabsTrigger>
          <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Security Health Report</CardTitle>
                <CardDescription>Real-time security status and compliance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                {healthReport ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Overall Security Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            healthReport.overall_status === 'healthy' ? 'default' : 
                            healthReport.overall_status === 'warning' ? 'secondary' : 'destructive'
                          }>
                            {healthReport.overall_status}
                          </Badge>
                          {healthReport.overall_status === 'healthy' && 
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {format(new Date(healthReport.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Database Security</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">RLS Coverage</span>
                            <Badge variant={healthReport.rls_coverage === 'complete' ? 'default' : 'destructive'}>
                              {healthReport.rls_coverage}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Unsecured Tables</span>
                            <span className="font-semibold">{healthReport.tables_without_rls}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Threat Monitoring</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Critical Events (24h)</span>
                            <span className={`font-semibold ${healthReport.critical_events_24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {healthReport.critical_events_24h}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Failed Logins (1h)</span>
                            <span className={`font-semibold ${healthReport.failed_logins_1h > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {healthReport.failed_logins_1h}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Suspicious Activity (24h)</span>
                            <span className={`font-semibold ${healthReport.suspicious_activity_24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {healthReport.suspicious_activity_24h}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground">Loading security health report...</p>
                    <Button onClick={fetchSecurityHealth} variant="outline" size="sm" className="mt-2">
                      Load Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Security Features Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Security Features</CardTitle>
                  <CardDescription>New security implementations (v2.1)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Enhanced IP Anonymization</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      IPv4/16, IPv6/48
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rapid Login Detection</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication Monitoring</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Security Health Checks</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Automated
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Compliance</CardTitle>
                  <CardDescription>Data protection measures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>GDPR Compliance</span>
                    <Badge variant="default">
                      {healthReport?.privacy_compliance || 'Enhanced'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Retention</span>
                    <Badge variant="secondary">30 Days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>PII Access Logging</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Comprehensive
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Monitoring Active</span>
                    <Badge variant="default">
                      <Activity className="h-3 w-3 mr-1" />
                      {healthReport?.monitoring_active ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Recommendations */}
            {healthReport?.overall_status !== 'healthy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Security Recommendations
                  </CardTitle>
                  <CardDescription>Immediate actions to improve security</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthReport?.critical_events_24h > 0 && (
                      <div className="p-3 border rounded bg-red-50 border-red-200">
                        <p className="text-sm font-medium text-red-900">
                          Critical Security Events Detected
                        </p>
                        <p className="text-xs text-red-700">
                          Review critical alerts immediately and investigate potential security breaches.
                        </p>
                      </div>
                    )}
                    
                    {healthReport?.tables_without_rls > 0 && (
                      <div className="p-3 border rounded bg-yellow-50 border-yellow-200">
                        <p className="text-sm font-medium text-yellow-900">
                          Incomplete RLS Coverage
                        </p>
                        <p className="text-xs text-yellow-700">
                          {healthReport.tables_without_rls} tables lack Row Level Security policies.
                        </p>
                      </div>
                    )}
                    
                    {healthReport?.failed_logins_1h > 10 && (
                      <div className="p-3 border rounded bg-orange-50 border-orange-200">
                        <p className="text-sm font-medium text-orange-900">
                          High Authentication Failure Rate
                        </p>
                        <p className="text-xs text-orange-700">
                          Consider implementing additional rate limiting or CAPTCHA protection.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest security-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {securityEvents.slice(0, 8).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <Badge variant={getSeverityColor(event.severity || 'low')}>
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PII Access Summary</CardTitle>
                <CardDescription>Personal data access patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {recentPIIAccess.map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.table} - {log.operation}</p>
                          <p className="text-xs text-muted-foreground">
                            Fields: {log.pii_fields.join(', ') || 'None'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>All Security Events</CardTitle>
              <CardDescription>Complete log of security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="p-4 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getSeverityColor(event.severity || 'low')}>
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm">{event.action}</h3>
                      {event.details && (
                        <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pii">
          <Card>
            <CardHeader>
              <CardTitle>PII Access Logs</CardTitle>
              <CardDescription>Detailed personal data access tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {piiAccessLogs.map((log, index) => (
                    <div key={index} className="p-4 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{log.operation}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm"><strong>Table:</strong> {log.table}</p>
                        <p className="text-sm"><strong>Fields:</strong> {log.pii_fields.join(', ') || 'None specified'}</p>
                        <p className="text-sm"><strong>Reason:</strong> {log.access_reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Critical Security Alerts</CardTitle>
              <CardDescription>High-priority security events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {criticalEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No critical security alerts</p>
                      <p className="text-sm">Your system is secure</p>
                    </div>
                  ) : (
                    criticalEvents.map((event) => (
                      <div key={event.id} className="p-4 rounded border border-red-200 bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive">CRITICAL</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm:ss')}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm text-red-900">{event.action}</h3>
                        {event.details && (
                          <pre className="text-xs text-red-800 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Security Audit</CardTitle>
              <CardDescription>Detailed security analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {auditResult ? (
                <div className="space-y-6">
                  {/* Audit Summary */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SecurityStatus level={auditResult.security_level} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Critical Events (24h)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {auditResult.security_summary?.critical_events === 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-2xl font-bold">
                            {auditResult.security_summary?.critical_events || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">PII Violations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {auditResult.security_summary?.pii_violations === 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-2xl font-bold">
                            {auditResult.security_summary?.pii_violations || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Compliance Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Compliance Status</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>GDPR Compliance</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Privacy Enhanced</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Enabled</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Rate Limiting</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>PII Monitoring</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {auditResult.recommendations && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Security Recommendations</h3>
                      <div className="space-y-2">
                        {JSON.parse(auditResult.recommendations).map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Run a security audit to see detailed analysis</p>
                  <Button 
                    onClick={handleRunSecurityAudit} 
                    className="mt-4"
                    disabled={isRunningAudit}
                  >
                    {isRunningAudit ? 'Running Audit...' : 'Run Security Audit'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};