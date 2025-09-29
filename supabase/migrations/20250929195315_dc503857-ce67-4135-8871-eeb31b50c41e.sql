-- Enable Row Level Security on profiles table
-- This is a critical security fix - the table has policies but RLS was not enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify existing policies are still in place (they are, just not enforced):
-- 1. Users can only view own profile data
-- 2. Users can only create own profile
-- 3. Users can only update own profile  
-- 4. Block all profile deletion

-- Log this security fix
SELECT public.log_security_event(
  'profiles_rls_enabled_critical_fix',
  NULL,
  jsonb_build_object(
    'table', 'profiles',
    'action', 'enable_rls',
    'severity', 'critical',
    'issue', 'RLS policies existed but were not enforced',
    'fix_date', now()
  )
);