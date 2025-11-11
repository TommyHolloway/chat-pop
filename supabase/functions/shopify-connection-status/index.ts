import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import decryption helper
async function decryptToken(encryptedBase64: string): Promise<string> {
  const keyBase64 = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('SHOPIFY_ENCRYPTION_KEY not configured');
  }

  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id } = await req.json();

    if (!agent_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch connection
    const { data: connection, error: connError } = await supabase
      .from('shopify_connections')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('revoked', false)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          connected: false,
          error: 'No active connection found' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt and test token
    try {
      const token = await decryptToken(connection.encrypted_access_token);
      
      // Make a simple API call to verify token is still valid
      const shopInfoResponse = await fetch(
        `https://${connection.shop_domain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: '{ shop { name myshopifyDomain } }',
          }),
        }
      );

      const shopInfoData = await shopInfoResponse.json();
      
      if (shopInfoData.errors) {
        console.error('Token verification failed:', shopInfoData.errors);
        
        // Mark connection as revoked if token is invalid
        await supabase
          .from('shopify_connections')
          .update({ revoked: true })
          .eq('agent_id', agent_id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: 'Connection invalid - token revoked',
            details: shopInfoData.errors
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last_verified timestamp
      await supabase
        .from('shopify_connections')
        .update({ last_verified: new Date().toISOString() })
        .eq('agent_id', agent_id);

      return new Response(
        JSON.stringify({ 
          success: true,
          connected: true,
          shop_domain: connection.shop_domain,
          shop_name: shopInfoData.data?.shop?.name,
          connected_at: connection.connected_at,
          last_verified: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (decryptError) {
      console.error('Token decryption or verification failed:', decryptError);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          connected: false,
          error: 'Connection verification failed',
          details: decryptError.message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Connection status check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
