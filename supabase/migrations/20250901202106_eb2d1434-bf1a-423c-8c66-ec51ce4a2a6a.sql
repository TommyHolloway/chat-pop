-- Security Enhancement Migration

-- 1. Add RLS policy for security_audit_summary table (if it exists as a table, not a view)
-- First check if it's a table or view, then add policy only if it's a table
DO $$
BEGIN
  -- Add RLS policy for security audit summary if it exists as a table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'security_audit_summary'
  ) THEN
    ALTER TABLE public.security_audit_summary ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admins can view security audit summary" ON public.security_audit_summary;
    CREATE POLICY "Admins can view security audit summary"
    ON public.security_audit_summary
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 2. Create function to safely parse IP addresses from headers
CREATE OR REPLACE FUNCTION public.parse_client_ip(ip_header text)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Handle comma-separated IP addresses (take the first one)
  IF ip_header IS NULL OR ip_header = '' THEN
    RETURN NULL;
  END IF;
  
  -- Extract first IP from comma-separated list and clean whitespace
  DECLARE
    first_ip text;
  BEGIN
    first_ip := trim(split_part(ip_header, ',', 1));
    
    -- Validate IP format and return
    RETURN first_ip::inet;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- If IP is invalid, return NULL instead of erroring
      RETURN NULL;
  END;
END;
$$;

-- 3. Enhanced function to prevent admin self-modification
CREATE OR REPLACE FUNCTION public.validate_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent admins from modifying their own roles
  IF TG_OP = 'UPDATE' AND OLD.role = 'admin'::app_role THEN
    IF auth.uid() = NEW.user_id THEN
      RAISE EXCEPTION 'Administrators cannot modify their own roles for security reasons';
    END IF;
  END IF;
  
  -- Prevent admins from deleting their own admin role
  IF TG_OP = 'DELETE' AND OLD.role = 'admin'::app_role THEN
    IF auth.uid() = OLD.user_id THEN
      RAISE EXCEPTION 'Administrators cannot delete their own admin roles';
    END IF;
  END IF;
  
  -- Log admin role changes for audit
  PERFORM public.log_security_event(
    'admin_role_change_attempt',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'old_role', CASE WHEN TG_OP = 'DELETE' THEN OLD.role ELSE COALESCE(OLD.role, 'none') END,
      'new_role', CASE WHEN TG_OP = 'DELETE' THEN 'deleted' ELSE NEW.role END,
      'operation', TG_OP,
      'is_self_modification', auth.uid() = COALESCE(NEW.user_id, OLD.user_id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Add trigger to validate admin role changes
DROP TRIGGER IF EXISTS validate_admin_role_changes ON public.user_roles;
CREATE TRIGGER validate_admin_role_changes
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role_change();

-- 5. Enhanced visitor session anonymization with better IP handling
CREATE OR REPLACE FUNCTION public.anonymize_visitor_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize IP address if present, handle parsing errors gracefully
  IF NEW.ip_address IS NOT NULL THEN
    BEGIN
      NEW.ip_address = public.anonymize_ip_address(NEW.ip_address);
    EXCEPTION
      WHEN others THEN
        -- If IP anonymization fails, set to NULL for privacy
        NEW.ip_address = NULL;
    END;
  END IF;
  
  -- Log visitor session creation for audit (without sensitive data)
  PERFORM public.log_service_role_operation(
    'visitor_session_created',
    'visitor_sessions',
    jsonb_build_object(
      'session_id', NEW.session_id, 
      'agent_id', NEW.agent_id,
      'has_ip', NEW.ip_address IS NOT NULL
    )
  );
  
  RETURN NEW;
END;
$$;