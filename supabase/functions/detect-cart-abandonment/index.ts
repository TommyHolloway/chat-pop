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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running cart abandonment detection...');

    const abandonmentThresholdMinutes = 15; // Configurable threshold
    const recoveryAttemptCooldownMinutes = 60; // Don't attempt recovery more than once per hour
    const thresholdTimestamp = new Date(Date.now() - abandonmentThresholdMinutes * 60 * 1000).toISOString();
    const cooldownTimestamp = new Date(Date.now() - recoveryAttemptCooldownMinutes * 60 * 1000).toISOString();

    // Find abandoned carts that:
    // 1. Are not recovered
    // 2. Have not had recovery attempted in the last hour
    // 3. Were last updated 15+ minutes ago
    const { data: abandonedCarts } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        agents!inner(
          id,
          proactive_config
        )
      `)
      .eq('recovered', false)
      .lt('last_updated', thresholdTimestamp)
      .or(`recovery_attempted.is.null,recovery_attempted_at.lt.${cooldownTimestamp}`)
      .limit(50); // Process max 50 per run to avoid timeouts

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts eligible for recovery`);

    let triggeredCount = 0;

    for (const cart of abandonedCarts || []) {
      const agent = (cart as any).agents;

      if (!agent?.proactive_config?.enabled) continue;

      const cartTrigger = agent.proactive_config.custom_triggers?.find(
        (t: any) => t.trigger_type === 'cart_abandonment' && t.enabled
      );

      if (cartTrigger) {
        // Create proactive suggestion
        await supabase
          .from('proactive_suggestions')
          .insert({
            agent_id: cart.agent_id,
            session_id: cart.session_id,
            suggestion_type: 'cart_abandonment',
            suggestion_message: cartTrigger.message,
            confidence_score: 0.9,
            behavioral_triggers: {
              cart_total: cart.cart_total,
              cart_items_count: cart.cart_items?.length || 0,
              time_abandoned: abandonmentThresholdMinutes,
            },
          });

        // Mark recovery as attempted
        await supabase
          .from('abandoned_carts')
          .update({
            recovery_attempted: true,
            recovery_attempted_at: new Date().toISOString(),
          })
          .eq('id', cart.id);

        triggeredCount++;
        console.log(`Triggered recovery for cart: ${cart.id}, total: $${cart.cart_total}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cartsFound: abandonedCarts?.length || 0,
      triggeredCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-cart-abandonment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Detection failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
