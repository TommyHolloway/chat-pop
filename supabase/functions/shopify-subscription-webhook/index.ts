import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-shop-domain, x-shopify-topic',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopDomain = req.headers.get('X-Shopify-Shop-Domain');
    const topic = req.headers.get('X-Shopify-Topic');

    console.log('Subscription webhook received:', { topic, shopDomain });

    const payload = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (topic === 'app_subscriptions/update') {
      const subscriptionId = payload.admin_graphql_api_id || `gid://shopify/AppSubscription/${payload.id}`;
      const status = (payload.status || '').toLowerCase();

      console.log('Processing subscription update:', { 
        subscriptionId, 
        status,
        billingOn: payload.billing_on,
        currentPeriodEnd: payload.current_period_end,
        payload: JSON.stringify(payload)
      });

      // Update subscription status
      const { error } = await supabase
        .from('shopify_subscriptions')
        .update({
          status,
          current_period_end: payload.billing_on || payload.current_period_end,
          updated_at: new Date().toISOString(),
          cancelled_at: (status === 'cancelled' || status === 'expired') ? new Date().toISOString() : null
        })
        .eq('subscription_id', subscriptionId);

      if (error) {
        console.error('Failed to update subscription:', error);
        throw error;
      }

      console.log('Subscription updated successfully:', subscriptionId);

      // If subscription was cancelled or expired, downgrade user's plan
      if (status === 'cancelled' || status === 'expired') {
        const { data: subscription } = await supabase
          .from('shopify_subscriptions')
          .select('agent_id')
          .eq('subscription_id', subscriptionId)
          .single();

        if (subscription) {
          const { data: agent } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', subscription.agent_id)
            .single();

          if (agent?.user_id) {
            await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('user_id', agent.user_id);

            console.log('User plan downgraded to free:', agent.user_id);
          }
        }
      } else if (status === 'active') {
        // If subscription became active, upgrade user's plan
        const { data: subscription } = await supabase
          .from('shopify_subscriptions')
          .select('agent_id, plan_name')
          .eq('subscription_id', subscriptionId)
          .single();

        if (subscription) {
          const { data: agent } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', subscription.agent_id)
            .single();

          if (agent?.user_id && subscription.plan_name) {
            // Normalize plan names for consistency
            const normalizedPlan = subscription.plan_name.toLowerCase();
            
            await supabase
              .from('profiles')
              .update({ 
                plan: normalizedPlan,
                billing_provider: 'shopify'
              })
              .eq('user_id', agent.user_id);

            console.log('User plan upgraded:', { 
              userId: agent.user_id, 
              plan: normalizedPlan,
              originalPlanName: subscription.plan_name
            });
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Subscription webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
