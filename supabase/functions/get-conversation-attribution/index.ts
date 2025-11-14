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
    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get attributed orders for this conversation
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders')
      .select(`
        id,
        order_id,
        order_number,
        customer_email,
        customer_name,
        total_price,
        currency,
        line_items,
        attribution_confidence,
        attribution_type,
        order_created_at,
        created_at
      `)
      .eq('attributed_conversation_id', conversationId)
      .order('order_created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Get conversion attribution records
    const { data: conversions, error: conversionsError } = await supabase
      .from('agent_conversions')
      .select('*')
      .contains('conversation_ids', [conversationId]);

    if (conversionsError) throw conversionsError;

    // Calculate metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgConfidence = totalOrders > 0
      ? orders.reduce((sum, order) => sum + (order.attribution_confidence || 0), 0) / totalOrders
      : 0;

    // Extract products
    const productsRecommended = conversions?.flatMap(c => c.products_recommended || []) || [];
    const productsPurchased = orders?.flatMap(o => 
      (o.line_items || []).map((item: any) => ({
        product_id: item.product_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      }))
    ) || [];

    // Build timeline
    const timeline = [
      ...orders.map(order => ({
        timestamp: order.order_created_at,
        event: 'order_placed',
        details: {
          order_number: order.order_number,
          total: order.total_price,
          confidence: order.attribution_confidence
        }
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return new Response(JSON.stringify({
      success: true,
      orders: orders || [],
      totalRevenue,
      totalOrders,
      avgConfidence,
      products: {
        recommended: productsRecommended,
        purchased: productsPurchased
      },
      timeline,
      multiTouch: conversions?.filter(c => c.conversation_ids?.length > 1) || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-conversation-attribution:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch conversation attribution'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
