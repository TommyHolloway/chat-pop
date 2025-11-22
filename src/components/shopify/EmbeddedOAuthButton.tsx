import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useShopifySession } from '@/hooks/useShopifySession';
import { Redirect } from '@shopify/app-bridge/actions';
import { createApp } from '@shopify/app-bridge';

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
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      
      if (!host) {
        throw new Error('Missing Shopify host parameter');
      }

      const apiKey = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
      if (!apiKey) {
        throw new Error('VITE_SHOPIFY_CLIENT_ID not configured');
      }

      // Initiate OAuth flow via edge function (anonymous for embedded)
      const { data, error } = await supabase.functions.invoke('shopify-oauth-install-anonymous', {
        body: { 
          shop_domain: session.shop_domain,
          agent_id: agentId,
        },
      });

      if (error) throw error;

      if (data?.install_url) {
        // Use App Bridge to redirect to OAuth URL
        const app = createApp({
          apiKey,
          host,
        });

        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, data.install_url);
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
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
