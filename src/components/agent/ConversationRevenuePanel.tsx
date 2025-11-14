import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { AttributedOrderCard } from './AttributedOrderCard';
import { useAttributedOrders } from '@/hooks/useAttributedOrders';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ConversationRevenuePanelProps {
  conversationId: string;
  agentId: string;
}

export const ConversationRevenuePanel = ({ conversationId, agentId }: ConversationRevenuePanelProps) => {
  const { orders, loading } = useAttributedOrders(conversationId);
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
  const avgConfidence = orders.length > 0
    ? orders.reduce((sum, order) => sum + order.attribution_confidence, 0) / orders.length
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Impact
          </CardTitle>
          <CardDescription>
            No attributed orders for this conversation yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Impact
        </CardTitle>
        <CardDescription>
          Orders attributed to this conversation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Revenue</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Orders</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{Math.round(avgConfidence * 100)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Confidence</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Attributed Orders
          </div>
          {orders.map(order => (
            <AttributedOrderCard key={order.id} order={order} compact />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
