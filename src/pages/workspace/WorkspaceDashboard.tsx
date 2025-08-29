import { useState, useEffect } from 'react';
import { useParams, Navigate, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { WorkspaceOverview } from './sections/WorkspaceOverview';
import { WorkspaceAgents } from './sections/WorkspaceAgents';
import { WorkspaceAnalytics } from './sections/WorkspaceAnalytics';
import { WorkspaceSettings } from './sections/WorkspaceSettings';
import { AgentPlayground } from '../agents/sections/AgentPlayground';
import { AgentAnalytics } from '../agents/sections/AgentAnalytics';
import { AgentConversations } from '../agents/sections/AgentConversations';
import { AgentLeads } from '../agents/sections/AgentLeads';
import { AgentSourcesFiles } from '../agents/sections/AgentSourcesFiles';
import { AgentSourcesText } from '../agents/sections/AgentSourcesText';
import { AgentSourcesWebsite } from '../agents/sections/AgentSourcesWebsite';
import { AgentSourcesQnA } from '../agents/sections/AgentSourcesQnA';
import { AgentActionsCalendar } from '../agents/sections/AgentActionsCalendar';
import { AgentActionsCustom } from '../agents/sections/AgentActionsCustom';
import { AgentDeployEmbed } from '../agents/sections/AgentDeployEmbed';
import { AgentDeployShare } from '../agents/sections/AgentDeployShare';
import { AgentDeployIntegrations } from '../agents/sections/AgentDeployIntegrations';
import { AgentSettingsGeneral } from '../agents/sections/AgentSettingsGeneral';
import { AgentSettingsAI } from '../agents/sections/AgentSettingsAI';
import { AgentSettingsChat } from '../agents/sections/AgentSettingsChat';
import { AgentSettingsLeads } from '../agents/sections/AgentSettingsLeads';
import { AgentVisitorAnalytics } from '../agents/sections/AgentVisitorAnalytics';

export const WorkspaceDashboard = () => {
  const { workspaceId, id: agentId } = useParams();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();
  const { getAgent } = useAgents();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaceAndAgent = async () => {
      setLoading(true);
      
      // Switch to the workspace if needed
      if (workspaceId && currentWorkspace?.id !== workspaceId) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
          switchWorkspace(workspace);
        }
      }

      // Load agent if specified
      if (agentId) {
        try {
          const agentData = await getAgent(agentId);
          setAgent(agentData);
        } catch (error) {
          console.error('Error loading agent:', error);
          setAgent(null);
        }
      } else {
        setAgent(null);
      }
      
      setLoading(false);
    };

    if (workspaceId) {
      loadWorkspaceAndAgent();
    } else {
      setLoading(false);
    }
  }, [workspaceId, agentId, getAgent, workspaces, currentWorkspace, switchWorkspace]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!workspaceId || !currentWorkspace) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <WorkspaceSidebar selectedAgent={agent} />
        <SidebarInset className="flex-1">
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <Routes>
                {/* Workspace-level routes */}
                <Route index element={<WorkspaceOverview />} />
                <Route path="overview" element={<WorkspaceOverview />} />
                <Route path="agents" element={<WorkspaceAgents />} />
                <Route path="analytics" element={<WorkspaceAnalytics />} />
                <Route path="settings" element={<WorkspaceSettings />} />
                
                {/* Agent-specific routes */}
                <Route path="agents/:id/playground" element={<AgentPlayground agent={agent} />} />
                <Route path="agents/:id/analytics" element={<AgentAnalytics agent={agent} />} />
                <Route path="agents/:id/visitor-analytics" element={<AgentVisitorAnalytics agent={agent} />} />
                
                {/* Activity */}
                <Route path="agents/:id/activity/conversations" element={<AgentConversations agent={agent} />} />
                <Route path="agents/:id/activity/leads" element={<AgentLeads agent={agent} />} />
                
                {/* Sources */}
                <Route path="agents/:id/sources/files" element={<AgentSourcesFiles agent={agent} />} />
                <Route path="agents/:id/sources/text" element={<AgentSourcesText agent={agent} />} />
                <Route path="agents/:id/sources/website" element={<AgentSourcesWebsite agent={agent} />} />
                <Route path="agents/:id/sources/qa" element={<AgentSourcesQnA agent={agent} />} />
                
                {/* Actions */}
                <Route path="agents/:id/actions/calendar" element={<AgentActionsCalendar agent={agent} />} />
                <Route path="agents/:id/actions/buttons" element={<AgentActionsCustom agent={agent} />} />
                
                {/* Deploy */}
                <Route path="agents/:id/deploy/embed" element={<AgentDeployEmbed agent={agent} />} />
                <Route path="agents/:id/deploy/share" element={<AgentDeployShare agent={agent} />} />
                <Route path="agents/:id/deploy/integrations" element={<AgentDeployIntegrations agent={agent} />} />
                
                {/* Settings */}
                <Route path="agents/:id/settings/general" element={<AgentSettingsGeneral agent={agent} />} />
                <Route path="agents/:id/settings/ai" element={<AgentSettingsAI agent={agent} />} />
                <Route path="agents/:id/settings/chat" element={<AgentSettingsChat agent={agent} />} />
                <Route path="agents/:id/settings/leads" element={<AgentSettingsLeads agent={agent} />} />
              </Routes>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};