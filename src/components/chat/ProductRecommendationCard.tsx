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
    type?: string;
    vendor?: string;
  };
}

export const ProductRecommendationCard = ({ product }: ProductRecommendationCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        {product.image && (
          <div className="w-full sm:w-32 h-32 flex-shrink-0">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
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
                <span className="text-lg font-bold text-primary">{product.price}</span>
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
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Product
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(product.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
