-- Add server-side admin route verification function
-- This prevents client-side admin route manipulation

CREATE OR REPLACE FUNCTION public.verify_admin_route_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_role app_role;
BEGIN
  -- Get authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user role using secure function
  SELECT public.get_user_role_safe(current_user_id) INTO user_role;
  
  -- Log admin route access attempt for security monitoring
  INSERT INTO public.activity_logs (
    action,
    user_id,
    ip_address,
    details
  ) VALUES (
    'admin_route_access_verified',
    current_user_id,
    NULL,
    jsonb_build_object(
      'user_role', user_role,
      'access_granted', user_role = 'admin'::app_role,
      'timestamp', now()
    )
  );
  
  RETURN user_role = 'admin'::app_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_admin_route_access() TO authenticated;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.verify_admin_route_access() IS 
'Verifies admin access server-side to prevent client-side manipulation. Logs all access attempts for security monitoring.';