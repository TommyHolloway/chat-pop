import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface UserPlanData {
  plan: string;
  isLoading: boolean;
  isAdminOverride: boolean;
  stripePlan?: string;
}

export const useUserPlan = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [planData, setPlanData] = useState<UserPlanData>({
    plan: 'free',
    isLoading: true,
    isAdminOverride: false,
    stripePlan: undefined
  });

  const fetchUserPlan = async () => {
    if (!user) {
      setPlanData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setPlanData(prev => ({ ...prev, isLoading: true }));

      // Get database plan from profiles table (admin can override this)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();

      const databasePlan = profileData?.plan || 'free';
      const stripePlan = subscription.subscription_tier || 'free';
      
      // Database plan takes precedence (admin override)
      const finalPlan = databasePlan;
      const isAdminOverride = databasePlan !== stripePlan && stripePlan !== 'free';

      setPlanData({
        plan: finalPlan,
        isLoading: false,
        isAdminOverride,
        stripePlan
      });
    } catch (error) {
      console.error('Error fetching user plan:', error);
      setPlanData({
        plan: 'free',
        isLoading: false,
        isAdminOverride: false,
        stripePlan: subscription.subscription_tier
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user, subscription.subscription_tier]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-plan-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUserPlan();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { ...planData, refetch: fetchUserPlan };
};