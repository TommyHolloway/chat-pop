-- Fix the profiles table population and relationships

-- First, populate profiles for existing auth users who don't have profiles
INSERT INTO public.profiles (user_id, email, display_name, plan)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  'free'
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;

-- Ensure the trigger exists for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, plan)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'free');
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add foreign key constraints for proper relationships
ALTER TABLE public.user_roles 
ADD CONSTRAINT fk_user_roles_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.usage_tracking 
ADD CONSTRAINT fk_usage_tracking_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Ensure all existing users have usage tracking records for current month
INSERT INTO public.usage_tracking (user_id, month)
SELECT 
  p.user_id,
  date_trunc('month', CURRENT_DATE)::DATE
FROM public.profiles p
LEFT JOIN public.usage_tracking ut ON ut.user_id = p.user_id 
  AND ut.month = date_trunc('month', CURRENT_DATE)::DATE
WHERE ut.user_id IS NULL;

-- Create an enhanced view for admin user management
CREATE OR REPLACE VIEW public.admin_user_view AS
SELECT 
  p.user_id,
  p.email,
  p.display_name,
  p.plan,
  p.created_at,
  p.updated_at,
  ur.role,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.last_sign_in_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
LEFT JOIN auth.users au ON au.id = p.user_id
ORDER BY p.created_at DESC;