import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { PricingSection } from '@/components/PricingSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { faqItems } from '@/config/pricing';

export const Pricing = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Pricing Plans | ChatPop - AI Shopping Assistant for Shopify"
        description="Simple, transparent pricing for ChatPop AI shopping assistant. Free plan available. Starter at $47/mo, Growth at $197/mo, Pro at $347/mo. 7-day free trial."
        canonical="https://chatpop.ai/pricing"
        keywords="shopping assistant pricing, AI shopping assistant plans, Shopify AI pricing, cart recovery pricing, e-commerce automation cost"
      />
      <StructuredData 
        type="BreadcrumbList"
        data={{
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://chatpop.ai"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Pricing",
              item: "https://chatpop.ai/pricing"
            }
          ]
        }}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the perfect plan for your business. All plans include a 7-day free trial with no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => navigate('/auth/signup')}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <PricingSection />

      {/* Features Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Compare Features</h2>
            <p className="text-xl text-muted-foreground">
              See what's included with each plan
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 min-w-[800px]">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-6">Features</h3>
                <div className="space-y-4 text-sm">
                  <div className="py-3">AI Shopping Assistants</div>
                  <div className="py-3">Unique Monthly Visitors</div>
                  <div className="py-3">Products in Catalog</div>
                  <div className="py-3">Cart Recovery/Month</div>
                  <div className="py-3">Revenue Analytics</div>
                  <div className="py-3">Shopify Integration</div>
                  <div className="py-3">Custom AI Recommendations</div>
                  <div className="py-3">Support Level</div>
                </div>
              </div>

              {/* Free Plan */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Free</h3>
                  <p className="text-2xl font-bold">$0</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">1</div>
                  <div className="py-3 flex justify-center">50</div>
                  <div className="py-3 flex justify-center">10</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">Email</div>
                </div>
              </div>

              {/* Starter Plan */}
              <div className="space-y-4 relative">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Starter</h3>
                  <p className="text-2xl font-bold">$47</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">2</div>
                  <div className="py-3 flex justify-center">1,000</div>
                  <div className="py-3 flex justify-center">100</div>
                  <div className="py-3 flex justify-center">50</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">Priority Email</div>
                </div>
              </div>

              {/* Growth Plan */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Growth</h3>
                  <p className="text-2xl font-bold">$197</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">5</div>
                  <div className="py-3 flex justify-center">10,000</div>
                  <div className="py-3 flex justify-center">1,000</div>
                  <div className="py-3 flex justify-center">500</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">Priority Email</div>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Pro</h3>
                  <p className="text-2xl font-bold">$347</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">10</div>
                  <div className="py-3 flex justify-center">50,000</div>
                  <div className="py-3 flex justify-center">5,000</div>
                  <div className="py-3 flex justify-center">2,000</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">Priority Slack + Email</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="text-center p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of businesses using ChatPop to provide instant, intelligent customer support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => navigate('/auth/signup')}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      </div>
    </>
  );
};