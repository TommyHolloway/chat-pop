import { useState, useEffect } from 'react';
import { useParams, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { AgentPlayground } from './sections/AgentPlayground';
import { AgentAnalytics } from './sections/AgentAnalytics';
import { AgentConversations } from './sections/AgentConversations';
import { AgentLeads } from './sections/AgentLeads';
import { AgentSourcesFiles } from './sections/AgentSourcesFiles';
import { AgentSourcesText } from './sections/AgentSourcesText';
import { AgentSourcesWebsite } from './sections/AgentSourcesWebsite';
import { AgentSourcesQnA } from './sections/AgentSourcesQnA';
import { AgentActionsCustom } from './sections/AgentActionsCustom';
import { AgentDeployEmbed } from './sections/AgentDeployEmbed';
import { AgentDeployShare } from './sections/AgentDeployShare';
import { AgentSettingsGeneral } from './sections/AgentSettingsGeneral';
import { AgentSettingsChat } from './sections/AgentSettingsChat';
import { AgentSettingsIntegrations } from './sections/AgentSettingsIntegrations';
import { AgentSettingsLeads } from './sections/AgentSettingsLeads';
import { AgentSettingsProactive } from './sections/AgentSettingsProactive';
import { AgentCompletionProgress } from '@/components/agent/AgentCompletionProgress';

export const AgentLayout = () => {
  const { id, workspaceId } = useParams();
  const location = useLocation();
  const { getAgent } = useAgents();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're on playground route (either /playground or index)
  const isPlaygroundRoute = location.pathname.endsWith('/playground') || 
                           location.pathname.split('/').pop() === id;

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

  return (
    <div className={`flex-1 ${isPlaygroundRoute ? '' : 'p-8'}`}>
      <div className={isPlaygroundRoute ? '' : 'max-w-6xl mx-auto'}>
        {!isPlaygroundRoute && <AgentCompletionProgress agent={agent} />}
        <Routes>
          {/* Main sections */}
          <Route path="playground" element={<AgentPlayground agent={agent} />} />
          <Route path="analytics" element={<AgentAnalytics agent={agent} />} />
          
          {/* Activity */}
          <Route path="activity/conversations" element={<AgentConversations agent={agent} />} />
          <Route path="activity/leads" element={<AgentLeads agent={agent} />} />
          
          {/* Sources */}
          <Route path="sources/files" element={<AgentSourcesFiles agent={agent} />} />
          <Route path="sources/text" element={<AgentSourcesText agent={agent} />} />
          <Route path="sources/website" element={<AgentSourcesWebsite agent={agent} />} />
          <Route path="sources/qa" element={<AgentSourcesQnA agent={agent} />} />
          
          {/* Actions */}
          <Route path="actions/buttons" element={<AgentActionsCustom agent={agent} />} />
          
          {/* Deploy */}
          <Route path="deploy/embed" element={<AgentDeployEmbed agent={agent} />} />
          <Route path="deploy/share" element={<AgentDeployShare agent={agent} />} />
          
          {/* Settings */}
          <Route path="settings/general" element={<AgentSettingsGeneral agent={agent} />} />
          <Route path="settings/chat" element={<AgentSettingsChat agent={agent} />} />
          <Route path="settings/leads" element={<AgentSettingsLeads agent={agent} />} />
          <Route path="settings/proactive" element={<AgentSettingsProactive agent={agent} />} />
          <Route path="settings/integrations" element={<AgentSettingsIntegrations agent={agent} />} />
          
          {/* Default */}
          <Route index element={<AgentPlayground agent={agent} />} />
        </Routes>
      </div>
    </div>
  );
};