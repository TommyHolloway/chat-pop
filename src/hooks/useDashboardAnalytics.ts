import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardAnalytics {
  totalAgents: number;
  totalConversations: number;
  responseRate: number;
  activeUsers: number;
  isLoading: boolean;
}

export const useDashboardAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalAgents: 0,
    totalConversations: 0,
    responseRate: 0,
    activeUsers: 0,
    isLoading: true
  });

  const fetchAnalytics = async () => {
    if (!user) {
      setAnalytics(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setAnalytics(prev => ({ ...prev, isLoading: true }));

      // Get user's agents count
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total conversations for user's agents
      const { data: agentIds } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id);

      let totalConversations = 0;
      let activeUsers = 0;

      if (agentIds && agentIds.length > 0) {
        const agentIdList = agentIds.map(agent => agent.id);
        
        // Get conversations count
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('agent_id', agentIdList);

        totalConversations = conversationsCount || 0;

        // Get unique users count (based on unique session_ids)
        const { data: uniqueSessions } = await supabase
          .from('conversations')
          .select('session_id')
          .in('agent_id', agentIdList);

        const uniqueSessionIds = new Set(uniqueSessions?.map(c => c.session_id) || []);
        activeUsers = uniqueSessionIds.size;
      }

      // Calculate response rate based on conversations with messages
      let responseRate = 0;
      if (totalConversations > 0) {
        const { data: conversationsWithMessages } = await supabase
          .from('conversations')
          .select(`
            id,
            messages(count)
          `)
          .in('agent_id', agentIds?.map(a => a.id) || []);

        const conversationsWithResponses = conversationsWithMessages?.filter(
          conv => conv.messages && conv.messages.length > 1
        ).length || 0;

        responseRate = Math.round((conversationsWithResponses / totalConversations) * 100);
      }

      setAnalytics({
        totalAgents: agentsCount || 0,
        totalConversations,
        responseRate,
        activeUsers,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      setAnalytics(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  return { analytics, refetch: fetchAnalytics };
};