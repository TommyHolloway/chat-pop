-- Add message credits tracking to usage_tracking table
ALTER TABLE public.usage_tracking 
ADD COLUMN messages_count INTEGER DEFAULT 0,
ADD COLUMN message_credits_used INTEGER DEFAULT 0;

-- Update the existing trigger to include new columns
CREATE OR REPLACE FUNCTION public.update_usage_tracking(
  p_user_id UUID,
  p_conversation_id UUID DEFAULT NULL,
  p_message_count INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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