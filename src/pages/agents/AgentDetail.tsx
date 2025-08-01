import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bot, 
  Settings, 
  Play, 
  Globe, 
  MessageSquare,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { AgentForm } from './AgentForm';
import { Playground } from './Playground';
import { Deploy } from './Deploy';
import { ConversationManager } from '@/components/agent/ConversationManager';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AgentDetail = () => {
  const { id, tab = 'overview' } = useParams();
  const { getAgent } = useAgents();
  const { analytics } = useAnalytics(id!);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgent = async () => {
      if (id) {
        try {
          const agentData = await getAgent(id);
          setAgent(agentData);
        } catch (error) {
          console.error('Error loading agent:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'edit':
        return <AgentForm />;
      case 'test':
        return <Playground />;
      case 'deploy':
        return <Deploy />;
      case 'conversations':
        return <ConversationManager agentId={id!} />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {analytics.isLoading ? '...' : analytics.totalConversations.toLocaleString()}
                  </CardTitle>
                  <CardDescription>Total Conversations</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {analytics.isLoading ? '...' : `${analytics.resolutionRate}%`}
                  </CardTitle>
                  <CardDescription>Resolution Rate</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {analytics.isLoading ? '...' : `${analytics.avgResponseTime}s`}
                  </CardTitle>
                  <CardDescription>Avg Response Time</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {agent.name}
                  </div>
                  <Badge variant="default">Active</Badge>
                </CardTitle>
                <CardDescription>
                  {agent.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.isLoading ? '...' : analytics.totalConversations.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.isLoading ? '...' : `${analytics.resolutionRate}%`}
                    </div>
                    <div className="text-sm text-muted-foreground">Resolution Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.isLoading ? '...' : `${analytics.avgResponseTime}s`}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to={`/agents/${id}/edit`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Edit Agent
                    </CardTitle>
                    <CardDescription>
                      Modify instructions and training data
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={`/agents/${id}/test`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Test Agent
                    </CardTitle>
                    <CardDescription>
                      Try out your agent in the playground
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={`/agents/${id}/deploy`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Deploy Agent
                    </CardTitle>
                    <CardDescription>
                      Get embed codes and share links
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">
                {agent.description || 'AI Agent Management'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={tab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" asChild>
                <Link to={`/agents/${id}`} className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Overview
                </Link>
              </TabsTrigger>
              <TabsTrigger value="edit" asChild>
                <Link to={`/agents/${id}/edit`} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Edit
                </Link>
              </TabsTrigger>
              <TabsTrigger value="test" asChild>
                <Link to={`/agents/${id}/test`} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Test
                </Link>
              </TabsTrigger>
              <TabsTrigger value="deploy" asChild>
                <Link to={`/agents/${id}/deploy`} className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Deploy
                </Link>
              </TabsTrigger>
              <TabsTrigger value="conversations" asChild>
                <Link to={`/agents/${id}/conversations`} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversations
                </Link>
              </TabsTrigger>
              <TabsTrigger value="analytics" asChild>
                <Link to={`/agents/${id}/analytics`} className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="space-y-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};