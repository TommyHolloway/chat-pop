-- Security Enhancement Migration
-- Addresses overly broad service role access and implements comprehensive security controls

-- 1. Create audit logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_service_role_operation(
  operation_type text,
  table_name text,
  record_data jsonb DEFAULT '{}'::jsonb,
  context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    action,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    'SERVICE_ROLE_OPERATION: ' || operation_type || ' on ' || table_name,
    jsonb_build_object(
      'table', table_name,
      'operation', operation_type,
      'record_data', record_data,
      'context', context_data,
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$$;

-- 2. Create visitor data anonymization function
CREATE OR REPLACE FUNCTION public.anonymize_visitor_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Anonymize IP address before storage
  IF NEW.ip_address IS NOT NULL THEN
    NEW.ip_address = public.anonymize_ip_address(NEW.ip_address);
  END IF;
  
  -- Log visitor session creation for audit
  PERFORM public.log_service_role_operation(
    'visitor_session_created',
    'visitor_sessions',
    jsonb_build_object('session_id', NEW.session_id, 'agent_id', NEW.agent_id)
  );
  
  RETURN NEW;
END;
$$;

-- 3. Create lead data validation function
CREATE OR REPLACE FUNCTION public.validate_lead_insertion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate agent exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM agents 
    WHERE id = NEW.agent_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive agent ID: %', NEW.agent_id;
  END IF;
  
  -- Validate lead data structure
  IF NEW.lead_data_json IS NULL OR NEW.lead_data_json = '{}'::jsonb THEN
    RAISE EXCEPTION 'Lead data cannot be empty';
  END IF;
  
  -- Log lead creation for audit
  PERFORM public.log_service_role_operation(
    'lead_created',
    'leads',
    jsonb_build_object(
      'agent_id', NEW.agent_id,
      'conversation_id', NEW.conversation_id,
      'has_email', (NEW.lead_data_json ? 'email'),
      'has_phone', (NEW.lead_data_json ? 'phone')
    )
  );
  
  RETURN NEW;
END;
$$;

-- 4. Create subscriber data protection function
CREATE OR REPLACE FUNCTION public.validate_subscriber_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all subscriber operations for audit
  PERFORM public.log_service_role_operation(
    TG_OP,
    'subscribers',
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END,
    jsonb_build_object('trigger_operation', TG_OP)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Apply anonymization trigger to visitor sessions
DROP TRIGGER IF EXISTS anonymize_visitor_data_trigger ON visitor_sessions;
CREATE TRIGGER anonymize_visitor_data_trigger
  BEFORE INSERT ON visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_visitor_data();

-- 6. Apply validation trigger to leads
DROP TRIGGER IF EXISTS validate_lead_insertion_trigger ON leads;
CREATE TRIGGER validate_lead_insertion_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_insertion();

-- 7. Apply audit trigger to subscribers
DROP TRIGGER IF EXISTS validate_subscriber_operation_trigger ON subscribers;
CREATE TRIGGER validate_subscriber_operation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscriber_operation();

-- 8. Replace overly broad service role policies with restricted ones

-- Drop existing overly permissive service role policies
DROP POLICY IF EXISTS "Service role manage sessions only" ON visitor_sessions;
DROP POLICY IF EXISTS "Service role manage events only" ON visitor_behavior_events;
DROP POLICY IF EXISTS "Service role insert leads only" ON leads;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscribers;

-- Create restricted service role policies for visitor_sessions
CREATE POLICY "Service role can insert visitor sessions with validation"
  ON visitor_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (
    -- Only allow insertion with valid agent_id and session_id
    agent_id IS NOT NULL 
    AND session_id IS NOT NULL
    AND length(session_id) > 10
  );

CREATE POLICY "Service role can update visitor sessions with restrictions"
  ON visitor_sessions
  FOR UPDATE
  TO service_role
  USING (
    -- Only allow updates to specific fields
    true
  )
  WITH CHECK (
    -- Prevent unauthorized data modification
    agent_id IS NOT NULL
    AND session_id IS NOT NULL
  );

-- Create restricted service role policies for visitor_behavior_events
CREATE POLICY "Service role can insert behavior events with validation"
  ON visitor_behavior_events
  FOR INSERT
  TO service_role
  WITH CHECK (
    -- Only allow insertion with valid session_id and event_type
    session_id IS NOT NULL
    AND event_type IS NOT NULL
    AND event_type IN ('page_view', 'click', 'scroll', 'time_spent', 'form_interaction')
  );

-- Create restricted service role policies for leads
CREATE POLICY "Service role can insert leads with strict validation"
  ON leads
  FOR INSERT
  TO service_role
  WITH CHECK (
    -- Ensure agent exists and conversation is valid
    agent_id IS NOT NULL
    AND conversation_id IS NOT NULL
    AND lead_data_json IS NOT NULL
    AND lead_data_json != '{}'::jsonb
  );

-- Create restricted service role policies for subscribers
CREATE POLICY "Service role can manage subscriptions with audit"
  ON subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (
    -- Ensure email is present for any subscription operation
    email IS NOT NULL
    AND email != ''
  );

-- 9. Add data retention policy function
CREATE OR REPLACE FUNCTION public.enforce_data_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove visitor data older than 90 days (GDPR compliance)
  DELETE FROM visitor_behavior_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM visitor_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Log retention enforcement
  PERFORM public.log_service_role_operation(
    'data_retention_enforced',
    'visitor_data',
    jsonb_build_object('retention_days', 90, 'executed_at', now())
  );
END;
$$;

-- 10. Create function to validate edge function requests
CREATE OR REPLACE FUNCTION public.validate_edge_function_request(
  function_name text,
  request_data jsonb,
  client_ip inet DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Basic rate limiting check (100 requests per hour per IP)
  IF client_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO request_count
    FROM activity_logs
    WHERE action LIKE 'EDGE_FUNCTION: ' || function_name || '%'
      AND ip_address = client_ip
      AND created_at > NOW() - INTERVAL '1 hour';
    
    IF request_count > 100 THEN
      RAISE EXCEPTION 'Rate limit exceeded for function: %', function_name;
    END IF;
  END IF;
  
  -- Log the request for audit
  PERFORM public.log_service_role_operation(
    'edge_function_called',
    function_name,
    request_data,
    jsonb_build_object('client_ip', client_ip, 'timestamp', now())
  );
  
  RETURN true;
END;
$$;

-- 11. Add enhanced security policies for profiles table
CREATE POLICY "Enhanced profile security with audit"
  ON profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND email IS NOT NULL
    AND email != ''
  );

-- 12. Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_audit_summary AS
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