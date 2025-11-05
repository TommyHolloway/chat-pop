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

    console.log('Webhook received:', { topic, shop });

    // Verify HMAC
    if (!await verifyHmac(body, hmac)) {
      console.error('HMAC verification failed for webhook');
      return new Response('Forbidden', { status: 403 });
    }

    const payload = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store webhook event
    await supabase.from('shopify_webhook_events').insert({
      shop_domain: shop,
      topic,
      payload,
    });

    // Process specific events
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        console.log('Processing order webhook');
        // Trigger order import - find agent_id from connection
        const { data: connection } = await supabase
          .from('shopify_connections')
          .select('agent_id')
          .eq('shop_domain', shop.toLowerCase())
          .single();

        if (connection?.agent_id) {
          await supabase.functions.invoke('import-shopify-orders', {
            body: { agent_id: connection.agent_id },
          });
        }
        break;

      case 'inventory_levels/update':
        console.log('Processing inventory webhook');
        // Trigger inventory sync
        const { data: invConnection } = await supabase
          .from('shopify_connections')
          .select('agent_id')
          .eq('shop_domain', shop.toLowerCase())
          .single();

        if (invConnection?.agent_id) {
          await supabase.functions.invoke('sync-inventory-levels', {
            body: { agent_id: invConnection.agent_id },
          });
        }
        break;
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});
