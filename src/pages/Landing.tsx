import { SEO } from '@/components/SEO';
import { HeroWithStoreInput } from '@/components/landing/HeroWithStoreInput';
import { LargeProductMockup } from '@/components/landing/LargeProductMockup';
import { FeatureShowcaseSection } from '@/components/landing/FeatureShowcaseSection';
import { FeatureCardsGrid } from '@/components/landing/FeatureCardsGrid';
import { GradientCTABanner } from '@/components/landing/GradientCTABanner';
import { PricingSection } from '@/components/PricingSection';
import { InteractiveTriggerDemo } from '@/components/landing/InteractiveTriggerDemo';
import { StickyFeatureStack } from '@/components/landing/StickyFeatureStack';

export default function Landing() {
  return (
    <>
      <SEO 
        title="ChatPop - AI Chatbots for Business | Automate Customer Support 24/7"
        description="Create intelligent AI chatbots in minutes. Upload your knowledge, train your bot, and deploy anywhere. Perfect for customer support, lead generation, and more."
        canonical="https://chatpop.ai"
        keywords="AI chatbot, customer support automation, chatbot builder, AI assistant, business automation, lead generation bot"
      />
      <div className="min-h-screen bg-background">
      {/* 1. Hero Section with Store Input */}
      <HeroWithStoreInput />

      {/* 2. Interactive Trigger Demo */}
      <InteractiveTriggerDemo />

      {/* Header for Feature Sections */}
      <section className="py-12 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="font-alice text-4xl md:text-5xl text-foreground mb-4">
            Innovative AI solutions that helps
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-coral-light mx-auto rounded-full" />
        </div>
      </section>

      {/* 3-5. Sticky Layered Feature Sections */}
      <StickyFeatureStack />


      {/* 8. Analytics Dashboard Showcase */}
      <section className="py-20 px-4 gradient-peach-blob">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="font-alice text-4xl md:text-5xl mb-6 text-foreground">
            Track Every Dollar Your AI Recovers
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Full revenue attribution, conversion tracking, and real-time analytics
          </p>
          <div className="relative">
            <div className="absolute inset-0 gradient-coral-blob opacity-30 blur-3xl" />
          <img
            src="/lovable-uploads/chatpop-laptop-hero.png"
            alt="Analytics Dashboard"
            className="relative rounded-2xl shadow-2xl w-full border border-border/50 object-cover"
          />
          </div>
        </div>
      </section>

      {/* 10. Integration Ecosystem */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="font-alice text-4xl md:text-5xl mb-4 text-foreground">
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
    </>
  );
}
