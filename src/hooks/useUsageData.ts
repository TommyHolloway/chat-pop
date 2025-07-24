import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsageData {
  conversations_count: number;
  messages_count: number;
  message_credits_used: number;
  storage_used_bytes: number;
  plan: string;
  isLoading: boolean;
}

export const useUsageData = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData>({
    conversations_count: 0,
    messages_count: 0,
    message_credits_used: 0,
    storage_used_bytes: 0,
    plan: 'free',
    isLoading: true
  });

  const fetchUsage = async () => {
    if (!user) {
      setUsage(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setUsage(prev => ({ ...prev, isLoading: true }));

      // Get current month's usage
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      // Get user's plan
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();

      setUsage({
        conversations_count: usageData?.conversations_count || 0,
        messages_count: usageData?.messages_count || 0,
        message_credits_used: usageData?.message_credits_used || 0,
        storage_used_bytes: usageData?.storage_used_bytes || 0,
        plan: profileData?.plan || 'free',
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
      setUsage(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  return { usage, refetch: fetchUsage };
};