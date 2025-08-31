-- Fix infinite recursion in agents RLS policy
DROP POLICY IF EXISTS "Public can view minimal agent data for chat" ON public.agents;

-- Create a simplified non-recursive policy
CREATE POLICY "Public can view minimal agent data for chat" 
ON public.agents 
FOR SELECT 
USING (status = 'active');