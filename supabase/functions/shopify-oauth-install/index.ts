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

    if (!shop_domain || !agent_id) {
      throw new Error('shop_domain and agent_id are required');
    }

    // Normalize shop domain
    const normalizedShop = shop_domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    if (!normalizedShop.endsWith('.myshopify.com')) {
      throw new Error('Invalid shop domain. Must be yourstore.myshopify.com');
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
      .select('id, workspace_id, workspaces(user_id)')
      .eq('id', agent_id)
      .single();

    if (!agent || agent.workspaces?.user_id !== user.id) {
      throw new Error('Agent not found or unauthorized');
    }

    // Generate random state (CSRF token)
    const state = crypto.randomUUID();

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
    installUrl.searchParams.set('state', state);

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
