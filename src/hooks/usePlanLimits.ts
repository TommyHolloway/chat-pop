import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanLimits {
  maxLinks: number;
  currentLinks: number;
  canAddMore: boolean;
  plan: string;
}

export const usePlanLimits = (agentId?: string) => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({
    maxLinks: 5,
    currentLinks: 0,
    canAddMore: true,
    plan: 'free'
  });

  const checkLimits = async () => {
    if (!user || !agentId) return;

    try {
      // Get user's current plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();

      const plan = profile?.plan || 'free';

      // Get current link count for this agent
      const { count } = await supabase
        .from('agent_links')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      const currentLinks = count || 0;

      // Define limits based on plan
      let maxLinks;
      switch (plan) {
        case 'hobby':
        case 'starter':
          maxLinks = Infinity; // Unlimited for Starter
          break;
        case 'standard':
        case 'growth':
          maxLinks = Infinity; // Unlimited for Growth
          break;
        default:
          maxLinks = 5; // Free plan
      }

      setLimits({
        maxLinks,
        currentLinks,
        canAddMore: plan === 'standard' || currentLinks < maxLinks,
        plan
      });
    } catch (error) {
      console.error('Error checking plan limits:', error);
    }
  };

  useEffect(() => {
    if (user && agentId) {
      checkLimits();
    }
  }, [user, agentId]);

  return { limits, checkLimits };
};