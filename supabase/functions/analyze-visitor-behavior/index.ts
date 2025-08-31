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

    const { sessionId, agentId, currentUrl, currentPath, timeOnPage } = await req.json();

    console.log('Analyzing visitor behavior:', { 
      sessionId, 
      agentId, 
      currentUrl, 
      currentPath, 
      timeOnPage 
    });

    // Get agent's proactive configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('proactive_config, enable_proactive_engagement')
      .eq('id', agentId)
      .single();

    if (agentError || !agent || !agent.enable_proactive_engagement) {
      console.log('Agent not found or proactive engagement disabled:', { agentError, agent });
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Proactive engagement not enabled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const config = agent.proactive_config || {};
    console.log('Agent proactive config:', config);

    // Get visitor session data (optional - for advanced analysis)
    const { data: sessions, error: sessionError } = await supabase
      .from('visitor_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('agent_id', agentId);

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Analyze behavior and check triggers
    const analysis = await analyzeAndTrigger(config, sessions, currentUrl, currentPath, timeOnPage);
    console.log('Analysis result:', analysis);

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

async function analyzeAndTrigger(config, sessions, currentUrl, currentPath, timeOnPage) {
  console.log('Starting analysis with:', { config, sessionsCount: sessions?.length, currentUrl, currentPath, timeOnPage });

  // Check custom triggers first (highest priority)
  if (config.custom_triggers && config.custom_triggers.length > 0) {
    for (const trigger of config.custom_triggers) {
      if (!trigger.enabled) continue;

      console.log('Checking custom trigger:', trigger);

      // Check URL pattern matching
      if (trigger.url_patterns && trigger.url_patterns.length > 0) {
        const urlMatches = trigger.url_patterns.some(pattern => {
          const normalizedPattern = pattern.toLowerCase().trim();
          const normalizedUrl = currentUrl.toLowerCase();
          const normalizedPath = currentPath.toLowerCase();
          
          return normalizedUrl.includes(normalizedPattern) || 
                 normalizedPath.includes(normalizedPattern) ||
                 currentUrl.includes(pattern) ||
                 currentPath.includes(pattern);
        });

        if (!urlMatches) {
          console.log('URL pattern not matched for trigger:', trigger.name, trigger.url_patterns);
          continue;
        }
      }

      // Check trigger conditions
      let triggerMet = false;
      
      if (trigger.trigger_type === 'time_based' && trigger.time_threshold) {
        const timeInSeconds = Math.floor(timeOnPage / 1000);
        triggerMet = timeInSeconds >= trigger.time_threshold;
        console.log('Time-based trigger check:', { 
          triggerName: trigger.name,
          timeInSeconds, 
          threshold: trigger.time_threshold, 
          triggerMet 
        });
      } else if (trigger.trigger_type === 'scroll_based' && trigger.scroll_depth) {
        // TODO: Implement scroll depth tracking
        triggerMet = false;
      } else if (trigger.trigger_type === 'element_interaction' && trigger.element_selector) {
        // TODO: Implement element interaction tracking
        triggerMet = false;
      } else if (trigger.trigger_type === 'exit_intent') {
        // TODO: Implement exit intent detection
        triggerMet = false;
      }

      if (triggerMet) {
        console.log('Custom trigger activated:', trigger.name);
        return {
          confidence: 0.9, // High confidence for custom triggers
          suggestedMessage: trigger.message,
          triggerType: trigger.trigger_type,
          triggerName: trigger.name,
          reason: `Custom trigger: ${trigger.name}`
        };
      }
    }
  }

  // Check predefined triggers
  if (config.triggers) {
    // Check pricing concern trigger
    if (config.triggers.pricing_concern && config.triggers.pricing_concern.enabled) {
      const trigger = config.triggers.pricing_concern;
      const timeInSeconds = Math.floor(timeOnPage / 1000);
      
      if (trigger.url_patterns && trigger.url_patterns.length > 0) {
        const urlMatches = trigger.url_patterns.some(pattern => {
          const normalizedPattern = pattern.toLowerCase().trim();
          const normalizedUrl = currentUrl.toLowerCase();
          const normalizedPath = currentPath.toLowerCase();
          
          return normalizedUrl.includes(normalizedPattern) || 
                 normalizedPath.includes(normalizedPattern);
        });

        if (urlMatches && timeInSeconds >= (trigger.time_threshold || 30)) {
          console.log('Pricing concern trigger activated');
          return {
            confidence: 0.8,
            suggestedMessage: trigger.message,
            triggerType: 'pricing_concern',
            reason: 'Pricing page engagement detected'
          };
        }
      }
    }

    // Check feature exploration trigger
    if (config.triggers.feature_exploration && config.triggers.feature_exploration.enabled) {
      const trigger = config.triggers.feature_exploration;
      
      if (trigger.url_patterns && trigger.url_patterns.length > 0) {
        const urlMatches = trigger.url_patterns.some(pattern => {
          const normalizedPattern = pattern.toLowerCase().trim();
          const normalizedUrl = currentUrl.toLowerCase();
          const normalizedPath = currentPath.toLowerCase();
          
          return normalizedUrl.includes(normalizedPattern) || 
                 normalizedPath.includes(normalizedPattern);
        });

        if (urlMatches) {
          console.log('Feature exploration trigger activated');
          return {
            confidence: 0.7,
            suggestedMessage: trigger.message,
            triggerType: 'feature_exploration',
            reason: 'Feature exploration detected'
          };
        }
      }
    }

    // Check high engagement trigger
    if (config.triggers.high_engagement && config.triggers.high_engagement.enabled) {
      const trigger = config.triggers.high_engagement;
      const timeInSeconds = Math.floor(timeOnPage / 1000);
      
      if (timeInSeconds >= (trigger.time_threshold || 120)) {
        console.log('High engagement trigger activated');
        return {
          confidence: 0.6,
          suggestedMessage: trigger.message,
          triggerType: 'high_engagement',
          reason: 'High engagement time detected'
        };
      }
    }
  }

  console.log('No triggers activated');
  return {
    confidence: 0,
    suggestedMessage: null,
    triggerType: null,
    reason: 'No triggers met'
  };
}