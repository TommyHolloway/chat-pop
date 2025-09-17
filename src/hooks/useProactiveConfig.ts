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
  timing_delay: number;
  frequency_limit: number;
  message_display_duration: number;
  allowed_pages?: string[];
  triggers: {
    pricing_concern: ProactiveTrigger;
    high_engagement: ProactiveTrigger;
    feature_exploration: ProactiveTrigger;
  };
  custom_triggers?: CustomTrigger[];
}

const defaultConfig: ProactiveConfig = {
  enabled: false,
  timing_delay: 5000,
  frequency_limit: 3,
  message_display_duration: 15000,
  allowed_pages: [],
  triggers: {
    pricing_concern: {
      enabled: false,
      time_threshold: 30,
      message: "Hi! I noticed you're looking at our pricing. I'd be happy to help you find the perfect plan for your needs!",
      url_patterns: ['pricing', 'plans', 'cost', '#pricing']
    },
    high_engagement: {
      enabled: false,
      time_threshold: 120,
      page_views_threshold: 5,
      message: "You seem really interested in what we offer! Would you like to chat about how we can help you?",
      url_patterns: []
    },
    feature_exploration: {
      enabled: false,
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
  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<ProactiveConfig>(defaultConfig);

  useEffect(() => {
    let mounted = true;
    
    // Only process if agent is available and component is still mounted
    if (agent && mounted) {
      setConfigLoading(true);
      
      // Use setTimeout to prevent race conditions in React StrictMode
      const timeoutId = setTimeout(() => {
        if (!mounted) return;
        
        if (agent.proactive_config) {
          const loadedConfig = agent.proactive_config;
          
          // Ensure custom_triggers is properly preserved and loaded
          const mergedConfig = {
            ...defaultConfig,
            ...loadedConfig,
            triggers: {
              ...defaultConfig.triggers,
              ...loadedConfig.triggers
            },
            // Explicitly preserve custom_triggers from the loaded config
            custom_triggers: Array.isArray(loadedConfig.custom_triggers) ? loadedConfig.custom_triggers : []
          };
          
          setConfig(mergedConfig);
        } else {
          // Agent loaded but no proactive config - use default
          setConfig(defaultConfig);
        }
        
        setConfigLoading(false);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else if (!agent) {
      // Agent not loaded yet
      setConfigLoading(true);
    }
    
    return () => {
      mounted = false;
    };
  }, [agent?.id, agent?.proactive_config, agent?.updated_at]);

  const updateConfig = (updates: Partial<ProactiveConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // If disabling proactive engagement globally, disable all individual triggers
      if ('enabled' in updates && !updates.enabled) {
        newConfig.triggers = {
          pricing_concern: { ...newConfig.triggers.pricing_concern, enabled: false },
          high_engagement: { ...newConfig.triggers.high_engagement, enabled: false },
          feature_exploration: { ...newConfig.triggers.feature_exploration, enabled: false }
        };
        newConfig.custom_triggers = (newConfig.custom_triggers || []).map(trigger => ({
          ...trigger,
          enabled: false
        }));
      }
      
      return newConfig;
    });
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

  const addCustomTrigger = (newTriggerData: Omit<CustomTrigger, 'id'>) => {
    const newTrigger: CustomTrigger = {
      id: `custom_${Date.now()}`,
      ...newTriggerData
    };
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: [...(prev.custom_triggers || []), newTrigger]
      };
      return newConfig;
    });
  };

  const removeCustomTrigger = (triggerId: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: (prev.custom_triggers || []).filter(t => t.id !== triggerId)
      };
      return newConfig;
    });
  };

  const updateCustomTrigger = (triggerId: string, updates: Partial<CustomTrigger>) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: (prev.custom_triggers || []).map(trigger => 
          trigger.id === triggerId ? { ...trigger, ...updates } : trigger
        )
      };
      return newConfig;
    });
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
    configLoading,
    updateConfig,
    updateTrigger,
    addCustomTrigger,
    removeCustomTrigger,
    updateCustomTrigger,
    saveConfig
  };
};