-- Fix search path for the update_usage_tracking function
CREATE OR REPLACE FUNCTION public.update_usage_tracking(p_user_id uuid, p_conversation_id uuid DEFAULT NULL::uuid, p_message_count integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month DATE;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Upsert usage tracking for current month
  INSERT INTO public.usage_tracking (
    user_id, 
    month, 
    conversations_count, 
    messages_count,
    message_credits_used,
    updated_at
  )
  VALUES (
    p_user_id,
    current_month,
    CASE WHEN p_conversation_id IS NOT NULL THEN 1 ELSE 0 END,
    p_message_count,
    p_message_count, -- 1 message = 1 credit for now
    NOW()
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    conversations_count = CASE 
      WHEN p_conversation_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM conversations 
        WHERE agent_id IN (
          SELECT id FROM agents WHERE user_id = p_user_id
        ) 
        AND session_id = (
          SELECT session_id FROM conversations WHERE id = p_conversation_id
        )
        AND created_at >= current_month
        AND created_at < current_month + INTERVAL '1 month'
        AND id != p_conversation_id
      ) THEN usage_tracking.conversations_count + 1
      ELSE usage_tracking.conversations_count
    END,
    messages_count = usage_tracking.messages_count + p_message_count,
    message_credits_used = usage_tracking.message_credits_used + p_message_count,
    updated_at = NOW();
END;
$$;