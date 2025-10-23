import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AbandonedCart {
  id: string;
  agent_id: string;
  session_id: string;
  cart_items: any;
  cart_total: number;
  currency: string;
  recovery_attempted: boolean;
  recovery_message_sent_at: string | null;
  recovered: boolean;
  recovered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  status?: 'all' | 'pending' | 'recovery_sent' | 'recovered';
  searchQuery?: string;
}

export const useAbandonedCarts = (agentId: string, filters?: FilterOptions) => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('abandoned_carts')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'pending') {
          query = query.eq('recovery_attempted', false).eq('recovered', false);
        } else if (filters.status === 'recovery_sent') {
          query = query.eq('recovery_attempted', true).eq('recovered', false);
        } else if (filters.status === 'recovered') {
          query = query.eq('recovered', true);
        }
      }

      // Apply search filter
      if (filters?.searchQuery) {
        query = query.ilike('session_id', `%${filters.searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCarts(data || []);
    } catch (err: any) {
      console.error('Error fetching abandoned carts:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load abandoned carts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendRecoveryMessage = async (cart: AbandonedCart) => {
    try {
      // Get agent's proactive config for cart abandonment message
      const { data: agent } = await supabase
        .from('agents')
        .select('proactive_config')
        .eq('id', agentId)
        .single();

      const proactiveConfig = agent?.proactive_config as any;
      const cartTrigger = proactiveConfig?.custom_triggers?.find(
        (t: any) => t.trigger_type === 'cart_abandonment' && t.enabled
      );

      const message = cartTrigger?.message || 
        "Hi! I noticed you left some items in your cart. Can I help you complete your purchase?";

      // Insert proactive suggestion
      const { error: suggestionError } = await supabase
        .from('proactive_suggestions')
        .insert({
          agent_id: agentId,
          session_id: cart.session_id,
          suggestion_type: 'cart_abandonment',
          suggestion_message: message,
          confidence_score: 1.0,
          behavioral_triggers: {
            cart_total: cart.cart_total,
            cart_items_count: cart.cart_items?.length || 0,
            manual_trigger: true,
          },
        });

      if (suggestionError) throw suggestionError;

      // Update abandoned cart record
      const { error: updateError } = await supabase
        .from('abandoned_carts')
        .update({
          recovery_attempted: true,
          recovery_message_sent_at: new Date().toISOString(),
        })
        .eq('id', cart.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Recovery message sent successfully',
      });

      // Refresh the list
      fetchCarts();
    } catch (err: any) {
      console.error('Error sending recovery message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send recovery message',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchCarts();
    }
  }, [agentId, filters?.status, filters?.searchQuery]);

  return {
    carts,
    loading,
    error,
    sendRecoveryMessage,
    refreshCarts: fetchCarts,
  };
};
