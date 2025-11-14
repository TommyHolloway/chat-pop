import React, { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Divider,
  List,
  SkeletonBodyText,
} from '@shopify/polaris';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { pricingPlans } from '@/config/pricing';
import { useShopifySession } from '@/hooks/useShopifySession';

export const EmbeddedBilling = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { session, isLoading: sessionLoading } = useShopifySession();
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    if (subscription) {
      setCurrentPlan(subscription.subscription_tier || 'free');
    }
  }, [subscription]);

  const handleUpgrade = async (planId: string) => {
    // TODO: Implement Shopify Billing API subscription creation
    console.log('Upgrading to:', planId);
  };

  if (sessionLoading) {
    return (
      <Page title="Billing & Subscription">
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
      title="Billing & Subscription"
      subtitle={`Manage your ChatPop subscription${session?.shop_name ? ` - ${session.shop_name}` : ''}`}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Current Plan
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="headingLg">
                      {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                    </Text>
                    <Badge tone={currentPlan === 'free' ? 'info' : 'success'}>
                      {currentPlan === 'free' ? 'Free Plan' : 'Active'}
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </InlineStack>

              {subscription.subscription_end && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Subscription active until: {new Date(subscription.subscription_end).toLocaleDateString()}
                  </Text>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Available Plans
            </Text>
            {pricingPlans.map((plan) => (
              <Card key={plan.name.toLowerCase()}>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="h3" variant="headingMd">
                          {plan.name}
                        </Text>
                        {plan.name.toLowerCase() === currentPlan && (
                          <Badge tone="success">Current Plan</Badge>
                        )}
                      </InlineStack>
                      <Text as="p" variant="headingLg">
                        {plan.price}
                        <Text as="span" variant="bodySm" tone="subdued"> /{plan.period}</Text>
                      </Text>
                    </BlockStack>
                    {plan.name.toLowerCase() !== currentPlan && plan.name.toLowerCase() !== 'free' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpgrade(plan.name.toLowerCase())}
                      >
                        Upgrade
                      </Button>
                    )}
                  </InlineStack>

                  <Divider />

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Features:
                    </Text>
                    <List type="bullet">
                      {plan.features.map((feature, index) => (
                        <List.Item key={index}>{feature}</List.Item>
                      ))}
                    </List>
                  </BlockStack>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
