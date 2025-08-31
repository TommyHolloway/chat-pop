-- Remove the insecure public SELECT policy that exposes all agent data
DROP POLICY IF EXISTS "Public can view minimal agent data for chat" ON public.agents;

-- Add a comment to document that public access should use the get_public_agent_data function instead
COMMENT ON FUNCTION public.get_public_agent_data(uuid) IS 'Public function to safely access minimal agent data needed for chat functionality. Use this instead of direct table access to prevent exposure of sensitive business configuration.';

-- Ensure the function has proper permissions for anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_agent_data(uuid) TO anon;