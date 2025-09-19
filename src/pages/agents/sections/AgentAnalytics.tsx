import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useVisitorBehavior } from '@/hooks/useVisitorBehavior';
import { Users, MessageCircle, Clock, TrendingUp, Eye } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export const AgentAnalytics = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { analytics } = useAnalytics(id!);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const memoizedDateRange = useMemo(() => {
    return dateRange && dateRange.from && dateRange.to ? {
      from: dateRange.from,
      to: dateRange.to
    } : undefined;
  }, [dateRange?.from, dateRange?.to]);

  const { 
    visitorSessions, 
    behaviorEvents, 
    proactiveSuggestions, 
    analytics: visitorAnalytics, 
    loading: visitorLoading, 
    error: visitorError,
    refreshData 
  } = useVisitorBehavior(id!, memoizedDateRange);

  if (visitorError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Failed to load analytics data</p>
          <Button onClick={refreshData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Monitor your agent's performance and visitor behavior</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-auto"
          />
          <Button onClick={refreshData} variant="outline" size="sm" disabled={visitorLoading}>
            {visitorLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
      
      {/* Essential Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.isLoading ? '...' : analytics.totalConversations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Chat conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.isLoading ? '...' : `${analytics.resolutionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">Conversation success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.isLoading ? '...' : `${analytics.avgResponseTime}s`}
            </div>
            <p className="text-xs text-muted-foreground">Agent response speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorLoading ? <Skeleton className="h-8 w-12" /> : visitorAnalytics.totalSessions}
            </div>
            <p className="text-xs text-muted-foreground">Unique visitor sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorLoading ? <Skeleton className="h-8 w-12" /> : visitorAnalytics.totalPageViews}
            </div>
            <p className="text-xs text-muted-foreground">Total pages viewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorLoading ? <Skeleton className="h-8 w-16" /> : `${Math.floor(visitorAnalytics.averageTimeSpent / 60)}m ${visitorAnalytics.averageTimeSpent % 60}s`}
            </div>
            <p className="text-xs text-muted-foreground">Average session time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorLoading ? <Skeleton className="h-8 w-12" /> : `${visitorAnalytics.conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">Visitors to conversations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};