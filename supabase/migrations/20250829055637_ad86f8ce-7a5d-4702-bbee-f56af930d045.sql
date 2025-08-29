-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN phone TEXT;

-- Update the handle_new_user function to include phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, phone, plan)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    NEW.raw_user_meta_data->>'phone',
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;