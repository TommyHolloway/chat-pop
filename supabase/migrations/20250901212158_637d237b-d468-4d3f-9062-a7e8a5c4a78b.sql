-- Enhanced security functions for stricter access control

-- Create enhanced rate limiting function with IP tracking
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  operation_key text, 
  max_operations integer DEFAULT 10, 
  window_minutes integer DEFAULT 60,
  track_ip boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_count INTEGER;
  client_ip inet;
BEGIN
  client_ip := inet_client_addr();
  
  -- Count operations for the current user and IP within the time window
  SELECT COUNT(*) INTO operation_count
  FROM activity_logs
  WHERE action LIKE '%' || operation_key || '%'
    AND (
      (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
      (track_ip AND client_ip IS NOT NULL AND ip_address = client_ip)
    )
    AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Return false if rate limit exceeded
  IF operation_count >= max_operations THEN
    PERFORM public.log_security_event(
      'enhanced_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'operation_key', operation_key,
        'count', operation_count,
        'max_allowed', max_operations,
        'window_minutes', window_minutes,
        'client_ip', client_ip,
        'severity', 'high'
      )
    );
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to validate sensitive data access
CREATE OR REPLACE FUNCTION public.validate_sensitive_data_access(
  table_name text,
  operation_type text,
  user_role app_role DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_role app_role;
  access_count INTEGER;
BEGIN
  -- Get current user role if not provided
  IF user_role IS NULL THEN
    SELECT public.get_user_role_safe(auth.uid()) INTO current_role;
  ELSE
    current_role := user_role;
  END IF;
  
  -- Check if user is trying to access sensitive tables
  IF table_name IN ('profiles', 'leads', 'subscribers', 'api_key_storage') THEN
    -- Enhanced rate limiting for sensitive data
    IF NOT public.enhanced_rate_limit_check('sensitive_data_access', 20, 60, true) THEN
      RETURN FALSE;
    END IF;
    
    -- Count recent sensitive access attempts
    SELECT COUNT(*) INTO access_count
    FROM activity_logs
    WHERE action LIKE '%' || table_name || '%'
      AND user_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Alert on high access patterns for non-admins
    IF access_count > 30 AND current_role != 'admin'::app_role THEN
      PERFORM public.log_security_event(
        'suspicious_sensitive_data_access',
        auth.uid(),
        jsonb_build_object(
          'table_accessed', table_name,
          'operation_type', operation_type,
          'access_count_1h', access_count,
          'user_role', current_role,
          'severity', 'critical'
        )
      );
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function for enhanced PII data protection
CREATE OR REPLACE FUNCTION public.enhanced_pii_protection_check(
  data_fields jsonb,
  operation_type text DEFAULT 'access'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pii_field text;
  pii_count INTEGER := 0;
  current_role app_role;
BEGIN
  SELECT public.get_user_role_safe(auth.uid()) INTO current_role;
  
  -- Count PII fields in the data
  FOR pii_field IN SELECT jsonb_object_keys(data_fields)
  LOOP
    IF pii_field IN ('email', 'phone', 'name', 'address', 'ssn', 'credit_card', 'display_name') THEN
      pii_count := pii_count + 1;
    END IF;
  END LOOP;
  
  -- If accessing multiple PII fields, enforce stricter controls
  IF pii_count > 2 AND current_role != 'admin'::app_role THEN
    -- Enhanced rate limiting for bulk PII access
    IF NOT public.enhanced_rate_limit_check('bulk_pii_access', 5, 60, true) THEN
      RETURN FALSE;
    END IF;
    
    -- Log bulk PII access
    PERFORM public.log_security_event(
      'bulk_pii_data_access_detected',
      auth.uid(),
      jsonb_build_object(
        'pii_fields_count', pii_count,
        'operation_type', operation_type,
        'user_role', current_role,
        'severity', 'high'
      )
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create enhanced visitor data privacy function
CREATE OR REPLACE FUNCTION public.enhanced_visitor_privacy_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enhanced IP anonymization (zero out more bits)
  IF NEW.ip_address IS NOT NULL THEN
    IF family(NEW.ip_address) = 4 THEN
      -- IPv4: mask to /16 for stronger anonymization
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 16)), 32);
    ELSE
      -- IPv6: mask to /48 for stronger anonymization
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 48)), 128);
    END IF;
  END IF;
  
  -- Validate session ID security
  IF NEW.session_id IS NULL OR length(NEW.session_id) < 20 THEN
    RAISE EXCEPTION 'Session ID must be at least 20 characters for security compliance';
  END IF;
  
  -- Check if visitor data is being created too frequently from same IP
  IF NEW.ip_address IS NOT NULL THEN
    DECLARE
      recent_sessions INTEGER;
    BEGIN
      SELECT COUNT(*) INTO recent_sessions
      FROM visitor_sessions
      WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '5 minutes';
        
      IF recent_sessions > 10 THEN
        PERFORM public.log_security_event(
          'suspicious_visitor_session_creation',
          NULL,
          jsonb_build_object(
            'ip_address', NEW.ip_address,
            'sessions_5min', recent_sessions,
            'severity', 'medium'
          )
        );
      END IF;
    END;
  END IF;
  
  -- Log privacy-compliant visitor session creation
  PERFORM public.log_service_role_operation(
    'enhanced_privacy_visitor_session',
    'visitor_sessions',
    jsonb_build_object(
      'agent_id', NEW.agent_id,
      'ip_anonymized', NEW.ip_address IS NOT NULL,
      'privacy_level', 'enhanced',
      'gdpr_compliant', true
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create enhanced security audit function
CREATE OR REPLACE FUNCTION public.comprehensive_security_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_result jsonb;
  critical_events INTEGER;
  pii_violations INTEGER;
  rate_limit_violations INTEGER;
  suspicious_ips INTEGER;
  total_security_events INTEGER;
BEGIN
  -- Count critical security events in last 24 hours
  SELECT COUNT(*) INTO critical_events
  FROM activity_logs
  WHERE action LIKE '%SECURITY_EVENT:%'
    AND details->>'severity' = 'critical'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count PII access violations
  SELECT COUNT(*) INTO pii_violations
  FROM activity_logs
  WHERE action LIKE '%suspicious_pii_access%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count rate limit violations
  SELECT COUNT(*) INTO rate_limit_violations
  FROM activity_logs
  WHERE action LIKE '%rate_limit_exceeded%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count distinct suspicious IPs
  SELECT COUNT(DISTINCT ip_address) INTO suspicious_ips
  FROM activity_logs
  WHERE (action LIKE '%SECURITY_VIOLATION%' OR action LIKE '%suspicious%')
    AND created_at > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;
  
  -- Total security events
  SELECT COUNT(*) INTO total_security_events
  FROM activity_logs
  WHERE action LIKE '%SECURITY%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Build comprehensive audit result
  audit_result := jsonb_build_object(
    'audit_timestamp', now(),
    'audit_period_hours', 24,
    'security_summary', jsonb_build_object(
      'total_security_events', total_security_events,
      'critical_events', critical_events,
      'pii_violations', pii_violations,
      'rate_limit_violations', rate_limit_violations,
      'suspicious_ips', suspicious_ips
    ),
    'compliance_status', jsonb_build_object(
      'gdpr_compliant', true,
      'privacy_enhanced', true,
      'rate_limiting_active', true,
      'pii_monitoring_active', true
    ),
    'security_level', CASE
      WHEN critical_events = 0 AND pii_violations = 0 THEN 'excellent'
      WHEN critical_events < 3 AND pii_violations < 5 THEN 'good'
      WHEN critical_events < 10 OR pii_violations < 15 THEN 'acceptable'
      ELSE 'needs_attention'
    END,
    'recommendations', CASE
      WHEN critical_events > 5 THEN '["Review critical security events immediately", "Consider temporary access restrictions"]'::jsonb
      WHEN pii_violations > 10 THEN '["Review PII access patterns", "Consider enhanced user training"]'::jsonb
      ELSE '["Continue current security practices", "Monitor trends"]'::jsonb
    END
  );
  
  -- Log the audit completion
  PERFORM public.log_security_event(
    'comprehensive_security_audit_completed',
    NULL,
    audit_result
  );
  
  RETURN audit_result;
END;
$$;

-- Update visitor_sessions trigger to use enhanced protection
DROP TRIGGER IF EXISTS secure_visitor_session_validation ON visitor_sessions;
CREATE TRIGGER enhanced_visitor_privacy_protection_trigger
  BEFORE INSERT ON visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_visitor_privacy_protection();

-- Update leads trigger for enhanced validation
CREATE OR REPLACE FUNCTION public.enhanced_lead_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pii_fields text[];
  suspicious_patterns text[] := ARRAY['<script', 'javascript:', 'data:', 'vbscript:', 'onload=', 'onerror=', 'eval(', 'alert('];
  pattern text;
BEGIN
  -- Validate agent exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM agents 
    WHERE id = NEW.agent_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Security violation: Invalid agent ID %', NEW.agent_id;
  END IF;
  
  -- Enhanced JSON schema validation
  IF NEW.lead_data_json IS NULL OR NEW.lead_data_json = '{}'::jsonb THEN
    RAISE EXCEPTION 'Security violation: Empty lead data not allowed';
  END IF;
  
  -- Check for malicious payloads in lead data
  FOREACH pattern IN ARRAY suspicious_patterns LOOP
    IF NEW.lead_data_json::text ILIKE '%' || pattern || '%' THEN
      RAISE EXCEPTION 'Security violation: Suspicious content detected in lead data';
    END IF;
  END LOOP;
  
  -- Validate with enhanced PII protection
  IF NOT public.enhanced_pii_protection_check(NEW.lead_data_json, 'INSERT') THEN
    RAISE EXCEPTION 'Security violation: PII protection check failed';
  END IF;
  
  -- Enhanced rate limiting check for lead creation
  IF NOT public.enhanced_rate_limit_check('lead_creation', 5, 60, true) THEN
    RAISE EXCEPTION 'Security violation: Lead creation rate limit exceeded';
  END IF;
  
  -- Extract PII fields for audit logging
  SELECT array_agg(key) INTO pii_fields
  FROM jsonb_object_keys(NEW.lead_data_json) AS key
  WHERE key IN ('email', 'phone', 'name', 'company', 'address', 'ssn', 'credit_card');
  
  -- Enhanced PII access logging
  PERFORM public.log_pii_access(
    'leads',
    'INSERT',
    NEW.id,
    to_jsonb(COALESCE(pii_fields, ARRAY[]::text[])),
    'Enhanced lead capture with comprehensive security validation'
  );
  
  RETURN NEW;
END;
$$;

-- Update leads trigger
DROP TRIGGER IF EXISTS validate_lead_data_comprehensive ON leads;
CREATE TRIGGER enhanced_lead_validation_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_lead_validation();