import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getShopifyToken } from '../_shared/shopify-decrypt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agent_id } = await req.json();

    if (!agent_id) {
      return new Response(
        JSON.stringify({ error: 'Missing agent_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this agent
    const { data: agent } = await supabaseClient
      .from('agents')
      .select('id, user_id')
      .eq('id', agent_id)
      .single();

    if (!agent || agent.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Agent not found or unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Shopify access token
    const shopifyCredentials = await getShopifyToken(agent_id, supabaseClient);
    if (!shopifyCredentials) {
      return new Response(
        JSON.stringify({ error: 'No active Shopify connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active subscription
    const { data: subscription } = await supabaseClient
      .from('shopify_subscriptions')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancel subscription via Shopify GraphQL API
    const cancelMutation = `
      mutation {
        appSubscriptionCancel(id: "${subscription.subscription_id}") {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const shopifyResponse = await fetch(
      `https://${shopifyCredentials.shop}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyCredentials.token,
        },
        body: JSON.stringify({ query: cancelMutation }),
      }
    );

    const result = await shopifyResponse.json();

    if (result.errors || result.data?.appSubscriptionCancel?.userErrors?.length > 0) {
      console.error('Shopify cancellation error:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to cancel subscription with Shopify',
          details: result.errors || result.data?.appSubscriptionCancel?.userErrors
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update subscription status in database
    await supabaseClient
      .from('shopify_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    // Downgrade user to free plan
    await supabaseClient
      .from('profiles')
      .update({ plan: 'free' })
      .eq('user_id', user.id);

    console.log(`Subscription cancelled for agent ${agent_id}, user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription cancelled successfully',
        status: 'cancelled'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});