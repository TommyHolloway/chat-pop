-- Fix integer overflow in check_user_plan_limits function for storage calculations
-- Change current_usage and feature_limit from integer to bigint to handle storage in bytes

CREATE OR REPLACE FUNCTION public.check_user_plan_limits(
  p_user_id uuid,
  p_feature_type text,
  p_agent_id uuid DEFAULT NULL,
  p_file_size bigint DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_plan text;
  current_usage bigint := 0;  -- Changed from integer to bigint
  feature_limit bigint := 0;  -- Changed from integer to bigint
  current_month date;
  usage_record record;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Get user's plan (supports both old and new plan names)
  SELECT COALESCE(plan, 'free') INTO user_plan
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Normalize plan names (hobby->starter, standard->growth internally)
  IF user_plan IN ('hobby', 'starter') THEN
    user_plan := 'starter';
  ELSIF user_plan IN ('standard', 'pro', 'growth') THEN
    user_plan := 'growth';
  ELSE
    user_plan := 'free';
  END IF;
  
  -- Define limits based on feature type and plan
  CASE p_feature_type
    WHEN 'agent' THEN
      -- Count current agents
      SELECT COUNT(*) INTO current_usage
      FROM agents
      WHERE user_id = p_user_id;
      
      -- Set agent limits: Free=1, Starter=2, Growth=5
      feature_limit := CASE user_plan
        WHEN 'starter' THEN 2
        WHEN 'growth' THEN 5
        ELSE 1
      END;
    
    WHEN 'message' THEN
      -- Get message credits used this month
      SELECT COALESCE(message_credits_used, 0) INTO current_usage
      FROM usage_tracking
      WHERE user_id = p_user_id AND month = current_month;
      
      -- Set message limits: Free=50, Starter=2000, Growth=10000
      feature_limit := CASE user_plan
        WHEN 'starter' THEN 2000
        WHEN 'growth' THEN 10000
        ELSE 50
      END;
    
    WHEN 'link' THEN
      -- Count links for specific agent
      IF p_agent_id IS NULL THEN
        RETURN jsonb_build_object(
          'can_perform', false,
          'current_usage', 0,
          'limit', 0,
          'plan', user_plan,
          'error', 'agent_id required for link check'
        );
      END IF;
      
      SELECT COUNT(*) INTO current_usage
      FROM agent_links
      WHERE agent_id = p_agent_id;
      
      -- Set link limits: Free=5, Starter=unlimited, Growth=unlimited
      feature_limit := CASE user_plan
        WHEN 'starter' THEN -1
        WHEN 'growth' THEN -1
        ELSE 5
      END;
    
    WHEN 'storage' THEN
      -- Get storage used this month in bytes
      SELECT COALESCE(storage_used_bytes, 0) INTO current_usage
      FROM usage_tracking
      WHERE user_id = p_user_id AND month = current_month;
      
      -- Set storage limits in bytes: Free=1GB, Starter=5GB, Growth=50GB
      -- Now safe to use large values with bigint
      feature_limit := CASE user_plan
        WHEN 'starter' THEN 5::bigint * 1024 * 1024 * 1024   -- 5GB
        WHEN 'growth' THEN 50::bigint * 1024 * 1024 * 1024  -- 50GB
        ELSE 1::bigint * 1024 * 1024 * 1024                   -- 1GB
      END;
      
      -- Add proposed file size to current usage
      current_usage := current_usage + p_file_size;
    
    WHEN 'cart_recovery' THEN
      -- Get cart recovery attempts this month
      SELECT COALESCE(cart_recovery_attempts, 0) INTO current_usage
      FROM usage_tracking
      WHERE user_id = p_user_id AND month = current_month;
      
      -- Set cart recovery limits: Free=0, Starter=50, Growth=500
      feature_limit := CASE user_plan
        WHEN 'starter' THEN 50
        WHEN 'growth' THEN 500
        ELSE 0
      END;
    
    ELSE
      RETURN jsonb_build_object(
        'can_perform', false,
        'current_usage', 0,
        'limit', 0,
        'plan', user_plan,
        'error', 'Invalid feature type'
      );
  END CASE;
  
  -- Check if user can perform action (-1 means unlimited)
  RETURN jsonb_build_object(
    'can_perform', (feature_limit = -1 OR current_usage < feature_limit),
    'current_usage', current_usage,
    'limit', feature_limit,
    'plan', user_plan
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_plan_limits(uuid, text, uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_plan_limits(uuid, text, uuid, bigint) TO service_role;