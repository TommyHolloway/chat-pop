import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// AES-GCM encryption helper
async function encryptToken(plaintext: string): Promise<string> {
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
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  );

  // Concatenate IV + ciphertext
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const shop = url.searchParams.get('shop');
    const state = url.searchParams.get('state');

    if (!code || !shop || !state) {
      return redirectToApp('?error=missing_params');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate state (CSRF protection)
    const { data: stateRecord } = await supabase
      .from('shopify_oauth_states')
      .select('*')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!stateRecord) {
      console.error('Invalid or expired state:', state);
      return redirectToApp('?error=invalid_state');
    }

    console.log('OAuth callback received for shop:', shop);

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('SHOPIFY_CLIENT_ID'),
        client_secret: Deno.env.get('SHOPIFY_CLIENT_SECRET'),
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      throw new Error('Token exchange failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Verify token by fetching shop info
    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ shop { name myshopifyDomain } }',
      }),
    });

    const shopInfoData = await shopInfoResponse.json();
    if (shopInfoData.errors) {
      console.error('Token verification failed:', shopInfoData.errors);
      throw new Error('Token verification failed');
    }

    console.log('Token verified for shop:', shopInfoData.data?.shop?.name);

    // Encrypt token
    const encryptedToken = await encryptToken(accessToken);

    // Store connection
    const { error: upsertError } = await supabase
      .from('shopify_connections')
      .upsert({
        agent_id: stateRecord.agent_id,
        shop_domain: shop.toLowerCase(),
        encrypted_access_token: encryptedToken,
        granted_scopes: scope.split(','),
        connected_at: new Date().toISOString(),
        last_verified: new Date().toISOString(),
        revoked: false,
      }, {
        onConflict: 'agent_id',
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw upsertError;
    }

    // Get user_id from agent to update billing_provider
    const { data: agent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', stateRecord.agent_id)
      .single();

    if (agent?.user_id) {
      // Set billing_provider to 'shopify' on successful connection
      await supabase
        .from('profiles')
        .update({ billing_provider: 'shopify' })
        .eq('user_id', agent.user_id);
      
      console.log('Set billing_provider to shopify for user:', agent.user_id);
    }

    // Clear old shopify_config from agents table (migration path)
    await supabase
      .from('agents')
      .update({ shopify_config: {} })
      .eq('id', stateRecord.agent_id);

    // Delete used state
    await supabase
      .from('shopify_oauth_states')
      .delete()
      .eq('state', state);

    // Subscribe to webhooks (async, don't wait)
    registerWebhooks(shop, accessToken, stateRecord.agent_id).catch(console.error);

    console.log('Shopify connection successful for agent:', stateRecord.agent_id);

    // Redirect back to app
    return redirectToApp(`?shopify_connected=true&agent_id=${stateRecord.agent_id}`);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return redirectToApp(`?error=${encodeURIComponent(error.message)}`);
  }
});

function redirectToApp(params: string): Response {
  const appUrl = `${Deno.env.get('APP_BASE_URL')}/workspace/integrations${params}`;
  return new Response(null, {
    status: 302,
    headers: { Location: appUrl },
  });
}

async function registerWebhooks(shop: string, token: string, agentId: string) {
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-webhook`;
  
  const topics = [
    'orders/create',
    'orders/updated',
    'products/update',
    'inventory_levels/update',
    'app/uninstalled', // Critical for billing_provider cleanup
    'app_subscriptions/update', // For Shopify Billing API
  ];

  for (const topic of topics) {
    try {
      const response = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${webhookUrl}?agent_id=${agentId}`,
            format: 'json',
          },
        }),
      });

      if (response.ok) {
        console.log(`Webhook registered: ${topic}`);
      } else {
        console.error(`Failed to register webhook ${topic}:`, await response.text());
      }
    } catch (err) {
      console.error(`Failed to register webhook ${topic}:`, err);
    }
  }
}
