-- Phase 1 Cleanup: Remove calendar, waitlist, and security tables

-- Drop calendar integrations table
DROP TABLE IF EXISTS public.calendar_integrations CASCADE;

-- Drop waitlist table
DROP TABLE IF EXISTS public.waitlist CASCADE;

-- Drop security audit tables
DROP TABLE IF EXISTS public.security_audit_logs CASCADE;
DROP TABLE IF EXISTS public.api_key_storage CASCADE;

-- Drop security audit summary view if it exists
DROP VIEW IF EXISTS public.security_audit_summary CASCADE;

-- Remove enhanced rate limit function if it exists
DROP FUNCTION IF EXISTS public.enhanced_rate_limit_check(text, integer, integer, boolean) CASCADE;

-- Remove validation functions used only by deleted tables
DROP FUNCTION IF EXISTS public.validate_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_phone(text) CASCADE;