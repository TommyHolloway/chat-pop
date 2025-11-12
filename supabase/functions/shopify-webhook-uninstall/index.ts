import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifyHmac(body: string, hmacHeader: string): Promise<boolean> {
  const secret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
  if (!secret) return false;

  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return computedHmac === hmacHeader;
}

serve(async (req) => {
  try {
    const body = await req.text();
    const hmac = req.headers.get('X-Shopify-Hmac-Sha256') || '';
    const topic = req.headers.get('X-Shopify-Topic') || '';
    const shop = req.headers.get('X-Shopify-Shop-Domain') || '';

    console.log('App uninstall webhook received:', { topic, shop });

    // Verify HMAC
    if (!await verifyHmac(body, hmac)) {
      console.error('HMAC verification failed for uninstall webhook');
      return new Response('Forbidden', { status: 403 });
    }

    // Only process app/uninstalled events
    if (topic !== 'app/uninstalled') {
      console.log('Ignoring non-uninstall topic:', topic);
      return new Response('OK', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find connection by shop domain
    const { data: connection } = await supabase
      .from('shopify_connections')
      .select('agent_id')
      .eq('shop_domain', shop.toLowerCase())
      .eq('deleted_at', null)
      .single();

    if (!connection) {
      console.log('No connection found for shop:', shop);
      return new Response('OK', { status: 200 });
    }

    console.log('Processing uninstall for agent:', connection.agent_id);

    // Get user_id from agent
    const { data: agent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', connection.agent_id)
      .single();

    if (!agent?.user_id) {
      console.error('No user found for agent:', connection.agent_id);
      return new Response('OK', { status: 200 });
    }

    // Soft delete connection and mark as revoked
    const { error: revokeError } = await supabase
      .from('shopify_connections')
      .update({ 
        revoked: true,
        deleted_at: new Date().toISOString()
      })
      .eq('agent_id', connection.agent_id);

    if (revokeError) {
      console.error('Error revoking connection:', revokeError);
      throw revokeError;
    }

    // Cancel any active Shopify subscriptions
    await supabase
      .from('shopify_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('agent_id', connection.agent_id)
      .neq('status', 'cancelled');

    // Check if user has other active shops
    const { data: otherShops } = await supabase
      .from('shopify_connections')
      .select('id')
      .eq('revoked', false)
      .is('deleted_at', null)
      .neq('agent_id', connection.agent_id);

    // If no other shops, downgrade to free plan and switch to Stripe
    if (!otherShops || otherShops.length === 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          billing_provider: 'stripe',
          plan: 'free'
        })
        .eq('user_id', agent.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }

    // Log uninstall event
    await supabase
      .from('activity_logs')
      .insert({
        action: 'shopify_app_uninstalled',
        user_id: agent.user_id,
        details: {
          shop_domain: shop,
          agent_id: connection.agent_id,
          had_other_shops: (otherShops?.length || 0) > 0
        }
      });

    console.log('Successfully handled app uninstall for user:', agent.user_id);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Uninstall webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});
