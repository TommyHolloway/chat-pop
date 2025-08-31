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
  message_display_duration: number;
  url_restrictions: {
    enabled: boolean;
    restrict_to_specific_urls: boolean;
    allowed_urls: string[];
  };
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
  message_display_duration: 15000,
  url_restrictions: {
    enabled: false,
    restrict_to_specific_urls: false,
    allowed_urls: []
  },
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
  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<ProactiveConfig>(defaultConfig);

  useEffect(() => {
    let mounted = true;
    
    console.log('useProactiveConfig: Effect triggered', { 
      hasAgent: !!agent, 
      hasProactiveConfig: !!agent?.proactive_config,
      agentId: agent?.id,
      customTriggersCount: agent?.proactive_config?.custom_triggers?.length || 0
    });
    
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
            // Preserve url_restrictions and message_display_duration if they exist
            url_restrictions: {
              ...defaultConfig.url_restrictions,
              ...(loadedConfig.url_restrictions || {})
            },
            message_display_duration: loadedConfig.message_display_duration || defaultConfig.message_display_duration,
            // Explicitly preserve custom_triggers from the loaded config
            custom_triggers: Array.isArray(loadedConfig.custom_triggers) ? loadedConfig.custom_triggers : []
          };
          
          console.log('useProactiveConfig: Loading config', { 
            loadedConfig, 
            mergedConfig,
            customTriggersLoaded: mergedConfig.custom_triggers?.length || 0
          });
          
          setConfig(mergedConfig);
        } else {
          // Agent loaded but no proactive config - use default
          console.log('useProactiveConfig: No proactive config found, using default');
          setConfig(defaultConfig);
        }
        
        setConfigLoading(false);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else if (!agent) {
      // Agent not loaded yet
      console.log('useProactiveConfig: Agent not loaded yet');
      setConfigLoading(true);
    }
    
    return () => {
      mounted = false;
    };
  }, [agent?.id, agent?.proactive_config, agent?.updated_at]);

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
    
    console.log('useProactiveConfig: Adding custom trigger', newTrigger);
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: [...(prev.custom_triggers || []), newTrigger]
      };
      console.log('useProactiveConfig: Config after adding trigger', { 
        previousCount: prev.custom_triggers?.length || 0,
        newCount: newConfig.custom_triggers?.length || 0,
        newConfig 
      });
      return newConfig;
    });
  };

  const removeCustomTrigger = (triggerId: string) => {
    console.log('useProactiveConfig: Removing custom trigger', triggerId);
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: (prev.custom_triggers || []).filter(t => t.id !== triggerId)
      };
      console.log('useProactiveConfig: Config after removing trigger', { 
        removedId: triggerId,
        previousCount: prev.custom_triggers?.length || 0,
        newCount: newConfig.custom_triggers?.length || 0
      });
      return newConfig;
    });
  };

  const updateCustomTrigger = (triggerId: string, updates: Partial<CustomTrigger>) => {
    console.log('useProactiveConfig: Updating custom trigger', { triggerId, updates });
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: (prev.custom_triggers || []).map(trigger => 
          trigger.id === triggerId ? { ...trigger, ...updates } : trigger
        )
      };
      console.log('useProactiveConfig: Config after updating trigger', newConfig);
      return newConfig;
    });
  };

  const saveConfig = async () => {
    setLoading(true);
    console.log('useProactiveConfig: Saving config', { 
      config, 
      customTriggersCount: config.custom_triggers?.length || 0,
      agentId: id 
    });
    
    try {
      await updateAgent(id!, {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        enable_proactive_engagement: config.enabled,
        proactive_config: config,
      });

      console.log('useProactiveConfig: Config saved successfully');
      toast({
        title: "Success",
        description: "Proactive engagement settings saved successfully",
      });
    } catch (error) {
      console.error('useProactiveConfig: Save failed', error);
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