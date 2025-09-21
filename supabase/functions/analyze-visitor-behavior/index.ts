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

    const requestData = await req.json();
    const { sessionId, agentId, currentUrl } = requestData;
    const currentPath = requestData.currentPath || new URL(currentUrl).pathname;
    const currentHash = requestData.currentHash || (currentUrl ? new URL(currentUrl).hash : '');
    const timeOnPage = requestData.timeOnPage || requestData.timeSpentOnPage || 0;

    console.log('Analyzing visitor behavior:', { 
      sessionId, 
      agentId, 
      currentUrl, 
      currentPath, 
      currentHash,
      timeOnPage 
    });

    // Get agent's proactive configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('proactive_config, enable_proactive_engagement')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('Error fetching agent config:', agentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch agent configuration' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!agent) {
      console.log('Agent not found or proactive engagement disabled');
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Agent not found or proactive engagement disabled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if proactive engagement is enabled for this agent
    if (!agent.enable_proactive_engagement) {
      console.log('Proactive engagement disabled for agent:', agentId);
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Proactive engagement disabled for this agent' 
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
    const analysis = await analyzeAndTrigger(config, sessions, currentUrl, currentPath, currentHash, timeOnPage);
    console.log('Analysis result:', analysis);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis,
        messageDisplayDuration: config.message_display_duration || 15000
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

async function analyzeAndTrigger(config, sessions, currentUrl, currentPath, currentHash, timeOnPage) {
  console.log('Starting analysis with:', { 
    configEnabled: config.enabled,
    customTriggersCount: config.custom_triggers?.length || 0,
    sessionsCount: sessions?.length, 
    currentUrl, 
    currentPath, 
    currentHash,
    timeOnPage 
  });

  // Check if proactive engagement is enabled in config
  if (!config.enabled) {
    console.log('Proactive engagement disabled in config');
    return { triggered: false, reason: 'Proactive engagement disabled' };
  }

  // Check custom triggers first (highest priority) - includes Quick Triggers
  if (config.custom_triggers && config.custom_triggers.length > 0) {
    console.log('Checking custom triggers:', config.custom_triggers.map(t => ({
      name: t.name,
      enabled: t.enabled,
      trigger_type: t.trigger_type,
      time_threshold: t.time_threshold,
      url_patterns: t.url_patterns
    })));

    for (const trigger of config.custom_triggers) {
      if (!trigger.enabled) {
        console.log(`Skipping disabled trigger: ${trigger.name}`);
        continue;
      }

      console.log(`Evaluating trigger: ${trigger.name}`);

      // Enhanced URL pattern matching with proper hash support
      let urlMatches = true; // Default to true if no URL patterns specified
      if (trigger.url_patterns && trigger.url_patterns.length > 0) {
        urlMatches = trigger.url_patterns.some(pattern => {
          if (!pattern || pattern.trim() === '') return false;
          
          const cleanPattern = pattern.trim();
          const normalizedPattern = cleanPattern.toLowerCase();
          const normalizedUrl = (currentUrl || '').toLowerCase();
          const normalizedPath = (currentPath || '').toLowerCase();
          const normalizedHash = (currentHash || '').toLowerCase();
          
          let matches = false;
          
          // Hash pattern matching (e.g., #pricing, #plans)
          if (cleanPattern.startsWith('#')) {
            const hashWithoutSymbol = cleanPattern.substring(1);
            // Match against hash with or without # symbol
            matches = normalizedHash === normalizedPattern || 
                     normalizedHash === '#' + hashWithoutSymbol ||
                     normalizedHash.substring(1) === hashWithoutSymbol;
            console.log(`Hash pattern matching for "${cleanPattern}":`, {
              pattern: cleanPattern,
              currentHash: currentHash || 'none',
              normalizedHash,
              hashWithoutSymbol,
              matches
            });
          }
          // Path pattern matching (e.g., /pricing, /plans, pricing)
          else {
            // Check path matches
            const pathMatches = normalizedPath.includes(normalizedPattern) ||
                               normalizedPath === '/' + normalizedPattern ||
                               normalizedPath.endsWith('/' + normalizedPattern);
            
            // Check URL matches (full URL contains pattern)
            const urlMatches = normalizedUrl.includes(normalizedPattern);
            
            // Check if pattern matches any URL segment
            const segmentMatches = normalizedUrl.split('/').some(segment => 
              segment === normalizedPattern || segment.includes(normalizedPattern)
            );
            
            matches = pathMatches || urlMatches || segmentMatches;
            
            console.log(`Path pattern matching for "${cleanPattern}":`, {
              pattern: cleanPattern,
              currentPath: currentPath || 'none',
              currentUrl: currentUrl || 'none',
              pathMatches,
              urlMatches,
              segmentMatches,
              matches
            });
          }
          
          return matches;
        });

        if (!urlMatches) {
          console.log(`URL pattern not matched for trigger: ${trigger.name}`, {
            patterns: trigger.url_patterns,
            currentUrl,
            currentPath,
            currentHash
          });
          continue;
        } else {
          console.log(`URL pattern MATCHED for trigger: ${trigger.name}`);
        }
      }

      // Check trigger conditions
      let triggerMet = false;
      
      if (trigger.trigger_type === 'time_based' && trigger.time_threshold) {
        const timeInSeconds = typeof timeOnPage === 'number' ? Math.floor(timeOnPage) : parseInt(timeOnPage) || 0;
        triggerMet = timeInSeconds >= trigger.time_threshold;
        console.log(`Time-based trigger evaluation for "${trigger.name}":`, { 
          timeInSeconds, 
          threshold: trigger.time_threshold, 
          triggerMet,
          rawTimeOnPage: timeOnPage
        });
      } else if (trigger.trigger_type === 'scroll_based' && trigger.scroll_depth) {
        // TODO: Implement scroll depth tracking
        console.log(`Scroll-based trigger not yet implemented: ${trigger.name}`);
        triggerMet = false;
      } else if (trigger.trigger_type === 'element_interaction' && trigger.element_selector) {
        console.log(`Element interaction trigger evaluation for "${trigger.name}":`, {
          element_selector: trigger.element_selector,
          time_threshold: trigger.time_threshold
        });
        
        // Fetch recent element visibility events for this session
        const { data: elementEvents, error: elementError } = await supabase
          .from('visitor_behavior_events')
          .select('element_selector, created_at, event_data')
          .eq('session_id', sessionId)
          .eq('event_type', 'element_visible')
          .order('created_at', { ascending: false });
        
        if (elementError) {
          console.error('Error fetching element events:', elementError);
          triggerMet = false;
        } else if (elementEvents && elementEvents.length > 0) {
          const elementSelector = trigger.element_selector.toLowerCase();
          const matchingElements = elementEvents.filter(event => {
            const eventSelector = (event.element_selector || '').toLowerCase();
            return eventSelector === elementSelector || eventSelector.includes(elementSelector);
          });
          
          if (matchingElements.length > 0) {
            // Check if enough time has passed since element became visible
            const latestMatch = matchingElements[0];
            const elementVisibleTime = new Date(latestMatch.created_at);
            const now = new Date();
            const timeSinceVisible = Math.floor((now.getTime() - elementVisibleTime.getTime()) / 1000);
            
            triggerMet = timeSinceVisible >= (trigger.time_threshold || 5);
            console.log(`Element interaction trigger evaluation:`, {
              element_found: true,
              time_since_visible: timeSinceVisible,
              threshold: trigger.time_threshold || 5,
              triggerMet
            });
          } else {
            console.log(`Element selector "${trigger.element_selector}" not found in visitor events`);
            triggerMet = false;
          }
        } else {
          console.log(`No element visibility events found for session: ${sessionId}`);
          triggerMet = false;
        }
      } else if (trigger.trigger_type === 'exit_intent') {
        // TODO: Implement exit intent detection
        console.log(`Exit intent trigger not yet implemented: ${trigger.name}`);
        triggerMet = false;
      } else {
        console.log(`Unknown or incomplete trigger type for "${trigger.name}":`, {
          trigger_type: trigger.trigger_type,
          time_threshold: trigger.time_threshold,
          scroll_depth: trigger.scroll_depth
        });
      }

      if (triggerMet) {
        console.log(`🎯 TRIGGER ACTIVATED: ${trigger.name}`);
        return {
          triggered: true,
          suggestedMessage: trigger.message,
          triggerType: trigger.trigger_type,
          triggerName: trigger.name,
          reason: `Custom trigger: ${trigger.name}`,
          debug: {
            timeOnPage,
            currentUrl,
            currentPath,
            currentHash,
            urlMatches,
            trigger: trigger
          }
        };
      }
    }
  } else {
    console.log('No custom triggers found in config');
  }

  // Check predefined triggers
  if (config.triggers) {
    // Check pricing concern trigger
    if (config.triggers.pricing_concern && config.triggers.pricing_concern.enabled) {
      const trigger = config.triggers.pricing_concern;
      const timeInSeconds = Math.floor(timeOnPage);
      
      if (trigger.url_patterns && trigger.url_patterns.length > 0) {
        const urlMatches = trigger.url_patterns.some(pattern => {
          if (!pattern) return false;
          const cleanPattern = pattern.trim();
          const normalizedPattern = cleanPattern.toLowerCase();
          const normalizedUrl = (currentUrl || '').toLowerCase();
          const normalizedPath = (currentPath || '').toLowerCase();
          const normalizedHash = (currentHash || '').toLowerCase();
          
          // Hash pattern matching
          if (cleanPattern.startsWith('#')) {
            const hashWithoutSymbol = cleanPattern.substring(1);
            return normalizedHash === normalizedPattern || 
                   normalizedHash === '#' + hashWithoutSymbol ||
                   normalizedHash.substring(1) === hashWithoutSymbol;
          }
          // Path pattern matching
          else {
            return normalizedPath.includes(normalizedPattern) ||
                   normalizedUrl.includes(normalizedPattern) ||
                   normalizedPath === '/' + normalizedPattern ||
                   normalizedPath.endsWith('/' + normalizedPattern);
          }
        });

        if (urlMatches && timeInSeconds >= (trigger.time_threshold || 30)) {
          console.log('Pricing concern trigger activated');
          return {
            triggered: true,
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
          if (!pattern) return false;
          const cleanPattern = pattern.trim();
          const normalizedPattern = cleanPattern.toLowerCase();
          const normalizedUrl = (currentUrl || '').toLowerCase();
          const normalizedPath = (currentPath || '').toLowerCase();
          const normalizedHash = (currentHash || '').toLowerCase();
          
          // Hash pattern matching
          if (cleanPattern.startsWith('#')) {
            const hashWithoutSymbol = cleanPattern.substring(1);
            return normalizedHash === normalizedPattern || 
                   normalizedHash === '#' + hashWithoutSymbol ||
                   normalizedHash.substring(1) === hashWithoutSymbol;
          }
          // Path pattern matching
          else {
            return normalizedPath.includes(normalizedPattern) ||
                   normalizedUrl.includes(normalizedPattern) ||
                   normalizedPath === '/' + normalizedPattern ||
                   normalizedPath.endsWith('/' + normalizedPattern);
          }
        });

        if (urlMatches) {
          console.log('Feature exploration trigger activated');
          return {
            triggered: true,
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
      const timeInSeconds = typeof timeOnPage === 'number' ? Math.floor(timeOnPage) : timeOnPage || 0;
      
      if (timeInSeconds >= (trigger.time_threshold || 120)) {
        console.log('High engagement trigger activated');
        return {
          triggered: true,
          suggestedMessage: trigger.message,
          triggerType: 'high_engagement',
          reason: 'High engagement time detected'
        };
      }
    }
  }

  console.log('No triggers activated');
  return {
    triggered: false,
    suggestedMessage: null,
    triggerType: null,
    reason: 'No triggers met'
  };
}