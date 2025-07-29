import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  customerDetailsService, 
  accountDetailsService, 
  revenueDetailsService, 
  transactionDetailsService 
} from '@/services/dashboardDetailsService';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { cn } from '@/lib/utils';

// Stat Card Component
const StatCard = ({ title, value, change, trend, description, icon: Icon }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            )}>
              {change}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Breakdown Card Component
const BreakdownCard = ({ title, data, type = 'list' }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'list' ? (
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => {
              const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{key}</span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                  <span className="text-sm font-bold">{value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => {
              const percentage = total > 0 ? (value / total * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{key}</span>
                    <span className="font-medium">{value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardDetail() {
  const { type, widgetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [trends, setTrends] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Widget type configurations
  const widgetConfigs = {
    customers: {
      title: 'Customer Analytics',
      icon: Users,
      color: 'text-blue-500',
      service: customerDetailsService
    },
    accounts: {
      title: 'Account Analytics',
      icon: CreditCard,
      color: 'text-green-500',
      service: accountDetailsService
    },
    revenue: {
      title: 'Revenue Analytics',
      icon: DollarSign,
      color: 'text-yellow-500',
      service: revenueDetailsService
    },
    transactions: {
      title: 'Transaction Analytics',
      icon: Activity,
      color: 'text-purple-500',
      service: transactionDetailsService
    }
  };

  const config = widgetConfigs[type] || {};
  const IconComponent = config.icon || BarChart3;

  useEffect(() => {
    fetchData();
  }, [type, widgetId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const service = config.service;
      if (!service) {
        throw new Error('Invalid widget type');
      }

      // Fetch all data in parallel
      const [overviewResult, breakdownResult, trendsResult] = await Promise.all([
        service.getOverviewStats(),
        service.getBreakdown ? service.getBreakdown() : Promise.resolve({ data: null }),
        service.getTrends ? service.getTrends(30) : 
          (service.getCustomerTrends ? service.getCustomerTrends(30) : 
          (service.getRevenueTrends ? service.getRevenueTrends(30) : 
          (service.getHourlyDistribution ? service.getHourlyDistribution() : 
          Promise.resolve({ data: null }))))
      ]);

      if (overviewResult.error) throw new Error(overviewResult.error);
      
      setData(overviewResult.data);
      setBreakdown(breakdownResult.data);
      setTrends(trendsResult.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    const exportData = {
      type,
      overview: data,
      breakdown,
      trends,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">Error loading data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg bg-secondary", config.color)}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.title}</h1>
              <p className="text-sm text-muted-foreground">
                Detailed analytics and insights
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Overview Stats */}
          {data && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {type === 'customers' && (
                <>
                  <StatCard
                    title="Total Customers"
                    value={data.totalCustomers?.toLocaleString()}
                    change={`+${data.growthRate}%`}
                    trend="up"
                    description="All registered customers"
                    icon={Users}
                  />
                  <StatCard
                    title="Active Customers"
                    value={data.activeCustomers?.toLocaleString()}
                    description="Customers with active accounts"
                    icon={Activity}
                  />
                  <StatCard
                    title="New This Month"
                    value={data.newCustomersMonth?.toLocaleString()}
                    description="Newly registered customers"
                    icon={Calendar}
                  />
                  <StatCard
                    title="Customer Segments"
                    value={Object.keys(data.segments || {}).length}
                    description="Different customer types"
                    icon={PieChart}
                  />
                </>
              )}

              {type === 'accounts' && (
                <>
                  <StatCard
                    title="Total Accounts"
                    value={data.totalAccounts?.toLocaleString()}
                    description="All account types"
                    icon={CreditCard}
                  />
                  <StatCard
                    title="Active Accounts"
                    value={data.activeAccounts?.toLocaleString()}
                    change={`${((data.activeAccounts / data.totalAccounts) * 100).toFixed(1)}%`}
                    trend="up"
                    description="Currently active"
                    icon={Activity}
                  />
                  <StatCard
                    title="Total Balance"
                    value={`SAR ${(data.totalBalance / 1000000).toFixed(1)}M`}
                    description="Sum of all active accounts"
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Average Balance"
                    value={`SAR ${(data.averageBalance / 1000).toFixed(1)}K`}
                    description="Per active account"
                    icon={BarChart3}
                  />
                </>
              )}

              {type === 'revenue' && (
                <>
                  <StatCard
                    title="Current Month"
                    value={`SAR ${(data.currentMonth / 1000000).toFixed(2)}M`}
                    change={`+${data.growthRate}%`}
                    trend={parseFloat(data.growthRate) >= 0 ? 'up' : 'down'}
                    description="Month to date revenue"
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Previous Month"
                    value={`SAR ${(data.previousMonth / 1000000).toFixed(2)}M`}
                    description="Last month's total"
                    icon={Calendar}
                  />
                  <StatCard
                    title="Year to Date"
                    value={`SAR ${(data.yearToDate / 1000000).toFixed(1)}M`}
                    description="Total YTD revenue"
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Daily Average"
                    value={`SAR ${(data.dailyAverage / 1000).toFixed(1)}K`}
                    description="Average daily revenue"
                    icon={BarChart3}
                  />
                </>
              )}

              {type === 'transactions' && (
                <>
                  <StatCard
                    title="Today's Count"
                    value={data.todayCount?.toLocaleString()}
                    description="Transactions today"
                    icon={Activity}
                  />
                  <StatCard
                    title="This Week"
                    value={data.weekCount?.toLocaleString()}
                    description="Week to date"
                    icon={Calendar}
                  />
                  <StatCard
                    title="Today's Volume"
                    value={`SAR ${(data.todayVolume / 1000000).toFixed(1)}M`}
                    description="Total transaction value"
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Success Rate"
                    value={`${data.successRate}%`}
                    trend="up"
                    description="Transaction success rate"
                    icon={TrendingUp}
                  />
                </>
              )}
            </div>
          )}

          {/* Segment/Type Breakdown for Overview */}
          {data && data.segments && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  data={Object.entries(data.segments).map(([segment, count]) => ({
                    segment,
                    count
                  }))}
                  chartType="pie"
                  xAxisKey="segment"
                  yAxisKey="count"
                  showLegend={true}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4 mt-4">
          {breakdown && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {type === 'customers' && (
                <>
                  <BreakdownCard title="By Branch" data={breakdown.byBranch || {}} />
                  <BreakdownCard title="By Age Group" data={breakdown.byAgeGroup || {}} type="bar" />
                  <BreakdownCard title="By Gender" data={breakdown.byGender || {}} />
                </>
              )}

              {type === 'accounts' && (
                <>
                  <BreakdownCard title="By Status" data={breakdown.byStatus || {}} />
                  <BreakdownCard title="By Currency" data={breakdown.byCurrency || {}} />
                  <BreakdownCard title="By Balance Range" data={breakdown.byBalanceRange || {}} type="bar" />
                </>
              )}

              {type === 'revenue' && (
                <>
                  <BreakdownCard title="By Product" data={breakdown.byProduct || {}} />
                  <BreakdownCard title="By Revenue Type" data={breakdown.byRevenueType || {}} type="bar" />
                </>
              )}

              {type === 'transactions' && (
                <>
                  <BreakdownCard title="By Type" data={breakdown.byType || {}} />
                  <BreakdownCard title="By Status" data={breakdown.byStatus || {}} />
                  <BreakdownCard title="By Channel" data={breakdown.byChannel || {}} type="bar" />
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 mt-4">
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {type === 'transactions' ? 'Hourly Distribution' : '30-Day Trend'}
                </CardTitle>
                <CardDescription>
                  {type === 'transactions' 
                    ? 'Transaction distribution by hour' 
                    : `${config.title} trends over the last 30 days`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  data={trends.dates?.map((date, index) => ({
                    date: date,
                    value: trends.values[index]
                  })) || trends.hours?.map((hour, index) => ({
                    hour: hour,
                    value: trends.values[index]
                  }))}
                  chartType={type === 'transactions' ? 'bar' : 'line'}
                  xAxisKey={type === 'transactions' ? 'hour' : 'date'}
                  yAxisKey="value"
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}