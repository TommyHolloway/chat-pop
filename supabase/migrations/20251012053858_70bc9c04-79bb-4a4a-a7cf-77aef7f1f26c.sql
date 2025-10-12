-- Function to sync auth.users to profiles and fix orphaned users
CREATE OR REPLACE FUNCTION sync_auth_users_to_profiles()
RETURNS TABLE(synced_count INT, orphaned_users JSONB) AS $$
DECLARE
  sync_count INT := 0;
  orphans JSONB;
BEGIN
  -- Insert missing profiles for auth users
  WITH inserted AS (
    INSERT INTO public.profiles (user_id, email, display_name, plan)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
      'free'
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id, email
  )
  SELECT COUNT(*)::INT, jsonb_agg(jsonb_build_object('user_id', user_id, 'email', email))
  INTO sync_count, orphans
  FROM inserted;
  
  -- Ensure all profiles have roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.user_id, 'user'::app_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.user_id IS NULL
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN QUERY SELECT sync_count, COALESCE(orphans, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with better error handling
  INSERT INTO public.profiles (user_id, email, display_name, phone, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    'free'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  -- Log profile creation for audit
  PERFORM log_service_role_operation(
    'profile_created_via_trigger',
    'profiles',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    PERFORM log_security_event(
      'profile_creation_failed',
      NEW.id,
      jsonb_build_object(
        'error', SQLERRM,
        'email', NEW.email
      )
    );
    RETURN NEW;
END;
$$;