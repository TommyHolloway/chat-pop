import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, agentId, orderId, orderTotal, currency, productsPurchased } = await req.json();

    if (!sessionId || !agentId || !orderId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation ID from session
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('agent_id', agentId)
      .single();

    // Record conversion
    const { error: conversionError } = await supabase
      .from('agent_conversions')
      .insert({
        agent_id: agentId,
        session_id: sessionId,
        conversation_id: conversation?.id,
        conversion_type: 'purchase',
        order_id: orderId,
        order_total: orderTotal,
        currency: currency || 'USD',
        products_purchased: productsPurchased || [],
        attributed_revenue: orderTotal,
      });

    if (conversionError) throw conversionError;

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingMetrics } = await supabase
      .from('agent_ecommerce_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .single();

    if (existingMetrics) {
      // Update existing record
      const newTotalRevenue = (existingMetrics.total_revenue || 0) + orderTotal;
      const newTotalOrders = (existingMetrics.total_orders || 0) + 1;
      
      await supabase
        .from('agent_ecommerce_metrics')
        .update({
          total_revenue: newTotalRevenue,
          total_orders: newTotalOrders,
          average_order_value: newTotalRevenue / newTotalOrders,
        })
        .eq('id', existingMetrics.id);
    } else {
      // Create new record
      await supabase
        .from('agent_ecommerce_metrics')
        .insert({
          agent_id: agentId,
          date: today,
          total_revenue: orderTotal,
          total_orders: 1,
          average_order_value: orderTotal,
        });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Conversion tracked'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-conversion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to track conversion'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
