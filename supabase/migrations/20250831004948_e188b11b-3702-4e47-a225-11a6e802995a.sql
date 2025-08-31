-- Fix remaining function search path security issue

-- Update functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.cleanup_old_visitor_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove visitor data older than 90 days for privacy
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.anonymize_ip_address(ip_addr inet)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Anonymize IP by zeroing last octet for IPv4
  IF family(ip_addr) = 4 THEN
    RETURN set_masklen(network(set_masklen(ip_addr, 24)), 32);
  -- For IPv6, mask last 64 bits  
  ELSE
    RETURN set_masklen(network(set_masklen(ip_addr, 64)), 128);
  END IF;
END;
$$;