-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create policies for workspaces
CREATE POLICY "Users can view their own workspaces" 
ON public.workspaces 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workspaces" 
ON public.workspaces 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workspaces" 
ON public.workspaces 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workspaces" 
ON public.workspaces 
FOR DELETE 
USING (user_id = auth.uid());

-- Add workspace_id to agents table
ALTER TABLE public.agents 
ADD COLUMN workspace_id UUID;

-- Update agents RLS policies to include workspace context
DROP POLICY IF EXISTS "Users can view their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agents;

CREATE POLICY "Users can view agents in their workspaces" 
ON public.agents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workspaces 
  WHERE workspaces.id = agents.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Users can create agents in their workspaces" 
ON public.agents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM workspaces 
  WHERE workspaces.id = agents.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Users can update agents in their workspaces" 
ON public.agents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM workspaces 
  WHERE workspaces.id = agents.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Users can delete agents in their workspaces" 
ON public.agents 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM workspaces 
  WHERE workspaces.id = agents.workspace_id 
  AND workspaces.user_id = auth.uid()
));

-- Update function to check workspace limits
CREATE OR REPLACE FUNCTION public.check_user_plan_limits(p_user_id uuid, p_feature_type text, p_agent_id uuid DEFAULT NULL::uuid, p_file_size bigint DEFAULT NULL::bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Define plan limits (including workspace limits)
  CASE user_plan
    WHEN 'hobby' THEN
      limits := ROW(2000, 2, 20, 5368709120, 3)::RECORD; -- 2000 credits, 2 agents, 20 links, 5GB, 3 workspaces
    WHEN 'standard' THEN
      limits := ROW(-1, 5, -1, 53687091200, -1)::RECORD; -- unlimited credits, 5 agents, unlimited links, 50GB, unlimited workspaces
    ELSE
      limits := ROW(100, 1, 5, 1073741824, 1)::RECORD; -- 100 credits, 1 agent, 5 links, 1GB, 1 workspace
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
$function$;

-- Create trigger for workspace updated_at
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();