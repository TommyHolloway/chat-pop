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
    const { agentId, query, maxResults = 5 } = await req.json();

    if (!agentId || !query) {
      throw new Error('Agent ID and query are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Shopify connection for this agent
    const { data: connection } = await supabase
      .from('shopify_connections')
      .select('id')
      .eq('agent_id', agentId)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({
        success: true,
        products: [],
        message: 'No Shopify store connected'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search products using full-text search
    const { data: products, error } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('shopify_connection_id', connection.id)
      .eq('available', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(maxResults);

    if (error) throw error;

    // Format products for AI response
    const formattedProducts = products.map(p => ({
      id: p.shopify_product_id,
      title: p.title,
      description: p.description?.slice(0, 200),
      price: `$${p.price_min}${p.price_max > p.price_min ? ` - $${p.price_max}` : ''}`,
      currency: p.currency,
      image: p.image_url,
      url: `https://${connection.store_domain}/products/${p.handle}`,
      available: p.available,
      type: p.product_type,
      vendor: p.vendor,
    }));

    return new Response(JSON.stringify({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-product-search:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Product search failed',
      products: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
