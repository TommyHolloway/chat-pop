import React, { useState } from 'react';
import {
  Page,
  Card,
  Layout,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  Banner,
} from '@shopify/polaris';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useShopifySession } from '@/hooks/useShopifySession';

export const EmbeddedSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { session, isLoading: sessionLoading } = useShopifySession();
  const [settings, setSettings] = useState({
    companyName: '',
    supportEmail: user?.email || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement settings save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Loading session...</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      subtitle="Configure your ChatPop integration"
    >
      <Layout>
        <Layout.Section>
          {session?.shop_domain ? (
            <Banner title="Shopify Integration Active" tone="success">
              <BlockStack gap="200">
                <Text as="p" fontWeight="semibold">
                  Connected to: {session.shop_name || session.shop_domain}
                </Text>
                <Text as="p">
                  Your ChatPop app is successfully connected to your Shopify store.
                </Text>
              </BlockStack>
            </Banner>
          ) : (
            <Banner tone="warning">
              <Text as="p">
                This app must be accessed from within Shopify Admin to function properly.
              </Text>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                General Settings
              </Text>
              <FormLayout>
                <TextField
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(value) => setSettings({ ...settings, companyName: value })}
                  autoComplete="organization"
                />
                <TextField
                  label="Support Email"
                  value={settings.supportEmail}
                  onChange={(value) => setSettings({ ...settings, supportEmail: value })}
                  type="email"
                  autoComplete="email"
                />
                <TextField
                  label="Shop Domain"
                  value={session?.shop_domain || 'Not connected'}
                  onChange={() => {}}
                  helpText="Your Shopify store domain (automatically detected)"
                  autoComplete="off"
                  disabled
                />
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={loading}
                >
                  Save Settings
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                API Configuration
              </Text>
              <Text as="p" tone="subdued">
                Your API credentials are securely stored and managed through the Shopify app installation.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
