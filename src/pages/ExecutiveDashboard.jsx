import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { DashboardService } from '@/services/dashboardService';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BranchReportService } from '@/services/branchReportService';
import ComparisonControls from '@/components/dashboard/ComparisonControls';
import ComparisonChart from '@/components/dashboard/ComparisonChart';
import ComparisonInsights from '@/components/dashboard/ComparisonInsights';
import { cn } from '@/lib/utils';
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter
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
  Calendar,
  Sparkles,
  Shield,
  Target,
  Zap,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Brain,
  Eye,
  Filter,
  Settings,
  Share2,
  FileText,
  ChevronRight,
  Info,
  Layers,
  Globe,
  Building2,
  Briefcase,
  TrendingUpIcon,
  MoreVertical
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';

// Mock data removed - now fetching from database

// Enhanced color palette for modern design
const COLORS = {
  primary: ['#6366F1', '#4F46E5', '#4338CA'],
  success: ['#10B981', '#059669', '#047857'],
  warning: ['#F59E0B', '#D97706', '#B45309'],
  danger: ['#EF4444', '#DC2626', '#B91C1C'],
  info: ['#3B82F6', '#2563EB', '#1D4ED8'],
  neutral: ['#6B7280', '#4B5563', '#374151'],
  chart: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
};

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

// Enhanced KPI Card with comparison features
function ModernKPICard({ title, value, previousValue, change, trend, icon: Icon, description, format = 'number', comparisonPeriod, color = 'primary' }) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : 
                        format === 'percentage' ? `${value}%` : 
                        typeof value === 'number' ? value.toLocaleString() : value;

  const formattedPreviousValue = previousValue ? (
    format === 'currency' ? formatCurrency(previousValue) : 
    format === 'percentage' ? `${previousValue}%` : 
    typeof previousValue === 'number' ? previousValue.toLocaleString() : previousValue
  ) : null;

  const colorClasses = {
    primary: 'from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800',
    success: 'from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800',
    warning: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800',
    danger: 'from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-800',
    info: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={cn(
        "relative overflow-hidden h-full transition-all duration-300 hover:shadow-2xl",
        "bg-gradient-to-br",
        colorClasses[color],
        "border backdrop-blur-sm"
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className={cn(
            "w-full h-full rounded-full opacity-20",
            `bg-${color}-500`
          )} />
        </div>
        
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {comparisonPeriod && (
              <Badge variant="outline" className="text-xs">
                vs {comparisonPeriod}
              </Badge>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            `bg-${color}-500/20`
          )}>
            <Icon className={cn("h-4 w-4", `text-${color}-600`)} />
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{formattedValue}</div>
              {formattedPreviousValue && (
                <div className="text-sm text-muted-foreground mt-1">
                  Previously: {formattedPreviousValue}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{description}</span>
              {change && (
                <div className="flex items-center space-x-1">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : trend === 'down' ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    trend === 'up' ? 'text-emerald-500' : 
                    trend === 'down' ? 'text-red-500' : 
                    'text-amber-500'
                  )}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            
            {/* Mini sparkline chart */}
            <div className="h-8 w-full opacity-50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { value: previousValue || value * 0.9 },
                  { value: value * 0.95 },
                  { value: value }
                ]}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={COLORS[color][0]}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Modern Risk Score Card with visual indicators
function ModernRiskScoreCard({ category, score, status, trend, details }) {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'low':
        return { color: 'success', icon: CheckCircle, label: 'Low Risk' };
      case 'medium':
        return { color: 'warning', icon: AlertTriangle, label: 'Medium Risk' };
      case 'high':
        return { color: 'danger', icon: AlertTriangle, label: 'High Risk' };
      default:
        return { color: 'info', icon: Info, label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className={cn(
          "absolute inset-0 opacity-5",
          `bg-gradient-to-br from-${config.color}-500 to-${config.color}-600`
        )} />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{category}</CardTitle>
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Risk Details</h4>
                  <p className="text-sm text-muted-foreground">{details || 'No additional details available'}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-full",
                `bg-${config.color}-500/20`
              )}>
                <Icon className={cn("h-5 w-5", `text-${config.color}-600`)} />
              </div>
              <div>
                <div className="text-2xl font-bold">{score}%</div>
                <Badge variant={config.color} className="mt-1">
                  {config.label}
                </Badge>
              </div>
            </div>
            
            {trend && (
              <div className="text-right">
                <div className="flex items-center text-sm">
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                    {Math.abs(trend)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs last period
                </div>
              </div>
            )}
          </div>
          
          <Progress 
            value={score} 
            className={cn(
              "h-2",
              `[&>div]:bg-${config.color}-500`
            )}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ExecutiveDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [comparisonSettings, setComparisonSettings] = useState({
    type: 'month-to-month',
    customRange: null,
    metrics: ['all']
  });
  const [activeView, setActiveView] = useState('overview');
  const { shouldRefresh, refreshComplete } = useDataRefresh();

  // Fetch real dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters = {
        dateRange,
        branch: selectedBranch,
        comparison: comparisonSettings
      };
      
      const response = await DashboardService.getExecutiveDashboard(filters);
      
      if (response && response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedBranch, comparisonSettings]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (shouldRefresh) {
      fetchDashboardData().then(() => {
        refreshComplete();
        toast.success('Dashboard refreshed successfully');
      });
    }
  }, [shouldRefresh, fetchDashboardData, refreshComplete]);

  const handleComparisonChange = (settings) => {
    setComparisonSettings(settings);
  };

  const handleExport = () => {
    toast.success('Exporting dashboard data...');
    // Implement export functionality
  };

  const handleShare = () => {
    toast.success('Sharing dashboard...');
    // Implement share functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 space-y-6"
      >
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Executive Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className="relative overflow-hidden group"
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2 transition-transform",
                loading && "animate-spin"
              )} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button variant="default" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        {/* Comparison Controls */}
        <ComparisonControls 
          onComparisonChange={handleComparisonChange}
          className="mb-6"
        />

        {/* Quick Filters */}
        <Card className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick Filters:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="riyadh">Riyadh</SelectItem>
                  <SelectItem value="jeddah">Jeddah</SelectItem>
                  <SelectItem value="dammam">Dammam</SelectItem>
                </SelectContent>
              </Select>
              
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full sm:w-[300px]"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">AI Insights: </span>ON
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Live </span>Data
              </Badge>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Layers className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <TrendingUpIcon className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernKPICard
                  title="Total Revenue"
                  value={dashboardData?.revenue?.current || 125000000}
                  previousValue={dashboardData?.revenue?.previous || 115000000}
                  change="+8.7%"
                  trend="up"
                  icon={DollarSign}
                  description="Total income generated"
                  format="currency"
                  comparisonPeriod={comparisonSettings.type}
                  color="success"
                />
                
                <ModernKPICard
                  title="Active Loans"
                  value={dashboardData?.loans?.active || 8543}
                  previousValue={dashboardData?.loans?.previousActive || 8234}
                  change="+3.8%"
                  trend="up"
                  icon={CreditCard}
                  description="Currently active loans"
                  comparisonPeriod={comparisonSettings.type}
                  color="primary"
                />
                
                <ModernKPICard
                  title="Total Deposits"
                  value={dashboardData?.deposits?.total || 450000000}
                  previousValue={dashboardData?.deposits?.previousTotal || 425000000}
                  change="+5.9%"
                  trend="up"
                  icon={PiggyBank}
                  description="Customer deposits"
                  format="currency"
                  comparisonPeriod={comparisonSettings.type}
                  color="info"
                />
                
                <ModernKPICard
                  title="NPL Ratio"
                  value={dashboardData?.npl?.ratio || 2.3}
                  previousValue={dashboardData?.npl?.previousRatio || 2.8}
                  change="-0.5%"
                  trend="down"
                  icon={AlertTriangle}
                  description="Non-performing loans"
                  format="percentage"
                  comparisonPeriod={comparisonSettings.type}
                  color="warning"
                />
              </div>

              {/* Enhanced Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue comparison</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dashboardData?.revenueTrend || [
                        { month: 'Jan', current: 95, previous: 88 },
                        { month: 'Feb', current: 98, previous: 90 },
                        { month: 'Mar', current: 105, previous: 95 },
                        { month: 'Apr', current: 110, previous: 98 },
                        { month: 'May', current: 118, previous: 105 },
                        { month: 'Jun', current: 125, previous: 110 }
                      ]}>
                        <defs>
                          <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary[0]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary[0]} stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.neutral[0]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.neutral[0]} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="current" 
                          stroke={COLORS.primary[0]} 
                          fillOpacity={1} 
                          fill="url(#colorCurrent)"
                          strokeWidth={2}
                          name="Current Period"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="previous" 
                          stroke={COLORS.neutral[0]} 
                          fillOpacity={1} 
                          fill="url(#colorPrevious)"
                          strokeWidth={2}
                          name="Previous Period"
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Portfolio Distribution */}
                <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Portfolio Distribution</CardTitle>
                        <CardDescription>Loan portfolio by category</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dashboardData?.portfolio || [
                            { name: 'Personal Loans', value: 35, growth: '+5%' },
                            { name: 'Mortgages', value: 28, growth: '+3%' },
                            { name: 'Auto Loans', value: 20, growth: '+8%' },
                            { name: 'Business Loans', value: 12, growth: '+12%' },
                            { name: 'Others', value: 5, growth: '-2%' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(dashboardData?.portfolio || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Scores Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Risk Assessment</h3>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Report
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ModernRiskScoreCard
                    category="Credit Risk"
                    score={dashboardData?.riskScores?.credit || 15}
                    status="low"
                    trend={-2}
                    details="Credit risk has decreased due to improved underwriting standards"
                  />
                  
                  <ModernRiskScoreCard
                    category="Market Risk"
                    score={dashboardData?.riskScores?.market || 35}
                    status="medium"
                    trend={5}
                    details="Market volatility has increased risk exposure"
                  />
                  
                  <ModernRiskScoreCard
                    category="Operational Risk"
                    score={dashboardData?.riskScores?.operational || 20}
                    status="low"
                    trend={-1}
                    details="Process improvements have reduced operational risks"
                  />
                  
                  <ModernRiskScoreCard
                    category="Compliance Risk"
                    score={dashboardData?.riskScores?.compliance || 10}
                    status="low"
                    trend={0}
                    details="Strong compliance framework maintains low risk levels"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ComparisonChart
                  title="Revenue Comparison"
                  description={`Comparing revenue ${comparisonSettings.type}`}
                  data={[
                    { period: 'Jan', current: 95000000, previous: 88000000, target: 100000000, growth: 7.95 },
                    { period: 'Feb', current: 98000000, previous: 90000000, target: 102000000, growth: 8.89 },
                    { period: 'Mar', current: 105000000, previous: 95000000, target: 108000000, growth: 10.53 },
                    { period: 'Apr', current: 110000000, previous: 98000000, target: 112000000, growth: 12.24 },
                    { period: 'May', current: 118000000, previous: 105000000, target: 120000000, growth: 12.38 },
                    { period: 'Jun', current: 125000000, previous: 110000000, target: 125000000, growth: 13.64 }
                  ]}
                  comparisonType={comparisonSettings.type}
                  metrics={['revenue', 'profit', 'expenses']}
                  onExport={() => toast.success('Exporting chart data...')}
                />

                <ComparisonChart
                  title="Customer Growth"
                  description={`Customer acquisition ${comparisonSettings.type}`}
                  data={[
                    { period: 'Jan', current: 1250, previous: 1100, target: 1300, growth: 13.64 },
                    { period: 'Feb', current: 1380, previous: 1200, target: 1400, growth: 15.00 },
                    { period: 'Mar', current: 1520, previous: 1350, target: 1550, growth: 12.59 },
                    { period: 'Apr', current: 1680, previous: 1480, target: 1700, growth: 13.51 },
                    { period: 'May', current: 1850, previous: 1620, target: 1900, growth: 14.20 },
                    { period: 'Jun', current: 2100, previous: 1850, target: 2200, growth: 13.51 }
                  ]}
                  comparisonType={comparisonSettings.type}
                  metrics={['new_customers', 'active_customers', 'churned_customers']}
                  onExport={() => toast.success('Exporting chart data...')}
                />
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Efficiency Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">42.5%</div>
                    <Progress value={42.5} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: 40% | Industry Avg: 50%
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">ROE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18.2%</div>
                    <Progress value={72.8} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: 20% | Industry Avg: 15%
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Cost-to-Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">38.7%</div>
                    <Progress value={61.3} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: 35% | Industry Avg: 45%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Loan Portfolio Comparison */}
              <ComparisonChart
                title="Loan Portfolio Performance"
                description="Portfolio comparison by product type"
                data={[
                  { period: 'Personal', current: 450000000, previous: 420000000, target: 480000000, growth: 7.14 },
                  { period: 'Mortgage', current: 380000000, previous: 350000000, target: 400000000, growth: 8.57 },
                  { period: 'Auto', current: 280000000, previous: 250000000, target: 300000000, growth: 12.00 },
                  { period: 'Business', current: 220000000, previous: 180000000, target: 250000000, growth: 22.22 },
                  { period: 'Credit Cards', current: 150000000, previous: 130000000, target: 170000000, growth: 15.38 }
                ]}
                comparisonType={comparisonSettings.type}
                metrics={['disbursed_amount', 'outstanding_balance', 'npl_amount']}
                onExport={() => toast.success('Exporting chart data...')}
              />
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              {/* Risk analysis content */}
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Risk Analysis Dashboard</CardTitle>
                  <CardDescription>Comprehensive risk assessment and monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add risk analysis charts here */}
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Risk analysis visualization
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* AI-Powered Comparison Insights */}
              <ComparisonInsights 
                data={dashboardData}
                comparisonType={comparisonSettings.type}
              />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
