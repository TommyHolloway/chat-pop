-- Fix security audit summary table access
ALTER TABLE public.security_audit_summary ENABLE ROW LEVEL SECURITY;

-- Only admins can access security audit data
CREATE POLICY "Admin only access to security audit"
ON public.security_audit_summary
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Block all other access
CREATE POLICY "Block non-admin security audit access"
ON public.security_audit_summary
FOR ALL
TO anon
USING (false)
WITH CHECK (false);