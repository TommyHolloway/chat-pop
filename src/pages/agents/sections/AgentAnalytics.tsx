import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useVisitorBehavior } from '@/hooks/useVisitorBehavior';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { Users, MessageCircle, Clock, TrendingUp, Eye, AlertCircle } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toUTCStart, toUTCEnd } from '@/lib/dateUtils';

export const AgentAnalytics = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const memoizedDateRange = useMemo(() => {
    if (!dateRange?.from) return undefined;
    
    return {
      from: dateRange.from,
      to: dateRange.to || dateRange.from
    };
  }, [dateRange?.from, dateRange?.to]);

  const { analytics } = useAnalytics(id!, memoizedDateRange);
  
  const visitorStats = useVisitorTracking();
  
  const {
    visitorSessions, 
    behaviorEvents, 
    proactiveSuggestions, 
    analytics: visitorAnalytics, 
    loading: visitorLoading, 
    error: visitorError,
    refreshData 
  } = useVisitorBehavior(id!, memoizedDateRange);

  const [trueConversionRate, setTrueConversionRate] = useState<number>(0);
  const [loadingConversion, setLoadingConversion] = useState(true);

  // Calculate true visitor-to-conversation conversion rate
  useEffect(() => {
    const calculateConversionRate = async () => {
      if (!id || !memoizedDateRange) {
        setLoadingConversion(false);
        return;
      }

      try {
        setLoadingConversion(true);
        
        // Get conversation count for date range
        let conversationsQuery = supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', id);

        if (memoizedDateRange.from && memoizedDateRange.to) {
          conversationsQuery = conversationsQuery
            .gte('created_at', toUTCStart(memoizedDateRange.from))
            .lte('created_at', toUTCEnd(memoizedDateRange.to));
        }

        const { count: conversationCount } = await conversationsQuery;

        // Get visitor sessions count (already filtered by date in hook)
        const totalSessions = visitorAnalytics.totalSessions;

        // Calculate conversion rate
        const rate = totalSessions > 0 
          ? Math.round(((conversationCount || 0) / totalSessions) * 100)
          : 0;

        setTrueConversionRate(rate);
      } catch (error) {
        console.error('Error calculating conversion rate:', error);
        setTrueConversionRate(0);
      } finally {
        setLoadingConversion(false);
      }
    };

    calculateConversionRate();
  }, [id, memoizedDateRange, visitorAnalytics.totalSessions]);

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
      
      {/* Data Limit Warnings */}
      {visitorSessions.length >= 200 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Showing 200 most recent sessions. Narrow your date range for complete data.
          </AlertDescription>
        </Alert>
      )}

      {/* Essential Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Monthly Visitors Card */}
        <Card className={visitorStats.currentMonthVisitors >= visitorStats.limit * 0.8 ? 'border-warning' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Monthly Visitors
              <Badge variant={visitorStats.currentMonthVisitors >= visitorStats.limit ? 'destructive' : 'secondary'} className="text-xs font-normal">
                {visitorStats.plan}
              </Badge>
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorStats.isLoading ? '...' : `${visitorStats.currentMonthVisitors.toLocaleString()} / ${visitorStats.limit.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique visitors this month
            </p>
            {visitorStats.currentMonthVisitors >= visitorStats.limit * 0.8 && (
              <Alert variant={visitorStats.currentMonthVisitors >= visitorStats.limit ? 'destructive' : 'default'} className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {visitorStats.currentMonthVisitors >= visitorStats.limit
                    ? "You've reached your visitor limit. Upgrade to continue serving customers."
                    : "You're approaching your visitor limit. Consider upgrading soon."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Conversations
              <Badge variant="secondary" className="text-xs font-normal">
                {dateRange ? 'Date Range' : 'All Time'}
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Resolution Rate
              <Badge variant="secondary" className="text-xs font-normal">
                {dateRange ? 'Date Range' : 'All Time'}
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Avg Response Time
              <Badge variant="secondary" className="text-xs font-normal">
                {dateRange ? 'Date Range' : 'All Time'}
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Sessions
              <Badge variant="secondary" className="text-xs font-normal">
                Date Range
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Page Views
              <Badge variant="secondary" className="text-xs font-normal">
                Date Range
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Avg Time
              <Badge variant="secondary" className="text-xs font-normal">
                Date Range
              </Badge>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Conversion Rate
              <Badge variant="secondary" className="text-xs font-normal">
                Date Range
              </Badge>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingConversion ? <Skeleton className="h-8 w-12" /> : `${trueConversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">Visitors to conversations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};