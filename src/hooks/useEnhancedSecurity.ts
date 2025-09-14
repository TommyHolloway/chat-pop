import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { validateSensitiveOperation } from '@/lib/validation';

interface SecurityValidationResult {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useEnhancedSecurity = () => {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);

  // Enhanced validation for sensitive operations
  const validateOperation = useCallback(async (
    operation: string,
    data?: any,
    options?: { skipRateLimit?: boolean }
  ): Promise<SecurityValidationResult> => {
    // Allow certain operations without authentication
    const unauthenticatedOperations = ['login', 'signup', 'forgot-password', 'reset-password'];
    
    if (!user && !unauthenticatedOperations.includes(operation)) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    setIsValidating(true);

    try {
      // Client-side rate limiting check
      if (!options?.skipRateLimit && !validateSensitiveOperation(operation, data)) {
        return { 
          allowed: false, 
          reason: 'Rate limit exceeded for this operation',
          severity: 'medium'
        };
      }

      // Server-side validation for sensitive data access
      if (['profile_access', 'lead_access', 'subscriber_access'].includes(operation)) {
        const { data: validationResult, error } = await supabase.rpc(
          'validate_sensitive_data_access' as any,
          {
            table_name: operation.replace('_access', 's'),
            operation_type: 'SELECT'
          }
        );

        if (error || !validationResult) {
          return { 
            allowed: false, 
            reason: 'Server-side validation failed',
            severity: 'high'
          };
        }
      }

      // Enhanced PII protection check
      if (data && operation.includes('pii')) {
        const { data: piiValidationResult, error } = await supabase.rpc(
          'enhanced_pii_protection_check' as any,
          {
            data_fields: data,
            operation_type: operation
          }
        );

        if (error || !piiValidationResult) {
          return { 
            allowed: false, 
            reason: 'PII protection validation failed',
            severity: 'critical'
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Security validation error:', error);
      return { 
        allowed: false, 
        reason: 'Security validation error',
        severity: 'high'
      };
    } finally {
      setIsValidating(false);
    }
  }, [user]);

  // Enhanced security audit
  const runSecurityAudit = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('comprehensive_security_audit' as any);
      
      if (error) {
        console.error('Security audit error:', error);
        toast.error('Failed to run security audit');
        return null;
      }

      // Show notifications based on security level
      const auditResult = data as any;
      const securityLevel = auditResult?.security_level;
      if (securityLevel === 'needs_attention') {
        toast.error('Security audit detected issues requiring attention');
      } else if (securityLevel === 'acceptable') {
        toast.warning('Security audit completed with minor concerns');
      } else if (securityLevel === 'good' || securityLevel === 'excellent') {
        toast.success('Security audit completed successfully');
      }

      return auditResult;
    } catch (error) {
      console.error('Security audit error:', error);
      toast.error('Security audit failed');
      return null;
    }
  }, [user]);

  // Enhanced rate limit check with server-side validation
  const checkEnhancedRateLimit = useCallback(async (
    operation: string,
    maxOperations: number = 10,
    windowMinutes: number = 60
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('enhanced_rate_limit_check' as any, {
        operation_key: operation,
        max_operations: maxOperations,
        window_minutes: windowMinutes,
        track_ip: true
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Enhanced rate limit check error:', error);
      return false;
    }
  }, [user]);

  // Log security event from frontend
  const logSecurityEvent = useCallback(async (
    eventType: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('log_security_event' as any, {
        event_type: eventType,
        user_id_param: user.id,
        details_param: {
          ...details,
          severity,
          frontend_initiated: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  return {
    validateOperation,
    runSecurityAudit,
    checkEnhancedRateLimit,
    logSecurityEvent,
    isValidating
  };
};