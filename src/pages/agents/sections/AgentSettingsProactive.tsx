import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Zap, Save, Clock, Target, MessageCircle, Eye, TrendingUp, Map, Plus, X, Globe, MousePointer, ArrowUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';

interface ProactiveTrigger {
  enabled: boolean;
  time_threshold?: number;
  page_views_threshold?: number;
  page_threshold?: number;
  message: string;
  url_patterns?: string[];
}

interface CustomTrigger extends ProactiveTrigger {
  id: string;
  name: string;
  trigger_type: 'time_based' | 'scroll_based' | 'element_interaction' | 'exit_intent';
  scroll_depth?: number;
  element_selector?: string;
}

interface ProactiveConfig {
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

export const AgentSettingsProactive = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<ProactiveConfig>({
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
  });

  useEffect(() => {
    if (agent?.proactive_config) {
      setConfig(prev => ({
        ...prev,
        ...agent.proactive_config,
        triggers: {
          ...prev.triggers,
          ...agent.proactive_config.triggers
        }
      }));
    }
  }, [agent?.proactive_config]);

  const handleSave = async () => {
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Global Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Confidence Threshold */}
            <div className="space-y-2">
              <Label>Confidence Threshold: {config.confidence_threshold.toFixed(1)}</Label>
              <Slider
                value={[config.confidence_threshold]}
                onValueChange={([value]) => updateConfig({ confidence_threshold: value })}
                min={0.1}
                max={0.9}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Minimum confidence level to trigger proactive suggestions (0.1 = less strict, 0.9 = very strict)
              </p>
            </div>

            {/* Timing Delay */}
            <div className="space-y-2">
              <Label>Initial Delay: {(config.timing_delay / 1000)} seconds</Label>
              <Slider
                value={[config.timing_delay]}
                onValueChange={([value]) => updateConfig({ timing_delay: value })}
                min={2000}
                max={30000}
                step={1000}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                How long to wait before showing the first proactive suggestion
              </p>
            </div>

            {/* Frequency Limit */}
            <div className="space-y-2">
              <Label>Maximum Suggestions per Session: {config.frequency_limit}</Label>
              <Slider
                value={[config.frequency_limit]}
                onValueChange={([value]) => updateConfig({ frequency_limit: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Limit how many proactive suggestions to show during one visitor session
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Configuration */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Trigger Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Concern */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pricing Concern</Badge>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Switch
                  checked={config.triggers.pricing_concern.enabled}
                  onCheckedChange={(enabled) => updateTrigger('pricing_concern', { enabled })}
                />
              </div>
              
              {config.triggers.pricing_concern.enabled && (
                <div className="ml-4 space-y-3 border-l-2 pl-4">
                  <div className="space-y-2">
                    <Label>Time on Pricing Pages: {config.triggers.pricing_concern.time_threshold} seconds</Label>
                    <Slider
                      value={[config.triggers.pricing_concern.time_threshold || 30]}
                      onValueChange={([value]) => updateTrigger('pricing_concern', { time_threshold: value })}
                      min={10}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                  </div>
                   <div className="space-y-2">
                     <Label>URL Patterns (comma-separated)</Label>
                     <Input
                       value={(config.triggers.pricing_concern.url_patterns || []).join(', ')}
                       onChange={(e) => updateTrigger('pricing_concern', { 
                         url_patterns: e.target.value.split(',').map(s => s.trim())
                       })}
                       onBlur={(e) => updateTrigger('pricing_concern', { 
                         url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                       })}
                       placeholder="pricing, plans, cost, #pricing"
                     />
                     <p className="text-xs text-muted-foreground">
                       Patterns to match in URLs. Use # for sections (e.g., #pricing)
                     </p>
                   </div>
                   <div className="space-y-2">
                     <Label>Trigger Message</Label>
                     <Textarea
                       value={config.triggers.pricing_concern.message}
                       onChange={(e) => updateTrigger('pricing_concern', { message: e.target.value })}
                       placeholder="Message to show when visitor spends time on pricing pages"
                       rows={2}
                     />
                   </div>
                </div>
              )}
            </div>

            <Separator />

            {/* High Engagement */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">High Engagement</Badge>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <Switch
                  checked={config.triggers.high_engagement.enabled}
                  onCheckedChange={(enabled) => updateTrigger('high_engagement', { enabled })}
                />
              </div>
              
              {config.triggers.high_engagement.enabled && (
                <div className="ml-4 space-y-3 border-l-2 pl-4">
                  <div className="space-y-2">
                    <Label>Time Threshold: {config.triggers.high_engagement.time_threshold} seconds</Label>
                    <Slider
                      value={[config.triggers.high_engagement.time_threshold || 120]}
                      onValueChange={([value]) => updateTrigger('high_engagement', { time_threshold: value })}
                      min={60}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Page Views: {config.triggers.high_engagement.page_views_threshold}</Label>
                    <Slider
                      value={[config.triggers.high_engagement.page_views_threshold || 5]}
                      onValueChange={([value]) => updateTrigger('high_engagement', { page_views_threshold: value })}
                      min={3}
                      max={15}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Message</Label>
                    <Textarea
                      value={config.triggers.high_engagement.message}
                      onChange={(e) => updateTrigger('high_engagement', { message: e.target.value })}
                      placeholder="Message to show for highly engaged visitors"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Feature Exploration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Feature Exploration</Badge>
                  <Map className="h-4 w-4 text-muted-foreground" />
                </div>
                <Switch
                  checked={config.triggers.feature_exploration.enabled}
                  onCheckedChange={(enabled) => updateTrigger('feature_exploration', { enabled })}
                />
              </div>
              
              {config.triggers.feature_exploration.enabled && (
                <div className="ml-4 space-y-3 border-l-2 pl-4">
                  <div className="space-y-2">
                    <Label>Feature Pages Visited: {config.triggers.feature_exploration.page_threshold}</Label>
                    <Slider
                      value={[config.triggers.feature_exploration.page_threshold || 3]}
                      onValueChange={([value]) => updateTrigger('feature_exploration', { page_threshold: value })}
                      min={2}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                   <div className="space-y-2">
                     <Label>URL Patterns (comma-separated)</Label>
                     <Input
                       value={(config.triggers.feature_exploration.url_patterns || []).join(', ')}
                       onChange={(e) => updateTrigger('feature_exploration', { 
                         url_patterns: e.target.value.split(',').map(s => s.trim())
                       })}
                       onBlur={(e) => updateTrigger('feature_exploration', { 
                         url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                       })}
                       placeholder="features, product, demo, #features"
                     />
                     <p className="text-xs text-muted-foreground">
                       Patterns to match in URLs for feature-related pages
                     </p>
                   </div>
                   <div className="space-y-2">
                     <Label>Trigger Message</Label>
                     <Textarea
                       value={config.triggers.feature_exploration.message}
                       onChange={(e) => updateTrigger('feature_exploration', { message: e.target.value })}
                       placeholder="Message to show when visitors explore multiple features"
                       rows={2}
                     />
                   </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Triggers */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Triggers
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addCustomTrigger}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Trigger
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.custom_triggers && config.custom_triggers.length > 0 ? (
              config.custom_triggers.map((trigger) => (
                <Card key={trigger.id} className="relative">
                  <CardContent className="pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeCustomTrigger(trigger.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Trigger Name</Label>
                          <Input
                            value={trigger.name}
                            onChange={(e) => updateCustomTrigger(trigger.id, { name: e.target.value })}
                            placeholder="e.g., Contact Page Visitor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Trigger Type</Label>
                          <Select
                            value={trigger.trigger_type}
                            onValueChange={(value: any) => updateCustomTrigger(trigger.id, { trigger_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time_based">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Time on Page
                                </div>
                              </SelectItem>
                              <SelectItem value="scroll_based">
                                <div className="flex items-center gap-2">
                                  <ArrowUp className="h-4 w-4" />
                                  Scroll Depth
                                </div>
                              </SelectItem>
                              <SelectItem value="element_interaction">
                                <div className="flex items-center gap-2">
                                  <MousePointer className="h-4 w-4" />
                                  Element Interaction
                                </div>
                              </SelectItem>
                              <SelectItem value="exit_intent">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Exit Intent
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                       <div className="space-y-2">
                         <Label>URL Patterns (comma-separated)</Label>
                         <Input
                           value={(trigger.url_patterns || []).join(', ')}
                           onChange={(e) => updateCustomTrigger(trigger.id, { 
                             url_patterns: e.target.value.split(',').map(s => s.trim())
                           })}
                           onBlur={(e) => updateCustomTrigger(trigger.id, { 
                             url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                           })}
                           placeholder="contact, about, /subscribe, #section"
                         />
                        <p className="text-xs text-muted-foreground">
                          URL patterns to match. Use # for sections, / for exact paths, or keywords
                        </p>
                      </div>

                      {trigger.trigger_type === 'time_based' && (
                        <div className="space-y-2">
                          <Label>Time Threshold: {trigger.time_threshold || 30} seconds</Label>
                          <Slider
                            value={[trigger.time_threshold || 30]}
                            onValueChange={([value]) => updateCustomTrigger(trigger.id, { time_threshold: value })}
                            min={5}
                            max={180}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}

                      {trigger.trigger_type === 'scroll_based' && (
                        <div className="space-y-2">
                          <Label>Scroll Depth: {trigger.scroll_depth || 70}%</Label>
                          <Slider
                            value={[trigger.scroll_depth || 70]}
                            onValueChange={([value]) => updateCustomTrigger(trigger.id, { scroll_depth: value })}
                            min={25}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}

                      {trigger.trigger_type === 'element_interaction' && (
                        <div className="space-y-2">
                          <Label>Element Selector</Label>
                          <Input
                            value={trigger.element_selector || ''}
                            onChange={(e) => updateCustomTrigger(trigger.id, { element_selector: e.target.value })}
                            placeholder=".button, #signup, [data-element='cta']"
                          />
                          <p className="text-xs text-muted-foreground">
                            CSS selector for the element to watch for interactions
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Trigger Message</Label>
                        <Textarea
                          value={trigger.message}
                          onChange={(e) => updateCustomTrigger(trigger.id, { message: e.target.value })}
                          placeholder="Custom message for this trigger..."
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={trigger.enabled}
                            onCheckedChange={(enabled) => updateCustomTrigger(trigger.id, { enabled })}
                          />
                          <Label className="text-sm">Enabled</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No custom triggers configured</p>
                <p className="text-xs">Create custom triggers based on your specific website structure</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Ready to Deploy</h4>
              <p className="text-sm text-muted-foreground">
                Save your proactive engagement settings to activate intelligent visitor interactions
              </p>
            </div>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PlanEnforcementWrapper
      feature="visitor_analytics"
      fallbackContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Proactive Engagement</h2>
            <p className="text-muted-foreground">
              Upgrade to Standard plan to access intelligent visitor behavior analysis and proactive suggestions
            </p>
          </div>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Zap className="h-12 w-12 mx-auto text-primary/60" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Premium Feature</h3>
                  <p className="text-muted-foreground">
                    Proactive engagement allows your agent to intelligently reach out to visitors based on their behavior patterns
                  </p>
                </div>
                <Badge variant="outline">Standard Plan Required</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {contentComponent}
    </PlanEnforcementWrapper>
  );
};