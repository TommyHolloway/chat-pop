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

export const EmbeddedSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    companyName: '',
    supportEmail: user?.email || '',
    shopDomain: '',
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

  return (
    <Page
      title="Settings"
      subtitle="Configure your ChatPop integration"
    >
      <Layout>
        <Layout.Section>
          <Banner title="Shopify Integration Active" tone="success">
            <p>Your ChatPop app is successfully connected to your Shopify store.</p>
          </Banner>
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
                  value={settings.shopDomain}
                  onChange={(value) => setSettings({ ...settings, shopDomain: value })}
                  helpText="Your Shopify store domain (e.g., mystore.myshopify.com)"
                  autoComplete="off"
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
