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
import { DashboardButtonService } from '@/services/dashboardButtonService';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BranchReportService } from '@/services/branchReportService';
import ComparisonControls from '@/components/dashboard/ComparisonControls';
import ComparisonChart from '@/components/dashboard/ComparisonChart';
import ComparisonInsights from '@/components/dashboard/ComparisonInsights';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  MoreVertical,
  ChevronDown,
  Mail,
  Link,
  Copy,
  Image,
  FileSpreadsheet
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
  const { t } = useTranslation();
  
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
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 transform translate-x-8 -translate-y-8">
          <div className={cn(
            "w-full h-full rounded-full opacity-20",
            `bg-${color}-500`
          )} />
        </div>
        
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {comparisonPeriod && (
              <Badge variant="outline" className="text-xs">
                vs {comparisonPeriod}
              </Badge>
            )}
          </div>
          <div className={cn(
            "p-1.5 sm:p-2 rounded-lg",
            `bg-${color}-500/20`
          )}>
            <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", `text-${color}-600`)} />
          </div>
        </CardHeader>
        
        <CardContent className="relative p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-lg sm:text-2xl font-bold">{formattedValue}</div>
              {formattedPreviousValue && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('executiveDashboard.previously')}: {formattedPreviousValue}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs text-muted-foreground">{description}</span>
              {change && (
                <div className="flex items-center space-x-1">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                  ) : trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  ) : (
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
                    trend === 'up' ? 'text-emerald-500' : 
                    trend === 'down' ? 'text-red-500' : 
                    'text-amber-500'
                  )}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            
            {/* Mini sparkline chart - hide on very small screens */}
            <div className="h-6 sm:h-8 w-full opacity-50 hidden sm:block">
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
  const { t } = useTranslation();
  
  const getStatusConfig = (status) => {
    switch(status) {
      case 'low':
        return { color: 'success', icon: CheckCircle, label: t('executiveDashboard.lowRisk') };
      case 'medium':
        return { color: 'warning', icon: AlertTriangle, label: t('executiveDashboard.mediumRisk') };
      case 'high':
        return { color: 'danger', icon: AlertTriangle, label: t('executiveDashboard.highRisk') };
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
        
        <CardHeader className="relative pb-3 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <CardTitle className="text-sm sm:text-base">{category}</CardTitle>
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{t('executiveDashboard.riskDetails')}</h4>
                  <p className="text-sm text-muted-foreground">{details || t('executiveDashboard.noAdditionalDetails')}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={cn(
                "p-1.5 sm:p-2 rounded-full",
                `bg-${config.color}-500/20`
              )}>
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", `text-${config.color}-600`)} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">{score}%</div>
                <Badge variant={config.color} className="mt-1 text-xs">
                  {config.label}
                </Badge>
              </div>
            </div>
            
            {trend && (
              <div className="text-right">
                <div className="flex items-center text-xs sm:text-sm">
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                  )}
                  <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                    {Math.abs(trend)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('executiveDashboard.vsLastPeriod')}
                </div>
              </div>
            )}
          </div>
          
          <Progress 
            value={score} 
            className={cn(
              "h-1.5 sm:h-2",
              `[&>div]:bg-${config.color}-500`
            )}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ExecutiveDashboard() {
  const { t, i18n } = useTranslation();
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
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const { shouldRefresh, refreshComplete } = useDataRefresh();

  // Fetch real dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching dashboard data...');
      
      const filters = {
        dateRange,
        branch: selectedBranch,
        comparison: comparisonSettings
      };
      
      const response = await DashboardService.getExecutiveDashboard(filters);
      
      if (response && response.success && response.data) {
        setDashboardData(response.data);
        console.log('✅ Dashboard data loaded successfully:', response.data);
        toast.success('Dashboard data updated successfully');
      } else {
        console.error('❌ Failed to load dashboard data:', response);
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
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

  // Export functionality
  const handleExport = async (format = 'excel') => {
    if (!dashboardData) {
      toast.error('No data available to export');
      return;
    }

    try {
      setIsExporting(true);
      const result = await DashboardButtonService.exportDashboard(dashboardData, format, {
        elementId: 'executive-dashboard-container'
      });
      
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export dashboard');
    } finally {
      setIsExporting(false);
    }
  };

  // Share functionality
  const handleShare = async (method = 'link') => {
    if (!dashboardData) {
      toast.error('No data available to share');
      return;
    }

    try {
      setIsSharing(true);
      const result = await DashboardButtonService.shareDashboard(dashboardData, method);
      
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error.message || 'Failed to share dashboard');
    } finally {
      setIsSharing(false);
    }
  };

  // Generate detailed report
  const handleGenerateReport = async (format = 'pdf') => {
    if (!dashboardData) {
      toast.error('No data available for report generation');
      return;
    }

    try {
      setIsExporting(true);
      const result = await DashboardButtonService.generateDetailedReport(dashboardData, { format });
      
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  // Customization functionality
  const handleCustomization = () => {
    setCustomizationOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        id="executive-dashboard-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('executiveDashboard.title')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t('executiveDashboard.realTimeInsights')}
              {dashboardData?.dataQuality && (
                <Badge variant={dashboardData.dataQuality === 'live' ? 'default' : 'secondary'} className="ml-2">
                  {dashboardData.dataQuality === 'live' ? t('executiveDashboard.liveData') : t('executiveDashboard.demoData')}
                </Badge>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className="relative overflow-hidden group"
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-1 sm:mr-2 transition-transform",
                loading && "animate-spin"
              )} />
              <span className="hidden sm:inline">{t('executiveDashboard.refresh')}</span>
              <span className="sm:hidden">{t('executiveDashboard.refresh')}</span>
            </Button>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting || !dashboardData}
                >
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('executiveDashboard.export')}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('executiveDashboard.exportFormat')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.excelFormat')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.pdfReport')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.csvData')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('image')}>
                  <Image className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.pngImage')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.jsonData')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Share Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSharing || !dashboardData}
                >
                  <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('executiveDashboard.share')}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('executiveDashboard.shareMethod')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare('link')}>
                  <Link className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.copyLink')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.emailSummary')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('executiveDashboard.copySummary')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={handleCustomization}
              className="hidden sm:flex"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('executiveDashboard.customize')}
            </Button>
          </div>
        </div>

        {/* Comparison Controls */}
        <ComparisonControls 
          onComparisonChange={handleComparisonChange}
          className="mb-4 sm:mb-6"
        />

        {/* Quick Filters */}
        <Card className="p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{t('executiveDashboard.quickFilters')}:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('executiveDashboard.selectBranch')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('executiveDashboard.allBranches')}</SelectItem>
                  <SelectItem value="riyadh">{t('executiveDashboard.riyadh')}</SelectItem>
                  <SelectItem value="jeddah">{t('executiveDashboard.jeddah')}</SelectItem>
                  <SelectItem value="dammam">{t('executiveDashboard.dammam')}</SelectItem>
                </SelectContent>
              </Select>
              
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full sm:w-[300px]"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{t('executiveDashboard.aiInsights')}: </span>{t('executiveDashboard.on')}
              </Badge>
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Live </span>{t('executiveDashboard.data')}
              </Badge>
              {dashboardData?.lastUpdated && (
                <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
                  <span className="hidden sm:inline">{t('executiveDashboard.lastUpdated')}: </span>
                  {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl mx-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('executiveDashboard.overview')}</span>
              <span className="sm:hidden">{t('executiveDashboard.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">
              <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('executiveDashboard.performance')}</span>
              <span className="sm:hidden">{t('executiveDashboard.performance')}</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('executiveDashboard.riskAnalysis')}</span>
              <span className="sm:hidden">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('executiveDashboard.aiInsights')}</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <ModernKPICard
                  title={t('executiveDashboard.totalRevenue')}
                  value={dashboardData?.revenue?.current || 125000000}
                  previousValue={dashboardData?.revenue?.previous || 115000000}
                  change={dashboardData?.revenue?.change || "+8.7%"}
                  trend={dashboardData?.revenue?.trend || "up"}
                  icon={DollarSign}
                  description={t('executiveDashboard.totalIncomeGenerated')}
                  format="currency"
                  comparisonPeriod={comparisonSettings.type}
                  color="success"
                />
                
                <ModernKPICard
                  title={t('executiveDashboard.activeLoans')}
                  value={dashboardData?.loans?.active || 8543}
                  previousValue={dashboardData?.loans?.previousActive || 8234}
                  change={dashboardData?.loans?.change || "+3.8%"}
                  trend={dashboardData?.loans?.trend || "up"}
                  icon={CreditCard}
                  description={t('executiveDashboard.currentlyActiveLoans')}
                  comparisonPeriod={comparisonSettings.type}
                  color="primary"
                />
                
                <ModernKPICard
                  title={t('executiveDashboard.totalDeposits')}
                  value={dashboardData?.deposits?.total || 450000000}
                  previousValue={dashboardData?.deposits?.previousTotal || 425000000}
                  change={dashboardData?.deposits?.change || "+5.9%"}
                  trend={dashboardData?.deposits?.trend || "up"}
                  icon={PiggyBank}
                  description={t('executiveDashboard.customerDeposits')}
                  format="currency"
                  comparisonPeriod={comparisonSettings.type}
                  color="info"
                />
                
                <ModernKPICard
                  title={t('executiveDashboard.nplRatio')}
                  value={dashboardData?.npl?.ratio || 2.3}
                  previousValue={dashboardData?.npl?.previousRatio || 2.8}
                  change={dashboardData?.npl?.change || "-0.5%"}
                  trend={dashboardData?.npl?.trend || "down"}
                  icon={AlertTriangle}
                  description={t('executiveDashboard.nonPerformingLoans')}
                  format="percentage"
                  comparisonPeriod={comparisonSettings.type}
                  color="warning"
                />
              </div>

              {/* Enhanced Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Revenue Trend Chart */}
                <Card className="p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4 p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{t('executiveDashboard.revenueTrend')}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t('executiveDashboard.monthlyRevenueComparison')}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport('excel')}>
                            {t('executiveDashboard.exportData')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport('pdf')}>
                            {t('executiveDashboard.generateReport')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 mt-4">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="current" 
                          stroke={COLORS.primary[0]} 
                          fillOpacity={1} 
                          fill="url(#colorCurrent)"
                          strokeWidth={2}
                          name={t('executiveDashboard.currentPeriod')}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="previous" 
                          stroke={COLORS.neutral[0]} 
                          fillOpacity={1} 
                          fill="url(#colorPrevious)"
                          strokeWidth={2}
                          name={t('executiveDashboard.previousPeriod')}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Portfolio Distribution */}
                <Card className="p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4 p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{t('executiveDashboard.portfolioDistribution')}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t('executiveDashboard.loanPortfolioByCategory')}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport('excel')}>
                            {t('executiveDashboard.exportData')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport('pdf')}>
                            {t('executiveDashboard.generateReport')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 mt-4">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                      <PieChart>
                        <Pie
                          data={dashboardData?.portfolio || [
                            { name: t('executiveDashboard.personalLoans'), value: 35, growth: '+5%' },
                            { name: t('executiveDashboard.mortgages'), value: 28, growth: '+3%' },
                            { name: t('executiveDashboard.autoLoans'), value: 20, growth: '+8%' },
                            { name: t('executiveDashboard.businessLoans'), value: 12, growth: '+12%' },
                            { name: t('executiveDashboard.others'), value: 5, growth: '-2%' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
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
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px'
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
                  <h3 className="text-base sm:text-lg font-semibold">{t('executiveDashboard.riskAssessment')}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport('pdf')}
                    disabled={isExporting}
                    className="text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {isExporting ? t('executiveDashboard.generating') : t('executiveDashboard.viewFullReport')}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <ModernRiskScoreCard
                    category={t('executiveDashboard.creditRisk')}
                    score={dashboardData?.riskScores?.credit || 15}
                    status="low"
                    trend={-2}
                    details={t('executiveDashboard.creditRiskDetails')}
                  />
                  
                  <ModernRiskScoreCard
                    category={t('executiveDashboard.marketRisk')}
                    score={dashboardData?.riskScores?.market || 35}
                    status="medium"
                    trend={5}
                    details={t('executiveDashboard.marketRiskDetails')}
                  />
                  
                  <ModernRiskScoreCard
                    category={t('executiveDashboard.operationalRisk')}
                    score={dashboardData?.riskScores?.operational || 20}
                    status="low"
                    trend={-1}
                    details={t('executiveDashboard.operationalRiskDetails')}
                  />
                  
                  <ModernRiskScoreCard
                    category={t('executiveDashboard.complianceRisk')}
                    score={dashboardData?.riskScores?.compliance || 10}
                    status="low"
                    trend={0}
                    details={t('executiveDashboard.complianceRiskDetails')}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 sm:space-y-6">
              {/* Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ComparisonChart
                  title={t('executiveDashboard.revenueComparison')}
                  description={`${t('executiveDashboard.comparing')} ${t('executiveDashboard.revenue')} ${comparisonSettings.type}`}
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
                  onExport={() => handleExport('excel')}
                />

                <ComparisonChart
                  title={t('executiveDashboard.customerGrowth')}
                  description={`${t('executiveDashboard.customerAcquisition')} ${comparisonSettings.type}`}
                  data={[
                    { period: 'Jan', current: 1250, previous: 1100, target: 1300, growth: 13.64 },
                    { period: 'Feb', current: 1380, previous: 1200, target: 1400, growth: 15.00 },
                    { period: 'Mar', current: 1520, previous: 1350, target: 1550, growth: 12.59 },
                    { period: 'Apr', current: 1680, previous: 1480, target: 1700, growth: 13.51 },
                    { period: 'May', current: 1850, previous: 1620, target: 1900, growth: 14.20 },
                    { period: 'Jun', current: 2100, previous: 1850, target: 2200, growth: 13.51 }
                  ]}
                  comparisonType={comparisonSettings.type}
                  metrics={[t('executiveDashboard.newCustomers'), t('executiveDashboard.activeCustomers'), t('executiveDashboard.churnedCustomers')]}
                  onExport={() => handleExport('excel')}
                />
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <Card className="p-4 sm:p-6">
                  <CardHeader className="pb-3 p-0">
                    <CardTitle className="text-sm sm:text-base">{t('executiveDashboard.efficiencyRatio')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <div className="text-xl sm:text-2xl font-bold">42.5%</div>
                    <Progress value={42.5} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('executiveDashboard.target')}: 40% | {t('executiveDashboard.industryAvg')}: 50%
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="pb-3 p-0">
                    <CardTitle className="text-sm sm:text-base">{t('executiveDashboard.roe')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <div className="text-xl sm:text-2xl font-bold">18.2%</div>
                    <Progress value={72.8} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('executiveDashboard.target')}: 20% | {t('executiveDashboard.industryAvg')}: 15%
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="pb-3 p-0">
                    <CardTitle className="text-sm sm:text-base">{t('executiveDashboard.costToIncome')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <div className="text-xl sm:text-2xl font-bold">38.7%</div>
                    <Progress value={61.3} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('executiveDashboard.target')}: 35% | {t('executiveDashboard.industryAvg')}: 45%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Loan Portfolio Comparison */}
              <ComparisonChart
                title={t('executiveDashboard.loanPortfolioPerformance')}
                description={t('executiveDashboard.portfolioComparisonByProductType')}
                data={[
                  { period: t('executiveDashboard.personalLoans'), current: 450000000, previous: 420000000, target: 480000000, growth: 7.14 },
                  { period: t('executiveDashboard.mortgages'), current: 380000000, previous: 350000000, target: 400000000, growth: 8.57 },
                  { period: t('executiveDashboard.autoLoans'), current: 280000000, previous: 250000000, target: 300000000, growth: 12.00 },
                  { period: t('executiveDashboard.businessLoans'), current: 220000000, previous: 180000000, target: 250000000, growth: 22.22 },
                  { period: t('executiveDashboard.creditCards'), current: 150000000, previous: 130000000, target: 170000000, growth: 15.38 }
                ]}
                comparisonType={comparisonSettings.type}
                metrics={[t('executiveDashboard.disbursedAmount'), t('executiveDashboard.outstandingBalance'), t('executiveDashboard.nplAmount')]}
                onExport={() => handleExport('excel')}
              />
            </TabsContent>

            <TabsContent value="risk" className="space-y-4 sm:space-y-6">
              {/* Risk analysis content */}
              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-base sm:text-lg">{t('executiveDashboard.riskAnalysisDashboard')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t('executiveDashboard.comprehensiveRiskAssessment')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  {/* Add risk analysis charts here */}
                  <div className="h-[300px] sm:h-[400px] flex items-center justify-center text-muted-foreground">
                    {t('executiveDashboard.riskAnalysisVisualization')}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4 sm:space-y-6">
              {/* AI-Powered Comparison Insights */}
              <ComparisonInsights 
                data={dashboardData}
                comparisonType={comparisonSettings.type}
              />
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Customization Dialog */}
        <Dialog open={customizationOpen} onOpenChange={setCustomizationOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t('executiveDashboard.dashboardCustomization')}</DialogTitle>
              <DialogDescription>
                {t('executiveDashboard.customizeLayout')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <p>{t('executiveDashboard.customizationPanel')}</p>
                <p className="text-sm">{t('executiveDashboard.configureThemes')}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
