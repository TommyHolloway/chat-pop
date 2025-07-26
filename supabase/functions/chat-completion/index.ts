import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, message, conversationId } = await req.json();
    
    if (!agentId || !message) {
      throw new Error('Agent ID and message are required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent details and user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, description, instructions, user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Check message credit limits before processing
    const { data: limitCheck } = await supabase.rpc('check_user_plan_limits', {
      p_user_id: agent.user_id,
      p_feature_type: 'message'
    });

    if (limitCheck && !limitCheck.can_perform) {
      return new Response(JSON.stringify({ 
        error: 'Message credit limit reached',
        limit: limitCheck.limit,
        current_usage: limitCheck.current_usage,
        plan: limitCheck.plan
      }), {
        status: 402, // Payment Required
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get knowledge files for context
    const { data: knowledgeFiles } = await supabase
      .from('knowledge_files')
      .select('processed_content')
      .eq('agent_id', agentId);

    // Build context from knowledge files
    let knowledgeContext = '';
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      knowledgeContext = knowledgeFiles
        .map(file => file.processed_content)
        .filter(Boolean)
        .join('\n\n');
    }

    // Get recent conversation history if conversationId provided
    let conversationHistory: ChatMessage[] = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (messages) {
        conversationHistory = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
      }
    }

    // Build system prompt
    const systemPrompt = `You are ${agent.name}, an AI assistant. 

${agent.description}

Instructions: ${agent.instructions}

${knowledgeContext ? `Knowledge Base Context:
${knowledgeContext}

Please use this knowledge base to answer questions when relevant. If the answer is not in the knowledge base, you can still provide helpful general responses.` : ''}

Be helpful, accurate, and follow the instructions provided. Keep responses conversational and engaging.`;

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    const assistantMessage = data.choices[0].message.content;

    // Store conversation and messages if conversationId provided
    if (conversationId) {
      // Store user message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

      // Store assistant response
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

      // Update usage tracking for both user and assistant messages (2 credits total)
      await supabase.rpc('update_usage_tracking', {
        p_user_id: agent.user_id,
        p_conversation_id: conversationId,
        p_message_count: 2
      });
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});