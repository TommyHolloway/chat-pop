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
      "50 customer interactions/month",
      "Basic product recommendations",
      "10 products in catalog",
      "Email support"
    ],
    buttonText: "Start Free",
    buttonVariant: "outline"
  },
  {
    name: "Starter",
    price: "$49",
    period: "per month",
    description: "Recover up to $10K/mo in abandoned carts",
    features: [
      "Everything in Free +",
      "2,000 customer interactions/month",
      "2 AI shopping assistants",
      "Unlimited products in catalog",
      "Cart abandonment recovery (50/mo)",
      "Revenue attribution analytics",
      "Shopify integration",
      "Priority email support"
    ],
    highlighted: true,
    buttonText: "Start Recovering Revenue",
    buttonVariant: "default"
  },
  {
    name: "Growth",
    price: "$199",
    period: "per month",
    description: "Scale to $50K+/mo in recovered revenue",
    features: [
      "Everything in Starter +",
      "10,000 customer interactions/month",
      "5 AI shopping assistants",
      "Cart abandonment recovery (500/mo)",
      "Advanced revenue analytics",
      "Custom product recommendation AI",
      "Conversion tracking & attribution",
      "Multi-store management",
      "Priority email support"
    ],
    buttonText: "Scale Revenue",
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
    question: "What happens after my free trial?",
    answer: "Your free plan includes 50 customer interactions. After that, choose a paid plan or stay on the free tier. We'll never charge you without permission, and you can cancel anytime. Plus, we offer a 30-day money-back guarantee on paid plans."
  },
  {
    question: "What are customer interactions?",
    answer: "A customer interaction is counted each time a shopper engages with your AI assistant. One visitor session = one interaction, regardless of how many messages are exchanged. This makes pricing predictable and fair."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes, you can change your plan at any time. Changes take effect immediately, and billing is prorated. If you're not satisfied, we offer a 30-day money-back guarantee on all paid plans."
  },
  {
    question: "What kind of support do you provide?",
    answer: "Free plans get email support with 48-hour response times. Starter plans get priority email support within 24 hours. Growth plans get priority phone support with same-day responses."
  }
];