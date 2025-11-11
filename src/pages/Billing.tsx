import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageData } from "@/hooks/useUsageData";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShopifyBillingCard } from "@/components/ShopifyBillingCard";

export const Billing = () => {
  const { user } = useAuth();
  const { subscription, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const { usage } = useUsageData();
  const { plan: currentPlan, isAdminOverride, stripePlan, shopifySubscription, billingProvider, refetch: refetchPlan } = useUserPlan();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [agentId, setAgentId] = useState<string | undefined>();

  useEffect(() => {
    const fetchAgentId = async () => {
      if (!user) return;
      
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (agents && agents.length > 0) {
        setAgentId(agents[0].id);
      }
    };
    
    fetchAgentId();
  }, [user]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!subscription.subscribed || billingProvider === 'shopify') return;
      
      setLoadingInvoices(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-customer-invoices');
        if (!error && data) {
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    };
    
    fetchInvoices();
  }, [subscription.subscribed, billingProvider]);

  const handleUpgrade = async (plan: string) => {
    try {
      if (billingProvider === 'shopify') {
        // Use Shopify billing
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user?.id)
          .limit(1);
        
        if (!agents || agents.length === 0) {
          throw new Error('No agent found');
        }
        
        const { data, error } = await supabase.functions.invoke('shopify-create-subscription', {
          body: { agent_id: agents[0].id, plan }
        });
        
        if (error) throw error;
        
        // Redirect to Shopify confirmation
        window.location.href = data.confirmationUrl;
      } else {
        // Use Stripe billing (existing)
        await createCheckout(plan);
        toast({
          title: "Redirecting to checkout",
          description: "You'll be redirected to Stripe to complete your subscription.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // currentPlan now comes from useUserPlan hook above
  
  // Plan limits for message credits
  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'hobby':
      case 'starter':
        return { messageCredits: 2000, agents: 2, links: -1 }; // -1 = unlimited
      case 'standard':
      case 'growth':
        return { messageCredits: 10000, agents: 5, links: -1 }; // -1 = unlimited
      default:
        return { messageCredits: 50, agents: 1, links: 5 };
    }
  };

  const planLimits = getPlanLimits(currentPlan);

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground text-lg">Choose the perfect plan for your AI assistant needs</p>
      </div>

      {/* Shopify Subscription Details */}
      {billingProvider === 'shopify' && shopifySubscription && (
        <ShopifyBillingCard 
          subscription={shopifySubscription} 
          agentId={agentId}
          onRefresh={refetchPlan}
        />
      )}

      {/* Current Plan Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Plan
              <div className="flex items-center gap-2">
                <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                  {currentPlan === 'free' ? 'Free Plan' : 
                   currentPlan === 'hobby' || currentPlan === 'starter' ? 'Starter Plan' : 
                   currentPlan === 'standard' || currentPlan === 'growth' ? 'Growth Plan' : 'Free Plan'}
                </Badge>
                {billingProvider === 'shopify' && (
                  <Badge variant="outline" className="text-xs">
                    Billed via Shopify
                  </Badge>
                )}
                {isAdminOverride && (
                  <Badge variant="outline" className="text-xs">
                    Admin Override
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    checkSubscription();
                    refetchPlan();
                  }}
                  disabled={subscription.isLoading}
                >
                  {subscription.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
          <CardDescription>
            Your current usage and plan details
            {isAdminOverride && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <strong>Admin Override:</strong> Your plan has been set to {currentPlan} by an administrator. 
                {stripePlan && stripePlan !== 'free' && (
                  <span> (Stripe subscription: {stripePlan})</span>
                )}
              </div>
            )}
            {subscription.subscription_end && !isAdminOverride && (
              <div className="mt-2 text-sm">
                Next billing date: {new Date(subscription.subscription_end).toLocaleDateString()}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {usage.message_credits_used} / {planLimits.messageCredits === -1 ? '∞' : planLimits.messageCredits}
              </div>
              <div className="text-sm text-muted-foreground">Message credits used this month</div>
              {planLimits.messageCredits !== -1 && (
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (usage.message_credits_used / planLimits.messageCredits) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{usage.conversations_count}</div>
              <div className="text-sm text-muted-foreground">Conversations this month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentPlan === 'free' ? '5' : 'Unlimited'}
              </div>
              <div className="text-sm text-muted-foreground">Training links limit</div>
            </div>
          </div>
          
          {subscription.subscribed && billingProvider === 'stripe' && (
            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free
              {currentPlan === 'free' && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" disabled={currentPlan === 'free'}>
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </CardContent>
        </Card>

        {/* Starter Plan */}
        <Card className={`relative ${(currentPlan === 'hobby' || currentPlan === 'starter') ? 'ring-2 ring-primary' : 'border-primary'}`}>
          {currentPlan !== 'hobby' && currentPlan !== 'starter' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="default">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Starter
              {(currentPlan === 'hobby' || currentPlan === 'starter') && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>Recover abandoned carts and boost revenue</CardDescription>
            <div className="text-3xl font-bold">$49<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {starterFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              disabled={currentPlan === 'hobby' || currentPlan === 'starter'}
              onClick={() => handleUpgrade('starter')}
            >
              {(currentPlan === 'hobby' || currentPlan === 'starter') ? 'Current Plan' : 'Upgrade to Starter'}
            </Button>
          </CardContent>
        </Card>

        {/* Growth Plan */}
        <Card className={`relative ${(currentPlan === 'standard' || currentPlan === 'growth') ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Growth
              {(currentPlan === 'standard' || currentPlan === 'growth') && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>Scale your recovered revenue to $50K+/mo</CardDescription>
            <div className="text-3xl font-bold">$199<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {growthFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              variant={(currentPlan === 'standard' || currentPlan === 'growth') ? 'default' : 'outline'}
              disabled={currentPlan === 'standard' || currentPlan === 'growth'}
              onClick={() => handleUpgrade('growth')}
            >
              {(currentPlan === 'standard' || currentPlan === 'growth') ? 'Current Plan' : 'Upgrade to Growth'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            {subscription.subscribed 
              ? "Download your invoices and view payment history"
              : "No billing history yet. Upgrade to a paid plan to start."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!subscription.subscribed ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any invoices yet.</p>
              <p className="text-sm mt-2">Upgrade to a paid plan to get started.</p>
            </div>
          ) : loadingInvoices ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No invoices yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{invoice.description || `Invoice ${invoice.number}`}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invoice.created * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        ${(invoice.amount_paid / 100).toFixed(2)}
                      </div>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoice_pdf && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

const freeFeatures = [
  '1 AI shopping assistant',
  '50 customer interactions/month',
  'Basic product recommendations',
  '10 products in catalog',
  'Email support'
];

const starterFeatures = [
  'Everything in Free +',
  '2,000 customer interactions/month',
  '2 AI shopping assistants',
  'Unlimited products in catalog',
  'Cart abandonment recovery (50/mo)',
  'Revenue attribution analytics',
  'Shopify integration',
  'Priority email support'
];

const growthFeatures = [
  'Everything in Starter +',
  '10,000 customer interactions/month',
  '5 AI shopping assistants',
  'Cart abandonment recovery (500/mo)',
  'Advanced revenue analytics',
  'Custom product recommendation AI',
  'Conversion tracking & attribution',
  'Priority email support'
];
