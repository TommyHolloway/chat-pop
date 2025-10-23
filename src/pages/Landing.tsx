import { useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Footer } from '@/components/Layout/Footer';
import { HeroWithStoreInput } from '@/components/landing/HeroWithStoreInput';
import { FeatureShowcaseSection } from '@/components/landing/FeatureShowcaseSection';
import { FeatureCardsGrid } from '@/components/landing/FeatureCardsGrid';
import { MetricsSection } from '@/components/landing/MetricsSection';
import { GradientCTABanner } from '@/components/landing/GradientCTABanner';
import { PricingSection } from '@/components/PricingSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqItems } from '@/config/pricing';
import { ChatPopDemo } from '@/components/ChatPopDemo';

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
      <Navbar />
      
      {/* Hero Section with Store Input */}
      <HeroWithStoreInput />

      {/* Interactive Demo */}
      <section id="demo-section" className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            See ChatPop in Action
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Try our AI shopping assistant now - ask about products, get recommendations
          </p>
          <ChatPopDemo />
        </div>
      </section>

      {/* Metrics Section */}
      <MetricsSection />

      {/* Recover Revenue Section */}
      <FeatureShowcaseSection
        title="Recover 30% of Abandoned Carts Automatically"
        description="Stop losing revenue to cart abandonment. Our AI detects when shoppers are about to leave and starts a conversation at the perfect moment to address concerns, answer questions, and complete the sale."
        imageSrc="/lovable-uploads/6dc6879a-ad3c-479e-b8c4-99b7af2ab3ec.png"
        imageAlt="Cart Recovery Chat"
        imagePosition="right"
        gradient={true}
      />

      {/* Feature Cards Grid */}
      <FeatureCardsGrid />

      {/* Analytics Dashboard Showcase */}
      <section className="py-24 px-4 gradient-peach-blob">
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
              className="relative rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* AI Product Recommendations */}
      <FeatureShowcaseSection
        title="AI That Understands Your Products"
        description="Our AI learns your entire product catalog and makes intelligent recommendations based on customer questions, browsing behavior, and preferences. Increase average order value by 40% with smart upsells and cross-sells."
        imageSrc="/lovable-uploads/3d616246-b965-46e7-ac41-1c080309fd9d.png"
        imageAlt="Product Recommendations"
        imagePosition="left"
      />

      {/* Integration Ecosystem */}
      <section className="py-24 px-4 bg-background">
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

      {/* Pricing Section */}
      <PricingSection 
        title="Pricing That Pays For Itself"
        description="Average customers recover 250% of plan cost in abandoned carts"
      />

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Everything you need to know about ChatPop
          </p>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Gradient CTA Banner */}
      <GradientCTABanner />

      <Footer />
    </div>
  );
}
