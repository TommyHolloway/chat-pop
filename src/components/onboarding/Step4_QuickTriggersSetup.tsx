import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Timer, Search, AlertCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step4Props {
  enabledTriggers: string[];
  toggleTrigger: (id: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

const QUICK_TRIGGERS = [
  {
    id: 'product_page_hesitation',
    name: 'Product Page Hesitation',
    description: 'Engage shoppers spending 45+ seconds on a product',
    icon: <Timer className="h-5 w-5" />,
    message: "👋 Still deciding? I can help with sizing, shipping times, or answer any questions!",
    recommended: true
  },
  {
    id: 'compare_products',
    name: 'Comparing Multiple Products',
    description: 'Help customers viewing 3+ products',
    icon: <Search className="h-5 w-5" />,
    message: "Comparing options? 🤔 I can help you find the perfect match!",
    recommended: true
  },
  {
    id: 'checkout_exit',
    name: 'Checkout Exit Intent',
    description: 'Recover customers about to leave checkout',
    icon: <AlertCircle className="h-5 w-5" />,
    message: "Need help completing your order? I can answer questions or apply a discount! 💬",
    recommended: true
  },
  {
    id: 'quick_cart_abandonment',
    name: 'Cart Abandonment',
    description: 'Re-engage after 5 minutes of cart inactivity',
    icon: <ShoppingCart className="h-5 w-5" />,
    message: "Your cart is waiting! 🛒 Got questions or need help with checkout?",
    recommended: false
  }
];

export const Step4_QuickTriggersSetup = ({
  enabledTriggers,
  toggleTrigger,
  onNext,
  onSkip
}: Step4Props) => {
  const allEnabled = enabledTriggers.length === QUICK_TRIGGERS.length;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Enable proactive engagement</h2>
        <p className="text-muted-foreground text-lg">
          Let your AI assistant reach out to shoppers at the perfect moment to boost conversions.
        </p>
      </div>
      
      <Card className="border-green-500 bg-gradient-to-br from-green-50 to-background dark:from-green-950 dark:to-background border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                E-commerce Quick Triggers
              </CardTitle>
              <CardDescription>
                Pre-built triggers optimized for Shopify stores
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (allEnabled) {
                  QUICK_TRIGGERS.forEach(t => {
                    if (enabledTriggers.includes(t.id)) {
                      toggleTrigger(t.id);
                    }
                  });
                } else {
                  QUICK_TRIGGERS.forEach(t => {
                    if (!enabledTriggers.includes(t.id)) {
                      toggleTrigger(t.id);
                    }
                  });
                }
              }}
            >
              {allEnabled ? "Disable All" : "Enable All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {QUICK_TRIGGERS.map((trigger) => {
            const isEnabled = enabledTriggers.includes(trigger.id);
            
            return (
              <Card key={trigger.id} className={cn(
                "border-2 transition-all",
                isEnabled ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : "border-border"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex-shrink-0 p-3 rounded-lg",
                      isEnabled ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"
                    )}>
                      {trigger.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{trigger.name}</h3>
                            {trigger.recommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {trigger.description}
                          </p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleTrigger(trigger.id)}
                        />
                      </div>
                      
                      {isEnabled && (
                        <div className="mt-3 p-3 bg-background rounded border">
                          <p className="text-sm italic">"{trigger.message}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          className="flex-1"
        >
          Skip for now
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          className="flex-1"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        You can customize these triggers or add custom ones later in settings
      </p>
    </div>
  );
};
