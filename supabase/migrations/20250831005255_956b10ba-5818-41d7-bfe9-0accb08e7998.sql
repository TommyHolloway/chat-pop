-- ULTIMATE SECURITY LOCKDOWN: Revoke all default permissions and enforce strict policies

-- First, revoke all default table permissions for anon role
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.subscribers FROM anon;
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.visitor_sessions FROM anon;
REVOKE ALL ON public.visitor_behavior_events FROM anon;

-- Also revoke any sequence permissions
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Ensure proper grants for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscribers TO authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.visitor_sessions TO authenticated;
GRANT SELECT ON public.visitor_behavior_events TO authenticated;

-- Allow anon to only INSERT into specific tables (for public functionality)
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.visitor_sessions TO anon;
GRANT INSERT ON public.visitor_behavior_events TO anon;

-- Ensure service role has necessary permissions
GRANT ALL ON public.subscribers TO service_role;
GRANT UPDATE ON public.visitor_sessions TO service_role;

-- Grant usage on sequences for inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;