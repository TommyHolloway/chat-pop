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
    description: "Perfect for testing on a single product",
    features: [
      "1 AI shopping assistant",
      "100 conversations/month",
      "Basic product recommendations",
      "10 products searchable",
      "Email support"
    ],
    buttonText: "Start Free",
    buttonVariant: "outline"
  },
  {
    name: "Starter",
    price: "$49",
    period: "per month",
    description: "Perfect for small to medium online stores",
    features: [
      "Everything in Free +",
      "2,000 conversations/month",
      "2 AI assistants (different product lines)",
      "Unlimited product search",
      "Cart abandonment detection",
      "E-commerce analytics",
      "50 cart recovery attempts/month",
      "Shopify integration",
      "Priority email support"
    ],
    highlighted: true,
    buttonText: "Start Growing",
    buttonVariant: "default"
  },
  {
    name: "Growth",
    price: "$199",
    period: "per month",
    description: "For established stores ready to scale",
    features: [
      "Everything in Starter +",
      "10,000 conversations/month",
      "5 AI assistants (multiple stores/brands)",
      "Advanced revenue analytics",
      "Unlimited cart recovery",
      "Custom product recommendation rules",
      "Conversion tracking & attribution",
      "Multiple e-commerce integrations",
      "Priority phone support"
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
    answer: "Absolutely. The AI learns your entire product catalog and makes intelligent recommendations based on customer questions, browsing behavior, and past purchases. It can suggest alternatives, upsells, and complementary items."
  },
  {
    question: "How does cart abandonment recovery work?",
    answer: "Our AI detects when shoppers are about to leave without purchasing and starts a conversation at the perfect moment. It can answer questions, offer assistance, provide discount codes, or help resolve concerns - recovering 30% of abandoned carts on average."
  },
  {
    question: "What's the average ROI for e-commerce stores?",
    answer: "E-commerce stores typically see 200-300% increases in conversion rates within 90 days. The AI converts more browsers into buyers, increases average order value through smart recommendations, and recovers lost sales from cart abandonment."
  },
  {
    question: "Can it handle size/fit questions?",
    answer: "Yes. The AI can answer size and fit questions, provide measurements, suggest sizing based on customer input, and even help with product comparisons. It learns from your product descriptions and specifications."
  },
  {
    question: "What happens after my free trial?",
    answer: "Your free trial includes 100 conversations. After that, choose a paid plan or stay on the free tier. We'll never charge you without permission, and you can cancel anytime. Plus, we offer a 30-day money-back guarantee on paid plans."
  },
  {
    question: "What are conversations?",
    answer: "A conversation is counted each time a shopper interacts with your AI assistant. One visitor session = one conversation, regardless of how many messages are exchanged. This makes pricing predictable and fair."
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