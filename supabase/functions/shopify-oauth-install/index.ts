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
    const { shop_domain, agent_id, embedded } = await req.json();

    if (!shop_domain || !agent_id) {
      throw new Error('shop_domain and agent_id are required');
    }

    // Input validation
    if (typeof shop_domain !== 'string' || typeof agent_id !== 'string') {
      throw new Error('Invalid input types');
    }

    if (shop_domain.length > 255 || agent_id.length > 50) {
      throw new Error('Input length exceeded');
    }

    // Normalize shop domain
    const normalizedShop = shop_domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Strict domain validation
    if (!normalizedShop.endsWith('.myshopify.com')) {
      throw new Error('Invalid shop domain. Must be yourstore.myshopify.com');
    }

    // Additional security: check for suspicious patterns
    if (normalizedShop.includes('..') || normalizedShop.includes('//')) {
      throw new Error('Invalid shop domain format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify agent exists and user owns it
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', agent_id)
      .maybeSingle();

    if (!agent || agent.user_id !== user.id) {
      throw new Error('Agent not found or unauthorized');
    }

    // Generate random state (CSRF token) with embedded context
    const state = crypto.randomUUID();
    const stateData = embedded ? `${state}:embedded` : state;

    // Save state in database
    const { error: stateError } = await supabase
      .from('shopify_oauth_states')
      .insert({
        state,
        agent_id,
        shop_domain: normalizedShop,
      });

    if (stateError) throw stateError;

    // Build OAuth install URL
    const scopes = 'read_products,read_orders,read_customers,read_inventory,read_discounts';
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`;
    
    const installUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
    installUrl.searchParams.set('client_id', Deno.env.get('SHOPIFY_CLIENT_ID')!);
    installUrl.searchParams.set('scope', scopes);
    installUrl.searchParams.set('redirect_uri', redirectUri);
    installUrl.searchParams.set('state', stateData);

    console.log('OAuth install initiated for shop:', normalizedShop);

    return new Response(JSON.stringify({
      success: true,
      install_url: installUrl.toString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('OAuth install error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate install URL'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
