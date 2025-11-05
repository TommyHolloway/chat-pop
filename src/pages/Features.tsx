import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  MessageSquare, 
  Eye, 
  BarChart3, 
  Settings,
  ArrowRight,
  Sparkles,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Features = () => {

  return (
    <>
      <SEO 
        title="AI Shopping Assistant Features | ChatPop"
        description="Discover ChatPop's AI-powered features: smart product recommendations, cart abandonment recovery, size & fit assistant, order tracking, and revenue analytics for e-commerce."
        canonical="https://chatpop.ai/features"
        keywords="AI shopping assistant, product recommendations, cart recovery, e-commerce AI, customer support automation, revenue analytics"
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-base px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Advanced AI Technology
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold">
              Turn Shoppers Into Buyers{' '}
              <span className="text-gradient-primary">Automatically</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI shopping assistants that recommend products, answer questions, and recover abandoned carts - 24/7. Built specifically for e-commerce stores.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                  See Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {intelligenceFeatures.map((feature, index) => (
              <Card key={index} className="hover-lift border-primary/20 shadow-intelligence bg-gradient-card">
                <CardHeader>
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 shadow-glow">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Process */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              From Visitor to Customer in 3 Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Set up in minutes and start converting more shoppers into buyers automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {proactiveSteps.map((step, index) => (
              <div key={index} className="text-center space-y-6 relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
                <div className="h-16 w-16 rounded-full bg-gradient-primary text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-glow">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                <div className="mx-auto w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center border border-primary/20">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results & Impact */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Why Leading Companies Choose{' '}
              <span className="text-gradient-primary">Proactive Over Reactive</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
            <Card className="p-8 shadow-large bg-gradient-card border-primary/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">300%+</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate Improvement</div>
                  </div>
                </div>
                <p className="text-lg italic">"Our visitor-to-lead conversion improved dramatically in just two months. The AI chat agents start conversations we never would have had."</p>
                <p className="text-sm text-muted-foreground">– E-commerce Director</p>
              </div>
            </Card>

            <Card className="p-8 shadow-large bg-gradient-card border-primary/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">Significant</div>
                    <div className="text-sm text-muted-foreground">Revenue Growth</div>
                  </div>
                </div>
                <p className="text-lg italic">"The AI chat agents know exactly when to engage visitors and what to say. It's like having a perfect salesperson on every page."</p>
                <p className="text-sm text-muted-foreground">– VP of Sales</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-intelligence shadow-large">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Ready to Turn More Shoppers Into Buyers?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join 500+ e-commerce stores using AI to increase conversions, recover abandoned carts, and boost revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-white/30 text-white hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/70">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

const intelligenceFeatures = [
  {
    icon: Brain,
    title: 'Smart Product Recommendations',
    description: 'AI learns your entire catalog and recommends the perfect products based on customer questions, browsing history, and preferences. Increases average order value by 40%.'
  },
  {
    icon: Target,
    title: 'Cart Abandonment Recovery',
    description: 'Detects when shoppers are about to leave and starts a conversation at the perfect moment. Recovers 30% of abandoned carts by addressing concerns and answering questions.'
  },
  {
    icon: MessageSquare,
    title: 'Size & Fit Assistant',
    description: 'Answers sizing questions, provides measurements, and helps customers find the perfect fit. Reduces returns and increases customer confidence.'
  },
  {
    icon: Eye,
    title: 'Order Tracking & Support',
    description: 'Handles "Where is my order?" questions automatically, provides tracking updates, and resolves common post-purchase inquiries 24/7.'
  },
  {
    icon: BarChart3,
    title: 'Revenue Attribution Analytics',
    description: 'Track which conversations drive sales, measure ROI, and see how the AI impacts your bottom line. Optimize based on real revenue data.'
  },
  {
    icon: Settings,
    title: 'Shopify Integration',
    description: 'Seamlessly integrates with Shopify, syncing your product catalog, inventory, and customer data automatically. Setup takes minutes.'
  }
];

const proactiveSteps = [
  {
    title: 'Connect Your Store',
    description: 'Integrate with Shopify or add our widget to any e-commerce platform. The AI automatically syncs your product catalog and inventory.',
    icon: Settings
  },
  {
    title: 'AI Learns Your Products',
    description: 'Our AI studies your catalog, product descriptions, and customer data to provide accurate recommendations and answers.',
    icon: Brain
  },
  {
    title: 'Start Converting Shoppers',
    description: 'AI engages shoppers at the perfect moment, answers questions, recommends products, and recovers abandoned carts - automatically.',
    icon: Target
  }
];

const metrics = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Response Time' },
  { value: 'AI-Powered', label: 'Intelligence' },
  { value: '24/7', label: 'Availability' }
];