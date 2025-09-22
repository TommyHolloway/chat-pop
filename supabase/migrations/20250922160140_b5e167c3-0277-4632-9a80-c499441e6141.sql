-- Enhanced security monitoring: Create function to detect rapid login attempts
CREATE OR REPLACE FUNCTION public.detect_rapid_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_ips RECORD;
BEGIN
  -- Check for more than 10 login attempts from same IP in 5 minutes
  FOR suspicious_ips IN
    SELECT 
      ip_address,
      COUNT(*) as attempt_count
    FROM activity_logs
    WHERE action LIKE '%login%'
      AND created_at > NOW() - INTERVAL '5 minutes'
      AND ip_address IS NOT NULL
    GROUP BY ip_address
    HAVING COUNT(*) > 10
  LOOP
    -- Log security alert for rapid login attempts
    PERFORM public.log_security_event(
      'rapid_login_attempts_detected',
      NULL,
      jsonb_build_object(
        'ip_address', suspicious_ips.ip_address,
        'attempt_count', suspicious_ips.attempt_count,
        'time_window', '5 minutes',
        'severity', 'critical',
        'threat_type', 'brute_force_attack'
      )
    );
  END LOOP;
END;
$$;

-- Enhanced visitor data protection: Strengthen IP anonymization
CREATE OR REPLACE FUNCTION public.enhanced_ip_anonymization(ip_addr inet)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- More aggressive IP anonymization for stronger privacy
  IF ip_addr IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- IPv4: mask to /16 (zero last 2 octets) - stronger than previous /24
  IF family(ip_addr) = 4 THEN
    RETURN set_masklen(network(set_masklen(ip_addr, 16)), 32);
  -- IPv6: mask to /48 (stronger anonymization than /64)
  ELSE
    RETURN set_masklen(network(set_masklen(ip_addr, 48)), 128);
  END IF;
END;
$$;

-- Create comprehensive security health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  health_report jsonb;
  tables_without_rls INTEGER;
  critical_events_24h INTEGER;
  failed_logins_1h INTEGER;
  suspicious_activity INTEGER;
BEGIN
  -- Check for tables without RLS (should be 0 for security)
  SELECT COUNT(*) INTO tables_without_rls
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
  
  -- Count critical security events in last 24 hours
  SELECT COUNT(*) INTO critical_events_24h
  FROM activity_logs
  WHERE action LIKE '%SECURITY_VIOLATION%'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count failed login attempts in last hour
  SELECT COUNT(*) INTO failed_logins_1h
  FROM activity_logs
  WHERE action LIKE '%login_failed%'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Count suspicious activity patterns
  SELECT COUNT(*) INTO suspicious_activity
  FROM activity_logs
  WHERE (action LIKE '%suspicious%' OR action LIKE '%excessive%')
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Build comprehensive health report
  health_report := jsonb_build_object(
    'timestamp', now(),
    'overall_status', CASE 
      WHEN tables_without_rls = 0 AND critical_events_24h < 5 AND failed_logins_1h < 10 THEN 'healthy'
      WHEN tables_without_rls > 0 OR critical_events_24h > 10 THEN 'critical'
      ELSE 'warning'
    END,
    'tables_without_rls', tables_without_rls,
    'critical_events_24h', critical_events_24h,
    'failed_logins_1h', failed_logins_1h,
    'suspicious_activity_24h', suspicious_activity,
    'rls_coverage', CASE WHEN tables_without_rls = 0 THEN 'complete' ELSE 'incomplete' END,
    'monitoring_active', true,
    'privacy_compliance', 'gdpr_enhanced',
    'security_version', 'v2.1'
  );
  
  -- Log health check
  PERFORM public.log_security_event(
    'security_health_check_completed',
    NULL,
    health_report
  );
  
  RETURN health_report;
END;
$$;

-- Enhanced security monitoring for failed authentication attempts
CREATE OR REPLACE FUNCTION public.monitor_authentication_failures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_failures INTEGER;
  client_ip inet;
BEGIN
  -- Only monitor authentication-related events
  IF TG_OP = 'INSERT' AND NEW.action LIKE '%auth%' THEN
    client_ip := NEW.ip_address;
    
    -- Count recent authentication failures from this IP
    SELECT COUNT(*) INTO recent_failures
    FROM activity_logs
    WHERE action LIKE '%auth%fail%'
      AND ip_address = client_ip
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Alert on suspicious authentication patterns
    IF recent_failures >= 5 THEN
      PERFORM public.log_security_event(
        'suspicious_authentication_pattern',
        NEW.user_id,
        jsonb_build_object(
          'ip_address', client_ip,
          'failure_count', recent_failures,
          'time_window', '15 minutes',
          'severity', 'high',
          'threat_type', 'authentication_attack'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for authentication monitoring (drop if exists first)
DROP TRIGGER IF EXISTS monitor_authentication_failures ON activity_logs;
CREATE TRIGGER monitor_authentication_failures
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_authentication_failures();

-- Function to populate daily security audit data
CREATE OR REPLACE FUNCTION public.generate_daily_security_audit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_data RECORD;
BEGIN
  -- Calculate daily security metrics
  SELECT 
    COUNT(*) as total_ops,
    COUNT(*) FILTER (WHERE action LIKE 'SERVICE_ROLE_OPERATION:%') as service_ops,
    COUNT(*) FILTER (WHERE action LIKE '%SECURITY%') as security_events,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(*) FILTER (WHERE action LIKE '%lead%') as lead_ops,
    COUNT(*) FILTER (WHERE action LIKE '%visitor%') as visitor_ops,
    COUNT(*) FILTER (WHERE action LIKE '%SECURITY_VIOLATION%') as critical_events,
    COUNT(*) FILTER (WHERE action LIKE 'PII_ACCESS:%') as pii_events
  INTO audit_data
  FROM activity_logs
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Insert or update daily audit record (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
    INSERT INTO public.security_audit_logs (
      audit_date, total_operations, service_role_ops, security_events,
      unique_ips, lead_operations, visitor_operations, critical_events, pii_access_events
    ) VALUES (
      CURRENT_DATE, audit_data.total_ops, audit_data.service_ops, audit_data.security_events,
      audit_data.unique_ips, audit_data.lead_ops, audit_data.visitor_ops, 
      audit_data.critical_events, audit_data.pii_events
    )
    ON CONFLICT (audit_date) 
    DO UPDATE SET
      total_operations = EXCLUDED.total_operations,
      service_role_ops = EXCLUDED.service_role_ops,
      security_events = EXCLUDED.security_events,
      unique_ips = EXCLUDED.unique_ips,
      lead_operations = EXCLUDED.lead_operations,
      visitor_operations = EXCLUDED.visitor_operations,
      critical_events = EXCLUDED.critical_events,
      pii_access_events = EXCLUDED.pii_access_events,
      updated_at = now();
  END IF;
END;
$$;