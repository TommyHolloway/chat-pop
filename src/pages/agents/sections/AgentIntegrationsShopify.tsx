import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingBag, ExternalLink, Package, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ShopifyOAuthButton } from '@/components/ShopifyOAuthButton';
import { supabase } from '@/integrations/supabase/client';

export const AgentIntegrationsShopify = ({ agent }: { agent: any }) => {
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

        // Check for App Embed success message
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('embed_ready') === 'true' && data && data.length > 0) {
          toast({
            title: "🎉 Shopify Connected!",
            description: "Your widget is ready as an App Embed. Enable it in Theme Settings → App Embeds.",
            duration: 8000,
          });
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        }

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
          description: data?.error || 'Could not connect to Shopify',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnectShopify = async (shopDomain: string) => {
    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('shopify-oauth-disconnect', {
        body: {
          agent_id: agent.id,
          shop_domain: shopDomain
        }
      });

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: `Successfully disconnected from ${shopDomain}`,
      });

      // Refresh connections
      handleRefreshAgent();
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect from Shopify',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Shopify Integration</h2>
        <p className="text-muted-foreground">
          Connect your Shopify store to unlock e-commerce capabilities, inventory management, and order tracking.
        </p>
      </div>

      {/* Shopify Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Shopify Connection</CardTitle>
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
                    window.location.href = `/workspace/${agent.workspace_id}/agents/${agent.id}/integrations/shopify?connect_shop=true`;
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
    </div>
  );
};

export default AgentIntegrationsShopify;
