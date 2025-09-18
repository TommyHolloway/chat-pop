import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  plan: string;
  display_name: string | null;
  role: string;
}

export const useUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try the normal query first
      let profiles = null;
      let profilesError = null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            user_id,
            email,
            display_name,
            plan,
            created_at,
            updated_at,
            user_roles (
              role
            )
          `);
        profiles = data;
        profilesError = error;
      } catch (rlsError) {
        console.warn('RLS policy error, trying fallback query:', rlsError);
        
        // Fallback: Try a simpler query without complex RLS functions
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              user_id,
              email,
              display_name,
              plan,
              created_at,
              updated_at
            `);
          
          // Get roles separately
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('user_id, role');
          
          profiles = data?.map(profile => ({
            ...profile,
            user_roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
          }));
          profilesError = error;
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          profilesError = fallbackError;
        }
      }

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get auth data for additional info (with better error handling)
      let authData = null;
      try {
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
          const { data, error } = await supabase.functions.invoke('get-users-admin', {
            headers: {
              Authorization: `Bearer ${session.data.session.access_token}`,
            },
          });
          if (error) {
            console.error('Auth function error:', error);
          } else {
            authData = data;
          }
        }
      } catch (authError) {
        console.warn('Could not fetch auth data:', authError);
        // Continue without auth data - we'll show what we can
      }

      // Combine the data
      const combinedUsers = profiles?.map(profile => {
        const authUser = authData?.users?.find((u: any) => u.id === profile.user_id);
        const userRoles = Array.isArray(profile.user_roles) ? profile.user_roles : [];
        
        return {
          id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name,
          plan: profile.plan || 'free',
          role: userRoles?.[0]?.role || 'user',
          created_at: profile.created_at || '',
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again later.",
        variant: "destructive",
      });
      
      // Set empty array on complete failure to show the UI
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounce function to prevent rapid fetchUsers calls
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 500), [debounce, fetchUsers]);

  // Real-time subscriptions with debounced updates
  useEffect(() => {
    fetchUsers();
    
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Use debounced refresh to prevent rapid updates
          debouncedFetchUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('User role change detected:', payload);
          // Use debounced refresh to prevent rapid updates
          debouncedFetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchUsers, debouncedFetchUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    users: filteredUsers,
    loading,
    searchTerm,
    setSearchTerm,
    refreshUsers: fetchUsers
  };
};