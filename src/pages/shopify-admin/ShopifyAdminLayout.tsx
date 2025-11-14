import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Frame, Navigation } from '@shopify/polaris';
import { HomeIcon, SettingsIcon, ChartVerticalIcon, CreditCardIcon } from '@shopify/polaris-icons';
import { AppBridgeProvider } from '@/components/shopify/AppBridgeProvider';
import { EmbeddedDashboard } from './EmbeddedDashboard';
import { EmbeddedSettings } from './EmbeddedSettings';
import { EmbeddedBilling } from './EmbeddedBilling';
import { EmbeddedAnalytics } from './EmbeddedAnalytics';
import { useNavigate, useLocation } from 'react-router-dom';

export const ShopifyAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationMarkup = (
    <Navigation location="">
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeIcon,
            onClick: () => navigate('/shopify-admin/dashboard'),
            selected: location.pathname === '/shopify-admin/dashboard' || location.pathname === '/shopify-admin',
          },
          {
            label: 'Analytics',
            icon: ChartVerticalIcon,
            onClick: () => navigate('/shopify-admin/analytics'),
            selected: location.pathname === '/shopify-admin/analytics',
          },
          {
            label: 'Billing',
            icon: CreditCardIcon,
            onClick: () => navigate('/shopify-admin/billing'),
            selected: location.pathname === '/shopify-admin/billing',
          },
          {
            label: 'Settings',
            icon: SettingsIcon,
            onClick: () => navigate('/shopify-admin/settings'),
            selected: location.pathname === '/shopify-admin/settings',
          },
        ]}
      />
    </Navigation>
  );

  return (
    <AppBridgeProvider>
      <Frame navigation={navigationMarkup}>
        <Routes>
          <Route index element={<Navigate to="/shopify-admin/dashboard" replace />} />
          <Route path="dashboard" element={<EmbeddedDashboard />} />
          <Route path="analytics" element={<EmbeddedAnalytics />} />
          <Route path="billing" element={<EmbeddedBilling />} />
          <Route path="settings" element={<EmbeddedSettings />} />
        </Routes>
      </Frame>
    </AppBridgeProvider>
  );
};
