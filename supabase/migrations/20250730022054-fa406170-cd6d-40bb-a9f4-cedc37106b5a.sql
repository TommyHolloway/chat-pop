-- Fix the profiles table structure and populate data

-- First, check and add unique constraint on profiles.user_id if it doesn't exist
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Populate profiles for existing auth users who don't have profiles
INSERT INTO public.profiles (user_id, email, display_name, plan)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  'free'
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Ensure the trigger exists for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, plan)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing users have usage tracking records for current month
INSERT INTO public.usage_tracking (user_id, month)
SELECT 
  p.user_id,
  date_trunc('month', CURRENT_DATE)::DATE
FROM public.profiles p
LEFT JOIN public.usage_tracking ut ON ut.user_id = p.user_id 
  AND ut.month = date_trunc('month', CURRENT_DATE)::DATE
WHERE ut.user_id IS NULL
ON CONFLICT (user_id, month) DO NOTHING;