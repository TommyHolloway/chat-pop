import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';

interface ShopifySubscription {
  status: string;
  plan_name: string;
  current_period_end?: string;
  trial_days?: number;
  amount?: number;
  cancelled_at?: string;
}

interface UserPlanData {
  plan: string;
  isLoading: boolean;
  isAdminOverride: boolean;
  stripePlan?: string;
  shopifySubscription?: ShopifySubscription;
  billingProvider: string;
}

export const useUserPlan = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [planData, setPlanData] = useState<UserPlanData>({
    plan: 'free',
    isLoading: true,
    isAdminOverride: false,
    stripePlan: undefined,
    shopifySubscription: undefined,
    billingProvider: 'stripe'
  });
  const previousShopifyStatus = useRef<string | undefined>();

  const fetchUserPlan = async () => {
    if (!user) {
      setPlanData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setPlanData(prev => ({ ...prev, isLoading: true }));

      // Get database plan and billing provider from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan, billing_provider')
        .eq('user_id', user.id)
        .maybeSingle();

      const databasePlan = profileData?.plan || 'free';
      const billingProvider = profileData?.billing_provider || 'stripe';
      const stripePlan = subscription.subscription_tier || 'free';
      
      let shopifySubscription: ShopifySubscription | undefined;

      // If billing provider is Shopify, fetch Shopify subscription data
      if (billingProvider === 'shopify') {
        try {
          const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('shopify-check-subscription');
          
          if (!shopifyError && shopifyData) {
            shopifySubscription = {
              status: shopifyData.status,
              plan_name: shopifyData.subscription_tier,
              current_period_end: shopifyData.subscription_end,
              trial_days: shopifyData.trial_days,
              amount: shopifyData.amount,
              cancelled_at: shopifyData.cancelled_at
            };
          }
        } catch (shopifyError) {
          console.error('Error fetching Shopify subscription:', shopifyError);
        }
      }
      
      // Database plan takes precedence (admin override)
      const finalPlan = databasePlan;
      const isAdminOverride = billingProvider === 'stripe' && databasePlan !== stripePlan && stripePlan !== 'free';

      setPlanData({
        plan: finalPlan,
        isLoading: false,
        isAdminOverride,
        stripePlan,
        shopifySubscription,
        billingProvider
      });

      // Show toast notifications for Shopify subscription status changes
      if (billingProvider === 'shopify' && shopifySubscription) {
        const currentStatus = shopifySubscription.status;
        const previousStatus = previousShopifyStatus.current;

        if (previousStatus && previousStatus !== currentStatus) {
          if (currentStatus === 'active' && previousStatus === 'pending') {
            toast({
              title: `🎉 Your ${shopifySubscription.plan_name} subscription is now active!`,
              description: 'Enjoy all premium features.',
            });
          } else if (currentStatus === 'active' && shopifySubscription.trial_days && shopifySubscription.trial_days > 0) {
            toast({
              title: `✨ Your free trial has started!`,
              description: `Enjoy ${shopifySubscription.trial_days} days of premium features.`,
            });
          } else if (currentStatus === 'cancelled') {
            toast({
              title: '⚠️ Subscription Cancelled',
              description: "You've been downgraded to the free plan.",
              variant: 'destructive',
            });
          } else if (currentStatus === 'expired') {
            toast({
              title: '❌ Subscription Expired',
              description: 'Upgrade to continue using premium features.',
              variant: 'destructive',
            });
          } else if (previousStatus === 'active' && finalPlan !== previousShopifyStatus.current) {
            toast({
              title: `🚀 Upgraded to ${finalPlan}!`,
              description: 'Enjoy your new features.',
            });
          }
        }

        previousShopifyStatus.current = currentStatus;
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
      setPlanData({
        plan: 'free',
        isLoading: false,
        isAdminOverride: false,
        stripePlan: subscription.subscription_tier,
        shopifySubscription: undefined,
        billingProvider: 'stripe'
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user, subscription.subscription_tier]);

  // Subscribe to profile and shopify_subscriptions changes for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('plan-changes')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopify_subscriptions'
        },
        (payload) => {
          // Only refetch if this is for one of the user's agents
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