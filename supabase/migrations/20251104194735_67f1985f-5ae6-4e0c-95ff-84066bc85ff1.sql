-- Drop the separate role trigger and function to prevent race condition
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Update handle_new_user to create both profile and role in correct order
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First create the profile
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
  
  -- Then create the user role (now the profile exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
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