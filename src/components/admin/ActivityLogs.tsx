import { useState, useEffect } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email: string | null;
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, actionFilter]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user emails separately
      const userIds = [...new Set(data?.map(log => log.user_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile.email;
        return acc;
      }, {} as Record<string, string>) || {};

      const formattedLogs = data?.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ip_address: log.ip_address as string | null,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_email: log.user_id ? profileMap[log.user_id] || null : null,
      })) || [];

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'user_profile_updated':
        return 'default';
      case 'role_updated':
        return 'secondary';
      case 'user_login':
        return 'outline';
      case 'user_signup':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatActionDetails = (action: string, details: any) => {
    switch (action) {
      case 'user_profile_updated':
        return `Updated profile for ${details.target_user_email}`;
      case 'role_updated':
        return `Changed role to ${details.new_role} for ${details.target_user_email}`;
      case 'user_login':
        return `User logged in`;
      case 'user_signup':
        return `New user registered`;
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search activity logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={fetchActivityLogs} variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant={getActionBadgeColor(log.action)}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {log.user_email || 'System'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {formatActionDetails(log.action, log.details)}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {log.ip_address || '-'}
                  </code>
                </TableCell>
                <TableCell>
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No activity logs found matching your criteria.
        </div>
      )}
    </div>
  );
}