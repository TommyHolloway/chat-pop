-- Fix remaining security warnings

-- 1. Fix function search path security issue  
CREATE OR REPLACE FUNCTION public.get_public_agent_data(agent_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  initial_message text,
  message_bubble_color text,
  chat_interface_theme text,
  profile_image_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.name,
    a.initial_message,
    a.message_bubble_color,
    a.chat_interface_theme,
    a.profile_image_url
  FROM agents a
  WHERE a.id = agent_uuid 
    AND a.status = 'active';
$$;