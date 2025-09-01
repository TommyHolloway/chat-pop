import React from 'react';
import { AlertTriangle, Shield, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SecurityAlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  title,
  description,
  severity,
  onDismiss,
  actionLabel,
  onAction,
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 text-red-900';
      case 'high':
        return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'low':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      default:
        return '';
    }
  };

  return (
    <Alert 
      variant={getVariant()}
      className={cn(
        severity && getSeverityColor(),
        'relative',
        className
      )}
    >
      {getIcon()}
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {severity && (
          <span className="text-xs font-normal opacity-70 uppercase">
            {severity}
          </span>
        )}
      </AlertTitle>
      {description && (
        <AlertDescription className="mt-2">
          {description}
        </AlertDescription>
      )}
      
      <div className="flex items-center gap-2 mt-4">
        {actionLabel && onAction && (
          <Button
            size="sm"
            variant={type === 'error' ? 'destructive' : 'outline'}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

// Security status indicator component
interface SecurityStatusProps {
  level: 'excellent' | 'good' | 'acceptable' | 'needs_attention';
  className?: string;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ level, className }) => {
  const getStatusConfig = () => {
    switch (level) {
      case 'excellent':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: Shield,
          label: 'Excellent Security'
        };
      case 'good':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: Shield,
          label: 'Good Security'
        };
      case 'acceptable':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: Info,
          label: 'Acceptable Security'
        };
      case 'needs_attention':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: AlertTriangle,
          label: 'Needs Attention'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: Info,
          label: 'Unknown Status'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
      config.color,
      config.bgColor,
      className
    )}>
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
};