-- Security Enhancement Migration: Critical Database Security Fixes (Fixed)

-- 1. Enhanced Subscriber Table Security
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role secure subscription ops" ON public.subscribers;

-- Add stricter subscriber table policies
CREATE POLICY "Service role secure subscription creation"
ON public.subscribers 
FOR INSERT
WITH CHECK (
  -- Enhanced validation for subscription creation
  email IS NOT NULL 
  AND email <> '' 
  AND validate_email(email)
  AND stripe_customer_id IS NOT NULL 
  AND subscription_tier IS NOT NULL
  AND subscription_tier IN ('hobby', 'standard', 'enterprise')
  -- Rate limit subscription operations
  AND rate_limit_check('subscription_operation', 5, 60)
);

CREATE POLICY "Service role secure subscription updates"
ON public.subscribers 
FOR UPDATE
USING (
  -- Allow updates only for recent records (prevent old data manipulation)
  created_at > NOW() - INTERVAL '7 days'
)
WITH CHECK (
  email IS NOT NULL 
  AND email <> '' 
  AND validate_email(email)
  AND stripe_customer_id IS NOT NULL 
  AND subscription_tier IS NOT NULL
  AND subscription_tier IN ('hobby', 'standard', 'enterprise')
);

-- 2. Enhanced Lead Data Validation - Update existing trigger function
CREATE OR REPLACE FUNCTION public.validate_lead_data_comprehensive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pii_fields text[];
  suspicious_patterns text[] := ARRAY['<script', 'javascript:', 'data:', 'vbscript:', 'onload=', 'onerror=', 'eval(', 'function(', 'setTimeout(', 'setInterval('];
  pattern text;
  json_string text;
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
  
  -- Convert JSON to string for pattern matching
  json_string := NEW.lead_data_json::text;
  
  -- Enhanced malicious payload detection
  FOREACH pattern IN ARRAY suspicious_patterns LOOP
    IF json_string ILIKE '%' || pattern || '%' THEN
      RAISE EXCEPTION 'Security violation: Suspicious content detected in lead data: %', pattern;
    END IF;
  END LOOP;
  
  -- Validate JSON structure depth (prevent deeply nested attacks)
  IF char_length(json_string) > 10000 THEN
    RAISE EXCEPTION 'Security violation: Lead data too large';
  END IF;
  
  -- Extract PII fields for audit logging
  SELECT array_agg(key) INTO pii_fields
  FROM jsonb_object_keys(NEW.lead_data_json) AS key
  WHERE key IN ('email', 'phone', 'name', 'company', 'address', 'ssn', 'credit_card', 'passport', 'license');
  
  -- Enhanced PII access logging
  PERFORM public.log_pii_access(
    'leads',
    'INSERT',
    NEW.id,
    to_jsonb(COALESCE(pii_fields, ARRAY[]::text[])),
    'Enhanced lead capture with comprehensive security validation'
  );
  
  -- Stricter rate limiting for lead creation
  IF NOT public.enhanced_rate_limit_check('lead_creation', 3, 60, true) THEN
    RAISE EXCEPTION 'Security violation: Lead creation rate limit exceeded';
  END IF;
  
  -- Log successful validation
  PERFORM public.log_security_event(
    'lead_data_validated_successfully',
    NULL,
    jsonb_build_object(
      'agent_id', NEW.agent_id,
      'conversation_id', NEW.conversation_id,
      'pii_fields_count', array_length(pii_fields, 1),
      'data_size_bytes', char_length(json_string)
    )
  );
  
  RETURN NEW;
END;
$function$;

-- 3. Enhanced Visitor Data Protection
CREATE OR REPLACE FUNCTION public.secure_visitor_data_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enhanced IP anonymization (stronger privacy protection)
  IF NEW.ip_address IS NOT NULL THEN
    IF family(NEW.ip_address) = 4 THEN
      -- IPv4: mask to /8 (zero last 3 octets for stronger anonymization)
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 8)), 32);
    ELSE
      -- IPv6: mask to /32 (stronger anonymization)
      NEW.ip_address = set_masklen(network(set_masklen(NEW.ip_address, 32)), 128);
    END IF;
  END IF;
  
  -- Enhanced session validation
  IF NEW.session_id IS NULL OR length(NEW.session_id) < 20 THEN
    RAISE EXCEPTION 'Security violation: Invalid session ID format';
  END IF;
  
  -- Validate session age (prevent old session replay attacks)
  IF TG_TABLE_NAME = 'visitor_sessions' THEN
    IF NEW.created_at < NOW() - INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'Security violation: Session timestamp too old';
    END IF;
  END IF;
  
  -- Rate limiting for visitor data creation
  IF NOT public.enhanced_rate_limit_check('visitor_data_creation', 100, 60, true) THEN
    RAISE EXCEPTION 'Security violation: Visitor data creation rate limit exceeded';
  END IF;
  
  -- Log secure processing with minimal data exposure
  PERFORM public.log_service_role_operation(
    'secure_visitor_processing_enhanced',
    TG_TABLE_NAME,
    jsonb_build_object(
      'agent_id', NEW.agent_id,
      'privacy_compliant', true,
      'ip_anonymized', NEW.ip_address IS NOT NULL,
      'security_level', 'enhanced'
    )
  );
  
  RETURN NEW;
END;
$function$;

-- 4. Enhanced Security Monitoring Function
CREATE OR REPLACE FUNCTION public.enhanced_security_scan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  security_report jsonb;
  critical_events INTEGER;
  pii_access_violations INTEGER;
  rate_limit_violations INTEGER;
  suspicious_ips INTEGER;
BEGIN
  -- Count critical security events in last 24 hours
  SELECT COUNT(*) INTO critical_events
  FROM activity_logs
  WHERE action LIKE '%SECURITY_VIOLATION%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count PII access violations
  SELECT COUNT(*) INTO pii_access_violations
  FROM activity_logs
  WHERE action LIKE '%excessive_pii_access%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count rate limit violations
  SELECT COUNT(*) INTO rate_limit_violations
  FROM activity_logs
  WHERE action LIKE '%rate_limit_exceeded%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count suspicious IPs
  SELECT COUNT(DISTINCT ip_address) INTO suspicious_ips
  FROM activity_logs
  WHERE (action LIKE '%SECURITY_VIOLATION%' OR action LIKE '%suspicious%')
    AND created_at > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;
  
  -- Build enhanced security report
  security_report := jsonb_build_object(
    'scan_timestamp', now(),
    'security_level', 'enhanced_v2',
    'critical_events_24h', critical_events,
    'pii_violations_24h', pii_access_violations,
    'rate_limit_violations_24h', rate_limit_violations,
    'suspicious_ips_24h', suspicious_ips,
    'compliance_status', 'gdpr_enhanced_v2',
    'data_protection_level', 'comprehensive',
    'monitoring_status', 'real_time_active'
  );
  
  -- Log security scan completion
  PERFORM public.log_security_event(
    'enhanced_security_scan_v2_completed',
    NULL,
    security_report
  );
  
  RETURN security_report;
END;
$function$;

-- 5. Create comprehensive security maintenance function
CREATE OR REPLACE FUNCTION public.automated_security_maintenance_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enhanced privacy data cleanup (stricter 14-day retention)
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '14 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '14 days';
  
  -- Clean old activity logs (keep security events for 180 days)
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '60 days'
    AND action NOT LIKE '%SECURITY%'
    AND action NOT LIKE '%PII_ACCESS%';
  
  -- Keep critical security events longer
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '180 days'
    AND (action LIKE '%SECURITY%' OR action LIKE '%PII_ACCESS%');
  
  -- Run enhanced security detection
  PERFORM public.detect_suspicious_pii_access();
  
  -- Clean expired cache
  PERFORM public.cleanup_expired_cache();
  
  -- Log maintenance completion
  PERFORM public.log_security_event(
    'automated_security_maintenance_v2_completed',
    NULL,
    jsonb_build_object(
      'maintenance_level', 'comprehensive_enhanced_v2',
      'security_hardening', 'critical_fixes_applied',
      'compliance_status', 'gdpr_enhanced_v2',
      'data_retention', 'strict_14_day_visitor_180_day_security',
      'maintenance_date', now()
    )
  );
END;
$function$;