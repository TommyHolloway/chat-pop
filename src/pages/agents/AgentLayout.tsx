import { useState, useEffect } from 'react';
import { useParams, Navigate, Link, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { AgentSidebar } from '@/components/agent/AgentSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AgentPlayground } from './sections/AgentPlayground';
import { AgentAnalytics } from './sections/AgentAnalytics';
import { AgentConversations } from './sections/AgentConversations';
import { AgentLeads } from './sections/AgentLeads';
import { AgentSourcesFiles } from './sections/AgentSourcesFiles';
import { AgentDeployEmbed } from './sections/AgentDeployEmbed';

export const AgentLayout = () => {
  const { id } = useParams();
  const { getAgent } = useAgents();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">
                {agent.description || 'AI Agent Management'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <SidebarProvider>
          <AgentSidebar agent={agent} loading={loading} />
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="playground" element={<AgentPlayground agent={agent} />} />
                <Route path="analytics" element={<AgentAnalytics agent={agent} />} />
                <Route path="activity/conversations" element={<AgentConversations agent={agent} />} />
                <Route path="activity/leads" element={<AgentLeads agent={agent} />} />
                <Route path="sources/files" element={<AgentSourcesFiles agent={agent} />} />
                <Route path="deploy/embed" element={<AgentDeployEmbed agent={agent} />} />
                <Route index element={<AgentPlayground agent={agent} />} />
              </Routes>
            </div>
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
};