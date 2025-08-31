-- Fix function search path issues for new security functions
ALTER FUNCTION public.cleanup_visitor_data_trigger() SET search_path = 'public';
ALTER FUNCTION public.schedule_visitor_cleanup() SET search_path = 'public';
ALTER FUNCTION public.log_sensitive_access(text, text, uuid, jsonb) SET search_path = 'public';