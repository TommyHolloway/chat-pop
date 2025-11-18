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

    console.log('GDPR webhook received:', { topic, shop });

    // Verify HMAC
    if (!await verifyHmac(body, hmac)) {
      console.error('HMAC verification failed for GDPR webhook');
      return new Response('Forbidden', { status: 403 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = JSON.parse(body);

    // Log GDPR request
    const { error: logError } = await supabase
      .from('gdpr_requests')
      .insert({
        shop_domain: shop.toLowerCase(),
        request_type: topic,
        customer_id: payload.customer?.id?.toString(),
        customer_email: payload.customer?.email,
        request_payload: payload,
      });

    if (logError) {
      console.error('Error logging GDPR request:', logError);
    }

    // Handle different GDPR topics
    switch (topic) {
      case 'customers/data_request':
        // Customer data request (48-hour response required)
        console.log('Processing customer data request for:', payload.customer?.email);
        
        const { data: customerData, error: exportError } = await supabase.rpc('export_customer_data', {
          p_shop_domain: shop.toLowerCase(),
          p_customer_email: payload.customer?.email,
        });

        if (exportError) {
          console.error('Error exporting customer data:', exportError);
        }

        // Send customer data to Shopify's data_request callback URL
        const callbackUrl = payload.data_request?.url;
        if (callbackUrl && customerData) {
          try {
            const callbackResponse = await fetch(callbackUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(customerData),
            });

            if (!callbackResponse.ok) {
              console.error('Failed to send data to Shopify callback:', await callbackResponse.text());
            } else {
              console.log('Customer data successfully sent to Shopify callback');
            }
          } catch (callbackError) {
            console.error('Error sending data to Shopify callback:', callbackError);
          }
        }
        
        return new Response('Customer data request processed', { status: 200 });

      case 'customers/redact':
        // Customer data redaction (10-day window)
        console.log('Processing customer data redaction for:', payload.customer?.email);
        
        const { error: redactError } = await supabase.rpc('redact_customer_data', {
          p_shop_domain: shop.toLowerCase(),
          p_customer_email: payload.customer?.email,
        });

        if (redactError) {
          console.error('Error redacting customer data:', redactError);
          throw redactError;
        }

        // Mark request as processed
        await supabase
          .from('gdpr_requests')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('shop_domain', shop.toLowerCase())
          .eq('customer_email', payload.customer?.email)
          .eq('request_type', 'customers/redact');

        return new Response('Customer data redacted', { status: 200 });

      case 'shop/redact':
        // Shop data redaction (10-day window after app uninstall)
        console.log('Processing shop data redaction for:', shop);
        
        const { error: shopRedactError } = await supabase.rpc('redact_shop_data', {
          p_shop_domain: shop.toLowerCase(),
        });

        if (shopRedactError) {
          console.error('Error redacting shop data:', shopRedactError);
          throw shopRedactError;
        }

        // Mark request as processed
        await supabase
          .from('gdpr_requests')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('shop_domain', shop.toLowerCase())
          .eq('request_type', 'shop/redact');

        return new Response('Shop data redacted', { status: 200 });

      default:
        console.log('Unknown GDPR topic:', topic);
        return new Response('Unknown GDPR topic', { status: 400 });
    }

  } catch (error) {
    console.error('GDPR webhook error:', error);
    return new Response('Error processing GDPR request', { status: 500 });
  }
});
