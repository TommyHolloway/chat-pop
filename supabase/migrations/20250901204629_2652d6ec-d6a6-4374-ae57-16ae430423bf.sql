-- CRITICAL SECURITY HARDENING IMPLEMENTATION (Fixed)
-- Phase 1: Fix Data Exposure Issues

-- 1. Fix profiles table RLS policies (remove overly broad access)
DROP POLICY IF EXISTS "Block anonymous profile access" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access - users only" ON public.profiles;

-- Create strict, secure profiles policies
CREATE POLICY "Users can only view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can only update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND email IS NOT NULL AND email <> '');

CREATE POLICY "Users can only insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND email IS NOT NULL AND email <> '');

CREATE POLICY "Block anonymous profile access completely"
  ON public.profiles FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 2. Enhance subscribers table security (handle existing policies)
DROP POLICY IF EXISTS "Service role subscription management with audit" ON public.subscribers;
DROP POLICY IF EXISTS "Block anonymous subscription access" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription only" ON public.subscribers;
DROP POLICY IF EXISTS "Block all anonymous subscription access" ON public.subscribers;

-- Create more restrictive subscribers policies with unique names
CREATE POLICY "Block all anon subscription access"
  ON public.subscribers FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Users view own subscription data only"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role secure subscription ops"
  ON public.subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (
    email IS NOT NULL AND 
    email <> '' AND 
    stripe_customer_id IS NOT NULL AND
    subscription_tier IS NOT NULL
  );

-- 3. Enhanced lead data validation
CREATE OR REPLACE FUNCTION public.validate_lead_data_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate lead data contains required fields
  IF NEW.lead_data_json IS NULL OR NEW.lead_data_json = '{}'::jsonb THEN
    RAISE EXCEPTION 'Lead data cannot be empty';
  END IF;
  
  -- Ensure agent exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM agents 
    WHERE id = NEW.agent_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive agent ID: %', NEW.agent_id;
  END IF;
  
  -- Log PII access for lead creation
  PERFORM public.log_pii_access(
    'leads',
    'INSERT',
    NEW.id,
    (SELECT array_agg(key) FROM jsonb_object_keys(NEW.lead_data_json) AS key WHERE key IN ('email', 'phone', 'name', 'company'))::jsonb,
    'Lead capture with enhanced validation'
  );
  
  RETURN NEW;
END;
$$;

-- Apply enhanced lead validation trigger
DROP TRIGGER IF EXISTS validate_lead_data_security_trigger ON public.leads;
CREATE TRIGGER validate_lead_data_security_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_data_security();

-- 4. Enhanced visitor data protection
CREATE OR REPLACE FUNCTION public.secure_visitor_data_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Enhanced IP anonymization
  IF NEW.ip_address IS NOT NULL THEN
    NEW.ip_address = public.anonymize_ip_address(NEW.ip_address);
  END IF;
  
  -- Privacy compliance check
  IF TG_TABLE_NAME = 'visitor_sessions' THEN
    IF NEW.created_at < NOW() - INTERVAL '30 days' THEN
      RAISE EXCEPTION 'Cannot create visitor session older than 30 days for privacy compliance';
    END IF;
  END IF;
  
  -- Log secure processing
  PERFORM public.log_service_role_operation(
    'secure_visitor_processing',
    TG_TABLE_NAME,
    jsonb_build_object(
      'session_id', NEW.session_id,
      'agent_id', NEW.agent_id,
      'privacy_compliant', true,
      'ip_anonymized', NEW.ip_address IS NOT NULL
    )
  );
  
  RETURN NEW;
END;
$$;

-- Apply secure visitor data processing
DROP TRIGGER IF EXISTS secure_visitor_data_trigger ON public.visitor_sessions;
CREATE TRIGGER secure_visitor_data_trigger
  BEFORE INSERT OR UPDATE ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_visitor_data_processing();

-- 5. Deploy all critical security triggers
DROP TRIGGER IF EXISTS enhanced_pii_access_control_trigger ON public.profiles;
CREATE TRIGGER enhanced_pii_access_control_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.enhanced_pii_access_control();

DROP TRIGGER IF EXISTS enhanced_pii_access_control_leads_trigger ON public.leads;
CREATE TRIGGER enhanced_pii_access_control_leads_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.enhanced_pii_access_control();

DROP TRIGGER IF EXISTS monitor_admin_access_trigger ON public.user_roles;
CREATE TRIGGER monitor_admin_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_admin_access();

DROP TRIGGER IF EXISTS validate_service_role_operations_trigger ON public.activity_logs;
CREATE TRIGGER validate_service_role_operations_trigger
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_role_operations();

-- 6. Automated security maintenance
CREATE OR REPLACE FUNCTION public.comprehensive_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clean up old visitor data (30 days retention)
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old activity logs (90 days for security audit)
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Run security detection
  PERFORM public.detect_suspicious_pii_access();
  
  -- Clean cache
  PERFORM public.cleanup_expired_cache();
  
  -- Log completion
  PERFORM public.log_security_event(
    'comprehensive_security_maintenance_completed',
    NULL,
    jsonb_build_object(
      'maintenance_date', now(),
      'security_level', 'enhanced'
    )
  );
END;
$$;

-- Log successful deployment
INSERT INTO public.activity_logs (action, details, created_at)
VALUES (
  'SECURITY_HARDENING_DEPLOYED_V2',
  jsonb_build_object(
    'version', '2.0',
    'deployment_date', now(),
    'fixes_applied', jsonb_build_array(
      'profiles_rls_secured',
      'subscribers_access_restricted', 
      'security_triggers_active',
      'lead_validation_enhanced',
      'visitor_data_protected',
      'automated_maintenance_ready'
    ),
    'security_status', 'hardened'
  ),
  now()
);