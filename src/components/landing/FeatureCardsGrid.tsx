import { ShoppingBag, Target, MessageSquare, TrendingUp, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: ShoppingBag,
    title: 'Smart Product Recommendations',
    description: 'AI learns your catalog and suggests perfect products based on customer preferences and behavior',
    metric: 'Increase AOV by 40%'
  },
  {
    icon: Target,
    title: 'Cart Abandonment Recovery',
    description: 'Automatically engage shoppers at the perfect moment to address concerns and complete purchases',
    metric: 'Recover 30% of lost sales'
  },
  {
    icon: MessageSquare,
    title: '24/7 Shopping Assistant',
    description: 'Answer questions, provide sizing help, and guide customers through their shopping journey',
    metric: 'Never miss a sale again'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Attribution',
    description: 'Track every dollar your AI assistant recovers and see real-time ROI for your investment',
    metric: 'Full transparency'
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Simple widget integration with Shopify, WooCommerce, and custom stores in under 5 minutes',
    metric: 'Live in minutes'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Understand customer behavior, conversion patterns, and opportunities to optimize your store',
    metric: 'Data-driven growth'
  }
];

export const FeatureCardsGrid = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Innovative AI Solutions That Drive Sales
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features that turn browsers into buyers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              <div className="text-sm font-semibold text-primary">
                {feature.metric}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
