import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface FeatureShowcaseSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  gradient?: boolean;
  isSticky?: boolean;
  children?: ReactNode;
}

export const FeatureShowcaseSection = ({
  title,
  description,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  gradient = false,
  isSticky = false,
  children
}: FeatureShowcaseSectionProps) => {
  return (
    <section className={`px-4 relative overflow-hidden bg-background ${isSticky ? 'sticky top-0 py-0' : 'py-8'} ${gradient ? 'gradient-peach-blob' : ''}`}>
      <div className="container mx-auto max-w-6xl">
        <Card className="p-6 md:p-8 shadow-xl min-h-[400px]">
          <div className={`grid md:grid-cols-2 gap-8 items-center ${imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
            {imagePosition === 'left' && (
              <div className="relative max-h-[280px] md:max-h-[320px] overflow-hidden">
                <div className="absolute inset-0 gradient-coral-blob opacity-30 blur-3xl" />
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className={imagePosition === 'left' ? 'md:order-2' : ''}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {title}
              </h2>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {description}
              </p>
              {children}
            </div>
            
            {imagePosition === 'right' && (
              <div className="relative max-h-[280px] md:max-h-[320px] overflow-hidden">
                <div className="absolute inset-0 gradient-coral-blob opacity-30 blur-3xl" />
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};
