import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  action: string;
  details: any;
  created_at: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface PIIAccessLog {
  table: string;
  operation: string;
  pii_fields: string[];
  access_reason: string;
  timestamp: string;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [piiAccessLogs, setPiiAccessLogs] = useState<PIIAccessLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Log PII access from frontend
  const logPIIAccess = useCallback(async (
    table: string,
    operation: string,
    reason?: string,
    fields?: string[]
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('log_pii_access', {
        table_name: table,
        operation_type: operation,
        access_reason: reason || 'Frontend access',
        pii_fields: fields || []
      });

      if (error) {
        console.error('Failed to log PII access:', error);
      }
    } catch (error) {
      console.error('PII access logging error:', error);
    }
  }, [user]);

  // Fetch recent security events
  const fetchSecurityEvents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .or('action.like.%SECURITY%,action.like.%PII_ACCESS%')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const events = data.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details || {},
        created_at: log.created_at,
        severity: determineSeverity(log.action)
      }));

      setSecurityEvents(events);

      // Extract PII access logs
      const piiLogs = data
        .filter(log => log.action.startsWith('PII_ACCESS:'))
        .map(log => {
          const details = log.details as any || {};
          return {
            table: details.table || 'unknown',
            operation: details.operation || 'unknown',
            pii_fields: details.pii_fields_accessed || [],
            access_reason: details.access_reason || 'Unknown',
            timestamp: log.created_at
          };
        });

      setPiiAccessLogs(piiLogs);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast.error('Failed to load security events');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Determine severity level based on action type
  const determineSeverity = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
    if (action.includes('CRITICAL') || action.includes('suspicious_pii_access')) {
      return 'critical';
    }
    if (action.includes('ERROR') || action.includes('VIOLATION')) {
      return 'high';
    }
    if (action.includes('WARN') || action.includes('PII_ACCESS')) {
      return 'medium';
    }
    return 'low';
  };

  // Monitor for suspicious activity patterns
  const checkSuspiciousActivity = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('detect_suspicious_pii_access');
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }, [user]);

  // Set up real-time monitoring
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('security-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEvent = payload.new as any;
          if (newEvent.action.includes('SECURITY') || newEvent.action.includes('PII_ACCESS')) {
            setSecurityEvents(prev => [{
              id: newEvent.id,
              action: newEvent.action,
              details: newEvent.details || {},
              created_at: newEvent.created_at,
              severity: determineSeverity(newEvent.action)
            }, ...prev.slice(0, 49)]);

            // Show notification for high/critical events
            if (determineSeverity(newEvent.action) === 'critical') {
              toast.error('Critical security event detected!', {
                description: 'Please review your security dashboard immediately.'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch events on mount
  useEffect(() => {
    fetchSecurityEvents();
  }, [fetchSecurityEvents]);

  return {
    securityEvents,
    piiAccessLogs,
    loading,
    logPIIAccess,
    fetchSecurityEvents,
    checkSuspiciousActivity
  };
};