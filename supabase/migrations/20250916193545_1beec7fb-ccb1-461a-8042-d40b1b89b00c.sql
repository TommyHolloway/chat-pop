-- CRITICAL SECURITY FIX: Profiles Table PII Protection
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
  session_valid boolean;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not authenticated';
  END IF;
  
  -- Validate session is recent (within 24 hours)
  SELECT EXISTS (
    SELECT 1 FROM auth.sessions 
    WHERE user_id = auth.uid() 
    AND updated_at > NOW() - INTERVAL '24 hours'
    AND NOT (auth.jwt() ->> 'exp')::bigint < extract(epoch from now())
  ) INTO session_valid;
  
  IF NOT session_valid THEN
    RAISE EXCEPTION 'Session expired: Please re-authenticate';
  END IF;
  
  RETURN user_id;
END;
$function$;

-- 2. Create PII encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_pii_email(email_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- One-way hash for email (allows matching but not reverse lookup)
  IF email_text IS NULL OR email_text = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    digest(
      lower(trim(email_text)) || '_email_' || COALESCE(current_setting('app.settings.encryption_salt', true), 'secure_email_salt'),
      'sha256'
    ),
    'hex'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_pii_phone(phone_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- One-way hash for phone (allows matching but not reverse lookup)
  IF phone_text IS NULL OR phone_text = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    digest(
      regexp_replace(phone_text, '[^0-9+]', '', 'g') || '_phone_' || COALESCE(current_setting('app.settings.encryption_salt', true), 'secure_phone_salt'),
      'sha256'
    ),
    'hex'
  );
END;
$function$;

-- 3. Create comprehensive PII access logging function
CREATE OR REPLACE FUNCTION public.log_profile_pii_access(
  operation_type text,
  profile_user_id uuid,
  fields_accessed text[],
  access_reason text DEFAULT 'Profile data access'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_id uuid;
  is_self_access boolean;
  user_role app_role;
BEGIN
  requesting_user_id := public.validate_authenticated_user();
  is_self_access := (requesting_user_id = profile_user_id);
  
  SELECT public.get_user_role_safe(requesting_user_id) INTO user_role;
  
  -- Enhanced PII access logging
  PERFORM public.log_pii_access(
    'profiles',
    operation_type,
    profile_user_id,
    to_jsonb(COALESCE(fields_accessed, ARRAY[]::text[])),
    access_reason || ' - Self Access: ' || is_self_access::text
  );
  
  -- Log security event for suspicious access patterns
  IF NOT is_self_access AND user_role != 'admin'::app_role THEN
    PERFORM public.log_security_event(
      'suspicious_profile_access_attempt',
      requesting_user_id,
      jsonb_build_object(
        'target_profile_user_id', profile_user_id,
        'operation', operation_type,
        'fields_accessed', fields_accessed,
        'user_role', user_role,
        'severity', 'high'
      )
    );
    RAISE EXCEPTION 'Security violation: Unauthorized profile access attempt';
  END IF;
END;
$function$;

-- 4. Drop existing vulnerable policies
DROP POLICY IF EXISTS "Block anonymous profile access completely" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access with PII logging" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation with validation" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates with validation" ON public.profiles;

-- 5. Create ultra-secure RLS policies for profiles
CREATE POLICY "Ultra secure profile SELECT - own data only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Validate authenticated user and ensure self-access only
  user_id = public.validate_authenticated_user()
  -- Enhanced rate limiting (stricter limits)
  AND public.enhanced_rate_limit_check('profile_access', 20, 60, true)
  -- Log PII access
  AND (SELECT public.log_profile_pii_access(
    'SELECT', 
    user_id, 
    ARRAY['email', 'display_name', 'phone', 'avatar_url']::text[],
    'Secure profile data retrieval'
  ), true)
);

CREATE POLICY "Ultra secure profile INSERT - validated creation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure user can only create their own profile
  user_id = public.validate_authenticated_user()
  -- Validate email format with enhanced security
  AND email IS NOT NULL 
  AND email <> ''
  AND validate_email(email)
  AND char_length(email) <= 254
  AND email !~* '(script|javascript|vbscript|onload|onerror)'
  -- Validate phone format if provided
  AND (phone IS NULL OR (validate_phone(phone) AND char_length(phone) <= 20))
  -- Validate display name
  AND (display_name IS NULL OR (char_length(display_name) <= 100 AND display_name !~* '(<|>|script)'))
  -- Enhanced rate limiting for profile creation
  AND public.enhanced_rate_limit_check('profile_creation', 2, 3600, true)
  -- Log PII access for profile creation
  AND (SELECT public.log_profile_pii_access(
    'INSERT',
    user_id,
    ARRAY['email', 'display_name', 'phone']::text[],
    'Secure profile creation with enhanced validation'
  ), true)
);

CREATE POLICY "Ultra secure profile UPDATE - validated modifications"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- User can only update their own profile
  user_id = public.validate_authenticated_user()
)
WITH CHECK (
  -- Ensure user_id cannot be changed
  user_id = public.validate_authenticated_user()
  -- Enhanced email validation
  AND email IS NOT NULL 
  AND email <> ''
  AND validate_email(email)
  AND char_length(email) <= 254
  AND email !~* '(script|javascript|vbscript|onload|onerror)'
  -- Enhanced phone validation
  AND (phone IS NULL OR (validate_phone(phone) AND char_length(phone) <= 20))
  -- Enhanced display name validation
  AND (display_name IS NULL OR (char_length(display_name) <= 100 AND display_name !~* '(<|>|script)'))
  -- Rate limiting for profile updates
  AND public.enhanced_rate_limit_check('profile_update', 5, 3600, true)
  -- Log PII access for profile updates
  AND (SELECT public.log_profile_pii_access(
    'UPDATE',
    user_id,
    ARRAY['email', 'display_name', 'phone', 'avatar_url']::text[],
    'Secure profile modification with enhanced validation'
  ), true)
);

-- 6. Block profile deletion for data integrity
CREATE POLICY "Block profile DELETE - data protection"
ON public.profiles
FOR DELETE
TO authenticated
USING (false); -- Profiles should not be deleted, only disabled

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
  suspicious_changes jsonb;
BEGIN
  -- Get user role for enhanced monitoring
  SELECT public.get_user_role_safe(auth.uid()) INTO user_role;
  
  -- Monitor for suspicious access patterns
  SELECT COUNT(*) INTO access_count
  FROM activity_logs
  WHERE action LIKE '%profile%'
    AND user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Alert on excessive profile access
  IF access_count > 30 AND user_role != 'admin'::app_role THEN
    PERFORM public.log_security_event(
      'excessive_profile_access_detected',
      auth.uid(),
      jsonb_build_object(
        'access_count', access_count,
        'user_role', user_role,
        'severity', 'critical',
        'action_taken', 'monitoring_enhanced'
      )
    );
  END IF;
  
  -- Monitor for suspicious profile changes
  IF TG_OP = 'UPDATE' THEN
    suspicious_changes := jsonb_build_object();
    
    -- Check for email domain changes (potential account takeover)
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      suspicious_changes := suspicious_changes || jsonb_build_object(
        'email_changed', true,
        'old_domain', split_part(OLD.email, '@', 2),
        'new_domain', split_part(NEW.email, '@', 2)
      );
    END IF;
    
    -- Check for phone number changes
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      suspicious_changes := suspicious_changes || jsonb_build_object(
        'phone_changed', true,
        'change_frequency', 'monitoring_required'
      );
    END IF;
    
    -- Log suspicious changes
    IF suspicious_changes != '{}'::jsonb THEN
      PERFORM public.log_security_event(
        'suspicious_profile_changes_detected',
        auth.uid(),
        jsonb_build_object(
          'changes', suspicious_changes,
          'user_role', user_role,
          'severity', 'high'
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for profile security monitoring
DROP TRIGGER IF EXISTS profile_security_monitor ON public.profiles;
CREATE TRIGGER profile_security_monitor
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_profile_security();

-- 8. Create admin-only profile access function for emergency situations
CREATE OR REPLACE FUNCTION public.admin_emergency_profile_access(target_user_id uuid, access_reason text)
RETURNS TABLE(user_id uuid, email text, display_name text, created_at timestamptz)
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
  
  -- Only allow admins to use this function
  IF user_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'Security violation: Admin access required for emergency profile access';
  END IF;
  
  -- Log emergency access
  PERFORM public.log_security_event(
    'admin_emergency_profile_access',
    admin_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'access_reason', access_reason,
      'severity', 'critical',
      'requires_audit', true
    )
  );
  
  -- Enhanced PII access logging
  PERFORM public.log_profile_pii_access(
    'ADMIN_EMERGENCY_ACCESS',
    target_user_id,
    ARRAY['email', 'display_name']::text[],
    'EMERGENCY ADMIN ACCESS: ' || access_reason
  );
  
  -- Return limited profile data (no phone for emergency access)
  RETURN QUERY
  SELECT p.user_id, p.email, p.display_name, p.created_at
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$function$;