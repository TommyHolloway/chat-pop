import { Link } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { PricingSection } from '@/components/PricingSection';

export const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1" />
              Free to start • No credit card required
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-up">
              Build AI Chat Agents{' '}
              <span className="text-gradient-hero">in Minutes</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Create, test, and deploy intelligent chatbots for your business without any coding. 
              Simply upload your knowledge base and let AI handle customer support.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-4 h-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              ✨ 1,000+ businesses trust EccoChat • No setup fees • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to build{' '}
              <span className="text-gradient-primary">smart chatbots</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From knowledge upload to deployment, we've got you covered with powerful features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift border-0 shadow-soft bg-gradient-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your AI chatbot up and running in just three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-gradient-primary text-white flex items-center justify-center mx-auto text-2xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Trusted by growing businesses
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {['TechCorp', 'StartupLab', 'BusinessPro', 'InnovateInc'].map((company) => (
                <div key={company} className="text-center">
                  <div className="h-12 bg-muted rounded-lg flex items-center justify-center">
                    <span className="font-semibold text-muted-foreground">{company}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50ms</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8 p-8 rounded-2xl bg-gradient-card shadow-large">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to transform your customer support?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses using EccoChat to provide instant, intelligent customer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-4 h-auto">
                  Start Building Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: MessageSquare,
    title: 'Knowledge Upload',
    description: 'Upload text files, documents, and web content to train your chatbot with your specific knowledge base.'
  },
  {
    icon: Bot,
    title: 'AI-Powered Chat',
    description: 'Advanced AI understands context and provides accurate, helpful responses based on your data.'
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Deploy your chatbot with a simple embed code or iframe in minutes, not hours.'
  },
  {
    icon: Settings,
    title: 'Easy Customization',
    description: 'Customize your bot\'s personality, appearance, and behavior without any coding required.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track conversations, user satisfaction, and performance metrics to optimize your chatbot.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with data encryption, privacy controls, and compliance standards.'
  }
];

const steps = [
  {
    title: 'Upload Knowledge',
    description: 'Upload your documents, FAQs, or paste text content to create your knowledge base.'
  },
  {
    title: 'Test & Refine',
    description: 'Use our playground to test your chatbot and refine its responses before going live.'
  },
  {
    title: 'Deploy Everywhere',
    description: 'Embed your chatbot on your website, app, or any platform with our simple embed code.'
  }
];