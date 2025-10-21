import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Webhook, Slack, Mail, Zap } from 'lucide-react';

export const AgentSettingsIntegrations = ({ agent }: { agent: any }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your agent with external services and platforms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're working on bringing you powerful integrations to extend your agent's capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Webhooks</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Send conversation data to your server in real-time
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Slack className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Slack</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get notifications in your Slack workspace
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Email Notifications</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Zapier</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect with 5000+ apps via Zapier
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Want early access to integrations? Contact our support team to learn more about upcoming features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
