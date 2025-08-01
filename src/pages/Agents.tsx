import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Plus, 
  Settings, 
  MessageSquare, 
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';

export const Agents = () => {
  const { agents, loading } = useAgents();

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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">{agent.name}</CardTitle>
                          {agent.description && (
                            <CardDescription className="line-clamp-2">
                              {agent.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agent.instructions && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {agent.instructions}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Link to={`/agents/${agent.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        </Link>
                        <Link to={`/playground?agent=${agent.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Test
                          </Button>
                        </Link>
                        <Link to={`/deploy?agent=${agent.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Deploy
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};