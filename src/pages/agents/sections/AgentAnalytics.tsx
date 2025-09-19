import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useVisitorBehavior } from '@/hooks/useVisitorBehavior';
import { Users, MessageCircle, Clock, TrendingUp, Eye, Target, Calendar, Filter } from 'lucide-react';
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
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CardTitle className="text-sm font-medium">Website Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visitorAnalytics.totalSessions}</div>
                <p className="text-xs text-muted-foreground">Unique visitor sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visitorAnalytics.totalPageViews}</div>
                <p className="text-xs text-muted-foreground">Total pages viewed</p>
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
                <CardTitle className="text-sm font-medium">Proactive Suggestions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visitorAnalytics.totalSuggestions}</div>
                <p className="text-xs text-muted-foreground">AI-generated suggestions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {analytics.isLoading ? <Skeleton className="h-8 w-20" /> : analytics.totalConversations.toLocaleString()}
                </CardTitle>
                <CardDescription>Total Conversations</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {analytics.isLoading ? <Skeleton className="h-8 w-16" /> : `${analytics.resolutionRate}%`}
                </CardTitle>
                <CardDescription>Resolution Rate</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {analytics.isLoading ? <Skeleton className="h-8 w-16" /> : `${analytics.avgResponseTime}s`}
                </CardTitle>
                <CardDescription>Avg Response Time</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
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

          {/* Visitor Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Visitor Sessions</CardTitle>
              <CardDescription>Detailed visitor session data</CardDescription>
            </CardHeader>
            <CardContent>
              {visitorLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : visitorSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No visitor sessions found for the selected date range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Page Views</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-xs">{session.session_id?.substring(0, 8)}...</TableCell>
                        <TableCell>{format(new Date(session.created_at), 'MMM dd, HH:mm')}</TableCell>
                        <TableCell>{session.total_time_spent ? `${Math.floor(session.total_time_spent / 60)}m ${session.total_time_spent % 60}s` : '-'}</TableCell>
                        <TableCell>{session.total_page_views || 0}</TableCell>
                        <TableCell className="max-w-48 truncate">{session.user_agent || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Proactive Suggestions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Proactive Suggestions</CardTitle>
              <CardDescription>AI-generated engagement suggestions and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              {visitorLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : proactiveSuggestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No proactive suggestions generated for the selected date range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Suggestion</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Shown</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proactiveSuggestions.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="max-w-64 truncate">{suggestion.suggestion_message}</TableCell>
                        <TableCell>{suggestion.suggestion_type}</TableCell>
                        <TableCell>{format(new Date(suggestion.created_at), 'MMM dd, HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant={suggestion.was_clicked ? 'default' : 'secondary'}>
                            {suggestion.was_clicked ? 'Clicked' : 'Shown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(suggestion.created_at), 'MMM dd, HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Behavior Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Behavior Events</CardTitle>
              <CardDescription>User interaction events tracked on your website</CardDescription>
            </CardHeader>
            <CardContent>
              {visitorLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : behaviorEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No behavior events tracked for the selected date range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Page URL</TableHead>
                      <TableHead>Time on Page</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behaviorEvents.slice(0, 50).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-80 truncate">{event.page_url}</TableCell>
                        <TableCell>{event.time_on_page ? `${event.time_on_page}s` : '-'}</TableCell>
                        <TableCell>{format(new Date(event.created_at), 'MMM dd, HH:mm:ss')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};