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

// Simple keyword-based relevance scoring
function calculateRelevance(chunkText: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const chunkWords = chunkText.toLowerCase().split(/\s+/);
  
  let score = 0;
  for (const queryWord of queryWords) {
    for (const chunkWord of chunkWords) {
      if (chunkWord.includes(queryWord) || queryWord.includes(chunkWord)) {
        score += 1;
      }
    }
  }
  
  return score / Math.max(queryWords.length, 1);
}

// Simple in-memory cache for responses
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(agentId: string, message: string): string {
  return `${agentId}:${message.toLowerCase().slice(0, 100)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, message, conversationId, stream = false } = await req.json();
    
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

    console.log(`Processing chat for agent: ${agent.name}`);

    // Check database cache first
    const cacheKey = getCacheKey(agentId, message);
    const queryHash = btoa(cacheKey).replace(/[+\/=]/g, '_'); // URL-safe hash
    
    const { data: cachedResponse } = await supabase
      .from('query_cache')
      .select('response_text, created_at')
      .eq('agent_id', agentId)
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (cachedResponse) {
      console.log('Cache hit for query from database');
      return new Response(JSON.stringify({ 
        message: cachedResponse.response_text,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // Get relevant knowledge chunks using intelligent selection
    const { data: chunks, error: chunksError } = await supabase
      .from('agent_knowledge_chunks')
      .select('chunk_text, metadata_json, token_count')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    let knowledgeContext = '';
    
    if (chunks && chunks.length > 0) {
      console.log(`Found ${chunks.length} knowledge chunks`);
      
      // Score and select relevant chunks
      const scoredChunks = chunks.map(chunk => ({
        ...chunk,
        relevance: calculateRelevance(chunk.chunk_text, message)
      }));
      
      // Sort by relevance and select top 5 chunks
      const selectedChunks = scoredChunks
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);
      
      console.log(`Selected ${selectedChunks.length} relevant chunks`);
      
      knowledgeContext = selectedChunks
        .map(chunk => chunk.chunk_text)
        .join('\n\n');
        
      // Limit context size to ~3000 tokens (rough estimate)
      if (knowledgeContext.length > 12000) {
        knowledgeContext = knowledgeContext.slice(0, 12000) + '\n\n[Content truncated for length]';
      }
    } else {
      console.log('No knowledge chunks found, falling back to legacy content');
      
      // Fallback: Get legacy knowledge files AND agent links (THIS WAS MISSING!)
      const { data: knowledgeFiles } = await supabase
        .from('knowledge_files')
        .select('processed_content')
        .eq('agent_id', agentId);

      const { data: agentLinks } = await supabase
        .from('agent_links')
        .select('content')
        .eq('agent_id', agentId)
        .eq('status', 'crawled');

      const allContent = [
        ...(knowledgeFiles || []).map(file => file.processed_content || ''),
        ...(agentLinks || []).map(link => link.content || '')
      ].filter(content => content.trim());

      knowledgeContext = allContent.join('\n\n');
      
      // Limit legacy content to prevent token explosion
      if (knowledgeContext.length > 12000) {
        knowledgeContext = knowledgeContext.slice(0, 12000) + '\n\n[Content truncated for length]';
      }
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

    // Call OpenAI API with streaming support
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
        stream: stream,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    // Handle streaming responses
    if (stream) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let fullResponse = '';
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = openAIResponse.body?.getReader();
            if (!reader) throw new Error('No reader available');

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                      fullResponse += delta;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta, done: false })}\n\n`));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }

            // Signal completion
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
            controller.close();

            // Store conversation and cache after streaming completes
            if (conversationId && fullResponse) {
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'user',
                content: message
              });

              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse
              });

              await supabase.rpc('update_usage_tracking', {
                p_user_id: agent.user_id,
                p_conversation_id: conversationId,
                p_message_count: 2
              });
            }

            // Cache the complete response
            if (fullResponse) {
              const queryHash = btoa(cacheKey).replace(/[+\/=]/g, '_');
              await supabase.from('query_cache').insert({
                agent_id: agentId,
                query_hash: queryHash,
                response_text: fullResponse,
                metadata: { stream: true, tokens: fullResponse.length / 4 }
              });
            }

          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const data = await openAIResponse.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Received response from OpenAI');

    // Store conversation and messages if conversationId provided
    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

      await supabase.rpc('update_usage_tracking', {
        p_user_id: agent.user_id,
        p_conversation_id: conversationId,
        p_message_count: 2
      });

      console.log('Stored messages and updated usage tracking');
    }

    // Cache the response in database
    const queryHash = btoa(cacheKey).replace(/[+\/=]/g, '_');
    await supabase.from('query_cache').insert({
      agent_id: agentId,
      query_hash: queryHash,
      response_text: assistantMessage,
      metadata: { stream: false, usage: data.usage }
    });

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