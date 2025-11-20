import { useState, useEffect } from 'react';
import { createApp } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { supabase } from '@/integrations/supabase/client';

interface ShopifySessionData {
  shop_domain: string;
  agent_id?: string;
  shop_name?: string;
  shop_owner_email?: string;
  valid: boolean;
  hasConnection?: boolean;
}

interface UseShopifySessionReturn {
  session: ShopifySessionData | null;
  isLoading: boolean;
  error: string | null;
  isEmbedded: boolean;
  refreshSession: () => Promise<void>;
}

export const useShopifySession = (): UseShopifySessionReturn => {
  const [session, setSession] = useState<ShopifySessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const verifySessionToken = async (sessionToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-shopify-session', {
        body: { session_token: sessionToken },
      });

      if (error) throw error;

      if (data?.valid) {
        setSession({
          shop_domain: data.shop_domain,
          agent_id: data.agent_id,
          shop_name: data.shop_name,
          shop_owner_email: data.shop_owner_email,
          valid: true,
          hasConnection: !!data.agent_id, // If agent_id exists, connection exists
        });
        setError(null);
      } else {
        throw new Error(data?.error || 'Invalid session token');
      }
    } catch (err: any) {
      console.error('Session verification error:', err);
      setError(err.message || 'Failed to verify session');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!isEmbedded) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      const shop = params.get('shop');

      if (!host || !shop) {
        throw new Error('Missing Shopify parameters (host or shop)');
      }

      const apiKey = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
      if (!apiKey) {
        throw new Error('VITE_SHOPIFY_CLIENT_ID not configured');
      }

      const app = createApp({
        apiKey,
        host,
      });

      const token = await getSessionToken(app);
      await verifySessionToken(token);
    } catch (err: any) {
      console.error('Session refresh error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get('host');
    const shop = params.get('shop');

    // Detect if running in Shopify Admin iframe
    const embedded = !!(host && shop);
    setIsEmbedded(embedded);

    if (embedded) {
      refreshSession();
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    session,
    isLoading,
    error,
    isEmbedded,
    refreshSession,
  };
};
