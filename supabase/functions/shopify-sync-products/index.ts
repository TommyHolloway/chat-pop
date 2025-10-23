import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting Shopify sync for agent: ${agentId}`);

    // Get Shopify connection
    const { data: connection, error: connError } = await supabase
      .from('shopify_connections')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (connError || !connection) {
      throw new Error('Shopify connection not found');
    }

    // Fetch products from Shopify Admin API
    const shopifyUrl = `https://${connection.store_domain}/admin/api/2024-01/products.json`;
    
    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': connection.access_token,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${shopifyResponse.status}`);
    }

    const { products } = await shopifyResponse.json();
    
    let productsAdded = 0;
    let variantsAdded = 0;

    for (const product of products) {
      // Insert or update product
      const { data: insertedProduct, error: productError } = await supabase
        .from('shopify_products')
        .upsert({
          shopify_connection_id: connection.id,
          shopify_product_id: product.id.toString(),
          title: product.title,
          description: product.body_html || '',
          product_type: product.product_type,
          vendor: product.vendor,
          tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
          price_min: product.variants[0]?.price || 0,
          price_max: Math.max(...product.variants.map((v: any) => parseFloat(v.price))),
          currency: 'USD',
          available: product.status === 'active',
          image_url: product.image?.src || product.images[0]?.src,
          handle: product.handle,
          metadata_json: product,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'shopify_connection_id,shopify_product_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (productError) {
        console.error('Error syncing product:', productError);
        continue;
      }

      productsAdded++;

      // Sync variants
      for (const variant of product.variants) {
        const { error: variantError } = await supabase
          .from('shopify_product_variants')
          .upsert({
            shopify_product_id: insertedProduct.id,
            shopify_variant_id: variant.id.toString(),
            title: variant.title,
            price: parseFloat(variant.price),
            compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
            sku: variant.sku,
            inventory_quantity: variant.inventory_quantity,
            available: variant.available,
            option_values: {
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
            },
          }, {
            onConflict: 'shopify_product_id,shopify_variant_id',
            ignoreDuplicates: false
          });

        if (!variantError) {
          variantsAdded++;
        }
      }
    }

    // Update last synced timestamp
    await supabase
      .from('shopify_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id);

    console.log(`Sync completed: ${productsAdded} products, ${variantsAdded} variants`);

    return new Response(JSON.stringify({
      success: true,
      productsAdded,
      variantsAdded,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-sync-products:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
