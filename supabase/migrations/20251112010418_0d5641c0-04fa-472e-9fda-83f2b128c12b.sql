-- Phase 5: Shopify App Store Distribution Readiness (Fixed)

-- Create shopify_pending_installs table if not exists
CREATE TABLE IF NOT EXISTS public.shopify_pending_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL,
  state TEXT NOT NULL UNIQUE,
  shop_owner_email TEXT,
  shop_owner_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.shopify_pending_installs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Service role can manage pending installs" ON public.shopify_pending_installs;
CREATE POLICY "Service role can manage pending installs"
  ON public.shopify_pending_installs
  FOR ALL
  USING (true);

-- Create gdpr_requests table if not exists
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL,
  request_type TEXT NOT NULL,
  customer_id TEXT,
  customer_email TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Admins can view GDPR requests" ON public.gdpr_requests;
DROP POLICY IF EXISTS "Service role can manage GDPR requests" ON public.gdpr_requests;

CREATE POLICY "Admins can view GDPR requests"
  ON public.gdpr_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage GDPR requests"
  ON public.gdpr_requests
  FOR ALL
  USING (true);

-- Modify shopify_connections
ALTER TABLE public.shopify_connections
  ADD COLUMN IF NOT EXISTS shop_owner_email TEXT,
  ADD COLUMN IF NOT EXISTS shop_owner_name TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add unique constraint safely
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopify_connections_shop_domain_key'
  ) THEN
    ALTER TABLE public.shopify_connections ADD CONSTRAINT shopify_connections_shop_domain_key UNIQUE (shop_domain);
  END IF;
END $$;

-- Add soft delete columns
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- GDPR Functions
CREATE OR REPLACE FUNCTION public.export_customer_data(
  p_shop_domain TEXT,
  p_customer_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'shop_domain', p_shop_domain,
    'customer_email', p_customer_email,
    'conversations', (
      SELECT jsonb_agg(c.*)
      FROM conversations c
      JOIN agents a ON a.id = c.agent_id
      JOIN shopify_connections sc ON sc.agent_id = a.id
      WHERE sc.shop_domain = p_shop_domain
        AND c.deleted_at IS NULL
    ),
    'messages', (
      SELECT jsonb_agg(m.*)
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      JOIN agents a ON a.id = c.agent_id
      JOIN shopify_connections sc ON sc.agent_id = a.id
      WHERE sc.shop_domain = p_shop_domain
        AND m.deleted_at IS NULL
    ),
    'leads', (
      SELECT jsonb_agg(l.*)
      FROM leads l
      JOIN agents a ON a.id = l.agent_id
      JOIN shopify_connections sc ON sc.agent_id = a.id
      WHERE sc.shop_domain = p_shop_domain
        AND l.deleted_at IS NULL
        AND l.lead_data_json->>'email' = p_customer_email
    )
  ) INTO customer_data;
  
  RETURN customer_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.redact_customer_data(
  p_shop_domain TEXT,
  p_customer_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leads
  SET deleted_at = now()
  WHERE agent_id IN (
    SELECT a.id
    FROM agents a
    JOIN shopify_connections sc ON sc.agent_id = a.id
    WHERE sc.shop_domain = p_shop_domain
  )
  AND lead_data_json->>'email' = p_customer_email
  AND deleted_at IS NULL;
  
  PERFORM log_security_event(
    'gdpr_customer_redaction',
    NULL,
    jsonb_build_object(
      'shop_domain', p_shop_domain,
      'customer_email', p_customer_email,
      'redacted_at', now()
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.redact_shop_data(
  p_shop_domain TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shopify_connections
  SET deleted_at = now(), revoked = true
  WHERE shop_domain = p_shop_domain
    AND deleted_at IS NULL;
  
  UPDATE shopify_subscriptions
  SET status = 'cancelled', cancelled_at = now()
  WHERE shop_domain = p_shop_domain
    AND status != 'cancelled';
  
  UPDATE conversations
  SET deleted_at = now()
  WHERE agent_id IN (
    SELECT agent_id FROM shopify_connections WHERE shop_domain = p_shop_domain
  )
  AND deleted_at IS NULL;
  
  UPDATE messages
  SET deleted_at = now()
  WHERE conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN shopify_connections sc ON sc.agent_id = c.agent_id
    WHERE sc.shop_domain = p_shop_domain
  )
  AND deleted_at IS NULL;
  
  UPDATE leads
  SET deleted_at = now()
  WHERE agent_id IN (
    SELECT agent_id FROM shopify_connections WHERE shop_domain = p_shop_domain
  )
  AND deleted_at IS NULL;
  
  PERFORM log_security_event(
    'gdpr_shop_redaction',
    NULL,
    jsonb_build_object(
      'shop_domain', p_shop_domain,
      'redacted_at', now()
    )
  );
END;
$$;