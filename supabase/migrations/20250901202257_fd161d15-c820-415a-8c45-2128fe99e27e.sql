-- Security Enhancement Migration (Part 2 - Exclude Views)

-- 1. Create function to safely parse IP addresses from headers
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

-- 2. Enhanced function to prevent admin self-modification
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

-- 3. Add trigger to validate admin role changes
DROP TRIGGER IF EXISTS validate_admin_role_changes ON public.user_roles;
CREATE TRIGGER validate_admin_role_changes
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role_change();

-- 4. Create enhanced encryption key storage (temporary table for keys)
CREATE TABLE IF NOT EXISTS public.api_key_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  encrypted_key text NOT NULL,
  key_hash text NOT NULL, -- For identification without exposing key
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Enable RLS on the new table
ALTER TABLE public.api_key_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
ON public.api_key_storage
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Add audit tracking to sensitive PII operations
CREATE OR REPLACE FUNCTION public.enhanced_visitor_data_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use the new IP parsing function for safer IP handling
  IF NEW.ip_address IS NOT NULL THEN
    BEGIN
      -- Try to parse and anonymize the IP address safely
      DECLARE
        parsed_ip inet;
      BEGIN
        parsed_ip := public.parse_client_ip(NEW.ip_address::text);
        IF parsed_ip IS NOT NULL THEN
          NEW.ip_address = public.anonymize_ip_address(parsed_ip);
        ELSE
          NEW.ip_address = NULL; -- Set to NULL if parsing fails
        END IF;
      EXCEPTION
        WHEN others THEN
          NEW.ip_address = NULL; -- Safety fallback
      END;
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

-- Update the visitor session trigger to use the enhanced function
DROP TRIGGER IF EXISTS visitor_data_anonymization ON public.visitor_sessions;
CREATE TRIGGER visitor_data_anonymization
  BEFORE INSERT ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_visitor_data_validation();