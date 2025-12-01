-- OAuth State Cleanup
-- Clean up expired OAuth states and pending installs
-- Part of Phase 2 Security Audit

COMMENT ON TABLE shopify_oauth_states IS 'OAuth states for CSRF protection (expires_at for cleanup)';
COMMENT ON TABLE shopify_pending_installs IS 'Pending Shopify app installations (expires_at for cleanup)';

-- Function to clean up expired OAuth states (can be called manually or via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired OAuth states (older than 1 day)
  DELETE FROM shopify_oauth_states 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  -- Clean up expired pending installs (older than 1 day)
  DELETE FROM shopify_pending_installs 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  RAISE NOTICE 'OAuth cleanup completed';
END;
$$;

-- Add index for better cleanup performance
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires_at 
  ON shopify_oauth_states(expires_at);
  
CREATE INDEX IF NOT EXISTS idx_shopify_pending_installs_expires_at 
  ON shopify_pending_installs(expires_at);
