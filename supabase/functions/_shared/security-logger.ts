import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type SecurityEventType = 
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_MISSING'
  | 'UNAUTHORIZED_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'FUNCTION_INVOCATION';

export interface SecurityEvent {
  event_type: SecurityEventType;
  function_name: string;
  user_id?: string;
  agent_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

export async function logSecurityEvent(
  event: SecurityEvent,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    await supabase.from('security_logs').insert({
      event_type: event.event_type,
      function_name: event.function_name,
      user_id: event.user_id,
      agent_id: event.agent_id,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      details: event.details,
      severity: event.severity,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
