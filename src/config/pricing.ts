export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline";
  includesPreviousPlan?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for testing the waters",
    features: [
      "1 AI shopping assistant",
      "50 unique monthly visitors",
      "10 products",
      "Basic analytics",
      "Email support"
    ],
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "outline"
  },
  {
    name: "Starter",
    price: "$47",
    period: "month",
    description: "For growing online stores",
    features: [
      "Upgrade to 2 AI assistants & 1,000 visitors",
      "100 products & 50 cart recovery/month",
      "Revenue analytics",
      "Shopify integration",
      "Priority email support"
    ],
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "outline",
    includesPreviousPlan: "Free"
  },
  {
    name: "Growth",
    price: "$197",
    period: "month",
    description: "For scaling businesses",
    features: [
      "Upgrade to 5 AI assistants & 10,000 visitors",
      "1,000 products & 500 cart recovery/month",
      "Advanced analytics",
      "Custom AI recommendations",
      "Dedicated account manager"
    ],
    highlighted: true,
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "default",
    includesPreviousPlan: "Starter"
  },
  {
    name: "Pro",
    price: "$347",
    period: "month",
    description: "For enterprise-level stores",
    features: [
      "Upgrade to 10 AI assistants & 50,000 visitors",
      "5,000 products & 2,000 cart recovery/month",
      "Advanced analytics & reporting",
      "Priority Slack + Email support",
      "Custom integrations"
    ],
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "outline",
    includesPreviousPlan: "Growth"
  }
];

export const faqItems = [
  {
    question: "Does it work with Shopify/WooCommerce/BigCommerce?",
    answer: "Yes! Our AI shopping assistants integrate seamlessly with Shopify, WooCommerce, BigCommerce, and custom e-commerce platforms. Setup takes minutes with our simple widget integration."
  },
  {
    question: "Can it recommend products from my catalog?",
    answer: "Absolutely. The AI learns your entire product catalog and makes intelligent recommendations based on customer questions, browsing behavior, and preferences. It can suggest alternatives, upsells, and complementary items."
  },
  {
    question: "How does cart abandonment recovery work?",
    answer: "Our AI detects when shoppers are about to leave without purchasing and starts a conversation at the perfect moment. It can answer questions, offer assistance, provide discount codes, or help resolve concerns - recovering 30% of abandoned carts on average."
  },
  {
    question: "What ROI can I expect for my e-commerce store?",
    answer: "E-commerce stores typically see their AI shopping assistant pay for itself within 30 days. Average stores recover $5-15K per month in abandoned carts, plus 25-40% increases in average order value through smart product recommendations."
  },
  {
    question: "Can it handle size/fit questions?",
    answer: "Yes. The AI can answer size and fit questions, provide measurements, suggest sizing based on customer input, and even help with product comparisons. It learns from your product descriptions and specifications."
  },
  {
    question: "What are unique monthly visitors?",
    answer: "A unique monthly visitor is counted once per month when someone visits your website and interacts with your AI assistant. Even if the same person returns multiple times, they only count as one unique visitor for that month. This makes pricing predictable and fair."
  },
  {
    question: "What happens when I reach my visitor limit?",
    answer: "When you approach your monthly visitor limit, we'll send you a notification. Once you reach the limit, new visitors will see a friendly message encouraging them to contact you directly. You can upgrade your plan anytime to continue serving customers without interruption."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes, you can change your plan at any time. Changes take effect immediately, and billing is prorated. If you're not satisfied, we offer a 30-day money-back guarantee on all paid plans."
  },
  {
    question: "What kind of support do you provide?",
    answer: "Free plans get email support with 48-hour response times. Starter plans get priority email support within 24 hours. Growth and Pro plans get priority Slack support with same-day responses plus email support."
  },
  {
    question: "Do existing customers keep unlimited products?",
    answer: "Yes! Existing customers are grandfathered with unlimited products on their current plan. New product limits only apply to customers who sign up after the pricing update."
  }
];