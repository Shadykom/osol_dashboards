// Detailed widget page
//
// Displays a breakdown, trends and raw data view for an individual widget.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Printer, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  BarChart3, 
  PieChart,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Share2,
  MoreHorizontal,
  Eye,
  AlertCircle,
  CheckCircle2,
  User,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { enhancedDashboardDetailsService } from '../services/enhancedDashboardDetailsService';
import { useFilters } from '../contexts/FilterContext';
import { ChartWidget } from '../components/widgets/ChartWidget';
import { cn } from '../lib/utils';

// Enhanced Stat Card Component with modern design
const StatCard = ({ title, value, change, trend, description, icon: Icon, className, size = 'default' }) => {
  const sizeClasses = {
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-200 hover:shadow-lg", className)}>
      <CardHeader className={cn("pb-2", sizeClasses[size])}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
          </div>
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        {change && (
          <div className="flex items-center space-x-2 mt-2">
            <div className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === 'up' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : trend === 'down' 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
            )}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              <span>{change}</span>
            </div>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </Card>
  );
};

// Enhanced Breakdown Card Component
const BreakdownCard = ({ title, data, type = 'pie', className }) => {
  const total = Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  
  // Transform data for charts
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value: typeof value === 'number' ? value : 0,
    percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
  }));

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    '#8B5CF6',
    '#06B6D4',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5A3C',
    '#6B7280'
  ];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {chartData.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 || chartData.every(item => item.value === 0) ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : type === 'pie' ? (
          <div className="space-y-4">
            <ChartWidget
              data={chartData}
              chartType="pie"
              dataKey="value"
              height={200}
              showLegend={false}
              colors={colors}
            />
            <div className="space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate max-w-24">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-medium">
                      {item.value >= 1000000 
                        ? `${(item.value / 1000000).toFixed(1)}M` 
                        : item.value >= 1000 
                        ? `${(item.value / 1000).toFixed(0)}K` 
                        : item.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : type === 'bar' ? (
          <ChartWidget
            data={chartData}
            chartType="bar"
            xAxisKey="name"
            yAxisKey="value"
            height={250}
            showLegend={false}
            colors={colors}
          />
        ) : (
          <div className="space-y-3">
            {chartData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    SAR {(item.value / 1000000).toFixed(1)}M
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Data Table Component for Raw Data
const DataTable = ({ data, columns, title }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="secondary">{data.length} records</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {columns.map((col, index) => (
                  <th key={index} className="text-left p-3 font-semibold text-sm border-b">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/30 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="p-3 text-sm">
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardDetailNew = () => {
  const { section, widgetId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailData, setDetailData] = useState({
    overview: null,
    breakdown: null,
    trends: null,
    raw: null,
    metadata: { title: 'Loading...' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on mount or when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data for:', { section, widgetId });
        
        // For total_customers widget, disable date filtering by default to match main dashboard
        const modifiedFilters = { ...filters };
        if (section === 'customers' && widgetId === 'total_customers') {
          modifiedFilters.applyDateFilter = false;
        }
        
        const result = await enhancedDashboardDetailsService.getWidgetDetails(
          section,
          widgetId,
          modifiedFilters
        );
        console.log('Service returned:', result);
        if (result.success) {
          console.log('Setting detail data:', result.data);
          setDetailData(result.data);
        } else {
          console.error('Service returned error:', result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error('Error fetching widget details:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (section && widgetId) {
      fetchData();
    }
  }, [section, widgetId, filters]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format = 'csv') => {
    const result = await enhancedDashboardDetailsService.exportWidgetData(
      section,
      widgetId,
      format,
      filters
    );
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await enhancedDashboardDetailsService.getWidgetDetails(
        section,
        widgetId,
        filters
      );
      if (result.success) {
        setDetailData(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error fetching widget details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `SAR ${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `SAR ${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `SAR ${(value / 1000).toFixed(0)}K`;
    }
    return `SAR ${value.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-red-600">Error Loading Data</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to load widget data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {detailData.metadata?.title || 'Total Assets'}
              </h1>
              <Badge variant="outline" className="text-xs">
                {section}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for {section} section
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {detailData.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {section === 'customers' && widgetId === 'total_customers' ? (
            <>
              <StatCard
                title="Total Customers"
                value={(detailData.overview.totalCustomers || 0).toLocaleString()}
                change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${typeof detailData.overview.change === 'string' ? parseFloat(detailData.overview.change).toFixed(1) : detailData.overview.change.toFixed(1)}%` : null}
                trend={detailData.overview.trend}
                description="All registered customers"
                icon={Users}
                size="small"
              />
              <StatCard
                title="Active Customers"
                value={(detailData.overview.activeCustomers || 0).toLocaleString()}
                description={`${detailData.overview.activeRatio || 0}% of total`}
                icon={UserCheck}
                size="small"
              />
              <StatCard
                title="New Customers"
                value={(detailData.overview.newCustomers || 0).toLocaleString()}
                description="Last 30 days"
                icon={UserPlus}
                size="small"
              />
              <StatCard
                title="Individual Customers"
                value={(detailData.overview.individualCustomers || 0).toLocaleString()}
                description="Personal accounts"
                icon={User}
                size="small"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Total Assets"
                value={formatCurrency(detailData.overview.totalAssets || 0)}
                change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${typeof detailData.overview.change === 'string' ? parseFloat(detailData.overview.change).toFixed(1) : detailData.overview.change.toFixed(1)}%` : null}
                trend={detailData.overview.trend}
                description="Combined deposits and loans"
                icon={DollarSign}
                size="small"
              />
              <StatCard
                title="Active Accounts"
                value={(detailData.overview.accountCount || 0).toLocaleString()}
                description="Total account count"
                icon={Users}
                size="small"
              />
              <StatCard
                title="Loan Portfolio"
                value={formatCurrency(detailData.overview.totalLoans || 0)}
                description={`${detailData.overview.loanRatio || 0}% of assets`}
                icon={TrendingUp}
                size="small"
              />
              <StatCard
                title="Deposit Base"
                value={formatCurrency(detailData.overview.totalDeposits || 0)}
                description={`${detailData.overview.depositRatio || 0}% of assets`}
                icon={CreditCard}
                size="small"
              />
            </>
          )}
        </div>
      )}

      <Separator />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Breakdown Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.overview ? (
            <>
              {section === 'customers' && widgetId === 'total_customers' ? (
                <>
                  {/* Main Customer KPI Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Total Customers"
                      value={(detailData.overview.totalCustomers || 0).toLocaleString()}
                      change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${typeof detailData.overview.change === 'string' ? parseFloat(detailData.overview.change).toFixed(1) : detailData.overview.change.toFixed(1)}%` : null}
                      trend={detailData.overview.trend}
                      description="All registered customers in the system"
                      icon={Users}
                      className="md:col-span-2 lg:col-span-1"
                    />
                    <StatCard
                      title="Active Customers"
                      value={(detailData.overview.activeCustomers || 0).toLocaleString()}
                      description={`${detailData.overview.activeRatio || 0}% of total customers`}
                      icon={UserCheck}
                    />
                    <StatCard
                      title="Inactive Customers"
                      value={(detailData.overview.inactiveCustomers || 0).toLocaleString()}
                      description="Customers without active accounts"
                      icon={Users}
                    />
                  </div>

                  {/* Customer Type Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Individual Customers"
                      value={(detailData.overview.individualCustomers || 0).toLocaleString()}
                      description="Personal banking customers"
                      icon={User}
                    />
                    <StatCard
                      title="Corporate Customers"
                      value={(detailData.overview.corporateCustomers || 0).toLocaleString()}
                      description="Business accounts"
                      icon={Building2}
                    />
                    <StatCard
                      title="VIP Customers"
                      value={(detailData.overview.vipCustomers || 0).toLocaleString()}
                      description="Premium banking clients"
                      icon={Activity}
                    />
                    <StatCard
                      title="New Customers"
                      value={(detailData.overview.newCustomers || 0).toLocaleString()}
                      description="Joined in last 30 days"
                      icon={UserPlus}
                    />
                  </div>

                  {/* Customer Composition Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Customer Segmentation
                      </CardTitle>
                      <CardDescription>
                        Distribution of customers by type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <ChartWidget
                          data={Object.entries(detailData.overview.customerTypes || {}).map(([type, count]) => ({
                            name: type.charAt(0).toUpperCase() + type.slice(1),
                            value: count
                          }))}
                          chartType="pie"
                          dataKey="value"
                          height={300}
                          showLegend={true}
                        />
                        <div className="space-y-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-2">Customer Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Active Ratio:</span>
                                <span className="font-medium">{detailData.overview.activeRatio || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Growth Rate:</span>
                                <span className="font-medium">{detailData.overview.change ? `${typeof detailData.overview.change === 'string' ? parseFloat(detailData.overview.change).toFixed(1) : detailData.overview.change.toFixed(1)}%` : '0%'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-primary/5 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Customer Insights
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Growth Trend:</span>
                                <Badge variant={detailData.overview.trend === 'up' ? 'default' : 'secondary'}>
                                  {detailData.overview.trend === 'up' ? 'Growing' : detailData.overview.trend === 'down' ? 'Declining' : 'Stable'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Customer Health:</span>
                                <Badge variant="default">Good</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Main KPI Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Total Assets"
                      value={formatCurrency(detailData.overview.totalAssets || 0)}
                      change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${typeof detailData.overview.change === 'string' ? parseFloat(detailData.overview.change).toFixed(1) : detailData.overview.change.toFixed(1)}%` : null}
                      trend={detailData.overview.trend}
                      description="Combined deposits and loans"
                      icon={DollarSign}
                      className="md:col-span-2 lg:col-span-1"
                    />
                    <StatCard
                      title="Total Deposits"
                      value={formatCurrency(detailData.overview.totalDeposits || 0)}
                      description={`${detailData.overview.depositRatio || 0}% of total assets`}
                      icon={CreditCard}
                    />
                    <StatCard
                      title="Total Loans"
                      value={formatCurrency(detailData.overview.totalLoans || 0)}
                      description={`${detailData.overview.loanRatio || 0}% of total assets`}
                      icon={TrendingUp}
                    />
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Account Count"
                      value={(detailData.overview.accountCount || 0).toLocaleString()}
                      description="Total number of accounts"
                      icon={Users}
                    />
                    <StatCard
                      title="Loan Count"
                      value={(detailData.overview.loanCount || 0).toLocaleString()}
                      description="Total number of loans"
                      icon={Activity}
                    />
                    <StatCard
                      title="Avg Account Balance"
                      value={formatCurrency(detailData.overview.avgAccountBalance || 0)}
                      description="Per account average"
                      icon={BarChart3}
                    />
                    <StatCard
                      title="Avg Loan Balance"
                      value={formatCurrency(detailData.overview.avgLoanBalance || 0)}
                      description="Per loan average"
                      icon={Building2}
                    />
                  </div>

                  {/* Asset Composition Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Asset Composition
                      </CardTitle>
                      <CardDescription>
                        Visual breakdown of your total asset portfolio
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <ChartWidget
                          data={[
                            { name: 'Deposits', value: detailData.overview.totalDeposits || 0 },
                            { name: 'Loans', value: detailData.overview.totalLoans || 0 }
                          ]}
                          chartType="pie"
                          dataKey="value"
                          height={300}
                          showLegend={true}
                        />
                        <div className="space-y-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-2">Composition Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Deposits Ratio:</span>
                                <span className="font-medium">{detailData.overview.depositRatio || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Loans Ratio:</span>
                                <span className="font-medium">{detailData.overview.loanRatio || 0}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-primary/5 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Performance Indicators
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Growth Trend:</span>
                                <Badge variant={detailData.overview.trend === 'up' ? 'default' : 'secondary'}>
                                  {detailData.overview.trend === 'up' ? 'Positive' : detailData.overview.trend === 'down' ? 'Negative' : 'Stable'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Asset Quality:</span>
                                <Badge variant="default">Healthy</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No overview data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.breakdown ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Breakdown Analysis</h2>
                  <p className="text-muted-foreground">
                    Detailed breakdown of assets across different dimensions
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date().toLocaleDateString()}
                </Badge>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {detailData.breakdown.byCategory && (
                  <BreakdownCard 
                    title="Asset Categories" 
                    data={detailData.breakdown.byCategory} 
                    type="pie"
                    className="lg:col-span-1"
                  />
                )}
                {detailData.breakdown.byAccountType && (
                  <BreakdownCard 
                    title="Account Types" 
                    data={detailData.breakdown.byAccountType} 
                    type="bar"
                  />
                )}
                {detailData.breakdown.byProductType && (
                  <BreakdownCard 
                    title="Product Types" 
                    data={detailData.breakdown.byProductType} 
                    type="pie"
                  />
                )}
                {detailData.breakdown.byBranch && (
                  <BreakdownCard 
                    title="Top Branches" 
                    data={detailData.breakdown.byBranch} 
                    type="list"
                    className="md:col-span-2 lg:col-span-1"
                  />
                )}
                {detailData.breakdown.byCurrency && (
                  <BreakdownCard 
                    title="Currency Distribution" 
                    data={detailData.breakdown.byCurrency} 
                    type="pie"
                  />
                )}
                {detailData.breakdown.byStatus && (
                  <BreakdownCard 
                    title="Status Breakdown" 
                    data={detailData.breakdown.byStatus} 
                    type="bar"
                  />
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No breakdown data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.trends ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Historical Trends</h2>
                  <p className="text-muted-foreground">
                    {section === 'customers' && widgetId === 'total_customers' 
                      ? 'Customer growth and activity over time'
                      : 'Asset growth and performance over time'}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {section === 'customers' && widgetId === 'total_customers' 
                      ? 'Customer Growth Trend'
                      : 'Asset Growth Trend'}
                  </CardTitle>
                  <CardDescription>
                    {section === 'customers' && widgetId === 'total_customers'
                      ? '30-day historical customer performance'
                      : '30-day historical asset performance'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {section === 'customers' && widgetId === 'total_customers' ? (
                    detailData.trends.dates && detailData.trends.totalCustomers ? (
                      <ChartWidget
                        data={detailData.trends.dates.map((date, index) => ({
                          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          'Total Customers': detailData.trends.totalCustomers[index] || 0,
                          'Active Customers': detailData.trends.activeCustomers[index] || 0,
                          'New Customers': detailData.trends.newCustomers[index] || 0
                        }))}
                        chartType="line"
                        xAxisKey="date"
                        yAxisKey="Total Customers"
                        height={400}
                        showLegend={true}
                        multiLine={['Total Customers', 'Active Customers']}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p>No trend data available</p>
                      </div>
                    )
                  ) : (
                    detailData.trends.dates && detailData.trends.totalAssets ? (
                      <ChartWidget
                        data={detailData.trends.dates.map((date, index) => ({
                          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          'Total Assets': detailData.trends.totalAssets[index] || 0,
                          'Deposits': detailData.trends.deposits[index] || 0,
                          'Loans': detailData.trends.loans[index] || 0
                        }))}
                        chartType="line"
                        xAxisKey="date"
                        yAxisKey="Total Assets"
                        height={400}
                        showLegend={true}
                        multiLine={['Total Assets', 'Deposits', 'Loans']}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p>No trend data available</p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Growth Rate Chart */}
              {detailData.trends.growthRates && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Growth Rate Analysis
                    </CardTitle>
                    <CardDescription>Day-over-day growth percentages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartWidget
                      data={detailData.trends.dates.map((date, index) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        'Growth Rate': detailData.trends.growthRates[index] || 0
                      }))}
                      chartType="bar"
                      xAxisKey="date"
                      yAxisKey="Growth Rate"
                      height={300}
                      showLegend={false}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No trends data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.raw ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Raw Data</h2>
                  <p className="text-muted-foreground">
                    {section === 'customers' && widgetId === 'total_customers'
                      ? 'Detailed customer records and information'
                      : 'Detailed transactional data and records'}
                  </p>
                </div>
              </div>

              {section === 'customers' && widgetId === 'total_customers' ? (
                <>
                  {detailData.raw.customers && detailData.raw.customers.length > 0 && (
                    <DataTable
                      title="Customer Records"
                      data={detailData.raw.customers.slice(0, 20)}
                      columns={[
                        { header: 'Customer ID', accessor: (row) => row.customer_id },
                        { header: 'Name', accessor: (row) => row.full_name || 'N/A' },
                        { header: 'Type', accessor: (row) => <Badge variant="outline">{row.customer_type || 'Unknown'}</Badge> },
                        { header: 'Accounts', accessor: (row) => row.account_count || 0 },
                        { header: 'Total Balance', accessor: (row) => formatCurrency(row.total_balance || 0) },
                        { header: 'Status', accessor: (row) => (
                          <Badge variant={row.active_accounts > 0 ? 'default' : 'secondary'}>
                            {row.active_accounts > 0 ? 'Active' : 'Inactive'}
                          </Badge>
                        )},
                        { header: 'Joined', accessor: (row) => new Date(row.created_at).toLocaleDateString() }
                      ]}
                    />
                  )}

                  {/* Customer Summary Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Customer Data Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">{detailData.raw.customers?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Total Customers Shown</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">
                            {detailData.raw.customers?.filter(c => c.active_accounts > 0).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Active Customers</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">
                            {new Date().toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Last Updated</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {detailData.raw.accounts && detailData.raw.accounts.length > 0 && (
                    <DataTable
                      title="Top Accounts"
                      data={detailData.raw.accounts.slice(0, 10)}
                      columns={[
                        { header: 'Account Number', accessor: (row) => row.account_number },
                        { header: 'Type', accessor: (row) => <Badge variant="outline">{row.account_type}</Badge> },
                        { header: 'Balance', accessor: (row) => formatCurrency(row.current_balance || 0) },
                        { header: 'Status', accessor: (row) => <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge> },
                        { header: 'Created', accessor: (row) => new Date(row.created_at).toLocaleDateString() }
                      ]}
                    />
                  )}

                  {detailData.raw.loans && detailData.raw.loans.length > 0 && (
                    <DataTable
                      title="Top Loans"
                      data={detailData.raw.loans.slice(0, 10)}
                      columns={[
                        { header: 'Loan ID', accessor: (row) => row.loan_id },
                        { header: 'Type', accessor: (row) => <Badge variant="outline">{row.loan_type}</Badge> },
                        { header: 'Outstanding', accessor: (row) => formatCurrency(row.outstanding_balance || 0) },
                        { header: 'Status', accessor: (row) => <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge> },
                        { header: 'Created', accessor: (row) => new Date(row.created_at).toLocaleDateString() }
                      ]}
                    />
                  )}

                  {/* Summary Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Data Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">{detailData.raw.totalAccounts || 0}</div>
                          <div className="text-sm text-muted-foreground">Total Accounts</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">{detailData.raw.totalLoans || 0}</div>
                          <div className="text-sm text-muted-foreground">Total Loans</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="text-sm font-medium">Last Updated</div>
                          <div className="text-sm text-muted-foreground">
                            {detailData.raw.lastUpdated ? new Date(detailData.raw.lastUpdated).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No raw data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardDetailNew;