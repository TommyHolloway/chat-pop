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
    const { shop_domain, agent_id } = await req.json();

    if (!shop_domain) {
      throw new Error('shop_domain is required');
    }

    console.log('Shopify OAuth install initiated for shop:', shop_domain, agent_id ? '(embedded)' : '(public)');

    // Validate shop domain format
    if (!shop_domain.includes('.myshopify.com')) {
      throw new Error('Invalid Shopify domain format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if shop already connected
    const { data: existing } = await supabase
      .from('shopify_connections')
      .select('id, agent_id')
      .eq('shop_domain', shop_domain.toLowerCase())
      .eq('revoked', false)
      .eq('deleted_at', null)
      .maybeSingle();

    if (existing) {
      // If checking for embedded app with agent_id, just return that connection exists
      if (agent_id && existing.agent_id === agent_id) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Shop already connected',
            agent_id: existing.agent_id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ 
          error: 'This shop is already connected',
          agent_id: existing.agent_id 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique state token
    const state = crypto.randomUUID();
    const stateData = agent_id ? `${state}:embedded:${agent_id}` : state;

    // If agent_id provided (embedded flow), use oauth_states table
    // Otherwise use pending_installs (public App Store flow)
    if (agent_id) {
      const { error: insertError } = await supabase
        .from('shopify_oauth_states')
        .insert({
          state,
          agent_id,
          shop_domain: shop_domain.toLowerCase(),
        });

      if (insertError) {
        console.error('Error saving oauth state:', insertError);
        throw insertError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('shopify_pending_installs')
        .insert({
          shop_domain: shop_domain.toLowerCase(),
          state,
        });

      if (insertError) {
        console.error('Error saving pending install:', insertError);
        throw insertError;
      }
    }

    // Build OAuth URL - use regular callback for embedded, anonymous for public
    const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const callbackUrl = agent_id 
      ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`
      : `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback-anonymous`;
    
    const scopes = [
      'read_products',
      'read_orders',
      'read_customers',
      'read_inventory',
      'read_discounts'
    ].join(',');

    const oauthUrl = `https://${shop_domain}/admin/oauth/authorize?` +
      `client_id=${shopifyClientId}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `state=${encodeURIComponent(stateData)}`;

    console.log('OAuth URL generated for shop:', shop_domain, agent_id ? '(embedded)' : '(public)');

    return new Response(
      JSON.stringify({ install_url: oauthUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Anonymous install error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
