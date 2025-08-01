import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bot, 
  Plus, 
  Settings, 
  MessageSquare, 
  ExternalLink,
  Loader2,
  FileText,
  Calendar,
  MoreHorizontal,
  Edit,
  Play,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAgents } from '@/hooks/useAgents';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { useToast } from '@/hooks/use-toast';

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
                <Card key={agent.id} className="hover-lift">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(agent.updated_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Agent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/playground`} className="flex items-center">
                            <Play className="mr-2 h-4 w-4" />
                            Test Agent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/deploy`} className="flex items-center">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Deploy
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {agent.description || 'No description provided'}
                    </CardDescription>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status</span>
                        <div className="font-semibold capitalize">{agent.status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created</span>
                        <div className="font-semibold">{format(new Date(agent.created_at), 'MMM d')}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link to={`/agents/${agent.id}/playground`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Play className="mr-2 h-3 w-3" />
                          Test
                        </Button>
                      </Link>
                      <Link to={`/agents/${agent.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
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