import { useState, useEffect } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';
import type { LeadCaptureConfig } from '@/types/leadCapture';

export interface AgentFormData {
  name: string;
  description: string;
  instructions: string;
  status: 'active' | 'inactive' | 'draft';
  initial_message: string;
  creativity_level: number;
  profile_image_url: string;
  message_bubble_color: string;
  chat_interface_theme: string;
  lead_capture_config: LeadCaptureConfig;
}

const defaultFormData: AgentFormData = {
  name: '',
  description: '',
  instructions: '',
  status: 'active',
  initial_message: '',
  creativity_level: 5,
  profile_image_url: '',
  message_bubble_color: '#3B82F6',
  chat_interface_theme: 'dark',
  lead_capture_config: {
    enabled: false,
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
      { key: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' }
    ],
    success_message: 'Thank you! We will be in touch soon.',
    button_text: 'Get in Touch'
  },
};

export const useAgentForm = (agentId?: string) => {
  const { createAgent, updateAgent, getAgent } = useAgents();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!agentId);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;
    
    try {
      const data = await getAgent(agentId);
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          instructions: data.instructions || '',
          status: (data.status as 'active' | 'inactive' | 'draft') || 'active',
          initial_message: data.initial_message || '',
          creativity_level: data.creativity_level || 5,
          profile_image_url: data.profile_image_url || '',
          message_bubble_color: data.message_bubble_color || '#3B82F6',
          chat_interface_theme: data.chat_interface_theme || 'dark',
          lead_capture_config: (() => {
            if (data.lead_capture_config && typeof data.lead_capture_config === 'object') {
              const config = data.lead_capture_config as any;
              return {
                enabled: config.enabled || (data as any).enable_lead_capture || false,
                fields: config.fields || defaultFormData.lead_capture_config.fields,
                success_message: config.success_message || 'Thank you! We will be in touch soon.',
                button_text: config.button_text || 'Get in Touch'
              };
            }
            return {
              enabled: (data as any).enable_lead_capture || false,
              fields: defaultFormData.lead_capture_config.fields,
              success_message: 'Thank you! We will be in touch soon.',
              button_text: 'Get in Touch'
            };
          })(),
        });
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      toast({
        title: "Error",
        description: "Failed to load agent data.",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  };

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const saveAgent = async () => {
    setLoading(true);

    try {
      if (agentId) {
        await updateAgent(agentId, formData);
        toast({
          title: "Agent updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const newAgent = await createAgent({
          name: formData.name,
          description: formData.description,
          instructions: formData.instructions,
          workspace_id: 'default-workspace',
          initial_message: formData.initial_message,
          creativity_level: formData.creativity_level,
          profile_image_url: formData.profile_image_url,
          message_bubble_color: formData.message_bubble_color,
          chat_interface_theme: formData.chat_interface_theme,
        });
        
        toast({
          title: "Agent created",
          description: `${formData.name} has been created successfully.`,
        });
        
        return newAgent;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save agent. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    updateFormData,
    loading,
    pageLoading,
    saveAgent
  };
};