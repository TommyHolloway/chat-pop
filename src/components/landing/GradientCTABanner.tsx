import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GradientCTABanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-coral-pink opacity-90" />
      
      <div className="container mx-auto max-w-4xl relative z-10 text-center">
        <h2 className="font-alice text-4xl md:text-6xl font-bold mb-6 text-white">
          Ready to Recover Lost Revenue
          <br />
          in 24 Hours?
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
          Join 500+ stores using AI to turn abandoned carts into sales
        </p>
        
        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => navigate('/signup')}
          className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90"
        >
          Start Recovering Revenue <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            30-day guarantee
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Setup in 5 minutes
          </span>
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};
