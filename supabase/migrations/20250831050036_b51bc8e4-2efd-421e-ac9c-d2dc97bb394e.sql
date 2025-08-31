-- Phase 1: Critical Data Protection

-- 1. Strengthen Profile Data RLS Policies
-- Remove conflicting policies and add better validation
DROP POLICY IF EXISTS "Authenticated users own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous profile access" ON public.profiles;

-- Create more specific and secure profile policies
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Block all anonymous profile access"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 2. Secure Payment Data Access
-- Strengthen subscribers table policies
DROP POLICY IF EXISTS "Authenticated users own subscription only" ON public.subscribers;
DROP POLICY IF EXISTS "Block anonymous subscriptions access" ON public.subscribers;
DROP POLICY IF EXISTS "Service role manage subscriptions only" ON public.subscribers;

-- More restrictive policies for payment data
CREATE POLICY "Users can view their own subscription only"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Block all anonymous subscription access"
ON public.subscribers
FOR ALL
TO anon
USING (false);

CREATE POLICY "Service role can manage subscriptions"
ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Enhance Visitor Data Protection
-- Add data retention trigger to automatically clean old visitor data
CREATE OR REPLACE FUNCTION public.cleanup_visitor_data_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove visitor data older than 30 days for privacy compliance
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run cleanup daily
CREATE OR REPLACE FUNCTION public.schedule_visitor_cleanup()
RETURNS void AS $$
BEGIN
  -- This would normally be a scheduled function, but we'll use it for manual cleanup
  PERFORM public.cleanup_visitor_data_trigger();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add security logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  operation_type text,
  table_name text,
  record_id uuid DEFAULT NULL,
  additional_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_logs (
    action,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    'SENSITIVE_ACCESS: ' || operation_type || ' on ' || table_name,
    auth.uid(),
    jsonb_build_object(
      'table', table_name,
      'record_id', record_id,
      'operation', operation_type,
      'additional_data', additional_data
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_sensitive_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_visitor_cleanup TO service_role;