import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard, 
  DollarSign, 
  Activity,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

// Mock data for executive dashboard
const executiveKPIs = {
  totalAssets: 15800000000, // SAR 15.8B
  totalDeposits: 12400000000, // SAR 12.4B
  totalLoans: 8900000000, // SAR 8.9B
  netIncome: 450000000, // SAR 450M
  roa: 2.85, // Return on Assets %
  roe: 18.2, // Return on Equity %
  nim: 3.4, // Net Interest Margin %
  costIncomeRatio: 42.5,
  nplRatio: 1.8, // Non-performing loans %
  capitalAdequacyRatio: 16.8,
  totalCustomers: 125000,
  activeCustomers: 98500,
  newCustomersThisMonth: 2850,
  customerGrowthRate: 12.5
};

const monthlyPerformance = [
  { month: 'Jul 2024', revenue: 380, profit: 85, customers: 118000 },
  { month: 'Aug 2024', revenue: 420, profit: 95, customers: 120500 },
  { month: 'Sep 2024', revenue: 390, profit: 88, customers: 121800 },
  { month: 'Oct 2024', revenue: 450, profit: 102, customers: 123200 },
  { month: 'Nov 2024', revenue: 480, profit: 115, customers: 124100 },
  { month: 'Dec 2024', revenue: 520, profit: 125, customers: 125000 },
  { month: 'Jan 2025', revenue: 450, profit: 108, customers: 125000 }
];

const customerSegments = [
  { segment: 'Retail Banking', value: 65000, percentage: 52 },
  { segment: 'Premium Banking', value: 35000, percentage: 28 },
  { segment: 'Private Banking', value: 15000, percentage: 12 },
  { segment: 'Corporate Banking', value: 10000, percentage: 8 }
];

const productPerformance = [
  { product: 'Savings Accounts', revenue: 125, growth: 8.5 },
  { product: 'Current Accounts', revenue: 95, growth: 12.3 },
  { product: 'Personal Loans', revenue: 180, growth: 15.2 },
  { product: 'Home Loans', revenue: 220, growth: 6.8 },
  { product: 'Credit Cards', revenue: 85, growth: 22.1 },
  { product: 'Investment Products', revenue: 145, growth: 18.7 }
];

const riskMetrics = [
  { category: 'Credit Risk', score: 85, status: 'Good', trend: 'stable' },
  { category: 'Market Risk', score: 78, status: 'Moderate', trend: 'improving' },
  { category: 'Operational Risk', score: 92, status: 'Excellent', trend: 'stable' },
  { category: 'Liquidity Risk', score: 88, status: 'Good', trend: 'improving' }
];

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA'];

function formatCurrency(amount, currency = 'SAR') {
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

function KPICard({ title, value, change, trend, icon: Icon, description, format = 'number' }) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : 
                        format === 'percentage' ? `${value}%` : 
                        typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {change && (
            <div className="flex items-center">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {change}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskScoreCard({ category, score, status, trend }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-50';
      case 'Good': return 'text-blue-600 bg-blue-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      case 'Poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{category}</p>
            <p className="text-2xl font-bold">{score}/100</p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {trend === 'improving' ? '↗️' : trend === 'declining' ? '↘️' : '→'} {trend}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dashboardData, setDashboardData] = useState({
    kpis: executiveKPIs,
    monthlyPerformance: monthlyPerformance,
    customerSegments: customerSegments,
    productPerformance: productPerformance,
    riskMetrics: riskMetrics
  });

  // Simulate data fetching
  const fetchDashboardData = async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate data update with slight variations
        const updatedKPIs = {
          ...executiveKPIs,
          totalCustomers: executiveKPIs.totalCustomers + Math.floor(Math.random() * 10),
          activeCustomers: executiveKPIs.activeCustomers + Math.floor(Math.random() * 5)
        };
        
        setDashboardData({
          kpis: updatedKPIs,
          monthlyPerformance: monthlyPerformance,
          customerSegments: customerSegments,
          productPerformance: productPerformance,
          riskMetrics: riskMetrics
        });
        
        resolve();
      }, 1000);
    });
  };

  // Use the data refresh hook
  const { refresh, isRefreshing, lastRefreshed } = useDataRefresh(
    fetchDashboardData,
    [], // No dependencies
    {
      refreshOnMount: true,
      showNotification: true,
      notificationMessage: 'Executive Dashboard loaded'
    }
  );

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Strategic overview of banking operations and key performance indicators
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'N/A'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Export functionality coming soon')}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Assets"
            value={executiveKPIs.totalAssets}
            change="+8.5%"
            trend="up"
            icon={TrendingUp}
            description="Total bank assets"
            format="currency"
          />
          <KPICard
            title="Net Income"
            value={executiveKPIs.netIncome}
            change="+12.3%"
            trend="up"
            icon={DollarSign}
            description="Annual net income"
            format="currency"
          />
          <KPICard
            title="Return on Assets"
            value={executiveKPIs.roa}
            change="+0.3%"
            trend="up"
            icon={TrendingUp}
            description="ROA percentage"
            format="percentage"
          />
          <KPICard
            title="Cost-Income Ratio"
            value={executiveKPIs.costIncomeRatio}
            change="-2.1%"
            trend="up"
            icon={TrendingDown}
            description="Efficiency ratio"
            format="percentage"
          />
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Customer Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Customers"
            value={executiveKPIs.totalCustomers}
            change="+12.5%"
            trend="up"
            icon={Users}
            description="All customers"
          />
          <KPICard
            title="Active Customers"
            value={executiveKPIs.activeCustomers}
            change="+8.2%"
            trend="up"
            icon={CheckCircle}
            description="Active this month"
          />
          <KPICard
            title="New Customers"
            value={executiveKPIs.newCustomersThisMonth}
            change="+15.7%"
            trend="up"
            icon={Users}
            description="This month"
          />
          <KPICard
            title="Customer Growth"
            value={executiveKPIs.customerGrowthRate}
            change="+2.3%"
            trend="up"
            icon={TrendingUp}
            description="YoY growth rate"
            format="percentage"
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly View</TabsTrigger>
          <TabsTrigger value="yearly">Yearly View</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue and Profit Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Profit Trend</CardTitle>
                <CardDescription>Monthly performance over the last 7 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#E6B800" 
                      strokeWidth={2}
                      name="Revenue (SAR M)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#4A5568" 
                      strokeWidth={2}
                      name="Profit (SAR M)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>Distribution by banking segment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Product Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Revenue and growth by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#E6B800" name="Revenue (SAR M)" />
                  <Bar dataKey="growth" fill="#4A5568" name="Growth %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Quarterly view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Yearly view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Management Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riskMetrics.map((risk, index) => (
            <RiskScoreCard key={index} {...risk} />
          ))}
        </div>
      </div>

      {/* Key Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Banking Ratios</CardTitle>
          <CardDescription>Important financial and operational ratios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{executiveKPIs.nim}%</p>
              <p className="text-sm text-muted-foreground">Net Interest Margin</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{executiveKPIs.roe}%</p>
              <p className="text-sm text-muted-foreground">Return on Equity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{executiveKPIs.nplRatio}%</p>
              <p className="text-sm text-muted-foreground">NPL Ratio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{executiveKPIs.capitalAdequacyRatio}%</p>
              <p className="text-sm text-muted-foreground">Capital Adequacy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

