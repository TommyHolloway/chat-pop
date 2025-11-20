-- Fix OAuth state token vulnerability
-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Service role can manage oauth states" ON public.shopify_oauth_states;

-- Create secure policy that restricts access to service role only
CREATE POLICY "Service role can manage oauth states" 
ON public.shopify_oauth_states 
FOR ALL 
USING (auth.role() = 'service_role');
