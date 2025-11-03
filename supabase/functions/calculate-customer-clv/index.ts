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

    let allCustomers = [];
    let nextPageUrl = `https://${store_domain}/admin/api/2024-10/customers.json?limit=250`;

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
      allCustomers = allCustomers.concat(data.customers);

      const linkHeader = response.headers.get('Link');
      nextPageUrl = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
    }

    console.log(`Fetched ${allCustomers.length} customers from Shopify`);

    const customerAnalytics = allCustomers
      .filter((c: any) => c.orders_count > 0)
      .map((customer: any) => {
        const daysSinceLastOrder = customer.last_order_name 
          ? Math.floor((Date.now() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let segment = 'regular';
        if (parseFloat(customer.total_spent) > 1000) {
          segment = 'vip';
        } else if (daysSinceLastOrder && daysSinceLastOrder > 180) {
          segment = 'lapsed';
        } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
          segment = 'at_risk';
        }

        return {
          agent_id: agentId,
          shopify_customer_id: customer.id.toString(),
          email: customer.email,
          total_orders: customer.orders_count,
          total_spent: parseFloat(customer.total_spent),
          average_order_value: parseFloat(customer.total_spent) / customer.orders_count,
          first_order_date: customer.created_at,
          last_order_date: customer.updated_at,
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
