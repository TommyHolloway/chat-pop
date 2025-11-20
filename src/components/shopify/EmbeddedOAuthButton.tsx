import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useShopifySession } from '@/hooks/useShopifySession';
import { createApp } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge/utilities';

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
      // Get session token from App Bridge
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      
      if (!host) {
        throw new Error('Missing Shopify host parameter');
      }

      const apiKey = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
      if (!apiKey) {
        throw new Error('VITE_SHOPIFY_CLIENT_ID not configured');
      }

      const app = createApp({
        apiKey,
        host,
      });

      const sessionToken = await getSessionToken(app);

      // Call embedded connect function
      const { data, error } = await supabase.functions.invoke('shopify-embedded-connect', {
        body: { 
          session_token: sessionToken,
          agent_id: agentId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Connected Successfully!',
          description: `Your store ${data.connection?.shop_domain} is now connected.`,
        });
        
        // Refresh the page to show updated connection status
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        throw new Error(data?.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Shopify',
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
