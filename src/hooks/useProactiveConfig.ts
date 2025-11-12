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
    id: 'product_page_hesitation',
    name: 'Product Page Hesitation',
    trigger_type: 'time_based',
    enabled: false,
    time_threshold: 45,
    message: "👋 Still deciding? I can help with sizing, shipping times, or answer any questions about this product!",
    url_patterns: ['/products/*', '/product/*', '/shop/*'],
    isQuickTrigger: true
  },
  {
    id: 'compare_products',
    name: 'Comparing Multiple Products',
    trigger_type: 'time_based',
    enabled: false,
    page_views_threshold: 3,
    message: "Comparing options? 🤔 I can help you find the perfect match based on your needs!",
    url_patterns: ['/products/*', '/product/*', '/shop/*'],
    isQuickTrigger: true
  },
  {
    id: 'checkout_exit',
    name: 'About to Leave Checkout',
    trigger_type: 'time_based',
    enabled: false,
    time_threshold: 60,
    message: "Need help completing your order? I can answer questions about shipping, returns, or apply a discount code! 💬",
    url_patterns: ['/checkout', '/cart', '/basket'],
    isQuickTrigger: true
  },
  {
    id: 'quick_cart_abandonment',
    name: 'Cart Abandonment Recovery',
    trigger_type: 'time_based',
    enabled: false,
    time_threshold: 300,
    message: "Your cart is waiting! 🛒 Got questions about your items? Or I can help apply a discount code to complete your order.",
    url_patterns: ['/cart', '/checkout'],
    isQuickTrigger: true
  }
];

const defaultConfig: ProactiveConfig = {
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

  // Always use the latest e-commerce quick triggers for all agents
  const migrateToQuickTriggers = (config: ProactiveConfig): ProactiveConfig => {
    const existingCustomTriggers = config.custom_triggers || [];
    
    // Filter out ALL existing quick triggers (we'll replace them with latest templates)
    const nonQuickTriggers = existingCustomTriggers.filter(t => !t.isQuickTrigger);
    
    // Always add the latest e-commerce quick trigger templates
    const updatedTriggers = [
      ...nonQuickTriggers,  // Keep user's custom triggers
      ...quickTriggerTemplates  // Always use latest e-commerce templates
    ];
    
    return {
      ...config,
      custom_triggers: updatedTriggers
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
        enable_proactive_engagement: true,
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