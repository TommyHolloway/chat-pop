import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { 
      sessionId, 
      agentId, 
      eventType, 
      pageUrl, 
      elementSelector,
      scrollDepth,
      timeOnPage,
      eventData,
      sessionData 
    } = await req.json();

    console.log('Tracking visitor behavior:', { sessionId, eventType, pageUrl });

    // First, upsert the visitor session
    if (sessionData) {
      const { error: sessionError } = await supabase
        .from('visitor_sessions')
        .upsert({
          session_id: sessionId,
          agent_id: agentId,
          user_agent: sessionData.userAgent,
          referrer: sessionData.referrer,
          ip_address: sessionData.ipAddress,
          first_page_url: sessionData.firstPageUrl,
          current_page_url: pageUrl,
          total_page_views: sessionData.totalPageViews || 1,
          total_time_spent: sessionData.totalTimeSpent || 0,
        }, {
          onConflict: 'session_id'
        });

      if (sessionError) {
        console.error('Error upserting visitor session:', sessionError);
        throw sessionError;
      }
    }

    // Then, insert the behavior event
    const { error: eventError } = await supabase
      .from('visitor_behavior_events')
      .insert({
        session_id: sessionId,
        event_type: eventType,
        page_url: pageUrl,
        element_selector: elementSelector,
        scroll_depth: scrollDepth,
        time_on_page: timeOnPage,
        event_data: eventData || {}
      });

    if (eventError) {
      console.error('Error inserting behavior event:', eventError);
      throw eventError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in track-visitor-behavior function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});