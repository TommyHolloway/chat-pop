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
    const { agentId, startDate, endDate } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: agent } = await supabase
      .from('agents')
      .select('shopify_config')
      .eq('id', agentId)
      .single();

    if (!agent?.shopify_config?.store_domain) {
      throw new Error('Shopify not connected');
    }

    const { store_domain, admin_api_token } = agent.shopify_config;

    const shopifyOrders = await fetch(
      `https://${store_domain}/admin/api/2024-10/orders.json?status=any&created_at_min=${startDate}&created_at_max=${endDate}`,
      {
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shopifyOrders.ok) {
      throw new Error(`Shopify API error: ${shopifyOrders.status}`);
    }

    const ordersData = await shopifyOrders.json();

    const { data: conversions } = await supabase
      .from('agent_conversions')
      .select('*')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const shopifyOrderIds = new Set(ordersData.orders.map((o: any) => o.id.toString()));
    const trackedOrderIds = new Set(conversions?.map(c => c.order_id) || []);

    const missingFromTracking = ordersData.orders.filter(
      (o: any) => !trackedOrderIds.has(o.id.toString())
    );

    const report = {
      shopifyOrderCount: ordersData.orders.length,
      trackedConversions: conversions?.length || 0,
      missingFromTracking: missingFromTracking.length,
      matchRate: conversions?.length 
        ? ((conversions.length / ordersData.orders.length) * 100).toFixed(1) 
        : 0,
      discrepancies: missingFromTracking.map((o: any) => ({
        orderId: o.id,
        orderNumber: o.order_number,
        total: o.total_price,
        createdAt: o.created_at,
      })),
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Order validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
