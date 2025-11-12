import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductLimitStats {
  currentProducts: number;
  limit: number;
  canAddProducts: boolean;
  plan: string;
  isLoading: boolean;
}

export const useProductLimit = (agentId: string | undefined) => {
  const [productStats, setProductStats] = useState<ProductLimitStats>({
    currentProducts: 0,
    limit: 100,
    canAddProducts: true,
    plan: 'free',
    isLoading: true
  });

  useEffect(() => {
    if (!agentId) {
      setProductStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchProductStats = async () => {
      try {
        const { data, error } = await supabase
          .rpc('check_product_limit', { p_agent_id: agentId });

        if (error) {
          console.error('Error fetching product stats:', error);
          return;
        }

        if (data && data.length > 0) {
          const stats = data[0];
          setProductStats({
            currentProducts: stats.current_products || 0,
            limit: stats.product_limit || 100,
            canAddProducts: stats.can_add_product ?? true,
            plan: stats.plan || 'free',
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error in fetchProductStats:', error);
      } finally {
        setProductStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchProductStats();
  }, [agentId]);

  return productStats;
};
