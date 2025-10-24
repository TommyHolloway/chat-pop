import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Webhook, Slack, Mail, Zap, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ShopifyConnectionDialog } from '@/components/ShopifyConnectionDialog';
import { supabase } from '@/integrations/supabase/client';

export const AgentSettingsIntegrations = ({ agent }: { agent: any }) => {
  const { toast } = useToast();
  const [showShopifyDialog, setShowShopifyDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const isShopifyConnected = agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token;

  const handleRefreshAgent = () => {
    // Trigger a page reload to fetch updated agent data
    window.location.reload();
  };

  const handleDisconnectShopify = async () => {
    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({ shopify_config: {} })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: 'Shopify store has been disconnected from this agent.',
      });

      handleRefreshAgent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Shopify store',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your agent with external services and platforms
        </p>
      </div>

      {/* Shopify Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>
                  Connect your existing Shopify store for product recommendations and cart recovery
                </CardDescription>
              </div>
            </div>
            {isShopifyConnected && <Badge variant="default">Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isShopifyConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your existing Shopify store to enable:
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>AI-powered product recommendations</li>
                <li>Cart abandonment detection and recovery</li>
                <li>E-commerce analytics and conversion tracking</li>
                <li>Product search in chat conversations</li>
              </ul>
              <div className="pt-2">
                <Button onClick={() => setShowShopifyDialog(true)}>
                  Connect Shopify Store
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll need your Shopify store domain and Admin API access token
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Store Domain</p>
                  <p className="text-sm text-muted-foreground">{agent.shopify_config?.store_domain}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisconnectShopify}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ Product Search Enabled</p>
                <p className="text-xs text-muted-foreground mt-1">Your agent can now search and recommend products from your store</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <a 
                  href={`https://${agent.shopify_config?.store_domain}/admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Open Shopify Admin
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're working on bringing you more powerful integrations
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
        </CardContent>
      </Card>

      {/* Shopify Connection Dialog */}
      <ShopifyConnectionDialog
        open={showShopifyDialog}
        onOpenChange={setShowShopifyDialog}
        agentId={agent.id}
        onSuccess={handleRefreshAgent}
      />
    </div>
  );
};
