import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ChatPopDemo } from '@/components/ChatPopDemo';

export const Landing = () => {
  const navigate = useNavigate();

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


  const scrollToDemo = () => {
    const demoSection = document.getElementById('chatpop-demo');
    if (demoSection) {
      demoSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <>
    <div className="min-h-screen bg-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-muted/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--muted-foreground)/0.05),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-6 text-base px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="h-4 w-4 mr-2" />
              Increase Revenue by 200-300%
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-foreground">
              Turn Website Visitors{' '}
              <span className="text-primary">Into Paying Customers</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              AI chat agents that start conversations at the perfect moment - before visitors leave. Turn browsers into buyers while you sleep.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-primary hover:bg-primary-hover text-primary-foreground shadow-glow"
                onClick={() => navigate('/auth/signup')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-foreground text-background border-foreground hover:bg-foreground/90"
                onClick={scrollToDemo}
              >
                See How We Recover Lost Sales
                <Play className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground pt-4">
              No credit card required • See results in 24 hours • Cancel anytime
            </p>

          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <ChatPopDemo />

      {/* Features Preview */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Stop Losing Revenue to{' '}
              <span className="text-gradient-primary">Abandoned Visitors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              While competitors wait for visitors to ask questions, our AI recovers 30% of lost sales by engaging at exactly the right moment.
            </p>
            <div className="pt-8">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 h-auto"
                onClick={() => navigate('/auth/signup')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {intelligenceFeatures.slice(0, 3).map((feature, index) => (
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
              Works on Every Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our widget works on any website through simple embedding. Deploy in minutes on any platform.
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

        </div>
      </section>

      {/* How It Works - Proactive Process */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              From Visitor to Customer in 3 Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Set up in 23 minutes. Start seeing results in 24 hours. No technical knowledge required.
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
                <p className="text-lg italic">"ChatPop generated $47K in additional revenue in our first 60 days. The AI starts conversations we never would have had and recovers visitors we thought were lost."</p>
                <p className="text-sm text-muted-foreground">– Sarah Chen, E-commerce Director at TechStyle Co.</p>
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
                <p className="text-lg italic">"We went from 2% to 7% conversion rate in 90 days. The AI knows exactly when to engage and what to say. It's like having a perfect salesperson on every page, 24/7."</p>
                <p className="text-sm text-muted-foreground">– Marcus Rodriguez, VP of Sales at GrowthLabs</p>
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
            <h3 className="text-2xl font-semibold text-muted-foreground">Join 500+ Businesses Already Increasing Conversions</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From e-commerce stores to SaaS companies, businesses are recovering lost revenue with proactive AI chat agents.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-8 items-center">
              <Badge variant="outline" className="text-base px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                GDPR Compliant
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise-Grade Security
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                99.9% Uptime
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <div id="pricing" data-track="pricing-section">
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
              Ready to 3X Your Conversion Rate?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join 500+ businesses using ChatPop to recover lost revenue. See results in 24 hours or get your money back.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90"
                onClick={() => navigate('/auth/signup')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-white/80 pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Setup in 23 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
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
    title: 'Catch Visitors Before They Bounce',
    description: 'Recovers 30% of lost sales by detecting exit intent and starting conversations at exactly the right moment - before visitors abandon your site.'
  },
  {
    icon: Target,
    title: 'Turn Browsers Into Scheduled Calls',
    description: 'Automatically qualifies leads and books appointments while you sleep. Increases qualified leads by 2-3X without adding sales headcount.'
  },
  {
    icon: MessageSquare,
    title: 'Answer Questions Instantly',
    description: "Handles customer questions 24/7 so your team can focus on closing deals. Reduces support costs while increasing customer satisfaction."
  },
  {
    icon: Eye,
    title: 'Identify High-Intent Buyers',
    description: 'Detects when visitors are ready to purchase and engages immediately. Captures contact info from visitors who would have left anonymous.'
  },
  {
    icon: BarChart3,
    title: "See What's Working",
    description: "Track which messages and timing drive the most conversions. Optimize your approach based on real revenue data, not vanity metrics."
  },
  {
    icon: Settings,
    title: 'Works With Your Stack',
    description: 'Integrates seamlessly with Shopify, HubSpot, Salesforce, and 100+ platforms. Syncs leads directly to your CRM automatically.'
  }
];

const proactiveSteps = [
  {
    title: 'Add Widget to Your Site',
    description: 'Copy and paste one line of code. Works on any website - Shopify, WordPress, custom sites. Takes 23 minutes on average.',
    icon: Settings
  },
  {
    title: 'AI Learns Your Business',
    description: 'Upload your content and the AI automatically learns your products, services, and best responses. No technical setup required.',
    icon: Brain
  },
  {
    title: 'Start Converting More Visitors',
    description: 'AI engages visitors at the perfect moment and handles conversations 24/7. Most customers see results within 24 hours.',
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
    question: "How quickly will I see results?",
    answer: "Most customers see measurable improvements within 24-48 hours. The AI starts engaging visitors immediately, and you'll see increased lead capture and conversions in your first week. Full optimization typically happens within 2-4 weeks."
  },
  {
    question: "What if I already have a chatbot?",
    answer: "ChatPop is fundamentally different - we proactively start conversations before visitors leave, while traditional chatbots wait for visitors to ask questions. Many customers run both: ChatPop for proactive engagement and their existing chatbot for FAQs."
  },
  {
    question: "Do I need technical knowledge to set this up?",
    answer: "No. Setup takes 23 minutes on average and requires just copying one line of code. Our AI automatically learns your business from your website content. If you can add Google Analytics to your site, you can add ChatPop."
  },
  {
    question: "How is ChatPop different from other chatbots?",
    answer: "Traditional chatbots are reactive - they wait for visitors to start conversations. ChatPop is proactive - it detects when visitors are about to leave and starts conversations first. This recovers 30% of visitors who would have left your site."
  },
  {
    question: "Can I see real conversion data from other companies?",
    answer: "Yes. Our customers average a 250% increase in conversion rates. Specific results vary by industry: e-commerce sees 200-300% lifts, SaaS sees 150-250% increases in demo bookings, and service businesses see 2-3X more qualified leads."
  },
  {
    question: "What happens after my free trial?",
    answer: "Your free trial includes 100 conversations. After that, choose a paid plan or stay on the free tier. We'll never charge you without permission, and you can cancel anytime with no questions asked. Plus, we offer a 30-day money-back guarantee."
  }
];