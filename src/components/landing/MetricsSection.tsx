const metrics = [
  {
    value: '300%+',
    label: 'Conversion Rate Increase'
  },
  {
    value: '$2M+',
    label: 'Revenue Recovered'
  },
  {
    value: '500+',
    label: 'E-commerce Stores'
  },
  {
    value: '30%',
    label: 'Cart Recovery Rate'
  }
];

export const MetricsSection = () => {
  return (
    <section className="py-20 px-4 bg-card border-y border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {metric.value}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
