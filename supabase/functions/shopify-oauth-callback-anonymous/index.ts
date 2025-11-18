import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// AES-GCM encryption for access tokens
async function encryptToken(plaintext: string): Promise<string> {
  const keyBase64 = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  if (!keyBase64) throw new Error('SHOPIFY_ENCRYPTION_KEY not configured');

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

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function registerWebhooks(shop: string, token: string, agentId: string) {
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  
  const webhooks = [
    { topic: 'orders/create', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'orders/updated', address: `${webhookUrl}/shopify-webhook` },
    { topic: 'products/update', address: `${webhookUrl}/shopify-webhook` },
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

      if (!response.ok) {
        console.error(`Failed to register ${webhook.topic}:`, await response.text());
      } else {
        console.log(`Registered webhook: ${webhook.topic}`);
      }
    } catch (error) {
      console.error(`Error registering ${webhook.topic}:`, error);
    }
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const shop = url.searchParams.get('shop');

    if (!code || !state || !shop) {
      return redirectToApp('error=missing_parameters');
    }

    console.log('Anonymous OAuth callback received for shop:', shop);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate state from pending installs
    const { data: pendingInstall, error: stateError } = await supabase
      .from('shopify_pending_installs')
      .select('*')
      .eq('state', state)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError || !pendingInstall) {
      console.error('Invalid or expired state:', stateError);
      return redirectToApp('error=invalid_state');
    }

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
      return redirectToApp('error=token_exchange_failed');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch shop owner info
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

    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
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

    console.log('Shop owner email:', ownerEmail);

    // Check if user exists by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, id')
      .eq('email', ownerEmail)
      .maybeSingle();

    let userId: string;
    let agentId: string;
    let workspaceId: string;
    let isNewUser = false;

    if (!existingProfile) {
      // Path A: New User
      console.log('Creating new user account for:', ownerEmail);
      isNewUser = true;

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ownerEmail,
        email_confirm: true,
        user_metadata: {
          shop_domain: shop,
          created_via: 'shopify_app_store',
        },
      });

      if (authError || !authData.user) {
        console.error('Failed to create user:', authError);
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;

      // Create profile
      await supabase.from('profiles').insert({
        user_id: userId,
        email: ownerEmail,
        display_name: ownerName,
        billing_provider: 'shopify',
        plan: 'free',
      });

      // Create default workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          user_id: userId,
          name: 'Default Workspace',
        })
        .select()
        .single();

      if (wsError || !workspace) {
        throw new Error('Failed to create workspace');
      }

      workspaceId = workspace.id;

      // Create default agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          name: 'Shop Assistant',
          description: 'Your AI-powered shopping assistant',
          instructions: 'You are a helpful shopping assistant. Help customers find products and answer questions.',
          status: 'active',
        })
        .select()
        .single();

      if (agentError || !agent) {
        throw new Error('Failed to create agent');
      }

      agentId = agent.id;

      // Send magic link for password setup
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: ownerEmail,
      });

    } else {
      // Path B: Existing User
      console.log('Linking shop to existing user:', ownerEmail);
      userId = existingProfile.user_id;

      // Find user's first active agent
      const { data: agents } = await supabase
        .from('agents')
        .select('id, workspace_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (!agents || agents.length === 0) {
        // Create new workspace and agent if none exist
        const { data: workspace } = await supabase
          .from('workspaces')
          .insert({ user_id: userId, name: 'Default Workspace' })
          .select()
          .single();

        workspaceId = workspace.id;

        const { data: agent } = await supabase
          .from('agents')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            name: 'Shop Assistant',
            instructions: 'You are a helpful shopping assistant.',
            status: 'active',
          })
          .select()
          .single();

        agentId = agent.id;
      } else {
        agentId = agents[0].id;
        workspaceId = agents[0].workspace_id;
      }
    }

    // Encrypt and store access token
    const encryptedToken = await encryptToken(access_token);

    await supabase.from('shopify_connections').insert({
      agent_id: agentId,
      shop_domain: shop.toLowerCase(),
      encrypted_access_token: encryptedToken,
      shop_owner_email: ownerEmail,
      shop_owner_name: ownerName,
      granted_scopes: ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'read_discounts'],
    });

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
      const metafieldsResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
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
                value: agentId,
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

    // Mark pending install as completed
    await supabase
      .from('shopify_pending_installs')
      .update({ completed: true })
      .eq('state', state);

    // Register webhooks (async, don't wait)
    registerWebhooks(shop, access_token, agentId);

    console.log('Anonymous OAuth completed successfully for:', shop);

    if (isNewUser) {
      return redirectToApp(`shopify_install=success&new_user=true&embed_ready=true&agent_id=${agentId}`);
    } else {
      return redirectToApp(`shopify_install=success&linked=true&embed_ready=true&agent_id=${agentId}`);
    }

  } catch (error) {
    console.error('Anonymous callback error:', error);
    return redirectToApp(`error=${encodeURIComponent(error.message)}`);
  }
});

function redirectToApp(params: string): Response {
  const appUrl = Deno.env.get('APP_BASE_URL') || 'https://yourapp.lovable.app';
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${appUrl}/shopify-onboarding?${params}`,
    },
  });
}
