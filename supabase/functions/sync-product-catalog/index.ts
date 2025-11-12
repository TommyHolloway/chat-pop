import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Product {
  id: string;
  name: string;
  sku?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { agentId, products } = await req.json() as {
      agentId: string;
      products: Product[];
    };

    if (!agentId || !products || !Array.isArray(products)) {
      throw new Error("Invalid request: agentId and products array required");
    }

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("user_id")
      .eq("id", agentId)
      .single();

    if (agentError || agent.user_id !== user.id) {
      throw new Error("Unauthorized: Agent not found or not owned by user");
    }

    // Check product limit
    const { data: limitCheck, error: limitError } = await supabase
      .rpc("check_product_limit", { p_agent_id: agentId });

    if (limitError) {
      console.error("Error checking product limit:", limitError);
      throw new Error("Failed to check product limit");
    }

    if (!limitCheck || limitCheck.length === 0) {
      throw new Error("Could not determine product limit");
    }

    const limitInfo = limitCheck[0];
    
    // Check if user can add products
    if (!limitInfo.can_add_product) {
      return new Response(
        JSON.stringify({
          error: "Product limit reached",
          limit: limitInfo.product_limit,
          current: limitInfo.current_products,
          plan: limitInfo.plan,
          message: `You've reached your plan's product limit of ${limitInfo.product_limit}. Upgrade to add more products.`
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Calculate how many products can be added
    const remainingSlots = limitInfo.product_limit === -1 
      ? products.length 
      : Math.min(products.length, limitInfo.product_limit - limitInfo.current_products);

    if (remainingSlots < products.length) {
      console.warn(`Can only add ${remainingSlots} of ${products.length} products due to limit`);
    }

    const productsToAdd = products.slice(0, remainingSlots);

    // Upsert products into catalog
    const { data: insertedProducts, error: insertError } = await supabase
      .from("agent_product_catalog")
      .upsert(
        productsToAdd.map(p => ({
          agent_id: agentId,
          product_id: p.id,
          product_name: p.name,
          product_sku: p.sku || null,
          is_active: true,
          updated_at: new Date().toISOString()
        })),
        { onConflict: "agent_id,product_id" }
      )
      .select();

    if (insertError) {
      console.error("Error inserting products:", insertError);
      throw new Error("Failed to sync products");
    }

    // Log the operation
    await supabase.rpc("log_service_role_operation", {
      operation_type: "product_sync",
      table_name: "agent_product_catalog",
      record_data: {
        agent_id: agentId,
        products_synced: productsToAdd.length,
        products_attempted: products.length
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: productsToAdd.length,
        products_total: products.length,
        limit_info: {
          current: limitInfo.current_products + productsToAdd.length,
          limit: limitInfo.product_limit,
          plan: limitInfo.plan
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in sync-product-catalog:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
