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
    const { agent_id } = await req.json();

    if (!agent_id) {
      throw new Error('agent_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user owns agent
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) throw new Error('Unauthorized');

    const { data: agent } = await supabase
      .from('agents')
      .select('id, workspace_id, workspaces(user_id)')
      .eq('id', agent_id)
      .single();

    if (!agent || agent.workspaces?.user_id !== user.id) {
      throw new Error('Agent not found or unauthorized');
    }

    // Delete connection
    const { error: deleteError } = await supabase
      .from('shopify_connections')
      .delete()
      .eq('agent_id', agent_id);

    if (deleteError) throw deleteError;

    console.log('Shopify disconnected for agent:', agent_id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Shopify disconnected successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Disconnect error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
