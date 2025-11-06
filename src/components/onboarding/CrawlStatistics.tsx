import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, TrendingUp, Clock } from 'lucide-react';

interface CrawlStatisticsProps {
  pagesProcessed: number;
  pagesFound: number;
  successRate: number;
  avgTimePerPage?: number;
  estimatedTimeRemaining?: number;
}

export const CrawlStatistics = ({
  pagesProcessed,
  pagesFound,
  successRate,
  avgTimePerPage,
  estimatedTimeRemaining
}: CrawlStatisticsProps) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Crawl Statistics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Processed</span>
            </div>
            <div className="text-2xl font-bold">
              {pagesProcessed}
              <span className="text-sm text-muted-foreground font-normal">
                /{pagesFound}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {successRate}%
            </div>
          </div>

          {avgTimePerPage && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Time</span>
              </div>
              <div className="text-lg font-semibold">
                {avgTimePerPage.toFixed(1)}s
              </div>
            </div>
          )}

          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Remaining</span>
              </div>
              <div className="text-lg font-semibold">
                {formatTime(estimatedTimeRemaining)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
