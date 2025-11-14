import React, { createContext, useContext, useState, useEffect } from 'react';
import { createApp } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { supabase } from '@/integrations/supabase/client';

interface ShopifySessionData {
  shop_domain: string;
  agent_id?: string;
  shop_name?: string;
  shop_owner_email?: string;
}

interface ShopifySessionContextType {
  session: ShopifySessionData | null;
  isEmbedded: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const ShopifySessionContext = createContext<ShopifySessionContextType | undefined>(undefined);

export const useShopifySession = () => {
  const context = useContext(ShopifySessionContext);
  if (!context) {
    throw new Error('useShopifySession must be used within ShopifySessionProvider');
  }
  return context;
};

interface ShopifySessionProviderProps {
  children: React.ReactNode;
}

export const ShopifySessionProvider = ({ children }: ShopifySessionProviderProps) => {
  const [session, setSession] = useState<ShopifySessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const verifySession = async (sessionToken: string) => {
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
        });
        setError(null);
      } else {
        throw new Error(data?.error || 'Invalid session');
      }
    } catch (err: any) {
      console.error('Session verification failed:', err);
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
        throw new Error('Missing required Shopify parameters');
      }

      const app = createApp({
        apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID || '',
        host: host,
      });

      const token = await getSessionToken(app);
      await verifySession(token);
    } catch (err: any) {
      console.error('Session refresh failed:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get('host');
    const shop = params.get('shop');

    // Check if running in Shopify embedded context
    const embedded = !!(host && shop);
    setIsEmbedded(embedded);

    if (embedded) {
      refreshSession();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <ShopifySessionContext.Provider
      value={{
        session,
        isEmbedded,
        isLoading,
        error,
        refreshSession,
      }}
    >
      {children}
    </ShopifySessionContext.Provider>
  );
};
