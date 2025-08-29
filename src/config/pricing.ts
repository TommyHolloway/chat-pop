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
      "5 training links",
      "Basic chat features",
      "Email support"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline"
  },
  {
    name: "Hobby",
    price: "$35",
    period: "per month",
    description: "Perfect for small teams and growing projects",
    features: [
      "Everything in Free +",
      "2,000 message credits/month",
      "20 training links",
      "2 AI agents",
      "Advanced chat features",
      "Priority support"
    ],
    highlighted: true,
    buttonText: "Get Started",
    buttonVariant: "default"
  },
  {
    name: "Pro",
    price: "$147",
    period: "per month",
    description: "For teams that need more power and flexibility",
    features: [
      "Everything in Hobby +",
      "12,000 message credits/month",
      "Unlimited training links",
      "5 AI agents",
      "Advanced analytics",
      "Custom integrations",
      "Phone support"
    ],
    buttonText: "Get Started",
    buttonVariant: "outline"
  }
];

export const faqItems = [
  {
    question: "What is real estate chatbot architecture?",
    answer: "A simple setup to automate inquiries with OpenAI—upload MLS data, property details, and market insights to create intelligent responses for buyer qualification and lead nurturing."
  },
  {
    question: "How does EccoChat automate real estate inquiries?",
    answer: "Upload your property data and market information for 24/7 lead qualification and automated scheduling. The AI handles initial buyer questions, qualifies prospects, and books viewings automatically."
  },
  {
    question: "Is it secure for real estate data?",
    answer: "Yes, we use enterprise-grade encryption with compliance standards specifically designed for real estate professionals handling sensitive client and property information."
  },
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
    question: "How does billing work?",
    answer: "Billing is monthly and starts immediately when you subscribe. You can upgrade, downgrade, or cancel your subscription at any time."
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