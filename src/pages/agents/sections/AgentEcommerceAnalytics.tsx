import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEcommerceAnalytics } from '@/hooks/useEcommerceAnalytics';
import { startOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Package, Calendar, ShoppingBag, Download, Loader2, Users, Repeat, Target } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MultiTouchAttributionChart } from '@/components/agent/MultiTouchAttributionChart';
import { Badge } from '@/components/ui/badge';

export const AgentEcommerceAnalytics = ({ agent }: { agent: any }) => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [isImporting, setIsImporting] = useState(false);
  const [clvData, setClvData] = useState<any>(null);
  const [isLoadingClv, setIsLoadingClv] = useState(false);

  const { data: metrics, isLoading } = useEcommerceAnalytics(agent.id, dateRange);

  const handleImportHistoricalData = async () => {
    setIsImporting(true);
    try {
      const { error } = await supabase.functions.invoke('import-shopify-orders', {
        body: { agentId: agent.id, days: 90 }
      });
      
      if (error) throw error;
      
      toast.success('Historical data imported successfully');
      window.location.reload();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  const fetchClvData = async () => {
    setIsLoadingClv(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-customer-clv', {
        body: { agentId: agent.id }
      });
      
      if (error) throw error;
      setClvData(data?.summary || null);
    } catch (error) {
      console.error('CLV fetch error:', error);
    } finally {
      setIsLoadingClv(false);
    }
  };

  useEffect(() => {
    if (agent.shopify_config?.store_domain) {
      fetchClvData();
    }
  }, [agent.id]);
  
  // Fetch previous period metrics for comparison
  const previousPeriodStart = new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime()));
  const { data: previousMetrics } = useEcommerceAnalytics(agent.id, {
    from: previousPeriodStart,
    to: dateRange.from
  });

  const isShopifyConnected = agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token;

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return { value: change, isPositive: change >= 0 };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isShopifyConnected) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Shopify Not Connected</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Connect your Shopify store to unlock e-commerce analytics including revenue tracking, order monitoring, and cart recovery metrics.
          </p>
          <Button onClick={() => window.location.href = './integrations'}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Connect Shopify Store
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">E-commerce Analytics</h2>
          <p className="text-muted-foreground">Track revenue, orders, and cart recovery performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleImportHistoricalData}
            disabled={isImporting}
            variant="outline"
            size="sm"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Import Historical Data
              </>
            )}
          </Button>
          <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium">Select Date Range</p>
              <div className="grid gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => setDateRange({ from: startOfMonth(new Date()), to: new Date() })}
                >
                  This Month
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => {
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                    setDateRange({ from: lastMonth, to: lastMonthEnd });
                  }}
                >
                  Last Month
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => {
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    setDateRange({ from: thirtyDaysAgo, to: now });
                  }}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalRevenue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                from {metrics?.totalOrders || 0} orders
                {previousMetrics && (() => {
                  const change = calculateChange(metrics?.totalRevenue || 0, previousMetrics?.totalRevenue || 0);
                  return change ? (
                    <span className={cn("ml-2", change.isPositive ? "text-green-600" : "text-red-600")}>
                      {change.isPositive ? "↑" : "↓"} {Math.abs(change.value).toFixed(1)}%
                    </span>
                  ) : null;
                })()}
              </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Generated</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              via AI assistant
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carts Recovered</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cartsRecovered || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.recoveryRate?.toFixed(1) || '0.0'}% recovery rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.avgOrderValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CLV Metrics */}
      {clvData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clvData.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {clvData.vipCustomers || 0} VIP customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Customer Rate</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clvData.repeatCustomerRate ? `${clvData.repeatCustomerRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                Customers with 2+ orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${clvData.averageLifetimeValue ? clvData.averageLifetimeValue.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per customer
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attribution Metrics */}
      {metrics?.attributionMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attributed Revenue</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.attributionMetrics.attributedRevenue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.attributionMetrics.attributionRate?.toFixed(1) || '0'}% attribution rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attributed Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.attributionMetrics.attributedOrderCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {metrics.attributionMetrics.orderCount || 0} total orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.attributionMetrics.avgConfidence * 100)?.toFixed(0) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Attribution confidence
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence Distribution</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">High: {metrics.attributionMetrics.confidenceDistribution?.high || 0}</Badge>
                <Badge variant="secondary">Med: {metrics.attributionMetrics.confidenceDistribution?.medium || 0}</Badge>
                <Badge variant="outline">Low: {metrics.attributionMetrics.confidenceDistribution?.low || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Multi-Touch Attribution Chart */}
      {metrics?.attributionMetrics?.attributionBreakdown && (
        <MultiTouchAttributionChart
          data={Object.entries(metrics.attributionMetrics.attributionBreakdown).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: value as number,
            color: name === 'direct' ? 'hsl(var(--primary))' 
                 : name === 'multi_touch' ? 'hsl(var(--chart-2))'
                 : name === 'email_match' ? 'hsl(var(--chart-3))'
                 : name === 'temporal_proximity' ? 'hsl(var(--chart-4))'
                 : 'hsl(var(--muted))'
          }))}
        />
      )}

      {/* Top Revenue Conversations */}
      {metrics?.topRevenueConversations && metrics.topRevenueConversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Conversations</CardTitle>
            <CardDescription>Conversations that drove the most revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topRevenueConversations.map((conv: any) => (
                <div key={conv.conversation_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Session: {conv.session_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.order_count} order{conv.order_count > 1 ? 's' : ''} • {(conv.avg_confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${Number(conv.total_revenue).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>Daily revenue and order trends</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics?.chartData && metrics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available for selected date range
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
