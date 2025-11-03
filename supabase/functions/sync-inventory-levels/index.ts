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

    const productsResponse = await fetch(
      `https://${store_domain}/admin/api/2024-10/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': admin_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      throw new Error(`Shopify API error: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();

    const inventoryItemIds = [];
    productsData.products.forEach((product: any) => {
      product.variants.forEach((variant: any) => {
        if (variant.inventory_item_id) {
          inventoryItemIds.push(variant.inventory_item_id);
        }
      });
    });

    const batchSize = 50;
    let allInventoryLevels = [];

    for (let i = 0; i < inventoryItemIds.length; i += batchSize) {
      const batch = inventoryItemIds.slice(i, i + batchSize);
      const inventoryResponse = await fetch(
        `https://${store_domain}/admin/api/2024-10/inventory_levels.json?inventory_item_ids=${batch.join(',')}`,
        {
          headers: {
            'X-Shopify-Access-Token': admin_api_token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        allInventoryLevels = allInventoryLevels.concat(inventoryData.inventory_levels);
      }
    }

    const inventorySnapshot = [];
    productsData.products.forEach((product: any) => {
      product.variants.forEach((variant: any) => {
        const inventoryLevel = allInventoryLevels.find(
          (level: any) => level.inventory_item_id === variant.inventory_item_id
        );

        inventorySnapshot.push({
          agent_id: agentId,
          product_id: product.id.toString(),
          variant_id: variant.id.toString(),
          inventory_item_id: variant.inventory_item_id.toString(),
          available: inventoryLevel?.available ?? 0,
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

    const totalProducts = productsData.products.length;
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
