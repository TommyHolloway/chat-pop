import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logSecurityEvent } from '../_shared/security-logger.ts';

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
  // Extract security context
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const shop = url.searchParams.get('shop');
    const state = url.searchParams.get('state');

    if (!code || !shop || !state) {
      console.error('OAuth callback missing required parameters');
      
      // Log missing parameters
      await logSecurityEvent({
        event_type: 'AUTH_FAILURE',
        function_name: 'shopify-oauth-callback',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          error: 'missing_required_parameters',
          action: 'oauth_callback_failed'
        },
        severity: 'medium'
      }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);
      
      return redirectToApp('/workspace/integrations?error=missing_params');
    }

    // Input validation
    if (code.length > 500 || shop.length > 255 || state.length > 100) {
      console.error('OAuth callback parameter length exceeded');
      
      // Log parameter length violation
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        function_name: 'shopify-oauth-callback',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          error: 'parameter_length_exceeded',
          action: 'oauth_callback_failed'
        },
        severity: 'high'
      }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);
      
      return redirectToApp('/workspace/integrations?error=invalid_params');
    }

    // Validate shop domain format
    if (!shop.endsWith('.myshopify.com') || shop.includes('..') || shop.includes('//')) {
      console.error('Invalid shop domain in OAuth callback:', shop);
      
      // Log invalid shop domain
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        function_name: 'shopify-oauth-callback',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          error: 'invalid_shop_domain',
          shop_attempted: shop,
          action: 'oauth_callback_failed'
        },
        severity: 'high'
      }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);
      
      return redirectToApp('/workspace/integrations?error=invalid_shop');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract base state (handle embedded format: uuid:embedded:agent_id)
    const baseState = state.split(':')[0];
    const isEmbedded = state.includes(':embedded');

    // Validate state (CSRF protection)
    const { data: stateRecord } = await supabase
      .from('shopify_oauth_states')
      .select('*')
      .eq('state', baseState)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!stateRecord) {
      console.error('Invalid or expired state:', state);
      
      // Log invalid/expired state (possible CSRF attempt)
      await logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        function_name: 'shopify-oauth-callback',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          error: 'invalid_or_expired_state',
          shop: shop,
          action: 'oauth_callback_failed'
        },
        severity: 'high'
      }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);
      
      return redirectToApp('/workspace/integrations?error=invalid_state');
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
    const access_token = tokenData.access_token;

    // Fetch shop info including owner details
    const shopQuery = `
      query {
        shop {
          id
          name
          email
          contactEmail
        }
      }
    `;

    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: shopQuery }),
    });

    const shopInfoData = await shopInfoResponse.json();
    const shopInfo = shopInfoData?.data?.shop;
    const ownerEmail = shopInfo?.contactEmail || shopInfo?.email;
    const ownerName = shopInfo?.name;

    // Encrypt token
    const encryptedToken = await encryptToken(access_token);
    
    const scopesArray = tokenData.scope?.split(',') || [];

    // Store connection with owner info
    const { error: connectionError } = await supabase
      .from('shopify_connections')
      .insert({
        agent_id: stateRecord.agent_id,
        shop_domain: shop.toLowerCase(),
        encrypted_access_token: encryptedToken,
        shop_owner_email: ownerEmail,
        shop_owner_name: ownerName,
        granted_scopes: scopesArray,
      });

    if (connectionError) {
      console.error('Database connection error:', connectionError);
      throw connectionError;
    }

    console.log('Shopify connection stored successfully');

    // Set agent_id in shop metafields for App Embed
    const metafieldMutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const metafieldsResponse = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: metafieldMutation,
          variables: {
            metafields: [
              {
                ownerId: shopInfo.id,
                namespace: "chatpop",
                key: "agent_id",
                value: stateRecord.agent_id,
                type: "single_line_text_field"
              },
              {
                ownerId: shopInfo.id,
                namespace: "chatpop",
                key: "widget_url",
                value: Deno.env.get('APP_BASE_URL') || 'https://chatpop.lovable.app',
                type: "single_line_text_field"
              }
            ]
          }
        }),
      });

      const metafieldData = await metafieldsResponse.json();
      if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error('Metafield errors:', metafieldData.data.metafieldsSet.userErrors);
      } else {
        console.log('Metafields set successfully for App Embed');
      }
    } catch (metafieldError) {
      console.error('Error setting metafields:', metafieldError);
      // Don't fail the whole flow if metafields fail
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
      .eq('state', baseState);

    // Subscribe to webhooks (async, don't wait)
    registerWebhooks(shop, access_token, stateRecord.agent_id).catch(console.error);

    // Trigger initial product sync (async, don't wait)
    const supabaseForSync = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    supabaseForSync.functions.invoke('sync-shopify-products', {
      body: { 
        agent_id: stateRecord.agent_id,
        incremental: false // Full sync on initial connection
      }
    }).then(result => {
      console.log('Initial product sync triggered:', result);
    }).catch(error => {
      console.error('Failed to trigger initial product sync:', error);
    });

    console.log('Shopify connection successful for agent:', stateRecord.agent_id);

    // Log successful OAuth callback
    await logSecurityEvent({
      event_type: 'AUTH_SUCCESS',
      function_name: 'shopify-oauth-callback',
      agent_id: stateRecord.agent_id,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: { 
        shop_domain: shop,
        embedded: isEmbedded,
        action: 'oauth_callback_success'
      },
      severity: 'low'
    }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);

    // Redirect back to app - use embedded route if in embedded context
    const redirectPath = isEmbedded 
      ? `/shopify-admin/settings?shopify_connected=true&embed_ready=true&agent_id=${stateRecord.agent_id}`
      : `/workspace/integrations?shopify_connected=true&embed_ready=true&agent_id=${stateRecord.agent_id}`;
    
    return redirectToApp(redirectPath);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    // Log failed OAuth callback
    await logSecurityEvent({
      event_type: 'AUTH_FAILURE',
      function_name: 'shopify-oauth-callback',
      ip_address: ipAddress,
      user_agent: userAgent,
      details: { 
        error: error.message,
        action: 'oauth_callback_failed'
      },
      severity: 'medium'
    }, Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).catch(console.error);
    
    return redirectToApp(`/workspace/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

function redirectToApp(path: string): Response {
  const appUrl = `${Deno.env.get('APP_BASE_URL')}${path}`;
  return new Response(null, {
    status: 302,
    headers: { Location: appUrl },
  });
}

async function registerWebhooks(shop: string, token: string, agentId: string) {
  // Import shared GraphQL helper
  const { registerWebhooks: registerWebhooksGraphQL } = await import('../_shared/shopify-graphql.ts');
  
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  
  const webhooks = [
    { topic: 'orders/create', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'orders/updated', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'products/create', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'products/update', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'products/delete', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'inventory_levels/update', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'app_subscriptions/update', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'app/uninstalled', address: `${webhookUrl}/shopify-webhook-uninstall` },
    { topic: 'customers/data_request', address: `${webhookUrl}/shopify-webhook-gdpr` },
    { topic: 'customers/redact', address: `${webhookUrl}/shopify-webhook-gdpr` },
    { topic: 'shop/redact', address: `${webhookUrl}/shopify-webhook-gdpr` },
  ];

  const results = await registerWebhooksGraphQL(shop, token, webhooks);
  
  console.log('Webhook registration summary:', {
    total: results.length,
    registered: results.filter(r => r.status === 'registered').length,
    already_exists: results.filter(r => r.status === 'already_exists').length,
    failed: results.filter(r => r.status === 'failed').length,
  });
}
