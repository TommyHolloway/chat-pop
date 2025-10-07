import { useState } from 'react';
import { PricingSection } from '@/components/PricingSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { faqItems } from '@/config/pricing';
import { WaitlistDialog } from '@/components/WaitlistDialog';

export const Pricing = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState('');

  const openWaitlist = (source: string) => {
    setWaitlistSource(source);
    setWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the perfect plan for your business. All plans include a 14-day free trial with no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => openWaitlist('pricing-hero')}>
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <PricingSection showDescription={false} onWaitlistClick={openWaitlist} />

      {/* Features Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Compare Features</h2>
            <p className="text-xl text-muted-foreground">
              See what's included with each plan
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-6">Features</h3>
                <div className="space-y-4 text-sm">
                  <div className="py-3">AI Agents</div>
                  <div className="py-3">Message Credits/Month</div>
                  <div className="py-3">Knowledge Sources per Agent</div>
                  <div className="py-3">Chat Widget</div>
                  <div className="py-3">Analytics Dashboard</div>
                  <div className="py-3">API Access</div>
                  <div className="py-3">Team Collaboration</div>
                  <div className="py-3">Priority Support</div>
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
                  <div className="py-3 flex justify-center">100</div>
                  <div className="py-3 flex justify-center">5</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">Community</div>
                </div>
              </div>

              {/* Hobby Plan */}
              <div className="space-y-4 relative">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Hobby</h3>
                  <p className="text-2xl font-bold">$19</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">5</div>
                  <div className="py-3 flex justify-center">1,000</div>
                  <div className="py-3 flex justify-center">20</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">-</div>
                  <div className="py-3 flex justify-center">Email</div>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Pro</h3>
                  <p className="text-2xl font-bold">$49</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="py-3 flex justify-center">Unlimited</div>
                  <div className="py-3 flex justify-center">10,000</div>
                  <div className="py-3 flex justify-center">Unlimited</div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center"><Check className="h-4 w-4 text-green-500" /></div>
                  <div className="py-3 flex justify-center">Priority</div>
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
                <Button size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => openWaitlist('pricing-cta')}>
                  Join Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <WaitlistDialog 
        open={waitlistOpen} 
        onOpenChange={setWaitlistOpen} 
        source={waitlistSource} 
      />
    </div>
  );
};