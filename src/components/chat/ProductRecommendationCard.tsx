import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingCart } from 'lucide-react';

interface ProductRecommendationCardProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: string;
    currency: string;
    image?: string;
    url: string;
    available: boolean;
    stock_level?: number;
    low_stock?: boolean;
    type?: string;
    vendor?: string;
  };
}

export const ProductRecommendationCard = ({ product }: ProductRecommendationCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        {product.image && (
          <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-muted relative">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            
            {product.low_stock && product.available && (
              <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                Only {product.stock_level} left!
              </Badge>
            )}
            
            {!product.available && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge variant="secondary">Out of Stock</Badge>
              </div>
            )}
          </div>
        )}
        <CardContent className="flex-1 p-4">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h4 className="font-semibold text-foreground mb-1">{product.title}</h4>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: product.currency || 'USD',
                  }).format(parseFloat(product.price))}
                </span>
                {product.available ? (
                  <Badge variant="default" className="text-xs">In Stock</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                )}
              </div>
              {product.type && (
                <p className="text-xs text-muted-foreground">
                  {product.type} {product.vendor && `• ${product.vendor}`}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                onClick={() => window.open(product.url, '_blank')}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Product
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
