-- Fix database functions that are causing INSERT errors
-- The main issue is functions are marked as STABLE/IMMUTABLE but trying to do INSERTs

-- Fix the rate_limit_check function to be VOLATILE
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

-- Fix the usage tracking schema to include missing fields
ALTER TABLE usage_tracking 
ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_credits_used integer DEFAULT 0;

-- Update the check_user_plan_limits function to handle the new schema
CREATE OR REPLACE FUNCTION public.check_user_plan_limits(p_user_id uuid, p_feature_type text, p_agent_id uuid DEFAULT NULL::uuid, p_file_size bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_plan TEXT;
  current_usage_record RECORD;
  limits RECORD;
  result JSONB;
BEGIN
  -- Get user's current plan
  SELECT COALESCE(plan, 'free') INTO user_plan
  FROM profiles 
  WHERE user_id = p_user_id;

  -- Define plan limits (including workspace limits)
  CASE user_plan
    WHEN 'hobby' THEN
      limits := ROW(2000, 2, 20, 5368709120, 3)::RECORD; -- 2000 credits, 2 agents, 20 links, 5GB, 3 workspaces
    WHEN 'standard' THEN
      limits := ROW(-1, 5, -1, 53687091200, -1)::RECORD; -- unlimited credits, 5 agents, unlimited links, 50GB, unlimited workspaces
    ELSE
      limits := ROW(100, 1, 5, 1073741824, 1)::RECORD; -- 100 credits, 1 agent, 5 links, 1GB, 1 workspace
  END CASE;

  -- Get current month usage with all fields
  SELECT 
    COALESCE(message_credits_used, 0) as message_credits_used,
    COALESCE(storage_used_bytes, 0) as storage_used_bytes,
    COALESCE(messages_count, 0) as messages_count,
    COALESCE(conversations_count, 0) as conversations_count
  INTO current_usage_record
  FROM usage_tracking 
  WHERE user_id = p_user_id 
    AND month = date_trunc('month', CURRENT_DATE)::DATE;

  -- If no usage record exists, initialize with zeros
  IF current_usage_record IS NULL THEN
    current_usage_record := ROW(0, 0, 0, 0)::RECORD;
  END IF;

  -- Check specific feature limits
  CASE p_feature_type
    WHEN 'workspace' THEN
      DECLARE
        workspace_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO workspace_count
        FROM workspaces 
        WHERE user_id = p_user_id;
        
        result := jsonb_build_object(
          'can_perform', limits.f5 = -1 OR workspace_count < limits.f5,
          'current_usage', workspace_count,
          'limit', limits.f5,
          'plan', user_plan
        );
      END;
    
    WHEN 'message' THEN
      result := jsonb_build_object(
        'can_perform', limits.f1 = -1 OR current_usage_record.message_credits_used < limits.f1,
        'current_usage', current_usage_record.message_credits_used,
        'limit', limits.f1,
        'plan', user_plan
      );
    
    WHEN 'agent' THEN
      DECLARE
        agent_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO agent_count
        FROM agents 
        WHERE user_id = p_user_id;
        
        result := jsonb_build_object(
          'can_perform', limits.f2 = -1 OR agent_count < limits.f2,
          'current_usage', agent_count,
          'limit', limits.f2,
          'plan', user_plan
        );
      END;
    
    WHEN 'link' THEN
      DECLARE
        link_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO link_count
        FROM agent_links 
        WHERE agent_id = p_agent_id;
        
        result := jsonb_build_object(
          'can_perform', limits.f3 = -1 OR link_count < limits.f3,
          'current_usage', link_count,
          'limit', limits.f3,
          'plan', user_plan
        );
      END;
    
    WHEN 'storage' THEN
      DECLARE
        new_total_size BIGINT;
      BEGIN
        new_total_size := current_usage_record.storage_used_bytes + COALESCE(p_file_size, 0);
        
        result := jsonb_build_object(
          'can_perform', limits.f4 = -1 OR new_total_size <= limits.f4,
          'current_usage', current_usage_record.storage_used_bytes,
          'limit', limits.f4,
          'plan', user_plan,
          'new_total_size', new_total_size
        );
      END;
    
    ELSE
      result := jsonb_build_object('error', 'Invalid feature type');
  END CASE;

  RETURN result;
END;
$function$;