import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ConfidenceScoreIndicatorProps {
  score: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
}

export const ConfidenceScoreIndicator = ({ 
  score, 
  size = 'md', 
  showLabel = false,
  showPercentage = true 
}: ConfidenceScoreIndicatorProps) => {
  const percentage = Math.round(score * 100);
  
  const getColorClass = () => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getProgressColorClass = () => {
    if (score >= 0.8) return '[&>div]:bg-green-600';
    if (score >= 0.5) return '[&>div]:bg-yellow-600';
    return '[&>div]:bg-gray-600';
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={cn('font-medium', textSizeClasses[size])}>
          Confidence:
        </span>
      )}
      <div className="flex-1 min-w-[60px]">
        <Progress 
          value={percentage} 
          className={cn(sizeClasses[size], getProgressColorClass())}
        />
      </div>
      {showPercentage && (
        <span className={cn('font-semibold', textSizeClasses[size], getColorClass())}>
          {percentage}%
        </span>
      )}
    </div>
  );
};
