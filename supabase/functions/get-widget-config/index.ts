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

    // Fetch configuration needed for the widget
    const { data: agent, error } = await supabase
      .from('agents')
      .select('name, initial_message, message_bubble_color, chat_interface_theme, profile_image_url, description, lead_capture_config, enable_proactive_engagement, proactive_config, widget_page_restrictions, widget_excluded_pages, status')
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

    // Return configuration needed for the widget
    return new Response(
      JSON.stringify({ agent }), 
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