export interface AttributedOrder {
  id: string;
  order_id: string;
  order_number: string;
  customer_email?: string;
  customer_name?: string;
  total_price: number;
  currency: string;
  line_items: LineItem[];
  attribution_confidence: number;
  attribution_type: string;
  attributed_conversation_id?: string;
  order_created_at: string;
  created_at: string;
}

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variant_title?: string;
  product_id?: string;
  sku?: string;
}

export interface ConversionAttribution {
  id: string;
  agent_id: string;
  order_id: string;
  order_total: number;
  attributed_revenue: number;
  attribution_confidence: number;
  attribution_type: string;
  conversation_id?: string;
  conversation_ids: string[];
  products_recommended: ProductReference[];
  products_purchased: ProductReference[];
  session_id: string;
  created_at: string;
}

export interface ProductReference {
  product_id: string;
  title: string;
  quantity?: number;
  price?: number;
}

export interface AttributionMetrics {
  totalRevenue: number;
  attributedRevenue: number;
  attributionRate: number;
  avgConfidence: number;
  orderCount: number;
  attributedOrderCount: number;
  attributionBreakdown: Record<string, number>;
  confidenceDistribution: {
    high: number; // 0.8-1.0
    medium: number; // 0.5-0.79
    low: number; // 0-0.49
  };
}

export interface ConversationRevenue {
  conversation_id: string;
  session_id: string;
  order_count: number;
  total_revenue: number;
  avg_confidence: number;
  orders: AttributedOrder[];
}
