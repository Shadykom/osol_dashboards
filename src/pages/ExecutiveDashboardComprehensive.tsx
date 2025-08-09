import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart, Scatter, ScatterChart, Treemap,
  Sankey, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle,
  Phone, Clock, CheckCircle, XCircle, Activity, Award, Building2,
  FileText, Zap, Shield, Eye, Download, RefreshCw, Calendar as CalendarIcon,
  Filter, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  GitBranch, Package, Layers, Maximize2, Minimize2, Settings,
  ChevronDown, ChevronRight, Info, ArrowUpRight, ArrowDownRight,
  Briefcase, CreditCard, Banknote, TrendingUp as TrendIcon
} from 'lucide-react';
import { supabaseBanking } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Define comprehensive metric types
interface Metric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  unit: 'currency' | 'percentage' | 'number';
  trend: number[];
  target?: number;
  icon: React.ElementType;
  color: string;
}

interface BranchData {
  id: string;
  name: string;
  nameAr: string;
  region: string;
  metrics: {
    revenue: number;
    customers: number;
    activeLoans: number;
    deposits: number;
    nplRatio: number;
    transactions: number;
    efficiency: number;
    satisfaction: number;
  };
  performance: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    quarterly: number[];
  };
}

interface ProductData {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  metrics: {
    activeAccounts: number;
    revenue: number;
    avgBalance: number;
    growth: number;
    marketShare: number;
    profitability: number;
    riskScore: number;
    customerSatisfaction: number;
  };
  demographics: {
    ageGroups: { group: string; count: number; percentage: number }[];
    genderSplit: { male: number; female: number };
    incomeSegments: { segment: string; count: number; percentage: number }[];
  };
}

const ExecutiveDashboardComprehensive = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedView, setExpandedView] = useState<string | null>(null);
  
  // Time period selection
  const [timeRange, setTimeRange] = useState('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Comparison settings
  const [comparisonMode, setComparisonMode] = useState<'none' | 'period' | 'custom'>('period');
  const [comparisonRange, setComparisonRange] = useState('previous_month');
  const [customComparisonRange, setCustomComparisonRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1))
  });
  
  // Multi-select for branches and products
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all']);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['all']);
  const [branchComparisonMode, setBranchComparisonMode] = useState<'individual' | 'aggregate'>('aggregate');
  const [productComparisonMode, setProductComparisonMode] = useState<'individual' | 'aggregate'>('aggregate');
  
  // View preferences
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'composed'>('composed');
  const [metricView, setMetricView] = useState<'cards' | 'table' | 'heatmap'>('cards');
  const [showTargets, setShowTargets] = useState(true);
  const [showComparison, setShowComparison] = useState(true);
  const [showTrends, setShowTrends] = useState(true);
  
  // Data states
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [overallMetrics, setOverallMetrics] = useState<Metric[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>({});

  // Predefined date ranges
  const dateRanges = {
    today: { from: new Date(), to: new Date() },
    yesterday: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
    last_7_days: { from: subDays(new Date(), 6), to: new Date() },
    last_30_days: { from: subDays(new Date(), 29), to: new Date() },
    this_month: { from: startOfMonth(new Date()), to: new Date() },
    last_month: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    this_quarter: { from: startOfQuarter(new Date()), to: new Date() },
    last_quarter: { from: startOfQuarter(subMonths(new Date(), 3)), to: endOfQuarter(subMonths(new Date(), 3)) },
    this_year: { from: startOfYear(new Date()), to: new Date() },
    last_year: { from: startOfYear(subMonths(new Date(), 12)), to: endOfYear(subMonths(new Date(), 12)) }
  };

  // Fetch comprehensive data
  const fetchComprehensiveData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const dateRange = timeRange === 'custom' ? customDateRange : dateRanges[timeRange];
      
      // Fetch branches data
      const { data: branchesData, error: branchesError } = await supabaseBanking
        .from('branches')
        .select(`
          branch_id,
          branch_name,
          branch_code,
          city,
          region:state,
          is_active
        `)
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      // Fetch product categories separately to avoid implicit relationship requirement
      const { data: categoriesData, error: categoriesError } = await supabaseBanking
        .from('product_categories')
        .select('category_id, category_name, name, name_ar');

      if (categoriesError) throw categoriesError;

      // Build a map of category_id -> category display name
      const categoryNameById = Object.fromEntries(
        (categoriesData || []).map(c => [c.category_id, c.category_name || c.name || 'Uncategorized'])
      );

      // Fetch products data (without nested relationship)
      const { data: productsData, error: productsError } = await supabaseBanking
        .from('products')
        .select(`
          product_id,
          product_name,
          product_code,
          category_id,
          is_active
        `)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch transactions for metrics
      const { data: transactions, error: transError } = await supabaseBanking
        .from('transactions')
        .select(`
          branch_id,
          product_id,
          transaction_amount,
          transaction_type,
          transaction_date,
          customer_id
        `)
        .gte('transaction_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (transError) throw transError;

      // Fetch loan accounts
      const { data: loanAccounts, error: loansError } = await supabaseBanking
        .from('loan_accounts')
        .select(`
          id,
          branch_id,
          product_id,
          loan_amount,
          outstanding_balance,
          days_past_due,
          account_status,
          customer_id
        `)
        .in('account_status', ['ACTIVE', 'OVERDUE', 'RESTRUCTURED']);

      if (loansError) throw loansError;

      // Process data for branches
      const processedBranches = branchesData.map(branch => {
        const branchTransactions = transactions.filter(t => t.branch_id === branch.branch_id);
        const branchLoans = loanAccounts.filter(l => l.branch_id === branch.branch_id);
        
        const revenue = branchTransactions
          .filter(t => ['LOAN_DISBURSEMENT', 'INTEREST_PAYMENT', 'FEE_PAYMENT'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.transaction_amount || 0), 0);
        
        const deposits = branchTransactions
          .filter(t => t.transaction_type === 'DEPOSIT')
          .reduce((sum, t) => sum + (t.transaction_amount || 0), 0);
        
        const uniqueCustomers = new Set(branchTransactions.map(t => t.customer_id)).size;
        const activeLoans = branchLoans.filter(l => l.account_status === 'ACTIVE').length;
        const overdueLoans = branchLoans.filter(l => l.days_past_due > 0).length;
        const totalLoans = branchLoans.length;
        const nplRatio = totalLoans > 0 ? (overdueLoans / totalLoans) * 100 : 0;
        
        return {
          id: branch.branch_id,
          name: branch.branch_name,
          nameAr: branch.branch_name,
          region: branch.region,
          metrics: {
            revenue,
            customers: uniqueCustomers,
            activeLoans,
            deposits,
            nplRatio,
            transactions: branchTransactions.length,
            efficiency: Math.random() * 100, // Placeholder - calculate based on actual metrics
            satisfaction: Math.random() * 100 // Placeholder - calculate based on actual metrics
          },
          performance: {
            daily: Array(30).fill(0).map(() => Math.random() * 100000),
            weekly: Array(12).fill(0).map(() => Math.random() * 500000),
            monthly: Array(12).fill(0).map(() => Math.random() * 2000000),
            quarterly: Array(4).fill(0).map(() => Math.random() * 6000000)
          }
        };
      });

      setBranches(processedBranches);

      // Process data for products
      const processedProducts = productsData.map(product => {
        const productTransactions = transactions.filter(t => t.product_id === product.product_id);
        const productLoans = loanAccounts.filter(l => l.product_id === product.product_id);
        
        const revenue = productTransactions
          .filter(t => ['LOAN_DISBURSEMENT', 'INTEREST_PAYMENT', 'FEE_PAYMENT'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.transaction_amount || 0), 0);
        
        const activeAccounts = productLoans.filter(l => l.account_status === 'ACTIVE').length;
        const totalBalance = productLoans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);
        const avgBalance = activeAccounts > 0 ? totalBalance / activeAccounts : 0;
        
        return {
          id: product.product_id,
          name: product.product_name,
          nameAr: product.product_name,
          category: categoryNameById[product.category_id] || 'Uncategorized',
          metrics: {
            activeAccounts,
            revenue,
            avgBalance,
            growth: Math.random() * 50 - 10, // Placeholder
            marketShare: Math.random() * 30, // Placeholder
            profitability: Math.random() * 40, // Placeholder
            riskScore: Math.random() * 100, // Placeholder
            customerSatisfaction: Math.random() * 100 // Placeholder
          },
          demographics: {
            ageGroups: [
              { group: '18-25', count: Math.floor(Math.random() * 1000), percentage: 15 },
              { group: '26-35', count: Math.floor(Math.random() * 2000), percentage: 30 },
              { group: '36-45', count: Math.floor(Math.random() * 1800), percentage: 25 },
              { group: '46-55', count: Math.floor(Math.random() * 1200), percentage: 20 },
              { group: '56+', count: Math.floor(Math.random() * 800), percentage: 10 }
            ],
            genderSplit: { male: 55, female: 45 },
            incomeSegments: [
              { segment: 'Low', count: Math.floor(Math.random() * 1000), percentage: 20 },
              { segment: 'Medium', count: Math.floor(Math.random() * 2500), percentage: 50 },
              { segment: 'High', count: Math.floor(Math.random() * 1000), percentage: 20 },
              { segment: 'Premium', count: Math.floor(Math.random() * 500), percentage: 10 }
            ]
          }
        };
      });

      setProducts(processedProducts);

      // Calculate overall metrics
      const totalRevenue = processedBranches.reduce((sum, b) => sum + b.metrics.revenue, 0);
      const totalCustomers = processedBranches.reduce((sum, b) => sum + b.metrics.customers, 0);
      const totalLoans = processedBranches.reduce((sum, b) => sum + b.metrics.activeLoans, 0);
      const totalDeposits = processedBranches.reduce((sum, b) => sum + b.metrics.deposits, 0);
      const avgNPL = processedBranches.reduce((sum, b) => sum + b.metrics.nplRatio, 0) / processedBranches.length;
      const totalTransactions = processedBranches.reduce((sum, b) => sum + b.metrics.transactions, 0);

      setOverallMetrics([
        {
          id: 'revenue',
          name: t('metrics.totalRevenue'),
          value: totalRevenue,
          change: 12.5,
          changeType: 'positive',
          unit: 'currency',
          trend: Array(7).fill(0).map(() => Math.random() * 100000),
          target: totalRevenue * 1.1,
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          id: 'customers',
          name: t('metrics.totalCustomers'),
          value: totalCustomers,
          change: 8.3,
          changeType: 'positive',
          unit: 'number',
          trend: Array(7).fill(0).map(() => Math.random() * 1000),
          target: totalCustomers * 1.05,
          icon: Users,
          color: 'text-blue-600'
        },
        {
          id: 'loans',
          name: t('metrics.activeLoans'),
          value: totalLoans,
          change: -2.1,
          changeType: 'negative',
          unit: 'number',
          trend: Array(7).fill(0).map(() => Math.random() * 500),
          icon: CreditCard,
          color: 'text-purple-600'
        },
        {
          id: 'deposits',
          name: t('metrics.totalDeposits'),
          value: totalDeposits,
          change: 15.7,
          changeType: 'positive',
          unit: 'currency',
          trend: Array(7).fill(0).map(() => Math.random() * 200000),
          target: totalDeposits * 1.2,
          icon: Banknote,
          color: 'text-indigo-600'
        },
        {
          id: 'npl',
          name: t('metrics.nplRatio'),
          value: avgNPL,
          change: -0.3,
          changeType: 'positive',
          unit: 'percentage',
          trend: Array(7).fill(0).map(() => Math.random() * 5),
          target: 3.5,
          icon: AlertTriangle,
          color: 'text-orange-600'
        },
        {
          id: 'transactions',
          name: t('metrics.transactions'),
          value: totalTransactions,
          change: 22.4,
          changeType: 'positive',
          unit: 'number',
          trend: Array(7).fill(0).map(() => Math.random() * 10000),
          icon: Activity,
          color: 'text-teal-600'
        }
      ]);

      // Prepare performance data for charts
      const performanceData = processedBranches.map(branch => ({
        name: isRTL ? branch.nameAr : branch.name,
        revenue: branch.metrics.revenue,
        customers: branch.metrics.customers,
        loans: branch.metrics.activeLoans,
        deposits: branch.metrics.deposits,
        npl: branch.metrics.nplRatio,
        efficiency: branch.metrics.efficiency
      }));

      setPerformanceData(performanceData);

      // If comparison mode is enabled, fetch comparison data
      if (comparisonMode !== 'none') {
        await fetchComparisonData();
      }

    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    // Implement comparison data fetching based on selected comparison range
    // This would fetch historical data for comparison
  };

  useEffect(() => {
    fetchComprehensiveData();
  }, [timeRange, customDateRange, selectedBranches, selectedProducts, comparisonMode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComprehensiveData();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting dashboard data...');
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
          style: 'currency',
          currency: 'SAR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(value);
      default:
        return value.toString();
    }
  };

  const renderMetricCard = (metric: Metric) => (
    <Card key={metric.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2",
        isRTL && "flex-row-reverse"
      )}>
        <CardTitle className={cn(
          "text-xs sm:text-sm font-medium",
          isRTL && "text-right"
        )}>{metric.name}</CardTitle>
        <metric.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", metric.color)} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-lg sm:text-xl md:text-2xl font-bold",
          isRTL && "text-right"
        )}>{formatValue(metric.value, metric.unit)}</div>
        
        {showComparison && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            isRTL && "flex-row-reverse justify-end"
          )}>
            {metric.changeType === 'positive' ? (
              <TrendingUp className={cn(
                "h-3 w-3 text-green-500",
                isRTL ? "ml-1" : "mr-1"
              )} />
            ) : metric.changeType === 'negative' ? (
              <TrendingDown className={cn(
                "h-3 w-3 text-red-500",
                isRTL ? "ml-1" : "mr-1"
              )} />
            ) : null}
            <span className={cn(
              "font-medium",
              metric.changeType === 'positive' ? 'text-green-600' : 
              metric.changeType === 'negative' ? 'text-red-600' : 
              'text-gray-600'
            )}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
            <span className={cn(
              "text-muted-foreground",
              isRTL ? "mr-1" : "ml-1"
            )}>{t('common.vsLastPeriod')}</span>
          </div>
        )}
        
        {showTargets && metric.target && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t('common.target')}</span>
              <span className="font-medium">{formatValue(metric.target, metric.unit)}</span>
            </div>
            <Progress value={(metric.value / metric.target) * 100} className="h-2" />
          </div>
        )}
        
        {showTrends && (
          <div className="mt-3 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.trend.map((v, i) => ({ value: v, index: i }))}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metric.color.replace('text-', '#')} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6", isRTL && "rtl")}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className={cn(
            "text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white",
            isRTL && "text-right"
          )}>
            {t('dashboard.executive.title')}
          </h1>
          <p className={cn(
            "text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1",
            isRTL && "text-right"
          )}>
            {t('dashboard.executive.subtitle')}
          </p>
        </div>
        
        <div className={cn(
          "flex flex-wrap gap-2 w-full lg:w-auto",
          isRTL && "flex-row-reverse"
        )}>
          {/* Time Range Selection */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal text-xs sm:text-sm",
                isRTL && "text-right"
              )}>
                <CalendarIcon className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4",
                  isRTL ? "ml-2" : "mr-2"
                )} />
                <span className="truncate">
                  {timeRange === 'custom' 
                    ? `${format(customDateRange.from, 'PP')} - ${format(customDateRange.to, 'PP')}`
                    : t(`dateRanges.${timeRange}`)
                  }
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <Label>{t('common.selectDateRange')}</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(dateRanges).map(range => (
                      <SelectItem key={range} value={range}>
                        {t(`dateRanges.${range}`)}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t('common.customRange')}</SelectItem>
                  </SelectContent>
                </Select>
                
                {timeRange === 'custom' && (
                  <div className="mt-4">
                    <Calendar
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Comparison Mode */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px]">
                <GitBranch className="mr-2 h-4 w-4" />
                {t('common.comparison')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px]">
              <div className="space-y-4">
                <div>
                  <Label>{t('common.comparisonMode')}</Label>
                  <Select value={comparisonMode} onValueChange={(v: any) => setComparisonMode(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.noComparison')}</SelectItem>
                      <SelectItem value="period">{t('common.periodComparison')}</SelectItem>
                      <SelectItem value="custom">{t('common.customComparison')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {comparisonMode === 'period' && (
                  <div>
                    <Label>{t('common.compareTo')}</Label>
                    <Select value={comparisonRange} onValueChange={setComparisonRange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous_period">{t('common.previousPeriod')}</SelectItem>
                        <SelectItem value="previous_month">{t('common.previousMonth')}</SelectItem>
                        <SelectItem value="previous_quarter">{t('common.previousQuarter')}</SelectItem>
                        <SelectItem value="previous_year">{t('common.previousYear')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px]">
              <div className="space-y-4">
                <h4 className="font-medium">{t('common.viewSettings')}</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-targets" 
                      checked={showTargets}
                      onCheckedChange={setShowTargets}
                    />
                    <Label htmlFor="show-targets">{t('common.showTargets')}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-comparison" 
                      checked={showComparison}
                      onCheckedChange={setShowComparison}
                    />
                    <Label htmlFor="show-comparison">{t('common.showComparison')}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-trends" 
                      checked={showTrends}
                      onCheckedChange={setShowTrends}
                    />
                    <Label htmlFor="show-trends">{t('common.showTrends')}</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className={refreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {overallMetrics.map(metric => renderMetricCard(metric))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className={cn(
            "grid w-full min-w-[400px] grid-cols-4",
            isRTL && "flex-row-reverse"
          )}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              {t('dashboard.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="branches" className="text-xs sm:text-sm">
              {t('dashboard.tabs.branches')}
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">
              {t('dashboard.tabs.products')}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">
              {t('dashboard.tabs.analysis')}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t('dashboard.performanceOverview')}</CardTitle>
                  <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">
                        <div className="flex items-center">
                          <LineChartIcon className="mr-2 h-4 w-4" />
                          {t('charts.line')}
                        </div>
                      </SelectItem>
                      <SelectItem value="bar">
                        <div className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {t('charts.bar')}
                        </div>
                      </SelectItem>
                      <SelectItem value="area">
                        <div className="flex items-center">
                          <AreaChart className="mr-2 h-4 w-4" />
                          {t('charts.area')}
                        </div>
                      </SelectItem>
                      <SelectItem value="composed">
                        <div className="flex items-center">
                          <Layers className="mr-2 h-4 w-4" />
                          {t('charts.composed')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                  {chartType === 'composed' ? (
                    <ComposedChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
                      <Bar yAxisId="left" dataKey="deposits" fill="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="npl" stroke="#ff7300" />
                      <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#387908" />
                    </ComposedChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" />
                      <Bar dataKey="deposits" fill="#82ca9d" />
                      <Bar dataKey="loans" fill="#ffc658" />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                      <Line type="monotone" dataKey="deposits" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="npl" stroke="#ff7300" />
                    </LineChart>
                  ) : (
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="deposits" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="loans" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Branch Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.branchPerformanceMatrix')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1"></div>
                  {['Revenue', 'Customers', 'NPL', 'Efficiency', 'Growth'].map(metric => (
                    <div key={metric} className="text-xs font-medium text-center">
                      {metric}
                    </div>
                  ))}
                  
                  {branches.slice(0, 5).map(branch => (
                    <React.Fragment key={branch.id}>
                      <div className="text-xs font-medium truncate pr-2">
                        {isRTL ? branch.nameAr : branch.name}
                      </div>
                      {[
                        branch.metrics.revenue / 1000000,
                        branch.metrics.customers / 1000,
                        branch.metrics.nplRatio,
                        branch.metrics.efficiency,
                        Math.random() * 100
                      ].map((value, idx) => {
                        const intensity = value / 100;
                        const isNPL = idx === 2;
                        const bgColor = isNPL 
                          ? `rgba(239, 68, 68, ${1 - intensity})`
                          : `rgba(34, 197, 94, ${intensity})`;
                        
                        return (
                          <div
                            key={idx}
                            className="h-12 rounded flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: bgColor }}
                          >
                            {value.toFixed(1)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Mix and Regional Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.productMix')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                  <PieChart>
                    <Pie
                      data={products.map(p => ({
                        name: isRTL ? p.nameAr : p.name,
                        value: p.metrics.revenue
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {products.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.regionalDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={
                    Object.entries(branches.reduce((acc, branch) => {
                      acc[branch.region] = (acc[branch.region] || 0) + branch.metrics.revenue;
                      return acc;
                    }, {})).map(([region, revenue]) => ({
                      name: region,
                      value: revenue,
                      fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#ffc658'][Math.floor(Math.random() * 5)]
                    }))
                  }>
                    <RadialBar dataKey="value" />
                    <Legend />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.performanceRadar')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Revenue', value: 85 },
                    { metric: 'Growth', value: 72 },
                    { metric: 'Efficiency', value: 68 },
                    { metric: 'Quality', value: 90 },
                    { metric: 'Innovation', value: 65 },
                    { metric: 'Customer Satisfaction', value: 88 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('dashboard.branchComparison')}</CardTitle>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        {t('common.selectBranches')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px]">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox 
                              id="all-branches"
                              checked={selectedBranches.includes('all')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBranches(['all']);
                                } else {
                                  setSelectedBranches([]);
                                }
                              }}
                            />
                            <Label htmlFor="all-branches" className="font-medium">
                              {t('common.allBranches')}
                            </Label>
                          </div>
                          {branches.map(branch => (
                            <div key={branch.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={branch.id}
                                checked={selectedBranches.includes('all') || selectedBranches.includes(branch.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBranches(prev => 
                                      prev.filter(b => b !== 'all').concat(branch.id)
                                    );
                                  } else {
                                    setSelectedBranches(prev => 
                                      prev.filter(b => b !== branch.id && b !== 'all')
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={branch.id}>
                                {isRTL ? branch.nameAr : branch.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  <Select value={branchComparisonMode} onValueChange={(v: any) => setBranchComparisonMode(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">{t('common.individual')}</SelectItem>
                      <SelectItem value="aggregate">{t('common.aggregate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Branch Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{t('common.branch')}</th>
                        <th className="text-right p-2">{t('metrics.revenue')}</th>
                        <th className="text-right p-2">{t('metrics.customers')}</th>
                        <th className="text-right p-2">{t('metrics.activeLoans')}</th>
                        <th className="text-right p-2">{t('metrics.deposits')}</th>
                        <th className="text-right p-2">{t('metrics.nplRatio')}</th>
                        <th className="text-right p-2">{t('metrics.efficiency')}</th>
                        <th className="text-center p-2">{t('common.trend')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches
                        .filter(branch => 
                          selectedBranches.includes('all') || selectedBranches.includes(branch.id)
                        )
                        .map(branch => (
                          <tr key={branch.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium">
                              {isRTL ? branch.nameAr : branch.name}
                            </td>
                            <td className="text-right p-2">
                              {formatValue(branch.metrics.revenue, 'currency')}
                            </td>
                            <td className="text-right p-2">
                              {formatValue(branch.metrics.customers, 'number')}
                            </td>
                            <td className="text-right p-2">
                              {formatValue(branch.metrics.activeLoans, 'number')}
                            </td>
                            <td className="text-right p-2">
                              {formatValue(branch.metrics.deposits, 'currency')}
                            </td>
                            <td className="text-right p-2">
                              <Badge variant={branch.metrics.nplRatio > 5 ? 'destructive' : 'default'}>
                                {formatValue(branch.metrics.nplRatio, 'percentage')}
                              </Badge>
                            </td>
                            <td className="text-right p-2">
                              <div className="flex items-center justify-end">
                                <Progress value={branch.metrics.efficiency} className="w-20 h-2 mr-2" />
                                <span className="text-sm">{branch.metrics.efficiency.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="h-8 w-20 mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={branch.performance.daily.slice(-7).map((v, i) => ({ value: v }))}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="#8884d8" 
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Branch Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.branchRevenueComparison')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={branches.filter(b => 
                          selectedBranches.includes('all') || selectedBranches.includes(b.id)
                        ).map(b => ({
                          name: isRTL ? b.nameAr : b.name,
                          current: b.metrics.revenue,
                          target: b.metrics.revenue * 1.1
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="current" fill="#8884d8" name={t('common.current')} />
                          <Bar dataKey="target" fill="#82ca9d" name={t('common.target')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.branchEfficiencyMatrix')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                          <CartesianGrid />
                          <XAxis dataKey="efficiency" name={t('metrics.efficiency')} unit="%" />
                          <YAxis dataKey="revenue" name={t('metrics.revenue')} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter 
                            name={t('common.branches')} 
                            data={branches.filter(b => 
                              selectedBranches.includes('all') || selectedBranches.includes(b.id)
                            ).map(b => ({
                              name: isRTL ? b.nameAr : b.name,
                              efficiency: b.metrics.efficiency,
                              revenue: b.metrics.revenue / 1000000,
                              size: b.metrics.customers
                            }))} 
                            fill="#8884d8"
                          >
                            {branches.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('dashboard.productAnalysis')}</CardTitle>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Package className="mr-2 h-4 w-4" />
                        {t('common.selectProducts')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px]">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox 
                              id="all-products"
                              checked={selectedProducts.includes('all')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(['all']);
                                } else {
                                  setSelectedProducts([]);
                                }
                              }}
                            />
                            <Label htmlFor="all-products" className="font-medium">
                              {t('common.allProducts')}
                            </Label>
                          </div>
                          {products.map(product => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={product.id}
                                checked={selectedProducts.includes('all') || selectedProducts.includes(product.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProducts(prev => 
                                      prev.filter(p => p !== 'all').concat(product.id)
                                    );
                                  } else {
                                    setSelectedProducts(prev => 
                                      prev.filter(p => p !== product.id && p !== 'all')
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={product.id}>
                                {isRTL ? product.nameAr : product.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  <Select value={productComparisonMode} onValueChange={(v: any) => setProductComparisonMode(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">{t('common.individual')}</SelectItem>
                      <SelectItem value="aggregate">{t('common.aggregate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product Performance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products
                    .filter(product => 
                      selectedProducts.includes('all') || selectedProducts.includes(product.id)
                    )
                    .map(product => (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {isRTL ? product.nameAr : product.name}
                              </CardTitle>
                              <CardDescription>{product.category}</CardDescription>
                            </div>
                            <Badge variant="outline">{product.metrics.activeAccounts} {t('common.active')}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t('metrics.revenue')}</span>
                              <span className="font-medium">{formatValue(product.metrics.revenue, 'currency')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t('metrics.avgBalance')}</span>
                              <span className="font-medium">{formatValue(product.metrics.avgBalance, 'currency')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t('metrics.growth')}</span>
                              <div className="flex items-center">
                                {product.metrics.growth > 0 ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={cn(
                                  "font-medium",
                                  product.metrics.growth > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {product.metrics.growth.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <Separator />
                            <div className="pt-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-muted-foreground">{t('metrics.marketShare')}</span>
                                <span className="text-xs font-medium">{product.metrics.marketShare.toFixed(1)}%</span>
                              </div>
                              <Progress value={product.metrics.marketShare} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Product Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.productDemographics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="age" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="age">{t('demographics.age')}</TabsTrigger>
                          <TabsTrigger value="gender">{t('demographics.gender')}</TabsTrigger>
                          <TabsTrigger value="income">{t('demographics.income')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="age">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={products[0]?.demographics.ageGroups || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="group" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="gender">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: t('demographics.male'), value: products[0]?.demographics.genderSplit.male || 0 },
                                  { name: t('demographics.female'), value: products[0]?.demographics.genderSplit.female || 0 }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#0088FE" />
                                <Cell fill="#FF8042" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="income">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={products[0]?.demographics.incomeSegments || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="segment" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="percentage" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.productRiskProfile')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={products
                          .filter(p => selectedProducts.includes('all') || selectedProducts.includes(p.id))
                          .slice(0, 5)
                          .map(p => ({
                            product: isRTL ? p.nameAr : p.name,
                            risk: p.metrics.riskScore,
                            profitability: p.metrics.profitability,
                            satisfaction: p.metrics.customerSatisfaction,
                            growth: p.metrics.growth + 50,
                            efficiency: Math.random() * 100
                          }))
                        }>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="product" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name={t('metrics.risk')} dataKey="risk" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                          <Radar name={t('metrics.profitability')} dataKey="profitability" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                          <Radar name={t('metrics.satisfaction')} dataKey="satisfaction" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correlation Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.correlationAnalysis')}</CardTitle>
                <CardDescription>{t('dashboard.correlationDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    <div></div>
                    {['Revenue', 'NPL', 'Efficiency', 'Growth'].map(metric => (
                      <div key={metric} className="text-center font-medium">{metric}</div>
                    ))}
                    {['Revenue', 'NPL', 'Efficiency', 'Growth'].map((row, rowIdx) => (
                      <React.Fragment key={row}>
                        <div className="text-right font-medium pr-2">{row}</div>
                        {['Revenue', 'NPL', 'Efficiency', 'Growth'].map((col, colIdx) => {
                          const correlation = rowIdx === colIdx ? 1 : Math.random() * 2 - 1;
                          const intensity = Math.abs(correlation);
                          const color = correlation > 0 
                            ? `rgba(34, 197, 94, ${intensity})`
                            : `rgba(239, 68, 68, ${intensity})`;
                          
                          return (
                            <div
                              key={col}
                              className="h-12 rounded flex items-center justify-center text-xs font-medium"
                              style={{ backgroundColor: color }}
                            >
                              {correlation.toFixed(2)}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.predictiveAnalytics')}</CardTitle>
                <CardDescription>{t('dashboard.predictiveDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{t('predictions.revenueGrowth')}</span>
                      <Badge variant="default">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +15.2%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('predictions.revenueGrowthDescription')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{t('predictions.riskAlert')}</span>
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('common.high')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('predictions.riskAlertDescription')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{t('predictions.customerChurn')}</span>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        -3.8%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('predictions.customerChurnDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.comprehensiveTrendAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={Array(12).fill(0).map((_, i) => ({
                  month: format(subMonths(new Date(), 11 - i), 'MMM yyyy'),
                  revenue: Math.random() * 10000000 + 5000000,
                  customers: Math.random() * 5000 + 20000,
                  npl: Math.random() * 2 + 3,
                  efficiency: Math.random() * 20 + 70
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name={t('metrics.revenue')} />
                  <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#82ca9d" name={t('metrics.customers')} />
                  <Line yAxisId="right" type="monotone" dataKey="npl" stroke="#ff7300" name={t('metrics.nplRatio')} />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#387908" name={t('metrics.efficiency')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboardComprehensive;