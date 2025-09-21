import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch only the configuration needed for the widget
    const { data: agent, error } = await supabase
      .from('agents')
      .select('enable_proactive_engagement, proactive_config, widget_page_restrictions, status')
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (error || !agent) {
      console.error('Error fetching agent config:', error);
      return new Response(
        JSON.stringify({ error: 'Agent not found or inactive' }), 
        { status: 404, headers: corsHeaders }
      );
    }

    // Return only the minimal configuration needed for the widget
    const config = {
      proactiveEnabled: agent.enable_proactive_engagement && agent.proactive_config?.enabled,
      proactiveConfig: agent.proactive_config || {},
      allowedPages: agent.proactive_config?.allowed_pages || [],
      widgetPageRestrictions: agent.widget_page_restrictions || []
    };

    return new Response(
      JSON.stringify(config), 
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Widget config error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});