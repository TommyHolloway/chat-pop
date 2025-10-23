-- Phase 3: E-commerce Features Migration
-- Tables for cart tracking, abandoned carts, conversions, and analytics

-- 1. Cart Events Table - Track all cart activity
CREATE TABLE IF NOT EXISTS cart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  product_data JSONB,
  cart_total DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_events_session ON cart_events(session_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_created ON cart_events(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_events_agent ON cart_events(agent_id);

-- 2. Abandoned Carts Table - Track carts for recovery
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cart_items JSONB NOT NULL,
  cart_total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  recovery_attempted BOOLEAN DEFAULT false,
  recovery_message_sent_at TIMESTAMP,
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_agent ON abandoned_carts(agent_id, recovered);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery ON abandoned_carts(recovery_attempted, created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);

-- 3. Agent Conversions Table - Track revenue attribution
CREATE TABLE IF NOT EXISTS agent_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  conversion_type VARCHAR(50) NOT NULL,
  order_id VARCHAR(255),
  order_total DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  products_purchased JSONB,
  attributed_revenue DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_agent ON agent_conversions(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_session ON agent_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversions_conversation ON agent_conversions(conversation_id);

-- 4. Agent E-commerce Metrics Table - Daily metrics summary
CREATE TABLE IF NOT EXISTS agent_ecommerce_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  carts_recovered INTEGER DEFAULT 0,
  recovery_revenue DECIMAL(10,2) DEFAULT 0,
  product_recommendations_shown INTEGER DEFAULT 0,
  products_clicked INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  average_order_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_metrics_agent_date ON agent_ecommerce_metrics(agent_id, date);

-- RLS Policies for cart_events
ALTER TABLE cart_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent cart events"
  ON cart_events FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert cart events"
  ON cart_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for abandoned_carts
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent abandoned carts"
  ON abandoned_carts FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage abandoned carts"
  ON abandoned_carts FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for agent_conversions
ALTER TABLE agent_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent conversions"
  ON agent_conversions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert conversions"
  ON agent_conversions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for agent_ecommerce_metrics
ALTER TABLE agent_ecommerce_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent ecommerce metrics"
  ON agent_ecommerce_metrics FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage ecommerce metrics"
  ON agent_ecommerce_metrics FOR ALL
  USING (true)
  WITH CHECK (true);