import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DateRange {
  from: Date;
  to: Date;
}

interface EcommerceMetrics {
  totalRevenue: number;
  totalOrders: number;
  cartsRecovered: number;
  recoveryRate: number;
  avgOrderValue: number;
  chartData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export const useEcommerceAnalytics = (agentId: string, dateRange: DateRange) => {
  return useQuery({
    queryKey: ['ecommerce-analytics', agentId, dateRange],
    queryFn: async (): Promise<EcommerceMetrics> => {
      const { data, error } = await supabase.functions.invoke('get-ecommerce-analytics', {
        body: {
          agentId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        }
      });

      if (error) throw error;
      
      return data as EcommerceMetrics;
    },
    enabled: !!agentId
  });
};
