import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Brain,
  Eye,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Users,
  DollarSign,
  CreditCard,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsRieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ComposedChart,
  Scatter
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

export function Analytics() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      revenue: 0,
      customers: 0,
      transactions: 0,
      avgTransactionValue: 0,
      customerAcquisitionCost: 0,
      churnRate: 0,
      netPromoterScore: 0,
      operationalEfficiency: 0
    },
    trends: [],
    customerSegments: [],
    productPerformance: [],
    channelAnalytics: [],
    predictiveInsights: [],
    riskMetrics: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch KPIs
      const kpis = await fetchKPIs();
      
      // Fetch various analytics data
      const [trends, segments, products, channels, insights, risks] = await Promise.all([
        fetchTrendData(),
        fetchCustomerSegments(),
        fetchProductPerformance(),
        fetchChannelAnalytics(),
        fetchPredictiveInsights(),
        fetchRiskMetrics()
      ]);

      setAnalyticsData({
        kpis,
        trends,
        customerSegments: segments,
        productPerformance: products,
        channelAnalytics: channels,
        predictiveInsights: insights,
        riskMetrics: risks
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    // Mock KPI data with realistic values
    return {
      revenue: 125000000,
      revenueGrowth: 15.2,
      customers: 45678,
      customerGrowth: 8.5,
      transactions: 234567,
      transactionGrowth: 12.3,
      avgTransactionValue: 532,
      avgTransactionGrowth: 3.2,
      customerAcquisitionCost: 125,
      cacChange: -5.4,
      churnRate: 2.8,
      churnChange: -0.3,
      netPromoterScore: 72,
      npsChange: 4,
      operationalEfficiency: 87,
      efficiencyChange: 2.1
    };
  };

  const fetchTrendData = async () => {
    // Generate trend data for the selected time range
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 2000000) + 3000000,
        transactions: Math.floor(Math.random() * 5000) + 7000,
        newCustomers: Math.floor(Math.random() * 100) + 50,
        avgValue: Math.floor(Math.random() * 100) + 450
      });
    }
    
    return data;
  };

  const fetchCustomerSegments = async () => {
    return [
      { name: 'Premium', value: 15234, growth: 12.5, revenue: 45000000 },
      { name: 'Regular', value: 25432, growth: 8.2, revenue: 35000000 },
      { name: 'Basic', value: 5012, growth: -2.1, revenue: 10000000 },
      { name: 'VIP', value: 234, growth: 25.3, revenue: 35000000 }
    ];
  };

  const fetchProductPerformance = async () => {
    return [
      { product: 'Savings Account', users: 23456, revenue: 12000000, growth: 15.2 },
      { product: 'Current Account', users: 18234, revenue: 8500000, growth: 8.7 },
      { product: 'Fixed Deposit', users: 8765, revenue: 25000000, growth: 22.1 },
      { product: 'Personal Loan', users: 5432, revenue: 35000000, growth: 18.9 },
      { product: 'Credit Card', users: 12345, revenue: 18000000, growth: 12.4 },
      { product: 'Mortgage', users: 2345, revenue: 45000000, growth: 9.8 }
    ];
  };

  const fetchChannelAnalytics = async () => {
    return [
      { channel: 'Mobile App', sessions: 145678, conversions: 12.5, revenue: 45000000 },
      { channel: 'Web Portal', sessions: 98765, conversions: 10.2, revenue: 32000000 },
      { channel: 'Branch', sessions: 45678, conversions: 25.3, revenue: 38000000 },
      { channel: 'ATM', sessions: 234567, conversions: 5.2, revenue: 10000000 }
    ];
  };

  const fetchPredictiveInsights = async () => {
    return [
      {
        metric: 'Revenue Forecast',
        current: 125000000,
        predicted: 145000000,
        confidence: 85,
        trend: 'up'
      },
      {
        metric: 'Customer Growth',
        current: 45678,
        predicted: 52000,
        confidence: 78,
        trend: 'up'
      },
      {
        metric: 'Churn Risk',
        current: 2.8,
        predicted: 3.2,
        confidence: 72,
        trend: 'down'
      },
      {
        metric: 'Transaction Volume',
        current: 234567,
        predicted: 265000,
        confidence: 82,
        trend: 'up'
      }
    ];
  };

  const fetchRiskMetrics = async () => {
    return [
      { category: 'Credit Risk', score: 72, trend: 'stable' },
      { category: 'Operational Risk', score: 85, trend: 'improving' },
      { category: 'Market Risk', score: 68, trend: 'declining' },
      { category: 'Liquidity Risk', score: 92, trend: 'improving' },
      { category: 'Compliance Risk', score: 88, trend: 'stable' }
    ];
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const KPICard = ({ title, value, change, icon: Icon, color, format = 'number' }) => {
    const formattedValue = format === 'currency' 
      ? `SAR ${(value / 1000000).toFixed(1)}M`
      : format === 'percent'
      ? `${value}%`
      : value.toLocaleString();

    return (
      <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedValue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={change > 0 ? "text-green-500" : "text-red-500"}>
                {change > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                {Math.abs(change)}%
              </span>
              {" "}vs last period
            </p>
          </CardContent>
          <motion.div 
            className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('analytics.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('analytics.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('analytics.last90Days')}</SelectItem>
              <SelectItem value="custom">{t('analytics.customRange')}</SelectItem>
            </SelectContent>
          </Select>
          {timeRange === 'custom' && (
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          )}
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => toast.info('Export functionality coming soon')}>
            <Download className="h-4 w-4" />
            {t('analytics.export')}
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('analytics.totalRevenue')}
          value={analyticsData.kpis.revenue}
          change={analyticsData.kpis.revenueGrowth}
          icon={DollarSign}
          color="text-green-500"
          format="currency"
        />
        <KPICard
          title="Total Customers"
          value={analyticsData.kpis.customers}
          change={analyticsData.kpis.customerGrowth}
          icon={Users}
          color="text-blue-500"
        />
        <KPICard
          title="Net Promoter Score"
          value={analyticsData.kpis.netPromoterScore}
          change={analyticsData.kpis.npsChange}
          icon={Target}
          color="text-purple-500"
        />
        <KPICard
          title="Operational Efficiency"
          value={analyticsData.kpis.operationalEfficiency}
          change={analyticsData.kpis.efficiencyChange}
          icon={Zap}
          color="text-orange-500"
          format="percent"
        />
      </div>

      {/* Trends Analysis */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Key metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analyticsData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill="#8884d8"
                  stroke="#8884d8"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Bar
                  yAxisId="right"
                  dataKey="transactions"
                  fill="#82ca9d"
                  name="Transactions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="#ffc658"
                  name="New Customers"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Segments & Product Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Distribution and performance by segment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsRieChart>
                  <Pie
                    data={analyticsData.customerSegments}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsRieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {analyticsData.customerSegments.map((segment, index) => (
                  <div key={segment.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{segment.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{segment.value.toLocaleString()}</span>
                      <Badge variant={segment.growth > 0 ? "success" : "destructive"}>
                        {segment.growth > 0 ? '+' : ''}{segment.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Revenue by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap
                  data={analyticsData.productPerformance}
                  dataKey="revenue"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                >
                  <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
                </Treemap>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {analyticsData.productPerformance.slice(0, 4).map((product) => (
                  <div key={product.product} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{product.product}</span>
                    <Badge variant="outline">{product.growth}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Predictive Insights */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered forecasts and predictions</CardDescription>
              </div>
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {analyticsData.predictiveInsights.map((insight) => (
                <Card key={insight.metric} className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{insight.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold">
                          {insight.metric.includes('Revenue') 
                            ? `SAR ${(insight.predicted / 1000000).toFixed(0)}M`
                            : insight.metric.includes('%') || insight.metric.includes('Risk')
                            ? `${insight.predicted}%`
                            : insight.predicted.toLocaleString()
                          }
                        </span>
                        <span className={`text-sm ${insight.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {insight.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </span>
                      </div>
                      <Progress value={insight.confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel Analytics & Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>User engagement by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analyticsData.channelAnalytics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="channel" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Conversion Rate" dataKey="conversions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Current risk levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.riskMetrics.map((risk) => (
                  <div key={risk.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{risk.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{risk.score}/100</span>
                        <Badge 
                          variant={
                            risk.trend === 'improving' ? 'success' : 
                            risk.trend === 'declining' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {risk.trend}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={risk.score} 
                      className={`h-2 ${
                        risk.score > 80 ? '[&>div]:bg-green-500' :
                        risk.score > 60 ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison Widget */}
      <motion.div variants={itemVariants}>
        <ComparisonWidget
          title="Period-over-Period Analysis"
          data={{ 
            monthlyComparison: { 
              current_month: { 
                revenue: analyticsData.kpis.revenue,
                transactions: analyticsData.kpis.transactions,
                customers: analyticsData.kpis.customers,
                deposits: analyticsData.kpis.revenue * 0.7
              }, 
              previous_month: { 
                revenue: analyticsData.kpis.revenue * 0.85,
                transactions: Math.round(analyticsData.kpis.transactions * 0.88),
                customers: Math.round(analyticsData.kpis.customers * 0.92),
                deposits: analyticsData.kpis.revenue * 0.6
              } 
            } 
          }}
          comparisonType="month"
        />
      </motion.div>
    </motion.div>
  );
}