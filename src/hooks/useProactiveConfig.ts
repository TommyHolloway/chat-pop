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
  trigger_type: 'time_based' | 'scroll_based';
  scroll_depth?: number;
  isQuickTrigger?: boolean;
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

const quickTriggerTemplates: CustomTrigger[] = [
  {
    id: 'quick_pricing_helper',
    name: 'Pricing Page Helper',
    trigger_type: 'time_based',
    enabled: false,
    time_threshold: 30,
    message: "Hi! I noticed you're looking at our pricing. I'd be happy to help you find the perfect plan for your needs!",
    url_patterns: ['/pricing', '/plans', '/cost'],
    isQuickTrigger: true
  },
  {
    id: 'quick_engagement_booster',
    name: 'Engagement Booster',
    trigger_type: 'time_based',
    enabled: false,
    time_threshold: 120,
    page_views_threshold: 5,
    message: "You seem really interested in what we offer! Would you like to chat about how we can help you?",
    url_patterns: [],
    isQuickTrigger: true
  },
  {
    id: 'quick_feature_guide',
    name: 'Feature Guide',
    trigger_type: 'time_based',
    enabled: false,
    page_threshold: 3,
    message: "I see you're exploring our features. Want to learn more about how they can benefit you?",
    url_patterns: ['/features', '/product', '/demo'],
    isQuickTrigger: true
  }
];

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
      url_patterns: ['/pricing', '/plans', '/cost']
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
      url_patterns: ['/features', '/product', '/demo']
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

  // Migration function to convert old predefined triggers to Quick Triggers
  const migrateToQuickTriggers = (config: ProactiveConfig): ProactiveConfig => {
    const existingCustomTriggers = config.custom_triggers || [];
    const migratedTriggers = [...existingCustomTriggers];
    
    // Check if Quick Triggers already exist
    const hasQuickTriggers = existingCustomTriggers.some(t => t.isQuickTrigger);
    
    if (!hasQuickTriggers && config.triggers) {
      // Convert old predefined triggers to Quick Triggers
      if (config.triggers.pricing_concern) {
        migratedTriggers.push({
          ...quickTriggerTemplates[0],
          enabled: config.triggers.pricing_concern.enabled,
          message: config.triggers.pricing_concern.message,
          time_threshold: config.triggers.pricing_concern.time_threshold,
          url_patterns: config.triggers.pricing_concern.url_patterns
        });
      }
      
      if (config.triggers.high_engagement) {
        migratedTriggers.push({
          ...quickTriggerTemplates[1],
          enabled: config.triggers.high_engagement.enabled,
          message: config.triggers.high_engagement.message,
          time_threshold: config.triggers.high_engagement.time_threshold,
          page_views_threshold: config.triggers.high_engagement.page_views_threshold,
          url_patterns: config.triggers.high_engagement.url_patterns
        });
      }
      
      if (config.triggers.feature_exploration) {
        migratedTriggers.push({
          ...quickTriggerTemplates[2],
          enabled: config.triggers.feature_exploration.enabled,
          message: config.triggers.feature_exploration.message,
          page_threshold: config.triggers.feature_exploration.page_threshold,
          url_patterns: config.triggers.feature_exploration.url_patterns
        });
      }
    } else if (!hasQuickTriggers) {
      // Add default Quick Triggers if none exist
      migratedTriggers.push(...quickTriggerTemplates);
    }
    
    return {
      ...config,
      custom_triggers: migratedTriggers
    };
  };

  useEffect(() => {
    let mounted = true;
    
    // Only process if agent is available and component is still mounted
    if (agent && mounted) {
      setConfigLoading(true);
      
      // Use setTimeout to prevent race conditions in React StrictMode
      const timeoutId = setTimeout(() => {
        if (!mounted) return;
        
        try {
          if (agent.proactive_config) {
            const loadedConfig = agent.proactive_config;
            
            console.log('Loading proactive config:', {
              agentId: agent.id,
              hasProactiveConfig: !!loadedConfig,
              customTriggersCount: loadedConfig.custom_triggers?.length || 0
            });
            
            // Ensure custom_triggers is properly preserved and loaded
            let mergedConfig = {
              ...defaultConfig,
              ...loadedConfig,
              triggers: {
                ...defaultConfig.triggers,
                ...loadedConfig.triggers
              },
              // Explicitly preserve custom_triggers from the loaded config
              custom_triggers: Array.isArray(loadedConfig.custom_triggers) ? loadedConfig.custom_triggers : []
            };
            
            // Apply migration to convert old predefined triggers to Quick Triggers
            mergedConfig = migrateToQuickTriggers(mergedConfig);
            
            console.log('Merged config result:', {
              enabled: mergedConfig.enabled,
              customTriggersCount: mergedConfig.custom_triggers?.length || 0,
              quickTriggersCount: mergedConfig.custom_triggers?.filter(t => t.isQuickTrigger).length || 0
            });
            
            setConfig(mergedConfig);
          } else {
            console.log('No proactive config found, using defaults with Quick Triggers');
            // Agent loaded but no proactive config - use default with Quick Triggers
            const configWithQuickTriggers = migrateToQuickTriggers(defaultConfig);
            setConfig(configWithQuickTriggers);
          }
        } catch (error) {
          console.error('Error loading proactive config:', error);
          // Fallback to default config
          const configWithQuickTriggers = migrateToQuickTriggers(defaultConfig);
          setConfig(configWithQuickTriggers);
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
    console.log('Updating custom trigger:', { triggerId, updates });
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        custom_triggers: (prev.custom_triggers || []).map(trigger => 
          trigger.id === triggerId ? { ...trigger, ...updates } : trigger
        )
      };
      
      console.log('Updated config:', {
        triggersCount: newConfig.custom_triggers?.length,
        updatedTrigger: newConfig.custom_triggers?.find(t => t.id === triggerId)
      });
      
      return newConfig;
    });
  };

  const saveConfig = async () => {
    setLoading(true);
    
    try {
      console.log('Saving proactive config:', {
        agentId: id,
        enabled: config.enabled,
        customTriggersCount: config.custom_triggers?.length || 0,
        quickTriggersEnabled: config.custom_triggers?.filter(t => t.isQuickTrigger && t.enabled).length || 0
      });

      // Create a clean copy of the config to save
      const configToSave = {
        ...config,
        custom_triggers: config.custom_triggers || []
      };

      const updateData = {
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        enable_proactive_engagement: config.enabled,
        proactive_config: configToSave,
      };

      console.log('Saving config to database:', {
        customTriggersCount: configToSave.custom_triggers.length,
        quickTriggers: configToSave.custom_triggers.filter(t => t.isQuickTrigger).map(t => ({
          id: t.id,
          name: t.name,
          enabled: t.enabled
        }))
      });

      const result = await updateAgent(id!, updateData);
      
      console.log('Config saved successfully, result:', result);

      // Force a state refresh to show the saved data
      setTimeout(() => window.location.reload(), 1000);

      toast({
        title: "Success",
        description: "Proactive engagement settings saved successfully. Page will refresh to show saved state.",
      });
    } catch (error) {
      console.error('Error saving proactive config:', error);
      toast({
        title: "Error",  
        description: `Failed to save proactive engagement settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
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