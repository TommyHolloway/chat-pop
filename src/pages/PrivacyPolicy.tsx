import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const PrivacyPolicy = () => {
  return (
    <>
      <SEO 
        title="Privacy Policy | ChatPop"
        description="Learn how ChatPop collects, uses, and protects your information. We prioritize your privacy and data security."
        canonical="https://chatpop.ai/privacy"
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
              <Shield className="h-3 w-3 mr-1" />
              Privacy & Security
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-slide-up">
              Privacy{' '}
              <span className="text-gradient-hero">Policy</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            
            <p className="text-sm text-muted-foreground">
              Last updated: August 01, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {privacySections.map((section, index) => (
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

const privacySections = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information that identifies, relates to, describes, or could reasonably be linked to you (\"Personal Information\"). The types of information we collect include:",
      "Account Information: When you create an account, we collect your email address, username, and password. We may also collect optional details like your name or company information.",
      "Usage Data: Automatically collected data such as IP address, browser type, device identifiers, pages viewed, time spent on the Service, and interaction details (e.g., clicks, scrolls).",
      "Content Data: Information you upload or provide, such as text files, documents, URLs for crawling, chat histories, and knowledge bases used to train AI agents.",
      "Payment Information: If you subscribe to paid plans, we collect billing details through our payment processor (Stripe), but we do not store credit card numbers.",
      "Cookies and Similar Technologies: We use cookies for session management, analytics, and preferences. You can manage cookie preferences through your browser settings.",
      "We do not collect sensitive personal information (e.g., race, religion, health data) unless you voluntarily provide it in your content."
    ]
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "We use your information to:",
      "Provide and maintain the Service, including creating, testing, and deploying AI chat agents powered by OpenAI.",
      "Process uploads and generate responses based on your knowledge base.",
      "Improve the Service through analytics and usage patterns.",
      "Communicate with you, such as sending service updates, security alerts, or marketing emails (with opt-out options).",
      "Handle payments, enforce terms, and comply with legal obligations.",
      "For AI processing: Your content is sent to OpenAI for generating responses, but we do not allow them to use it for training their models."
    ]
  },
  {
    title: "3. How We Share Your Information",
    content: [
      "We share information only as necessary:",
      "Service Providers: With vendors like OpenAI (for AI generation), Supabase (for storage and database), and Stripe (for billing), bound by contracts to protect your data.",
      "Legal Requirements: If required by law, subpoena, or to protect rights/safety.",
      "Business Transfers: In mergers, acquisitions, or asset sales, with notice to you.",
      "Aggregated Data: Anonymous, aggregated insights for research or marketing.",
      "We do not sell your Personal Information."
    ]
  },
  {
    title: "4. Data Security",
    content: [
      "We implement reasonable security measures, including encryption in transit and at rest, access controls, and regular audits. However, no system is completely secure, and we cannot guarantee absolute security."
    ]
  },
  {
    title: "5. Your Privacy Rights",
    content: [
      "Depending on your location (e.g., GDPR for EU users, CCPA for California), you may have rights to:",
      "Access, correct, or delete your data.",
      "Opt out of data processing or marketing.",
      "Request data portability.",
      "To exercise rights, email privacy@chatpop.ai. We respond within 30 days (or 45 for CCPA)."
    ]
  },
  {
    title: "6. Cookies and Tracking",
    content: [
      "We use essential cookies for functionality and analytics cookies (e.g., Google Analytics) for improvements. You can opt out via browser settings or our consent banner."
    ]
  },
  {
    title: "7. Children's Privacy",
    content: [
      "The Service is not intended for children under 16. We do not knowingly collect data from minors. If we discover such data, we delete it."
    ]
  },
  {
    title: "8. International Data Transfers",
    content: [
      "Data may be processed in the US or other countries. We use safeguards like standard contractual clauses for transfers."
    ]
  },
  {
    title: "9. Changes to This Policy",
    content: [
      "We may update this policy. Changes are posted here with the updated date. Continued use constitutes acceptance."
    ]
  },
  {
    title: "10. Contact Us",
    content: [
      "For questions, contact privacy@chatpop.ai."
    ]
  }
];