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
    const { agentId, startDate, endDate } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get metrics for date range
    const { data: metrics, error: metricsError } = await supabase
      .from('agent_ecommerce_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (metricsError) throw metricsError;

    // Calculate totals
    const totals = metrics?.reduce((acc, day) => ({
      totalRevenue: acc.totalRevenue + (day.total_revenue || 0),
      totalOrders: acc.totalOrders + (day.total_orders || 0),
      cartsRecovered: acc.cartsRecovered + (day.carts_recovered || 0),
      recoveryRevenue: acc.recoveryRevenue + (day.recovery_revenue || 0),
    }), {
      totalRevenue: 0,
      totalOrders: 0,
      cartsRecovered: 0,
      recoveryRevenue: 0,
    });

    // Get abandoned carts count
    const { data: abandonedCarts, error: cartsError } = await supabase
      .from('abandoned_carts')
      .select('recovered')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalAbandoned = abandonedCarts?.length || 0;
    const recovered = abandonedCarts?.filter(c => c.recovered).length || 0;
    const recoveryRate = totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = totals.totalOrders > 0 
      ? totals.totalRevenue / totals.totalOrders 
      : 0;

    return new Response(JSON.stringify({
      success: true,
      totals: {
        ...totals,
        avgOrderValue,
        recoveryRate: recoveryRate.toFixed(1),
        totalAbandoned,
      },
      chartData: metrics || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-ecommerce-analytics:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch analytics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
