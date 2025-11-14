import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useShopifySession } from '@/hooks/useShopifySession';

interface EmbeddedOAuthButtonProps {
  agentId: string;
  onSuccess?: () => void;
}

export const EmbeddedOAuthButton = ({ agentId, onSuccess }: EmbeddedOAuthButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useShopifySession();

  const handleConnect = async () => {
    if (!session?.shop_domain) {
      toast({
        title: 'Shop information missing',
        description: 'Unable to get shop details from Shopify',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-oauth-install', {
        body: { 
          shop_domain: session.shop_domain, 
          agent_id: agentId,
          embedded: true // Flag that this is from embedded app
        },
      });

      if (error) throw error;

      if (data?.install_url) {
        // Use App Bridge Redirect for seamless OAuth in embedded context
        window.open(data.install_url, '_parent');
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
          Connect your Shopify store to enable AI-powered shopping features
        </p>
      </div>

      <Button 
        onClick={handleConnect} 
        disabled={loading || !session?.shop_domain}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting to Shopify...
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Connect Store
          </>
        )}
      </Button>

      {!session?.shop_domain && (
        <p className="text-xs text-destructive text-center">
          This app must be accessed from within Shopify Admin
        </p>
      )}
    </div>
  );
};
