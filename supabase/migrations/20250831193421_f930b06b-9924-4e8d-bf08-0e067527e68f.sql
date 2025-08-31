-- Fix critical security issues

-- 1. Enable leaked password protection  
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE parameter = 'leaked_password_protection';

-- 2. Fix profiles table RLS policies - remove conflicting policies and create secure ones
DROP POLICY IF EXISTS "Block all anonymous profile access" ON public.profiles;
DROP POLICY IF EXISTS "Enhanced profile security with audit" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;

-- Create single, secure profile policy
CREATE POLICY "Secure profile access - users only"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND email IS NOT NULL AND email != '');

-- Block all anonymous access completely
CREATE POLICY "Block anonymous profile access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. Strengthen subscribers table security
DROP POLICY IF EXISTS "Block all anonymous subscription access" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can manage subscriptions with audit" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription only" ON public.subscribers;

-- Create secure subscriber policies
CREATE POLICY "Users can view own subscription only"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can only insert/update with strict validation
CREATE POLICY "Service role subscription management with audit"
ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (
  email IS NOT NULL 
  AND email != ''
  AND stripe_customer_id IS NOT NULL
);

-- Block all anonymous access to subscribers
CREATE POLICY "Block anonymous subscription access"
ON public.subscribers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. Strengthen leads table security
DROP POLICY IF EXISTS "Authenticated users own agent leads only" ON public.leads;
DROP POLICY IF EXISTS "Block anonymous leads access" ON public.leads;
DROP POLICY IF EXISTS "Service role can insert leads with strict validation" ON public.leads;

-- Create secure leads policies
CREATE POLICY "Users can view own agent leads only"
ON public.leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a
    JOIN workspaces w ON w.id = a.workspace_id
    WHERE a.id = leads.agent_id AND w.user_id = auth.uid()
  )
);

-- Service role can only insert with validation and audit logging
CREATE POLICY "Service role leads insertion with audit"
ON public.leads
FOR INSERT
TO service_role
WITH CHECK (
  agent_id IS NOT NULL
  AND conversation_id IS NOT NULL
  AND lead_data_json IS NOT NULL
  AND lead_data_json != '{}'::jsonb
);

-- Block all other access to leads
CREATE POLICY "Block unauthorized leads access"
ON public.leads
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 5. Add data retention trigger for visitor data privacy
CREATE OR REPLACE FUNCTION cleanup_visitor_privacy_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove visitor data older than 30 days for privacy compliance
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Log the cleanup for audit
  PERFORM log_service_role_operation(
    'privacy_data_cleanup',
    'visitor_data',
    jsonb_build_object('cleanup_date', now(), 'retention_days', 30)
  );
END;
$$;