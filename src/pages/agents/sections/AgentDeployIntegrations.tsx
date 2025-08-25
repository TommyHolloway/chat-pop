import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Webhook, Slack, MessageSquare, Mail, Settings, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentDeployIntegrations = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const handleSaveWebhook = async () => {
    // TODO: Implement webhook configuration
    toast({
      title: "Success",
      description: "Webhook configuration saved",
    });
  };

  const integrations = [
    {
      name: 'Webhooks',
      description: 'Send conversation data to your server',
      icon: Webhook,
      enabled: webhookEnabled,
      onToggle: setWebhookEnabled,
      status: 'available',
    },
    {
      name: 'Slack',
      description: 'Send notifications to Slack channels',
      icon: Slack,
      enabled: slackEnabled,
      onToggle: setSlackEnabled,
      status: 'coming-soon',
    },
    {
      name: 'Discord',
      description: 'Integration with Discord servers',
      icon: MessageSquare,
      enabled: false,
      onToggle: () => {},
      status: 'coming-soon',
    },
    {
      name: 'Email Notifications',
      description: 'Get notified via email for new conversations',
      icon: Mail,
      enabled: emailEnabled,
      onToggle: setEmailEnabled,
      status: 'available',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">Connect your agent with external services and platforms</p>
      </div>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <integration.icon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      <Badge variant={integration.status === 'available' ? 'default' : 'secondary'}>
                        {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <Switch
                  checked={integration.enabled}
                  onCheckedChange={integration.onToggle}
                  disabled={integration.status !== 'available'}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      {webhookEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourserver.com/webhook"
                type="url"
              />
              <p className="text-sm text-muted-foreground">
                Your server endpoint that will receive conversation data
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook Payload Example</Label>
              <Textarea
                value={JSON.stringify({
                  event: "conversation_started",
                  agent_id: id,
                  conversation_id: "uuid",
                  user_message: "Hello!",
                  timestamp: new Date().toISOString(),
                }, null, 2)}
                readOnly
                rows={8}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    event: "conversation_started",
                    agent_id: id,
                    conversation_id: "uuid",
                    user_message: "Hello!",
                    timestamp: new Date().toISOString(),
                  }, null, 2));
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Example
              </Button>
            </div>

            <Button onClick={handleSaveWebhook}>
              <Settings className="mr-2 h-4 w-4" />
              Save Webhook Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      {emailEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll receive email notifications for new conversations and leads at your account email address.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <h5 className="font-medium mb-2">Notification Types:</h5>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>New conversation started</li>
                <li>Lead captured</li>
                <li>Agent mentioned or tagged</li>
                <li>Daily conversation summary</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};