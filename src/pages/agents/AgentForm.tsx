import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Play, Loader2 } from 'lucide-react';
import { useAgentForm } from '@/hooks/useAgentForm';
import { AgentBasicInfo } from '@/components/agent/AgentBasicInfo';
import { AgentKnowledgeBase } from '@/components/agent/AgentKnowledgeBase';
import { LeadCaptureConfig } from '@/components/agent/LeadCaptureConfig';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AgentForm = () => {
  const { id: agentId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!agentId;
  
  const { formData, updateFormData, loading, pageLoading, saveAgent } = useAgentForm(agentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await saveAgent();
      if (!isEditing && result) {
        navigate(`/agents/${result.id}/edit`);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (pageLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Agent' : 'Create New Agent'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="chat-settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat-settings">Chat Settings</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge & Training</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat-settings" className="space-y-6">
            <AgentBasicInfo formData={formData} updateFormData={updateFormData} />
            
            <LeadCaptureConfig
              config={formData.lead_capture_config}
              onChange={(config) => updateFormData({ lead_capture_config: config })}
            />
          </TabsContent>
          
          <TabsContent value="knowledge" className="space-y-6">
            <AgentKnowledgeBase agentId={agentId} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <div />
          <div className="flex items-center gap-3">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/agents/${agentId}/playground`)}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Test Agent
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
