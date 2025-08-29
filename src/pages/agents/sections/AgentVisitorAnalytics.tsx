import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVisitorBehavior } from '@/hooks/useVisitorBehavior';
import { RefreshCw, Users, Eye, Clock, Target, MousePointer, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface AgentVisitorAnalyticsProps {
  agent: any;
}

export const AgentVisitorAnalytics = ({ agent }: AgentVisitorAnalyticsProps) => {
  const { 
    visitorSessions, 
    behaviorEvents, 
    proactiveSuggestions, 
    analytics, 
    loading, 
    error, 
    refreshData 
  } = useVisitorBehavior(agent.id);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visitor Analytics</h2>
            <p className="text-muted-foreground">Track visitor behavior and proactive engagement</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visitor Analytics</h2>
            <p className="text-muted-foreground">Track visitor behavior and proactive engagement</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading visitor analytics: {error}</p>
            <Button onClick={refreshData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visitor Analytics</h2>
          <p className="text-muted-foreground">Track visitor behavior and proactive engagement</p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Unique visitor sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPageViews}</div>
            <p className="text-xs text-muted-foreground">Total pages viewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(analytics.averageTimeSpent / 60)}m {analytics.averageTimeSpent % 60}s</div>
            <p className="text-xs text-muted-foreground">Average session time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Suggestions to conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Proactive Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions Generated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSuggestions}</div>
            <p className="text-xs text-muted-foreground">AI-powered suggestions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions Clicked</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.suggestionsClicked}</div>
            <p className="text-xs text-muted-foreground">Visitor engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations Started</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionsFromSuggestions}</div>
            <p className="text-xs text-muted-foreground">Successful conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tables */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Visitor Sessions</TabsTrigger>
          <TabsTrigger value="suggestions">Proactive Suggestions</TabsTrigger>
          <TabsTrigger value="events">Behavior Events</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visitor Sessions</CardTitle>
              <CardDescription>Latest visitors and their browsing behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>First Page</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitorSessions.slice(0, 10).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        {session.session_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {session.first_page_url || 'Unknown'}
                      </TableCell>
                      <TableCell>{session.total_page_views}</TableCell>
                      <TableCell>
                        {Math.floor(session.total_time_spent / 60)}m {session.total_time_spent % 60}s
                      </TableCell>
                      <TableCell>
                        {format(new Date(session.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visitorSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No visitor sessions yet. Visitors will appear here once they interact with your chat widget.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proactive Suggestions</CardTitle>
              <CardDescription>AI-generated suggestions based on visitor behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proactiveSuggestions.slice(0, 10).map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {suggestion.suggestion_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {suggestion.suggestion_message}
                      </TableCell>
                      <TableCell>
                        <Badge variant={suggestion.confidence_score > 0.8 ? 'default' : 'outline'}>
                          {Math.round(suggestion.confidence_score * 100)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {suggestion.was_shown && <Badge variant="outline" className="text-xs">Shown</Badge>}
                          {suggestion.was_clicked && <Badge variant="outline" className="text-xs">Clicked</Badge>}
                          {suggestion.conversation_started && <Badge variant="default" className="text-xs">Converted</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(suggestion.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {proactiveSuggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No proactive suggestions generated yet. Suggestions will appear as visitors browse and trigger behavior patterns.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Events</CardTitle>
              <CardDescription>Detailed visitor interactions and page events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Page URL</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {behaviorEvents.slice(0, 20).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.page_url}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.time_on_page && `${event.time_on_page}s`}
                        {event.scroll_depth && `${event.scroll_depth}% scroll`}
                        {event.element_selector && `${event.element_selector}`}
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {behaviorEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No behavior events recorded yet. Events will appear as visitors interact with pages containing your chat widget.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};