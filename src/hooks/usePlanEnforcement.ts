import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageData } from '@/hooks/useUsageData';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanLimits {
  messageCredits: number;
  agents: number;
  links: number;
  storageGB: number;
}

interface PlanUsage {
  currentAgents: number;
  currentMessageCredits: number;
  currentLinks: number;
  currentStorageBytes: number;
}

interface PlanEnforcement {
  limits: PlanLimits;
  usage: PlanUsage;
  canCreateAgent: boolean;
  canSendMessage: boolean;
  canAddLink: (agentId: string) => Promise<boolean>;
  canUploadFile: (fileSize: number) => boolean;
  remainingCredits: number;
  remainingAgents: number;
  isLoading: boolean;
}

export const usePlanEnforcement = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { usage } = useUsageData();
  const [enforcement, setEnforcement] = useState<PlanEnforcement>({
    limits: { messageCredits: 100, agents: 1, links: 5, storageGB: 1 },
    usage: { currentAgents: 0, currentMessageCredits: 0, currentLinks: 0, currentStorageBytes: 0 },
    canCreateAgent: true,
    canSendMessage: true,
    canAddLink: async () => true,
    canUploadFile: () => true,
    remainingCredits: 100,
    remainingAgents: 1,
    isLoading: true
  });

  // Define plan limits based on current billing plans
  const getPlanLimits = (plan: string): PlanLimits => {
    switch (plan) {
      case 'hobby':
        return {
          messageCredits: 2000,
          agents: 2,
          links: 20,
          storageGB: 5
        };
      case 'standard': // Pro plan
        return {
          messageCredits: 12000,
          agents: 5,
          links: -1, // unlimited
          storageGB: 50
        };
      default: // free
        return {
          messageCredits: 100,
          agents: 1,
          links: 5,
          storageGB: 1
        };
    }
  };

  const checkPlanEnforcement = async () => {
    if (!user) {
      setEnforcement(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setEnforcement(prev => ({ ...prev, isLoading: true }));

      const currentPlan = subscription.subscription_tier || 'free';
      const limits = getPlanLimits(currentPlan);

      // Get current agent count
      const { count: agentCount } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total link count across all agents
      const userAgentIds = await getUserAgentIds();
      let linkCount = 0;
      
      if (userAgentIds.length > 0) {
        const { count } = await supabase
          .from('agent_links')
          .select('id', { count: 'exact', head: true })
          .in('agent_id', userAgentIds);
        linkCount = count || 0;
      }
      const currentUsage: PlanUsage = {
        currentAgents: agentCount || 0,
        currentMessageCredits: usage.message_credits_used,
        currentLinks: linkCount,
        currentStorageBytes: usage.storage_used_bytes
      };

      const canCreateAgent = limits.agents === -1 || currentUsage.currentAgents < limits.agents;
      const canSendMessage = limits.messageCredits === -1 || currentUsage.currentMessageCredits < limits.messageCredits;
      
      const canUploadFile = (fileSize: number) => {
        const currentStorageGB = currentUsage.currentStorageBytes / (1024 * 1024 * 1024);
        const fileSizeGB = fileSize / (1024 * 1024 * 1024);
        return limits.storageGB === -1 || (currentStorageGB + fileSizeGB) <= limits.storageGB;
      };

      const canAddLink = async (agentId: string) => {
        if (limits.links === -1) return true;
        
        const { count } = await supabase
          .from('agent_links')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', agentId);

        return (count || 0) < limits.links;
      };

      setEnforcement({
        limits,
        usage: currentUsage,
        canCreateAgent,
        canSendMessage,
        canAddLink,
        canUploadFile,
        remainingCredits: limits.messageCredits === -1 ? -1 : Math.max(0, limits.messageCredits - currentUsage.currentMessageCredits),
        remainingAgents: limits.agents === -1 ? -1 : Math.max(0, limits.agents - currentUsage.currentAgents),
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking plan enforcement:', error);
      setEnforcement(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getUserAgentIds = async (): Promise<string[]> => {
    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user?.id);
    
    return data?.map(agent => agent.id) || [];
  };

  useEffect(() => {
    if (user) {
      checkPlanEnforcement();
    }
  }, [user, subscription.subscription_tier, usage]);

  return { ...enforcement, refetch: checkPlanEnforcement };
};