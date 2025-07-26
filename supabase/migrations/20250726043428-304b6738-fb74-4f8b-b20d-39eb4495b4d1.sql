-- Create function to check user plan limits
CREATE OR REPLACE FUNCTION public.check_user_plan_limits(
  p_user_id UUID,
  p_feature_type TEXT,
  p_agent_id UUID DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  current_usage RECORD;
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
      limits := ROW(2000, 2, 20, 5368709120)::RECORD; -- 2000 credits, 2 agents, 20 links, 5GB
    WHEN 'standard' THEN
      limits := ROW(-1, 5, -1, 53687091200)::RECORD; -- unlimited credits, 5 agents, unlimited links, 50GB
    ELSE
      limits := ROW(100, 1, 5, 1073741824)::RECORD; -- 100 credits, 1 agent, 5 links, 1GB
  END CASE;

  -- Get current month usage
  SELECT 
    COALESCE(message_credits_used, 0) as message_credits_used,
    COALESCE(storage_used_bytes, 0) as storage_used_bytes
  INTO current_usage
  FROM usage_tracking 
  WHERE user_id = p_user_id 
    AND month = date_trunc('month', CURRENT_DATE)::DATE;

  -- If no usage record exists, initialize with zeros
  IF current_usage IS NULL THEN
    current_usage := ROW(0, 0)::RECORD;
  END IF;

  -- Check specific feature limits
  CASE p_feature_type
    WHEN 'message' THEN
      result := jsonb_build_object(
        'can_perform', limits.f1 = -1 OR current_usage.message_credits_used < limits.f1,
        'current_usage', current_usage.message_credits_used,
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
        new_total_size := current_usage.storage_used_bytes + COALESCE(p_file_size, 0);
        
        result := jsonb_build_object(
          'can_perform', limits.f4 = -1 OR new_total_size <= limits.f4,
          'current_usage', current_usage.storage_used_bytes,
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
$$;

-- Function to update storage usage when files are uploaded/deleted
CREATE OR REPLACE FUNCTION public.update_storage_usage(
  p_user_id UUID,
  p_size_change BIGINT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Upsert usage tracking for current month
  INSERT INTO public.usage_tracking (
    user_id, 
    month, 
    storage_used_bytes,
    updated_at
  )
  VALUES (
    p_user_id,
    current_month,
    GREATEST(0, p_size_change), -- Ensure we don't go negative
    NOW()
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    storage_used_bytes = GREATEST(0, usage_tracking.storage_used_bytes + p_size_change),
    updated_at = NOW();
END;
$$;