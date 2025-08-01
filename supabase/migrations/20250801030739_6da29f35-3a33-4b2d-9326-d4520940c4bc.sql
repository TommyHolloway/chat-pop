-- Add foreign key constraint between user_roles and profiles
-- This ensures proper relationship between profiles and user_roles tables

-- First, let's add the foreign key constraint to user_roles table
-- pointing to profiles.user_id instead of auth.users.id for better RLS handling
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add new foreign key constraint pointing to profiles table
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Update the get_user_role function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT COALESCE(ur.role, 'user'::app_role)
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = _user_id
    ORDER BY CASE ur.role
        WHEN 'admin' THEN 1
        WHEN 'user' THEN 2
        ELSE 3
    END
    LIMIT 1;
$function$;

-- Update the has_role function to be more robust
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
        WHERE p.user_id = _user_id
        AND COALESCE(ur.role, 'user'::app_role) = _role
    );
$function$;