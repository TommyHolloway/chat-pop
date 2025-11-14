import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token } = await req.json();

    if (!session_token) {
      throw new Error('session_token is required');
    }

    const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    if (!shopifyClientSecret) {
      throw new Error('SHOPIFY_CLIENT_SECRET not configured');
    }

    // Verify JWT signature using Shopify client secret
    const secret = new TextEncoder().encode(shopifyClientSecret);
    
    try {
      const { payload } = await jose.jwtVerify(session_token, secret, {
        audience: Deno.env.get('SHOPIFY_CLIENT_ID'),
      });

      // Extract shop domain from the 'dest' claim
      const dest = payload.dest as string;
      const shopDomain = dest ? new URL(`https://${dest}`).hostname : null;

      console.log('Session token verified for shop:', shopDomain);

      // Get agent associated with this shop
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: connection } = await supabase
        .from('shopify_connections')
        .select('agent_id, shop_domain, shop_owner_email, shop_name')
        .eq('shop_domain', shopDomain)
        .eq('status', 'active')
        .maybeSingle();

      return new Response(JSON.stringify({
        success: true,
        valid: true,
        shop_domain: shopDomain,
        sub: payload.sub,
        iss: payload.iss,
        agent_id: connection?.agent_id,
        shop_name: connection?.shop_name,
        shop_owner_email: connection?.shop_owner_email,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.message);
      return new Response(JSON.stringify({
        success: true,
        valid: false,
        error: 'Invalid or expired session token',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Session verification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to verify session',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
