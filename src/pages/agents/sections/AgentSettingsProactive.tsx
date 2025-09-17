import { useProactiveConfig } from '@/hooks/useProactiveConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Zap, Save, Plus, MessageSquare } from 'lucide-react';
import { ProactiveGlobalSettings } from '@/components/agent/ProactiveGlobalSettings';
import { PageRestrictionsConfig } from '@/components/agent/PageRestrictionsConfig';
import { TriggerCreationWizard } from '@/components/agent/TriggerCreationWizard';
import { TriggerListCard } from '@/components/agent/TriggerListCard';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { useState } from 'react';

export const AgentSettingsProactive = ({ agent }: { agent: any }) => {
  const [showWizard, setShowWizard] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);
  const { 
    config, 
    loading, 
    configLoading,
    updateConfig, 
    updateCustomTrigger,
    addCustomTrigger, 
    removeCustomTrigger, 
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
          Create intelligent triggers that reach out to visitors based on their behavior
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
        <>
          <ProactiveGlobalSettings config={config} onUpdate={updateConfig} />
          <PageRestrictionsConfig config={config} onUpdate={updateConfig} />
        </>
      )}

      {/* Triggers Section */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Triggers
              </CardTitle>
              <Button onClick={() => setShowWizard(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Trigger
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!config.custom_triggers?.length ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No triggers created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first trigger to start engaging with visitors proactively
                </p>
                <Button onClick={() => setShowWizard(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Trigger
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {config.custom_triggers.map((trigger) => (
                  <TriggerListCard
                    key={trigger.id}
                    trigger={trigger}
                    onToggle={(enabled) => updateCustomTrigger(trigger.id, { enabled })}
                    onEdit={() => {
                      setEditingTrigger(trigger);
                      setShowWizard(true);
                    }}
                    onDelete={() => removeCustomTrigger(trigger.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={saveConfig} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Trigger Creation Wizard */}
      <TriggerCreationWizard
        open={showWizard}
        onOpenChange={(open) => {
          setShowWizard(open);
          if (!open) setEditingTrigger(null);
        }}
        onCreateTrigger={addCustomTrigger}
        editingTrigger={editingTrigger}
        onUpdateTrigger={updateCustomTrigger}
      />
    </div>
  );

  return (
    <PlanEnforcementWrapper feature="visitor_analytics">
      {contentComponent}
    </PlanEnforcementWrapper>
  );
};
