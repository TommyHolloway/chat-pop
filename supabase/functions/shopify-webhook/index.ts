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
        console.log('Processing new order webhook with real-time attribution');
        
        // Store order immediately
        const orderId = payload.id?.toString();
        const orderNumber = payload.name || payload.order_number;
        const orderData = {
          agent_id: connection.agent_id,
          order_id: orderId,
          order_number: orderNumber,
          customer_email: payload.customer?.email,
          customer_shopify_id: payload.customer?.id?.toString(),
          customer_name: payload.customer ? 
            `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() : null,
          line_items: payload.line_items?.map((item: any) => ({
            id: item.id?.toString(),
            title: item.title,
            quantity: item.quantity,
            sku: item.sku,
            price: item.price,
            variant_id: item.variant_id?.toString(),
            variant_title: item.variant_title,
            product_id: item.product_id?.toString(),
          })) || [],
          total_price: parseFloat(payload.total_price || '0'),
          currency: payload.currency || 'USD',
          tags: payload.tags?.split(',').map((t: string) => t.trim()) || [],
          note: payload.note,
          order_created_at: payload.created_at,
        };

        await supabase.from('shopify_orders').upsert(orderData, {
          onConflict: 'agent_id,order_id',
        });

        // Run attribution immediately
        await supabase.functions.invoke('attribute-order-to-conversation', {
          body: {
            agentId: connection.agent_id,
            order: {
              id: `gid://shopify/Order/${orderId}`,
              createdAt: payload.created_at,
              customer: payload.customer,
              lineItems: {
                edges: payload.line_items?.map((item: any) => ({
                  node: {
                    id: `gid://shopify/LineItem/${item.id}`,
                    title: item.title,
                    quantity: item.quantity,
                    variant: {
                      id: `gid://shopify/ProductVariant/${item.variant_id}`,
                      product: {
                        id: `gid://shopify/Product/${item.product_id}`,
                        title: item.product_id,
                      },
                    },
                  },
                })) || [],
              },
              totalPriceSet: {
                shopMoney: {
                  amount: payload.total_price,
                  currencyCode: payload.currency || 'USD',
                },
              },
            },
            immediate: true,
          },
        });

        // Update metrics using atomic function
        const orderDate = new Date(payload.created_at).toISOString().split('T')[0];
        await supabase.rpc('increment_daily_metrics', {
          p_agent_id: connection.agent_id,
          p_date: orderDate,
          p_revenue: parseFloat(payload.total_price || '0'),
          p_orders: 1,
        });

        console.log(`Order ${orderId} processed with real-time attribution`);
        break;

      case 'orders/updated':
        console.log('Processing order update webhook');
        // For updates, just refresh the order data
        await supabase.functions.invoke('import-shopify-orders', {
          body: { agentId: connection.agent_id, days: 7 },
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
