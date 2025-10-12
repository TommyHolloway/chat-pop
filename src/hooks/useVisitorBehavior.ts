import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { toUTCStart, toUTCEnd } from '@/lib/dateUtils';

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
  const { user, session } = useAuth();
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    
    // Don't fetch if user is not authenticated
    if (!user || !session) {
      setLoading(false);
      setError('Please log in to view analytics data');
      return;
    }

    const fetchVisitorData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching visitor data for agent:', agentId, 'User:', user.id);

        // Apply date filtering
        let query = supabase
          .from('visitor_sessions')
          .select('*')
          .eq('agent_id', agentId);

        if (dateRange?.from && dateRange?.to) {
          query = query
            .gte('created_at', toUTCStart(dateRange.from))
            .lte('created_at', toUTCEnd(dateRange.to));
        }

        const { data: sessions, error: sessionsError } = await query
          .order('created_at', { ascending: false })
          .limit(200);

        if (sessionsError) {
          console.error('Sessions error:', sessionsError);
          throw sessionsError;
        }

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
              .gte('created_at', toUTCStart(dateRange.from))
              .lte('created_at', toUTCEnd(dateRange.to));
          }

          const { data: events, error: eventsError } = await eventsQuery
            .order('created_at', { ascending: false })
            .limit(500);

          if (eventsError) {
            console.error('Events error:', eventsError);
            throw eventsError;
          }
          setBehaviorEvents(events || []);
        }

        // Fetch proactive suggestions with date filtering
        let suggestionsQuery = supabase
          .from('proactive_suggestions')
          .select('*')
          .eq('agent_id', agentId);

        if (dateRange?.from && dateRange?.to) {
          suggestionsQuery = suggestionsQuery
            .gte('created_at', toUTCStart(dateRange.from))
            .lte('created_at', toUTCEnd(dateRange.to));
        }

        const { data: suggestions, error: suggestionsError } = await suggestionsQuery
          .order('created_at', { ascending: false })
          .limit(200);

        if (suggestionsError) {
          console.error('Suggestions error:', suggestionsError);
          throw suggestionsError;
        }
        setProactiveSuggestions(suggestions || []);

      } catch (err) {
        console.error('Error fetching visitor behavior data:', err);
        
        // Handle specific error types
        if (err && typeof err === 'object' && 'message' in err) {
          const errorMessage = (err as any).message;
          if (errorMessage.includes('Failed to fetch')) {
            setError('Unable to connect to the server. Please check your internet connection and try again.');
          } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
            setError('Access denied. Please ensure you have permission to view this agent\'s data.');
          } else {
            setError(errorMessage);
          }
        } else {
          setError('Failed to fetch visitor data');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure authentication is fully established
    const timer = setTimeout(() => {
      fetchVisitorData();
    }, 100);

    return () => clearTimeout(timer);
  }, [agentId, dateRange, user?.id, session?.access_token]);

  const refreshData = async () => {
    if (!agentId || !user || !session) return;
    
    try {
      setLoading(true);
      setError(null);

      // Apply the same date filtering logic as main fetch
      let query = supabase
        .from('visitor_sessions')
        .select('*')
        .eq('agent_id', agentId);

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte('created_at', toUTCStart(dateRange.from))
          .lte('created_at', toUTCEnd(dateRange.to));
      }

      const { data: sessions, error: sessionsError } = await query
        .order('created_at', { ascending: false })
        .limit(200);

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
        throw sessionsError;
      }

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
            .gte('created_at', toUTCStart(dateRange.from))
            .lte('created_at', toUTCEnd(dateRange.to));
        }

        const { data: events, error: eventsError } = await eventsQuery
          .order('created_at', { ascending: false })
          .limit(500);

        if (eventsError) {
          console.error('Events error:', eventsError);
          throw eventsError;
        }
        setBehaviorEvents(events || []);
      }

      // Fetch proactive suggestions with date filtering
      let suggestionsQuery = supabase
        .from('proactive_suggestions')
        .select('*')
        .eq('agent_id', agentId);

      if (dateRange?.from && dateRange?.to) {
        suggestionsQuery = suggestionsQuery
          .gte('created_at', toUTCStart(dateRange.from))
          .lte('created_at', toUTCEnd(dateRange.to));
      }

      const { data: suggestions, error: suggestionsError } = await suggestionsQuery
        .order('created_at', { ascending: false })
        .limit(200);

      if (suggestionsError) {
        console.error('Suggestions error:', suggestionsError);
        throw suggestionsError;
      }
      setProactiveSuggestions(suggestions || []);

    } catch (err) {
      console.error('Error refreshing visitor behavior data:', err);
      
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as any).message;
        if (errorMessage.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
          setError('Access denied. Please ensure you have permission to view this agent\'s data.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to refresh visitor data');
      }
    } finally {
      setLoading(false);
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