-- Add RLS policy to allow public access to active agents
CREATE POLICY "Public can view active agents"
ON public.agents
FOR SELECT
USING (status = 'active');