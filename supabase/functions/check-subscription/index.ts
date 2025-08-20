import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Check if user has admin-set plan before overriding
      const { data: currentProfile } = await supabaseClient
        .from("profiles")
        .select("plan")
        .eq('user_id', user.id)
        .single();
      
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      // Only update plan to free if it's not an admin override (non-free plan without subscription)
      const shouldUpdatePlan = !currentProfile?.plan || currentProfile.plan === 'free';
      if (shouldUpdatePlan) {
        await supabaseClient.from("profiles").update({ plan: 'free' }).eq('user_id', user.id);
        logStep("Updated plan to free - no admin override detected");
      } else {
        logStep("Preserving admin override plan", { currentPlan: currentProfile.plan });
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: currentProfile?.plan || 'free' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount <= 999) {
        subscriptionTier = "hobby";
      } else if (amount <= 2999) {
        subscriptionTier = "standard";
      } else {
        subscriptionTier = "standard";
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Check current profile plan before updating
    const { data: currentProfile } = await supabaseClient
      .from("profiles")
      .select("plan")
      .eq('user_id', user.id)
      .single();

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Only update profiles plan if it matches subscription tier or is free (no admin override)
    const currentPlan = currentProfile?.plan || 'free';
    const isAdminOverride = hasActiveSub && currentPlan !== subscriptionTier && currentPlan !== 'free';
    
    if (!isAdminOverride) {
      await supabaseClient.from("profiles").update({ plan: subscriptionTier }).eq('user_id', user.id);
      logStep("Updated plan to match subscription", { from: currentPlan, to: subscriptionTier });
    } else {
      logStep("Preserving admin override plan", { adminPlan: currentPlan, stripePlan: subscriptionTier });
    }

    const finalPlan = isAdminOverride ? currentPlan : subscriptionTier;

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier, finalPlan });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: finalPlan,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});