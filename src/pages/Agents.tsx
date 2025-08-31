import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export const Agents = () => {
  const { agents, loading, deleteAgent, refetchAgents } = useAgents();
  const { toast } = useToast();

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
              <Link to="/agents/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Agent
                </Button>
              </Link>
            </PlanEnforcementWrapper>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {agents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first AI agent to get started
                </p>
                <PlanEnforcementWrapper feature="agent">
                  <Link to="/agents/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Agent
                    </Button>
                  </Link>
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
    </div>
  );
};