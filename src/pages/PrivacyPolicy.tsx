import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export const PrivacyPolicy = () => {
  return (
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
              Last updated: January 1, 2024
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
  );
};

const privacySections = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information you provide directly to us, such as when you create an account, upload content, or contact us for support. This may include your name, email address, and any content you choose to upload to our platform.",
      "We automatically collect certain information about your device and how you interact with our services, including your IP address, browser type, operating system, and usage patterns.",
      "If you choose to integrate with third-party services, we may collect information from those services in accordance with their privacy policies and your authorization."
    ]
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "We use the information we collect to provide, maintain, and improve our services, including processing your content to train and deploy your chatbots.",
      "We may use your information to communicate with you about your account, provide customer support, and send you important service updates.",
      "We use aggregated and anonymized data to analyze usage patterns and improve our platform. This data cannot be used to identify individual users."
    ]
  },
  {
    title: "3. Information Sharing",
    content: [
      "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.",
      "We may share your information with trusted service providers who assist us in operating our platform, provided they agree to protect your information.",
      "We may disclose your information if required by law or if we believe disclosure is necessary to protect our rights, property, or safety, or that of our users."
    ]
  },
  {
    title: "4. Data Security",
    content: [
      "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
      "All data transmission is encrypted using industry-standard SSL/TLS protocols. We store your data in secure, access-controlled environments.",
      "While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security."
    ]
  },
  {
    title: "5. Data Retention",
    content: [
      "We retain your personal information for as long as your account is active or as needed to provide you services.",
      "If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal purposes.",
      "Aggregated and anonymized data may be retained indefinitely for analytical purposes."
    ]
  },
  {
    title: "6. Your Rights",
    content: [
      "You have the right to access, update, or delete your personal information at any time through your account settings.",
      "You may request a copy of your personal data or ask us to transfer it to another service (data portability).",
      "You can opt out of marketing communications at any time by following the unsubscribe links in our emails or contacting us directly."
    ]
  },
  {
    title: "7. Cookies and Tracking",
    content: [
      "We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.",
      "You can control cookie settings through your browser preferences. However, disabling cookies may affect the functionality of our services.",
      "We do not track users across third-party websites or services."
    ]
  },
  {
    title: "8. International Data Transfers",
    content: [
      "Your information may be transferred to and processed in countries other than your own, including the United States.",
      "We ensure that any international transfers comply with applicable data protection laws and provide adequate safeguards for your information.",
      "By using our services, you consent to the transfer of your information as described in this policy."
    ]
  },
  {
    title: "9. Children's Privacy",
    content: [
      "Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.",
      "If we learn that we have collected personal information from a child under 13, we will delete that information as quickly as possible.",
      "If you believe we have collected information from a child under 13, please contact us immediately."
    ]
  },
  {
    title: "10. Changes to This Policy",
    content: [
      "We may update this privacy policy from time to time. We will notify you of any material changes by email or through our platform.",
      "Your continued use of our services after any changes indicates your acceptance of the updated policy.",
      "We encourage you to review this policy periodically to stay informed about how we protect your information."
    ]
  },
  {
    title: "11. Contact Us",
    content: [
      "If you have any questions about this Privacy Policy or our data practices, please contact us at:",
      "Email: privacy@eccochat.com",
      "Address: [Company Address]",
      "We will respond to your inquiry within 30 days."
    ]
  }
];