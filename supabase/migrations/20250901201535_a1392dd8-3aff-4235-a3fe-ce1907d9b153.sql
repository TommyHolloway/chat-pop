-- Enhanced PII Security and Monitoring System

-- Create function to encrypt PII data
CREATE OR REPLACE FUNCTION public.encrypt_pii_data(data_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash sensitive data for storage (one-way encryption for non-retrievable data)
  -- For production, this should use proper encryption with key management
  RETURN encode(digest(data_text || COALESCE(current_setting('app.settings.encryption_salt', true), 'default_salt'), 'sha256'), 'hex');
END;
$$;

-- Create function to log PII access with enhanced details
CREATE OR REPLACE FUNCTION public.log_pii_access(
  table_name text,
  operation_type text,
  record_id uuid DEFAULT NULL,
  pii_fields jsonb DEFAULT '[]'::jsonb,
  access_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    action,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    'PII_ACCESS: ' || upper(operation_type) || ' on ' || table_name,
    auth.uid(),
    jsonb_build_object(
      'table', table_name,
      'operation', operation_type,
      'record_id', record_id,
      'pii_fields_accessed', pii_fields,
      'access_reason', access_reason,
      'user_role', public.get_user_role_safe(auth.uid()),
      'session_info', jsonb_build_object(
        'ip', inet_client_addr(),
        'user_agent', COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
      ),
      'timestamp', now()
    ),
    inet_client_addr(),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown'),
    now()
  );
END;
$$;

-- Create trigger function for profiles PII monitoring
CREATE OR REPLACE FUNCTION public.monitor_profiles_pii_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pii_fields jsonb := '[]'::jsonb;
BEGIN
  -- Identify which PII fields are being accessed
  IF TG_OP = 'UPDATE' THEN
    -- Check which PII fields changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      pii_fields := pii_fields || '["email"]'::jsonb;
    END IF;
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      pii_fields := pii_fields || '["phone"]'::jsonb;
    END IF;
    IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
      pii_fields := pii_fields || '["display_name"]'::jsonb;
    END IF;
    
    PERFORM public.log_pii_access('profiles', 'UPDATE', NEW.id, pii_fields, 'Profile data update');
  ELSIF TG_OP = 'INSERT' THEN
    pii_fields := '["email", "phone", "display_name"]'::jsonb;
    PERFORM public.log_pii_access('profiles', 'INSERT', NEW.id, pii_fields, 'New profile creation');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function for leads PII monitoring
CREATE OR REPLACE FUNCTION public.monitor_leads_pii_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pii_fields jsonb := '[]'::jsonb;
  lead_pii_keys text[];
BEGIN
  -- Extract PII field keys from lead_data_json
  SELECT array_agg(key) INTO lead_pii_keys
  FROM jsonb_object_keys(COALESCE(NEW.lead_data_json, OLD.lead_data_json, '{}'::jsonb)) AS key
  WHERE key IN ('email', 'phone', 'name', 'company', 'address');
  
  pii_fields := to_jsonb(COALESCE(lead_pii_keys, ARRAY[]::text[]));
  
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_pii_access('leads', 'INSERT', NEW.id, pii_fields, 'Lead capture');
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_pii_access('leads', 'UPDATE', NEW.id, pii_fields, 'Lead data update');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create function to anonymize PII data for analytics
CREATE OR REPLACE FUNCTION public.anonymize_pii_for_analytics(
  email_input text DEFAULT NULL,
  phone_input text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'email_domain', CASE 
      WHEN email_input IS NOT NULL THEN split_part(email_input, '@', 2)
      ELSE NULL
    END,
    'phone_country_code', CASE
      WHEN phone_input IS NOT NULL AND phone_input LIKE '+%' THEN 
        substring(phone_input from 1 for 3)
      ELSE NULL
    END,
    'has_email', email_input IS NOT NULL,
    'has_phone', phone_input IS NOT NULL
  );
END;
$$;

-- Enhanced function to check suspicious PII access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_pii_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_activity RECORD;
BEGIN
  -- Check for unusual PII access patterns in last hour
  FOR suspicious_activity IN
    SELECT 
      user_id,
      COUNT(*) as access_count,
      array_agg(DISTINCT details->>'table') as tables_accessed
    FROM activity_logs
    WHERE action LIKE 'PII_ACCESS:%'
      AND created_at > NOW() - INTERVAL '1 hour'
      AND user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 50 -- More than 50 PII accesses in an hour
  LOOP
    -- Log security alert
    PERFORM public.log_security_event(
      'suspicious_pii_access_detected',
      suspicious_activity.user_id,
      jsonb_build_object(
        'access_count', suspicious_activity.access_count,
        'time_window', '1 hour',
        'tables_accessed', suspicious_activity.tables_accessed,
        'severity', 'high'
      )
    );
  END LOOP;
END;
$$;

-- Create triggers for PII monitoring (after insert/update)
DROP TRIGGER IF EXISTS profiles_pii_monitor_trigger ON public.profiles;
CREATE TRIGGER profiles_pii_monitor_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_profiles_pii_access();

DROP TRIGGER IF EXISTS leads_pii_monitor_trigger ON public.leads;
CREATE TRIGGER leads_pii_monitor_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_leads_pii_access();