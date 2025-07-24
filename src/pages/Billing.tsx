import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CreditCard, 
  Download,
  Zap,
  Crown,
  Building2
} from 'lucide-react';

export const Billing = () => {
  const currentPlan = 'free';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold">Billing & Plans</h1>
            <p className="text-muted-foreground">
              Manage your subscription and billing information
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the Free plan</CardDescription>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                  <div className="text-2xl font-semibold">234 / 1,000</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '23.4%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Agents</div>
                  <div className="text-2xl font-semibold">4 / 5</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Knowledge Base</div>
                  <div className="text-2xl font-semibold">12 MB / 50 MB</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
              <p className="text-muted-foreground">
                Upgrade to unlock more conversations, agents, and advanced features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="text-3xl font-bold">$0<span className="text-base font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {freeFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={currentPlan === 'free' ? 'default' : 'outline'} 
                    className="w-full"
                    disabled={currentPlan === 'free'}
                  >
                    {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-primary shadow-lg">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Best for growing businesses</CardDescription>
                  <div className="text-3xl font-bold">$29<span className="text-base font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {proFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                  <div className="text-3xl font-bold">$99<span className="text-base font-normal">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {enterpriseFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
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
      </div>
    </div>
  );
};

const freeFeatures = [
  '1,000 conversations/month',
  'Up to 5 agents',
  '50 MB knowledge base',
  'Basic analytics',
  'Email support',
  'Standard response time'
];

const proFeatures = [
  '10,000 conversations/month',
  'Unlimited agents',
  '500 MB knowledge base',
  'Advanced analytics',
  'Priority support',
  'Custom branding',
  'API access',
  'Webhook integrations'
];

const enterpriseFeatures = [
  'Unlimited conversations',
  'Unlimited agents',
  '5 GB knowledge base',
  'Advanced analytics & reporting',
  'Dedicated support manager',
  'White-label solution',
  'Full API access',
  'Custom integrations',
  'SSO authentication',
  'SLA guarantee'
];

const mockInvoices = [
  {
    id: '1',
    description: 'Pro Plan - March 2024',
    date: 'March 1, 2024',
    amount: '29.00',
    status: 'paid' as const
  },
  {
    id: '2',
    description: 'Pro Plan - February 2024',
    date: 'February 1, 2024',
    amount: '29.00',
    status: 'paid' as const
  },
  {
    id: '3',
    description: 'Pro Plan - January 2024',
    date: 'January 1, 2024',
    amount: '29.00',
    status: 'paid' as const
  }
];