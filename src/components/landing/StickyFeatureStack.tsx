import { FeatureShowcaseSection } from './FeatureShowcaseSection';

export const StickyFeatureStack = () => {
  return (
    <div className="relative">
      {/* Section 1 - Bottom layer (z-30 - highest, appears on top when stacked) */}
      <div className="relative z-30 mb-20">
        <FeatureShowcaseSection
          title="AI That Understands Your Products"
          description="Our AI learns your entire product catalog and makes intelligent recommendations based on customer questions, browsing behavior, and preferences. Increase average order value by 40% with smart upsells and cross-sells."
          imageSrc="/lovable-uploads/baby-clothing-demo.png"
          imageAlt="Product Recommendations"
          imagePosition="right"
          gradient={true}
          isSticky={true}
          stickyTop="top-0"
          stackIntensity="light"
        />
      </div>

      {/* Section 2 - Middle layer (z-20) */}
      <div className="relative z-20 mb-20">
        <FeatureShowcaseSection
          title="Recover 30% of Abandoned Carts Automatically"
          description="Stop losing revenue to cart abandonment. Our AI detects when shoppers are about to leave and starts a conversation at the perfect moment to address concerns, answer questions, and complete the sale."
          imageSrc="/lovable-uploads/6dc6879a-ad3c-479e-b8c4-99b7af2ab3ec.png"
          imageAlt="Cart Recovery Chat"
          imagePosition="left"
          gradient={true}
          isSticky={true}
          stickyTop="top-16"
          stackIntensity="medium"
        />
      </div>

      {/* Section 3 - Top layer (z-10 - lowest, appears at bottom of stack) */}
      <div className="relative z-10">
        <FeatureShowcaseSection
          title="Real-Time Shopping Assistance"
          description="Engage customers with intelligent conversations that understand context, product details, and customer intent. Provide instant answers to questions about sizing, compatibility, shipping, and more."
          imageSrc="/lovable-uploads/3d616246-b965-46e7-ac41-1c080309fd9d.png"
          imageAlt="Real-time Chat"
          imagePosition="right"
          gradient={true}
          isSticky={true}
          stickyTop="top-32"
          stackIntensity="strong"
        />
      </div>
    </div>
  );
};
