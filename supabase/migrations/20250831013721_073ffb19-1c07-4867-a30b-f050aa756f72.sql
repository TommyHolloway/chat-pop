-- PHASE 1: CRITICAL DATABASE SECURITY FIXES

-- Create security definer functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT COALESCE(ur.role, 'user'::app_role)
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = _user_id
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_owns_workspace(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspaces 
        WHERE id = _workspace_id AND user_id = _user_id
    );
$$;

-- Fix agents table RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view agents in their workspaces" ON public.agents;
DROP POLICY IF EXISTS "Users can create agents in their workspaces" ON public.agents;
DROP POLICY IF EXISTS "Users can update agents in their workspaces" ON public.agents;
DROP POLICY IF EXISTS "Users can delete agents in their workspaces" ON public.agents;

CREATE POLICY "Users can view agents in their workspaces" ON public.agents
FOR SELECT 
USING (public.user_owns_workspace(auth.uid(), workspace_id));

CREATE POLICY "Users can create agents in their workspaces" ON public.agents
FOR INSERT 
WITH CHECK (public.user_owns_workspace(auth.uid(), workspace_id));

CREATE POLICY "Users can update agents in their workspaces" ON public.agents
FOR UPDATE 
USING (public.user_owns_workspace(auth.uid(), workspace_id));

CREATE POLICY "Users can delete agents in their workspaces" ON public.agents
FOR DELETE 
USING (public.user_owns_workspace(auth.uid(), workspace_id));

-- Strengthen profiles table security
DROP POLICY IF EXISTS "authenticated_users_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "block_anon_profiles" ON public.profiles;

CREATE POLICY "Users can only access their own profile" ON public.profiles
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Block all anonymous access to profiles" ON public.profiles
FOR ALL
TO anon
USING (false);

-- Strengthen subscribers table security
DROP POLICY IF EXISTS "authenticated_users_own_subscription_only" ON public.subscribers;
DROP POLICY IF EXISTS "block_anon_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "service_role_full_access" ON public.subscribers;

CREATE POLICY "Users can only view their own subscription" ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Block all anonymous access to subscribers" ON public.subscribers
FOR ALL
TO anon
USING (false);

-- Strengthen leads table security
DROP POLICY IF EXISTS "authenticated_leads_insert" ON public.leads;
DROP POLICY IF EXISTS "authenticated_users_own_leads_only" ON public.leads;
DROP POLICY IF EXISTS "block_anon_leads_select" ON public.leads;

CREATE POLICY "Service role can insert leads" ON public.leads
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Users can view leads for their agents only" ON public.leads
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = leads.agent_id AND w.user_id = auth.uid()
));

CREATE POLICY "Block anonymous access to leads" ON public.leads
FOR ALL
TO anon
USING (false);

-- Strengthen visitor sessions security  
DROP POLICY IF EXISTS "anon_can_insert_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "authenticated_users_own_agent_sessions_only" ON public.visitor_sessions;
DROP POLICY IF EXISTS "block_anon_sessions_select" ON public.visitor_sessions;
DROP POLICY IF EXISTS "service_role_can_update_sessions" ON public.visitor_sessions;

CREATE POLICY "Service role can manage visitor sessions" ON public.visitor_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view sessions for their agents only" ON public.visitor_sessions
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE a.id = visitor_sessions.agent_id AND w.user_id = auth.uid()
));

CREATE POLICY "Block anonymous access to visitor sessions" ON public.visitor_sessions
FOR ALL
TO anon
USING (false);

-- Strengthen visitor behavior events security
DROP POLICY IF EXISTS "anon_can_insert_events" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "authenticated_users_own_agent_events_only" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "block_anon_events_select" ON public.visitor_behavior_events;

CREATE POLICY "Service role can manage behavior events" ON public.visitor_behavior_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view events for their agents only" ON public.visitor_behavior_events
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.visitor_sessions vs
    JOIN public.agents a ON a.id = vs.agent_id
    JOIN public.workspaces w ON w.id = a.workspace_id
    WHERE vs.session_id = visitor_behavior_events.session_id AND w.user_id = auth.uid()
));

CREATE POLICY "Block anonymous access to behavior events" ON public.visitor_behavior_events
FOR ALL
TO anon
USING (false);

-- Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
           AND length(email_input) <= 254;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
    -- Allow international formats, require 7-15 digits
    RETURN phone_input ~ '^\+?[1-9]\d{6,14}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
    -- Remove potential XSS characters and limit length
    RETURN left(regexp_replace(input_text, '[<>&"'']', '', 'g'), 1000);
END;
$$;

-- Add validation triggers for profiles
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Validate email format
    IF NEW.email IS NOT NULL AND NOT public.validate_email(NEW.email) THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    -- Validate phone format if provided
    IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT public.validate_phone(NEW.phone) THEN
        RAISE EXCEPTION 'Invalid phone format: %', NEW.phone;
    END IF;
    
    -- Sanitize text inputs
    NEW.display_name = public.sanitize_text_input(COALESCE(NEW.display_name, ''));
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_data_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- Add security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type text,
    user_id_param uuid DEFAULT NULL,
    details_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.activity_logs (
        action,
        user_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        'SECURITY_EVENT: ' || event_type,
        COALESCE(user_id_param, auth.uid()),
        details_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        now()
    );
END;
$$;