import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversionAttribution } from '@/types/attribution';

interface DateRange {
  from: Date;
  to: Date;
}

export const useConversionAttribution = (agentId: string, dateRange?: DateRange) => {
  const [conversions, setConversions] = useState<ConversionAttribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    fetchConversions();
  }, [agentId, dateRange?.from, dateRange?.to]);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = (supabase as any)
        .from('agent_conversions')
        .select('*')
        .eq('agent_id', agentId);

      if (dateRange) {
        query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map database records to ConversionAttribution type
      const mappedConversions: ConversionAttribution[] = (data || []).map((conv: any) => ({
        id: conv.id,
        agent_id: conv.agent_id,
        order_id: conv.order_id || '',
        order_total: Number(conv.order_total || 0),
        attributed_revenue: Number(conv.attributed_revenue || 0),
        attribution_confidence: Number(conv.attribution_confidence || 0),
        attribution_type: conv.attribution_type || '',
        conversation_id: conv.conversation_id,
        conversation_ids: conv.conversation_ids || [],
        products_recommended: conv.products_recommended || [],
        products_purchased: conv.products_purchased || [],
        session_id: conv.session_id || '',
        created_at: conv.created_at || ''
      }));

      setConversions(mappedConversions);
    } catch (err: any) {
      console.error('Error fetching conversion attribution:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { conversions, loading, error, refetch: fetchConversions };
};
