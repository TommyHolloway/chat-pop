import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { pricingPlans, type PricingPlan } from '@/config/pricing';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PricingSectionProps {
  title?: string;
  description?: string;
  className?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (planName: string) => void;
}

const PricingCard = ({ plan, onSelect }: PricingCardProps) => (
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
    <ul className="flex-1 space-y-4 mb-8">
      {plan.features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3 text-foreground">
          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span className="text-base">{feature}</span>
        </li>
      ))}
    </ul>
    <Button 
      variant={plan.buttonVariant}
      size="lg"
      className="w-full"
      onClick={() => onSelect(plan.name)}
    >
      {plan.buttonText}
    </Button>
  </div>
);

export const PricingSection = ({ title = "Pricing Plans", description, className = "" }: PricingSectionProps) => {
  const navigate = useNavigate();
  
  const handleButtonClick = (planName: string) => {
    localStorage.setItem('selectedPlan', planName);
    navigate('/signup');
  };

  return (
    <section className={`py-20 px-4 bg-background ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{title}</h2>
          {description && (
            <p className="text-xl text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} onSelect={handleButtonClick} />
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">
            Need more than 5 assistants or custom features?
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};