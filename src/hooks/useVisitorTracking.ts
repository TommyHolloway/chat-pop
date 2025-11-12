import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VisitorStats {
  currentMonthVisitors: number;
  limit: number;
  canAcceptVisitors: boolean;
  plan: string;
  isLoading: boolean;
}

export const useVisitorTracking = () => {
  const { user } = useAuth();
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    currentMonthVisitors: 0,
    limit: 100,
    canAcceptVisitors: true,
    plan: 'free',
    isLoading: true
  });

  useEffect(() => {
    if (!user) return;

    const fetchVisitorStats = async () => {
      try {
        const { data, error } = await supabase
          .rpc('check_visitor_limit', { p_user_id: user.id });

        if (error) {
          console.error('Error fetching visitor stats:', error);
          return;
        }

        if (data && data.length > 0) {
          const stats = data[0];
          setVisitorStats({
            currentMonthVisitors: stats.current_visitors || 0,
            limit: stats.visitor_limit || 100,
            canAcceptVisitors: stats.can_accept_visitor ?? true,
            plan: stats.plan || 'free',
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error in fetchVisitorStats:', error);
      } finally {
        setVisitorStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchVisitorStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchVisitorStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return visitorStats;
};
