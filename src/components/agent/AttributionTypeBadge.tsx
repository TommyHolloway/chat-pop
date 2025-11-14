import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mail, Clock, Package, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttributionTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

const attributionTypes: Record<string, {
  icon: any;
  label: string;
  color: string;
  tooltip: string;
}> = {
  'email_match': {
    icon: Mail,
    label: 'Email Match',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    tooltip: 'Matched via customer email in lead capture'
  },
  'temporal_proximity': {
    icon: Clock,
    label: 'Time-Based',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    tooltip: 'Matched by conversation timing (within 30 minutes of order)'
  },
  'product_mention': {
    icon: Package,
    label: 'Product Match',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    tooltip: 'Matched by products discussed in conversation'
  },
  'email_match+temporal_proximity': {
    icon: CheckCircle2,
    label: 'Strong Match',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    tooltip: 'Email match with temporal proximity'
  },
  'email_match+product_mention': {
    icon: CheckCircle2,
    label: 'Very Strong',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    tooltip: 'Email and product match combined'
  },
  'all_methods': {
    icon: CheckCircle2,
    label: 'Perfect Match',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    tooltip: 'All attribution methods confirm this match'
  }
};

export const AttributionTypeBadge = ({ type, size = 'md' }: AttributionTypeBadgeProps) => {
  const typeConfig = attributionTypes[type] || {
    icon: TrendingUp,
    label: type.replace(/_/g, ' '),
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    tooltip: 'Attribution method'
  };

  const Icon = typeConfig.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn(typeConfig.color, 'gap-1', textSize)}>
            <Icon className={iconSize} />
            {typeConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{typeConfig.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
