-- Phase 3 Week 1: Enhanced Product Catalog and E-commerce Tables

-- 1. Enhance agent_product_catalog with rich product data
ALTER TABLE agent_product_catalog
ADD COLUMN IF NOT EXISTS product_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS handle text,
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS compare_at_price numeric,
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS available_for_sale boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS inventory_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_tracked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS product_url text,
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS vendor text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

-- Create index for faster product lookups by handle
CREATE INDEX IF NOT EXISTS idx_agent_product_catalog_handle ON agent_product_catalog(handle);
CREATE INDEX IF NOT EXISTS idx_agent_product_catalog_last_synced ON agent_product_catalog(last_synced_at);

-- 2. Create product_recommendations table for tracking AI recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  recommended_at timestamp with time zone DEFAULT now(),
  recommendation_context text,
  clicked boolean DEFAULT false,
  clicked_at timestamp with time zone,
  added_to_cart boolean DEFAULT false,
  purchased boolean DEFAULT false,
  revenue_attributed numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on product_recommendations
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view recommendations for their agents
CREATE POLICY "Users can view their agent recommendations"
ON product_recommendations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = product_recommendations.agent_id
    AND agents.user_id = auth.uid()
  )
);

-- Service role can manage recommendations
CREATE POLICY "Service role can manage recommendations"
ON product_recommendations FOR ALL
USING (auth.role() = 'service_role');

-- Create indexes for product_recommendations
CREATE INDEX IF NOT EXISTS idx_product_recommendations_conversation ON product_recommendations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_agent ON product_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_product ON product_recommendations(product_id);

-- 3. Enhance agent_conversions for attribution tracking
ALTER TABLE agent_conversions
ADD COLUMN IF NOT EXISTS attribution_type text,
ADD COLUMN IF NOT EXISTS attribution_confidence numeric CHECK (attribution_confidence >= 0 AND attribution_confidence <= 1),
ADD COLUMN IF NOT EXISTS conversation_ids uuid[] DEFAULT ARRAY[]::uuid[],
ADD COLUMN IF NOT EXISTS products_recommended jsonb DEFAULT '[]'::jsonb;

-- 4. Enhance abandoned_carts with Shopify checkout URLs and conversation links
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS shopify_checkout_url text,
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS products_mentioned_in_chat jsonb DEFAULT '[]'::jsonb;

-- Create index for faster abandoned cart queries
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_conversation ON abandoned_carts(conversation_id);

-- 5. Enhance agent_ecommerce_metrics for cart recovery analytics
ALTER TABLE agent_ecommerce_metrics
ADD COLUMN IF NOT EXISTS recovery_attempts_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_conversions integer DEFAULT 0;