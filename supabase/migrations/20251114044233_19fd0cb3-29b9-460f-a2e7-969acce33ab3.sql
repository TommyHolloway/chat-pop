-- Create shopify_orders table for rich order data storage
CREATE TABLE IF NOT EXISTS shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  order_id text NOT NULL,
  order_number text,
  customer_email text,
  customer_shopify_id text,
  customer_name text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price numeric NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  tags text[],
  note text,
  order_created_at timestamp with time zone NOT NULL,
  attributed_conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  attribution_confidence numeric CHECK (attribution_confidence >= 0 AND attribution_confidence <= 1),
  attribution_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(agent_id, order_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_shopify_orders_agent_id ON shopify_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer_email ON shopify_orders(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created_at ON shopify_orders(order_created_at);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_attribution ON shopify_orders(attributed_conversation_id) WHERE attributed_conversation_id IS NOT NULL;

-- Enable RLS
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopify_orders
CREATE POLICY "Users can view their agent orders"
  ON shopify_orders FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage orders"
  ON shopify_orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create function for atomic metric updates
CREATE OR REPLACE FUNCTION increment_daily_metrics(
  p_agent_id uuid,
  p_date date,
  p_revenue numeric,
  p_orders integer
) RETURNS void AS $$
BEGIN
  INSERT INTO agent_ecommerce_metrics (
    agent_id, 
    date, 
    total_revenue, 
    total_orders, 
    average_order_value
  )
  VALUES (
    p_agent_id, 
    p_date, 
    p_revenue, 
    p_orders, 
    p_revenue / NULLIF(p_orders, 0)
  )
  ON CONFLICT (agent_id, date) DO UPDATE SET
    total_revenue = agent_ecommerce_metrics.total_revenue + p_revenue,
    total_orders = agent_ecommerce_metrics.total_orders + p_orders,
    average_order_value = (agent_ecommerce_metrics.total_revenue + p_revenue) / 
                          NULLIF(agent_ecommerce_metrics.total_orders + p_orders, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for updated_at on shopify_orders
CREATE OR REPLACE FUNCTION update_shopify_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shopify_orders_updated_at_trigger
  BEFORE UPDATE ON shopify_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_orders_updated_at();