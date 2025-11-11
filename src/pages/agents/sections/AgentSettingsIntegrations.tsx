import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Webhook, Slack, Mail, Zap, ShoppingBag, ExternalLink, Package, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ShopifyOAuthButton } from '@/components/ShopifyOAuthButton';
import { supabase } from '@/integrations/supabase/client';

export const AgentSettingsIntegrations = ({ agent }: { agent: any }) => {
  const { toast } = useToast();
  const [shopifyConnection, setShopifyConnection] = useState<any>(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  
  // Fetch OAuth connection and verify health
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        // First check if connection exists in DB
        const { data } = await supabase
          .from('shopify_connections')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('revoked', false)
          .maybeSingle();

        setShopifyConnection(data);

        // If connection exists, verify it's still valid
        if (data) {
          const { data: healthData } = await supabase.functions.invoke('shopify-connection-status', {
            body: { agent_id: agent.id }
          });
          
          setConnectionHealth(healthData);
          
          // If connection is invalid, clear local state
          if (healthData && !healthData.connected) {
            setShopifyConnection(null);
            toast({
              title: 'Shopify Connection Lost',
              description: 'Your Shopify connection is no longer valid. Please reconnect.',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
      } finally {
        setLoadingConnection(false);
      }
    };

    fetchConnectionStatus();
  }, [agent.id]);

  const isShopifyConnected = !!shopifyConnection;

  const handleRefreshAgent = () => {
    // Trigger a page reload to fetch updated agent data
    window.location.reload();
  };

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-inventory-levels', {
        body: { agentId: agent.id }
      });
      
      if (error) throw error;
      
      setInventoryStatus(data);
      toast({
        title: 'Success',
        description: 'Inventory synced successfully',
      });
    } catch (error: any) {
      console.error('Inventory sync error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync inventory',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isShopifyConnected) {
      handleSyncInventory();
    }
  }, [isShopifyConnected]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-shopify-connection', {
        body: {
          storeDomain: agent.shopify_config?.store_domain,
          adminApiToken: agent.shopify_config?.admin_api_token
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Connection Successful',
          description: `Connected to ${data.shopName}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data?.error || 'Failed to connect to Shopify',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnectShopify = async () => {
    if (!confirm('Are you sure you want to disconnect Shopify? This will disable all e-commerce features.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('shopify-oauth-disconnect', {
        body: { agent_id: agent.id }
      });

      if (error) throw error;

      toast({
        title: 'Shopify Disconnected',
        description: 'Your Shopify store has been disconnected.',
      });

      handleRefreshAgent();
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Shopify',
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
          {loadingConnection ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !isShopifyConnected ? (
            <ShopifyOAuthButton agentId={agent.id} onSuccess={handleRefreshAgent} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Store Domain</p>
                  <p className="text-sm text-muted-foreground">{shopifyConnection.shop_domain}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected via OAuth on {new Date(shopifyConnection.connected_at).toLocaleDateString()}
                  </p>
                  {connectionHealth?.last_verified && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Verified {new Date(connectionHealth.last_verified).toLocaleString()}
                    </p>
                  )}
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
                  href={`https://${shopifyConnection.shop_domain}/admin`}
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

      {/* Inventory Dashboard */}
      {isShopifyConnected && inventoryStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>Real-time stock levels from your store</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleSyncInventory}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold">{inventoryStatus.totalProducts || 0}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{inventoryStatus.inStock || 0}</div>
                <div className="text-sm text-muted-foreground">In Stock</div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{inventoryStatus.lowStock || 0}</div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{inventoryStatus.outOfStock || 0}</div>
                <div className="text-sm text-muted-foreground">Out of Stock</div>
              </div>
            </div>
            {inventoryStatus.lastSynced && (
              <p className="text-xs text-muted-foreground mt-4">
                Last synced: {new Date(inventoryStatus.lastSynced).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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

    </div>
  );
};
