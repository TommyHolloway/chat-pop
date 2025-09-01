-- PHASE 1: Critical Security Fixes (Corrected)
-- Note: security_audit_summary is a view, so we'll create admin access control through RLS on underlying tables

-- 1. Enhanced Security Controls

-- Create enhanced PII access monitoring function
CREATE OR REPLACE FUNCTION public.enhanced_pii_access_control()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_count INTEGER;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT public.get_user_role_safe(auth.uid()) INTO user_role;
  
  -- Check for excessive PII access in last hour
  SELECT COUNT(*) INTO access_count
  FROM activity_logs
  WHERE action LIKE 'PII_ACCESS:%'
    AND user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';
    
  -- Alert on suspicious activity (more than 20 PII accesses per hour for non-admins)
  IF access_count > 20 AND user_role != 'admin'::app_role THEN
    PERFORM public.log_security_event(
      'excessive_pii_access_detected',
      auth.uid(),
      jsonb_build_object(
        'access_count', access_count,
        'user_role', user_role,
        'severity', 'critical',
        'action_taken', 'access_logged'
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create IP-based admin access monitoring
CREATE OR REPLACE FUNCTION public.monitor_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_ip inet;
  recent_admin_ips INTEGER;
BEGIN
  -- Only monitor admin role changes
  IF TG_TABLE_NAME = 'user_roles' AND (NEW.role = 'admin'::app_role OR OLD.role = 'admin'::app_role) THEN
    client_ip := inet_client_addr();
    
    -- Check for admin access from multiple IPs in short time
    SELECT COUNT(DISTINCT ip_address) INTO recent_admin_ips
    FROM activity_logs
    WHERE action LIKE '%admin%'
      AND user_id = auth.uid()
      AND created_at > NOW() - INTERVAL '2 hours'
      AND ip_address IS NOT NULL;
    
    -- Alert on suspicious admin access patterns
    IF recent_admin_ips > 2 THEN
      PERFORM public.log_security_event(
        'suspicious_admin_access_pattern',
        auth.uid(),
        jsonb_build_object(
          'distinct_ips_count', recent_admin_ips,
          'current_ip', client_ip,
          'severity', 'high',
          'time_window', '2 hours'
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Enhanced service role operation validation
CREATE OR REPLACE FUNCTION public.validate_service_role_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  operation_count INTEGER;
BEGIN
  -- Monitor high-volume service role operations
  IF current_user = 'service_role' THEN
    SELECT COUNT(*) INTO operation_count
    FROM activity_logs
    WHERE action LIKE 'SERVICE_ROLE_OPERATION:%'
      AND created_at > NOW() - INTERVAL '10 minutes';
    
    -- Alert on excessive service role activity
    IF operation_count > 100 THEN
      PERFORM public.log_security_event(
        'excessive_service_role_activity',
        NULL,
        jsonb_build_object(
          'operation_count', operation_count,
          'table_name', TG_TABLE_NAME,
          'operation', TG_OP,
          'severity', 'medium',
          'time_window', '10 minutes'
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for enhanced monitoring
CREATE TRIGGER enhanced_pii_access_control_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_pii_access_control();

CREATE TRIGGER enhanced_pii_access_control_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_pii_access_control();

CREATE TRIGGER monitor_admin_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.monitor_admin_access();

CREATE TRIGGER validate_service_role_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.visitor_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_role_operations();

CREATE TRIGGER validate_service_role_operations_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_role_operations();

-- Create automated security cleanup function
CREATE OR REPLACE FUNCTION public.automated_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up old activity logs (keep 90 days for security)
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Run PII access pattern detection
  PERFORM public.detect_suspicious_pii_access();
  
  -- Log maintenance completion
  PERFORM public.log_security_event(
    'automated_security_maintenance_completed',
    NULL,
    jsonb_build_object(
      'maintenance_date', now(),
      'logs_cleaned', true,
      'pii_detection_run', true
    )
  );
END;
$function$;

-- Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  operation_key text, 
  max_operations integer DEFAULT 10, 
  window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  operation_count INTEGER;
BEGIN
  -- Count operations for the current user within the time window
  SELECT COUNT(*) INTO operation_count
  FROM activity_logs
  WHERE action LIKE '%' || operation_key || '%'
    AND user_id = auth.uid()
    AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Return false if rate limit exceeded
  IF operation_count >= max_operations THEN
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'operation_key', operation_key,
        'count', operation_count,
        'max_allowed', max_operations,
        'window_minutes', window_minutes
      )
    );
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;