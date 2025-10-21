-- Fix check_user_plan_limits function to properly handle missing usage records
CREATE OR REPLACE FUNCTION public.check_user_plan_limits(
  p_user_id uuid, 
  p_feature_type text, 
  p_agent_id uuid DEFAULT NULL::uuid, 
  p_file_size bigint DEFAULT NULL::bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_plan TEXT;
  current_month DATE;
  message_credits_used_val INTEGER := 0;
  storage_used_bytes_val BIGINT := 0;
  limits RECORD;
  result JSONB;
BEGIN
  -- Get user's current plan
  SELECT COALESCE(plan, 'free') INTO user_plan
  FROM profiles 
  WHERE user_id = p_user_id;

  -- Define plan limits
  CASE user_plan
    WHEN 'hobby' THEN
      limits := ROW(2000, 2, 20, 5368709120, 3)::RECORD; -- 2000 credits, 2 agents, 20 links, 5GB, 3 workspaces
    WHEN 'standard' THEN
      limits := ROW(-1, 5, -1, 53687091200, -1)::RECORD; -- unlimited credits, 5 agents, unlimited links, 50GB, unlimited workspaces
    ELSE
      limits := ROW(100, 1, 5, 1073741824, 1)::RECORD; -- 100 credits, 1 agent, 5 links, 1GB, 1 workspace
  END CASE;

  -- Get current month
  current_month := date_trunc('month', CURRENT_DATE)::DATE;

  -- Get or create usage record for current month
  SELECT 
    COALESCE(message_credits_used, 0),
    COALESCE(storage_used_bytes, 0)
  INTO message_credits_used_val, storage_used_bytes_val
  FROM usage_tracking 
  WHERE user_id = p_user_id 
    AND month = current_month;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO usage_tracking (user_id, month, message_credits_used, storage_used_bytes, messages_count, conversations_count)
    VALUES (p_user_id, current_month, 0, 0, 0, 0)
    ON CONFLICT (user_id, month) DO NOTHING;
    
    message_credits_used_val := 0;
    storage_used_bytes_val := 0;
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
        'can_perform', limits.f1 = -1 OR message_credits_used_val < limits.f1,
        'current_usage', message_credits_used_val,
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
        new_total_size := storage_used_bytes_val + COALESCE(p_file_size, 0);
        
        result := jsonb_build_object(
          'can_perform', limits.f4 = -1 OR new_total_size <= limits.f4,
          'current_usage', storage_used_bytes_val,
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