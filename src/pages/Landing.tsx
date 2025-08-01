import { Link } from 'react-router-dom';
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
  Play
} from 'lucide-react';
import { PricingSection } from '@/components/PricingSection';

export const Landing = () => {
  const { activeVideo, loading: videoLoading } = useSiteContent("landing_video");
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              <Badge variant="secondary" className="mb-4 animate-fade-in">
                <Sparkles className="h-3 w-3 mr-1" />
                Free to start • No credit card required
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-slide-up">
                Automate Real Estate Inquiries with AI Chatbots—{' '}
                <span className="text-gradient-hero">Capture Leads 24/7 and Close More Deals</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in">
                Tired of missing off-hour queries or wasting time on tire-kickers? EccoChat lets you build intelligent chat agents in minutes—upload listings, qualify buyers, and schedule viewings with OpenAI power.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-scale-in">
                <Link to="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-4 h-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ✨ 1,000+ businesses trust EccoChat • No setup fees • Cancel anytime
              </p>
            </div>

            {/* Right Column - Video Demo */}
            <div className="lg:pl-8">
              {videoLoading ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeVideo ? (
                <div className="relative">
                  <video
                    controls
                    className="w-full rounded-lg shadow-2xl"
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
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center space-y-3">
                    <Play className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Demo video coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Real Estate Agents Choose EccoChat for{' '}
              <span className="text-gradient-primary">Smarter Client Engagement</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-lift border-0 shadow-soft bg-gradient-card p-6">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need to Build{' '}
              <span className="text-gradient-primary">Smart Chatbots for Real Estate</span>
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Get Your AI Chatbot Up and Running in Just Three Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From setup to deployment, everything is designed for real estate professionals.
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

      {/* Testimonials & Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Trusted by Growing Businesses
            </h2>
            
            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              <Card className="p-6 shadow-soft bg-gradient-card">
                <p className="text-lg mb-4 italic">"Automated 60% of my inquiries—now I focus on closings!"</p>
                <p className="text-sm text-muted-foreground">– Sarah T., Independent Agent</p>
              </Card>
              <Card className="p-6 shadow-soft bg-gradient-card">
                <p className="text-lg mb-4 italic">"Qualified leads jumped 20%; best tool for small brokerages."</p>
                <p className="text-sm text-muted-foreground">– Mike R., Broker Owner</p>
              </Card>
            </div>
            
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
              Ready to Transform Your Customer Support?
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

const benefits = [
  {
    icon: MessageSquare,
    title: 'Capture Every Lead, Day or Night',
    description: 'Handle 70% of inquiries after hours with embedded AI chat on your site—qualify budgets/preferences instantly, turning browsers into buyers.'
  },
  {
    icon: Bot,
    title: 'Save 20-30 Hours/Week on Admin',
    description: 'Automate scheduling, follow-ups, and FAQs—upload MLS listings or neighborhood stats for precise, trust-building responses.'
  },
  {
    icon: Zap,
    title: 'Build Client Trust Effortlessly',
    description: 'Personalized, empathetic chats confirm privacy and share market insights—boost credibility in a competitive field where delayed replies lose deals.'
  },
  {
    icon: BarChart3,
    title: 'Outperform Bigger Firms on a Budget',
    description: 'Low-cost plans let small agents scale leads 15-25% with analytics and custom embeds, navigating volatility like high rates/low inventory.'
  }
];

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