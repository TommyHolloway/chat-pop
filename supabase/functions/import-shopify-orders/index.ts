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

    // Fetch orders using GraphQL with pagination
    let hasNextPage = true;
    let cursor = null;
    let allOrders = [];

    while (hasNextPage) {
      const graphqlQuery = `
        query($cursor: String, $query: String) {
          orders(first: 250, after: $cursor, query: $query) {
            edges {
              node {
                id
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
            cursor,
            query: `created_at:>='${startDate}'`
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

      allOrders = allOrders.concat(result.data.orders.edges);
      hasNextPage = result.data.orders.pageInfo.hasNextPage;
      cursor = result.data.orders.pageInfo.endCursor;
    }

    console.log(`Fetched ${allOrders.length} orders from Shopify GraphQL`);

    // Transform GraphQL data to metrics format
    const metricsByDate = new Map();

    allOrders.forEach((orderEdge: any) => {
      const order = orderEdge.node;
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const orderId = order.id.split('/').pop();
      const amount = parseFloat(order.totalPriceSet.shopMoney.amount);
      const currency = order.totalPriceSet.shopMoney.currencyCode;
      
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
      metrics.total_revenue += amount;
      metrics.total_orders += 1;
      metrics.revenue_data.push({
        order_id: orderId,
        amount,
        currency,
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
