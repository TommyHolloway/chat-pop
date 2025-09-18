import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

export const useVisitorBehavior = (agentId: string, dateRange?: { from: Date; to: Date }) => {
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

        // Apply date filtering
        let query = supabase
          .from('visitor_sessions')
          .select('*')
          .eq('agent_id', agentId);

        if (dateRange?.from && dateRange?.to) {
          query = query
            .gte('created_at', startOfDay(dateRange.from).toISOString())
            .lte('created_at', endOfDay(dateRange.to).toISOString());
        }

        const { data: sessions, error: sessionsError } = await query
          .order('created_at', { ascending: false })
          .limit(200);

        if (sessionsError) throw sessionsError;

        setVisitorSessions(sessions || []);

        // Get session IDs to fetch related data
        const sessionIds = sessions?.map(s => s.session_id) || [];

        if (sessionIds.length > 0) {
          // Fetch behavior events with date filtering
          let eventsQuery = supabase
            .from('visitor_behavior_events')
            .select('*')
            .in('session_id', sessionIds);

          if (dateRange?.from && dateRange?.to) {
            eventsQuery = eventsQuery
              .gte('created_at', startOfDay(dateRange.from).toISOString())
              .lte('created_at', endOfDay(dateRange.to).toISOString());
          }

          const { data: events, error: eventsError } = await eventsQuery
            .order('created_at', { ascending: false })
            .limit(500);

          if (eventsError) throw eventsError;
          setBehaviorEvents(events || []);
        }

        // Fetch proactive suggestions with date filtering
        let suggestionsQuery = supabase
          .from('proactive_suggestions')
          .select('*')
          .eq('agent_id', agentId);

        if (dateRange?.from && dateRange?.to) {
          suggestionsQuery = suggestionsQuery
            .gte('created_at', startOfDay(dateRange.from).toISOString())
            .lte('created_at', endOfDay(dateRange.to).toISOString());
        }

        const { data: suggestions, error: suggestionsError } = await suggestionsQuery
          .order('created_at', { ascending: false })
          .limit(200);

        if (suggestionsError) throw suggestionsError;
        setProactiveSuggestions(suggestions || []);

      } catch (err) {
        console.error('Error fetching visitor behavior data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch visitor data');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, [agentId, dateRange]);

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