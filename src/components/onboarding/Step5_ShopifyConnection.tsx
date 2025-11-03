import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, ArrowRight, X, Package, TrendingUp, Users, Tag, AlertCircle, Clock } from 'lucide-react';
import { ShopifyConnectionDialog } from '@/components/ShopifyConnectionDialog';

interface Step5Props {
  agentId: string;
  onNext: () => void;
  onSkip: () => void;
}

export const Step5_ShopifyConnection = ({ agentId, onNext, onSkip }: Step5Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Connect Your Shopify Store</h1>
        <p className="text-muted-foreground text-lg">
          Unlock advanced e-commerce features like product recommendations, cart recovery, and real-time inventory sync.
        </p>
      </div>
      
      <Card className="border-2">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Product Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  AI suggests products with real-time pricing, stock levels, and active promotions
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-Time Inventory Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Show live stock levels and trigger urgency for low-stock items
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Abandoned Cart Recovery</h3>
                <p className="text-sm text-muted-foreground">
                  Detect and recover abandoned carts with smart timing and messaging
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Revenue & Order Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track conversions, revenue, and compare performance over time
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Customer Lifetime Value</h3>
                <p className="text-sm text-muted-foreground">
                  Identify VIP customers and target win-back campaigns for lapsed buyers
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Active Promotions</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically mention current discounts and special offers in chat
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <AlertCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Cart Recovery</h3>
                <p className="text-sm text-muted-foreground">
                  Avoid duplicate recovery messages by checking completed orders
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Historical Data Import</h3>
                <p className="text-sm text-muted-foreground">
                  Import past orders to get instant analytics and insights
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex-1"
              size="lg"
            >
              Connect Shopify Store
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={onSkip}
              size="lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            You can always connect your Shopify store later from the agent settings
          </p>
        </CardContent>
      </Card>
      
      <ShopifyConnectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agentId={agentId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
