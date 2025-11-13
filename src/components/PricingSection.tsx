import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { pricingPlans, type PricingPlan } from '@/config/pricing';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PricingSectionProps {
  title?: string;
  description?: string;
  className?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (planName: string) => void;
}

const PricingCard = ({ plan, onSelect, isLoading }: PricingCardProps & { isLoading: boolean }) => (
  <div className={cn(
    "relative flex flex-col h-full p-8 bg-card rounded-2xl border transition-all duration-300 hover:-translate-y-1",
    plan.highlighted
      ? "border-primary shadow-elegant scale-105"
      : "border-border hover:shadow-lg"
  )}>
    {plan.highlighted && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg">
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4 text-foreground">{plan.name}</h3>
      <div className="flex items-baseline mb-3">
        <span className="text-5xl font-bold text-foreground">{plan.price}</span>
        <span className="text-muted-foreground ml-2 text-lg">/{plan.period}</span>
      </div>
      <p className="text-muted-foreground text-lg">{plan.description}</p>
    </div>
    <div className="flex-1 mb-8">
      {plan.includesPreviousPlan && (
        <div className="text-sm font-medium text-muted-foreground mb-4">
          Everything in <span className="text-foreground">{plan.includesPreviousPlan}</span>, plus:
        </div>
      )}
      <ul className="space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-foreground">
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-base">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
    <Button 
      variant={plan.buttonVariant}
      size="lg"
      className="w-full"
      onClick={() => onSelect(plan.name)}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        plan.buttonText
      )}
    </Button>
  </div>
);

export const PricingSection = ({ title = "Pricing Plans", description, className = "" }: PricingSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleButtonClick = async (planName: string) => {
    console.log('[PricingSection] Button clicked for plan:', planName);
    
    // Free plan - go straight to signup
    if (planName === 'Free') {
      localStorage.setItem('selectedPlan', planName);
      navigate('/auth/signup');
      return;
    }
    
    // Paid plans - create Stripe checkout first
    setIsLoading(true);
    try {
      const planKeyMap: Record<string, string> = {
        "Starter": "starter",
        "Growth": "growth",
        "Pro": "pro"
      };
      
      const planKey = planKeyMap[planName];
      console.log('[PricingSection] Mapped plan key:', planKey);
      
      const requestBody = { 
        plan: planKey,
        successUrl: `${window.location.origin}/auth/signup?plan=${planKey}`,
        cancelUrl: window.location.origin
      };
      console.log('[PricingSection] Invoking edge function with body:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-anonymous', {
        body: requestBody
      });
      
      console.log('[PricingSection] Edge function response:', { data, error });
      
      if (error) {
        console.error('[PricingSection] Edge function error:', error);
        throw error;
      }
      
      if (!data?.url) {
        console.error('[PricingSection] No URL in response:', data);
        throw new Error('No checkout URL received from server');
      }
      
      console.log('[PricingSection] Redirecting to Stripe:', data.url);
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('[PricingSection] Checkout error:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className={`py-20 px-4 bg-background ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-alice text-4xl md:text-5xl mb-4 text-foreground">{title}</h2>
          {description && (
            <p className="text-xl text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} onSelect={handleButtonClick} isLoading={isLoading} />
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">
            Need more than 10 assistants or custom features?
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};