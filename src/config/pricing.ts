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
    description: "Test the power of AI for your store",
    features: [
      "1 AI shopping assistant",
      "100 unique monthly visitors",
      "Up to 100 products",
      "Basic product recommendations",
      "Self-serve onboarding",
      "Email support (48hr response)"
    ],
    buttonText: "Start Free",
    buttonVariant: "outline"
  },
  {
    name: "Starter",
    price: "$47",
    period: "per month",
    description: "Recover up to $10K/mo in abandoned carts",
    features: [
      "Everything in Free +",
      "Up to 10,000 unique monthly visitors",
      "Up to 1,000 products",
      "2 AI shopping assistants",
      "Cart abandonment recovery (100/mo)",
      "Proactive engagement triggers",
      "AI training & product recommendations",
      "Priority email support (24hr response)",
      "7-day free trial"
    ],
    highlighted: true,
    buttonText: "Start Recovering Revenue",
    buttonVariant: "default"
  },
  {
    name: "Growth",
    price: "$197",
    period: "per month",
    description: "Scale to $50K+/mo in recovered revenue",
    features: [
      "Everything in Starter +",
      "Up to 25,000 unique monthly visitors",
      "Up to 3,000 products",
      "5 AI shopping assistants",
      "Cart abandonment recovery (500/mo)",
      "Proactive engagement triggers",
      "Custom branding (remove ChatPop branding)",
      "Revenue attribution analytics",
      "Priority Slack + Email support",
      "7-day free trial"
    ],
    buttonText: "Scale Revenue",
    buttonVariant: "outline"
  },
  {
    name: "Pro",
    price: "$347",
    period: "per month",
    description: "Enterprise-level features and support",
    features: [
      "Everything in Growth +",
      "Up to 50,000 unique monthly visitors",
      "Up to 5,000 products",
      "10 AI shopping assistants",
      "Cart abandonment recovery (2,000/mo)",
      "Proactive engagement triggers",
      "Custom branding",
      "Advanced revenue analytics",
      "Priority Slack + Email support",
      "Advanced A/B testing (Coming Soon)",
      "Custom integrations (Coming Soon)",
      "7-day free trial"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline"
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