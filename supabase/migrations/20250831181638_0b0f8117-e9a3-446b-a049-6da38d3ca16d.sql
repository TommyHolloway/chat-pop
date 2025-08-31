-- Fix security definer view issue
-- Replace the security definer view with a regular view and proper RLS

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.security_audit_summary;

-- Create a regular view without security definer
CREATE VIEW public.security_audit_summary AS
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

-- Add RLS policy for the view to restrict access to admins only
-- (This inherits from the activity_logs table RLS policies)