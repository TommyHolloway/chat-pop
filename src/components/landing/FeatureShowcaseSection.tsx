import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
interface FeatureShowcaseSectionProps {
  title: string;
  description: string | string[];
  imageSrc: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  gradient?: boolean;
  children?: ReactNode;
  isSticky?: boolean;
  stickyTop?: string;
  zIndex?: string;
  stackIntensity?: 'light' | 'medium' | 'strong';
  imageFullHeight?: boolean;
  imageWidth?: string;
  textWidth?: string;
}
export const FeatureShowcaseSection = ({
  title,
  description,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  gradient = false,
  children,
  isSticky = false,
  stickyTop,
  zIndex,
  stackIntensity,
  imageFullHeight = false,
  imageWidth = '40%',
  textWidth
}: FeatureShowcaseSectionProps) => {
  const intensityStyles = {
    light: 'border-l-4 border-primary/30',
    medium: 'border-l-4 border-primary/50 shadow-primary/5',
    strong: 'border-l-4 border-primary/70 shadow-2xl shadow-primary/10'
  };
  return <section className={`${isSticky ? `sticky ${stickyTop || 'top-0'} ${zIndex || ''} py-6` : 'py-8'} px-4 bg-background ${gradient ? 'gradient-peach-blob' : ''}`}>
      <div className="container mx-auto max-w-6xl overflow-hidden rounded-2xl">
        <Card className={`${imageFullHeight ? 'relative overflow-hidden' : ''} p-6 md:p-8 shadow-xl min-h-[400px] ${isSticky && stackIntensity ? intensityStyles[stackIntensity] : ''}`}>
          {imageFullHeight && imagePosition === 'right' && <div className="hidden md:block absolute right-0 top-0 bottom-0 h-full" style={{
          width: imageWidth
        }}>
              <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover" />
            </div>}
          
          {imageFullHeight && imagePosition === 'left' && <div className="hidden md:block absolute left-0 top-0 bottom-0 h-full" style={{
          width: imageWidth
        }}>
              <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover" />
            </div>}

          <div className={`${imageFullHeight ? '' : 'grid md:grid-cols-2 gap-8 items-center'} ${!imageFullHeight && imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
            {!imageFullHeight && imagePosition === 'left' && <div className="relative max-h-[280px] md:max-h-[320px] overflow-hidden">
                <div className="absolute inset-0 gradient-coral-blob opacity-40 blur-2xl" />
                <img src={imageSrc} alt={imageAlt} className="relative rounded-2xl shadow-2xl w-full h-full object-cover" />
              </div>}
            
            <div className={`${imageFullHeight && imagePosition === 'right' ? 'md:pr-[42%]' : imageFullHeight && imagePosition === 'left' ? 'md:pl-[42%]' : imagePosition === 'left' ? 'md:order-2' : ''} ${textWidth ? `md:max-w-[${textWidth}]` : ''}`}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground px-0 py-0 my-0 mx-[75px]">
                {title}
              </h2>
              {Array.isArray(description) ? <ul className="text-xl text-muted-foreground mb-6 leading-relaxed space-y-3 mx-[75px]">
                  {description.map((item, index) => <li key={index} className="flex items-start">
                      <span className="text-primary mr-3 mt-1">•</span>
                      <span className="mx-[7px]">{item}</span>
                    </li>)}
                </ul> : <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {description}
                </p>}
              {children}
            </div>
            
            {!imageFullHeight && imagePosition === 'right' && <div className="relative max-h-[280px] md:max-h-[320px] overflow-hidden">
                <div className="absolute inset-0 gradient-coral-blob opacity-40 blur-2xl" />
                <img src={imageSrc} alt={imageAlt} className="relative rounded-2xl shadow-2xl w-full h-full object-cover" />
              </div>}
          </div>
        </Card>
      </div>
    </section>;
};