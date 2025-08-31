import { useProactiveConfig } from '@/hooks/useProactiveConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Zap, Save, Clock, TrendingUp, Map } from 'lucide-react';
import { ProactiveTriggerCard } from '@/components/agent/ProactiveTriggerCard';
import { ProactiveGlobalSettings } from '@/components/agent/ProactiveGlobalSettings';
import { CustomTriggerManager } from '@/components/agent/CustomTriggerManager';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';

export const AgentSettingsProactive = ({ agent }: { agent: any }) => {
  const { 
    config, 
    loading, 
    configLoading,
    updateConfig, 
    updateTrigger, 
    addCustomTrigger, 
    removeCustomTrigger, 
    updateCustomTrigger, 
    saveConfig 
  } = useProactiveConfig(agent);

  console.log('AgentSettingsProactive: Rendering', { 
    hasAgent: !!agent,
    configLoading,
    configEnabled: config.enabled,
    customTriggersCount: config.custom_triggers?.length || 0,
    agentId: agent?.id
  });

  if (configLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Proactive Engagement</h2>
          <p className="text-muted-foreground">
            Loading configuration...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const contentComponent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Proactive Engagement</h2>
        <p className="text-muted-foreground">
          Configure intelligent visitor behavior analysis and proactive suggestions
        </p>
      </div>

      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Master Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Proactive Engagement</Label>
              <p className="text-sm text-muted-foreground">
                Allow your agent to proactively reach out to visitors based on their behavior
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      {config.enabled && (
        <ProactiveGlobalSettings config={config} onUpdate={updateConfig} />
      )}

      {/* Trigger Configuration */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Trigger Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Concern */}
            <ProactiveTriggerCard
              title="Pricing Concern"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              trigger={config.triggers.pricing_concern}
              onUpdate={(updates) => updateTrigger('pricing_concern', updates)}
              config={{
                timeThreshold: { min: 10, max: 120, step: 5 },
                showUrlPatterns: true
              }}
            />

            <Separator />

            {/* High Engagement */}
            <ProactiveTriggerCard
              title="High Engagement"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              trigger={config.triggers.high_engagement}
              onUpdate={(updates) => updateTrigger('high_engagement', updates)}
              config={{
                timeThreshold: { min: 60, max: 300, step: 10 },
                pageViews: { min: 3, max: 15, step: 1 },
                showUrlPatterns: false
              }}
            />

            <Separator />

            {/* Feature Exploration */}
            <ProactiveTriggerCard
              title="Feature Exploration"
              icon={<Map className="h-4 w-4 text-muted-foreground" />}
              trigger={config.triggers.feature_exploration}
              onUpdate={(updates) => updateTrigger('feature_exploration', updates)}
              config={{
                pageThreshold: { min: 2, max: 10, step: 1 },
                showUrlPatterns: true
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Custom Triggers */}
      {config.enabled && (
        <CustomTriggerManager
          key={`custom-triggers-${agent?.id}-${config.custom_triggers?.length || 0}`}
          triggers={config.custom_triggers || []}
          onAdd={addCustomTrigger}
          onRemove={removeCustomTrigger}
          onUpdate={updateCustomTrigger}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={saveConfig} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );

  return (
    <PlanEnforcementWrapper feature="visitor_analytics">
      {contentComponent}
    </PlanEnforcementWrapper>
  );
};
