-- FINAL SECURITY LOCKDOWN: Block ALL anon access to sensitive tables

-- 1. Profiles - Block all anon access completely
DROP POLICY IF EXISTS "authenticated_users_own_profile_only" ON public.profiles;

CREATE POLICY "block_anon_profiles" ON public.profiles
  FOR ALL TO anon USING (false);

CREATE POLICY "authenticated_users_own_profile_only" ON public.profiles
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- 2. Subscribers - Block all anon access completely  
DROP POLICY IF EXISTS "service_role_full_access" ON public.subscribers;
DROP POLICY IF EXISTS "authenticated_users_own_subscription_only" ON public.subscribers;

CREATE POLICY "block_anon_subscribers" ON public.subscribers
  FOR ALL TO anon USING (false);

CREATE POLICY "service_role_full_access" ON public.subscribers
  FOR ALL TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_subscription_only" ON public.subscribers
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- 3. Leads - Block anon SELECT access
DROP POLICY IF EXISTS "authenticated_leads_insert" ON public.leads;
DROP POLICY IF EXISTS "authenticated_users_own_leads_only" ON public.leads;

CREATE POLICY "block_anon_leads_select" ON public.leads
  FOR SELECT TO anon USING (false);

CREATE POLICY "authenticated_leads_insert" ON public.leads
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_leads_only" ON public.leads
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = leads.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- 4. Visitor Sessions - Block anon SELECT access
DROP POLICY IF EXISTS "anon_can_insert_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "service_role_can_update_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "authenticated_users_own_agent_sessions_only" ON public.visitor_sessions;

CREATE POLICY "block_anon_sessions_select" ON public.visitor_sessions
  FOR SELECT TO anon USING (false);

CREATE POLICY "anon_can_insert_sessions" ON public.visitor_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_sessions" ON public.visitor_sessions
  FOR UPDATE TO service_role 
  USING (true);

CREATE POLICY "authenticated_users_own_agent_sessions_only" ON public.visitor_sessions
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM agents a 
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE a.id = visitor_sessions.agent_id 
      AND w.user_id = auth.uid()
    )
  );

-- 5. Visitor Behavior Events - Block anon SELECT access
DROP POLICY IF EXISTS "anon_can_insert_events" ON public.visitor_behavior_events;
DROP POLICY IF EXISTS "authenticated_users_own_agent_events_only" ON public.visitor_behavior_events;

CREATE POLICY "block_anon_events_select" ON public.visitor_behavior_events
  FOR SELECT TO anon USING (false);

CREATE POLICY "anon_can_insert_events" ON public.visitor_behavior_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_users_own_agent_events_only" ON public.visitor_behavior_events
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM visitor_sessions vs 
      INNER JOIN agents a ON a.id = vs.agent_id
      INNER JOIN workspaces w ON w.id = a.workspace_id
      WHERE vs.session_id = visitor_behavior_events.session_id 
      AND w.user_id = auth.uid()
    )
  );