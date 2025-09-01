-- Enhanced security functions for stricter access control (fixed variable names)

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
  user_app_role app_role;
  access_count INTEGER;
BEGIN
  -- Get current user role if not provided
  IF user_role IS NULL THEN
    SELECT public.get_user_role_safe(auth.uid()) INTO user_app_role;
  ELSE
    user_app_role := user_role;
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
    IF access_count > 30 AND user_app_role != 'admin'::app_role THEN
      PERFORM public.log_security_event(
        'suspicious_sensitive_data_access',
        auth.uid(),
        jsonb_build_object(
          'table_accessed', table_name,
          'operation_type', operation_type,
          'access_count_1h', access_count,
          'user_role', user_app_role,
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
  user_app_role app_role;
BEGIN
  SELECT public.get_user_role_safe(auth.uid()) INTO user_app_role;
  
  -- Count PII fields in the data
  FOR pii_field IN SELECT jsonb_object_keys(data_fields)
  LOOP
    IF pii_field IN ('email', 'phone', 'name', 'address', 'ssn', 'credit_card', 'display_name') THEN
      pii_count := pii_count + 1;
    END IF;
  END LOOP;
  
  -- If accessing multiple PII fields, enforce stricter controls
  IF pii_count > 2 AND user_app_role != 'admin'::app_role THEN
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
        'user_role', user_app_role,
        'severity', 'high'
      )
    );
  END IF;
  
  RETURN TRUE;
END;
$$;