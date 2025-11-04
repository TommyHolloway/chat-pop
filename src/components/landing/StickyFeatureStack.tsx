import { FeatureShowcaseSection } from './FeatureShowcaseSection';

export const StickyFeatureStack = () => {
  return (
    <div className="relative h-[120vh]">
      {/* Section 1 - Bottom layer (z-10 - lowest) */}
      <FeatureShowcaseSection
        title="AI That Understands Your Products"
        description={[
          "Learns your entire product catalog automatically",
          "Makes intelligent recommendations based on customer behavior",
          "Increases average order value by 40% with smart upsells"
        ]}
        imageSrc="/lovable-uploads/ai-product-understanding.png"
        imageAlt="Product Recommendations"
        imagePosition="right"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-10"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="35%"
      />

      {/* Section 2 - Middle layer (z-20) */}
      <FeatureShowcaseSection
        title="Recover Abandoned Carts Automatically"
        description={[
          "Detects when shoppers are about to leave",
          "Starts conversations at the perfect moment",
          "Addresses concerns and completes the sale"
        ]}
        imageSrc="/lovable-uploads/cart-recovery-bg.png"
        imageAlt="Cart Recovery Chat"
        imagePosition="left"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-20"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="35%"
      />

      {/* Section 3 - Top layer (z-30 - highest) */}
      <FeatureShowcaseSection
        title="Real-Time Shopping Assistance"
        description={[
          "Understands context, product details, and customer intent",
          "Provides instant answers to sizing and compatibility questions",
          "Offers 24/7 shopping assistance"
        ]}
        imageSrc="/lovable-uploads/real-time-shopping-bg.png"
        imageAlt="Real-time Chat"
        imagePosition="right"
        gradient={true}
        isSticky={true}
        stickyTop="top-[20vh]"
        zIndex="z-30"
        imageFullHeight={true}
        imageWidth="40%"
        textWidth="35%"
      />
    </div>
  );
};
