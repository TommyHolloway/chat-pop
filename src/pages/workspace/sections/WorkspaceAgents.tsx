import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Play, Edit, Trash2 } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { CreateAgentDialog } from '@/components/CreateAgentDialog';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const WorkspaceAgents = () => {
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentWorkspace } = useWorkspaces();
  const { agents, loading, deleteAgent, refetchAgents } = useAgents();
  const { toast } = useToast();

  const workspaceAgents = agents.filter(agent => 
    agent.workspace_id === currentWorkspace?.id &&
    (searchQuery === '' || agent.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Agents</h1>
          <p className="text-muted-foreground">
            Manage all AI agents in {currentWorkspace.name}
          </p>
        </div>
        <PlanEnforcementWrapper 
          feature="agent" 
          fallbackContent={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Agent (Upgrade Required)
            </Button>
          }
        >
          <Button onClick={() => setShowCreateAgent(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        </PlanEnforcementWrapper>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Agents Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workspaceAgents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No agents found' : 'No agents yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Create your first AI agent to get started'
                }
              </p>
              {!searchQuery && (
                <PlanEnforcementWrapper 
                  feature="agent" 
                  fallbackContent={
                    <Button disabled>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent (Upgrade Required)
                    </Button>
                  }
                >
                  <Button onClick={() => setShowCreateAgent(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Agent
                  </Button>
                </PlanEnforcementWrapper>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaceAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
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
                        <span className="text-xs text-muted-foreground">
                          {new Date(agent.updated_at).toLocaleDateString()}
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
                        <Link to={`/workspace/${currentWorkspace.id}/agents/${agent.id}/playground`} className="flex items-center">
                          <Play className="mr-2 h-4 w-4" />
                          Test Agent
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/workspace/${currentWorkspace.id}/agents/${agent.id}/settings/general`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Agent
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
                  <CardDescription className="mb-4 line-clamp-2">
                    {agent.description || 'No description provided'}
                  </CardDescription>
                  <div className="flex gap-2">
                    <Link to={`/workspace/${currentWorkspace.id}/agents/${agent.id}/playground`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Play className="mr-2 h-3 w-3" />
                        Test
                      </Button>
                    </Link>
                    <Link to={`/workspace/${currentWorkspace.id}/agents/${agent.id}/settings/general`} className="flex-1">
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

      {/* Create Agent Dialog */}
      <CreateAgentDialog 
        open={showCreateAgent} 
        onOpenChange={setShowCreateAgent}
        workspaceId={currentWorkspace.id}
      />
    </div>
  );
};