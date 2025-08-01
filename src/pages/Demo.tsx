import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Play, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  Bot,
  CheckCircle
} from 'lucide-react';

export const Demo = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 animate-fade-in">
              <Play className="h-3 w-3 mr-1" />
              Interactive Demo
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-slide-up">
              See EccoChat in Action:{' '}
              <span className="text-gradient-hero">Live Real Estate AI Demo</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Experience how our AI chatbot handles real estate inquiries, qualifies leads, and schedules viewings automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Chatbot Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Try Our Live Demo Chatbot
              </h2>
              <p className="text-xl text-muted-foreground">
                This chatbot is trained on sample real estate data. Ask about properties, pricing, or schedule a viewing!
              </p>
            </div>
            
            <Card className="shadow-large bg-gradient-card">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Real Estate Assistant Demo
                </CardTitle>
                <CardDescription>
                  Ask me about available properties, pricing, or schedule a viewing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-6 min-h-[400px] border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h3 className="text-xl font-semibold">Demo Chatbot Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      We're preparing an interactive demo for you to experience our AI in action. 
                      In the meantime, you can start building your own chatbot for free!
                    </p>
                    <Link to="/auth/signup">
                      <Button className="mt-4">
                        Start Building Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              What You'll See in Our{' '}
              <span className="text-gradient-primary">Live Demo</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the powerful features that make EccoChat perfect for real estate professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="hover-lift border-0 shadow-soft bg-gradient-card p-6">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <div className="flex items-center text-sm text-primary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Demo Available
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Conversations */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Sample Conversations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here are some examples of how our AI handles real estate inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {sampleConversations.map((conversation, index) => (
              <Card key={index} className="shadow-soft bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-lg">{conversation.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversation.messages.map((message, msgIndex) => (
                    <div 
                      key={msgIndex} 
                      className={`p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground ml-8' 
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8 p-8 rounded-2xl bg-gradient-card shadow-large">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Build Your Own AI Assistant?
            </h2>
            <p className="text-xl text-muted-foreground">
              Start creating your personalized real estate chatbot in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-4 h-auto">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const demoFeatures = [
  {
    icon: MessageSquare,
    title: 'Lead Qualification',
    description: 'Watch how the AI qualifies potential buyers by asking about budget, timeline, and preferences.'
  },
  {
    icon: Bot,
    title: 'Property Recommendations',
    description: 'See intelligent property matching based on client criteria and market availability.'
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    description: 'Experience lightning-fast responses to common real estate questions and concerns.'
  }
];

const sampleConversations = [
  {
    title: 'Property Inquiry',
    messages: [
      { type: 'user', text: "I'm looking for a 3-bedroom house under $500k" },
      { type: 'bot', text: "Great! I have several options in your budget. What area are you interested in, and do you have any specific requirements like a garage or yard?" },
      { type: 'user', text: "Downtown area with a garage would be perfect" },
      { type: 'bot', text: "Perfect! I found 3 properties that match your criteria. Would you like me to schedule a viewing for this weekend?" }
    ]
  },
  {
    title: 'Market Information',
    messages: [
      { type: 'user', text: "What's the average home price in Riverside?" },
      { type: 'bot', text: "The current average home price in Riverside is $485,000, up 3.2% from last year. The market is fairly balanced with good opportunities for both buyers and sellers." },
      { type: 'user', text: "How long do homes typically stay on the market?" },
      { type: 'bot', text: "Homes in Riverside typically sell within 25-30 days. Well-priced properties often receive multiple offers within the first week." }
    ]
  }
];