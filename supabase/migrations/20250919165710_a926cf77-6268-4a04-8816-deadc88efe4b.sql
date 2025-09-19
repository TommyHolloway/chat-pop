-- Drop and recreate the function with correct parameters to fix INSERT errors
DROP FUNCTION IF EXISTS public.enhanced_rate_limit_check(text,integer,integer,boolean);

-- Recreate the function as VOLATILE to allow INSERT operations
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(operation_key text, max_operations integer DEFAULT 10, window_minutes integer DEFAULT 60, should_log boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  operation_count INTEGER;
BEGIN
  -- Count operations for the current user within the time window
  SELECT COUNT(*) INTO operation_count
  FROM activity_logs
  WHERE action LIKE '%' || operation_key || '%'
    AND user_id = auth.uid()
    AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Return false if rate limit exceeded
  IF operation_count >= max_operations THEN
    -- Only log if explicitly requested
    IF should_log THEN
      PERFORM public.log_security_event(
        'rate_limit_exceeded',
        auth.uid(),
        jsonb_build_object(
          'operation_key', operation_key,
          'count', operation_count,
          'max_allowed', max_operations,
          'window_minutes', window_minutes
        )
      );
    END IF;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fix the usage tracking schema to include missing fields that were causing errors
ALTER TABLE usage_tracking 
ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_credits_used integer DEFAULT 0;

-- Also fix other functions that might have the STABLE issue causing INSERT errors
CREATE OR REPLACE FUNCTION public.log_service_role_operation(operation_type text, table_name text, record_data jsonb DEFAULT '{}'::jsonb, context_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update the validate_edge_function_request to be VOLATILE
CREATE OR REPLACE FUNCTION public.validate_edge_function_request(function_name text, request_data jsonb, client_ip inet DEFAULT NULL::inet)
 RETURNS boolean
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;