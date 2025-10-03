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
    const requestBody = await req.json();
    const { agentId, conversationId, leadData } = requestBody;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP for security validation
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Validate the request using our new security function
    const { error: validationError } = await supabase.rpc('validate_edge_function_request', {
      function_name: 'capture-lead',
      request_data: requestBody,
      client_ip: clientIP
    });

    if (validationError) {
      console.error('Request validation failed:', validationError);
      return new Response(
        JSON.stringify({ error: 'Request validation failed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      );
    }
    
    if (!agentId || !leadData) {
      throw new Error('Agent ID and lead data are required');
    }

    // Validate that the agent exists and get lead capture configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('lead_capture_config')
      .eq('id', agentId)
      .single();

    if (agentError || !agent?.lead_capture_config?.enabled) {
      throw new Error('Lead capture not enabled for this agent');
    }

    // Validate required fields based on agent configuration
    const config = agent.lead_capture_config;
    const requiredFields = config.fields?.filter((field: any) => field.required) || [];
    const missingFields = requiredFields.filter((field: any) => !leadData[field.key]?.trim?.());
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.map((f: any) => f.label).join(', ')}`);
    }

    // Store the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        agent_id: agentId,
        conversation_id: conversationId || null,
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
      message: agent.lead_capture_config.success_message || 'Thank you for your information! We\'ll be in touch soon.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in capture-lead function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to capture lead';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});