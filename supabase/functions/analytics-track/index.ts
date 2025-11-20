import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAuthAndAgent, getRestrictedCorsHeaders } from '../_shared/auth-helpers.ts';

const corsHeaders = getRestrictedCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, event, data } = await req.json();
    
    if (!agentId || !event) {
      return new Response(
        JSON.stringify({ error: 'Agent ID and event are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate authentication and agent ownership
    const authHeader = req.headers.get('Authorization');
    await validateAuthAndAgent(authHeader, agentId, supabaseUrl, supabaseServiceKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent owner
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track analytics based on event type
    switch (event) {
      case 'conversation_started':
        await trackConversation(supabase, agent.user_id);
        break;
      case 'message_sent':
        await trackMessage(supabase, agentId, data);
        break;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analytics-track function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: error.message?.includes('authorization') || error.message?.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function trackConversation(supabase: any, userId: string) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  
  const { error } = await supabase
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      month: currentMonth.toISOString().split('T')[0],
      conversations_count: 1
    }, {
      onConflict: 'user_id,month',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error tracking conversation:', error);
  }
}

async function trackMessage(supabase: any, agentId: string, data: any) {
  console.log('Message tracked for agent:', agentId, data);
}
