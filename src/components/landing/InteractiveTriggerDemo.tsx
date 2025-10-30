import { useState, useEffect } from 'react';
import { MessageCircle, Timer, Search, AlertCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TriggerScenario {
  id: string;
  tabLabel: string;
  title: string;
  message: string;
  icon: React.ReactNode;
  imageSrc?: string;
  videoSrc?: string;
  duration?: number;        // Total display time in ms (default: 8000)
  messageDelay?: number;    // Delay before message appears in ms (default: 3000)
}

const TRIGGER_SCENARIOS: TriggerScenario[] = [
  {
    id: 'product_hesitation',
    tabLabel: 'Product Hesitation',
    title: 'Still browsing?',
    message: '👋 Still deciding? I can help with sizing, shipping times, or answer any questions!',
    icon: <Timer className="w-4 h-4" />,
    videoSrc: '/lovable-uploads/product-hesitation-demo.mp4',
    duration: 8000,
    messageDelay: 3000
  },
  {
    id: 'compare_products',
    tabLabel: 'Product Comparison',
    title: 'Need help comparing?',
    message: 'Comparing options? 🤔 I can help you find the perfect match!',
    icon: <Search className="w-4 h-4" />,
    imageSrc: '/lovable-uploads/product-comparison-demo.png',
    videoSrc: '/lovable-uploads/product-comparison-demo.mp4',
    duration: 11000,
    messageDelay: 6000
  },
  {
    id: 'checkout_exit',
    tabLabel: 'Checkout Recovery',
    title: 'Almost there!',
    message: 'Need help completing your order? I can answer questions or apply a discount! 💬',
    icon: <AlertCircle className="w-4 h-4" />,
    videoSrc: '/lovable-uploads/checkout-recovery-demo.mp4',
    duration: 8000,
    messageDelay: 3000
  }
];

export const InteractiveTriggerDemo = () => {
  const [activeTab, setActiveTab] = useState(TRIGGER_SCENARIOS[0].id);
  const [isPaused, setIsPaused] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextScenario, setNextScenario] = useState<string | null>(null);

  const activeScenario = TRIGGER_SCENARIOS.find(s => s.id === activeTab) || TRIGGER_SCENARIOS[0];
  const nextScenarioData = nextScenario ? TRIGGER_SCENARIOS.find(s => s.id === nextScenario) : null;

  // Auto-rotate through scenarios
  useEffect(() => {
    if (!isPaused && !isTransitioning) {
      const duration = activeScenario.duration || 8000;
      const messageDelay = activeScenario.messageDelay || 3000;
      
      const interval = setInterval(() => {
        // Fade out message
        setIsMessageVisible(false);
        
        // Determine next scenario
        const currentIndex = TRIGGER_SCENARIOS.findIndex(s => s.id === activeTab);
        const nextIndex = (currentIndex + 1) % TRIGGER_SCENARIOS.length;
        const nextScenarioId = TRIGGER_SCENARIOS[nextIndex].id;
        
        // Start transition after 300ms
        setTimeout(() => {
          setNextScenario(nextScenarioId);
          setIsTransitioning(true);
          
          // Complete transition after slide animation (500ms)
          setTimeout(() => {
            setActiveTab(nextScenarioId);
            setNextScenario(null);
            setIsTransitioning(false);
            
            // Fade in new message after configured delay
            setTimeout(() => {
              setIsMessageVisible(true);
            }, messageDelay);
          }, 500);
        }, 300);
      }, duration);
      
      return () => clearInterval(interval);
    }
  }, [isPaused, activeTab, isTransitioning, activeScenario.duration, activeScenario.messageDelay]);

  // Manual tab change
  const handleTabChange = (value: string) => {
    if (value === activeTab || isTransitioning) return;
    
    setIsPaused(true);
    setIsMessageVisible(false);
    
    // Get the selected scenario's message delay
    const selectedScenario = TRIGGER_SCENARIOS.find(s => s.id === value);
    const messageDelay = selectedScenario?.messageDelay || 3000;
    
    // Start transition after 300ms
    setTimeout(() => {
      setNextScenario(value);
      setIsTransitioning(true);
      
      // Complete transition after slide animation (500ms)
      setTimeout(() => {
        setActiveTab(value);
        setNextScenario(null);
        setIsTransitioning(false);
        
        // Fade in new message and resume auto-rotation
        setTimeout(() => {
          setIsMessageVisible(true);
          setIsPaused(false);
        }, messageDelay);
      }, 500);
    }, 300);
  };

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl relative">
        {/* Fixed-size orange background card with strong glow */}
        <div 
          className="absolute inset-x-0 -top-12 h-[600px] md:h-[650px] rounded-3xl border-2 border-primary/90 -mx-8 bg-cover bg-center bg-no-repeat backdrop-blur-sm shadow-[0_0_60px_rgba(251,146,60,0.4)_inset] shadow-[0_0_80px_rgba(251,146,60,0.5)]"
          style={{ backgroundImage: 'url(/lovable-uploads/gradient-stripe-bg.jpg)' }}
        />
        
        {/* Content layer */}
        <div className="relative z-10">
          {/* Heading */}
          <div className="text-center mb-12">
            <h2 className="font-alice text-4xl md:text-5xl mb-4 text-foreground">
              See ChatPop in Action
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
          
          {/* Mockup Area with slide transitions */}
          <div 
            className="relative rounded-2xl overflow-hidden shadow-elegant bg-white h-[500px] md:h-[600px]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* E-commerce store mockup - dual video rendering during transitions */}
            <div className="relative w-full h-full">
              {/* Current scenario video */}
              {activeScenario.videoSrc ? (
                <video 
                  key={activeScenario.id}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-in-out",
                    isTransitioning ? "-translate-x-full" : "translate-x-0"
                  )}
                >
                  <source src={activeScenario.videoSrc} type="video/mp4" />
                </video>
              ) : (
                <img 
                  src={activeScenario.imageSrc || "/lovable-uploads/ba9e4a95-0439-42d8-8181-e8892fbe2baa.png"}
                  alt="E-commerce store interface"
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-in-out",
                    isTransitioning ? "-translate-x-full" : "translate-x-0"
                  )}
                />
              )}
              
              {/* Next scenario video (during transition only) */}
              {isTransitioning && nextScenarioData && (
                nextScenarioData.videoSrc ? (
                  <video 
                    key={nextScenarioData.id}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-in-out translate-x-0"
                    style={{ transform: 'translateX(0)' }}
                  >
                    <source src={nextScenarioData.videoSrc} type="video/mp4" />
                  </video>
                ) : (
                  <img 
                    src={nextScenarioData.imageSrc || "/lovable-uploads/ba9e4a95-0439-42d8-8181-e8892fbe2baa.png"}
                    alt="E-commerce store interface"
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-in-out translate-x-0"
                    style={{ transform: 'translateX(0)' }}
                  />
                )
              )}
            </div>
            
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
        </Tabs>
        </div>
        
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
