import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ShoppingCart, User } from 'lucide-react';
import { AttributedOrder } from '@/types/attribution';
import { ConfidenceScoreIndicator } from './ConfidenceScoreIndicator';
import { AttributionTypeBadge } from './AttributionTypeBadge';
import { formatDistanceToNow } from 'date-fns';

interface AttributedOrderCardProps {
  order: AttributedOrder;
  showConversationLink?: boolean;
  compact?: boolean;
}

export const AttributedOrderCard = ({ order, showConversationLink = false, compact = false }: AttributedOrderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Order #{order.order_number}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(order.order_created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(order.total_price, order.currency)}</div>
            </div>
          </div>

          {/* Customer Info */}
          {(order.customer_name || order.customer_email) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{order.customer_name || order.customer_email}</span>
            </div>
          )}

          {/* Attribution Info */}
          <div className="space-y-2">
            <ConfidenceScoreIndicator 
              score={order.attribution_confidence} 
              size="md"
              showPercentage
            />
            <AttributionTypeBadge type={order.attribution_type} />
          </div>

          {/* Line Items */}
          {!compact && order.line_items && order.line_items.length > 0 && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>{order.line_items.length} item(s)</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {order.line_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm border-t pt-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.variant_title && (
                        <div className="text-xs text-muted-foreground">{item.variant_title}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>Qty: {item.quantity}</div>
                      <div className="font-medium">{formatCurrency(item.price, order.currency)}</div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
