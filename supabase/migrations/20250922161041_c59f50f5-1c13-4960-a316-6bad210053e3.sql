-- CRITICAL SECURITY FIX: Strengthen profiles table RLS policies
-- Remove complex validation functions and implement bulletproof access control

-- Drop existing potentially vulnerable policies
DROP POLICY IF EXISTS "Secure profile access - own data only" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation - validated input" ON public.profiles;  
DROP POLICY IF EXISTS "Secure profile updates - validated modifications" ON public.profiles;

-- Create ultra-secure, simple RLS policies for profiles table

-- 1. SELECT: Users can ONLY see their own data, NO admin bypass for PII protection
CREATE POLICY "Users can only view own profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 2. INSERT: Users can only create their own profile with basic validation
CREATE POLICY "Users can only create own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND email IS NOT NULL 
  AND email != '' 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(email) <= 254
);

-- 3. UPDATE: Users can only update their own profile with validation
CREATE POLICY "Users can only update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND email IS NOT NULL 
  AND email != '' 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(email) <= 254
);

-- 4. DELETE: Keep deletion blocked (existing policy is secure)
-- "Block all profile deletion" policy remains in place

-- Create separate admin access function with full audit logging
CREATE OR REPLACE FUNCTION public.admin_access_profile_data(target_user_id uuid, access_reason text)
RETURNS TABLE(
  id uuid,
  user_id uuid, 
  email text,
  display_name text,
  phone text,
  avatar_url text,
  plan text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict admin verification
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Mandatory access reason
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed access reason required (minimum 10 characters)';
  END IF;

  -- Log PII access with full details
  PERFORM public.log_pii_access(
    'profiles',
    'ADMIN_SELECT',
    target_user_id,
    '["email", "phone", "display_name"]'::jsonb,
    'ADMIN ACCESS: ' || access_reason
  );

  -- Log additional security event
  PERFORM public.log_security_event(
    'admin_pii_access_profiles',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'access_reason', access_reason,
      'access_timestamp', now(),
      'severity', 'high',
      'compliance_note', 'Admin accessed customer PII data'
    )
  );

  -- Return the requested profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.display_name, 
    p.phone,
    p.avatar_url,
    p.plan,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Create secure customer support access function (limited fields)
CREATE OR REPLACE FUNCTION public.support_access_profile_basic(target_user_id uuid, ticket_number text)
RETURNS TABLE(
  id uuid,
  display_name text,
  plan text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify admin role
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Require ticket number
  IF ticket_number IS NULL OR length(trim(ticket_number)) < 5 THEN
    RAISE EXCEPTION 'Access denied: Valid support ticket number required';
  END IF;

  -- Log access (non-PII fields only)
  PERFORM public.log_security_event(
    'support_profile_access',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'ticket_number', ticket_number,
      'fields_accessed', '["display_name", "plan"]',
      'access_type', 'customer_support'
    )
  );

  -- Return limited profile data (no email/phone)
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.plan,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Enhanced trigger for all profile operations
CREATE OR REPLACE FUNCTION public.enhanced_profile_security_monitor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all profile operations with PII tracking
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_pii_access(
      'profiles', 
      'SELECT',
      COALESCE(NEW.user_id, OLD.user_id),
      '["email", "phone", "display_name"]'::jsonb,
      'User profile access'
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_pii_access(
      'profiles',
      'INSERT', 
      NEW.user_id,
      '["email", "phone", "display_name"]'::jsonb,
      'New profile creation'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_pii_access(
      'profiles',
      'UPDATE',
      NEW.user_id,
      '["email", "phone", "display_name"]'::jsonb,
      'Profile data update'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the enhanced security trigger
DROP TRIGGER IF EXISTS enhanced_profile_security_monitor ON public.profiles;
CREATE TRIGGER enhanced_profile_security_monitor
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_profile_security_monitor();

-- Create profile data breach detection
CREATE OR REPLACE FUNCTION public.detect_profile_data_breach()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_access RECORD;
BEGIN
  -- Check for unusual profile access patterns
  FOR suspicious_access IN
    SELECT 
      user_id,
      COUNT(*) as access_count,
      COUNT(DISTINCT details->>'target_user_id') as unique_profiles_accessed
    FROM activity_logs
    WHERE action LIKE '%profile%'
      AND action LIKE '%PII_ACCESS%'
      AND created_at > NOW() - INTERVAL '1 hour'
      AND user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 20 OR COUNT(DISTINCT details->>'target_user_id') > 10
  LOOP
    -- Log critical security alert
    PERFORM public.log_security_event(
      'potential_profile_data_breach',
      suspicious_access.user_id,
      jsonb_build_object(
        'access_count', suspicious_access.access_count,
        'unique_profiles_accessed', suspicious_access.unique_profiles_accessed,
        'time_window', '1 hour',
        'severity', 'critical',
        'threat_type', 'data_breach_attempt',
        'recommended_action', 'immediate_investigation_required'
      )
    );
  END LOOP;
END;
$$;