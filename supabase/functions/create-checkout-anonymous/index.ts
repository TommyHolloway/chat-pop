import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('[CREATE-CHECKOUT-ANONYMOUS] Request received');
  
  if (req.method === "OPTIONS") {
    console.log('[CREATE-CHECKOUT-ANONYMOUS] OPTIONS request - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Parsing request body');
    const { plan, successUrl, cancelUrl } = await req.json();
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Request params:', { plan, successUrl, cancelUrl });
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error('[CREATE-CHECKOUT-ANONYMOUS] STRIPE_SECRET_KEY not found in environment');
      throw new Error("Stripe configuration error");
    }
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Stripe key found, initializing client');
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Map plan to Stripe product IDs
    const productIds: Record<string, string> = {
      'starter': 'prod_TMZ2r6gJsJwMq6',
      'growth': 'prod_TMZ2dGeLsNO31t',
      'pro': 'prod_NEWPRO123456', // TODO: Replace with actual Pro product ID from Stripe
    };

    const productId = productIds[plan];
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Product ID for plan:', { plan, productId });
    
    if (!productId) {
      console.error('[CREATE-CHECKOUT-ANONYMOUS] Invalid plan:', plan);
      throw new Error("Invalid plan selected");
    }

    // Get the default price for the product
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Fetching prices for product:', productId);
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });

    console.log('[CREATE-CHECKOUT-ANONYMOUS] Prices found:', prices.data.length);
    if (prices.data.length === 0) {
      console.error('[CREATE-CHECKOUT-ANONYMOUS] No active price found for product:', productId);
      throw new Error(`No active price found for product ${productId}`);
    }

    // Create checkout session without customer (they'll sign up after payment)
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Creating checkout session with price:', prices.data[0].id);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl + '&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      metadata: {
        plan: plan,
      },
    });

    console.log('[CREATE-CHECKOUT-ANONYMOUS] Checkout session created:', session.id);
    console.log('[CREATE-CHECKOUT-ANONYMOUS] Checkout URL:', session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('[CREATE-CHECKOUT-ANONYMOUS] Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unable to create checkout session';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.type || 'Unknown error type'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
