import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BehaviorAnalysis {
  intent: string;
  confidence: number;
  suggestedMessage: string;
  triggers: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, agentId } = await req.json();

    console.log('Analyzing visitor behavior for session:', sessionId);

    // Get visitor session data
    const { data: session, error: sessionError } = await supabase
      .from('visitor_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get recent behavior events for this session
    const { data: events, error: eventsError } = await supabase
      .from('visitor_behavior_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Get agent data for business context
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, description')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Agent not found');
    }

    // Analyze behavior patterns
    const analysis = analyzeBehaviorPatterns(events, session, agent);

    // Store the suggestion if confidence is high enough
    if (analysis.confidence > 0.6) {
      const { error: suggestionError } = await supabase
        .from('proactive_suggestions')
        .insert({
          session_id: sessionId,
          agent_id: agentId,
          suggestion_type: analysis.intent,
          suggestion_message: analysis.suggestedMessage,
          confidence_score: analysis.confidence,
          behavioral_triggers: analysis.triggers
        });

      if (suggestionError) {
        console.error('Error storing suggestion:', suggestionError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-visitor-behavior function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function analyzeBehaviorPatterns(events: any[], session: any, agent: any): BehaviorAnalysis {
  const pageViews = events.filter(e => e.event_type === 'page_view');
  const timeEvents = events.filter(e => e.event_type === 'time_spent');
  
  const triggers: Record<string, any> = {
    totalPageViews: session.total_page_views,
    totalTimeSpent: session.total_time_spent,
    currentPage: session.current_page_url,
    recentPages: pageViews.slice(0, 5).map(e => e.page_url)
  };

  // Pricing concern detection
  const pricingPages = pageViews.filter(e => 
    e.page_url.toLowerCase().includes('pricing') || 
    e.page_url.toLowerCase().includes('plans') ||
    e.page_url.toLowerCase().includes('cost')
  );
  
  const pricingTime = timeEvents
    .filter(e => e.page_url.toLowerCase().includes('pricing'))
    .reduce((sum, e) => sum + (e.time_on_page || 0), 0);

  if (pricingPages.length > 0 && pricingTime > 30) {
    triggers.pricingPagesVisited = pricingPages.length;
    triggers.timeOnPricing = pricingTime;
    
    return {
      intent: 'pricing_concern',
      confidence: Math.min(0.9, 0.3 + (pricingTime / 100) + (pricingPages.length * 0.2)),
      suggestedMessage: `Is pricing a concern? I'd be happy to explain our plans and find the best fit for you!`,
      triggers
    };
  }

  // Feature exploration detection
  const featurePages = pageViews.filter(e => 
    e.page_url.toLowerCase().includes('features') || 
    e.page_url.toLowerCase().includes('product') ||
    e.page_url.toLowerCase().includes('demo')
  );

  if (featurePages.length >= 2) {
    triggers.featurePagesVisited = featurePages.length;
    
    return {
      intent: 'feature_exploration',
      confidence: Math.min(0.85, 0.4 + (featurePages.length * 0.15)),
      suggestedMessage: `Wondering if ${agent.name} can solve your specific problem? I'm here to help you understand how we can assist!`,
      triggers
    };
  }

  // High engagement detection
  if (session.total_time_spent > 120 && session.total_page_views > 3) {
    triggers.highEngagement = true;
    
    return {
      intent: 'high_engagement',
      confidence: 0.75,
      suggestedMessage: `I see you're exploring our platform! Any questions I can help you with?`,
      triggers
    };
  }

  // Bouncing behavior detection
  const aboutPages = pageViews.filter(e => 
    e.page_url.toLowerCase().includes('about') || 
    e.page_url.toLowerCase().includes('company')
  );

  if (aboutPages.length > 0 && session.total_page_views > 2) {
    return {
      intent: 'company_research',
      confidence: 0.65,
      suggestedMessage: `Learning more about us? I'd love to tell you what makes ${agent.name} special!`,
      triggers
    };
  }

  // Default low-confidence suggestion
  return {
    intent: 'general_interest',
    confidence: 0.3,
    suggestedMessage: `Hi there! Is there anything I can help you with today?`,
    triggers
  };
}