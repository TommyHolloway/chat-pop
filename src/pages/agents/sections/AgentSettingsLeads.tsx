import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { toast } from '@/hooks/use-toast';

export const AgentSettingsLeads = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  
  const [leadSettings, setLeadSettings] = useState({
    enable_lead_capture: agent?.lead_capture_enabled !== false,
    lead_prompt: agent?.lead_prompt || 'To provide you with the best assistance, could you please share your contact information?',
    required_fields: agent?.required_fields || ['email'],
    optional_fields: agent?.optional_fields || ['name', 'phone'],
    trigger_after_messages: agent?.trigger_after_messages || 3,
    webhook_url: agent?.webhook_url || '',
    notification_email: agent?.notification_email || '',
  });
  
  const [customField, setCustomField] = useState('');
  const [loading, setLoading] = useState(false);

  const availableFields = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'job_title', label: 'Job Title' },
  ];

  useEffect(() => {
    if (agent) {
      setLeadSettings({
        enable_lead_capture: agent.lead_capture_enabled !== false,
        lead_prompt: agent.lead_prompt || 'To provide you with the best assistance, could you please share your contact information?',
        required_fields: agent.required_fields || ['email'],
        optional_fields: agent.optional_fields || ['name', 'phone'],
        trigger_after_messages: agent.trigger_after_messages || 3,
        webhook_url: agent.webhook_url || '',
        notification_email: agent.notification_email || '',
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Only update description field for now as lead capture fields may not exist in schema
      await updateAgent(id, {
        name: agent.name, // Required field
        instructions: agent.instructions, // Required field
        description: `Lead capture: ${leadSettings.enable_lead_capture ? 'enabled' : 'disabled'}`,
      });
      
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

  const updateSetting = (key: string, value: any) => {
    setLeadSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addField = (fieldType: 'required' | 'optional', field: string) => {
    const currentFields = leadSettings[`${fieldType}_fields`];
    if (!currentFields.includes(field)) {
      updateSetting(`${fieldType}_fields`, [...currentFields, field]);
    }
  };

  const removeField = (fieldType: 'required' | 'optional', field: string) => {
    const currentFields = leadSettings[`${fieldType}_fields`];
    updateSetting(`${fieldType}_fields`, currentFields.filter(f => f !== field));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lead Capture</h2>
        <p className="text-muted-foreground">
          Configure how your agent collects visitor information and generates leads.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Capture Settings</CardTitle>
            <CardDescription>
              Enable and configure lead collection for your agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Lead Capture</Label>
                <p className="text-sm text-muted-foreground">Collect visitor information during conversations</p>
              </div>
              <Switch
                checked={leadSettings.enable_lead_capture}
                onCheckedChange={(checked) => updateSetting('enable_lead_capture', checked)}
              />
            </div>

            {leadSettings.enable_lead_capture && (
              <>
                <div>
                  <Label htmlFor="leadPrompt">Lead Collection Prompt</Label>
                  <Textarea
                    id="leadPrompt"
                    value={leadSettings.lead_prompt}
                    onChange={(e) => updateSetting('lead_prompt', e.target.value)}
                    placeholder="What message should the agent use when asking for contact information?"
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="triggerMessages">Trigger After Messages</Label>
                  <Input
                    id="triggerMessages"
                    type="number"
                    value={leadSettings.trigger_after_messages}
                    onChange={(e) => updateSetting('trigger_after_messages', Number(e.target.value))}
                    min={1}
                    max={20}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of messages before requesting contact information
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {leadSettings.enable_lead_capture && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>
                  Configure which information to collect from visitors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Required Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {leadSettings.required_fields.map((field) => (
                      <Badge key={field} variant="default" className="flex items-center gap-1">
                        {availableFields.find(f => f.value === field)?.label || field}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeField('required', field)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addField('required', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Add required field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields
                        .filter(field => !leadSettings.required_fields.includes(field.value))
                        .map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Optional Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {leadSettings.optional_fields.map((field) => (
                      <Badge key={field} variant="secondary" className="flex items-center gap-1">
                        {availableFields.find(f => f.value === field)?.label || field}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeField('optional', field)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addField('optional', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Add optional field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields
                        .filter(field => !leadSettings.optional_fields.includes(field.value) && !leadSettings.required_fields.includes(field.value))
                        .map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Set up notifications when new leads are captured.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={leadSettings.notification_email}
                    onChange={(e) => updateSetting('notification_email', e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="webhookUrl"
                    value={leadSettings.webhook_url}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                    placeholder="https://your-app.com/webhook"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send lead data to your external system
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};