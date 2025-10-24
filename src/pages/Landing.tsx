import { useEffect } from 'react';
import { HeroWithStoreInput } from '@/components/landing/HeroWithStoreInput';
import { LargeProductMockup } from '@/components/landing/LargeProductMockup';
import { FeatureShowcaseSection } from '@/components/landing/FeatureShowcaseSection';
import { FeatureCardsGrid } from '@/components/landing/FeatureCardsGrid';
import { GradientCTABanner } from '@/components/landing/GradientCTABanner';
import { PricingSection } from '@/components/PricingSection';
import { InteractiveTriggerDemo } from '@/components/landing/InteractiveTriggerDemo';
import { StickyFeatureStack } from '@/components/landing/StickyFeatureStack';

export default function Landing() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://chatpop.ai/widget.js';
    script.async = true;
    script.setAttribute('data-agent-id', '84cc95ba-e47a-490f-a71f-c9a09e95e9e9');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Hero Section with Store Input */}
      <HeroWithStoreInput />

      {/* 2. Interactive Trigger Demo */}
      <InteractiveTriggerDemo />

      {/* 3-5. Sticky Layered Feature Sections */}
      <StickyFeatureStack />

      {/* 6. Beat Competition Section */}
      <FeatureShowcaseSection
        title="Outperform Your Competition with AI"
        description="While competitors lose 70% of potential sales to abandoned carts, ChatPop automatically engages shoppers at the perfect moment—answering questions, addressing concerns, and closing deals 24/7."
        imageSrc="/lovable-uploads/6dc6879a-ad3c-479e-b8c4-99b7af2ab3ec.png"
        imageAlt="AI Chat Assistant"
        imagePosition="left"
      />

      {/* 7. Feature Cards Grid */}
      <FeatureCardsGrid />

      {/* 8. Analytics Dashboard Showcase */}
      <section className="py-20 px-4 gradient-peach-blob">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Track Every Dollar Your AI Recovers
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Full revenue attribution, conversion tracking, and real-time analytics
          </p>
          <div className="relative">
            <div className="absolute inset-0 gradient-coral-blob opacity-30 blur-3xl" />
            <img
              src="/lovable-uploads/ba9e4a95-0439-42d8-8181-e8892fbe2baa.png"
              alt="Analytics Dashboard"
              className="relative rounded-2xl shadow-2xl w-full border border-border/50"
            />
          </div>
        </div>
      </section>

      {/* 10. Integration Ecosystem */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Works on Every E-commerce Platform
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Simple widget integration with all major platforms
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'Custom'].map((platform) => (
              <div key={platform} className="text-2xl font-bold text-muted-foreground/60">
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Pricing Section */}
      <PricingSection 
        title="Pricing That Pays For Itself"
        description="Average customers recover 250% of plan cost in abandoned carts"
      />


      {/* 13. Gradient CTA Banner */}
      <GradientCTABanner />
    </div>
  );
}
