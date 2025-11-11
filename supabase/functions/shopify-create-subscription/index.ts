import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getShopifyToken } from '../_shared/shopify-decrypt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pricing plans mapped to Shopify billing
const SHOPIFY_PLANS = {
  starter: {
    name: 'Starter Plan',
    price: 47.00,
    trialDays: 7,
    features: '2,000 interactions/month, 2 agents, cart recovery'
  },
  growth: {
    name: 'Growth Plan',
    price: 197.00,
    trialDays: 7,
    features: '10,000 interactions/month, 5 agents, advanced analytics'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id, plan } = await req.json();

    if (!agent_id || !plan) {
      throw new Error('agent_id and plan are required');
    }

    if (!SHOPIFY_PLANS[plan]) {
      throw new Error('Invalid plan');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Shopify credentials
    const shopifyData = await getShopifyToken(agent_id, supabase);
    if (!shopifyData) {
      throw new Error('No Shopify connection found for this agent');
    }

    const { token, shop } = shopifyData;
    const planDetails = SHOPIFY_PLANS[plan];
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://chatpop.ai';
    const returnUrl = `${appBaseUrl}/agents/${agent_id}/settings?tab=billing&shopify_charge_approved=true`;

    console.log('Creating Shopify subscription:', { shop, plan, returnUrl });

    // Create subscription using Shopify GraphQL API
    const mutation = `
      mutation {
        appSubscriptionCreate(
          name: "${planDetails.name}"
          returnUrl: "${returnUrl}"
          trialDays: ${planDetails.trialDays}
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: ${planDetails.price}, currencyCode: USD }
                  interval: EVERY_30_DAYS
                }
              }
            }
          ]
          test: ${Deno.env.get('SHOPIFY_BILLING_TEST_MODE') === 'true'}
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            status
            name
            trialDays
            currentPeriodEnd
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const { userErrors, confirmationUrl, appSubscription } = result.data.appSubscriptionCreate;

    if (userErrors && userErrors.length > 0) {
      console.error('Subscription creation errors:', userErrors);
      throw new Error(`Subscription creation failed: ${userErrors[0].message}`);
    }

    // Store pending subscription
    const { error: insertError } = await supabase
      .from('shopify_subscriptions')
      .insert({
        agent_id,
        shop_domain: shop,
        subscription_id: appSubscription.id,
        plan_name: plan,
        status: 'pending',
        trial_days: planDetails.trialDays,
        amount: planDetails.price,
      });

    if (insertError) {
      console.error('Failed to store subscription:', insertError);
      throw insertError;
    }

    console.log('Shopify subscription created successfully:', appSubscription.id);

    return new Response(JSON.stringify({
      success: true,
      confirmationUrl,
      subscription: appSubscription,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Shopify subscription creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
