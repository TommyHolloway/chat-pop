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

// Map creativity level (1-10) to OpenAI temperature (0.1-0.9)
function mapCreativityToTemperature(creativityLevel: number | null): number {
  if (!creativityLevel || creativityLevel < 1) return 0.1;
  if (creativityLevel > 10) return 0.9;
  return Math.max(0.1, Math.min(0.9, creativityLevel * 0.08 + 0.02));
}

// Generate system prompt based on creativity level and visitor behavior
function generateSystemPrompt(agent: any, knowledgeContext: string, visitorContext?: any): string {
  const creativityLevel = agent.creativity_level || 5;
  
  let visitorContextPrompt = '';
  if (visitorContext) {
    visitorContextPrompt = `VISITOR BEHAVIOR CONTEXT:
- Pages visited: ${visitorContext.pageHistory?.join(', ') || 'Unknown'}
- Time spent on site: ${visitorContext.totalTimeSpent || 0} seconds
- Total page views: ${visitorContext.totalPageViews || 0}
- Current page: ${visitorContext.currentPage || 'Unknown'}
- Behavior signals: ${visitorContext.behaviorSignals?.join(', ') || 'None detected'}

Use this context to provide highly relevant, timely assistance. The visitor has shown specific interests based on their browsing behavior.

`;
  }
  
  let knowledgeInstruction = '';
  if (knowledgeContext) {
    if (creativityLevel <= 3) {
      // Strict knowledge base mode
      knowledgeInstruction = `Knowledge Base Context:
${knowledgeContext}

IMPORTANT: You must ONLY use the information provided in the knowledge base above to answer questions. If the answer is not found in the knowledge base, respond with "I don't have information about that in my knowledge base. Please ask questions related to the topics I've been trained on."`;
    } else if (creativityLevel <= 7) {
      // Balanced mode - prefer knowledge base
      knowledgeInstruction = `Knowledge Base Context:
${knowledgeContext}

Please prioritize using this knowledge base to answer questions when relevant. If the knowledge base doesn't contain the answer, you may provide general helpful responses, but clearly indicate when you're going beyond your specific knowledge base.`;
    } else {
      // Creative mode - use knowledge as foundation
      knowledgeInstruction = `Knowledge Base Context:
${knowledgeContext}

Use this knowledge base as a foundation, but feel free to provide creative and comprehensive responses that go beyond the provided information when helpful.`;
    }
  }

  return `You are ${agent.name}, an AI assistant. 

${agent.description}

Instructions: ${agent.instructions}

${visitorContextPrompt}${knowledgeInstruction}

Be helpful, accurate, and follow the instructions provided. Keep responses conversational and engaging.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, message, conversationId, visitorSessionId, stream = false } = await req.json();
    
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

    // Get agent details, actions, and lead capture settings
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, description, instructions, user_id, creativity_level, enable_lead_capture')
      .eq('id', agentId)
      .single();

    // Get agent actions
    const { data: agentActions } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_enabled', true);

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

    // Get visitor behavior context if visitorSessionId provided
    let visitorContext = null;
    if (visitorSessionId) {
      console.log('Fetching visitor behavior context for session:', visitorSessionId);
      
      // Get visitor session data
      const { data: visitorSession } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('session_id', visitorSessionId)
        .single();

      // Get recent behavior events
      const { data: behaviorEvents } = await supabase
        .from('visitor_behavior_events')
        .select('*')
        .eq('session_id', visitorSessionId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (visitorSession) {
        // Build visitor context for AI
        const pageViews = behaviorEvents?.filter(e => e.event_type === 'page_view') || [];
        const timeEvents = behaviorEvents?.filter(e => e.event_type === 'time_spent') || [];
        
        // Extract behavior signals
        const behaviorSignals = [];
        const pricingPages = pageViews.filter(e => 
          e.page_url.toLowerCase().includes('pricing') || 
          e.page_url.toLowerCase().includes('plans')
        );
        if (pricingPages.length > 0) behaviorSignals.push('pricing_interest');
        
        const featurePages = pageViews.filter(e => 
          e.page_url.toLowerCase().includes('features') || 
          e.page_url.toLowerCase().includes('product')
        );
        if (featurePages.length >= 2) behaviorSignals.push('feature_exploration');
        
        if (visitorSession.total_time_spent > 120) behaviorSignals.push('high_engagement');
        if (visitorSession.total_page_views > 5) behaviorSignals.push('thorough_research');

        visitorContext = {
          pageHistory: pageViews.slice(0, 5).map(e => e.page_url),
          totalTimeSpent: visitorSession.total_time_spent,
          totalPageViews: visitorSession.total_page_views,
          currentPage: visitorSession.current_page_url,
          behaviorSignals: behaviorSignals
        };

        console.log('Built visitor context:', visitorContext);
      }
    }

    // Define OpenAI tools for action detection
    const tools = [];
    
    // Add calendar booking tool if enabled
    const calendarAction = agentActions?.find(action => action.action_type === 'calendar_booking');
    if (calendarAction) {
      tools.push({
        type: 'function',
        function: {
          name: 'schedule_appointment',
          description: 'Detect when user wants to schedule an appointment or meeting',
          parameters: {
            type: 'object',
            properties: {
              intent: { type: 'string', description: 'The user\'s scheduling intent' },
              timeframe: { type: 'string', description: 'Mentioned timeframe or preference' }
            },
            required: ['intent']
          }
        }
      });
    }

    // Add custom button tool if enabled
    const customButtonAction = agentActions?.find(action => action.action_type === 'custom_button');
    if (customButtonAction) {
      tools.push({
        type: 'function',
        function: {
          name: 'display_custom_button',
          description: `Display custom button when keywords match: ${customButtonAction.config_json.keywords?.join(', ') || 'any relevant context'}`,
          parameters: {
            type: 'object',
            properties: {
              trigger_detected: { type: 'boolean', description: 'Whether the trigger condition was met' },
              context: { type: 'string', description: 'Context that triggered the button' }
            },
            required: ['trigger_detected']
          }
        }
      });
    }

    // Add lead capture tool if enabled
    if (agent.enable_lead_capture) {
      tools.push({
        type: 'function',
        function: {
          name: 'capture_lead',
          description: 'Capture user contact information when they show interest or request more info',
          parameters: {
            type: 'object',
            properties: {
              intent: { type: 'string', description: 'Type of lead capture intent detected' },
              urgency: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Urgency of the request' }
            },
            required: ['intent']
          }
        }
      });
    }

    // Build system prompt based on creativity level and visitor context
    const systemPrompt = generateSystemPrompt(agent, knowledgeContext, visitorContext);
    
    // Map creativity level to temperature
    const temperature = mapCreativityToTemperature(agent.creativity_level);

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API with tools support
    const requestBody: any = {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: temperature,
      max_tokens: 1000,
      stream: stream,
    };

    // Add tools if we have them
    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
              const cachingQueryHash = btoa(cacheKey).replace(/[+\/=]/g, '_');
              await supabase.from('query_cache').insert({
                agent_id: agentId,
                query_hash: cachingQueryHash,
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
    const toolCalls = data.choices[0].message.tool_calls;

    console.log('Received response from OpenAI');
    
    // Process function calls and prepare enhanced response
    let enhancedResponse: any = {
      message: assistantMessage,
      usage: data.usage,
      actions: []
    };

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        console.log('Tool call detected:', toolCall.function.name);
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === 'schedule_appointment' && calendarAction) {
          // Get calendar integrations for this agent
          const { data: calendarIntegrations } = await supabase
            .from('calendar_integrations')
            .select('*')
            .eq('agent_id', agentId)
            .eq('is_active', true);

          if (calendarIntegrations && calendarIntegrations.length > 0) {
            // Use the first active integration
            const integration = calendarIntegrations[0];
            enhancedResponse.actions.push({
              type: 'calendar_booking',
              data: {
                integration: {
                  provider: integration.provider,
                  integration_mode: integration.integration_mode,
                  configuration_json: integration.configuration_json
                },
                text: calendarAction.config_json.button_text || 'Schedule Appointment'
              }
            });
          } else {
            // Fallback to old system if no integrations configured
            enhancedResponse.actions.push({
              type: 'calendar_booking',
              data: {
                link: calendarAction.config_json.calendar_link,
                text: calendarAction.config_json.button_text || 'Schedule Appointment'
              }
            });
          }
        }
        
        if (toolCall.function.name === 'display_custom_button' && customButtonAction && functionArgs.trigger_detected) {
          enhancedResponse.actions.push({
            type: 'custom_button',
            data: {
              text: customButtonAction.config_json.button_text,
              url: customButtonAction.config_json.button_url,
              style: customButtonAction.config_json.button_style || 'primary'
            }
          });
        }
        
        if (toolCall.function.name === 'capture_lead' && agent.enable_lead_capture) {
          enhancedResponse.actions.push({
            type: 'lead_capture',
            data: {
              prompt: 'I\'d be happy to help you further! Could you please share your contact information?',
              fields: ['name', 'email', 'phone'],
              intent: functionArgs.intent,
              urgency: functionArgs.urgency
            }
          });
        }
      }
    }

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
    const nonStreamingQueryHash = btoa(cacheKey).replace(/[+\/=]/g, '_');
    await supabase.from('query_cache').insert({
      agent_id: agentId,
      query_hash: nonStreamingQueryHash,
      response_text: assistantMessage,
      metadata: { stream: false, usage: data.usage }
    });

    return new Response(JSON.stringify(enhancedResponse), {
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