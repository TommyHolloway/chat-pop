import { FeatureShowcaseSection } from './FeatureShowcaseSection';

export const StickyFeatureStack = () => {
  return (
    <div className="relative h-[200vh]">
      {/* Section 1 - Bottom layer (z-10 - lowest) */}
      <FeatureShowcaseSection
        title="AI That Understands Your Products"
        description="Our AI learns your entire product catalog and makes intelligent recommendations based on customer questions, browsing behavior, and preferences. Increase average order value by 40% with smart upsells and cross-sells."
        imageSrc="/lovable-uploads/ai-product-understanding.png"
        imageAlt="Product Recommendations"
        imagePosition="right"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-10"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="40%"
      />

      {/* Section 2 - Middle layer (z-20) */}
      <FeatureShowcaseSection
        title="Recover 30% of Abandoned Carts Automatically"
        description="Stop losing revenue to cart abandonment. Our AI detects when shoppers are about to leave and starts a conversation at the perfect moment to address concerns, answer questions, and complete the sale."
        imageSrc="/lovable-uploads/cart-recovery-bg.png"
        imageAlt="Cart Recovery Chat"
        imagePosition="left"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-20"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="40%"
      />

      {/* Section 3 - Top layer (z-30 - highest) */}
      <FeatureShowcaseSection
        title="Real-Time Shopping Assistance"
        description="Engage customers with intelligent conversations that understand context, product details, and customer intent. Provide instant answers to questions about sizing, compatibility, shipping, and more."
        imageSrc="/lovable-uploads/real-time-shopping-bg.png"
        imageAlt="Real-time Chat"
        imagePosition="right"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-30"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="40%"
      />
    </div>
  );
};
