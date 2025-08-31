-- Find and fix remaining security definer issues

-- Check for all functions with SECURITY DEFINER and update them if needed
-- The issue might be with some of the functions we created

-- Update log_service_role_operation to not use SECURITY DEFINER for view operations
CREATE OR REPLACE FUNCTION public.log_service_role_operation(
  operation_type text,
  table_name text,
  record_data jsonb DEFAULT '{}'::jsonb,
  context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
STABLE  -- Remove SECURITY DEFINER, make it STABLE instead
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

-- Update anonymize_visitor_data to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.anonymize_visitor_data()
RETURNS trigger
LANGUAGE plpgsql
STABLE
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

-- Update validate_lead_insertion to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.validate_lead_insertion()
RETURNS trigger
LANGUAGE plpgsql
STABLE
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

-- Update validate_subscriber_operation to not use SECURITY DEFINER  
CREATE OR REPLACE FUNCTION public.validate_subscriber_operation()
RETURNS trigger
LANGUAGE plpgsql
STABLE
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

-- Update enforce_data_retention to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.enforce_data_retention()
RETURNS void
LANGUAGE plpgsql
STABLE
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

-- Update validate_edge_function_request to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.validate_edge_function_request(
  function_name text,
  request_data jsonb,
  client_ip inet DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
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