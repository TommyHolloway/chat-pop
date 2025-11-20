import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Users, Calendar, BarChart3, Settings, Edit2, ExternalLink } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { CreateWorkspaceDialog } from '@/components/CreateWorkspaceDialog';
import { EditWorkspaceDialog } from '@/components/EditWorkspaceDialog';
import { Link, useNavigate } from 'react-router-dom';

export const WorkspaceOverview = () => {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const { currentWorkspace, workspaces } = useWorkspaces();
  const { agents, loading: agentsLoading } = useAgents();
  const { leads } = useLeads();
  const planEnforcement = usePlanEnforcement();
  const navigate = useNavigate();

  const workspaceAgent = agents.find(agent => agent.workspace_id === currentWorkspace?.id);
  const totalLeads = leads.filter(lead => lead.agent_id === workspaceAgent?.id).length;

  const canCreateWorkspace = true; // TODO: Implement workspace limits

  // Redirect to agent settings when agent is loaded
  useEffect(() => {
    if (workspaceAgent && !agentsLoading) {
      navigate(`/agents/${workspaceAgent.id}/settings/general`, { replace: true });
    }
  }, [workspaceAgent, agentsLoading, navigate]);

  if (!currentWorkspace) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to your AI workspace</h1>
          <p className="text-muted-foreground mb-8">Create your first workspace to get started</p>
          {canCreateWorkspace ? (
            <Button onClick={() => setShowCreateWorkspace(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Workspace
            </Button>
          ) : (
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace (Upgrade Required)
            </Button>
          )}
        </div>
        <CreateWorkspaceDialog 
          open={showCreateWorkspace} 
          onOpenChange={setShowCreateWorkspace} 
        />
      </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">{currentWorkspace.name}</h1>
            {currentWorkspace.description && (
              <p className="text-muted-foreground mt-1">{currentWorkspace.description}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEditWorkspace(true)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        {workspaceAgent && (
          <Link to={`/agents/${workspaceAgent.id}/settings/general`}>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Assistant Settings
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Assistant Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentsLoading ? "..." : workspaceAgent ? "Active" : "Setting up..."}
            </div>
            <p className="text-xs text-muted-foreground">
              {workspaceAgent?.name || "Your shopping assistant"}
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
              Captured by your assistant
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
              {planEnforcement?.usage?.currentMessageCredits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {planEnforcement?.limits?.messageCredits !== -1 
                ? `of ${planEnforcement?.limits?.messageCredits} limit`
                : 'Unlimited'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {workspaceAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your AI shopping assistant</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to={`/agents/${workspaceAgent.id}/settings/general`}>
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                General Settings
              </Button>
            </Link>
            <Link to={`/agents/${workspaceAgent.id}/sources`}>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Knowledge Base
              </Button>
            </Link>
            <Link to={`/agents/${workspaceAgent.id}/integrations/shopify`}>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Shopify Integration
              </Button>
            </Link>
            <Link to={`/agents/${workspaceAgent.id}/deploy`}>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Deploy Assistant
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <CreateWorkspaceDialog 
        open={showCreateWorkspace} 
        onOpenChange={setShowCreateWorkspace} 
      />
      <EditWorkspaceDialog
        open={showEditWorkspace}
        onOpenChange={setShowEditWorkspace}
        workspace={currentWorkspace}
      />
    </div>
    </>
  );
};