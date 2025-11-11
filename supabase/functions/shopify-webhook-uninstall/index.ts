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

    // Mark connection as revoked
    const { error: revokeError } = await supabase
      .from('shopify_connections')
      .update({ revoked: true })
      .eq('agent_id', connection.agent_id);

    if (revokeError) {
      console.error('Error revoking connection:', revokeError);
      throw revokeError;
    }

    // Clear billing_provider from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ billing_provider: null })
      .eq('user_id', agent.user_id);

    if (profileError) {
      console.error('Error clearing billing_provider:', profileError);
      throw profileError;
    }

    console.log('Successfully handled app uninstall for user:', agent.user_id);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Uninstall webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});
