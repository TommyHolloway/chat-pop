import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSiteContent } from '@/hooks/useSiteContent';
import { 
  Bot, 
  Zap, 
  Globe, 
  Shield, 
  MessageSquare, 
  Settings, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
  Brain,
  Target,
  TrendingUp,
  Eye,
  Clock,
  Users,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { PricingSection } from '@/components/PricingSection';

export const Landing = () => {
  const { activeVideo, loading: videoLoading } = useSiteContent("landing_video");
  
  useEffect(() => {
    // Add chat widget script
    const script = document.createElement('script');
    script.src = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/chat-widget?agentId=be66d317-4d73-4394-8a16-fe59067ce716&position=bottom-right&theme=dark&color=%2384cc16';
    script.async = true;
    
    const handleScriptLoad = () => {
      console.log('Chat widget loaded successfully');
    };
    
    const handleScriptError = () => {
      console.error('Failed to load chat widget');
    };
    
    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);
    
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-intelligence opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-6 text-base px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Brain className="h-4 w-4 mr-2" />
              Next-Generation Visitor Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Turn Website Visitors Into{' '}
              <span className="text-gradient-intelligence">Customers Before</span>{' '}
              They Even Ask
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Our AI agents don't just respond—they predict visitor intent through advanced behavioral analysis and engage proactively at the perfect moment to maximize conversions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 h-auto bg-primary hover:bg-primary-hover text-primary-foreground shadow-glow">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-primary/30 text-primary hover:bg-primary/10">
                  Install on Website
                </Button>
              </Link>
            </div>

            <div className="pt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">+316%</div>
                  <div className="text-sm text-muted-foreground">Growth in conversion rates</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">15%+</div>
                  <div className="text-sm text-muted-foreground">More visitors converted</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Proactive engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Demo Section */}
        <div className="container mx-auto px-4 pt-16">
          <div className="max-w-4xl mx-auto">
            {videoLoading ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center shadow-large">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeVideo ? (
              <div className="relative">
                <video
                  controls
                  className="w-full rounded-lg shadow-large border border-primary/20"
                  preload="metadata"
                  poster={activeVideo.thumbnail_url || undefined}
                >
                  <source src={activeVideo.file_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {activeVideo.title && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    {activeVideo.title}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/20 shadow-large">
                <div className="text-center space-y-3">
                  <Play className="h-16 w-16 mx-auto text-primary" />
                  <p className="text-muted-foreground">See proactive intelligence in action</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Proactive Intelligence Features */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              <span className="text-gradient-primary">Proactive Intelligence</span>{' '}
              That Converts
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Move beyond reactive chat support to predictive visitor engagement that understands intent before users even ask.
            </p>
          </div>

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

      {/* Integration Ecosystem */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Integrates With Everything You Use
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deploy anywhere in minutes with our API-first approach and pre-built integrations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center max-w-4xl mx-auto mb-12">
            {['Shopify', 'WordPress', 'Webflow', 'Squarespace', 'HubSpot', 'Salesforce'].map((platform) => (
              <div key={platform} className="text-center">
                <div className="h-16 bg-muted/50 rounded-lg flex items-center justify-center border border-primary/10 hover:border-primary/30 transition-colors">
                  <span className="font-semibold text-muted-foreground">{platform}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              + 50+ more integrations via API
            </Badge>
          </div>
        </div>
      </section>

      {/* How It Works - Proactive Process */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              How Proactive Intelligence Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three steps to transform visitors into customers with behavioral intelligence.
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
              Proven Results from{' '}
              <span className="text-gradient-primary">Proactive Engagement</span>
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
                    <div className="text-3xl font-bold text-primary">+316%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate Increase</div>
                  </div>
                </div>
                <p className="text-lg italic">"Our visitor-to-lead conversion jumped from 2.1% to 8.7% in just two months. The proactive engagement is a game changer."</p>
                <p className="text-sm text-muted-foreground">– Sarah Chen, E-commerce Director at TechFlow</p>
              </div>
            </Card>

            <Card className="p-8 shadow-large bg-gradient-card border-primary/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">$2.4M</div>
                    <div className="text-sm text-muted-foreground">Additional Revenue Generated</div>
                  </div>
                </div>
                <p className="text-lg italic">"The behavioral insights help us understand our visitors before they even start a conversation. ROI was immediate."</p>
                <p className="text-sm text-muted-foreground">– Michael Rodriguez, VP Sales at Growth Labs</p>
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

      {/* Brand Showcase */}
      <section className="py-16 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-semibold text-muted-foreground">Trusted by 1,000+ Growing Businesses</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60 max-w-4xl mx-auto">
              {['TechCorp', 'StartupLab', 'BusinessPro', 'InnovateInc', 'GrowthCo', 'ScaleUp'].map((company) => (
                <div key={company} className="text-center">
                  <div className="h-12 bg-muted/30 rounded-lg flex items-center justify-center">
                    <span className="font-semibold text-muted-foreground">{company}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* FAQ Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about proactive visitor intelligence.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index} className="p-6 border-primary/20">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground ml-4 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-intelligence shadow-large">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Ready to Transform Visitors Into Customers?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join the next generation of businesses using proactive visitor intelligence to maximize conversions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-white/30 text-white hover:bg-white/10">
                  Talk to Sales
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
  );
};

const intelligenceFeatures = [
  {
    icon: Brain,
    title: 'Behavioral Analysis',
    description: 'Advanced AI tracks mouse movements, scroll patterns, and time spent to understand visitor intent in real-time.'
  },
  {
    icon: Target,
    title: 'Intent Prediction',
    description: 'Predictive algorithms identify high-value visitors and optimal engagement moments before they bounce.'
  },
  {
    icon: Zap,
    title: 'Proactive Engagement',
    description: 'Smart triggers automatically start relevant conversations at the perfect moment to maximize conversion potential.'
  },
  {
    icon: Eye,
    title: 'Visitor Context',
    description: 'Understand what pages visitors viewed, how they arrived, and their engagement level before they even start chatting.'
  },
  {
    icon: BarChart3,
    title: 'Conversion Analytics',
    description: 'Deep insights into visitor behavior patterns, conversion funnels, and optimization opportunities.'
  },
  {
    icon: Settings,
    title: 'Smart Personalization',
    description: 'Dynamic content and conversation starters based on visitor behavior, source, and demonstrated interests.'
  }
];

const proactiveSteps = [
  {
    title: 'Install & Analyze',
    description: 'Deploy our tracking script and start gathering behavioral intelligence on every visitor.',
    icon: Eye
  },
  {
    title: 'Predict Intent',
    description: 'AI algorithms analyze patterns to predict visitor intent and identify conversion opportunities.',
    icon: Brain
  },
  {
    title: 'Engage & Convert',
    description: 'Proactively engage high-intent visitors with personalized conversations that drive conversions.',
    icon: Target
  }
];

const metrics = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Response Time' },
  { value: '1M+', label: 'Conversations' },
  { value: '24/7', label: 'Intelligence' }
];

const faqItems = [
  {
    question: 'How is this different from traditional chatbots?',
    answer: 'Traditional chatbots wait for visitors to initiate contact. Our proactive intelligence analyzes visitor behavior in real-time and engages them at optimal moments based on their demonstrated intent and likelihood to convert.'
  },
  {
    question: 'What behavioral data do you track?',
    answer: 'We track mouse movements, scroll patterns, time on page, page navigation, traffic source, and engagement metrics - all processed in real-time to understand visitor intent without storing personal information.'
  },
  {
    question: 'How quickly can I see results?',
    answer: 'Most customers see immediate improvements in engagement rates within 24-48 hours. Significant conversion increases typically occur within 2-4 weeks as the AI learns your visitor patterns.'
  },
  {
    question: 'Does this work with my existing website?',
    answer: 'Yes! Our solution integrates with any website through a simple script embed. Works with Shopify, WordPress, Webflow, custom sites, and 50+ other platforms.'
  },
  {
    question: 'Is visitor data secure and compliant?',
    answer: 'Absolutely. We\'re GDPR and CCPA compliant, use bank-level encryption, and only track behavioral patterns - never personal information without explicit consent.'
  }
];