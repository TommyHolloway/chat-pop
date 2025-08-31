-- Enhanced security fixes for critical vulnerabilities

-- 1. Strengthen profiles table RLS policies
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;

-- Create more restrictive profile policies
CREATE POLICY "Users can insert own profile only" ON public.profiles
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can select own profile only" ON public.profiles
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile only" ON public.profiles
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Ensure no anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles" ON public.profiles
  FOR ALL 
  TO anon 
  USING (false);

-- 2. Strengthen leads table RLS policies
DROP POLICY IF EXISTS "System can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads for their agents" ON public.leads;

-- More restrictive leads policies
CREATE POLICY "System can insert leads" ON public.leads
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view leads for their agents only" ON public.leads
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = leads.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- Block anonymous access to leads
CREATE POLICY "Block anonymous access to leads" ON public.leads
  FOR SELECT 
  TO anon 
  USING (false);

-- 3. Strengthen visitor sessions policies  
DROP POLICY IF EXISTS "Users can view sessions for own agents" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Users can view sessions for their agents" ON public.visitor_sessions;

-- Single, clear policy for visitor sessions
CREATE POLICY "Users can view sessions for owned agents only" ON public.visitor_sessions
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = visitor_sessions.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- 4. Strengthen visitor behavior events policies
DROP POLICY IF EXISTS "Users can view events for own agent sessions" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "Users can view events for their agent sessions" ON public.visitor_behavior_events;

-- Single, clear policy for behavior events
CREATE POLICY "Users can view events for owned agent sessions only" ON public.visitor_behavior_events
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM visitor_sessions vs 
      INNER JOIN agents a ON a.id = vs.agent_id
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE vs.session_id = visitor_behavior_events.session_id 
      AND w.user_id = auth.uid()
    )
  );

-- 5. Strengthen subscribers table policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;

CREATE POLICY "Users can view own subscription only" ON public.subscribers
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Block anonymous access to subscribers
CREATE POLICY "Block anonymous access to subscribers" ON public.subscribers
  FOR SELECT 
  TO anon 
  USING (false);

-- 6. Add data retention function for visitor privacy
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

-- 7. Create function to anonymize IP addresses for privacy
CREATE OR REPLACE FUNCTION public.anonymize_ip_address(ip_addr inet)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
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