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
    script.src = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/chat-widget-enhanced?agentId=be66d317-4d73-4394-8a16-fe59067ce716&position=bottom-right&theme=dark&color=%2384cc16';
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
    <div className="min-h-screen bg-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-muted/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--muted-foreground)/0.05),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-6 text-base px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <MessageSquare className="h-4 w-4 mr-2" />
              Turn More Browsers Into Buyers
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-foreground">
              The next generation of{' '}
              <span className="text-primary">AI chat agents</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Most website visitors leave without converting. Our AI chat agents analyze real-time behavior and start personalized conversations before visitors slip away, turning browsers into buyers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-primary hover:bg-primary-hover text-primary-foreground shadow-glow"
                onClick={() => {
                  const demoSection = document.getElementById('video-demo');
                  if (demoSection) {
                    demoSection.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }
                }}
              >
                See AI Chat Agents in Action
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/auth/signup">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto bg-foreground text-background border-foreground hover:bg-foreground/90">
                  Add Chat Agents to My Site
                </Button>
              </Link>
            </div>

            <div className="pt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2"><Sparkles className="h-10 w-10 mx-auto" /></div>
                  <div className="text-sm text-muted-foreground">AI-Powered Intelligence</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2"><TrendingUp className="h-10 w-10 mx-auto" /></div>
                  <div className="text-sm text-muted-foreground">Significantly Better Engagement</div>
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
        <div id="video-demo" className="container mx-auto px-4 pt-16">
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
                  <p className="text-muted-foreground">See AI chat agents in action</p>
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
              Advanced Proactive Intelligence{' '}
              <span className="text-gradient-primary">That Reactive Chatbots Can't Match</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              While competitors wait for visitors to ask questions, our AI starts conversations first with configurable behavioral triggers and intelligent engagement rules.
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
              Coming Soon Integrations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building integrations with popular platforms to make deployment even easier.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center max-w-4xl mx-auto mb-12">
            {['Shopify', 'WordPress', 'Webflow', 'Squarespace', 'HubSpot', 'Salesforce'].map((platform) => (
              <div key={platform} className="text-center relative">
                <div className="h-16 bg-muted/50 rounded-lg flex items-center justify-center border border-primary/10 hover:border-primary/30 transition-colors opacity-60">
                  <span className="font-semibold text-muted-foreground">{platform}</span>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1 absolute -top-2 -right-2 bg-primary text-primary-foreground">
                  Coming Soon
                </Badge>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works - Proactive Process */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              How Proactive AI Recovers Lost Visitors
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              While competitors wait for visitors to ask questions, our AI starts conversations first with three intelligent steps.
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

      {/* Growing Customer Base */}
      <section className="py-16 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-semibold text-muted-foreground">Join Our Growing Community of Early Adopters</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be among the first businesses to use proactive AI chat agents and gain a competitive advantage in visitor engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about AI chat agents that convert visitors.
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
              Be among the first to use proactive AI technology to engage visitors before they leave and turn browsers into buyers.
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
    title: 'Smart Behavior Reading',
    description: 'AI analyzes visitor mouse movements, scroll patterns, and page engagement with configurable confidence thresholds and behavioral triggers to understand intent before starting conversations.'
  },
  {
    icon: Target,
    title: 'Perfect Timing',
    description: 'Customizable timing delays and frequency limits ensure chat agents start conversations at the optimal moment without overwhelming visitors.'
  },
  {
    icon: MessageSquare,
    title: 'Intelligent Trigger Rules',
    description: 'AI detects visitor intent patterns for pricing concerns, feature exploration, and company research to deliver highly relevant conversation starters.'
  },
  {
    icon: Eye,
    title: 'Real-time Intent Detection',
    description: 'Advanced behavioral analysis identifies when visitors are ready to buy, comparing products, or about to leave - triggering perfectly timed engagement.'
  },
  {
    icon: BarChart3,
    title: 'Conversion Analytics',
    description: 'Track proactive engagement performance and optimize behavioral triggers based on which conversation patterns convert best.'
  },
  {
    icon: Settings,
    title: 'Adaptive Learning',
    description: 'Continuously optimize engagement rules based on conversion data, improving timing and message relevance for maximum visitor recovery.'
  }
];

const proactiveSteps = [
  {
    title: 'Configure Behavioral Triggers',
    description: 'Set up advanced behavioral triggers and engagement rules. Configure timing delays, frequency limits, and visitor intent detection patterns.',
    icon: Settings
  },
  {
    title: 'AI Detects Intent Patterns',
    description: 'AI analyzes real-time visitor behavior to detect intent patterns and optimal engagement moments before visitors leave your site.',
    icon: Brain
  },
  {
    title: 'Deliver Personalized Messages',
    description: 'AI delivers perfectly timed, personalized messages based on detected visitor behavior and intent, recovering visitors who would otherwise leave.',
    icon: Target
  }
];

const metrics = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Response Time' },
  { value: 'AI-Powered', label: 'Intelligence' },
  { value: '24/7', label: 'Availability' }
];

const faqItems = [
  {
    question: 'Why is proactive engagement better than waiting for visitors to ask questions?',
    answer: 'Proactive AI catches visitors before they leave, while reactive chatbots only help visitors who are already engaged. Studies show 97% of visitors leave without converting - our proactive approach recovers many of these lost visitors by starting conversations first.'
  },
  {
    question: 'How customizable are the proactive engagement rules?',
    answer: 'Fully customizable. Set behavioral triggers, confidence thresholds, timing delays, frequency limits, and specific intent patterns. Configure different engagement rules for different pages, visitor sources, and behavioral patterns.'
  },
  {
    question: 'How is this different from traditional chatbots?',
    answer: 'Traditional chatbots are reactive - they wait for visitors to start conversations. Our AI has a first-mover advantage by proactively analyzing visitor behavior and starting relevant conversations at the perfect moment to maximize conversions.'
  },
  {
    question: 'What visitor behaviors trigger proactive engagement?',
    answer: 'AI detects pricing page visits, product comparisons, scroll patterns indicating confusion, time spent on specific sections, exit intent, repeat visits, and dozens of other behavioral signals that indicate visitor intent and optimal engagement timing.'
  },
  {
    question: 'How quickly do proactive AI agents start working?',
    answer: 'Proactive engagement starts immediately. Most customers see visitor recovery within hours and significant conversion improvements within 2-4 weeks as the AI learns optimal engagement patterns for their specific audience.'
  },
  {
    question: 'Is visitor behavioral data secure and compliant?',
    answer: 'Absolutely. We\'re GDPR and CCPA compliant with behavioral privacy protection, use bank-level encryption, and only track engagement patterns - never personal information without explicit consent.'
  }
];