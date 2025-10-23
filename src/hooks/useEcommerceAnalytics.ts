import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EcommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  cartsRecovered: number;
  recoveryRevenue: number;
  avgOrderValue: number;
  recoveryRate: string;
  totalAbandoned: number;
}

export const useEcommerceAnalytics = (agentId: string, startDate: string, endDate: string) => {
  const [metrics, setMetrics] = useState<EcommerceMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [agentId, startDate, endDate]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-ecommerce-analytics', {
        body: { agentId, startDate, endDate },
      });

      if (error) throw error;

      setMetrics(data.totals);
      setChartData(data.chartData);
    } catch (error) {
      console.error('Error fetching e-commerce analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { metrics, chartData, isLoading, refetch: fetchMetrics };
};
