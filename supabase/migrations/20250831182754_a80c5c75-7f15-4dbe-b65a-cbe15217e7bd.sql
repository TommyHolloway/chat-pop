-- Create function to cleanup empty conversations older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_empty_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete conversations with no messages that are older than 24 hours
  DELETE FROM conversations 
  WHERE id NOT IN (
    SELECT DISTINCT conversation_id 
    FROM messages 
    WHERE conversation_id IS NOT NULL
  )
  AND created_at < NOW() - INTERVAL '24 hours';
  
  -- Log cleanup action
  PERFORM public.log_service_role_operation(
    'empty_conversations_cleanup',
    'conversations',
    jsonb_build_object('cleanup_threshold_hours', 24, 'executed_at', now())
  );
END;
$function$;