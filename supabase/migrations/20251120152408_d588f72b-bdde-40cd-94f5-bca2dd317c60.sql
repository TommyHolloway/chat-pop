-- Fix RLS on rate_limit_tracking table
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- No access policy - only edge functions with service role can write
CREATE POLICY "No public access to rate limits"
  ON rate_limit_tracking FOR ALL
  USING (false);

-- Fix search_path for cleanup function
DROP FUNCTION IF EXISTS cleanup_old_rate_limits();

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limit_tracking 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;