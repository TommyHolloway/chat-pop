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
      "1 AI agent (~$1K-5K monthly revenue potential)",
      "100 conversations/month",
      "Train on 5 web pages",
      "Basic visitor engagement",
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
      "2,000 conversations/month (~$20K-100K revenue potential)",
      "Train on 20 web pages",
      "2 AI agents for different sites",
      "Lead capture & appointment booking",
      "Priority email support"
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
      "12,000 conversations/month (~$100K-500K+ revenue potential)",
      "Train on unlimited pages + documents",
      "5 AI agents for multiple sites/brands",
      "Proactive engagement & behavioral triggers",
      "Advanced analytics & conversion tracking",
      "CRM integrations (HubSpot, Salesforce, etc.)",
      "Priority phone & chat support"
    ],
    buttonText: "Get Started",
    buttonVariant: "outline"
  }
];

export const faqItems = [
  {
    question: "How quickly will I see results?",
    answer: "Most customers see measurable improvements within 24-48 hours. The AI starts engaging visitors immediately, and you'll see increased lead capture and conversions in your first week. Full optimization typically happens within 2-4 weeks."
  },
  {
    question: "What if I already have a chatbot?",
    answer: "ChatPop is fundamentally different - we proactively start conversations before visitors leave, while traditional chatbots wait for visitors to ask questions. Many customers run both: ChatPop for proactive engagement and their existing chatbot for FAQs."
  },
  {
    question: "Do I need technical knowledge to set this up?",
    answer: "No. Setup takes 23 minutes on average and requires just copying one line of code. Our AI automatically learns your business from your website content. If you can add Google Analytics to your site, you can add ChatPop."
  },
  {
    question: "How is ChatPop different from other chatbots?",
    answer: "Traditional chatbots are reactive - they wait for visitors to start conversations. ChatPop is proactive - it detects when visitors are about to leave and starts conversations first. This recovers 30% of visitors who would have left your site."
  },
  {
    question: "Can I see real conversion data from other companies?",
    answer: "Yes. Our customers average a 250% increase in conversion rates. Specific results vary by industry: e-commerce sees 200-300% lifts, SaaS sees 150-250% increases in demo bookings, and service businesses see 2-3X more qualified leads."
  },
  {
    question: "What happens after my free trial?",
    answer: "Your free trial includes 100 conversations. After that, choose a paid plan or stay on the free tier. We'll never charge you without permission, and you can cancel anytime with no questions asked. Plus, we offer a 30-day money-back guarantee."
  },
  {
    question: "What are conversations?",
    answer: "A conversation is counted each time a visitor interacts with your AI agent. One visitor session = one conversation, regardless of how many messages are exchanged. This makes pricing predictable and fair."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes, you can change your plan at any time. Changes take effect immediately, and billing is prorated. If you're not satisfied, we offer a 30-day money-back guarantee on all paid plans."
  },
  {
    question: "What kind of support do you provide?",
    answer: "Free plans get email support with 48-hour response times. Hobby plans get priority email support within 24 hours. Pro plans get priority phone and chat support with same-day responses, plus a dedicated success manager."
  }
];