import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShoppingBag } from 'lucide-react';

interface ShopifyOAuthButtonProps {
  agentId: string;
  onSuccess?: () => void;
}

export const ShopifyOAuthButton = ({ agentId, onSuccess }: ShopifyOAuthButtonProps) => {
  const [storeDomain, setStoreDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!storeDomain.trim()) {
      toast({
        title: 'Store domain required',
        description: 'Please enter your Shopify store domain',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-oauth-install', {
        body: { shop_domain: storeDomain, agent_id: agentId },
      });

      if (error) throw error;

      if (data?.install_url) {
        // Redirect to Shopify OAuth page
        window.location.href = data.install_url;
      } else {
        throw new Error('No install URL returned');
      }
    } catch (error: any) {
      console.error('OAuth initiation error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to initiate Shopify connection',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Connect your Shopify store securely with OAuth - no manual token copying required
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="shop-domain">Shopify Store Domain</Label>
          <Input
            id="shop-domain"
            value={storeDomain}
            onChange={(e) => setStoreDomain(e.target.value)}
            placeholder="yourstore.myshopify.com"
            disabled={loading}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your myshopify.com domain (e.g., mystore.myshopify.com)
          </p>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={loading || !storeDomain.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to Shopify...
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Connect with Shopify
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You'll be redirected to Shopify to authorize ChatPop. This is safe and secure.
        </p>
      </div>
    </div>
  );
};
