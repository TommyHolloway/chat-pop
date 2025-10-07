import { useState } from 'react';
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
import { WaitlistDialog } from '@/components/WaitlistDialog';

export const Features = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState('');

  const openWaitlist = (source: string) => {
    setWaitlistSource(source);
    setWaitlistOpen(true);
  };

  return (
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
              Advanced Proactive Intelligence{' '}
              <span className="text-gradient-primary">That Reactive Chatbots Can't Match</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              While competitors wait for visitors to ask questions, our AI starts conversations first with configurable behavioral triggers and intelligent engagement rules.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => openWaitlist('features-hero')}>
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
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

      {/* CTA Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-intelligence shadow-large">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Ready to Transform Visitors Into Customers?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Be among the first to use proactive AI technology to engage visitors before they leave and turn browsers into buyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90" onClick={() => openWaitlist('features-cta')}>
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
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

      <WaitlistDialog 
        open={waitlistOpen} 
        onOpenChange={setWaitlistOpen} 
        source={waitlistSource} 
      />
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