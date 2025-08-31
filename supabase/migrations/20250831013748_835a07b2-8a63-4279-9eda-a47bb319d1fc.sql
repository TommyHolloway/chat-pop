-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE STRICT
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
           AND length(email_input) <= 254;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE STRICT
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Allow international formats, require 7-15 digits
    RETURN phone_input ~ '^\+?[1-9]\d{6,14}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Remove potential XSS characters and limit length
    RETURN left(regexp_replace(input_text, '[<>&"'']', '', 'g'), 1000);
END;
$$;