import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LeadCaptureConfig } from '@/components/agent/LeadCaptureConfig';
import type { LeadCaptureConfig as ILeadCaptureConfig } from '@/types/leadCapture';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const AgentSettingsLeads = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [leadCaptureConfig, setLeadCaptureConfig] = useState<ILeadCaptureConfig>({
    enabled: false,
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
      { key: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' }
    ],
    success_message: 'Thank you! We will be in touch soon.',
    button_text: 'Get in Touch',
    trigger_type: 'ai_detection',
    trigger_after_messages: 2,
    prompt: "I'd love to help you further! Could you share your contact information?"
  });

  useEffect(() => {
    if (agent) {
      // Check if agent has new format lead_capture_config
      if (agent.lead_capture_config && typeof agent.lead_capture_config === 'object') {
        const config = agent.lead_capture_config;
        
        // If config has the new structure (with 'fields' array), use it directly
        if (config.fields && Array.isArray(config.fields)) {
          setLeadCaptureConfig({
            enabled: config.enabled ?? agent.enable_lead_capture ?? false,
            fields: config.fields,
            success_message: config.success_message || 'Thank you! We will be in touch soon.',
            button_text: config.button_text || 'Get in Touch',
            trigger_type: config.trigger_type || 'ai_detection',
            trigger_after_messages: config.trigger_after_messages || 2,
            prompt: config.prompt || "I'd love to help you further! Could you share your contact information?"
          });
        } else {
          // Old format - convert to new format (for backward compatibility)
          setLeadCaptureConfig({
            enabled: agent.enable_lead_capture ?? false,
            fields: [
              { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
              { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
              { key: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' }
            ],
            success_message: 'Thank you! We will be in touch soon.',
            button_text: 'Get in Touch',
            trigger_type: 'ai_detection',
            trigger_after_messages: 2,
            prompt: "I'd love to help you further! Could you share your contact information?"
          });
        }
      } else {
        // No config exists - use defaults with enabled status from agent
        setLeadCaptureConfig({
          enabled: agent.enable_lead_capture ?? false,
          fields: [
            { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
            { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
            { key: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' }
          ],
          success_message: 'Thank you! We will be in touch soon.',
          button_text: 'Get in Touch',
          trigger_type: 'ai_detection',
          trigger_after_messages: 2,
          prompt: "I'd love to help you further! Could you share your contact information?"
        });
      }
    }
  }, [agent]);

  const handleSave = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          lead_capture_config: leadCaptureConfig as any
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Lead capture settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating lead settings:', error);
      toast({
        title: "Error",
        description: "Failed to update lead capture settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lead Capture</h2>
        <p className="text-muted-foreground">
          Configure how your agent collects visitor information and generates leads.
        </p>
      </div>

      <LeadCaptureConfig 
        config={leadCaptureConfig}
        onChange={setLeadCaptureConfig}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};