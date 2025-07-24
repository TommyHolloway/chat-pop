import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Billing = () => {
  const { user } = useAuth();
  const { subscription, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async (plan: string) => {
    try {
      await createCheckout(plan);
      toast({
        title: "Redirecting to checkout",
        description: "You'll be redirected to Stripe to complete your subscription.",
      });
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

  const currentPlan = subscription.subscription_tier;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground text-lg">Choose the perfect plan for your AI assistant needs</p>
      </div>

      {/* Current Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Plan
            <div className="flex items-center gap-2">
              <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                {currentPlan === 'free' ? 'Free Plan' : 
                 currentPlan === 'hobby' ? 'Hobby Plan' : 
                 currentPlan === 'standard' ? 'Standard Plan' : 'Free Plan'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={checkSubscription}
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
            {subscription.subscription_end && (
              <div className="mt-2 text-sm">
                Next billing date: {new Date(subscription.subscription_end).toLocaleDateString()}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">142</div>
              <div className="text-sm text-muted-foreground">Conversations this month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">Active agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentPlan === 'free' ? '5' : 
                 currentPlan === 'hobby' ? '20' : 'Unlimited'}
              </div>
              <div className="text-sm text-muted-foreground">Training links limit</div>
            </div>
          </div>
          
          {subscription.subscribed && (
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

        {/* Hobby Plan */}
        <Card className={`relative ${currentPlan === 'hobby' ? 'ring-2 ring-primary' : 'border-primary'}`}>
          {currentPlan !== 'hobby' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="default">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Hobby
              {currentPlan === 'hobby' && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>Perfect for small teams and growing projects</CardDescription>
            <div className="text-3xl font-bold">$7.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {hobbyFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              disabled={currentPlan === 'hobby'}
              onClick={() => handleUpgrade('hobby')}
            >
              {currentPlan === 'hobby' ? 'Current Plan' : 'Upgrade to Hobby'}
            </Button>
          </CardContent>
        </Card>

        {/* Standard Plan */}
        <Card className={`relative ${currentPlan === 'standard' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Standard
              {currentPlan === 'standard' && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>For teams that need more power and flexibility</CardDescription>
            <div className="text-3xl font-bold">$19.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {standardFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              variant={currentPlan === 'standard' ? 'default' : 'outline'}
              disabled={currentPlan === 'standard'}
              onClick={() => handleUpgrade('standard')}
            >
              {currentPlan === 'standard' ? 'Current Plan' : 'Upgrade to Standard'}
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
            Download your invoices and view payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{invoice.description}</div>
                  <div className="text-sm text-muted-foreground">{invoice.date}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">${invoice.amount}</div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const freeFeatures = [
  'Up to 5 training links',
  '1 AI agent',
  'Basic chat features',
  'Email support'
];

const hobbyFeatures = [
  'Everything in Free +',
  'Up to 20 training links',
  '2 AI agents',
  'Advanced chat features',
  'Priority support'
];

const standardFeatures = [
  'Everything in Hobby +',
  'Unlimited training links',
  '5 AI agents',
  'Advanced analytics',
  'Custom integrations',
  'Phone support'
];

const mockInvoices = [
  {
    id: '1',
    description: 'Hobby Plan - March 2024',
    date: 'March 1, 2024',
    amount: '7.99',
    status: 'paid' as const
  },
  {
    id: '2',
    description: 'Hobby Plan - February 2024',
    date: 'February 1, 2024',
    amount: '7.99',
    status: 'paid' as const
  },
  {
    id: '3',
    description: 'Hobby Plan - January 2024',
    date: 'January 1, 2024',
    amount: '7.99',
    status: 'paid' as const
  }
];