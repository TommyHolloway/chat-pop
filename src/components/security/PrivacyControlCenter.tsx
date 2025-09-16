import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, EyeOff, Clock, Globe, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface PrivacySettings {
  dataProcessingConsent: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
  dataRetentionPeriod: number;
  allowDataExport: boolean;
  enhancedAnonymization: boolean;
}

interface DataCategory {
  name: string;
  description: string;
  recordCount: number;
  lastModified: string;
  canDelete: boolean;
  gdprCategory: 'identity' | 'contact' | 'behavioral' | 'technical';
}

interface GDPRRequest {
  id: string;
  type: 'export' | 'delete' | 'rectify';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export const PrivacyControlCenter: React.FC = () => {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataProcessingConsent: true,
    analyticsOptOut: false,
    marketingOptOut: false,
    dataRetentionPeriod: 365,
    allowDataExport: true,
    enhancedAnonymization: true
  });
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
      loadDataCategories();
      loadGDPRRequests();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setPrivacySettings(prev => ({
          ...prev,
          analyticsOptOut: !data.email_notifications,
          marketingOptOut: !data.marketing_emails
        }));
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const loadDataCategories = async () => {
    if (!user) return;

    try {
      // Get data from various tables
      const [profiles, conversations, leads, visitorSessions] = await Promise.all([
        supabase.from('profiles').select('id').eq('user_id', user.id),
        supabase.from('conversations').select('id, created_at').limit(1000),
        supabase.from('leads').select('id, created_at').limit(1000),
        supabase.from('visitor_sessions').select('id, created_at').limit(1000)
      ]);

      const categories: DataCategory[] = [
        {
          name: 'Profile Information',
          description: 'Personal details, email, phone number',
          recordCount: profiles.data?.length || 0,
          lastModified: new Date().toISOString(),
          canDelete: false, // Profile can't be deleted completely
          gdprCategory: 'identity'
        },
        {
          name: 'Conversation Data',
          description: 'Chat messages and conversation history',
          recordCount: conversations.data?.length || 0,
          lastModified: conversations.data?.[0]?.created_at || new Date().toISOString(),
          canDelete: true,
          gdprCategory: 'behavioral'
        },
        {
          name: 'Lead Information',
          description: 'Captured lead data from forms',
          recordCount: leads.data?.length || 0,
          lastModified: leads.data?.[0]?.created_at || new Date().toISOString(),
          canDelete: true,
          gdprCategory: 'contact'
        },
        {
          name: 'Visitor Analytics',
          description: 'Website interaction and behavior data',
          recordCount: visitorSessions.data?.length || 0,
          lastModified: visitorSessions.data?.[0]?.created_at || new Date().toISOString(),
          canDelete: true,
          gdprCategory: 'technical'
        }
      ];

      setDataCategories(categories);
    } catch (error) {
      console.error('Failed to load data categories:', error);
    }
  };

  const loadGDPRRequests = async () => {
    if (!user) return;

    try {
      // Use activity logs to track GDPR requests
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .like('action', '%gdpr%')
        .order('created_at', { ascending: false });

      if (data) {
        const requests = data.map(log => ({
          id: log.id,
          type: 'export' as const,
          status: 'completed' as const,
          requestedAt: log.created_at,
          completedAt: log.created_at
        }));
        setGdprRequests(requests);
      }
    } catch (error) {
      console.log('GDPR requests could not be loaded:', error);
    }
  };

  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    setLoading(true);
    try {
      const updatedSettings = { ...privacySettings, ...newSettings };
      setPrivacySettings(updatedSettings);

      // Update notification preferences
      await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications: !updatedSettings.analyticsOptOut,
          marketing_emails: !updatedSettings.marketingOptOut,
          updated_at: new Date().toISOString()
        });

      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const requestDataExport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('gdpr-data-export', {
        body: { userId: user.id, requestType: 'full_export' }
      });

      if (error) throw error;

      toast.success('Data export requested. You will receive an email when ready.');
      loadGDPRRequests();
    } catch (error) {
      console.error('Failed to request data export:', error);
      toast.error('Failed to request data export');
    } finally {
      setLoading(false);
    }
  };

  const requestDataDeletion = async (category: string) => {
    if (!user) return;

    setLoading(true);
    setDeletionProgress(0);

    try {
      // Simulate progressive deletion
      const steps = ['Preparing deletion', 'Removing data', 'Updating indexes', 'Completing'];
      
      for (let i = 0; i < steps.length; i++) {
        setDeletionProgress((i + 1) * 25);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { error } = await supabase.functions.invoke('gdpr-data-deletion', {
        body: { 
          userId: user.id, 
          category: category,
          requestType: 'selective_deletion'
        }
      });

      if (error) throw error;

      toast.success(`${category} data deletion completed`);
      loadDataCategories();
      loadGDPRRequests();
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast.error('Failed to delete data');
    } finally {
      setLoading(false);
      setDeletionProgress(0);
    }
  };

  const requestAccountDeletion = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('gdpr-account-deletion', {
        body: { userId: user.id, requestType: 'full_account_deletion' }
      });

      if (error) throw error;

      toast.success('Account deletion requested. This will be processed within 30 days.');
      
      // Sign out user after requesting deletion
      setTimeout(() => {
        window.location.href = '/auth/login?message=account_deletion_requested';
      }, 3000);
    } catch (error) {
      console.error('Failed to request account deletion:', error);
      toast.error('Failed to request account deletion');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <User className="h-4 w-4" />;
      case 'contact': return <Globe className="h-4 w-4" />;
      case 'behavioral': return <Eye className="h-4 w-4" />;
      case 'technical': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Control Center
          </CardTitle>
          <CardDescription>
            Manage your privacy settings and data in compliance with GDPR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
              <TabsTrigger value="data">My Data</TabsTrigger>
              <TabsTrigger value="requests">GDPR Requests</TabsTrigger>
              <TabsTrigger value="deletion">Data Deletion</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Processing Consent</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow processing of your personal data for service functionality
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.dataProcessingConsent}
                    onCheckedChange={(checked) => 
                      updatePrivacySettings({ dataProcessingConsent: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Opt-Out</Label>
                    <p className="text-sm text-muted-foreground">
                      Opt out of analytics and usage tracking
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.analyticsOptOut}
                    onCheckedChange={(checked) => 
                      updatePrivacySettings({ analyticsOptOut: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Communications Opt-Out</Label>
                    <p className="text-sm text-muted-foreground">
                      Opt out of marketing emails and promotional content
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingOptOut}
                    onCheckedChange={(checked) => 
                      updatePrivacySettings({ marketingOptOut: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enhanced Data Anonymization</Label>
                    <p className="text-sm text-muted-foreground">
                      Use stronger anonymization for visitor and analytics data
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.enhancedAnonymization}
                    onCheckedChange={(checked) => 
                      updatePrivacySettings({ enhancedAnonymization: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Data Categories</h3>
                <div className="grid gap-4">
                  {dataCategories.map((category) => (
                    <Card key={category.name}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            {getCategoryIcon(category.gdprCategory)}
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{category.recordCount} records</span>
                                <span>Last modified: {format(new Date(category.lastModified), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={requestDataExport}
                              disabled={loading}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">GDPR Requests History</h3>
                <Button onClick={requestDataExport} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>

              {gdprRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4" />
                  <p>No GDPR requests found</p>
                  <p className="text-sm">Your requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gdprRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium capitalize">{request.type} Request</span>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Requested: {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                            {request.completedAt && (
                              <p className="text-sm text-muted-foreground">
                                Completed: {format(new Date(request.completedAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                          {request.downloadUrl && request.status === 'completed' && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={request.downloadUrl} download>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deletion" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Data Deletion Notice</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Data deletion requests are irreversible and may take up to 30 days to complete.
                  Some data may be retained for legal compliance purposes.
                </p>
              </div>

              {deletionProgress > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label>Deletion in Progress</Label>
                        <Progress value={deletionProgress} className="mt-2" />
                      </div>
                      <span className="text-sm text-muted-foreground">{deletionProgress}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {dataCategories.filter(cat => cat.canDelete && cat.recordCount > 0).map((category) => (
                  <Card key={category.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.recordCount} records</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all {category.recordCount} records in this category. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => requestDataDeletion(category.name)}
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">Delete Entire Account</h4>
                      <p className="text-sm text-red-600">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and all associated data. 
                            You will be signed out immediately and this action cannot be undone.
                            The deletion process will complete within 30 days.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={requestAccountDeletion}
                          >
                            Delete Account Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};