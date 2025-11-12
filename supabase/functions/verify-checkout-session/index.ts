import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update user's plan in profiles table with new limits
    const planName = session.metadata?.plan || 'free';
    const planLimits = {
      free: { monthlyVisitors: 100, products: 100, cartRecovery: 0 },
      starter: { monthlyVisitors: 10000, products: 1000, cartRecovery: 100 },
      growth: { monthlyVisitors: 25000, products: 3000, cartRecovery: 500 },
      pro: { monthlyVisitors: 50000, products: 5000, cartRecovery: 2000 }
    };

    const limits = planLimits[planName as keyof typeof planLimits] || planLimits.free;

    // Find user by customer ID and update their plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', session.customer as string)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          plan: planName,
          monthly_visitors_limit: limits.monthlyVisitors,
          products_limit: limits.products,
          cart_recovery_limit: limits.cartRecovery,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);
    }

    return new Response(
      JSON.stringify({
        verified: true,
        customerId: session.customer,
        plan: session.metadata?.plan || 'free',
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Session verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: 'Unable to verify checkout session.' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
