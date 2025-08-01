import { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, User } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
}

interface RoleStats {
  admin: number;
  user: number;
  total: number;
}

export function RoleManagement() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState<RoleStats>({ admin: 0, user: 0, total: 0 });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  useEffect(() => {
    const filtered = userRoles.filter(userRole =>
      userRole.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userRole.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userRole.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [userRoles, searchTerm]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      // Get auth users data first using the admin function
      let authData = null;
      try {
        const { data, error } = await supabase.functions.invoke('get-users-admin', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });
        if (error) {
          console.error('Auth function error:', error);
        } else {
          authData = data;
        }
      } catch (authError) {
        console.warn('Could not fetch auth data:', authError);
      }

      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          display_name,
          user_roles (
            role
          )
        `);

      if (profilesError) throw profilesError;

      // If we have auth data, merge it with profiles; otherwise use profiles only
      let formattedRoles: UserRole[];
      
      if (authData?.users) {
        // Merge auth data with profiles
        formattedRoles = authData.users.map((authUser: any) => {
          const profile = profiles?.find(p => p.user_id === authUser.id);
          return {
            user_id: authUser.id,
            email: authUser.email || profile?.email || '',
            display_name: profile?.display_name || null,
            role: (profile?.user_roles as any)?.[0]?.role || 'user',
          };
        });
      } else {
        // Fallback to profiles only
        formattedRoles = profiles?.map(profile => ({
          user_id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name,
          role: (profile.user_roles as any)?.[0]?.role || 'user',
        })) || [];
      }

      setUserRoles(formattedRoles);

      // Calculate stats
      const adminCount = formattedRoles.filter(r => r.role === 'admin').length;
      const userCount = formattedRoles.filter(r => r.role === 'user').length;
      setStats({
        admin: adminCount,
        user: userCount,
        total: formattedRoles.length,
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      // Delete existing role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role (even for 'user' role for consistency)
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as 'admin' | 'user',
        });

      if (error) throw error;

      // Log the action
      const userEmail = userRoles.find(u => u.user_id === userId)?.email;
      try {
        await supabase.functions.invoke('log-admin-action', {
          body: {
            action: 'role_updated',
            details: {
              target_user_id: userId,
              target_user_email: userEmail,
              new_role: newRole,
            },
          },
        });
      } catch (logError) {
        console.warn('Failed to log admin action:', logError);
        // Don't fail the entire operation if logging fails
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />;
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
      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.user}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Management Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by email, name, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchUserRoles} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="w-[200px]">Update Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((userRole) => (
                <TableRow key={userRole.user_id}>
                  <TableCell className="font-medium">{userRole.email}</TableCell>
                  <TableCell>{userRole.display_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={userRole.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(userRole.role)}
                      <span className="capitalize">{userRole.role}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={userRole.role}
                      onValueChange={(value) => updateUserRole(userRole.user_id, value)}
                      disabled={updating === userRole.user_id}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}