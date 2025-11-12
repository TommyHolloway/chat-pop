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
  const [shopifyConnections, setShopifyConnections] = useState<any[]>([]);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  
  // Fetch OAuth connections (now supporting multiple shops)
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        // Fetch all connections for this agent
        const { data } = await supabase
          .from('shopify_connections')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('revoked', false)
          .is('deleted_at', null);

        setShopifyConnections(data || []);

        // Verify health of connections
        if (data && data.length > 0) {
          const { data: healthData } = await supabase.functions.invoke('shopify-connection-status', {
            body: { agent_id: agent.id }
          });
          
          setConnectionHealth(healthData);
          
          // If connection is invalid, refresh list
          if (healthData && !healthData.connected) {
            toast({
              title: 'Shopify Connection Issue',
              description: 'Some Shopify connections may no longer be valid.',
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

  const isShopifyConnected = shopifyConnections.length > 0;

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

  const handleDisconnectShopify = async (shopDomain: string) => {
    if (!confirm(`Are you sure you want to disconnect ${shopDomain}?`)) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('shopify-oauth-disconnect', {
        body: { agent_id: agent.id, shop_domain: shopDomain }
      });

      if (error) throw error;

      toast({
        title: 'Shopify Disconnected',
        description: `${shopDomain} has been disconnected.`,
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
                  Connect your Shopify store(s) for product recommendations and cart recovery
                </CardDescription>
              </div>
            </div>
            {isShopifyConnected && (
              <Badge variant="default">
                {shopifyConnections.length} {shopifyConnections.length === 1 ? 'Shop' : 'Shops'} Connected
              </Badge>
            )}
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
              {shopifyConnections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Store Domain</p>
                    <p className="text-sm text-muted-foreground">{connection.shop_domain}</p>
                    {connection.shop_owner_email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {connection.shop_owner_email}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected on {new Date(connection.connected_at).toLocaleDateString()}
                    </p>
                    {connectionHealth?.last_verified && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Verified {new Date(connectionHealth.last_verified).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${connection.shop_domain}/admin`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDisconnectShopify(connection.shop_domain)}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ Product Search Enabled</p>
                <p className="text-xs text-muted-foreground mt-1">Your agent can search and recommend products from your stores</p>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Trigger the connect flow for another shop
                    window.location.href = `/workspace/${agent.workspace_id}/agents/${agent.id}/integrations?connect_shop=true`;
                  }}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Connect Another Shop
                </Button>
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
