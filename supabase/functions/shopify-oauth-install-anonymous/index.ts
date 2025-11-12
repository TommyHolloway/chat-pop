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
    const { shop_domain } = await req.json();

    if (!shop_domain) {
      throw new Error('shop_domain is required');
    }

    console.log('Anonymous Shopify OAuth install initiated for shop:', shop_domain);

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

    // Save to pending installs with 10-minute expiry
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

    // Build OAuth URL pointing to anonymous callback
    const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback-anonymous`;
    
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
      `state=${state}`;

    console.log('Anonymous OAuth URL generated for shop:', shop_domain);

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
