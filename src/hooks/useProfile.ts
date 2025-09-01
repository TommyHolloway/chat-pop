import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface Profile {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  plan: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logPIIAccess } = useSecurityMonitoring();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Log PII access
      await logPIIAccess('profiles', 'FETCH', 'Profile data retrieval', ['email', 'phone', 'display_name']);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      // Log PII modification with specific fields
      const modifiedFields = Object.keys(updates).filter(key => 
        ['email', 'phone', 'display_name'].includes(key)
      );
      
      if (modifiedFields.length > 0) {
        await logPIIAccess('profiles', 'UPDATE', 'Profile data modification', modifiedFields);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateAvatar = async (avatarUrl: string | null) => {
    await updateProfile({ avatar_url: avatarUrl });
  };

  return {
    profile,
    loading,
    updateProfile,
    updateAvatar,
    refetch: fetchProfile,
  };
};