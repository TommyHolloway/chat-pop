-- Shopify OAuth Migration: Replace manual token paste with OAuth flow

-- 1. New table: shopify_connections (replaces agents.shopify_config)
CREATE TABLE IF NOT EXISTS public.shopify_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  shop_domain text NOT NULL,
  encrypted_access_token text NOT NULL,
  granted_scopes text[] DEFAULT '{}',
  connected_at timestamptz DEFAULT now(),
  last_verified timestamptz DEFAULT now(),
  revoked boolean DEFAULT false,
  
  -- Unique constraint: one connection per agent
  CONSTRAINT unique_agent_shopify UNIQUE (agent_id)
);

CREATE INDEX idx_shopify_connections_agent_id ON public.shopify_connections(agent_id);
CREATE INDEX idx_shopify_connections_shop_domain ON public.shopify_connections(lower(shop_domain));

-- 2. OAuth state tracking table (CSRF protection)
CREATE TABLE IF NOT EXISTS public.shopify_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  shop_domain text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX idx_shopify_oauth_states_state ON public.shopify_oauth_states(state);
CREATE INDEX idx_shopify_oauth_states_expires ON public.shopify_oauth_states(expires_at);

-- 3. Webhook events table (audit trail)
CREATE TABLE IF NOT EXISTS public.shopify_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text NOT NULL,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

CREATE INDEX idx_webhook_events_shop ON public.shopify_webhook_events(shop_domain);
CREATE INDEX idx_webhook_events_topic ON public.shopify_webhook_events(topic);
CREATE INDEX idx_webhook_events_processed ON public.shopify_webhook_events(processed);

-- 4. RLS Policies for shopify_connections
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agent connections"
ON public.shopify_connections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = shopify_connections.agent_id 
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their agent connections"
ON public.shopify_connections FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = shopify_connections.agent_id 
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage connections"
ON public.shopify_connections FOR ALL
USING (true);

-- 5. RLS for oauth_states
ALTER TABLE public.shopify_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage oauth states"
ON public.shopify_oauth_states FOR ALL
USING (true);

-- 6. RLS for webhook_events
ALTER TABLE public.shopify_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
ON public.shopify_webhook_events FOR ALL
USING (true);

-- 7. Auto-cleanup function for expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.shopify_oauth_states
  WHERE expires_at < now();
END;
$$;