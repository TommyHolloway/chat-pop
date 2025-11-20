import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token, agent_id } = await req.json();

    if (!session_token || !agent_id) {
      throw new Error('session_token and agent_id are required');
    }

    console.log('Embedded connect request for agent:', agent_id);

    const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    
    if (!shopifyClientSecret || !shopifyClientId) {
      throw new Error('Shopify credentials not configured');
    }

    // Verify JWT session token
    const secret = new TextEncoder().encode(shopifyClientSecret);
    const { payload } = await jose.jwtVerify(session_token, secret, {
      audience: shopifyClientId,
    });

    const dest = payload.dest as string;
    const shopDomain = dest ? new URL(`https://${dest}`).hostname : null;

    if (!shopDomain) {
      throw new Error('Could not extract shop domain from session token');
    }

    console.log('Session verified for shop:', shopDomain);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('shopify_connections')
      .select('*')
      .eq('shop_domain', shopDomain)
      .eq('agent_id', agent_id)
      .eq('revoked', false)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingConnection) {
      console.log('Connection already exists for shop:', shopDomain);
      return new Response(JSON.stringify({
        success: true,
        message: 'Shop already connected',
        connection: {
          shop_domain: shopDomain,
          connected_at: existingConnection.connected_at,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token from Shopify using offline access token request
    // For embedded apps, we need to request an offline access token
    const accessTokenMutation = `
      mutation {
        appInstallation {
          accessTokens(first: 1) {
            edges {
              node {
                accessToken
                accessScopes {
                  handle
                }
              }
            }
          }
        }
      }
    `;

    // We need to use the session token to make authenticated GraphQL requests
    // The session token allows us to act on behalf of the app installation
    const graphqlResponse = await fetch(`https://${shopDomain}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session_token,
      },
      body: JSON.stringify({ query: accessTokenMutation }),
    });

    if (!graphqlResponse.ok) {
      const errorText = await graphqlResponse.text();
      console.error('Failed to get access token:', errorText);
      throw new Error('Failed to obtain access token from Shopify');
    }

    const graphqlData = await graphqlResponse.json();
    const accessToken = graphqlData?.data?.appInstallation?.accessTokens?.edges?.[0]?.node?.accessToken;
    const grantedScopes = graphqlData?.data?.appInstallation?.accessTokens?.edges?.[0]?.node?.accessScopes?.map((s: any) => s.handle) || [];

    if (!accessToken) {
      console.error('No access token in response:', JSON.stringify(graphqlData, null, 2));
      throw new Error('Could not obtain access token from Shopify');
    }

    console.log('Access token obtained successfully');

    // Fetch shop info
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

    const shopInfoResponse = await fetch(`https://${shopDomain}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: shopQuery }),
    });

    const shopInfoData = await shopInfoResponse.json();
    const shopInfo = shopInfoData?.data?.shop;
    const ownerEmail = shopInfo?.contactEmail || shopInfo?.email;
    const ownerName = shopInfo?.name;

    console.log('Shop info fetched:', ownerName);

    // Encrypt access token
    const encryptedToken = await encryptToken(accessToken);

    // Store connection
    const { data: connection, error: connectionError } = await supabase
      .from('shopify_connections')
      .insert({
        agent_id,
        shop_domain: shopDomain.toLowerCase(),
        encrypted_access_token: encryptedToken,
        shop_owner_email: ownerEmail,
        shop_owner_name: ownerName,
        granted_scopes: grantedScopes,
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Database error:', connectionError);
      throw connectionError;
    }

    console.log('Connection stored in database');

    // Set metafields for App Embed
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
      const metafieldsResponse = await fetch(`https://${shopDomain}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
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
                value: agent_id,
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
        console.log('Metafields set successfully');
      }
    } catch (metafieldError) {
      console.error('Error setting metafields:', metafieldError);
    }

    // Get user_id from agent to update billing_provider
    const { data: agent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', agent_id)
      .single();

    if (agent?.user_id) {
      await supabase
        .from('profiles')
        .update({ billing_provider: 'shopify' })
        .eq('user_id', agent.user_id);
      
      console.log('Set billing_provider to shopify for user:', agent.user_id);
    }

    // Register webhooks (async, don't block response)
    registerWebhooks(shopDomain, accessToken, agent_id).catch(console.error);

    // Trigger initial product sync (async)
    supabase.functions.invoke('sync-shopify-products', {
      body: { 
        agent_id,
        incremental: false
      }
    }).then(() => {
      console.log('Initial product sync triggered');
    }).catch(error => {
      console.error('Failed to trigger product sync:', error);
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Shop connected successfully',
      connection: {
        shop_domain: shopDomain,
        shop_name: ownerName,
        connected_at: connection.connected_at,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Embedded connect error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to connect shop',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function registerWebhooks(shop: string, token: string, agentId: string) {
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

  for (const webhook of webhooks) {
    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json',
          },
        }),
      });

      if (response.ok) {
        console.log(`Webhook registered: ${webhook.topic}`);
      } else {
        console.error(`Failed to register ${webhook.topic}:`, await response.text());
      }
    } catch (err) {
      console.error(`Failed to register ${webhook.topic}:`, err);
    }
  }
}
