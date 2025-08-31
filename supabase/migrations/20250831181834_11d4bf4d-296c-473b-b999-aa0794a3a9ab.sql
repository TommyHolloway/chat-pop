-- Fix existing views to use SECURITY INVOKER instead of SECURITY DEFINER
-- This addresses the security linter warning about security definer views

-- First, let's check if there are any existing views that need to be updated
-- and recreate the security_audit_summary view with SECURITY INVOKER

-- Drop and recreate the security audit summary view with security_invoker=on
DROP VIEW IF EXISTS public.security_audit_summary;

CREATE VIEW public.security_audit_summary
  WITH (security_invoker=on) AS
SELECT 
  DATE(created_at) as audit_date,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE action LIKE 'SERVICE_ROLE_OPERATION%') as service_role_ops,
  COUNT(*) FILTER (WHERE action LIKE 'SECURITY_EVENT%') as security_events,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) FILTER (WHERE action LIKE '%lead%') as lead_operations,
  COUNT(*) FILTER (WHERE action LIKE '%visitor%') as visitor_operations
FROM activity_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY audit_date DESC;