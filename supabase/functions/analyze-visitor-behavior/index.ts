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

    // Get agent data for business context and proactive config
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, description, enable_proactive_engagement, proactive_config')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Agent not found');
    }

    // Check if proactive engagement is enabled for this agent
    if (!agent.enable_proactive_engagement || !agent.proactive_config?.enabled) {
      console.log('Proactive engagement is disabled for this agent');
      return new Response(
        JSON.stringify({ success: true, analysis: null, message: 'Proactive engagement disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check frequency limits - don't show more suggestions than configured
    const { data: existingSuggestions, error: suggestionCheckError } = await supabase
      .from('proactive_suggestions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('was_shown', true);

    if (suggestionCheckError) {
      console.error('Error checking existing suggestions:', suggestionCheckError);
    }

    const frequencyLimit = agent.proactive_config.frequency_limit || 3;
    if (existingSuggestions && existingSuggestions.length >= frequencyLimit) {
      console.log(`Frequency limit reached (${existingSuggestions.length}/${frequencyLimit})`);
      return new Response(
        JSON.stringify({ success: true, analysis: null, message: 'Frequency limit reached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Analyze behavior patterns with agent's configuration
    const analysis = analyzeBehaviorPatterns(events, session, agent);

    // Store the suggestion if confidence meets the configured threshold
    const confidenceThreshold = agent.proactive_config.confidence_threshold || 0.7;
    if (analysis.confidence >= confidenceThreshold) {
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

  const config = agent.proactive_config || {};
  const triggerConfig = config.triggers || {};

  // Helper function to check URL patterns
  const matchesUrlPatterns = (url: string, patterns: string[]): boolean => {
    if (!patterns || patterns.length === 0) return false;
    
    const lowerUrl = url.toLowerCase();
    return patterns.some(pattern => {
      const lowerPattern = pattern.toLowerCase();
      if (lowerPattern.startsWith('#')) {
        // Hash fragment matching
        return lowerUrl.includes(lowerPattern);
      } else if (lowerPattern.startsWith('/')) {
        // Exact path matching
        return lowerUrl.includes(lowerPattern);
      } else {
        // Keyword matching
        return lowerUrl.includes(lowerPattern);
      }
    });
  };

  // Pricing concern detection with configurable patterns
  if (triggerConfig.pricing_concern?.enabled) {
    const patterns = triggerConfig.pricing_concern.url_patterns || ['pricing', 'plans', 'cost'];
    const pricingPages = pageViews.filter(e => matchesUrlPatterns(e.page_url, patterns));
    
    const pricingTime = timeEvents
      .filter(e => matchesUrlPatterns(e.page_url, patterns))
      .reduce((sum, e) => sum + (e.time_on_page || 0), 0);

    const timeThreshold = triggerConfig.pricing_concern.time_threshold || 30;
    if (pricingPages.length > 0 && pricingTime >= timeThreshold) {
      triggers.pricingPagesVisited = pricingPages.length;
      triggers.timeOnPricing = pricingTime;
      triggers.matchedPatterns = patterns;
      
      return {
        intent: 'pricing_concern',
        confidence: Math.min(0.9, 0.3 + (pricingTime / 100) + (pricingPages.length * 0.2)),
        suggestedMessage: triggerConfig.pricing_concern.message || `Hi! I noticed you're looking at our pricing. I'd be happy to help you find the perfect plan for your needs!`,
        triggers
      };
    }
  }

  // Feature exploration detection with configurable patterns
  if (triggerConfig.feature_exploration?.enabled) {
    const patterns = triggerConfig.feature_exploration.url_patterns || ['features', 'product', 'demo'];
    const featurePages = pageViews.filter(e => matchesUrlPatterns(e.page_url, patterns));

    const pageThreshold = triggerConfig.feature_exploration.page_threshold || 3;
    if (featurePages.length >= pageThreshold) {
      triggers.featurePagesVisited = featurePages.length;
      triggers.matchedPatterns = patterns;
      
      return {
        intent: 'feature_exploration',
        confidence: Math.min(0.85, 0.4 + (featurePages.length * 0.15)),
        suggestedMessage: triggerConfig.feature_exploration.message || `I see you're exploring our features. Want to learn more about how they can benefit you?`,
        triggers
      };
    }
  }

  // High engagement detection
  if (triggerConfig.high_engagement?.enabled) {
    const timeThreshold = triggerConfig.high_engagement.time_threshold || 120;
    const pageViewsThreshold = triggerConfig.high_engagement.page_views_threshold || 5;
    
    if (session.total_time_spent >= timeThreshold && session.total_page_views >= pageViewsThreshold) {
      triggers.highEngagement = true;
      
      return {
        intent: 'high_engagement',
        confidence: 0.75,
        suggestedMessage: triggerConfig.high_engagement.message || `You seem really interested in what we offer! Would you like to chat about how we can help you?`,
        triggers
      };
    }
  }

  // Custom triggers detection
  const customTriggers = config.custom_triggers || [];
  for (const customTrigger of customTriggers) {
    if (!customTrigger.enabled) continue;
    
    const patterns = customTrigger.url_patterns || [];
    if (patterns.length === 0) continue;
    
    const matchingPages = pageViews.filter(e => matchesUrlPatterns(e.page_url, patterns));
    
    if (customTrigger.trigger_type === 'time_based') {
      const timeOnMatchingPages = timeEvents
        .filter(e => matchesUrlPatterns(e.page_url, patterns))
        .reduce((sum, e) => sum + (e.time_on_page || 0), 0);
      
      const threshold = customTrigger.time_threshold || 30;
      if (matchingPages.length > 0 && timeOnMatchingPages >= threshold) {
        triggers.customTriggerMatched = customTrigger.name;
        triggers.timeOnPages = timeOnMatchingPages;
        triggers.matchedPatterns = patterns;
        
        return {
          intent: `custom_${customTrigger.id}`,
          confidence: Math.min(0.8, 0.4 + (timeOnMatchingPages / 60)),
          suggestedMessage: customTrigger.message,
          triggers
        };
      }
    } else if (customTrigger.trigger_type === 'scroll_based') {
      // Check if any scroll events match the patterns and depth
      const scrollEvents = events.filter(e => 
        e.event_type === 'scroll' && 
        matchesUrlPatterns(e.page_url, patterns) &&
        (e.scroll_depth || 0) >= (customTrigger.scroll_depth || 70)
      );
      
      if (scrollEvents.length > 0) {
        triggers.customTriggerMatched = customTrigger.name;
        triggers.maxScrollDepth = Math.max(...scrollEvents.map(e => e.scroll_depth || 0));
        triggers.matchedPatterns = patterns;
        
        return {
          intent: `custom_${customTrigger.id}`,
          confidence: 0.75,
          suggestedMessage: customTrigger.message,
          triggers
        };
      }
    }
    // Note: element_interaction and exit_intent would require additional client-side tracking
  }

  // Company research detection (fallback behavior)
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