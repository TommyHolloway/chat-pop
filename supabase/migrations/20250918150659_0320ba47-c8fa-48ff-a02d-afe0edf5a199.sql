-- Update RLS policies to use read-only functions for SELECT operations to prevent INSERT issues
DROP POLICY IF EXISTS "Secure profile access - own data only" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation - validated input" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates - validated modifications" ON public.profiles;

-- Create new policies that use read-only functions for SELECT operations
CREATE POLICY "Secure profile access - own data only" ON public.profiles
FOR SELECT USING (validate_secure_profile_access_readonly(user_id, 'SELECT'));

CREATE POLICY "Secure profile creation - validated input" ON public.profiles
FOR INSERT WITH CHECK (
  (user_id = auth.uid()) AND 
  validate_profile_input_readonly(email, phone, display_name)
);

CREATE POLICY "Secure profile updates - validated modifications" ON public.profiles
FOR UPDATE USING (validate_secure_profile_access_readonly(user_id, 'UPDATE'))
WITH CHECK (
  (user_id = auth.uid()) AND 
  validate_profile_input_readonly(email, phone, display_name)
);