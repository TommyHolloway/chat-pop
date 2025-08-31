import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';

export interface ProactiveTrigger {
  enabled: boolean;
  time_threshold?: number;
  page_views_threshold?: number;
  page_threshold?: number;
  message: string;
  url_patterns?: string[];
}

export interface CustomTrigger extends ProactiveTrigger {
  id: string;
  name: string;
  trigger_type: 'time_based' | 'scroll_based' | 'element_interaction' | 'exit_intent';
  scroll_depth?: number;
  element_selector?: string;
}

export interface ProactiveConfig {
  enabled: boolean;
  confidence_threshold: number;
  timing_delay: number;
  frequency_limit: number;
  triggers: {
    pricing_concern: ProactiveTrigger;
    high_engagement: ProactiveTrigger;
    feature_exploration: ProactiveTrigger;
  };
  custom_triggers?: CustomTrigger[];
}

const defaultConfig: ProactiveConfig = {
  enabled: false,
  confidence_threshold: 0.7,
  timing_delay: 5000,
  frequency_limit: 3,
  triggers: {
    pricing_concern: {
      enabled: true,
      time_threshold: 30,
      message: "Hi! I noticed you're looking at our pricing. I'd be happy to help you find the perfect plan for your needs!",
      url_patterns: ['pricing', 'plans', 'cost', '#pricing']
    },
    high_engagement: {
      enabled: true,
      time_threshold: 120,
      page_views_threshold: 5,
      message: "You seem really interested in what we offer! Would you like to chat about how we can help you?",
      url_patterns: []
    },
    feature_exploration: {
      enabled: true,
      page_threshold: 3,
      message: "I see you're exploring our features. Want to learn more about how they can benefit you?",
      url_patterns: ['features', 'product', 'demo', '#features']
    }
  },
  custom_triggers: []
};

export const useProactiveConfig = (agent: any) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ProactiveConfig>(defaultConfig);

  useEffect(() => {
    let mounted = true;
    
    if (agent?.proactive_config && mounted) {
      setConfig(prev => {
        // Only update if there are actual changes to prevent unnecessary re-renders
        const newConfig = {
          ...prev,
          ...agent.proactive_config,
          triggers: {
            ...prev.triggers,
            ...agent.proactive_config.triggers
          }
        };
        
        // Deep comparison to avoid unnecessary updates
        if (JSON.stringify(newConfig) === JSON.stringify(prev)) {
          return prev;
        }
        
        return newConfig;
      });
    }
    
    return () => {
      mounted = false;
    };
  }, [agent?.proactive_config]);

  const updateConfig = (updates: Partial<ProactiveConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateTrigger = (triggerName: keyof ProactiveConfig['triggers'], updates: Partial<ProactiveTrigger>) => {
    setConfig(prev => ({
      ...prev,
      triggers: {
        ...prev.triggers,
        [triggerName]: {
          ...prev.triggers[triggerName],
          ...updates
        }
      }
    }));
  };

  const addCustomTrigger = () => {
    const newTrigger: CustomTrigger = {
      id: `custom_${Date.now()}`,
      name: 'New Custom Trigger',
      enabled: true,
      trigger_type: 'time_based',
      time_threshold: 30,
      message: 'Hi! Can I help you with anything?',
      url_patterns: []
    };
    
    setConfig(prev => ({
      ...prev,
      custom_triggers: [...(prev.custom_triggers || []), newTrigger]
    }));
  };

  const removeCustomTrigger = (triggerId: string) => {
    setConfig(prev => ({
      ...prev,
      custom_triggers: (prev.custom_triggers || []).filter(t => t.id !== triggerId)
    }));
  };

  const updateCustomTrigger = (triggerId: string, updates: Partial<CustomTrigger>) => {
    setConfig(prev => ({
      ...prev,
      custom_triggers: (prev.custom_triggers || []).map(trigger => 
        trigger.id === triggerId ? { ...trigger, ...updates } : trigger
      )
    }));
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await updateAgent(id!, {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        enable_proactive_engagement: config.enabled,
        proactive_config: config,
      });

      toast({
        title: "Success",
        description: "Proactive engagement settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save proactive engagement settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    updateConfig,
    updateTrigger,
    addCustomTrigger,
    removeCustomTrigger,
    updateCustomTrigger,
    saveConfig
  };
};