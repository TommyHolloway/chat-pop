import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end?: string;
  isLoading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: 'free',
    isLoading: true
  });

  const checkSubscription = async () => {
    if (!user) {
      setSubscription({ subscribed: false, subscription_tier: 'free', isLoading: false });
      return;
    }

    try {
      setSubscription(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscription({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end,
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  };

  const createCheckout = async (plan: string) => {
    if (!user) throw new Error('User not authenticated');

    // Check billing provider
    const { data: profile } = await supabase
      .from('profiles')
      .select('billing_provider')
      .eq('user_id', user.id)
      .single();

    if (profile?.billing_provider === 'shopify') {
      throw new Error('Please use Shopify billing management');
    }

    // Continue with Stripe
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan }
    });

    if (error) throw error;
    
    // Open Stripe checkout in a new tab
    window.open(data.url, '_blank');
  };

  const openCustomerPortal = async () => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) throw error;
    
    // Open customer portal in a new tab
    window.open(data.url, '_blank');
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  return {
    subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  };
};