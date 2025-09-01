import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { cn } from '@/lib/utils';

interface PIIProtectedFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'email' | 'phone' | 'text' | 'password';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  table?: string;
  accessReason?: string;
  maskValue?: boolean;
}

export const PIIProtectedField: React.FC<PIIProtectedFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  className,
  table = 'unknown',
  accessReason = 'User input',
  maskValue = false
}) => {
  const [isVisible, setIsVisible] = useState(!maskValue);
  const [hasBeenAccessed, setHasBeenAccessed] = useState(false);
  const { logPIIAccess } = useSecurityMonitoring();

  // Log PII access when field is accessed
  const handleAccess = useCallback(async () => {
    if (!hasBeenAccessed) {
      await logPIIAccess(table, 'FIELD_ACCESS', accessReason, [type]);
      setHasBeenAccessed(true);
    }
  }, [logPIIAccess, table, accessReason, type, hasBeenAccessed]);

  // Log PII modification
  const handleChange = useCallback(async (newValue: string) => {
    onChange(newValue);
    await logPIIAccess(table, 'FIELD_MODIFICATION', `${accessReason} - value changed`, [type]);
  }, [onChange, logPIIAccess, table, accessReason, type]);

  // Handle focus to log access
  const handleFocus = useCallback(() => {
    handleAccess();
  }, [handleAccess]);

  // Toggle visibility for masked fields
  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
    handleAccess();
  }, [isVisible, handleAccess]);

  // Mask the value if needed
  const displayValue = useMemo(() => {
    if (!maskValue || isVisible) return value;
    
    if (type === 'email' && value) {
      const [local, domain] = value.split('@');
      if (domain) {
        return `${local.charAt(0)}${'*'.repeat(Math.max(0, local.length - 2))}${local.charAt(local.length - 1)}@${domain}`;
      }
    }
    
    if (type === 'phone' && value) {
      return value.replace(/\d(?=\d{4})/g, '*');
    }
    
    return '*'.repeat(Math.min(value.length, 12));
  }, [value, maskValue, isVisible, type]);

  // Determine field security level
  const securityLevel = useMemo(() => {
    switch (type) {
      case 'email':
      case 'phone':
        return 'high';
      case 'password':
        return 'critical';
      default:
        return 'medium';
    }
  }, [type]);

  const securityColor = {
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  }[securityLevel];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`pii-${type}-${label}`} className="flex items-center gap-2">
          {label}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Shield className={cn('h-4 w-4', securityColor)} />
              </TooltipTrigger>
              <TooltipContent>
                <p>PII Protected Field - {securityLevel} sensitivity</p>
                <p className="text-xs text-muted-foreground">
                  Access and modifications are logged for security
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        
        {maskValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="h-8 w-8 p-0"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <div className="relative">
        <Input
          id={`pii-${type}-${label}`}
          type={type === 'password' ? 'password' : 'text'}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-10',
            securityLevel === 'critical' && 'border-red-300 focus:border-red-500',
            securityLevel === 'high' && 'border-orange-300 focus:border-orange-500',
            securityLevel === 'medium' && 'border-yellow-300 focus:border-yellow-500'
          )}
        />
        
        {hasBeenAccessed && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>PII access logged</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {securityLevel === 'critical' && (
        <p className="text-xs text-red-600">
          Highly sensitive data - all access is monitored and logged
        </p>
      )}
    </div>
  );
};

// Hook for easier usage
export const usePIIProtection = () => {
  const { logPIIAccess } = useSecurityMonitoring();

  const protectPIIOperation = useCallback(async (
    operation: string,
    table: string,
    reason: string,
    fields: string[] = []
  ) => {
    await logPIIAccess(table, operation, reason, fields);
  }, [logPIIAccess]);

  return { protectPIIOperation };
};