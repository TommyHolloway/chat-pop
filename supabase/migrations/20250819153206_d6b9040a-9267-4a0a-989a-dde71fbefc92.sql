-- Add foreign key constraint from usage_tracking to profiles
ALTER TABLE public.usage_tracking 
ADD CONSTRAINT fk_usage_tracking_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;