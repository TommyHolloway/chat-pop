-- Create atomic user profile update function
CREATE OR REPLACE FUNCTION public.update_user_profile_atomic(
  p_user_id UUID,
  p_display_name TEXT,
  p_plan TEXT,
  p_role app_role
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_old_role app_role;
BEGIN
  -- Get current role
  SELECT COALESCE(role, 'user'::app_role) INTO v_old_role
  FROM user_roles
  WHERE user_id = p_user_id;

  -- Update profile
  UPDATE profiles 
  SET 
    display_name = p_display_name,
    plan = p_plan,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Update role if changed
  IF v_old_role != p_role THEN
    -- Delete existing role
    DELETE FROM user_roles WHERE user_id = p_user_id;
    
    -- Insert new role
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role);
  END IF;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_old_role,
    'new_role', p_role
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN v_result;
END;
$$;

-- Add data validation constraints
ALTER TABLE profiles 
ADD CONSTRAINT chk_valid_plan 
CHECK (plan IN ('free', 'hobby', 'standard'));

-- Enable real-time for profiles and user_roles tables
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;