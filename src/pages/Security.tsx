import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const securitySections = [
  {
    title: "Our Commitment to Security",
    content: [
      "We employ industry-leading practices to safeguard your information throughout the agent creation, testing, and deployment process. Security is built into every layer of EccoChat, from data ingestion to AI-powered responses via OpenAI.",
      "We regularly audit our systems and update protocols to address emerging risks, ensuring your chat agents operate securely without compromising speed or usability."
    ]
  },
  {
    title: "Data Protection Measures",
    content: [
      "Encryption: All data in transit (e.g., file uploads, chat interactions) is encrypted using TLS 1.3, and data at rest (in Supabase storage) uses AES-256 encryption. Knowledge bases and chat histories are protected against unauthorized access.",
      "Access Controls: Role-based access control (RBAC) ensures only authorized users (e.g., admins) can view or edit sensitive data. Row-level security (RLS) in our database isolates user-owned agents and content.",
      "Secure AI Processing: When using OpenAI for responses, we transmit only necessary context (via chunking and filtering for efficiency) and ensure no user data is used for model training. All API calls occur through secure edge functions.",
      "File and Knowledge Security: Uploaded files (.txt, .md, .pdf, .docx) and crawled URLs are processed in isolated environments, with automatic malware scanning and storage limits enforced per plan to prevent abuse.",
      "Monitoring and Logging: Real-time activity logs track access and changes, with anomaly detection for suspicious behavior (e.g., unusual login attempts)."
    ]
  },
  {
    title: "Compliance and Standards",
    content: [
      "EccoChat complies with key regulations to protect your business:",
      "GDPR and CCPA: We support data subject rights (access, deletion, portability) and maintain data processing agreements for EU/US users.",
      "AI-Specific Safeguards: Following emerging guidelines (e.g., EU AI Act principles), our agents include escalation for complex queries and transparency in AI-generated responses.",
      "Payment Security: Billing via Stripe is PCI DSS compliant—we never store credit card details.",
      "Regular Audits: Third-party penetration testing and internal reviews ensure ongoing compliance."
    ]
  },
  {
    title: "User Controls and Best Practices",
    content: [
      "Account Security: Enable two-factor authentication (2FA) and use strong passwords. We support Google sign-in for added convenience.",
      "Data Management: You control your knowledge bases—delete or export anytime. Agents auto-delete after inactivity on free plans to minimize storage risks.",
      "Incident Response: In case of breaches, we notify affected users within 72 hours and provide mitigation steps, per legal requirements."
    ]
  },
  {
    title: "Questions or Concerns?",
    content: [
      "If you have security questions or need to report an issue, contact us at security@eccochat.com. We're committed to transparency—view our Privacy Policy for more on data handling.",
      "EccoChat: Secure AI chat agents for real estate pros—protect your data while automating efficiently."
    ]
  }
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Shield className="mr-2 h-4 w-4" />
            Security & Protection
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            EccoChat Security
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            At EccoChat, we prioritize the security and privacy of your data above all else. 
            As a SaaS platform empowering real estate professionals to build AI chat agents, 
            we understand the sensitivity of client information, property details, and business 
            knowledge you entrust to us.
          </p>
        </div>
      </section>

      {/* Security Content Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {securitySections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}