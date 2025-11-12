-- Add new columns to profiles table for plan limits
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_visitors_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS products_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS cart_recovery_limit INTEGER DEFAULT 0;

-- Create agent_monthly_visitors tracking table
CREATE TABLE IF NOT EXISTS agent_monthly_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_fingerprint TEXT NOT NULL,
  month DATE NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(agent_id, visitor_fingerprint, month)
);

CREATE INDEX IF NOT EXISTS idx_agent_monthly_visitors_agent_month 
ON agent_monthly_visitors(agent_id, month);

CREATE INDEX IF NOT EXISTS idx_agent_monthly_visitors_month 
ON agent_monthly_visitors(month);

-- Enable RLS on agent_monthly_visitors
ALTER TABLE agent_monthly_visitors ENABLE ROW LEVEL SECURITY;

-- Users can view visitor data for their agents
CREATE POLICY "Users can view their agent visitors"
ON agent_monthly_visitors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_monthly_visitors.agent_id
    AND agents.user_id = auth.uid()
  )
);

-- Service role can manage visitor tracking
CREATE POLICY "Service role can manage visitor tracking"
ON agent_monthly_visitors FOR ALL
USING (auth.role() = 'service_role');

-- Create agent_product_catalog table
CREATE TABLE IF NOT EXISTS agent_product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_sku TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(agent_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_products_agent_active 
ON agent_product_catalog(agent_id, is_active);

-- Enable RLS on agent_product_catalog
ALTER TABLE agent_product_catalog ENABLE ROW LEVEL SECURITY;

-- Users can manage products for their agents
CREATE POLICY "Users can manage their agent products"
ON agent_product_catalog FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_product_catalog.agent_id
    AND agents.user_id = auth.uid()
  )
);

-- Service role can manage product catalog
CREATE POLICY "Service role can manage product catalog"
ON agent_product_catalog FOR ALL
USING (auth.role() = 'service_role');

-- Function to track unique monthly visitor
CREATE OR REPLACE FUNCTION track_unique_monthly_visitor(
  p_agent_id UUID,
  p_visitor_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_user_id UUID;
  v_visitor_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  SELECT a.user_id, p.monthly_visitors_limit
  INTO v_user_id, v_visitor_limit
  FROM agents a
  JOIN profiles p ON p.user_id = a.user_id
  WHERE a.id = p_agent_id;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT COUNT(DISTINCT visitor_fingerprint)
  INTO v_current_count
  FROM agent_monthly_visitors amv
  JOIN agents a ON a.id = amv.agent_id
  WHERE a.user_id = v_user_id
    AND amv.month = v_current_month;
  
  IF NOT EXISTS (
    SELECT 1 FROM agent_monthly_visitors
    WHERE agent_id = p_agent_id
      AND visitor_fingerprint = p_visitor_fingerprint
      AND month = v_current_month
  ) THEN
    IF v_current_count >= v_visitor_limit THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  INSERT INTO agent_monthly_visitors (
    agent_id, 
    visitor_fingerprint, 
    month, 
    session_count,
    last_seen_at
  )
  VALUES (
    p_agent_id, 
    p_visitor_fingerprint, 
    v_current_month, 
    1,
    now()
  )
  ON CONFLICT (agent_id, visitor_fingerprint, month)
  DO UPDATE SET
    session_count = agent_monthly_visitors.session_count + 1,
    last_seen_at = now();
  
  RETURN TRUE;
END;
$$;

-- Function to check visitor limit
CREATE OR REPLACE FUNCTION check_visitor_limit(
  p_user_id UUID
)
RETURNS TABLE(
  can_accept_visitor BOOLEAN,
  current_visitors INTEGER,
  visitor_limit INTEGER,
  plan TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  RETURN QUERY
  SELECT 
    (COALESCE(COUNT(DISTINCT amv.visitor_fingerprint), 0) < p.monthly_visitors_limit) AS can_accept_visitor,
    COALESCE(COUNT(DISTINCT amv.visitor_fingerprint), 0)::INTEGER AS current_visitors,
    p.monthly_visitors_limit AS visitor_limit,
    p.plan AS plan
  FROM profiles p
  LEFT JOIN agents a ON a.user_id = p.user_id
  LEFT JOIN agent_monthly_visitors amv ON amv.agent_id = a.id AND amv.month = v_current_month
  WHERE p.user_id = p_user_id
  GROUP BY p.monthly_visitors_limit, p.plan;
END;
$$;

-- Function to check product limit for a specific agent
CREATE OR REPLACE FUNCTION check_product_limit(
  p_agent_id UUID
)
RETURNS TABLE(
  can_add_product BOOLEAN,
  current_products INTEGER,
  product_limit INTEGER,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (COALESCE(COUNT(apc.id), 0) < p.products_limit OR p.products_limit = -1) AS can_add_product,
    COALESCE(COUNT(apc.id), 0)::INTEGER AS current_products,
    p.products_limit AS product_limit,
    p.plan AS plan
  FROM agents a
  JOIN profiles p ON p.user_id = a.user_id
  LEFT JOIN agent_product_catalog apc ON apc.agent_id = a.id AND apc.is_active = true
  WHERE a.id = p_agent_id
  GROUP BY p.products_limit, p.plan;
END;
$$;

-- Function to get visitor stats for an agent
CREATE OR REPLACE FUNCTION get_agent_visitor_stats(
  p_agent_id UUID
)
RETURNS TABLE(
  current_month_visitors INTEGER,
  visitor_limit INTEGER,
  can_accept_visitors BOOLEAN,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_user_id UUID;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  SELECT user_id INTO v_user_id
  FROM agents
  WHERE id = p_agent_id;
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT amv.visitor_fingerprint), 0)::INTEGER AS current_month_visitors,
    p.monthly_visitors_limit AS visitor_limit,
    (COALESCE(COUNT(DISTINCT amv.visitor_fingerprint), 0) < p.monthly_visitors_limit) AS can_accept_visitors,
    p.plan AS plan
  FROM profiles p
  LEFT JOIN agents a ON a.user_id = p.user_id
  LEFT JOIN agent_monthly_visitors amv ON amv.agent_id = a.id AND amv.month = v_current_month
  WHERE p.user_id = v_user_id
  GROUP BY p.monthly_visitors_limit, p.plan;
END;
$$;

-- Set default limits for existing users based on their current plan
UPDATE profiles SET
  monthly_visitors_limit = CASE 
    WHEN plan IN ('starter', 'hobby') THEN 10000
    WHEN plan IN ('growth', 'standard') THEN 25000
    WHEN plan = 'pro' THEN 50000
    ELSE 100
  END,
  products_limit = CASE
    WHEN plan IN ('starter', 'hobby', 'growth', 'standard', 'pro') THEN -1
    ELSE 100
  END,
  cart_recovery_limit = CASE
    WHEN plan IN ('starter', 'hobby') THEN 100
    WHEN plan IN ('growth', 'standard') THEN 500
    WHEN plan = 'pro' THEN 2000
    ELSE 0
  END
WHERE monthly_visitors_limit IS NULL;

-- Add trigger to update updated_at for product catalog
CREATE OR REPLACE FUNCTION update_product_catalog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_product_catalog_updated_at
BEFORE UPDATE ON agent_product_catalog
FOR EACH ROW
EXECUTE FUNCTION update_product_catalog_updated_at();

-- Data retention: Clean up old visitor data (13 months)
CREATE OR REPLACE FUNCTION cleanup_old_visitor_data_extended()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM agent_monthly_visitors 
  WHERE month < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '13 months')::DATE;
  
  PERFORM log_security_event(
    'visitor_data_cleanup_extended',
    NULL,
    jsonb_build_object(
      'retention_months', 13,
      'cleanup_date', now()
    )
  );
END;
$$;