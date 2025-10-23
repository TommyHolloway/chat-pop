import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroWithStoreInput = () => {
  const [storeUrl, setStoreUrl] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate('/signup');
  };

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Gradient background blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] gradient-coral-blob opacity-60 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] gradient-peach-blob opacity-50 blur-3xl" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            Turn Online Shoppers Into
            <br />
            <span className="gradient-text">Paying Customers</span> with AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            AI shopping assistants that recover abandoned carts and recommend products 24/7
          </p>
          
          {/* Store URL Input Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-card rounded-2xl shadow-elegant border border-border/50">
              <div className="flex-1 flex items-center gap-2 px-4">
                <Store className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="myshopifystore.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg bg-transparent"
                />
              </div>
              <Button 
                size="lg" 
                onClick={handleAnalyze}
                className="whitespace-nowrap"
              >
                Analyze My Store <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Free analysis • See results in 60 seconds
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              500+ E-commerce Stores
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              $2M+ Recovered
            </span>
          </div>
        </div>

        {/* Hero Product Mockup */}
        <div className="relative">
          <div className="absolute inset-0 gradient-coral-blob opacity-40 blur-3xl" />
          <img
            src="/lovable-uploads/ba9e4a95-0439-42d8-8181-e8892fbe2baa.png"
            alt="ChatPop Dashboard"
            className="relative rounded-2xl shadow-2xl w-full"
          />
        </div>
      </div>
    </section>
  );
};
