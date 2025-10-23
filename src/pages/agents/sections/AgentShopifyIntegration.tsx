import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useShopifyIntegration } from '@/hooks/useShopifyIntegration';
import { ShopifyProductBrowser } from '@/components/agent/ShopifyProductBrowser';

interface AgentShopifyIntegrationProps {
  agent: any;
}

export const AgentShopifyIntegration = ({ agent }: AgentShopifyIntegrationProps) => {
  const { connectShopify, disconnectShopify, syncProducts, getConnection, isLoading } = useShopifyIntegration(agent.id);
  const [connection, setConnection] = useState<any>(null);
  const [storeDomain, setStoreDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [storefrontToken, setStorefrontToken] = useState('');
  const [showBrowser, setShowBrowser] = useState(false);

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    try {
      const conn = await getConnection();
      setConnection(conn);
      setShowBrowser(!!conn);
    } catch (error) {
      console.error('Error loading connection:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await connectShopify(storeDomain, accessToken, storefrontToken);
      await loadConnection();
      setStoreDomain('');
      setAccessToken('');
      setStorefrontToken('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Shopify store?')) {
      try {
        await disconnectShopify();
        setConnection(null);
        setShowBrowser(false);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncProducts();
      await loadConnection();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shopify Connection
          </CardTitle>
          <CardDescription>
            Connect your Shopify store to enable product recommendations and cart recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">{connection.store_domain}</p>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {connection.last_synced_at 
                        ? new Date(connection.last_synced_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSync}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Sync Products</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-domain">Store Domain</Label>
                <Input
                  id="store-domain"
                  placeholder="your-store.myshopify.com"
                  value={storeDomain}
                  onChange={(e) => setStoreDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-token">Admin API Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="shpat_..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storefront-token">Storefront API Token (Optional)</Label>
                <Input
                  id="storefront-token"
                  type="password"
                  placeholder="Optional for public queries"
                  value={storefrontToken}
                  onChange={(e) => setStorefrontToken(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleConnect}
                disabled={!storeDomain || !accessToken || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Connect to Shopify
              </Button>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Need help?</strong> Follow these steps to connect your Shopify store:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to your Shopify Admin → Apps → Develop apps</li>
                  <li>Create a new app and configure API access</li>
                  <li>Copy the Admin API access token</li>
                  <li>Paste it here to connect</li>
                </ol>
                <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                  <a href="https://help.shopify.com/en/manual/apps/app-types/custom-apps" target="_blank" rel="noopener noreferrer">
                    View detailed guide <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Browser */}
      {showBrowser && <ShopifyProductBrowser agentId={agent.id} />}
    </div>
  );
};
