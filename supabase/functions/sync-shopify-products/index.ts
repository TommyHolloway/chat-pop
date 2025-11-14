import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-GCM decryption helper
async function decryptToken(encryptedData: string): Promise<string> {
  const keyBase64 = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('SHOPIFY_ENCRYPTION_KEY not configured');
  }

  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id, incremental = false } = await req.json();

    if (!agent_id) {
      throw new Error('agent_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Shopify connection
    const { data: connection, error: connectionError } = await supabase
      .from('shopify_connections')
      .select('*')
      .eq('agent_id', agent_id)
      .single();

    if (connectionError || !connection) {
      throw new Error('No active Shopify connection found');
    }

    // Decrypt access token
    const accessToken = await decryptToken(connection.encrypted_access_token);

    // Get last sync time for incremental sync
    let updatedAtFilter = '';
    if (incremental) {
      const { data: lastSync } = await supabase
        .from('agent_product_catalog')
        .select('last_synced_at')
        .eq('agent_id', agent_id)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single();
      
      if (lastSync?.last_synced_at) {
        updatedAtFilter = `, updated_at:>"${lastSync.last_synced_at}"`;
      }
    }

    let allProducts: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const now = new Date().toISOString();

    // Fetch all products with pagination
    while (hasNextPage) {
      const query = `
        query($cursor: String) {
          products(first: 50, after: $cursor${updatedAtFilter}) {
            edges {
              cursor
              node {
                id
                title
                description
                handle
                productType
                vendor
                tags
                updatedAt
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      price
                      compareAtPrice
                      sku
                      availableForSale
                      inventoryQuantity
                      inventoryManagement
                      image {
                        url
                      }
                    }
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const response = await fetch(`https://${connection.shop_domain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          variables: { cursor }
        }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data?.products?.edges || [];
      allProducts = allProducts.concat(products);
      
      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = products.length > 0 ? products[products.length - 1].cursor : null;

      console.log(`Fetched ${products.length} products (total: ${allProducts.length})`);
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    let productsAdded = 0;
    let productsUpdated = 0;
    const errors: any[] = [];

    // Process each product
    for (const edge of allProducts) {
      const product = edge.node;
      
      try {
        // Extract numeric Shopify ID from GraphQL global ID
        const productId = product.id.split('/').pop();
        
        // Get first variant for main product data
        const firstVariant = product.variants.edges[0]?.node;
        const variants = product.variants.edges.map((v: any) => v.node);
        
        // Calculate total inventory across all variants
        const totalInventory = variants.reduce((sum: number, v: any) => 
          sum + (v.inventoryQuantity || 0), 0
        );

        const productData = {
          agent_id,
          product_id: productId,
          product_name: product.title,
          product_sku: firstVariant?.sku || null,
          title: product.title,
          description: product.description || '',
          handle: product.handle,
          price: firstVariant?.price ? parseFloat(firstVariant.price) : null,
          compare_at_price: firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice) : null,
          currency: 'USD', // Could be extracted from shop currency
          available_for_sale: firstVariant?.availableForSale || false,
          inventory_quantity: totalInventory,
          inventory_tracked: firstVariant?.inventoryManagement !== null,
          image_url: product.images.edges[0]?.node?.url || null,
          product_url: `https://${connection.shop_domain}/products/${product.handle}`,
          product_type: product.productType || null,
          vendor: product.vendor || null,
          tags: product.tags || [],
          variants: variants,
          product_data: product,
          is_active: true,
          last_synced_at: now,
          updated_at: now
        };

        // Upsert product
        const { error: upsertError } = await supabase
          .from('agent_product_catalog')
          .upsert(productData, {
            onConflict: 'agent_id,product_id'
          });

        if (upsertError) {
          console.error(`Error upserting product ${productId}:`, upsertError);
          errors.push({ product_id: productId, error: upsertError.message });
        } else {
          // Check if this was an insert or update
          const { count } = await supabase
            .from('agent_product_catalog')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agent_id)
            .eq('product_id', productId)
            .eq('last_synced_at', now);
          
          if (count === 1) {
            productsAdded++;
          } else {
            productsUpdated++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing product ${product.id}:`, error);
        errors.push({ product_id: product.id, error: error.message });
      }
    }

    // Log the operation
    await supabase.rpc('log_service_role_operation', {
      operation_type: 'shopify_products_sync',
      table_name: 'agent_product_catalog',
      record_data: {
        agent_id,
        products_fetched: allProducts.length,
        products_added: productsAdded,
        products_updated: productsUpdated,
        errors_count: errors.length,
        sync_type: incremental ? 'incremental' : 'full'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: allProducts.length,
        products_added: productsAdded,
        products_updated: productsUpdated,
        errors: errors.length > 0 ? errors : undefined,
        sync_type: incremental ? 'incremental' : 'full',
        synced_at: now
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in sync-shopify-products:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
