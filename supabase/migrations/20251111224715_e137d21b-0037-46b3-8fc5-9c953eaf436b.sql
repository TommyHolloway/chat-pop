-- Store Shopify billing subscriptions
CREATE TABLE IF NOT EXISTS shopify_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  subscription_id TEXT NOT NULL, -- Shopify's subscription ID (gid://shopify/AppSubscription/...)
  plan_name TEXT NOT NULL, -- 'starter' or 'growth'
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  trial_days INTEGER,
  amount DECIMAL(10,2),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, subscription_id)
);

-- Index for faster queries
CREATE INDEX idx_shopify_subscriptions_agent ON shopify_subscriptions(agent_id);
CREATE INDEX idx_shopify_subscriptions_status ON shopify_subscriptions(status);
CREATE INDEX idx_shopify_subscriptions_shop ON shopify_subscriptions(shop_domain);

-- RLS policies
ALTER TABLE shopify_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Shopify subscriptions"
  ON shopify_subscriptions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON shopify_subscriptions FOR ALL
  USING (auth.role() = 'service_role');