-- Enhanced atomic update function with row locking and better error handling
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
  v_old_role app_role;
  v_profile_updated BOOLEAN := FALSE;
  v_role_updated BOOLEAN := FALSE;
BEGIN
  -- Lock the user's profile row to prevent concurrent updates
  PERFORM 1 FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  
  -- Get current role with locking
  SELECT COALESCE(role, 'user'::app_role) INTO v_old_role
  FROM user_roles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Update profile with explicit check
  UPDATE profiles 
  SET 
    display_name = p_display_name,
    plan = p_plan,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Check if profile update was successful
  GET DIAGNOSTICS v_profile_updated = ROW_COUNT;
  
  IF NOT v_profile_updated THEN
    RAISE EXCEPTION 'User profile not found or could not be updated for user ID: %', p_user_id;
  END IF;

  -- Update role if changed
  IF v_old_role IS DISTINCT FROM p_role THEN
    -- Delete existing role
    DELETE FROM user_roles WHERE user_id = p_user_id;
    
    -- Insert new role
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role);
    
    GET DIAGNOSTICS v_role_updated = ROW_COUNT;
    
    IF NOT v_role_updated THEN
      RAISE EXCEPTION 'Failed to update user role for user ID: %', p_user_id;
    END IF;
  END IF;

  -- Return detailed success result
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_old_role,
    'new_role', p_role,
    'profile_updated', v_profile_updated,
    'role_updated', v_role_updated,
    'timestamp', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return detailed error result
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'user_id', p_user_id,
      'timestamp', now()
    );
END;
$$;