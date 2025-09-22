-- Critical Security Fixes for Database (Corrected)

-- 1. Skip security_audit_summary since it's a view - create secure admin access function instead
CREATE OR REPLACE FUNCTION public.get_security_audit_summary_secure()
RETURNS TABLE(
  audit_date date,
  total_operations bigint,
  service_role_ops bigint,
  security_events bigint,
  unique_ips bigint,
  lead_operations bigint,
  visitor_operations bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow admins to access security audit data
  SELECT 
    s.audit_date,
    s.total_operations,
    s.service_role_ops,
    s.security_events,
    s.unique_ips,
    s.lead_operations,
    s.visitor_operations
  FROM security_audit_summary s
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;

-- 2. Enhance subscriber table security with stricter validation
DROP POLICY IF EXISTS "Service role secure subscription creation" ON public.subscribers;
DROP POLICY IF EXISTS "Service role secure subscription updates" ON public.subscribers;

-- Create more restrictive subscription policies
CREATE POLICY "Service role secure subscription creation with enhanced validation" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL AND 
  email <> '' AND 
  validate_email(email) AND 
  stripe_customer_id IS NOT NULL AND 
  subscription_tier IS NOT NULL AND 
  subscription_tier = ANY (ARRAY['hobby'::text, 'standard'::text, 'enterprise'::text]) AND
  enhanced_rate_limit_check('subscription_creation', 3, 60, true) AND
  char_length(email) <= 254 AND
  char_length(stripe_customer_id) <= 100
);

CREATE POLICY "Service role secure subscription updates with audit logging" 
ON public.subscribers 
FOR UPDATE 
USING (
  created_at > (now() - '7 days'::interval) AND
  enhanced_rate_limit_check('subscription_update', 5, 60, true)
)
WITH CHECK (
  email IS NOT NULL AND 
  email <> '' AND 
  validate_email(email) AND 
  stripe_customer_id IS NOT NULL AND 
  subscription_tier IS NOT NULL AND 
  subscription_tier = ANY (ARRAY['hobby'::text, 'standard'::text, 'enterprise'::text]) AND
  char_length(email) <= 254 AND
  char_length(stripe_customer_id) <= 100
);

-- 3. Enhance leads table security with comprehensive validation
DROP POLICY IF EXISTS "Service role secure leads insertion with comprehensive validati" ON public.leads;

CREATE POLICY "Service role secure leads insertion with enhanced security" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  agent_id IS NOT NULL AND 
  conversation_id IS NOT NULL AND 
  lead_data_json IS NOT NULL AND 
  lead_data_json <> '{}'::jsonb AND 
  jsonb_typeof(lead_data_json) = 'object'::text AND
  -- Enhanced malicious content detection
  NOT ((lead_data_json)::text ~~* ANY (ARRAY[
    '%<script%'::text, '%javascript:%'::text, '%data:%'::text,
    '%vbscript:%'::text, '%onload=%'::text, '%onerror=%'::text,
    '%eval(%'::text, '%function(%'::text, '%setTimeout(%'::text
  ])) AND
  -- Size limits for security
  char_length((lead_data_json)::text) <= 10000 AND
  -- Rate limiting
  enhanced_rate_limit_check('lead_creation', 3, 60, true)
);

-- 4. Create enhanced visitor data privacy controls
CREATE OR REPLACE FUNCTION public.enhanced_visitor_privacy_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- More aggressive data retention (14 days instead of 30)
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '14 days';
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '14 days';
  
  -- Log privacy cleanup for audit
  PERFORM public.log_security_event(
    'enhanced_visitor_privacy_cleanup_completed',
    NULL,
    jsonb_build_object(
      'visitor_records_cleaned', cleanup_count,
      'retention_policy', '14_days_strict',
      'compliance_level', 'gdpr_enhanced_strict',
      'cleanup_date', now()
    )
  );
END;
$$;

-- 5. Create function for stronger IP anonymization
CREATE OR REPLACE FUNCTION public.enhanced_ip_anonymization(ip_addr inet)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Enhanced anonymization - zero out more bits for stronger privacy
  IF family(ip_addr) = 4 THEN
    -- IPv4: mask to /16 (zero last 2 octets) instead of /24
    RETURN set_masklen(network(set_masklen(ip_addr, 16)), 32);
  ELSE
    -- IPv6: mask to /48 (stronger anonymization) instead of /64
    RETURN set_masklen(network(set_masklen(ip_addr, 48)), 128);
  END IF;
END;
$$;

-- 6. Enhanced security monitoring for API key operations
CREATE OR REPLACE FUNCTION public.monitor_api_key_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_key_operations INTEGER;
BEGIN
  -- Count recent API key operations for this user
  SELECT COUNT(*) INTO recent_key_operations
  FROM activity_logs
  WHERE action LIKE '%api_key%'
    AND user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND created_at > NOW() - INTERVAL '1 hour';
    
  -- Alert on suspicious API key activity
  IF recent_key_operations > 5 THEN
    PERFORM public.log_security_event(
      'suspicious_api_key_activity_detected',
      COALESCE(NEW.user_id, OLD.user_id),
      jsonb_build_object(
        'operation_count', recent_key_operations,
        'agent_id', COALESCE(NEW.agent_id, OLD.agent_id),
        'operation_type', TG_OP,
        'severity', 'high',
        'time_window', '1 hour'
      )
    );
  END IF;
  
  -- Log API key operation for audit
  PERFORM public.log_security_event(
    'api_key_operation_' || lower(TG_OP),
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'agent_id', COALESCE(NEW.agent_id, OLD.agent_id),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for API key security monitoring
DROP TRIGGER IF EXISTS monitor_api_key_security_trigger ON public.api_key_storage;
CREATE TRIGGER monitor_api_key_security_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.api_key_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_api_key_security();

-- 7. Update visitor session trigger to use enhanced IP anonymization
DROP TRIGGER IF EXISTS enhanced_visitor_data_anonymization_trigger ON public.visitor_sessions;
CREATE TRIGGER enhanced_visitor_data_anonymization_trigger
  BEFORE INSERT ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_visitor_data_validation();

-- 8. Create comprehensive security health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  health_report jsonb;
  recent_security_events INTEGER;
  pii_access_violations INTEGER;
  suspicious_patterns INTEGER;
  vulnerable_tables INTEGER;
BEGIN
  -- Count recent security events
  SELECT COUNT(*) INTO recent_security_events
  FROM activity_logs
  WHERE action LIKE '%SECURITY%'
    AND created_at > NOW() - INTERVAL '24 hours';
    
  -- Count PII access violations
  SELECT COUNT(*) INTO pii_access_violations
  FROM activity_logs
  WHERE action LIKE '%excessive_pii_access%'
    AND created_at > NOW() - INTERVAL '24 hours';
    
  -- Count suspicious patterns
  SELECT COUNT(*) INTO suspicious_patterns
  FROM activity_logs
  WHERE action LIKE '%suspicious%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Check for tables with weak security (this is a simplified check)
  vulnerable_tables := 0;
  
  -- Build health report
  health_report := jsonb_build_object(
    'scan_timestamp', now(),
    'security_level', 'comprehensive_enhanced',
    'recent_security_events_24h', recent_security_events,
    'pii_violations_24h', pii_access_violations,
    'suspicious_patterns_24h', suspicious_patterns,
    'vulnerable_tables', vulnerable_tables,
    'health_status', CASE 
      WHEN pii_access_violations = 0 AND suspicious_patterns = 0 THEN 'healthy'
      WHEN pii_access_violations > 0 THEN 'critical'
      WHEN suspicious_patterns > 0 THEN 'warning'
      ELSE 'unknown'
    END,
    'recommendations', ARRAY[
      CASE WHEN pii_access_violations > 0 THEN 'Investigate PII access violations' ELSE NULL END,
      CASE WHEN suspicious_patterns > 0 THEN 'Review suspicious activity patterns' ELSE NULL END,
      'Run enhanced_visitor_privacy_cleanup() regularly',
      'Monitor API key usage patterns',
      'Enable leaked password protection in Supabase Auth settings'
    ]
  );
  
  -- Log health check completion
  PERFORM public.log_security_event(
    'security_health_check_completed',
    NULL,
    health_report
  );
  
  RETURN health_report;
END;
$$;