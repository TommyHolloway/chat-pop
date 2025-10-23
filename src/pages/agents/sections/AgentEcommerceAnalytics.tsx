import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEcommerceAnalytics } from '@/hooks/useEcommerceAnalytics';
import { startOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Package, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export const AgentEcommerceAnalytics = ({ agent }: { agent: any }) => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const { data: metrics, isLoading } = useEcommerceAnalytics(agent.id, dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">E-commerce Analytics</h2>
          <p className="text-muted-foreground">Track revenue, orders, and cart recovery performance</p>
        </div>
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
