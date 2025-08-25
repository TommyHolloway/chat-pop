import { useState } from 'react';
import { Plus, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
import { CreateAgentDialog } from '@/components/CreateAgentDialog';
import { Link } from 'react-router-dom';

export const WorkspaceOverview = () => {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const { currentWorkspace, workspaces } = useWorkspaces();
  const { agents, loading: agentsLoading } = useAgents();
  const { leads } = useLeads();
  const { enforcement } = usePlanEnforcement();

  const workspaceAgents = agents.filter(agent => agent.workspace_id === currentWorkspace?.id);
  const totalLeads = leads.filter(lead => 
    workspaceAgents.some(agent => agent.id === lead.agent_id)
  ).length;

  const canCreateWorkspace = true; // TODO: Implement workspace limits
  const canCreateAgent = enforcement?.canCreateAgent;

  if (!currentWorkspace) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to your AI workspace</h1>
          <p className="text-muted-foreground mb-8">Create your first workspace to get started</p>
          <PlanEnforcementWrapper 
            feature="workspace" 
            fallbackComponent={
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace (Upgrade Required)
              </Button>
            }
          >
            <Button onClick={() => setShowCreateWorkspace(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Workspace
            </Button>
          </PlanEnforcementWrapper>
        </div>
        <CreateWorkspaceDialog 
          open={showCreateWorkspace} 
          onOpenChange={setShowCreateWorkspace} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-muted-foreground mt-1">{currentWorkspace.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <PlanEnforcementWrapper 
            feature="workspace" 
            fallbackComponent={
              <Button variant="outline" disabled>
                <Plus className="mr-2 h-4 w-4" />
                New Workspace (Upgrade Required)
              </Button>
            }
          >
            <Button variant="outline" onClick={() => setShowCreateWorkspace(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </PlanEnforcementWrapper>
          <PlanEnforcementWrapper 
            feature="agent" 
            fallbackComponent={
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaceAgents.length}</div>
            <p className="text-xs text-muted-foreground">
              {enforcement?.agentLimits?.remaining !== undefined 
                ? `${enforcement.agentLimits.remaining} remaining`
                : 'Unlimited'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enforcement?.usage?.message_credits_used || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {enforcement?.limits?.message_credits !== -1 
                ? `of ${enforcement?.limits?.message_credits} limit`
                : 'Unlimited'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Agents</h2>
          {workspaceAgents.length > 0 && (
            <Link to="/agents">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          )}
        </div>

        {agentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI agent to get started
              </p>
              <PlanEnforcementWrapper 
                feature="agent" 
                fallbackComponent={
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaceAgents.map((agent) => (
              <Link key={agent.id} to={`/workspace/${currentWorkspace.id}/agents/${agent.id}/playground`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {agent.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last updated</span>
                      <span>{new Date(agent.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateWorkspaceDialog 
        open={showCreateWorkspace} 
        onOpenChange={setShowCreateWorkspace} 
      />
      <CreateAgentDialog 
        open={showCreateAgent} 
        onOpenChange={setShowCreateAgent}
        workspaceId={currentWorkspace.id}
      />
    </div>
  );
};