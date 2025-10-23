import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureConfig as LeadCaptureConfigComponent } from '@/components/agent/LeadCaptureConfig';
import type { LeadCaptureConfig as ILeadCaptureConfig } from '@/types/leadCapture';
import { ECOMMERCE_LEAD_FIELDS } from '@/types/leadCapture';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ShoppingBag } from "lucide-react";

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

  const applyEcommercePreset = () => {
    setLeadCaptureConfig(prev => ({
      ...prev,
      fields: ECOMMERCE_LEAD_FIELDS
    }));
    toast({
      title: "E-commerce preset applied",
      description: "Lead capture fields updated with e-commerce-specific questions.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Lead Capture</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <ShoppingBag className="h-3 w-3 mr-1" />
            E-commerce Optimized
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Capture customer information with e-commerce-specific fields like budget range, product interests, and purchase timeline
        </p>
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">E-commerce Lead Capture Preset</h3>
            <p className="text-sm text-muted-foreground">
              Apply pre-configured fields optimized for online stores: budget range, product interests, purchase timeline, and style preferences
            </p>
          </div>
          <Button onClick={applyEcommercePreset} variant="outline">
            Apply Preset
          </Button>
        </div>
      </Card>

      <LeadCaptureConfigComponent 
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