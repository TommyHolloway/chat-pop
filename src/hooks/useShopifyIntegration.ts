import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useShopifyIntegration = (agentId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const connectShopify = async (storeDomain: string, accessToken: string, storefrontToken?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_connections')
        .insert({
          agent_id: agentId,
          store_domain: storeDomain,
          access_token: accessToken,
          storefront_api_token: storefrontToken,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Connected to Shopify",
        description: "Your store has been connected successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error connecting Shopify:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Shopify. Please check your credentials.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectShopify = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shopify_connections')
        .delete()
        .eq('agent_id', agentId);

      if (error) throw error;

      toast({
        title: "Disconnected from Shopify",
        description: "Your store has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
      toast({
        title: "Disconnection failed",
        description: "Failed to disconnect from Shopify.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-sync-products', {
        body: { agentId },
      });

      if (error) throw error;

      toast({
        title: "Products synced",
        description: `Successfully synced ${data.productsAdded} products with ${data.variantsAdded} variants.`,
      });

      return data;
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync products from Shopify.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getConnection = async () => {
    const { data, error } = await supabase
      .from('shopify_connections')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const getProducts = async (filters?: { search?: string; available?: boolean }) => {
    let query = supabase
      .from('shopify_products')
      .select('*, shopify_connections!inner(agent_id)')
      .eq('shopify_connections.agent_id', agentId);

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.available !== undefined) {
      query = query.eq('available', filters.available);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  return {
    connectShopify,
    disconnectShopify,
    syncProducts,
    getConnection,
    getProducts,
    isLoading,
  };
};
