import { useState, useEffect } from 'react';
import { MessageCircle, Timer, Search, AlertCircle, ShoppingCart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TriggerScenario {
  id: string;
  tabLabel: string;
  title: string;
  message: string;
  icon: React.ReactNode;
  imageSrc?: string;
}

const TRIGGER_SCENARIOS: TriggerScenario[] = [
  {
    id: 'product_hesitation',
    tabLabel: 'Product Hesitation',
    title: 'Still browsing?',
    message: '👋 Still deciding? I can help with sizing, shipping times, or answer any questions!',
    icon: <Timer className="w-4 h-4" />
  },
  {
    id: 'compare_products',
    tabLabel: 'Product Comparison',
    title: 'Need help comparing?',
    message: 'Comparing options? 🤔 I can help you find the perfect match!',
    icon: <Search className="w-4 h-4" />,
    imageSrc: '/lovable-uploads/product-comparison-demo.png'
  },
  {
    id: 'checkout_exit',
    tabLabel: 'Checkout Recovery',
    title: 'Almost there!',
    message: 'Need help completing your order? I can answer questions or apply a discount! 💬',
    icon: <AlertCircle className="w-4 h-4" />
  },
  {
    id: 'cart_abandonment',
    tabLabel: 'Cart Reminder',
    title: "Don't forget!",
    message: 'Your cart is waiting! 🛒 Got questions or need help with checkout?',
    icon: <ShoppingCart className="w-4 h-4" />
  }
];

export const InteractiveTriggerDemo = () => {
  const [activeTab, setActiveTab] = useState(TRIGGER_SCENARIOS[0].id);
  const [isPaused, setIsPaused] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  const activeScenario = TRIGGER_SCENARIOS.find(s => s.id === activeTab) || TRIGGER_SCENARIOS[0];

  // Auto-rotate through scenarios
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        // Fade out message
        setIsMessageVisible(false);
        
        // Wait 300ms, then switch tab
        setTimeout(() => {
          setActiveTab((prev) => {
            const currentIndex = TRIGGER_SCENARIOS.findIndex(s => s.id === prev);
            const nextIndex = (currentIndex + 1) % TRIGGER_SCENARIOS.length;
            return TRIGGER_SCENARIOS[nextIndex].id;
          });
          
          // Fade in new message after 100ms
          setTimeout(() => {
            setIsMessageVisible(true);
          }, 100);
        }, 300);
      }, 8000); // Rotate every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  // Manual tab change
  const handleTabChange = (value: string) => {
    setIsPaused(true);
    setIsMessageVisible(false);
    
    setTimeout(() => {
      setActiveTab(value);
      setTimeout(() => {
        setIsMessageVisible(true);
        // Resume auto-rotation after 10 seconds
        setTimeout(() => setIsPaused(false), 10000);
      }, 100);
    }, 300);
  };

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            See ChatPop Proactive Triggers in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how our AI engages shoppers at the perfect moment
          </p>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-center mb-8 bg-transparent gap-2 h-auto flex-wrap">
            {TRIGGER_SCENARIOS.map((scenario) => (
              <TabsTrigger 
                key={scenario.id}
                value={scenario.id}
                className={cn(
                  "px-4 md:px-6 py-2.5 md:py-3 rounded-full font-medium transition-all",
                  "bg-background/60 backdrop-blur-sm border border-border/50",
                  "data-[state=active]:bg-background data-[state=active]:border-border",
                  "data-[state=active]:shadow-sm hover:bg-background/80"
                )}
              >
                <span className="hidden md:inline">{scenario.tabLabel}</span>
                <span className="md:hidden flex items-center gap-1.5">
                  {scenario.icon}
                  <span className="text-xs">{scenario.tabLabel.split(' ')[0]}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Mockup Area */}
          <div className="relative bg-primary/10 rounded-3xl p-6 md:p-8 border-2 border-primary/20">
            <div 
              className="relative rounded-2xl overflow-hidden shadow-elegant bg-white max-h-[500px] md:max-h-[600px]"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
            {/* E-commerce store mockup */}
            <img 
              src={activeScenario.imageSrc || "/lovable-uploads/ba9e4a95-0439-42d8-8181-e8892fbe2baa.png"}
              alt="E-commerce store interface"
              className="w-full h-full object-cover object-top"
            />
            
            {/* Chatbot Widget Overlay (bottom right) */}
            <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6">
              {/* Chat bubble with message */}
              <div className={cn(
                "absolute bottom-16 md:bottom-20 right-0 w-72 md:w-80 transition-all duration-500",
                isMessageVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <div className="bg-primary rounded-2xl p-3 md:p-4 shadow-lg relative">
                  <p className="text-primary-foreground text-xs md:text-sm leading-relaxed">
                    {activeScenario.message}
                  </p>
                  {/* Tail pointing to button */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary transform rotate-45" />
                </div>
              </div>
              
              {/* Chat button */}
              <button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
        </Tabs>
        
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {TRIGGER_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleTabChange(scenario.id)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                activeTab === scenario.id 
                  ? "bg-primary w-8" 
                  : "bg-primary/30 hover:bg-primary/50 w-2"
              )}
              aria-label={`Go to ${scenario.tabLabel}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
