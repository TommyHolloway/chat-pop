-- Create customer_analytics table for CLV tracking
CREATE TABLE IF NOT EXISTS customer_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  shopify_customer_id text NOT NULL,
  email text,
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  average_order_value numeric(10,2) DEFAULT 0,
  first_order_date timestamptz,
  last_order_date timestamptz,
  days_since_last_order integer,
  customer_segment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, shopify_customer_id)
);

-- Create index for performance
CREATE INDEX idx_customer_analytics_agent_id ON customer_analytics(agent_id);
CREATE INDEX idx_customer_analytics_segment ON customer_analytics(agent_id, customer_segment);

-- Enable RLS
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own agent's customer analytics
CREATE POLICY "Users can view their agent customer analytics"
  ON customer_analytics FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Create inventory snapshot cache
CREATE TABLE IF NOT EXISTS inventory_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  inventory_item_id text NOT NULL,
  available integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, variant_id)
);

-- Create index for fast lookups
CREATE INDEX idx_inventory_snapshot_agent_product ON inventory_snapshot(agent_id, product_id);
CREATE INDEX idx_inventory_snapshot_updated ON inventory_snapshot(agent_id, updated_at);

-- Enable RLS
ALTER TABLE inventory_snapshot ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their agent inventory"
  ON inventory_snapshot FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );