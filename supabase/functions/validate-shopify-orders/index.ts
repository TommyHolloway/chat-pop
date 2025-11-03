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

    // Fetch orders from Shopify using GraphQL
    const graphqlQuery = `
      query($query: String) {
        orders(first: 250, query: $query) {
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${store_domain}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': admin_api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          query: `created_at:>='${startDate}' AND created_at:<='${endDate}'`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const ordersData = result.data.orders.edges.map((edge: any) => ({
      id: edge.node.id.split('/').pop(),
      order_number: edge.node.name,
      total_price: edge.node.totalPriceSet.shopMoney.amount,
      created_at: edge.node.createdAt,
    }));

    const { data: conversions } = await supabase
      .from('agent_conversions')
      .select('*')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const shopifyOrderIds = new Set(ordersData.map((o: any) => o.id));
    const trackedOrderIds = new Set(conversions?.map(c => c.order_id) || []);

    const missingFromTracking = ordersData.filter(
      (o: any) => !trackedOrderIds.has(o.id)
    );

    const report = {
      shopifyOrderCount: ordersData.length,
      trackedConversions: conversions?.length || 0,
      missingFromTracking: missingFromTracking.length,
      matchRate: conversions?.length 
        ? ((conversions.length / ordersData.length) * 100).toFixed(1) 
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
