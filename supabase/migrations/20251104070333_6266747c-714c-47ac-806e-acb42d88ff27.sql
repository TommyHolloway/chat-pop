-- Create function to increment cart recovery attempts in usage_tracking
CREATE OR REPLACE FUNCTION public.increment_cart_recovery_attempts(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month DATE;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::DATE;
  
  INSERT INTO public.usage_tracking (
    user_id,
    month,
    cart_recovery_attempts,
    updated_at
  )
  VALUES (
    p_user_id,
    current_month,
    1,
    NOW()
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    cart_recovery_attempts = usage_tracking.cart_recovery_attempts + 1,
    updated_at = NOW();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.increment_cart_recovery_attempts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_cart_recovery_attempts(uuid) TO service_role;