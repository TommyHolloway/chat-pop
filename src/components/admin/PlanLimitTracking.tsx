import { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingUp, Database, MessageSquare, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserUsage {
  user_id: string;
  email: string;
  display_name: string | null;
  plan: string;
  message_credits_used: number;
  storage_used_bytes: number;
  agent_count: number;
  limits: {
    message_credits: number;
    storage_bytes: number;
    agents: number;
  };
}

interface UsageStats {
  total_users: number;
  users_near_limits: number;
  total_storage_used: number;
  total_credits_used: number;
}

export function PlanLimitTracking() {
  const [userUsages, setUserUsages] = useState<UserUsage[]>([]);
  const [filteredUsages, setFilteredUsages] = useState<UserUsage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    total_users: 0,
    users_near_limits: 0,
    total_storage_used: 0,
    total_credits_used: 0,
  });

  useEffect(() => {
    fetchUsageData();
  }, []);

  useEffect(() => {
    const filtered = userUsages.filter(usage =>
      usage.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsages(filtered);
  }, [userUsages, searchTerm]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);

      // Get current month
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      // Fetch usage data and profiles separately, then join manually
      const [usageResult, profilesResult, agentResult] = await Promise.all([
        supabase
          .from('usage_tracking')
          .select('user_id, message_credits_used, storage_used_bytes')
          .eq('month', currentMonth),
        supabase
          .from('profiles')
          .select('user_id, email, display_name, plan'),
        supabase
          .from('agents')
          .select('user_id')
          .eq('status', 'active')
      ]);

      if (usageResult.error) {
        console.error('Error fetching usage data:', usageResult.error);
        throw usageResult.error;
      }

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
        throw profilesResult.error;
      }

      if (agentResult.error) {
        console.error('Error fetching agents:', agentResult.error);
        throw agentResult.error;
      }

      // Create profiles lookup map
      const profilesMap = profilesResult.data?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Count agents per user
      const agentCountMap = agentResult.data?.reduce((acc, agent) => {
        acc[agent.user_id] = (acc[agent.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process usage data by joining with profiles
      const processedUsages: UserUsage[] = usageResult.data?.map(usage => {
        const profile = profilesMap[usage.user_id];
        if (!profile) {
          console.warn(`No profile found for user_id: ${usage.user_id}`);
          return null;
        }

        const plan = profile.plan || 'free';
        
        // Define plan limits
        let limits;
        switch (plan) {
          case 'hobby':
            limits = { message_credits: 2000, storage_bytes: 5 * 1024 * 1024 * 1024, agents: 2 }; // 5GB
            break;
          case 'standard':
            limits = { message_credits: -1, storage_bytes: 50 * 1024 * 1024 * 1024, agents: 5 }; // 50GB
            break;
          default:
            limits = { message_credits: 100, storage_bytes: 1024 * 1024 * 1024, agents: 1 }; // 1GB
        }

        return {
          user_id: usage.user_id,
          email: profile.email,
          display_name: profile.display_name,
          plan,
          message_credits_used: usage.message_credits_used || 0,
          storage_used_bytes: usage.storage_used_bytes || 0,
          agent_count: agentCountMap[usage.user_id] || 0,
          limits,
        };
      }).filter(Boolean) || [];

      setUserUsages(processedUsages);

      // Calculate stats
      const usersNearLimits = processedUsages.filter(usage => 
        isNearLimit(usage.message_credits_used, usage.limits.message_credits) ||
        isNearLimit(usage.storage_used_bytes, usage.limits.storage_bytes) ||
        usage.agent_count >= usage.limits.agents
      ).length;

      const totalStorageUsed = processedUsages.reduce((sum, usage) => sum + usage.storage_used_bytes, 0);
      const totalCreditsUsed = processedUsages.reduce((sum, usage) => sum + usage.message_credits_used, 0);

      setStats({
        total_users: processedUsages.length,
        users_near_limits: usersNearLimits,
        total_storage_used: totalStorageUsed,
        total_credits_used: totalCreditsUsed,
      });

    } catch (error) {
      console.error('Error fetching usage data:', error);
      // If there's an error, at least show empty state rather than crash
      setUserUsages([]);
      setStats({
        total_users: 0,
        users_near_limits: 0,
        total_storage_used: 0,
        total_credits_used: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const isNearLimit = (current: number, limit: number, threshold = 0.8) => {
    if (limit === -1) return false; // Unlimited
    return current >= limit * threshold;
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStatusBadge = (usage: UserUsage) => {
    const creditsNearLimit = isNearLimit(usage.message_credits_used, usage.limits.message_credits);
    const storageNearLimit = isNearLimit(usage.storage_used_bytes, usage.limits.storage_bytes);
    const agentsAtLimit = usage.agent_count >= usage.limits.agents;

    if (agentsAtLimit || creditsNearLimit || storageNearLimit) {
      return <Badge variant="destructive">Near Limit</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Limits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.users_near_limits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.total_storage_used)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_credits_used.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {stats.users_near_limits > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.users_near_limits} user(s) are approaching their plan limits. Consider reaching out to offer upgrades or monitor their usage closely.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Tracking Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by email, name, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchUsageData} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message Credits</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Agents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsages.map((usage) => (
                <TableRow key={usage.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{usage.email}</div>
                      <div className="text-sm text-muted-foreground">{usage.display_name || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {usage.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(usage)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {usage.message_credits_used.toLocaleString()} / {usage.limits.message_credits === -1 ? '∞' : usage.limits.message_credits.toLocaleString()}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.message_credits_used, usage.limits.message_credits)} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {formatBytes(usage.storage_used_bytes)} / {usage.limits.storage_bytes === -1 ? '∞' : formatBytes(usage.limits.storage_bytes)}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.storage_used_bytes, usage.limits.storage_bytes)} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>{usage.agent_count} / {usage.limits.agents === -1 ? '∞' : usage.limits.agents}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No usage data found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}