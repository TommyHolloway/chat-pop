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

    // Check for abandonment if this is add_to_cart or cart_updated event
    if ((eventType === 'add_to_cart' || eventType === 'cart_updated') && cartTotal > 0) {
      const abandonmentThresholdMinutes = 10;
      const thresholdTimestamp = new Date(Date.now() - abandonmentThresholdMinutes * 60 * 1000).toISOString();
      
      // Get the most recent checkout event for this session
      const { data: recentCheckout } = await supabase
        .from('cart_events')
        .select('created_at')
        .eq('session_id', sessionId)
        .in('event_type', ['checkout_completed', 'checkout_started'])
        .gte('created_at', thresholdTimestamp)
        .order('created_at', { ascending: false })
        .limit(1);

      // Only mark as abandoned if no checkout event in the last 10 minutes
      if (!recentCheckout || recentCheckout.length === 0) {
        // Get all recent cart items (last 30 minutes)
        const { data: recentCartEvents } = await supabase
          .from('cart_events')
          .select('product_data, cart_total')
          .eq('session_id', sessionId)
          .in('event_type', ['add_to_cart', 'cart_updated'])
          .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        const latestCart = recentCartEvents?.[0];
        const cartItems = recentCartEvents
          ?.filter(e => e.product_data)
          ?.map(e => e.product_data) || [];

        // Create or update abandoned cart record
        const { error: abandonedError } = await supabase
          .from('abandoned_carts')
          .upsert({
            session_id: sessionId,
            agent_id: agentId,
            cart_items: cartItems,
            cart_total: latestCart?.cart_total || cartTotal,
            currency: currency,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'session_id',
            ignoreDuplicates: false
          });

        if (abandonedError) {
          console.error('Error tracking abandoned cart:', abandonedError);
        } else {
          console.log(`Abandoned cart tracked for session ${sessionId}: $${cartTotal}`);
        }
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
