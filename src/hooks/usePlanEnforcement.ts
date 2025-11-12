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
  monthlyVisitors: number;
  products: number;
  messageCredits: number;
  agents: number;
  links: number;
  storageGB: number;
  cartRecovery: number;
}

interface PlanUsage {
  currentAgents: number;
  currentMessageCredits: number;
  currentLinks: number;
  currentStorageBytes: number;
  currentCartRecovery: number;
}

interface PlanEnforcement {
  limits: PlanLimits;
  usage: PlanUsage;
  canCreateAgent: boolean;
  canSendMessage: boolean;
  canViewVisitorAnalytics: boolean;
  canUseShopify: boolean;
  canUseCartRecovery: boolean;
  canViewEcommerceAnalytics: boolean;
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
    limits: { monthlyVisitors: 100, products: 100, messageCredits: -1, agents: 1, links: 5, storageGB: 1, cartRecovery: 0 },
    usage: { currentAgents: 0, currentMessageCredits: 0, currentLinks: 0, currentStorageBytes: 0, currentCartRecovery: 0 },
    canCreateAgent: true,
    canSendMessage: true,
    canViewVisitorAnalytics: false,
    canUseShopify: false,
    canUseCartRecovery: false,
    canViewEcommerceAnalytics: false,
    canAddLink: async () => true,
    canUploadFile: async () => true,
    remainingCredits: 100,
    remainingAgents: 1,
    isLoading: true
  });

  // Debug logging
  console.log('usePlanEnforcement Debug:', {
    user: user?.id,
    userPlan,
    planLoading,
    enforcementLimits: enforcement.limits,
    enforcementLoading: enforcement.isLoading
  });

  // Define plan limits based on current billing plans
  const getPlanLimits = (plan: string): PlanLimits => {
    switch (plan) {
      case 'hobby':
      case 'starter':
        return {
          monthlyVisitors: 10000,
          products: 1000,
          messageCredits: -1,
          agents: 2,
          links: -1,
          storageGB: 5,
          cartRecovery: 100
        };
      case 'standard':
      case 'growth':
        return {
          monthlyVisitors: 25000,
          products: 3000,
          messageCredits: -1,
          agents: 5,
          links: -1,
          storageGB: 50,
          cartRecovery: 500
        };
      case 'pro':
        return {
          monthlyVisitors: 50000,
          products: 5000,
          messageCredits: -1,
          agents: 10,
          links: -1,
          storageGB: 100,
          cartRecovery: 2000
        };
      default: // free
        return {
          monthlyVisitors: 100,
          products: 100,
          messageCredits: -1,
          agents: 1,
          links: 5,
          storageGB: 1,
          cartRecovery: 0
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
      
      console.log('Plan Enforcement Check:', {
        userId: user.id,
        currentPlan,
        limits,
        planLoading
      });

      // Use database functions to check current usage and limits with error handling for each
      const agentResponse = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'agent'
      });
      const agentCheck = agentResponse.error ? null : agentResponse.data;

      const messageResponse = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'message'
      });
      const messageCheck = messageResponse.error ? null : messageResponse.data;

      // Storage check can fail with integer overflow - handle gracefully
      const storageResponse = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'storage'
      });
      if (storageResponse.error) {
        console.warn('Storage check failed (integer overflow), using defaults:', storageResponse.error);
      }
      const storageCheck = storageResponse.error ? null : storageResponse.data;

      const cartRecoveryResponse = await supabase.rpc('check_user_plan_limits', {
        p_user_id: user.id,
        p_feature_type: 'cart_recovery'
      });
      const cartRecoveryCheck = cartRecoveryResponse.error ? null : cartRecoveryResponse.data;

      const currentUsage: PlanUsage = {
        currentAgents: (agentCheck as unknown as PlanLimitResponse | null)?.current_usage || 0,
        currentMessageCredits: (messageCheck as unknown as PlanLimitResponse | null)?.current_usage || 0,
        currentLinks: 0, // Will be checked per agent
        currentStorageBytes: (storageCheck as unknown as PlanLimitResponse | null)?.current_usage || 0,
        currentCartRecovery: (cartRecoveryCheck as unknown as PlanLimitResponse | null)?.current_usage || 0
      };

      const canCreateAgent = (agentCheck as unknown as PlanLimitResponse | null)?.can_perform || false;
      const canSendMessage = (messageCheck as unknown as PlanLimitResponse | null)?.can_perform || false;
      const canViewVisitorAnalytics = currentPlan === 'standard';
      const canUseShopify = currentPlan !== 'free';
      const canUseCartRecovery = currentPlan !== 'free';
      const canViewEcommerceAnalytics = currentPlan !== 'free';
      
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
        canViewVisitorAnalytics,
        canUseShopify,
        canUseCartRecovery,
        canViewEcommerceAnalytics,
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