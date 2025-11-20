import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bot, 
  Plus,
  Loader2
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { useToast } from '@/hooks/use-toast';
import { AgentCard } from '@/components/shared/AgentCard';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { CreateAgentDialog } from '@/components/CreateAgentDialog';
import { useUserPlan } from '@/hooks/useUserPlan';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store } from 'lucide-react';

export const Agents = () => {
  const { agents, loading, deleteAgent, refetchAgents } = useAgents();
  const { currentWorkspace } = useWorkspaces();
  const { billingProvider } = useUserPlan();
  const { toast } = useToast();
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  
  const isShopifyBilling = billingProvider === 'shopify';
  const hasReachedShopifyLimit = isShopifyBilling && agents.length >= 1;

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

  useEffect(() => {
    // Agents are automatically fetched by the hook
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI Agents</h1>
              <p className="text-muted-foreground">
                Manage your AI agents and their configurations
              </p>
            </div>
            <PlanEnforcementWrapper feature="agent">
              <Button onClick={() => setShowCreateAgent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Agent
              </Button>
            </PlanEnforcementWrapper>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Shopify 1-Agent Info Banner */}
          {isShopifyBilling && agents.length > 0 && (
            <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
              <Store className="h-4 w-4" />
              <AlertDescription>
                Shopify stores are limited to 1 agent per workspace. This ensures optimal performance and integration with your Shopify storefront.
              </AlertDescription>
            </Alert>
          )}
          
          {agents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first AI agent to get started
                </p>
                <PlanEnforcementWrapper feature="agent">
                  <Button onClick={() => setShowCreateAgent(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </PlanEnforcementWrapper>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onDelete={handleDeleteAgent}
                  variant="agents"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Agent Dialog */}
      {currentWorkspace && (
        <CreateAgentDialog 
          open={showCreateAgent} 
          onOpenChange={setShowCreateAgent}
          workspaceId={currentWorkspace.id}
        />
      )}
    </div>
    </>
  );
};