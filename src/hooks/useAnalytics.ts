import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalConversations: number;
  resolutionRate: number;
  avgResponseTime: number;
  isLoading: boolean;
}

export const useAnalytics = (agentId: string) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    resolutionRate: 0,
    avgResponseTime: 0,
    isLoading: true
  });

  useEffect(() => {
    if (agentId) {
      fetchAnalytics();
    }
  }, [agentId]);

  const fetchAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, isLoading: true }));

      // Get total conversations for this agent
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Mock data for now - in a real app, you'd calculate these from actual data
      const mockResolutionRate = Math.random() * 20 + 80; // 80-100%
      const mockAvgResponseTime = Math.random() * 2 + 0.5; // 0.5-2.5s

      setAnalytics({
        totalConversations: conversationsCount || 0,
        resolutionRate: Number(mockResolutionRate.toFixed(1)),
        avgResponseTime: Number(mockAvgResponseTime.toFixed(1)),
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({ ...prev, isLoading: false }));
    }
  };

  return { analytics, refetch: fetchAnalytics };
};