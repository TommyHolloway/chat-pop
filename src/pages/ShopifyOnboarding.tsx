import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingBag, CheckCircle2, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ShopifyOnboarding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shopConnection, setShopConnection] = useState<any>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  const isNewUser = searchParams.get('new_user') === 'true';
  const isLinked = searchParams.get('linked') === 'true';
  const error = searchParams.get('error');
  const paramAgentId = searchParams.get('agent_id');

  useEffect(() => {
    const fetchConnectionInfo = async () => {
      if (!paramAgentId) {
        setLoading(false);
        return;
      }

      setAgentId(paramAgentId);

      try {
        const { data } = await supabase
          .from('shopify_connections')
          .select('shop_domain, shop_owner_name')
          .eq('agent_id', paramAgentId)
          .eq('revoked', false)
          .is('deleted_at', null)
          .single();

        setShopConnection(data);
      } catch (error) {
        console.error('Error fetching connection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectionInfo();
  }, [paramAgentId]);

  const handleCompleteSetup = () => {
    if (agentId) {
      navigate(`/agents?shopify_connected=true`);
    } else {
      navigate('/agents');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Installation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was an error installing the app: {decodeURIComponent(error)}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Welcome to ChatPop | Shopify Integration Complete</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Welcome to ChatPop! 🎉</CardTitle>
                <CardDescription className="text-lg mt-1">
                  {isNewUser ? 'Your account has been created' : 'Your shop is now connected'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {shopConnection?.shop_domain && (
                  <span className="font-medium">{shopConnection.shop_domain}</span>
                )}
                {' '}has been successfully connected to ChatPop!
              </AlertDescription>
            </Alert>

            {/* New User Instructions */}
            {isNewUser && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Check your email</p>
                  <p className="text-sm">
                    We've sent a magic link to <strong>{shopConnection?.shop_owner_name}</strong> to set up your password and complete your account setup.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Your AI Agent is Ready</p>
                    <p className="text-sm text-muted-foreground">
                      A "Shop Assistant" agent has been created for you with access to your products.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Product Search Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your agent can now search and recommend products from your store.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Cart Recovery Active</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically engage customers who abandon their carts and boost conversions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Button 
                onClick={handleCompleteSetup} 
                size="lg" 
                className="w-full"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Support */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need help getting started?{' '}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
