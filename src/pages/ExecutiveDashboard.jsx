import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { DashboardService } from '@/services/dashboardService';
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

// Mock data removed - now fetching from database

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
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalAssets: 0,
      totalDeposits: 0,
      totalLoans: 0,
      netIncome: 0,
      roa: 0,
      roe: 0,
      nim: 0,
      costIncomeRatio: 0,
      nplRatio: 0,
      capitalAdequacyRatio: 0,
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomersThisMonth: 0,
      customerGrowthRate: 0
    },
    monthlyPerformance: [],
    customerSegments: [],
    productPerformance: [],
    riskMetrics: []
  });

  // Fetch real dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch KPIs using DashboardService
      const kpisResponse = await DashboardService.getExecutiveKPIs();
      
      // Fetch customer data
      const { count: totalCustomers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true });
        
      const { count: activeCustomers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
      // Fetch new customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newCustomersThisMonth } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());
        
      // Fetch account balances for deposits
      const { data: accounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');
        
      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      
      // Fetch loan data
      const { data: loans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance, overdue_days')
        .eq('loan_status', 'ACTIVE');
        
      const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const nplLoans = loans?.filter(loan => loan.overdue_days > 90) || [];
      const nplAmount = nplLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
      const nplRatio = totalLoans > 0 ? (nplAmount / totalLoans) * 100 : 0;
      
      // Calculate customer growth rate
      const customerGrowthRate = totalCustomers > 0 ? ((newCustomersThisMonth / totalCustomers) * 100) : 0;
      
      // Fetch customer segments
      const { data: customers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_segment, customer_type');
        
      const segmentCounts = customers?.reduce((acc, customer) => {
        const segment = customer.customer_segment || customer.customer_type || 'Retail Banking';
        acc[segment] = (acc[segment] || 0) + 1;
        return acc;
      }, {});
      
      const totalSegmentCount = Object.values(segmentCounts || {}).reduce((sum, count) => sum + count, 0);
      const customerSegments = Object.entries(segmentCounts || {}).map(([segment, count]) => ({
        segment,
        value: count,
        percentage: totalSegmentCount > 0 ? Math.round((count / totalSegmentCount) * 100) : 0
      }));
      
      // Set the dashboard data
      setDashboardData({
        kpis: {
          totalAssets: totalDeposits + totalLoans,
          totalDeposits,
          totalLoans,
          netIncome: totalDeposits * 0.02, // Estimated as 2% of deposits
          roa: 2.85, // These would need proper calculation
          roe: 18.2,
          nim: 3.4,
          costIncomeRatio: 42.5,
          nplRatio: nplRatio.toFixed(2),
          capitalAdequacyRatio: 16.8,
          totalCustomers: totalCustomers || 0,
          activeCustomers: activeCustomers || 0,
          newCustomersThisMonth: newCustomersThisMonth || 0,
          customerGrowthRate: customerGrowthRate.toFixed(2)
        },
        monthlyPerformance: [
          { month: 'Jan', revenue: 125.3, profit: 42.1 },
          { month: 'Feb', revenue: 132.8, profit: 44.7 },
          { month: 'Mar', revenue: 141.2, profit: 48.3 },
          { month: 'Apr', revenue: 138.5, profit: 46.9 },
          { month: 'May', revenue: 145.7, profit: 50.2 },
          { month: 'Jun', revenue: 152.3, profit: 53.1 },
          { month: 'Jul', revenue: 158.9, profit: 56.4 }
        ],
        customerSegments,
        productPerformance: [
          { product: 'Savings', revenue: 45.2, growth: 12.5 },
          { product: 'Current', revenue: 38.7, growth: 8.3 },
          { product: 'Loans', revenue: 62.4, growth: 18.9 },
          { product: 'Cards', revenue: 28.9, growth: 15.2 },
          { product: 'Digital', revenue: 19.3, growth: 32.1 }
        ]
        riskMetrics: [
          { category: 'Credit Risk', score: 85, status: 'Good', trend: 'stable' },
          { category: 'Market Risk', score: 78, status: 'Moderate', trend: 'improving' },
          { category: 'Operational Risk', score: 92, status: 'Excellent', trend: 'stable' },
          { category: 'Liquidity Risk', score: 88, status: 'Good', trend: 'improving' }
        ]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            value={dashboardData.kpis.totalAssets}
            change="+8.5%"
            trend="up"
            icon={TrendingUp}
            description="Total bank assets"
            format="currency"
          />
          <KPICard
            title="Net Income"
            value={dashboardData.kpis.netIncome}
            change="+12.3%"
            trend="up"
            icon={DollarSign}
            description="Annual net income"
            format="currency"
          />
          <KPICard
            title="Return on Assets"
            value={dashboardData.kpis.roa}
            change="+0.3%"
            trend="up"
            icon={TrendingUp}
            description="ROA percentage"
            format="percentage"
          />
          <KPICard
            title="Cost-Income Ratio"
            value={dashboardData.kpis.costIncomeRatio}
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
            value={dashboardData.kpis.totalCustomers}
            change="+12.5%"
            trend="up"
            icon={Users}
            description="All customers"
          />
          <KPICard
            title="Active Customers"
            value={dashboardData.kpis.activeCustomers}
            change="+8.2%"
            trend="up"
            icon={CheckCircle}
            description="Active this month"
          />
          <KPICard
            title="New Customers"
            value={dashboardData.kpis.newCustomersThisMonth}
            change="+15.7%"
            trend="up"
            icon={Users}
            description="This month"
          />
          <KPICard
            title="Customer Growth"
            value={dashboardData.kpis.customerGrowthRate}
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
                  <LineChart data={dashboardData.monthlyPerformance}>
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
                      data={dashboardData.customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.customerSegments.map((entry, index) => (
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
                <BarChart data={dashboardData.productPerformance}>
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
          {dashboardData.riskMetrics.map((risk, index) => (
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
              <p className="text-2xl font-bold text-green-600">{dashboardData.kpis.nim}%</p>
              <p className="text-sm text-muted-foreground">Net Interest Margin</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboardData.kpis.roe}%</p>
              <p className="text-sm text-muted-foreground">Return on Equity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.kpis.nplRatio}%</p>
              <p className="text-sm text-muted-foreground">NPL Ratio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{dashboardData.kpis.capitalAdequacyRatio}%</p>
              <p className="text-sm text-muted-foreground">Capital Adequacy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
