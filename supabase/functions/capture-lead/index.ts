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
    const { agentId, conversationId, leadData } = await req.json();
    
    if (!agentId || !conversationId || !leadData) {
      throw new Error('Agent ID, conversation ID, and lead data are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate that the agent exists and has lead capture enabled
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('enable_lead_capture')
      .eq('id', agentId)
      .single();

    if (agentError || !agent?.enable_lead_capture) {
      throw new Error('Lead capture not enabled for this agent');
    }

    // Store the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        agent_id: agentId,
        conversation_id: conversationId,
        lead_data_json: leadData
      })
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to store lead: ${leadError.message}`);
    }

    console.log('Lead captured successfully:', lead.id);

    return new Response(JSON.stringify({ 
      success: true,
      leadId: lead.id,
      message: 'Thank you for your information! We\'ll be in touch soon.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in capture-lead function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to capture lead' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});