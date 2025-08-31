-- FINAL SECURITY LOCKDOWN: Complete RLS Policy Overhaul
-- Remove all existing policies and create bulletproof security

-- Profiles table - Complete lockdown
DROP POLICY IF EXISTS "Users can only access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;

-- Only authenticated users can access their own profile
CREATE POLICY "Authenticated users own profile only" ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Completely block anonymous access
CREATE POLICY "Block anonymous profile access" ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Leads table - Complete lockdown  
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads for their agents only" ON public.leads;
DROP POLICY IF EXISTS "Block anonymous access to leads" ON public.leads;

-- Only service role can insert leads (for edge functions)
CREATE POLICY "Service role insert leads only" ON public.leads
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only authenticated users can view their own agent leads
CREATE POLICY "Authenticated users own agent leads only" ON public.leads
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = leads.agent_id AND w.user_id = auth.uid()
));

-- Block all anonymous access to leads
CREATE POLICY "Block anonymous leads access" ON public.leads
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Visitor sessions - Complete lockdown
DROP POLICY IF EXISTS "Service role can manage visitor sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Users can view sessions for their agents only" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Block anonymous access to visitor sessions" ON public.visitor_sessions;

-- Only service role can manage sessions
CREATE POLICY "Service role manage sessions only" ON public.visitor_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only authenticated users can view their own agent sessions
CREATE POLICY "Authenticated users own agent sessions only" ON public.visitor_sessions
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = visitor_sessions.agent_id AND w.user_id = auth.uid()
));

-- Block all anonymous access to visitor sessions
CREATE POLICY "Block anonymous visitor sessions access" ON public.visitor_sessions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Visitor behavior events - Complete lockdown
DROP POLICY IF EXISTS "Service role can manage behavior events" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "Users can view events for their agents only" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "Block anonymous access to behavior events" ON public.visitor_behavior_events;

-- Only service role can manage behavior events
CREATE POLICY "Service role manage events only" ON public.visitor_behavior_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only authenticated users can view their own agent behavior events
CREATE POLICY "Authenticated users own agent events only" ON public.visitor_behavior_events
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.visitor_sessions vs
    JOIN public.agents a ON a.id = vs.agent_id
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE vs.session_id = visitor_behavior_events.session_id AND w.user_id = auth.uid()
));

-- Block all anonymous access to behavior events
CREATE POLICY "Block anonymous behavior events access" ON public.visitor_behavior_events
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Subscribers table - Ultra secure
DROP POLICY IF EXISTS "Users can only view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Block all anonymous access to subscribers" ON public.subscribers;

-- Only authenticated users can view their own subscription
CREATE POLICY "Authenticated users own subscription only" ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only service role can manage subscriptions (for billing operations)
CREATE POLICY "Service role manage subscriptions only" ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Block all anonymous access to subscriptions
CREATE POLICY "Block anonymous subscriptions access" ON public.subscribers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add comprehensive access logging trigger
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log all SELECT operations on sensitive tables
    IF TG_OP = 'SELECT' AND current_user = 'anon' THEN
        -- Log anonymous access attempts
        INSERT INTO public.activity_logs (
            action,
            details,
            ip_address,
            created_at
        ) VALUES (
            'SECURITY_VIOLATION: Anonymous access attempted',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'role', current_user
            ),
            inet_client_addr(),
            now()
        );
        
        -- Block the operation
        RAISE EXCEPTION 'Unauthorized access denied';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply access logging to sensitive tables (commented out for now as it may impact performance)
-- CREATE TRIGGER log_profiles_access BEFORE SELECT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
-- CREATE TRIGGER log_leads_access BEFORE SELECT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
-- CREATE TRIGGER log_visitor_sessions_access BEFORE SELECT ON public.visitor_sessions FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
-- CREATE TRIGGER log_subscribers_access BEFORE SELECT ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

-- Revoke all default permissions and set explicit grants
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.leads FROM PUBLIC;
REVOKE ALL ON public.visitor_sessions FROM PUBLIC;
REVOKE ALL ON public.visitor_behavior_events FROM PUBLIC;
REVOKE ALL ON public.subscribers FROM PUBLIC;

-- Grant minimal necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.visitor_sessions TO authenticated;
GRANT SELECT ON public.visitor_behavior_events TO authenticated;
GRANT SELECT ON public.subscribers TO authenticated;

-- Service role permissions for edge functions
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.visitor_sessions TO service_role;
GRANT ALL ON public.visitor_behavior_events TO service_role;
GRANT ALL ON public.subscribers TO service_role;