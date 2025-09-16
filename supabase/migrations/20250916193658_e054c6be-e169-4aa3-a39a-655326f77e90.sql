-- CRITICAL SECURITY FIX: Profiles Table PII Protection (Fixed)
-- Addresses: Customer Email and Phone Data Could Be Stolen by Hackers

-- 1. Create enhanced authentication validation function
CREATE OR REPLACE FUNCTION public.validate_authenticated_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  user_id uuid;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not authenticated';
  END IF;
  
  RETURN user_id;
END;
$function$;

-- 2. Create secure profile access validation function that returns boolean
CREATE OR REPLACE FUNCTION public.validate_secure_profile_access(
  target_user_id uuid,
  operation_type text DEFAULT 'SELECT'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_id uuid;
  user_role app_role;
BEGIN
  -- Validate authentication
  requesting_user_id := public.validate_authenticated_user();
  
  -- Users can only access their own profiles
  IF requesting_user_id != target_user_id THEN
    -- Get user role for potential admin override
    SELECT public.get_user_role_safe(requesting_user_id) INTO user_role;
    
    -- Only admins can access other profiles
    IF user_role != 'admin'::app_role THEN
      -- Log suspicious access attempt
      PERFORM public.log_security_event(
        'unauthorized_profile_access_blocked',
        requesting_user_id,
        jsonb_build_object(
          'target_user_id', target_user_id,
          'operation', operation_type,
          'severity', 'high'
        )
      );
      RETURN false;
    END IF;
  END IF;
  
  -- Enhanced rate limiting
  IF NOT public.enhanced_rate_limit_check('profile_' || lower(operation_type), 20, 3600, true) THEN
    RETURN false;
  END IF;
  
  -- Log PII access
  PERFORM public.log_pii_access(
    'profiles',
    operation_type,
    target_user_id,
    '["email", "phone", "display_name"]'::jsonb,
    'Secure profile access validation'
  );
  
  RETURN true;
END;
$function$;

-- 3. Create input validation function for profile data
CREATE OR REPLACE FUNCTION public.validate_profile_input(
  email_input text,
  phone_input text DEFAULT NULL,
  display_name_input text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enhanced email validation
  IF email_input IS NULL OR email_input = '' THEN
    RETURN false;
  END IF;
  
  IF NOT validate_email(email_input) THEN
    RETURN false;
  END IF;
  
  IF char_length(email_input) > 254 THEN
    RETURN false;
  END IF;
  
  -- Check for malicious content in email
  IF email_input ~* '(script|javascript|vbscript|onload|onerror|<|>)' THEN
    RETURN false;
  END IF;
  
  -- Enhanced phone validation if provided
  IF phone_input IS NOT NULL THEN
    IF NOT validate_phone(phone_input) THEN
      RETURN false;
    END IF;
    
    IF char_length(phone_input) > 20 THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Enhanced display name validation if provided
  IF display_name_input IS NOT NULL THEN
    IF char_length(display_name_input) > 100 THEN
      RETURN false;
    END IF;
    
    -- Check for malicious content
    IF display_name_input ~* '(<|>|script|javascript)' THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$function$;

-- 4. Drop existing vulnerable policies
DROP POLICY IF EXISTS "Block anonymous profile access completely" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access with PII logging" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation with validation" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates with validation" ON public.profiles;
DROP POLICY IF EXISTS "Ultra secure profile SELECT - own data only" ON public.profiles;
DROP POLICY IF EXISTS "Ultra secure profile INSERT - validated creation" ON public.profiles;
DROP POLICY IF EXISTS "Ultra secure profile UPDATE - validated modifications" ON public.profiles;
DROP POLICY IF EXISTS "Block profile DELETE - data protection" ON public.profiles;

-- 5. Create ultra-secure RLS policies for profiles
CREATE POLICY "Hardened profile SELECT - authenticated users only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.validate_secure_profile_access(user_id, 'SELECT')
);

CREATE POLICY "Hardened profile INSERT - strict validation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.validate_profile_input(email, phone, display_name)
  AND public.enhanced_rate_limit_check('profile_creation', 2, 3600, true)
);

CREATE POLICY "Hardened profile UPDATE - secure modifications"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.validate_secure_profile_access(user_id, 'UPDATE')
)
WITH CHECK (
  user_id = auth.uid()
  AND public.validate_profile_input(email, phone, display_name)
);

-- 6. Block profile deletion completely
CREATE POLICY "Block profile DELETE - security protection"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- 7. Create profile security monitoring trigger
CREATE OR REPLACE FUNCTION public.monitor_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_count INTEGER;
  user_role app_role;
  requesting_user uuid;
BEGIN
  requesting_user := auth.uid();
  
  -- Skip monitoring for system operations
  IF requesting_user IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT public.get_user_role_safe(requesting_user) INTO user_role;
  
  -- Monitor for excessive profile operations
  SELECT COUNT(*) INTO access_count
  FROM activity_logs
  WHERE action LIKE '%PII_ACCESS: % on profiles%'
    AND user_id = requesting_user
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Alert on suspicious patterns for non-admins
  IF access_count > 50 AND user_role != 'admin'::app_role THEN
    PERFORM public.log_security_event(
      'excessive_profile_operations_detected',
      requesting_user,
      jsonb_build_object(
        'operation_count', access_count,
        'operation_type', TG_OP,
        'user_role', user_role,
        'severity', 'critical'
      )
    );
  END IF;
  
  -- Monitor for suspicious profile changes
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    -- Log profile modification
    PERFORM public.log_security_event(
      'profile_data_modified',
      requesting_user,
      jsonb_build_object(
        'target_profile', COALESCE(NEW.user_id, OLD.user_id),
        'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
        'phone_changed', (OLD.phone IS DISTINCT FROM NEW.phone),
        'display_name_changed', (OLD.display_name IS DISTINCT FROM NEW.display_name),
        'severity', CASE 
          WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'high'
          ELSE 'medium'
        END
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS profile_security_monitor ON public.profiles;
CREATE TRIGGER profile_security_monitor
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_profile_security();

-- 8. Create emergency admin access function
CREATE OR REPLACE FUNCTION public.admin_emergency_profile_access(
  target_user_id uuid, 
  access_reason text
)
RETURNS TABLE(
  user_id uuid, 
  email text, 
  display_name text, 
  created_at timestamptz,
  access_warning text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
  user_role app_role;
BEGIN
  admin_user_id := public.validate_authenticated_user();
  SELECT public.get_user_role_safe(admin_user_id) INTO user_role;
  
  -- Strict admin-only access
  IF user_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Emergency profile access requires admin privileges';
  END IF;
  
  -- Log critical security event
  PERFORM public.log_security_event(
    'admin_emergency_profile_access_executed',
    admin_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'access_reason', access_reason,
      'severity', 'critical',
      'requires_immediate_audit', true
    )
  );
  
  -- Enhanced PII access logging
  PERFORM public.log_pii_access(
    'profiles',
    'EMERGENCY_ADMIN_ACCESS',
    target_user_id,
    '["email", "display_name"]'::jsonb,
    'CRITICAL: Emergency admin access - ' || access_reason
  );
  
  -- Return limited profile data with warning
  RETURN QUERY
  SELECT 
    p.user_id, 
    p.email, 
    p.display_name, 
    p.created_at,
    'WARNING: This access has been logged and flagged for audit'::text as access_warning
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$function$;