import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttributedOrder } from '@/types/attribution';

export const useAttributedOrders = (conversationId?: string, agentId?: string) => {
  const [orders, setOrders] = useState<AttributedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId && !agentId) {
      setLoading(false);
      return;
    }

    fetchAttributedOrders();
  }, [conversationId, agentId]);

  const fetchAttributedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = (supabase as any)
        .from('shopify_orders')
        .select('*');

      if (conversationId) {
        query.eq('attributed_conversation_id', conversationId);
      } else if (agentId) {
        query.eq('agent_id', agentId);
      }

      query
        .not('attribution_confidence', 'is', null)
        .order('order_created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map database records to AttributedOrder type
      const mappedOrders: AttributedOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        order_id: order.order_id || '',
        order_number: order.order_number || '',
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        total_price: Number(order.total_price || 0),
        currency: order.currency || 'USD',
        line_items: order.line_items || [],
        attribution_confidence: Number(order.attribution_confidence || 0),
        attribution_type: order.attribution_type || '',
        attributed_conversation_id: order.attributed_conversation_id,
        order_created_at: order.order_created_at || '',
        created_at: order.created_at || ''
      }));

      setOrders(mappedOrders);
    } catch (err: any) {
      console.error('Error fetching attributed orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, refetch: fetchAttributedOrders };
};
