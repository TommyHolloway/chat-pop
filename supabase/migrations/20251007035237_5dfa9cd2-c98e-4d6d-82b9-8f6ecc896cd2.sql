-- Phase 2: Critical RLS Security Hardening
-- Block anonymous access to PII-containing tables

-- 1. Block anonymous SELECT access to profiles table (PII: email, phone)
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Strengthen leads table protection with explicit anonymous blocking
CREATE POLICY "Block anonymous access to leads"
ON public.leads
FOR SELECT
TO anon
USING (false);

-- Add helpful comments explaining the security policies
COMMENT ON POLICY "Block anonymous access to profiles" ON public.profiles IS 
'Critical security policy: Prevents anonymous users from accessing PII (email, phone) in profiles table';

COMMENT ON POLICY "Block anonymous access to leads" ON public.leads IS 
'Critical security policy: Prevents anonymous users from accessing lead capture data containing PII';