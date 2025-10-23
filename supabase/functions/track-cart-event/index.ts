import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { sessionId, agentId, eventType, productData, cartTotal, currency = 'USD' } = await req.json();

    if (!sessionId || !agentId || !eventType) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert cart event
    const { error: eventError } = await supabase
      .from('cart_events')
      .insert({
        session_id: sessionId,
        agent_id: agentId,
        event_type: eventType,
        product_data: productData,
        cart_total: cartTotal,
        currency: currency,
      });

    if (eventError) throw eventError;

    // Check for abandonment if this is add_to_cart event
    if (eventType === 'add_to_cart' && cartTotal > 0) {
      // Get recent events for this session
      const { data: recentEvents } = await supabase
        .from('cart_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Check if there's a checkout event in the last 10 minutes
      const hasCheckout = recentEvents?.some(e => 
        e.event_type === 'checkout_completed' || e.event_type === 'checkout_started'
      );

      if (!hasCheckout) {
        // Get all cart items
        const cartItems = recentEvents
          ?.filter(e => e.event_type === 'add_to_cart')
          ?.map(e => e.product_data) || [];

        // Create or update abandoned cart record
        const { error: abandonedError } = await supabase
          .from('abandoned_carts')
          .upsert({
            session_id: sessionId,
            agent_id: agentId,
            cart_items: cartItems,
            cart_total: cartTotal,
            currency: currency,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'session_id',
            ignoreDuplicates: false
          });

        if (abandonedError) console.error('Error tracking abandoned cart:', abandonedError);
      }
    }

    // Mark cart as recovered if checkout completed
    if (eventType === 'checkout_completed') {
      await supabase
        .from('abandoned_carts')
        .update({
          recovered: true,
          recovered_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Cart event tracked'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-cart-event:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to track cart event'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
