import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useUsageData } from '@/hooks/useUsageData';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanLimitResponse {
  can_perform: boolean;
  current_usage: number;
  limit: number;
  plan: string;
}

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
  canUploadFile: (fileSize: number) => Promise<boolean>;
  remainingCredits: number;
  remainingAgents: number;
  isLoading: boolean;
}

export const usePlanEnforcement = () => {
  const { user } = useAuth();
  const { plan: userPlan, isLoading: planLoading } = useUserPlan();
  const { usage } = useUsageData();
  const [enforcement, setEnforcement] = useState<PlanEnforcement>({
    limits: { messageCredits: 100, agents: 1, links: 5, storageGB: 1 },
    usage: { currentAgents: 0, currentMessageCredits: 0, currentLinks: 0, currentStorageBytes: 0 },
    canCreateAgent: true,
    canSendMessage: true,
    canAddLink: async () => true,
    canUploadFile: async () => true,
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

      const currentPlan = userPlan;
      const limits = getPlanLimits(currentPlan);

      // Use database functions to check current usage and limits
      const { data: agentCheck } = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'agent'
      }) as { data: PlanLimitResponse };

      const { data: messageCheck } = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'message'
      }) as { data: PlanLimitResponse };

      const { data: storageCheck } = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'storage'
      }) as { data: PlanLimitResponse };

      const currentUsage: PlanUsage = {
        currentAgents: agentCheck?.current_usage || 0,
        currentMessageCredits: messageCheck?.current_usage || 0,
        currentLinks: 0, // Will be checked per agent
        currentStorageBytes: storageCheck?.current_usage || 0
      };

      const canCreateAgent = agentCheck?.can_perform || false;
      const canSendMessage = messageCheck?.can_perform || false;
      
      const canUploadFile = (fileSize: number) => {
        return new Promise<boolean>(async (resolve) => {
          const { data: fileStorageCheck } = await supabase.rpc('check_user_plan_limits', {
            p_user_id: user.id,
            p_feature_type: 'storage',
            p_file_size: fileSize
          }) as { data: PlanLimitResponse };
          resolve(fileStorageCheck?.can_perform || false);
        });
      };

      const canAddLink = async (agentId: string) => {
        const { data: linkCheck } = await supabase.rpc('check_user_plan_limits', {
          p_user_id: user.id,
          p_feature_type: 'link',
          p_agent_id: agentId
        }) as { data: PlanLimitResponse };
        return linkCheck?.can_perform || false;
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
    if (user && !planLoading) {
      checkPlanEnforcement();
    }
  }, [user, userPlan, usage, planLoading]);

  return { ...enforcement, refetch: checkPlanEnforcement };
};