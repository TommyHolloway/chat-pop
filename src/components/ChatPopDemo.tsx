import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Scenario {
  id: number;
  title: string;
  description: string;
  message: string;
  animation: 'typing' | 'emoji' | 'expand' | 'discount';
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Pricing Page Visitor",
    description: "Visitor browsing pricing page for 30 seconds",
    message: "Need pricing help? Let's chat!",
    animation: 'typing'
  },
  {
    id: 2,
    title: "High Engagement User",
    description: "High-engagement user on site for 2 minutes",
    message: "Loving our features? Schedule a demo! 🚀",
    animation: 'emoji'
  },
  {
    id: 3,
    title: "Features Page Browser",
    description: "User viewing features/services section",
    message: "Questions about our services? I'm here to answer!",
    animation: 'expand'
  },
  {
    id: 4,
    title: "Cart Abandonment",
    description: "Cart abandonment after 45 seconds",
    message: "Don't leave empty-handed! Get 10% off now. Code: SAVE10",
    animation: 'discount'
  }
];

export const ChatPopDemo = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const handleCardInteraction = (id: number) => {
    if (window.innerWidth < 768) {
      // Mobile: toggle on tap
      if (activeCard === id) {
        setActiveCard(null);
      } else {
        setActiveCard(id);
        // Auto-close after 3 seconds on mobile
        setTimeout(() => setActiveCard(null), 3000);
      }
    } else {
      // Desktop: show on hover
      setActiveCard(id);
    }
  };

  const handleCardLeave = () => {
    if (window.innerWidth >= 768) {
      setActiveCard(null);
    }
  };

  return (
    <section 
      id="chatpop-demo" 
      className="relative py-20 px-8 overflow-hidden"
      style={{ minHeight: '800px' }}
    >
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#14B8A6] opacity-95"></div>
      
      {/* Content container */}
      <div className="container mx-auto relative z-10">
        {/* Heading Section */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl font-bold text-white mb-4">
            See ChatPop in Action
          </h2>
          <p className="text-2xl text-white/80">
            Hover over a scenario to trigger the widget demo
          </p>
        </div>

        {/* Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-12">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="relative group cursor-pointer"
              onMouseEnter={() => handleCardInteraction(scenario.id)}
              onMouseLeave={handleCardLeave}
              onClick={() => handleCardInteraction(scenario.id)}
              role="button"
              tabIndex={0}
              aria-label={`View demo for ${scenario.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardInteraction(scenario.id);
                }
              }}
            >
              {/* Card */}
              <div 
                className="relative bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 h-48 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                style={{
                  transform: activeCard === scenario.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {scenario.title}
                </h3>
                <p className="text-sm text-white/70">
                  {scenario.description}
                </p>
              </div>

              {/* Chat Widget Overlay */}
              <div 
                className="absolute -bottom-4 -right-4 transition-all duration-300 pointer-events-none"
                style={{
                  opacity: activeCard === scenario.id ? 1 : 0,
                  transform: activeCard === scenario.id 
                    ? scenario.animation === 'expand' 
                      ? 'scale(1) translateY(0)' 
                      : 'translateY(0)' 
                    : 'translateY(10px)',
                }}
              >
                <div className="bg-[#14B8A6] rounded-xl p-4 shadow-2xl max-w-xs relative">
                  {/* Chat bubble tail */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-[#14B8A6] transform rotate-45"></div>
                  
                  <p className="text-white text-sm leading-relaxed">
                    {scenario.message}
                  </p>

                  {/* Typing animation for scenario 1 */}
                  {scenario.animation === 'typing' && activeCard === scenario.id && (
                    <div className="flex gap-1 mt-2">
                      <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  )}

                  {/* Action button for discount scenario */}
                  {scenario.animation === 'discount' && activeCard === scenario.id && (
                    <button className="mt-3 w-full bg-white text-[#14B8A6] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">
                      Claim Discount
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center pt-8">
          <Link to="/auth/signup">
            <Button 
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white shadow-2xl animate-pulse hover:animate-none transition-all hover:scale-105"
            >
              Try ChatPop Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
