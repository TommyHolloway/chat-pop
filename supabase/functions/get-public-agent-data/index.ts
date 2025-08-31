import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent data including proactive config
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, initial_message, message_bubble_color, chat_interface_theme, profile_image_url, proactive_config')
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (error || !agent) {
      console.error('Agent fetch error:', error);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return only the necessary public data
    const publicData = {
      id: agent.id,
      name: agent.name,
      initial_message: agent.initial_message,
      message_bubble_color: agent.message_bubble_color,
      chat_interface_theme: agent.chat_interface_theme,
      profile_image_url: agent.profile_image_url,
      proactive_config: agent.proactive_config
    };

    return new Response(
      JSON.stringify(publicData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});