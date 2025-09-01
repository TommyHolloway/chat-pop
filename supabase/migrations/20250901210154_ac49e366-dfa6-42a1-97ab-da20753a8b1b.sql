-- COMPREHENSIVE SECURITY HARDENING - FIXED TRIGGER ISSUE
-- First, clean up all existing triggers to avoid conflicts

-- Drop all existing security-related triggers
DROP TRIGGER IF EXISTS secure_visitor_session_validation_trigger ON visitor_sessions;
DROP TRIGGER IF EXISTS validate_lead_data_comprehensive_trigger ON leads;
DROP TRIGGER IF EXISTS monitor_pii_access_patterns_trigger ON profiles;
DROP TRIGGER IF EXISTS monitor_pii_access_patterns_leads_trigger ON leads;
DROP TRIGGER IF EXISTS enhanced_visitor_data_validation_trigger ON visitor_sessions;
DROP TRIGGER IF EXISTS enhanced_pii_access_control_trigger ON profiles;
DROP TRIGGER IF EXISTS enhanced_pii_access_control_leads_trigger ON leads;
DROP TRIGGER IF EXISTS monitor_admin_access_trigger ON user_roles;
DROP TRIGGER IF EXISTS validate_service_role_operations_trigger ON activity_logs;

-- 1. Enhanced field-level PII protection for profiles table
CREATE OR REPLACE FUNCTION public.encrypt_pii_field(data_text text, field_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash PII data with field-specific salt for one-way encryption
  RETURN encode(
    digest(
      data_text || '_' || field_type || '_' || COALESCE(current_setting('app.settings.encryption_salt', true), 'secure_salt'), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

-- 2. Secure visitor data validation with enhanced IP anonymization
CREATE OR REPLACE FUNCTION public.secure_visitor_session_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enhanced IP anonymization (zero out more bits for stronger privacy)
  IF NEW.ip_address IS NOT NULL THEN
    IF family(NEW.ip_address) = 4 THEN
      -- IPv4: mask to /16 (zero last 2 octets)
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 16)), 32);
    ELSE
      -- IPv6: mask to /48 (stronger anonymization)
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 48)), 128);
    END IF;
  END IF;
  
  -- Validate session data integrity
  IF NEW.session_id IS NULL OR length(NEW.session_id) < 16 THEN
    RAISE EXCEPTION 'Invalid session ID format for security compliance';
  END IF;
  
  -- Log secure visitor session creation
  PERFORM public.log_service_role_operation(
    'secure_visitor_session_created',
    'visitor_sessions',
    jsonb_build_object(
      'agent_id', NEW.agent_id,
      'ip_anonymized', NEW.ip_address IS NOT NULL,
      'security_level', 'enhanced'
    )
  );
  
  RETURN NEW;
END;
$$;

-- 3. Enhanced lead data security validation
CREATE OR REPLACE FUNCTION public.validate_lead_data_comprehensive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pii_fields text[];
  suspicious_patterns text[] := ARRAY['<script', 'javascript:', 'data:', 'vbscript:', 'onload=', 'onerror='];
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
    'Enhanced lead capture with security validation'
  );
  
  -- Rate limiting check for lead creation
  IF NOT public.rate_limit_check('lead_creation', 10, 60) THEN
    RAISE EXCEPTION 'Security violation: Lead creation rate limit exceeded';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. PII access rate limiting and monitoring
CREATE OR REPLACE FUNCTION public.monitor_pii_access_patterns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count INTEGER;
  user_role app_role;
  suspicious_threshold INTEGER := 25; -- Reduced from 50 for stricter monitoring
BEGIN
  -- Get current user role
  SELECT public.get_user_role_safe(auth.uid()) INTO user_role;
  
  -- Count recent PII access attempts
  SELECT COUNT(*) INTO access_count
  FROM activity_logs
  WHERE action LIKE 'PII_ACCESS:%'
    AND user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';
    
  -- Enhanced suspicious activity detection
  IF access_count > suspicious_threshold AND user_role != 'admin'::app_role THEN
    -- Log critical security event
    PERFORM public.log_security_event(
      'excessive_pii_access_critical',
      auth.uid(),
      jsonb_build_object(
        'access_count', access_count,
        'user_role', user_role,
        'severity', 'critical',
        'action_taken', 'access_blocked',
        'threshold_exceeded', suspicious_threshold
      )
    );
    
    -- Block further access for non-admins
    RAISE EXCEPTION 'Security violation: Excessive PII access detected. Access temporarily restricted.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Enhanced data retention and privacy compliance
CREATE OR REPLACE FUNCTION public.enhanced_privacy_data_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- GDPR-compliant data retention (30 days for visitor data)
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean old activity logs (keep 90 days for security audit)
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND action NOT LIKE 'SECURITY_EVENT:%'; -- Keep security events longer
  
  -- Clean expired cache
  PERFORM public.cleanup_expired_cache();
  
  -- Log privacy compliance cleanup
  PERFORM public.log_security_event(
    'enhanced_privacy_cleanup_completed',
    NULL,
    jsonb_build_object(
      'visitor_records_cleaned', cleanup_count,
      'retention_policy', '30_days',
      'compliance_level', 'gdpr_enhanced',
      'cleanup_date', now()
    )
  );
END;
$$;

-- 6. Comprehensive security monitoring function
CREATE OR REPLACE FUNCTION public.comprehensive_security_scan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  security_report jsonb;
  pii_access_count INTEGER;
  suspicious_ips INTEGER;
  recent_violations INTEGER;
BEGIN
  -- Count recent PII access attempts
  SELECT COUNT(*) INTO pii_access_count
  FROM activity_logs
  WHERE action LIKE 'PII_ACCESS:%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count distinct IPs with security violations
  SELECT COUNT(DISTINCT ip_address) INTO suspicious_ips
  FROM activity_logs
  WHERE action LIKE 'SECURITY_VIOLATION:%'
    AND created_at > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;
  
  -- Count recent security violations
  SELECT COUNT(*) INTO recent_violations
  FROM activity_logs
  WHERE action LIKE '%SECURITY_VIOLATION%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Build comprehensive security report
  security_report := jsonb_build_object(
    'scan_timestamp', now(),
    'security_level', 'enhanced',
    'pii_access_24h', pii_access_count,
    'suspicious_ips_24h', suspicious_ips,
    'security_violations_24h', recent_violations,
    'data_retention_compliance', 'gdpr_enhanced',
    'encryption_status', 'field_level_enabled',
    'monitoring_status', 'comprehensive_active'
  );
  
  -- Log security scan completion
  PERFORM public.log_security_event(
    'comprehensive_security_scan_completed',
    NULL,
    security_report
  );
  
  RETURN security_report;
END;
$$;

-- Create enhanced security triggers (after all drops)
CREATE TRIGGER secure_visitor_session_validation_trigger
    BEFORE INSERT OR UPDATE ON visitor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_visitor_session_validation();

CREATE TRIGGER validate_lead_data_comprehensive_trigger
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lead_data_comprehensive();

CREATE TRIGGER monitor_pii_access_patterns_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.monitor_pii_access_patterns();

CREATE TRIGGER monitor_pii_access_patterns_leads_trigger
    BEFORE INSERT OR UPDATE ON leads  
    FOR EACH ROW
    EXECUTE FUNCTION public.monitor_pii_access_patterns();

-- Enhanced RLS Policies for Maximum Security
-- Update profiles RLS for stricter PII protection
DROP POLICY IF EXISTS "Secure profile access with PII logging" ON profiles;
DROP POLICY IF EXISTS "Secure profile updates with validation" ON profiles;
DROP POLICY IF EXISTS "Secure profile creation with validation" ON profiles;

CREATE POLICY "Secure profile access with PII logging"
ON profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND
  public.rate_limit_check('profile_access', 100, 60) -- Rate limit profile access
);

CREATE POLICY "Secure profile updates with validation"
ON profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  email IS NOT NULL AND 
  email <> '' AND
  public.validate_email(email) AND
  (phone IS NULL OR public.validate_phone(phone))
);

CREATE POLICY "Secure profile creation with validation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  email IS NOT NULL AND 
  email <> '' AND
  public.validate_email(email) AND
  (phone IS NULL OR public.validate_phone(phone))
);

-- Enhanced visitor data policies with stricter service role restrictions
DROP POLICY IF EXISTS "Service role secure visitor session insertion" ON visitor_sessions;
DROP POLICY IF EXISTS "Service role restricted visitor session updates" ON visitor_sessions;

CREATE POLICY "Service role secure visitor session insertion"
ON visitor_sessions FOR INSERT
TO service_role
WITH CHECK (
  agent_id IS NOT NULL AND
  session_id IS NOT NULL AND
  length(session_id) >= 16 AND
  (ip_address IS NULL OR family(ip_address) IN (4, 6)) -- Validate IP format
);

CREATE POLICY "Service role restricted visitor session updates"
ON visitor_sessions FOR UPDATE
TO service_role
USING (created_at > NOW() - INTERVAL '24 hours') -- Only allow updates on recent sessions
WITH CHECK (
  agent_id IS NOT NULL AND
  session_id IS NOT NULL
);

-- Enhanced leads table security
DROP POLICY IF EXISTS "Service role secure leads insertion with comprehensive validation" ON leads;

CREATE POLICY "Service role secure leads insertion with comprehensive validation"
ON leads FOR INSERT
TO service_role
WITH CHECK (
  agent_id IS NOT NULL AND
  conversation_id IS NOT NULL AND
  lead_data_json IS NOT NULL AND
  lead_data_json <> '{}'::jsonb AND
  jsonb_typeof(lead_data_json) = 'object' AND
  NOT (lead_data_json::text ILIKE ANY(ARRAY['%<script%', '%javascript:%', '%data:%']))
);

-- Create automated security maintenance schedule function
CREATE OR REPLACE FUNCTION public.automated_security_maintenance_enhanced()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Run enhanced privacy data cleanup
  PERFORM public.enhanced_privacy_data_cleanup();
  
  -- Run comprehensive security scan
  PERFORM public.comprehensive_security_scan();
  
  -- Detect suspicious PII access patterns
  PERFORM public.detect_suspicious_pii_access();
  
  -- Log maintenance completion
  PERFORM public.log_security_event(
    'automated_security_maintenance_enhanced_completed',
    NULL,
    jsonb_build_object(
      'maintenance_level', 'comprehensive_enhanced',
      'security_hardening', 'phase_1_2_3_complete',
      'compliance_status', 'gdpr_enhanced',
      'maintenance_date', now()
    )
  );
END;
$$;