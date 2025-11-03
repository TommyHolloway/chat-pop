import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ExternalLink, CheckCircle, Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { shopifyConfigSchema, type ShopifyConfigFormData } from '@/lib/validation';

interface ShopifyConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  onSuccess: () => void;
}

export const ShopifyConnectionDialog = ({ 
  open, 
  onOpenChange, 
  agentId,
  onSuccess 
}: ShopifyConnectionDialogProps) => {
  const [storeDomain, setStoreDomain] = useState('');
  const [adminApiToken, setAdminApiToken] = useState('');
  const [storefrontApiToken, setStorefrontApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form data
      const formData: ShopifyConfigFormData = {
        store_domain: storeDomain,
        admin_api_token: adminApiToken,
        storefront_api_token: storefrontApiToken || undefined,
      };

      const validated = shopifyConfigSchema.parse(formData);

      // Test the Shopify connection using edge function (bypasses CORS)
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'test-shopify-connection',
        {
          body: {
            storeDomain: validated.store_domain,
            adminApiToken: validated.admin_api_token,
          },
        }
      );

      if (testError) {
        throw new Error(`Connection test failed: ${testError.message}`);
      }

      if (!testResult?.success) {
        throw new Error(testResult?.error || 'Failed to verify Shopify credentials and scopes');
      }

      console.log('Shopify connection successful:', testResult.shopName);

      // Save to database
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          shopify_config: {
            store_domain: validated.store_domain,
            admin_api_token: validated.admin_api_token,
            storefront_api_token: validated.storefront_api_token || null,
          },
        })
        .eq('id', agentId);

      if (updateError) throw updateError;

      toast({
        title: 'Success!',
        description: 'Shopify store connected successfully. Your agent can now search products and track conversions.',
      });

      // Reset form
      setStoreDomain('');
      setAdminApiToken('');
      setStorefrontApiToken('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Shopify connection error:', error);
      
      if (error.errors) {
        // Zod validation errors
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      } else {
        toast({
          title: 'Connection Failed',
          description: error.message || 'Failed to connect Shopify store. Please verify your credentials.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Shopify Store</DialogTitle>
            <DialogDescription>
              Enter your Shopify store credentials to enable product recommendations and cart tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Instructions Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>How to get your credentials:</strong>
                <ol className="list-decimal pl-4 mt-2 space-y-1">
                  <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
                  <li>Click "Develop apps" → "Create an app"</li>
                  <li>Configure Admin API scopes: <code className="text-xs bg-muted px-1 py-0.5 rounded">read_products, read_orders, read_customers, read_inventory, read_price_rules</code></li>
                  <li>Install the app and copy your Admin API access token</li>
                </ol>
                <a 
                  href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  View detailed guide <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>

            {/* Store Domain Field */}
            <div className="grid gap-2">
              <Label htmlFor="store-domain">
                Store Domain <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-domain"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                placeholder="yourstore.myshopify.com"
                required
                className={errors.store_domain ? 'border-destructive' : ''}
              />
              {errors.store_domain && (
                <p className="text-sm text-destructive">{errors.store_domain}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your store's myshopify.com domain (e.g., mystore.myshopify.com)
              </p>
            </div>

            {/* Admin API Token Field */}
            <div className="grid gap-2">
              <Label htmlFor="admin-token">
                Admin API Access Token <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-token"
                type="password"
                value={adminApiToken}
                onChange={(e) => setAdminApiToken(e.target.value)}
                placeholder="shpat_... or shpss_... or other Shopify token"
                required
                className={errors.admin_api_token ? 'border-destructive' : ''}
              />
              {errors.admin_api_token && (
                <p className="text-sm text-destructive">{errors.admin_api_token}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Admin API access token (starts with "shp" - e.g., shpat_, shpss_, shpca_)
              </p>
            </div>

            {/* Storefront API Token Field (Coming Soon) */}
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="storefront-token">
                  Storefront API Access Token <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="right">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Future Capabilities</h4>
                      <p className="text-xs text-muted-foreground">
                        When implemented, the Storefront API will enable:
                      </p>
                      <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground">
                        <li><strong>Direct "Add to Cart" buttons</strong> - Let customers add products without leaving the chat</li>
                        <li><strong>Real-time cart preview</strong> - Show and modify cart contents in the conversation</li>
                        <li><strong>Instant checkout links</strong> - Generate personalized checkout URLs</li>
                        <li><strong>Public product browsing</strong> - Access product data without authentication</li>
                        <li><strong>Enhanced product variants</strong> - Display and select sizes/colors dynamically</li>
                      </ul>
                      <p className="text-xs text-muted-foreground italic mt-2">
                        Note: All current features use the Admin API only. The Storefront API is optional and not yet utilized.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Input
                id="storefront-token"
                type="password"
                value={storefrontApiToken}
                onChange={(e) => setStorefrontApiToken(e.target.value)}
                placeholder="Optional - For future enhanced features"
                disabled={true}
              />
              <p className="text-xs text-muted-foreground">
                This field is reserved for future features. All current functionality uses the Admin API.
              </p>
            </div>

            {/* Success Message */}
            {!loading && Object.keys(errors).length === 0 && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                  Once connected, your agent will be able to:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Search and recommend products with real-time stock levels</li>
                    <li>Track abandoned carts and orders with smart recovery</li>
                    <li>Analyze customer lifetime value and repeat purchases</li>
                    <li>Display active promotions and discounts automatically</li>
                    <li>Trigger urgency messages for low stock items</li>
                    <li>Import historical order data for complete analytics</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !storeDomain.trim() || !adminApiToken.trim()}
            >
              {loading ? 'Connecting...' : 'Connect Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
