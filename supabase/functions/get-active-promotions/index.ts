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

    const priceRulesResponse = await fetch(
      `https://${store_domain}/admin/api/2024-10/price_rules.json`,
      {
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!priceRulesResponse.ok) {
      throw new Error(`Shopify API error: ${priceRulesResponse.status}`);
    }

    const priceRulesData = await priceRulesResponse.json();

    const now = new Date();
    const activePromotions = priceRulesData.price_rules.filter((rule: any) => {
      const startsAt = rule.starts_at ? new Date(rule.starts_at) : null;
      const endsAt = rule.ends_at ? new Date(rule.ends_at) : null;

      const isActive = (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
      return isActive;
    });

    const formattedPromotions = activePromotions.map((rule: any) => ({
      title: rule.title,
      value: rule.value,
      valueType: rule.value_type,
      targetType: rule.target_type,
      description: `${rule.title}: ${rule.value_type === 'percentage' ? rule.value + '%' : '$' + rule.value} off`,
      startsAt: rule.starts_at,
      endsAt: rule.ends_at,
    }));

    return new Response(JSON.stringify({
      success: true,
      activePromotions: formattedPromotions,
      count: formattedPromotions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Promotions fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
