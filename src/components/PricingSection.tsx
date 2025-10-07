import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { pricingPlans, type PricingPlan } from '@/config/pricing';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PricingSectionProps {
  showDescription?: boolean;
  className?: string;
  onWaitlistClick?: (source: string) => void;
}

interface PricingCardProps {
  plan: PricingPlan;
  onButtonClick: (plan: PricingPlan) => void;
}

const PricingCard = ({ plan, onButtonClick }: PricingCardProps) => (
  <Card className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}>
    {plan.highlighted && (
      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
        Most Popular
      </Badge>
    )}
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">{plan.name}</CardTitle>
      <div className="space-y-1">
        <div className="text-3xl font-bold">
          {plan.price}
          <span className="text-base font-normal text-muted-foreground">
            /{plan.period}
          </span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <ul className="space-y-2">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        className="w-full" 
        variant={plan.buttonVariant}
        size="lg"
        onClick={() => onButtonClick(plan)}
      >
        {plan.buttonText}
      </Button>
    </CardContent>
  </Card>
);

export const PricingSection = ({ showDescription = true, className = "", onWaitlistClick }: PricingSectionProps) => {
  const handleButtonClick = (plan: PricingPlan) => {
    if (onWaitlistClick) {
      onWaitlistClick(`pricing-${plan.name.toLowerCase()}`);
    }
  };

  return (
    <section className={`py-20 bg-background ${className}`}>
      <div className="container mx-auto px-4">
        {showDescription && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Pricing That Pays For Itself
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our customers average 250% increase in conversions. Most plans pay for themselves with just a few recovered customers.
            </p>
          </div>
        )}
        
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} onButtonClick={handleButtonClick} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need unlimited conversations or custom integrations for your enterprise?
          </p>
          <Button variant="outline" size="lg" onClick={() => window.location.href = '/contact'}>
            Talk to Our Sales Team
          </Button>
        </div>
      </div>
    </section>
  );
};