-- CRITICAL: Complete lockdown of sensitive tables from public access

-- 1. Completely disable RLS and recreate for profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Create single, restrictive policies
CREATE POLICY "authenticated_users_own_profile_only" ON public.profiles
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- 2. Completely disable RLS and recreate for leads
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "System can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads for their agents only" ON public.leads;
DROP POLICY IF EXISTS "Block anonymous access to leads" ON public.leads;

-- Create restrictive policies for leads
CREATE POLICY "authenticated_leads_insert" ON public.leads
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_leads_only" ON public.leads
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = leads.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- 3. Completely disable RLS and recreate for subscribers
ALTER TABLE public.subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription only" ON public.subscribers;
DROP POLICY IF EXISTS "Block anonymous access to subscribers" ON public.subscribers;

-- Create restrictive policies for subscribers
CREATE POLICY "service_role_full_access" ON public.subscribers
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_subscription_only" ON public.subscribers
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- 4. Completely disable RLS and recreate for visitor_sessions
ALTER TABLE public.visitor_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Anonymous can create visitor sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Service role can update visitor sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Users can view sessions for owned agents only" ON public.visitor_sessions;

-- Create restrictive policies for visitor sessions
CREATE POLICY "anon_can_insert_sessions" ON public.visitor_sessions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_sessions" ON public.visitor_sessions
  FOR UPDATE 
  TO service_role 
  USING (true);

CREATE POLICY "authenticated_users_own_agent_sessions_only" ON public.visitor_sessions
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = visitor_sessions.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- 5. Completely disable RLS and recreate for visitor_behavior_events
ALTER TABLE public.visitor_behavior_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_behavior_events ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Anonymous can create behavior events" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "Users can view events for owned agent sessions only" ON public.visitor_behavior_events;

-- Create restrictive policies for behavior events
CREATE POLICY "anon_can_insert_events" ON public.visitor_behavior_events
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_agent_events_only" ON public.visitor_behavior_events
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM visitor_sessions vs 
      INNER JOIN agents a ON a.id = vs.agent_id
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE vs.session_id = visitor_behavior_events.session_id 
      AND w.user_id = auth.uid()
    )
  );