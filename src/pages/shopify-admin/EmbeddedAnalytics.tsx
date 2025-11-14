import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  BlockStack,
  InlineGrid,
  Select,
  SkeletonBodyText,
} from '@shopify/polaris';
import { useAuth } from '@/contexts/AuthContext';
import { useShopifySession } from '@/hooks/useShopifySession';

export const EmbeddedAnalytics = () => {
  const { user } = useAuth();
  const { session, isLoading: sessionLoading } = useShopifySession();
  const [timeRange, setTimeRange] = useState('7days');
  const [analytics, setAnalytics] = useState({
    totalVisitors: 0,
    totalConversations: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    cartRecoveryRate: 0,
    leadsGenerated: 0,
  });

  useEffect(() => {
    // TODO: Fetch analytics data from backend
    // This would call your existing analytics endpoints
    const fetchAnalytics = async () => {
      // Placeholder data
      setAnalytics({
        totalVisitors: 1234,
        totalConversations: 456,
        conversionRate: 12.5,
        averageOrderValue: 89.99,
        cartRecoveryRate: 23.4,
        leadsGenerated: 78,
      });
    };

    fetchAnalytics();
  }, [timeRange]);

  const timeRangeOptions = [
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' },
    { label: 'This year', value: 'year' },
  ];

  if (sessionLoading) {
    return (
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <Card>
              <SkeletonBodyText lines={3} />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Analytics"
      subtitle={`Track your ChatPop performance${session?.shop_name ? ` - ${session.shop_name}` : ''}`}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400" alignItems="center">
                <Text as="h2" variant="headingMd">
                  Performance Overview
                </Text>
                <div style={{ justifySelf: 'end' }}>
                  <Select
                    label="Time range"
                    labelHidden
                    options={timeRangeOptions}
                    value={timeRange}
                    onChange={setTimeRange}
                  />
                </div>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Visitors
                </Text>
                <Text as="p" variant="heading2xl">
                  {analytics.totalVisitors.toLocaleString()}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Conversations
                </Text>
                <Text as="p" variant="heading2xl">
                  {analytics.totalConversations.toLocaleString()}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Conversion Rate
                </Text>
                <Text as="p" variant="heading2xl">
                  {analytics.conversionRate}%
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Avg Order Value
                </Text>
                <Text as="p" variant="heading2xl">
                  ${analytics.averageOrderValue}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Cart Recovery Rate
                </Text>
                <Text as="p" variant="heading2xl">
                  {analytics.cartRecoveryRate}%
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Leads Generated
                </Text>
                <Text as="p" variant="heading2xl">
                  {analytics.leadsGenerated.toLocaleString()}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Recent Activity
              </Text>
              <Text as="p" tone="subdued">
                Detailed analytics and charts coming soon. Connect your agents to start collecting data.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
