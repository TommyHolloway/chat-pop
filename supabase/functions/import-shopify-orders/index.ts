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
    const { agentId, days = 90 } = await req.json();

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
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let allOrders = [];
    let nextPageUrl = `https://${store_domain}/admin/api/2024-10/orders.json?status=any&created_at_min=${startDate}&limit=250`;

    while (nextPageUrl) {
      const response = await fetch(nextPageUrl, {
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      allOrders = allOrders.concat(data.orders);

      const linkHeader = response.headers.get('Link');
      nextPageUrl = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
    }

    console.log(`Fetched ${allOrders.length} orders from Shopify`);

    const metricsByDate = new Map();

    allOrders.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      
      if (!metricsByDate.has(date)) {
        metricsByDate.set(date, {
          date,
          agent_id: agentId,
          total_revenue: 0,
          total_orders: 0,
          revenue_data: [],
        });
      }

      const metrics = metricsByDate.get(date);
      metrics.total_revenue += parseFloat(order.total_price);
      metrics.total_orders += 1;
      metrics.revenue_data.push({
        order_id: order.id.toString(),
        amount: parseFloat(order.total_price),
        currency: order.currency,
      });
    });

    const metricsToInsert = Array.from(metricsByDate.values()).map(m => ({
      ...m,
      average_order_value: m.total_revenue / m.total_orders,
    }));

    const { error: insertError } = await supabase
      .from('agent_ecommerce_metrics')
      .upsert(metricsToInsert, {
        onConflict: 'agent_id,date',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      ordersImported: allOrders.length,
      daysImported: metricsToInsert.length,
      dateRange: {
        from: startDate,
        to: new Date().toISOString(),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
