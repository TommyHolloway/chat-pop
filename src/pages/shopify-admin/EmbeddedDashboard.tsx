import React, { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Banner,
  Button,
  SkeletonBodyText,
} from '@shopify/polaris';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useShopifySession } from '@/hooks/useShopifySession';

export const EmbeddedDashboard = () => {
  const { user } = useAuth();
  const { agents, loading: agentsLoading } = useAgents();
  const { currentWorkspace } = useWorkspaces();
  const { session, isLoading: sessionLoading } = useShopifySession();
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalConversations: 0,
    totalLeads: 0,
  });

  useEffect(() => {
    if (agents) {
      setStats({
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        totalConversations: 0, // TODO: Fetch from analytics
        totalLeads: 0, // TODO: Fetch from leads
      });
    }
  }, [agents]);

  if (sessionLoading) {
    return (
      <Page title="Dashboard">
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
      title="ChatPop Dashboard"
      subtitle={session?.shop_name || currentWorkspace?.name || 'Overview'}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title={`Welcome to ChatPop${session?.shop_name ? ` - ${session.shop_name}` : ''}`}
            tone="info"
          >
            <p>Manage your AI shopping assistants and track performance from your Shopify admin.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm" tone="subdued">
                  Total Agents
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.totalAgents}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm" tone="subdued">
                  Active Agents
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.activeAgents}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm" tone="subdued">
                  Conversations
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.totalConversations}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm" tone="subdued">
                  Leads Captured
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.totalLeads}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Your AI Agents
              </Text>
              {agentsLoading ? (
                <Text as="p">Loading agents...</Text>
              ) : agents && agents.length > 0 ? (
                <BlockStack gap="200">
                  {agents.map((agent) => (
                    <Box key={agent.id} padding="400" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          {agent.name}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Status: {agent.status} • Created: {new Date(agent.created_at).toLocaleDateString()}
                        </Text>
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              ) : (
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">
                    No agents created yet. Create your first AI shopping assistant to get started.
                  </Text>
                  <Button>Create Agent</Button>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
