import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AgentAnalytics = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { analytics } = useAnalytics(id!);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Monitor your agent's performance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {analytics.isLoading ? '...' : analytics.totalConversations.toLocaleString()}
            </CardTitle>
            <CardDescription>Total Conversations</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {analytics.isLoading ? '...' : `${analytics.resolutionRate}%`}
            </CardTitle>
            <CardDescription>Resolution Rate</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {analytics.isLoading ? '...' : `${analytics.avgResponseTime}s`}
            </CardTitle>
            <CardDescription>Avg Response Time</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};