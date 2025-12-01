import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-GCM decryption helper
async function decryptToken(encryptedData: string): Promise<string> {
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

  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop_domain, agent_id } = await req.json();

    if (!shop_domain && !agent_id) {
      throw new Error('Either shop_domain or agent_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Shopify connection
    let query = supabase
      .from('shopify_connections')
      .select('*')
      .eq('status', 'active');

    if (shop_domain) {
      query = query.eq('shop_domain', shop_domain);
    } else {
      query = query.eq('agent_id', agent_id);
    }

    const { data: connection, error: connectionError } = await query.maybeSingle();

    if (connectionError || !connection) {
      throw new Error('Active Shopify connection not found');
    }

    // Decrypt access token
    const accessToken = await decryptToken(connection.encrypted_access_token);

    // Import shared GraphQL helper
    const { registerWebhooks } = await import('../_shared/shopify-graphql.ts');
    
    // Define webhooks
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
    const webhooksToRegister = [
      { topic: 'app/uninstalled', address: `${webhookUrl}/shopify-webhook-uninstall` },
      { topic: 'customers/data_request', address: `${webhookUrl}/shopify-webhook-gdpr` },
      { topic: 'customers/redact', address: `${webhookUrl}/shopify-webhook-gdpr` },
      { topic: 'shop/redact', address: `${webhookUrl}/shopify-webhook-gdpr` },
      { topic: 'app_subscriptions/update', address: `${webhookUrl}/shopify-subscription-webhook` },
      { topic: 'orders/create', address: `${webhookUrl}/shopify-webhook` },
      { topic: 'orders/updated', address: `${webhookUrl}/shopify-webhook` },
      { topic: 'products/create', address: `${webhookUrl}/shopify-webhook` },
      { topic: 'products/update', address: `${webhookUrl}/shopify-webhook` },
      { topic: 'products/delete', address: `${webhookUrl}/shopify-webhook` },
      { topic: 'inventory_levels/update', address: `${webhookUrl}/shopify-webhook` },
    ];

    // Register webhooks using GraphQL
    const results = await registerWebhooks(connection.shop_domain, accessToken, webhooksToRegister);

    return new Response(JSON.stringify({
      success: true,
      shop_domain: connection.shop_domain,
      webhooks: results,
      summary: {
        total: webhooks.length,
        registered: results.filter(r => r.status === 'registered').length,
        already_exists: results.filter(r => r.status === 'already_exists').length,
        failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook registration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to register webhooks',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
