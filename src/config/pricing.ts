export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline";
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "1 AI agent",
      "100 message credits/month",
      "5 knowledge sources per agent",
      "Basic chat widget",
      "Community support"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline"
  },
  {
    name: "Hobby",
    price: "$19",
    period: "per month",
    description: "Great for small businesses",
    features: [
      "5 AI agents",
      "1,000 message credits/month",
      "20 knowledge sources per agent",
      "Custom chat widget",
      "Email support",
      "Analytics dashboard"
    ],
    highlighted: true,
    buttonText: "Start Free Trial",
    buttonVariant: "default"
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing teams",
    features: [
      "Unlimited AI agents",
      "10,000 message credits/month",
      "Unlimited knowledge sources",
      "Advanced customization",
      "Priority support",
      "API access",
      "Team collaboration"
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline"
  }
];

export const faqItems = [
  {
    question: "What are message credits?",
    answer: "Message credits are used each time your AI agent responds to a user. Each response consumes one credit, regardless of length."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes, you can change your plan at any time. Changes take effect immediately, and billing is prorated."
  },
  {
    question: "What types of files can I upload?",
    answer: "You can upload PDF, DOCX, TXT, and Markdown files. Each file is processed to extract knowledge for your AI agent."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start."
  },
  {
    question: "How does the chat widget work?",
    answer: "You get an embeddable chat widget that you can add to any website. It's fully customizable to match your brand."
  },
  {
    question: "What kind of support do you provide?",
    answer: "Free plans get community support, Hobby gets email support, and Pro gets priority support with faster response times."
  }
];