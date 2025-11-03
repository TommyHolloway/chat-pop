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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: agent } = await supabase
      .from('agents')
      .select('shopify_config')
      .eq('id', agentId)
      .single();

    if (!agent?.shopify_config?.store_domain) {
      throw new Error('Shopify not connected');
    }

    const { store_domain, admin_api_token } = agent.shopify_config;

    // Fetch products with variants and inventory in ONE GraphQL query
    let hasNextPage = true;
    let cursor = null;
    let allProducts = [];

    while (hasNextPage) {
      const graphqlQuery = `
        query($cursor: String) {
          products(first: 250, after: $cursor) {
            edges {
              node {
                id
                variants(first: 100) {
                  edges {
                    node {
                      id
                      inventoryItem {
                        id
                        inventoryLevels(first: 10) {
                          edges {
                            node {
                              available
                              location {
                                id
                                name
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await fetch(`https://${store_domain}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { cursor }
        })
      });

      if (!response.ok) {
        throw new Error(`Shopify GraphQL API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      allProducts = allProducts.concat(result.data.products.edges);
      hasNextPage = result.data.products.pageInfo.hasNextPage;
      cursor = result.data.products.pageInfo.endCursor;
    }

    console.log(`Fetched ${allProducts.length} products with inventory from GraphQL`);

    // Transform GraphQL data to inventory snapshot
    const inventorySnapshot = [];

    allProducts.forEach((productEdge: any) => {
      const product = productEdge.node;
      const productId = product.id.split('/').pop(); // Extract numeric ID from GraphQL global ID

      product.variants.edges.forEach((variantEdge: any) => {
        const variant = variantEdge.node;
        const variantId = variant.id.split('/').pop();
        const inventoryItem = variant.inventoryItem;
        const inventoryItemId = inventoryItem.id.split('/').pop();

        // Sum available inventory across all locations
        const totalAvailable = inventoryItem.inventoryLevels.edges.reduce(
          (sum: number, levelEdge: any) => sum + (levelEdge.node.available || 0),
          0
        );

        inventorySnapshot.push({
          agent_id: agentId,
          product_id: productId,
          variant_id: variantId,
          inventory_item_id: inventoryItemId,
          available: totalAvailable,
          updated_at: new Date().toISOString(),
        });
      });
    });

    await supabase
      .from('inventory_snapshot')
      .delete()
      .eq('agent_id', agentId);

    const { error: insertError } = await supabase
      .from('inventory_snapshot')
      .insert(inventorySnapshot);

    if (insertError) {
      throw insertError;
    }

    const totalProducts = allProducts.length;
    const inStock = inventorySnapshot.filter(i => i.available > 0).length;
    const lowStock = inventorySnapshot.filter(i => i.available > 0 && i.available < 10).length;
    const outOfStock = inventorySnapshot.filter(i => i.available === 0).length;

    return new Response(JSON.stringify({
      success: true,
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      lastSynced: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Inventory sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
