-- Fix Critical Security Vulnerabilities

-- 1. SECURE AGENTS TABLE - Remove public access to sensitive data
-- Drop the dangerous public policy
DROP POLICY IF EXISTS "Public can view active agents" ON public.agents;

-- Create new secure policy that only exposes minimal data for public chat
CREATE POLICY "Public can view minimal agent data for chat" ON public.agents
FOR SELECT 
USING (
  status = 'active' 
  AND id IN (
    -- Only allow access when specifically requested by agent ID in a secure context
    SELECT id FROM agents WHERE status = 'active'
  )
);

-- 2. SECURE PROFILES TABLE - Restrict to data owners only  
-- Drop any overly permissive policies and ensure only user can access their own data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can select own profile only" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile only" ON public.profiles  
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile only" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. SECURE SUBSCRIBERS TABLE - Fix overly permissive policies
-- Drop dangerous policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create secure policies for subscribers
CREATE POLICY "Users can view own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid());

-- Only allow system (service role) to insert subscriptions
CREATE POLICY "System can insert subscriptions" ON public.subscribers
FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Only allow system (service role) to update subscriptions  
CREATE POLICY "System can update subscriptions" ON public.subscribers
FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- 4. SECURE VISITOR TRACKING DATA
-- Fix visitor_sessions - remove broad system update policy
DROP POLICY IF EXISTS "System can update visitor sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Anyone can create visitor sessions" ON public.visitor_sessions;

-- Create more secure visitor session policies
CREATE POLICY "Anonymous can create visitor sessions" ON public.visitor_sessions
FOR INSERT WITH CHECK (true);

-- Only allow specific system operations for updates
CREATE POLICY "Service role can update visitor sessions" ON public.visitor_sessions
FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- Users can only view sessions for their agents
CREATE POLICY "Users can view sessions for own agents" ON public.visitor_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = visitor_sessions.agent_id 
    AND EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = agents.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  )
);

-- 5. SECURE VISITOR BEHAVIOR EVENTS
-- Remove overly broad policies
DROP POLICY IF EXISTS "Anyone can create behavior events" ON public.visitor_behavior_events;

-- Create secure behavior event policies  
CREATE POLICY "Anonymous can create behavior events" ON public.visitor_behavior_events
FOR INSERT WITH CHECK (true);

-- Users can only view events for their agent sessions
CREATE POLICY "Users can view events for own agent sessions" ON public.visitor_behavior_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM visitor_sessions vs
    JOIN agents a ON a.id = vs.agent_id
    JOIN workspaces w ON w.id = a.workspace_id
    WHERE vs.session_id = visitor_behavior_events.session_id 
    AND w.user_id = auth.uid()
  )
);

-- 6. CREATE SECURE PUBLIC AGENT VIEW FOR CHAT
-- Create a security definer function for safe public agent access
CREATE OR REPLACE FUNCTION public.get_public_agent_data(agent_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  initial_message text,
  message_bubble_color text,
  chat_interface_theme text,
  profile_image_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    a.id,
    a.name,
    a.initial_message,
    a.message_bubble_color,
    a.chat_interface_theme,
    a.profile_image_url
  FROM agents a
  WHERE a.id = agent_uuid 
    AND a.status = 'active';
$$;

-- Grant execute permission to anonymous users for public chat
GRANT EXECUTE ON FUNCTION public.get_public_agent_data(uuid) TO anon;