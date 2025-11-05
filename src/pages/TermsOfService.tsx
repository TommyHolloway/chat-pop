import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const TermsOfService = () => {
  return (
    <>
      <SEO 
        title="Terms of Service | ChatPop"
        description="Read ChatPop's terms of service. By using our AI chatbot platform, you agree to these terms and conditions."
        canonical="https://chatpop.ai/terms"
      />
      <Helmet>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 animate-fade-in">
              <ScrollText className="h-3 w-3 mr-1" />
              Legal Information
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-slide-up">
              Terms of{' '}
              <span className="text-gradient-hero">Service</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Please read these terms carefully before using ChatPop services.
            </p>
            
            <p className="text-sm text-muted-foreground">
              Last updated: August 01, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {termsSection.map((section, index) => (
              <Card key={index} className="shadow-soft bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray max-w-none dark:prose-invert">
                  <div className="space-y-4">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

const termsSection = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "You must be 18 or older to use the Service. By creating an account, you represent that you meet this requirement and agree to these Terms."
    ]
  },
  {
    title: "2. Account Registration and Responsibilities",
    content: [
      "You must provide accurate information during registration and keep your account secure.",
      "You are responsible for all activity on your account.",
      "Prohibited uses: Uploading illegal/harmful content, reverse-engineering the Service, or violating laws."
    ]
  },
  {
    title: "3. Service Description",
    content: [
      "The Service allows you to create, test, and deploy AI chat agents using OpenAI. It is provided \"as is\" and may include beta features with limitations."
    ]
  },
  {
    title: "4. Intellectual Property",
    content: [
      "We own all rights to the Service and its IP.",
      "You own your content (e.g., knowledge bases) but grant us a license to process it for the Service (e.g., sending to OpenAI).",
      "Do not infringe third-party IP."
    ]
  },
  {
    title: "5. Payments and Subscriptions",
    content: [
      "Plans: Free (limited), Hobby ($35/month), Pro ($147/month). All include 14-day trial.",
      "Billing via Stripe; auto-renews monthly. No refunds after trial.",
      "We may change pricing with notice.",
      "Termination: We can suspend for non-payment or violations; you lose access to data upon termination."
    ]
  },
  {
    title: "6. Usage Limits and Restrictions",
    content: [
      "Adhere to plan limits (e.g., message credits, agents).",
      "No abuse: Overloading servers, spamming, or using for illegal purposes.",
      "We monitor usage and may throttle excessive activity."
    ]
  },
  {
    title: "7. Warranties and Disclaimers",
    content: [
      "The Service is provided \"as is\" without warranties. AI responses may be inaccurate; use at your risk.",
      "We disclaim liability for data loss, interruptions, or third-party actions (e.g., OpenAI downtime)."
    ]
  },
  {
    title: "8. Limitation of Liability",
    content: [
      "Our liability is limited to fees paid in the last 12 months.",
      "No indirect, consequential, or punitive damages."
    ]
  },
  {
    title: "9. Indemnification",
    content: [
      "You agree to indemnify us against claims arising from your content or misuse of the Service."
    ]
  },
  {
    title: "10. Termination",
    content: [
      "You can cancel anytime.",
      "We can terminate for violations, with or without notice.",
      "Upon termination, data may be deleted after 30 days."
    ]
  },
  {
    title: "11. Governing Law and Disputes",
    content: [
      "Governed by [Your State/Country] laws.",
      "Disputes resolved through arbitration in [Your Location]; no class actions."
    ]
  },
  {
    title: "12. Changes to Terms",
    content: [
      "We may update Terms. Continued use constitutes acceptance."
    ]
  },
  {
    title: "13. Miscellaneous",
    content: [
      "Severability: Invalid provisions don't affect others.",
      "Entire Agreement: These Terms supersede prior agreements.",
      "For questions, contact support@chatpop.ai."
    ]
  }
];