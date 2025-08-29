import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisitorSession {
  id: string;
  session_id: string;
  agent_id: string;
  user_agent?: string;
  referrer?: string;
  ip_address?: unknown; // Database stores as INET type
  country_code?: string;
  first_page_url?: string;
  current_page_url?: string;
  total_page_views: number;
  total_time_spent: number;
  created_at: string;
  updated_at: string;
}

interface BehaviorEvent {
  id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  element_selector?: string;
  scroll_depth?: number;
  time_on_page?: number;
  event_data: any;
  created_at: string;
}

interface ProactiveSuggestion {
  id: string;
  session_id: string;
  agent_id: string;
  suggestion_type: string;
  suggestion_message: string;
  confidence_score: number;
  was_shown: boolean;
  was_clicked: boolean;
  conversation_started: boolean;
  behavioral_triggers: any;
  created_at: string;
}

export const useVisitorBehavior = (agentId: string) => {
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;

    const fetchVisitorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch visitor sessions for the agent
        const { data: sessions, error: sessionsError } = await supabase
          .from('visitor_sessions')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (sessionsError) throw sessionsError;

        setVisitorSessions(sessions || []);

        // Get session IDs to fetch related data
        const sessionIds = sessions?.map(s => s.session_id) || [];

        if (sessionIds.length > 0) {
          // Fetch behavior events
          const { data: events, error: eventsError } = await supabase
            .from('visitor_behavior_events')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(200);

          if (eventsError) throw eventsError;
          setBehaviorEvents(events || []);

          // Fetch proactive suggestions
          const { data: suggestions, error: suggestionsError } = await supabase
            .from('proactive_suggestions')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(100);

          if (suggestionsError) throw suggestionsError;
          setProactiveSuggestions(suggestions || []);
        }

      } catch (err) {
        console.error('Error fetching visitor behavior data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch visitor data');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, [agentId]);

  const refreshData = () => {
    if (agentId) {
      const fetchData = async () => {
        // Simplified refresh logic
        try {
          const { data: sessions } = await supabase
            .from('visitor_sessions')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(50);

          setVisitorSessions(sessions || []);
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      };
      fetchData();
    }
  };

  // Calculate analytics metrics
  const analytics = {
    totalSessions: visitorSessions.length,
    totalPageViews: visitorSessions.reduce((sum, session) => sum + session.total_page_views, 0),
    averageTimeSpent: visitorSessions.length > 0 
      ? Math.round(visitorSessions.reduce((sum, session) => sum + session.total_time_spent, 0) / visitorSessions.length)
      : 0,
    totalSuggestions: proactiveSuggestions.length,
    suggestionsShown: proactiveSuggestions.filter(s => s.was_shown).length,
    suggestionsClicked: proactiveSuggestions.filter(s => s.was_clicked).length,
    conversionsFromSuggestions: proactiveSuggestions.filter(s => s.conversation_started).length,
    conversionRate: proactiveSuggestions.length > 0 
      ? Math.round((proactiveSuggestions.filter(s => s.conversation_started).length / proactiveSuggestions.length) * 100)
      : 0
  };

  return {
    visitorSessions,
    behaviorEvents,
    proactiveSuggestions,
    analytics,
    loading,
    error,
    refreshData
  };
};