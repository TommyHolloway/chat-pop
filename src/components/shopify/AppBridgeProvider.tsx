import React, { useMemo } from 'react';
import createApp from '@shopify/app-bridge';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export const AppBridgeProvider = ({ children }: AppBridgeProviderProps) => {
  // Get shop from URL parameters (Shopify embeds will include this)
  const host = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('host') || '';
  }, []);

  const shopOrigin = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('shop') || '';
  }, []);

  const config = useMemo(() => ({
    apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID || '',
    host: host,
    forceRedirect: false,
  }), [host]);

  // Initialize App Bridge
  useMemo(() => {
    if (config.apiKey && host) {
      createApp(config);
    }
  }, [config, host]);

  if (!config.apiKey) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Error: Shopify API key not configured. Please set VITE_SHOPIFY_CLIENT_ID.</p>
      </div>
    );
  }

  return (
    <AppProvider i18n={{}}>
      {children}
    </AppProvider>
  );
};
