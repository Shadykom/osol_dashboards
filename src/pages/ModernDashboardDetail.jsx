import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Printer, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Share2,
  Settings,
  Maximize2,
  Grid,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  DollarSign,
  Users,
  CreditCard,
  Briefcase,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { cn } from '../lib/utils';
import { enhancedDashboardDetailsService } from '../services/enhancedDashboardDetailsService';
import { useFilters } from '../contexts/FilterContext';
import { ChartWidget } from '../components/widgets/ChartWidget';

// Modern Stat Card with Glassmorphism
const ModernStatCard = ({ title, value, change, trend, description, icon: Icon, color = 'blue', size = 'default' }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/20 text-blue-600',
    green: 'from-green-500/20 to-green-600/20 border-green-500/20 text-green-600',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/20 text-purple-600',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/20 text-orange-600',
    red: 'from-red-500/20 to-red-600/20 border-red-500/20 text-red-600',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/20 text-yellow-600',
  };

  const sizeClasses = {
    default: 'p-6',
    large: 'p-8',
    small: 'p-4'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative group"
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity",
        colorClasses[color]
      )} />
      <Card className={cn(
        "relative backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border shadow-xl",
        sizeClasses[size],
        colorClasses[color]
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn(
                "font-bold tracking-tight",
                size === 'large' ? 'text-4xl' : size === 'small' ? 'text-xl' : 'text-3xl'
              )}>
                {value}
              </h3>
              {change && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={cn(
                    "text-sm font-medium",
                    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  )}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-3 rounded-full bg-gradient-to-br",
              colorClasses[color]
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Modern Chart Card
const ModernChartCard = ({ title, description, children, actions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
      <Card className="relative backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Modern Progress Card
const ModernProgressCard = ({ title, items }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.color || "bg-blue-500"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
              <Progress value={item.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {item.percentage}% of total
              </p>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Modern List Card
const ModernListCard = ({ title, items, icon: Icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      {item.icon}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.value}</p>
                  {item.change && (
                    <p className={cn(
                      "text-xs font-medium",
                      item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {item.change}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ModernDashboardDetail = () => {
  const { cardType } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState('cards');

  // Widget configurations with modern styling
  const widgetConfigs = {
    customers: {
      title: 'Customer Analytics',
      subtitle: 'Comprehensive customer insights and metrics',
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    accounts: {
      title: 'Account Management',
      subtitle: 'Account performance and distribution analysis',
      icon: CreditCard,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    revenue: {
      title: 'Revenue Dashboard',
      subtitle: 'Financial performance and revenue streams',
      icon: DollarSign,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-600'
    },
    transactions: {
      title: 'Transaction Analytics',
      subtitle: 'Real-time transaction monitoring and insights',
      icon: Activity,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600'
    },
    loans: {
      title: 'Loan Portfolio',
      subtitle: 'Loan performance and risk analysis',
      icon: Briefcase,
      color: 'orange',
      gradient: 'from-orange-500 to-red-600'
    },
    performance: {
      title: 'Performance Metrics',
      subtitle: 'Key performance indicators and targets',
      icon: Target,
      color: 'green',
      gradient: 'from-green-500 to-teal-600'
    }
  };

  const config = widgetConfigs[cardType] || widgetConfigs.customers;
  const IconComponent = config.icon;

  useEffect(() => {
    fetchData();
  }, [cardType, timeRange, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on card type
      const mockData = generateMockData(cardType);
      setData(mockData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (type) => {
    const baseData = {
      overview: {
        mainMetric: type === 'revenue' ? 'SAR 2.5M' : type === 'customers' ? '15,234' : '8,456',
        change: '+12.5%',
        trend: 'up',
        secondaryMetrics: [
          { label: 'Active', value: '12,345', change: '+8.2%', trend: 'up' },
          { label: 'New This Month', value: '1,234', change: '+15.3%', trend: 'up' },
          { label: 'Churn Rate', value: '2.3%', change: '-0.5%', trend: 'down' },
          { label: 'Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' }
        ]
      },
      performance: {
        current: 85,
        target: 90,
        categories: [
          { label: 'Acquisition', value: 92, percentage: 92 },
          { label: 'Retention', value: 88, percentage: 88 },
          { label: 'Revenue', value: 85, percentage: 85 },
          { label: 'Satisfaction', value: 78, percentage: 78 }
        ]
      },
      distribution: {
        bySegment: [
          { name: 'Premium', value: 3500, percentage: 30 },
          { name: 'Standard', value: 5800, percentage: 50 },
          { name: 'Basic', value: 2300, percentage: 20 }
        ],
        byRegion: [
          { name: 'North', value: 4200, percentage: 36 },
          { name: 'South', value: 3100, percentage: 27 },
          { name: 'East', value: 2400, percentage: 21 },
          { name: 'West', value: 1900, percentage: 16 }
        ]
      },
      trends: {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          value: Math.floor(Math.random() * 1000) + 500,
          revenue: Math.floor(Math.random() * 50000) + 100000
        }))
      },
      topItems: [
        { 
          title: 'John Doe', 
          subtitle: 'Premium Customer', 
          value: 'SAR 125K', 
          change: '+15%', 
          trend: 'up',
          icon: <Award className="h-4 w-4" />
        },
        { 
          title: 'Jane Smith', 
          subtitle: 'VIP Customer', 
          value: 'SAR 98K', 
          change: '+12%', 
          trend: 'up',
          icon: <Award className="h-4 w-4" />
        },
        { 
          title: 'Acme Corp', 
          subtitle: 'Corporate', 
          value: 'SAR 87K', 
          change: '+8%', 
          trend: 'up',
          icon: <Briefcase className="h-4 w-4" />
        },
        { 
          title: 'Tech Solutions', 
          subtitle: 'Enterprise', 
          value: 'SAR 76K', 
          change: '-2%', 
          trend: 'down',
          icon: <Briefcase className="h-4 w-4" />
        }
      ],
      alerts: [
        { type: 'success', message: 'Revenue target achieved for Q4', icon: <CheckCircle2 className="h-4 w-4" /> },
        { type: 'warning', message: 'Customer churn rate increasing in South region', icon: <AlertCircle className="h-4 w-4" /> },
        { type: 'info', message: 'New customer segment identified: Tech Startups', icon: <AlertCircle className="h-4 w-4" /> }
      ]
    };

    return baseData;
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleShare = () => {
    console.log('Sharing dashboard...');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-2xl bg-gradient-to-br text-white",
                  config.gradient
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{config.title}</h1>
                  <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
                  className="rounded-full"
                >
                  {viewMode === 'cards' ? <Grid className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Report
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  onClick={fetchData}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts Section */}
        {data?.alerts && data.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-2"
          >
            {data.alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg backdrop-blur-md",
                  alert.type === 'success' && "bg-green-500/10 text-green-700 dark:text-green-400",
                  alert.type === 'warning' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                  alert.type === 'info' && "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                )}
              >
                {alert.icon}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModernStatCard
            title="Total Value"
            value={data?.overview.mainMetric}
            change={data?.overview.change}
            trend={data?.overview.trend}
            description="Overall performance metric"
            icon={IconComponent}
            color={config.color}
            size="large"
          />
          {data?.overview.secondaryMetrics.map((metric, index) => (
            <ModernStatCard
              key={index}
              title={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              icon={
                index === 0 ? Activity :
                index === 1 ? TrendingUp :
                index === 2 ? TrendingDown :
                Target
              }
              color={
                index === 0 ? 'green' :
                index === 1 ? 'blue' :
                index === 2 ? 'red' :
                'purple'
              }
            />
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid backdrop-blur-md bg-white/50 dark:bg-gray-900/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <Eye className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <Target className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <LineChart className="mr-2 h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModernChartCard
                  title="Distribution by Segment"
                  description="Customer segmentation analysis"
                  actions={
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  }
                >
                  <ChartWidget
                    data={data?.distribution.bySegment}
                    chartType="pie"
                    dataKey="value"
                    height={300}
                    showLegend={true}
                  />
                </ModernChartCard>

                <ModernChartCard
                  title="Regional Distribution"
                  description="Geographic performance breakdown"
                  actions={
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  }
                >
                  <ChartWidget
                    data={data?.distribution.byRegion}
                    chartType="bar"
                    xAxisKey="name"
                    yAxisKey="value"
                    height={300}
                  />
                </ModernChartCard>
              </div>

              <ModernListCard
                title="Top Performers"
                items={data?.topItems || []}
                icon={Award}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <ModernChartCard
                title="Trend Analysis"
                description="30-day performance trend"
              >
                <ChartWidget
                  data={data?.trends.daily}
                  chartType="area"
                  xAxisKey="date"
                  yAxisKey="value"
                  height={400}
                  showGrid={true}
                />
              </ModernChartCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModernChartCard
                  title="Revenue Trend"
                  description="Daily revenue performance"
                >
                  <ChartWidget
                    data={data?.trends.daily}
                    chartType="line"
                    xAxisKey="date"
                    yAxisKey="revenue"
                    height={250}
                  />
                </ModernChartCard>

                <ModernProgressCard
                  title="Category Performance"
                  items={data?.performance.categories.map(cat => ({
                    label: cat.label,
                    value: `${cat.value}%`,
                    percentage: cat.percentage,
                    color: cat.percentage > 85 ? 'bg-green-500' : cat.percentage > 70 ? 'bg-yellow-500' : 'bg-red-500'
                  })) || []}
                />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ModernStatCard
                  title="Performance Score"
                  value={`${data?.performance.current}%`}
                  change={`Target: ${data?.performance.target}%`}
                  trend={data?.performance.current >= data?.performance.target ? 'up' : 'down'}
                  description="Overall performance rating"
                  icon={Target}
                  color="purple"
                  size="large"
                />

                <div className="lg:col-span-2">
                  <ModernProgressCard
                    title="Performance Breakdown"
                    items={data?.performance.categories || []}
                  />
                </div>
              </div>

              <ModernChartCard
                title="Performance Radar"
                description="Multi-dimensional performance analysis"
              >
                <ChartWidget
                  data={data?.performance.categories}
                  chartType="radar"
                  dataKey="value"
                  height={400}
                />
              </ModernChartCard>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModernChartCard
                  title="Predictive Analysis"
                  description="AI-powered forecast for next 30 days"
                >
                  <ChartWidget
                    data={data?.trends.daily}
                    chartType="line"
                    xAxisKey="date"
                    yAxisKey="value"
                    height={300}
                    showGrid={true}
                  />
                </ModernChartCard>

                <ModernListCard
                  title="Key Insights"
                  items={[
                    {
                      title: 'Growth Opportunity',
                      subtitle: 'Premium segment showing 25% growth potential',
                      value: '+25%',
                      icon: <TrendingUp className="h-4 w-4 text-green-500" />
                    },
                    {
                      title: 'Risk Alert',
                      subtitle: 'Basic segment churn risk increasing',
                      value: '15%',
                      icon: <AlertCircle className="h-4 w-4 text-yellow-500" />
                    },
                    {
                      title: 'Revenue Optimization',
                      subtitle: 'Cross-sell opportunity identified',
                      value: 'SAR 450K',
                      icon: <DollarSign className="h-4 w-4 text-blue-500" />
                    },
                    {
                      title: 'Customer Satisfaction',
                      subtitle: 'NPS score improvement needed',
                      value: '72/100',
                      icon: <Users className="h-4 w-4 text-purple-500" />
                    }
                  ]}
                  icon={Activity}
                />
              </div>

              <ModernChartCard
                title="Correlation Analysis"
                description="Relationship between key metrics"
              >
                <ChartWidget
                  data={data?.trends.daily}
                  chartType="scatter"
                  xAxisKey="value"
                  yAxisKey="revenue"
                  height={300}
                />
              </ModernChartCard>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernDashboardDetail;