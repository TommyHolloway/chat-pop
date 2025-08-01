import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';

export const TermsOfService = () => {
  return (
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
              Please read these terms carefully before using EccoChat services.
            </p>
            
            <p className="text-sm text-muted-foreground">
              Last updated: January 1, 2024
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
  );
};

const termsSection = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing and using EccoChat services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
      "These Terms of Service may be updated from time to time. We will notify users of any material changes via email or through our platform."
    ]
  },
  {
    title: "2. Description of Service",
    content: [
      "EccoChat provides AI-powered chatbot creation and deployment services. Our platform allows users to create, customize, and deploy intelligent chatbots for various business purposes.",
      "We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice."
    ]
  },
  {
    title: "3. User Accounts and Registration",
    content: [
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account and password.",
      "You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account."
    ]
  },
  {
    title: "4. Acceptable Use Policy",
    content: [
      "You agree not to use the service for any unlawful purposes or to conduct any unlawful activity, including but not limited to fraud, embezzlement, money laundering or insider trading.",
      "You may not upload, transmit, or distribute any content that is harmful, offensive, obscene, abusive, invasive of privacy, defamatory, hateful or otherwise objectionable.",
      "You may not attempt to gain unauthorized access to our systems or engage in any activity that disrupts or interferes with our services."
    ]
  },
  {
    title: "5. Content and Data",
    content: [
      "You retain ownership of all content you upload to our platform. By uploading content, you grant us a license to process, store, and transmit your content as necessary to provide our services.",
      "We implement appropriate technical and organizational measures to protect your data. However, you acknowledge that no system is completely secure.",
      "You are responsible for ensuring that your content does not violate any third-party rights or applicable laws."
    ]
  },
  {
    title: "6. Payment and Billing",
    content: [
      "Paid services are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly stated in these terms.",
      "We reserve the right to change our pricing at any time. We will provide notice of pricing changes at least 30 days in advance.",
      "Failure to pay fees may result in suspension or termination of your account."
    ]
  },
  {
    title: "7. Intellectual Property",
    content: [
      "The EccoChat platform and all related technology are the intellectual property of EccoChat and are protected by copyright, trademark, and other laws.",
      "You may not copy, modify, distribute, or reverse engineer any part of our platform without written permission."
    ]
  },
  {
    title: "8. Limitation of Liability",
    content: [
      "EccoChat shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.",
      "Our total liability shall not exceed the amount you paid to us in the twelve months preceding the claim."
    ]
  },
  {
    title: "9. Termination",
    content: [
      "Either party may terminate this agreement at any time. Upon termination, your access to the service will cease immediately.",
      "We may terminate your account if you violate these terms or engage in behavior that we deem inappropriate or harmful to our service or other users."
    ]
  },
  {
    title: "10. Governing Law",
    content: [
      "These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which EccoChat is incorporated.",
      "Any disputes arising from these terms shall be resolved through binding arbitration in accordance with the rules of the applicable arbitration association."
    ]
  },
  {
    title: "11. Contact Information",
    content: [
      "If you have any questions about these Terms of Service, please contact us at:",
      "Email: legal@eccochat.com",
      "Address: [Company Address]"
    ]
  }
];