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
    const { agentId } = await req.json();

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

    // Fetch customers using GraphQL with pagination
    let hasNextPage = true;
    let cursor = null;
    let allCustomers = [];

    while (hasNextPage) {
      const graphqlQuery = `
        query($cursor: String) {
          customers(first: 250, after: $cursor) {
            edges {
              node {
                id
                email
                ordersCount
                totalSpent {
                  amount
                }
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await fetch(`https://${store_domain}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { cursor }
        })
      });

      if (!response.ok) {
        throw new Error(`Shopify GraphQL API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      allCustomers = allCustomers.concat(result.data.customers.edges);
      hasNextPage = result.data.customers.pageInfo.hasNextPage;
      cursor = result.data.customers.pageInfo.endCursor;
    }

    console.log(`Fetched ${allCustomers.length} customers from Shopify GraphQL`);

    const customerAnalytics = allCustomers
      .filter((edge: any) => edge.node.ordersCount > 0)
      .map((edge: any) => {
        const customer = edge.node;
        const customerId = customer.id.split('/').pop(); // Extract numeric ID from GraphQL global ID
        const totalSpent = parseFloat(customer.totalSpent.amount);
        
        const daysSinceLastOrder = customer.updatedAt
          ? Math.floor((Date.now() - new Date(customer.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let segment = 'regular';
        if (totalSpent > 1000) {
          segment = 'vip';
        } else if (daysSinceLastOrder && daysSinceLastOrder > 180) {
          segment = 'lapsed';
        } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
          segment = 'at_risk';
        }

        return {
          agent_id: agentId,
          shopify_customer_id: customerId,
          email: customer.email,
          total_orders: customer.ordersCount,
          total_spent: totalSpent,
          average_order_value: customer.ordersCount > 0 ? totalSpent / customer.ordersCount : 0,
          first_order_date: customer.createdAt,
          last_order_date: customer.updatedAt,
          days_since_last_order: daysSinceLastOrder,
          customer_segment: segment,
          updated_at: new Date().toISOString(),
        };
      });

    const { error: upsertError } = await supabase
      .from('customer_analytics')
      .upsert(customerAnalytics, {
        onConflict: 'agent_id,shopify_customer_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      throw upsertError;
    }

    const summary = {
      totalCustomers: customerAnalytics.length,
      vipCustomers: customerAnalytics.filter(c => c.customer_segment === 'vip').length,
      atRiskCustomers: customerAnalytics.filter(c => c.customer_segment === 'at_risk').length,
      lapsedCustomers: customerAnalytics.filter(c => c.customer_segment === 'lapsed').length,
      averageLifetimeValue: (customerAnalytics.reduce((sum, c) => sum + c.total_spent, 0) / customerAnalytics.length).toFixed(2),
      repeatCustomerRate: ((customerAnalytics.filter(c => c.total_orders > 1).length / customerAnalytics.length) * 100).toFixed(1),
    };

    return new Response(JSON.stringify({
      success: true,
      customersProcessed: customerAnalytics.length,
      summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('CLV calculation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
