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
  transactionDetailsService,
  loanDetailsService,
  branchDetailsService,
  collectionDetailsService,
  productDetailsService,
  chartDetailsService
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
    },
    loans: {
      title: 'Loan Portfolio Analytics',
      icon: DollarSign,
      color: 'text-orange-500',
      service: loanDetailsService
    },
    loan: {
      title: 'Loan Portfolio Analytics',
      icon: DollarSign,
      color: 'text-orange-500',
      service: loanDetailsService
    },
    branches: {
      title: 'Branch Performance Analytics',
      icon: BarChart3,
      color: 'text-indigo-500',
      service: branchDetailsService
    },
    branch: {
      title: 'Branch Performance Analytics',
      icon: BarChart3,
      color: 'text-indigo-500',
      service: branchDetailsService
    },
    collection: {
      title: 'Collection Analytics',
      icon: TrendingUp,
      color: 'text-red-500',
      service: collectionDetailsService
    },
    collections: {
      title: 'Collection Analytics',
      icon: TrendingUp,
      color: 'text-red-500',
      service: collectionDetailsService
    },
    products: {
      title: 'Product Performance Analytics',
      icon: PieChart,
      color: 'text-teal-500',
      service: productDetailsService
    },
    product: {
      title: 'Product Performance Analytics',
      icon: PieChart,
      color: 'text-teal-500',
      service: productDetailsService
    },
    customer: {
      title: 'Customer Segment Analytics',
      icon: Users,
      color: 'text-blue-500',
      service: chartDetailsService,
      isChart: true
    },
    daily: {
      title: 'Daily Transaction Analytics',
      icon: Activity,
      color: 'text-purple-500',
      service: chartDetailsService,
      isChart: true
    },
    // Add more common widget types
    kpi: {
      title: 'Key Performance Indicators',
      icon: BarChart3,
      color: 'text-blue-500',
      service: customerDetailsService // Default to customer service for KPIs
    },
    chart: {
      title: 'Chart Analytics',
      icon: BarChart3,
      color: 'text-gray-500',
      service: chartDetailsService,
      isChart: true
    },
    performance: {
      title: 'Performance Analytics',
      icon: TrendingUp,
      color: 'text-green-500',
      service: branchDetailsService
    },
    portfolio: {
      title: 'Portfolio Analytics',
      icon: PieChart,
      color: 'text-purple-500',
      service: loanDetailsService
    },
    // Overview type for dashboard widgets
    overview: {
      title: 'Overview Analytics',
      icon: BarChart3,
      color: 'text-blue-500',
      service: chartDetailsService,
      isChart: true
    },
    // Generic fallback for unknown types
    default: {
      title: 'Analytics',
      icon: BarChart3,
      color: 'text-gray-500',
      service: customerDetailsService
    }
  };

  const config = widgetConfigs[type] || widgetConfigs.default || {};
  const IconComponent = config.icon || BarChart3;

  // Effect to fetch data
  useEffect(() => {
    if (type && widgetId) {
      fetchData();
    }
  }, [type, widgetId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const service = config.service;
      if (!service) {
        // If no service is configured, try to handle as a generic widget
        console.warn(`No service configured for widget type: ${type}`);
        setError(`Widget type "${type}" is not supported`);
        setLoading(false);
        return;
      }

      // Handle chart widgets differently
      if (config.isChart) {
        const chartResult = await service.getDetailsByChartType(type, widgetId);
        if (chartResult.error) throw new Error(chartResult.error);
        setData(chartResult.data);
        setBreakdown(null);
        setTrends(null);
        return;
      }

      // Fetch all data in parallel for regular widgets
      const [overviewResult, breakdownResult, trendsResult] = await Promise.all([
        service.getOverviewStats(),
        service.getBreakdown ? service.getBreakdown() : Promise.resolve({ data: null }),
        service.getTrends ? service.getTrends(30) : 
          (service.getCustomerTrends ? service.getCustomerTrends(30) : 
          (service.getRevenueTrends ? service.getRevenueTrends(30) : 
          (service.getLoanTrends ? service.getLoanTrends(30) :
          (service.getBranchTrends ? service.getBranchTrends(null, 30) :
          (service.getCollectionTrends ? service.getCollectionTrends(30) :
          (service.getProductTrends ? service.getProductTrends(null, 30) :
          (service.getHourlyDistribution ? service.getHourlyDistribution() : 
          Promise.resolve({ data: null }))))))))
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

                {(type === 'loans' || type === 'loan') && (
                  <>
                    <StatCard
                      title="Total Loans"
                      value={data.totalLoans?.toLocaleString()}
                      description="All loan accounts"
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Active Loans"
                      value={data.activeLoans?.toLocaleString()}
                      description="Currently active"
                      icon={Activity}
                    />
                    <StatCard
                      title="Total Outstanding"
                      value={`SAR ${(data.totalOutstanding / 1000000).toFixed(1)}M`}
                      description="Total amount outstanding"
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="NPL Ratio"
                      value={`${data.nplRatio}%`}
                      trend={parseFloat(data.nplRatio) > 5 ? 'down' : 'up'}
                      description="Non-performing loans"
                      icon={TrendingDown}
                    />
                  </>
                )}

                {(type === 'branches' || type === 'branch') && (
                  <>
                    <StatCard
                      title="Total Branches"
                      value={data.totalBranches?.toLocaleString()}
                      description="All branch locations"
                      icon={BarChart3}
                    />
                    <StatCard
                      title="Total Customers"
                      value={data.totalCustomers?.toLocaleString()}
                      description="Across all branches"
                      icon={Users}
                    />
                    <StatCard
                      title="Top Branch"
                      value={data.topBranch}
                      description={`SAR ${(data.topBranchBalance / 1000000).toFixed(1)}M`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Avg per Branch"
                      value={`SAR ${(data.averageBalancePerBranch / 1000000).toFixed(1)}M`}
                      description="Average balance"
                      icon={BarChart3}
                    />
                  </>
                )}

                {(type === 'collection' || type === 'collections') && (
                  <>
                    <StatCard
                      title="Total Cases"
                      value={data.totalCases?.toLocaleString()}
                      description="All collection cases"
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Active Cases"
                      value={data.activeCases?.toLocaleString()}
                      description="Currently being pursued"
                      icon={Activity}
                    />
                    <StatCard
                      title="Collection Rate"
                      value={`${data.collectionRate}%`}
                      trend="up"
                      description="Amount collected vs outstanding"
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Total Collected"
                      value={`SAR ${(data.totalCollected / 1000000).toFixed(1)}M`}
                      description="Total amount recovered"
                      icon={DollarSign}
                    />
                  </>
                )}

                {(type === 'products' || type === 'product') && (
                  <>
                    <StatCard
                      title="Total Products"
                      value={data.totalProducts?.toLocaleString()}
                      description="All product offerings"
                      icon={PieChart}
                    />
                    <StatCard
                      title="Active Products"
                      value={data.activeProducts?.toLocaleString()}
                      description="Currently available"
                      icon={Activity}
                    />
                    <StatCard
                      title="Top Product"
                      value={data.topProduct}
                      description={`SAR ${(data.topProductRevenue / 1000000).toFixed(1)}M revenue`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Avg Interest Rate"
                      value={`${data.averageInterestRate?.toFixed(2)}%`}
                      description="Across all products"
                      icon={BarChart3}
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
                  clickable={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Special handling for chart widgets */}
          {config.isChart && data && (
            <div className="grid gap-4">
              {type === 'overview' && widgetId === 'total_assets' && data.overview && (
                <>
                  {/* Overview Statistics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Total Assets"
                      value={data.overview.totalAssets >= 1000000000 
                        ? `SAR ${(data.overview.totalAssets / 1000000000).toFixed(2)}B`
                        : data.overview.totalAssets >= 1000000
                        ? `SAR ${(data.overview.totalAssets / 1000000).toFixed(2)}M`
                        : `SAR ${data.overview.totalAssets.toLocaleString()}`}
                      description="Combined deposits and loans"
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Total Deposits"
                      value={data.overview.totalDeposits >= 1000000000
                        ? `SAR ${(data.overview.totalDeposits / 1000000000).toFixed(2)}B`
                        : data.overview.totalDeposits >= 1000000
                        ? `SAR ${(data.overview.totalDeposits / 1000000).toFixed(2)}M`
                        : `SAR ${data.overview.totalDeposits.toLocaleString()}`}
                      description={`${data.overview.depositRatio}% of total assets`}
                      icon={CreditCard}
                    />
                    <StatCard
                      title="Total Loans"
                      value={data.overview.totalLoans >= 1000000000
                        ? `SAR ${(data.overview.totalLoans / 1000000000).toFixed(2)}B`
                        : data.overview.totalLoans >= 1000000
                        ? `SAR ${(data.overview.totalLoans / 1000000).toFixed(2)}M`
                        : `SAR ${data.overview.totalLoans.toLocaleString()}`}
                      description={`${data.overview.loanRatio}% of total assets`}
                      icon={Activity}
                    />
                  </div>

                  {/* Account Types Breakdown */}
                  {data.accountTypes && Object.keys(data.accountTypes).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Deposit Accounts by Type</CardTitle>
                        <CardDescription>Distribution of deposit accounts across different types</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(data.accountTypes).map(([typeId, info]) => (
                            <div key={typeId} className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Account Type {typeId}</span>
                                <p className="text-sm text-muted-foreground">{info.count} accounts</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">SAR {(info.balance / 1000000).toFixed(1)}M</p>
                                <p className="text-sm text-muted-foreground">
                                  {((info.balance / data.overview.totalDeposits) * 100).toFixed(1)}% of deposits
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Loan Products Breakdown */}
                  {data.loanProducts && Object.keys(data.loanProducts).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Loan Portfolio by Product</CardTitle>
                        <CardDescription>Outstanding loan balances by product type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(data.loanProducts).map(([productId, info]) => (
                            <div key={productId} className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Product {productId}</span>
                                <p className="text-sm text-muted-foreground">{info.count} loans</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">SAR {(info.balance / 1000000).toFixed(1)}M</p>
                                <p className="text-sm text-muted-foreground">
                                  {((info.balance / data.overview.totalLoans) * 100).toFixed(1)}% of loans
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metrics Summary */}
                  {data.metrics && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Asset Metrics</CardTitle>
                        <CardDescription>Key performance indicators</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Average Account Balance</p>
                            <p className="text-xl font-semibold">
                              SAR {(data.metrics.averageAccountBalance / 1000).toFixed(1)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average Loan Balance</p>
                            <p className="text-xl font-semibold">
                              SAR {(data.metrics.averageLoanBalance / 1000).toFixed(1)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Accounts</p>
                            <p className="text-xl font-semibold">{data.metrics.totalAccounts.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Loan Accounts</p>
                            <p className="text-xl font-semibold">{data.metrics.totalLoanAccounts.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {(type === 'monthly' || type === 'overview' && widgetId === 'monthly_revenue') && data.overview && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Current Month Revenue"
                      value={`SAR ${(data.overview.currentMonthRevenue / 1000000).toFixed(2)}M`}
                      description="Month to date"
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Previous Month Revenue"
                      value={`SAR ${(data.overview.previousMonthRevenue / 1000000).toFixed(2)}M`}
                      description="Last month total"
                      icon={Calendar}
                    />
                    <StatCard
                      title="Average Monthly Revenue"
                      value={`SAR ${(data.overview.avgMonthlyRevenue / 1000000).toFixed(2)}M`}
                      description="6-month average"
                      icon={TrendingUp}
                    />
                  </div>
                </>
              )}

              {(type === 'customer' && widgetId === 'customer_growth' || type === 'overview' && widgetId === 'customer_growth') && data.overview && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Total Customers"
                      value={data.overview.totalCustomers.toLocaleString()}
                      change={`+${data.overview.growthRate}%`}
                      trend="up"
                      description="All active customers"
                      icon={Users}
                    />
                    <StatCard
                      title="New This Month"
                      value={data.overview.newThisMonth.toLocaleString()}
                      description="Newly registered"
                      icon={Activity}
                    />
                    <StatCard
                      title="New Last Month"
                      value={data.overview.newLastMonth.toLocaleString()}
                      description="Previous month"
                      icon={Calendar}
                    />
                    <StatCard
                      title="Avg Monthly Growth"
                      value={Math.round(data.overview.avgMonthlyGrowth).toLocaleString()}
                      description="12-month average"
                      icon={TrendingUp}
                    />
                  </div>
                </>
              )}

              {(type === 'transaction' && widgetId === 'transaction_volume' || type === 'overview' && widgetId === 'transaction_volume') && data.overview && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Today's Volume"
                      value={`SAR ${(data.overview.todayVolume / 1000000).toFixed(2)}M`}
                      description={`${data.overview.todayCount.toLocaleString()} transactions`}
                      icon={Activity}
                    />
                    <StatCard
                      title="This Week"
                      value={`SAR ${(data.overview.weekVolume / 1000000).toFixed(2)}M`}
                      description={`${data.overview.weekCount.toLocaleString()} transactions`}
                      icon={Calendar}
                    />
                    <StatCard
                      title="This Month"
                      value={`SAR ${(data.overview.monthVolume / 1000000).toFixed(2)}M`}
                      description={`${data.overview.monthCount.toLocaleString()} transactions`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Avg Transaction Size"
                      value={`SAR ${(data.overview.avgTransactionSize / 1000).toFixed(1)}K`}
                      description="Monthly average"
                      icon={BarChart3}
                    />
                  </div>
                </>
              )}

              {(type === 'performance' && widgetId === 'performance_radar' || type === 'overview' && widgetId === 'performance_radar') && data.overview && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Overall Score"
                      value={`${data.overview.overallScore.toFixed(1)}/100`}
                      trend="up"
                      description="Combined performance score"
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Total Revenue"
                      value={`SAR ${(data.overview.totalRevenue / 1000000000).toFixed(2)}B`}
                      description={`Score: ${data.overview.performanceMetrics.revenue.toFixed(0)}/100`}
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Customer Base"
                      value={data.overview.customerCount.toLocaleString()}
                      description={`Score: ${data.overview.performanceMetrics.customers.toFixed(0)}/100`}
                      icon={Users}
                    />
                  </div>
                  
                  {/* Performance Metrics Grid */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>Current performance vs targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(data.overview.performanceMetrics).map(([metric, score]) => (
                          <div key={metric} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium capitalize">{metric}</span>
                              <span className="text-sm font-bold">{score.toFixed(0)}/100</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {type === 'customer' && data.segments && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Segment Analysis</CardTitle>
                    <CardDescription>Customer segments with financial metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(data.segments).map(([segment, info]) => (
                        <div key={segment} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{segment}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Count:</span>
                              <span className="ml-2 font-medium">{info.count}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Balance:</span>
                              <span className="ml-2 font-medium">SAR {(info.totalBalance / 1000000).toFixed(1)}M</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg Balance:</span>
                              <span className="ml-2 font-medium">SAR {(info.averageBalance / 1000).toFixed(1)}K</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">New This Month:</span>
                              <span className="ml-2 font-medium">{info.newThisMonth}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {type === 'daily' && data.typeBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Type Analysis</CardTitle>
                    <CardDescription>Last 24 hours breakdown by transaction type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(data.typeBreakdown).map(([txType, info]) => (
                        <div key={txType} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{txType}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Count:</span>
                              <span className="ml-2 font-medium">{info.count}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Volume:</span>
                              <span className="ml-2 font-medium">SAR {(info.volume / 1000000).toFixed(2)}M</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success:</span>
                              <span className="ml-2 font-medium text-green-600">{info.successful}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Failed:</span>
                              <span className="ml-2 font-medium text-red-600">{info.failed}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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

              {(type === 'loans' || type === 'loan') && (
                <>
                  <BreakdownCard title="By Product" data={
                    Object.entries(breakdown.byProduct || {}).reduce((acc, [key, val]) => {
                      acc[key] = val.count || val;
                      return acc;
                    }, {})
                  } />
                  <BreakdownCard title="By Status" data={breakdown.byStatus || {}} />
                  <BreakdownCard title="By Risk Category" data={breakdown.byRiskCategory || {}} type="bar" />
                  <BreakdownCard title="By Amount Range" data={breakdown.byAmountRange || {}} />
                </>
              )}

              {(type === 'branches' || type === 'branch') && (
                <>
                  <BreakdownCard title="By Branch Performance" data={
                    Object.entries(breakdown.byBranch || {}).reduce((acc, [key, val]) => {
                      acc[key] = val.totalBalance || val;
                      return acc;
                    }, {})
                  } type="bar" />
                  <BreakdownCard title="By City" data={breakdown.byCity || {}} />
                </>
              )}

              {(type === 'collection' || type === 'collections') && (
                <>
                  <BreakdownCard title="By Status" data={breakdown.byStatus || {}} />
                  <BreakdownCard title="By Priority" data={breakdown.byPriority || {}} />
                  <BreakdownCard title="By Age" data={breakdown.byAge || {}} type="bar" />
                  <BreakdownCard title="By Method" data={breakdown.byMethod || {}} />
                </>
              )}

              {(type === 'products' || type === 'product') && (
                <>
                  <BreakdownCard title="By Category" data={breakdown.byCategory || {}} />
                  <BreakdownCard title="Product Performance" data={
                    Object.entries(breakdown.byProduct || {}).reduce((acc, [key, val]) => {
                      acc[key] = val.totalAmount || val;
                      return acc;
                    }, {})
                  } type="bar" />
                </>
              )}
            </div>
          )}
          
          {/* Special handling for chart widgets that have breakdown data */}
          {config.isChart && data && data.breakdown && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {type === 'overview' && widgetId === 'total_assets' && (
                <>
                  <BreakdownCard title="By Category" data={data.breakdown.byCategory || {}} />
                  <BreakdownCard title="By Product Type" data={data.breakdown.byProductType || {}} type="bar" />
                  <BreakdownCard title="By Branch" data={data.breakdown.byBranch || {}} />
                </>
              )}
              
              {(type === 'monthly' || type === 'overview' && widgetId === 'monthly_revenue') && (
                <>
                  <BreakdownCard title="By Month" data={
                    Object.entries(data.breakdown.byMonth || {}).reduce((acc, [month, info]) => {
                      acc[month] = info.revenue || 0;
                      return acc;
                    }, {})
                  } type="bar" />
                  <BreakdownCard title="By Revenue Type" data={data.breakdown.byType || {}} />
                </>
              )}
              
              {(type === 'customer' && widgetId === 'customer_growth' || type === 'overview' && widgetId === 'customer_growth') && (
                <>
                  <BreakdownCard title="By Segment" data={data.breakdown.bySegment || {}} />
                  <BreakdownCard title="By Acquisition Channel" data={data.breakdown.byAcquisitionChannel || {}} />
                  <BreakdownCard title="Monthly Growth" data={data.breakdown.byMonth || {}} type="bar" />
                </>
              )}
              
              {(type === 'transaction' && widgetId === 'transaction_volume' || type === 'overview' && widgetId === 'transaction_volume') && (
                <>
                  <BreakdownCard title="By Type" data={
                    Object.entries(data.breakdown.byType || {}).reduce((acc, [type, info]) => {
                      acc[type] = info.volume || 0;
                      return acc;
                    }, {})
                  } />
                  <BreakdownCard title="By Volume Range" data={data.breakdown.byVolumeRange || {}} type="bar" />
                </>
              )}
              
              {(type === 'performance' && widgetId === 'performance_radar' || type === 'overview' && widgetId === 'performance_radar') && (
                <>
                  <BreakdownCard title="Current vs Target" data={
                    Object.entries(data.breakdown.byMetric || {}).reduce((acc, [metric, score]) => {
                      acc[`${metric} (Current)`] = score;
                      acc[`${metric} (Target)`] = data.breakdown.targets?.[metric] || 0;
                      return acc;
                    }, {})
                  } type="bar" />
                  <BreakdownCard title="Performance Gaps" data={data.breakdown.gaps || {}} />
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
                  {type === 'transactions' ? 'Hourly Distribution' : 
                   (type === 'loans' || type === 'loan') ? 'Loan Disbursements & Collections' :
                   (type === 'collection' || type === 'collections') ? 'Collection Performance' :
                   '30-Day Trend'}
                </CardTitle>
                <CardDescription>
                  {type === 'transactions' 
                    ? 'Transaction distribution by hour' 
                    : `${config.title} trends over the last 30 days`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(type === 'loans' || type === 'loan') && trends.disbursements ? (
                  <div className="space-y-4">
                    <ChartWidget
                      data={trends.dates?.map((date, index) => ({
                        date: date,
                        disbursements: trends.disbursements[index],
                        collections: trends.collections[index]
                      }))}
                      chartType="line"
                      xAxisKey="date"
                      yAxisKey="disbursements"
                      height={300}
                      clickable={false}
                    />
                  </div>
                ) : (type === 'collection' || type === 'collections') && trends.newCases ? (
                  <div className="space-y-4">
                    <ChartWidget
                      data={trends.dates?.map((date, index) => ({
                        date: date,
                        newCases: trends.newCases[index],
                        resolvedCases: trends.resolvedCases[index],
                        collections: (trends.collections[index] / 1000000).toFixed(2)
                      }))}
                      chartType="line"
                      xAxisKey="date"
                      yAxisKey="newCases"
                      height={300}
                      clickable={false}
                    />
                  </div>
                ) : (type === 'branches' || type === 'branch') && trends.newCustomers ? (
                  <div className="space-y-4">
                    <ChartWidget
                      data={trends.dates?.map((date, index) => ({
                        date: date,
                        customers: trends.newCustomers[index],
                        accounts: trends.newAccounts[index]
                      }))}
                      chartType="line"
                      xAxisKey="date"
                      yAxisKey="customers"
                      height={300}
                      clickable={false}
                    />
                  </div>
                ) : (type === 'products' || type === 'product') && trends.newLoans ? (
                  <div className="space-y-4">
                    <ChartWidget
                      data={trends.dates?.map((date, index) => ({
                        date: date,
                        loans: trends.newLoans[index],
                        amount: (trends.amounts[index] / 1000000).toFixed(2)
                      }))}
                      chartType="bar"
                      xAxisKey="date"
                      yAxisKey="amount"
                      height={300}
                      clickable={false}
                    />
                  </div>
                ) : (
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
                    clickable={false}
                  />
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Special handling for chart widgets that have trends data */}
          {config.isChart && data && data.trends && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {type === 'overview' && widgetId === 'total_assets' ? 'Asset Growth Trend' : 
                   type === 'overview' && widgetId === 'monthly_revenue' ? 'Revenue Trend' :
                   type === 'overview' && widgetId === 'customer_growth' ? 'Customer Growth Trend' :
                   type === 'overview' && widgetId === 'transaction_volume' ? 'Transaction Volume Trend' :
                   type === 'overview' && widgetId === 'performance_radar' ? 'Performance Trend' :
                   '30-Day Trend'}
                </CardTitle>
                <CardDescription>
                  {type === 'overview' && widgetId === 'total_assets' 
                    ? 'Total assets, deposits, and loans over the last 30 days' 
                    : type === 'overview' && widgetId === 'monthly_revenue'
                    ? 'Revenue and profit trends over the last 6 months'
                    : type === 'overview' && widgetId === 'customer_growth'
                    ? 'Customer acquisition trends over the last 12 months'
                    : type === 'overview' && widgetId === 'transaction_volume'
                    ? 'Daily transaction volume and count trends'
                    : type === 'overview' && widgetId === 'performance_radar'
                    ? 'Performance metrics evolution over time'
                    : `${config.title} trends over the last 30 days`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {type === 'overview' && widgetId === 'total_assets' && (
                  <ChartWidget
                    data={data.trends.dates?.map((date, index) => ({
                      date: date,
                      totalAssets: (data.trends.totalAssets[index] / 1000000).toFixed(2),
                      deposits: (data.trends.deposits[index] / 1000000).toFixed(2),
                      loans: (data.trends.loans[index] / 1000000).toFixed(2)
                    }))}
                    chartType="line"
                    xAxisKey="date"
                    yAxisKey="totalAssets"
                    height={300}
                    clickable={false}
                  />
                )}
                
                {(type === 'monthly' || type === 'overview' && widgetId === 'monthly_revenue') && (
                  <ChartWidget
                    data={data.trends.dates?.map((date, index) => ({
                      month: date,
                      revenue: (data.trends.revenue[index] / 1000000).toFixed(2),
                      profit: (data.trends.profit[index] / 1000000).toFixed(2)
                    }))}
                    chartType="area"
                    xAxisKey="month"
                    yAxisKey="revenue"
                    height={300}
                    clickable={false}
                  />
                )}
                
                {(type === 'customer' && widgetId === 'customer_growth' || type === 'overview' && widgetId === 'customer_growth') && (
                  <ChartWidget
                    data={data.trends.dates?.map((date, index) => ({
                      month: date,
                      newCustomers: data.trends.values[index],
                      cumulative: data.trends.cumulative?.[index] || 0
                    }))}
                    chartType="line"
                    xAxisKey="month"
                    yAxisKey="newCustomers"
                    height={300}
                    clickable={false}
                  />
                )}
                
                {(type === 'transaction' && widgetId === 'transaction_volume' || type === 'overview' && widgetId === 'transaction_volume') && (
                  <ChartWidget
                    data={data.trends.dates?.map((date, index) => ({
                      date: date,
                      volume: (data.trends.volume[index] / 1000000).toFixed(2),
                      count: data.trends.count[index]
                    }))}
                    chartType="area"
                    xAxisKey="date"
                    yAxisKey="volume"
                    height={300}
                    clickable={false}
                  />
                )}
                
                {(type === 'performance' && widgetId === 'performance_radar' || type === 'overview' && widgetId === 'performance_radar') && (
                  <ChartWidget
                    data={data.trends.dates?.map((date, index) => ({
                      month: date,
                      revenue: data.trends.revenue[index],
                      customers: data.trends.customers[index],
                      efficiency: data.trends.efficiency[index],
                      risk: data.trends.risk[index],
                      compliance: data.trends.compliance[index],
                      innovation: data.trends.innovation[index]
                    }))}
                    chartType="line"
                    xAxisKey="month"
                    yAxisKey="revenue"
                    height={300}
                    clickable={false}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}