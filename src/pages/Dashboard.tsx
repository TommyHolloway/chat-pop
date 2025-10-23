import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Users,
  Loader2
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { AgentCard } from '@/components/shared/AgentCard';

export const Dashboard = () => {
  const { agents, loading, deleteAgent, refetchAgents } = useAgents();
  const { user } = useAuth();
  const { toast } = useToast();
  const { analytics } = useDashboardAnalytics();

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    try {
      await deleteAgent(agentId);
      await refetchAgents();
      toast({
        title: "Agent deleted",
        description: `${agentName} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Store Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.email?.split('@')[0]}! Here's what's happening with your AI shopping assistants.
              </p>
            </div>
            <PlanEnforcementWrapper feature="agent">
              <Link to="/agents/onboarding">
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shopping Assistant
                </Button>
              </Link>
            </PlanEnforcementWrapper>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopping Assistants</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.isLoading ? "..." : analytics.totalAgents}
              </div>
              <p className="text-xs text-muted-foreground">Active assistants</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Interactions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.isLoading ? "..." : analytics.totalConversations}
              </div>
              <p className="text-xs text-muted-foreground">Total interactions</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.isLoading ? "..." : `${analytics.responseRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">Agent response rate</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopper Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.isLoading ? "..." : analytics.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground">Unique shoppers</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Your AI Shopping Assistants</h2>
              <p className="text-muted-foreground">
                Manage and monitor your deployed shopping assistants
              </p>
            </div>
          </div>

          {agents.length === 0 ? (
            <Card className="p-16 text-center border-2 border-dashed">
              <div className="max-w-md mx-auto space-y-4">
                <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Create your first AI shopping assistant</h3>
                <p className="text-muted-foreground text-lg">
                  From website link to trained AI agent in under 60 seconds
                </p>
                <PlanEnforcementWrapper feature="agent">
                  <Link to="/agents/onboarding">
                    <Button size="lg" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </PlanEnforcementWrapper>
              </div>
            </Card>
          ) : (
            <>
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Create another assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Set up a new agent in 60 seconds with our guided wizard
                      </p>
                    </div>
                    <PlanEnforcementWrapper feature="agent">
                      <Link to="/agents/onboarding">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Assistant
                        </Button>
                      </Link>
                    </PlanEnforcementWrapper>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    variant="dashboard"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
