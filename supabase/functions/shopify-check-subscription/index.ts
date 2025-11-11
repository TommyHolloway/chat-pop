import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getShopifyToken } from '../_shared/shopify-decrypt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Authentication failed');

    // Get user's billing provider
    const { data: profile } = await supabase
      .from('profiles')
      .select('billing_provider')
      .eq('user_id', user.id)
      .single();

    // If not a Shopify user, return not applicable
    if (profile?.billing_provider !== 'shopify') {
      return new Response(JSON.stringify({
        applicable: false,
        message: 'User does not use Shopify billing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!agents || agents.length === 0) {
      throw new Error('No agent found for user');
    }

    const agentId = agents[0].id;

    // Check for active subscription in database
    const { data: subscription } = await supabase
      .from('shopify_subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: 'free',
        message: 'No active Shopify subscription found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify subscription is still active with Shopify API
    try {
      const shopifyData = await getShopifyToken(agentId, supabase);
      if (shopifyData) {
        const { token: shopifyToken, shop } = shopifyData;

        const query = `
          query {
            node(id: "${subscription.subscription_id}") {
              ... on AppSubscription {
                id
                status
                currentPeriodEnd
              }
            }
          }
        `;

        const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyToken,
          },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const shopifySubscription = result.data?.node;

        // Update local subscription status if it changed
        if (shopifySubscription?.status !== 'ACTIVE') {
          await supabase
            .from('shopify_subscriptions')
            .update({ 
              status: shopifySubscription?.status?.toLowerCase() || 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          return new Response(JSON.stringify({
            subscribed: false,
            subscription_tier: 'free',
            message: 'Subscription is no longer active'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (verifyError) {
      console.error('Failed to verify with Shopify API:', verifyError);
      // Continue with database data if API check fails
    }

    return new Response(JSON.stringify({
      subscribed: true,
      subscription_tier: subscription.plan_name,
      current_period_end: subscription.current_period_end,
      billing_provider: 'shopify'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Shopify subscription check error:', error);
    return new Response(JSON.stringify({
      subscribed: false,
      subscription_tier: 'free',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
