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

    // Get agent_id from shop connection
    const { data: connection } = await supabase
      .from('shopify_connections')
      .select('agent_id')
      .eq('shop_domain', shop.toLowerCase())
      .single();

    if (!connection?.agent_id) {
      console.error('No agent found for shop:', shop);
      return new Response('OK', { status: 200 });
    }

    // Process specific events
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        console.log('Processing order webhook');
        await supabase.functions.invoke('import-shopify-orders', {
          body: { agent_id: connection.agent_id },
        });
        break;

      case 'inventory_levels/update':
        console.log('Processing inventory webhook');
        await supabase.functions.invoke('sync-inventory-levels', {
          body: { agent_id: connection.agent_id },
        });
        break;

      case 'products/create':
      case 'products/update':
        console.log('Processing product webhook:', topic);
        // Trigger incremental product sync
        await supabase.functions.invoke('sync-shopify-products', {
          body: { 
            agent_id: connection.agent_id,
            incremental: true 
          },
        });
        break;

      case 'products/delete':
        console.log('Processing product deletion webhook');
        // Mark product as inactive instead of deleting
        const productId = payload.id?.toString();
        if (productId) {
          await supabase
            .from('agent_product_catalog')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('agent_id', connection.agent_id)
            .eq('product_id', productId);
        }
        break;
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});
