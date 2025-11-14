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

    // Define webhooks
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
    const webhooks = [
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

    const results = [];

    // Register each webhook
    for (const webhook of webhooks) {
      try {
        const response = await fetch(
          `https://${connection.shop_domain}/admin/api/2024-01/webhooks.json`,
          {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              webhook: {
                topic: webhook.topic,
                address: webhook.address,
                format: 'json',
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            topic: webhook.topic,
            status: 'registered',
            id: data.webhook?.id,
          });
          console.log(`Webhook registered: ${webhook.topic}`);
        } else {
          const errorText = await response.text();
          // Check if webhook already exists
          if (errorText.includes('already taken') || errorText.includes('already exists')) {
            results.push({
              topic: webhook.topic,
              status: 'already_exists',
            });
            console.log(`Webhook already exists: ${webhook.topic}`);
          } else {
            results.push({
              topic: webhook.topic,
              status: 'failed',
              error: errorText,
            });
            console.error(`Failed to register ${webhook.topic}:`, errorText);
          }
        }
      } catch (err: any) {
        results.push({
          topic: webhook.topic,
          status: 'error',
          error: err.message,
        });
        console.error(`Error registering ${webhook.topic}:`, err);
      }
    }

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
