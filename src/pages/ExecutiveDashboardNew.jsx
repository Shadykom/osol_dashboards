import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { DashboardService } from '@/services/dashboardService';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiSelect } from '@/components/ui/multi-select';
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
  Filter,
  FileText,
  ChevronDown,
  Building2,
  Package,
  Target,
  Shield,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Percent,
  Banknote
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

import { jsPDF } from 'jspdf';
import reportGenerator from '@/utils/reportGenerator';

// Color palette
const COLORS = {
  primary: ['#6366f1', '#818cf8', '#a5b4fc'],
  success: ['#10b981', '#34d399', '#6ee7b7'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d'],
  danger: ['#ef4444', '#f87171', '#fca5a5'],
  info: ['#3b82f6', '#60a5fa', '#93bbfd']
};

// Available metrics configuration
const AVAILABLE_METRICS = {
  revenue: { 
    label: 'Revenue', 
    icon: DollarSign, 
    color: 'success',
    format: 'currency',
    defaultSelected: true
  },
  customers: { 
    label: 'Total Customers', 
    icon: Users, 
    color: 'primary',
    format: 'number',
    defaultSelected: false
  },
  loans: { 
    label: 'Active Loans', 
    icon: CreditCard, 
    color: 'info',
    format: 'number',
    defaultSelected: true
  },
  deposits: { 
    label: 'Total Deposits', 
    icon: PiggyBank, 
    color: 'success',
    format: 'currency',
    defaultSelected: true
  },
  npl: { 
    label: 'NPL Ratio', 
    icon: AlertTriangle, 
    color: 'danger',
    format: 'percentage',
    defaultSelected: false
  },
  transactions: {
    label: 'Transactions',
    icon: Banknote,
    color: 'info',
    format: 'number',
    defaultSelected: false
  },
  branches: { 
    label: 'Active Branches', 
    icon: Building2, 
    color: 'primary',
    format: 'number',
    defaultSelected: false
  },
  products: { 
    label: 'Products', 
    icon: Package, 
    color: 'info',
    format: 'number',
    defaultSelected: false
  },
  targets: { 
    label: 'Target Achievement', 
    icon: Target, 
    color: 'warning',
    format: 'percentage',
    defaultSelected: false
  }
};

// Comparison period options
const COMPARISON_PERIODS = [
  { value: 'day_over_day', label: 'Day over Day' },
  { value: 'month_over_month', label: 'Month over Month' },
  { value: 'quarter_over_quarter', label: 'Quarter over Quarter' },
  { value: 'year_over_year', label: 'Year over Year' },
  { value: 'previous_period', label: 'Previous Period (auto)' },
  { value: 'custom', label: 'Custom (pick exact)' }
];

// Quick filter presets
const QUICK_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' }
];

export function ExecutiveDashboardNew() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [comparisonPeriod, setComparisonPeriod] = useState('month_over_month');
  const [comparisonDateRange, setComparisonDateRange] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(
    Object.entries(AVAILABLE_METRICS)
      .filter(([_, config]) => config.defaultSelected)
      .map(([key, _]) => key)
  );
  const [quickFilter, setQuickFilter] = useState('this_month');
  
  // Additional filter states
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showTransactions, setShowTransactions] = useState(true);

  // Explicit month/quarter/year selectors for custom comparisons
  const [comparisonSelectors, setComparisonSelectors] = useState({
    // Examples: { type: 'month', primary: { y: 2025, m: 1 }, secondary: { y: 2024, m: 12 } }
    type: null,
    primary: null,
    secondary: null
  });

  // Calculate comparison date range based on selected period
  const calculateComparisonRange = useCallback((mainRange, period) => {
    const daysDiff = Math.ceil((mainRange.to - mainRange.from) / (1000 * 60 * 60 * 24));
    
    switch (period) {
      case 'day_over_day': {
        return { from: subDays(mainRange.from, 1), to: subDays(mainRange.to, 1) };
      }
      case 'month_over_month': {
        return { from: subMonths(mainRange.from, 1), to: subMonths(mainRange.to, 1) };
      }
      case 'quarter_over_quarter': {
        return { from: subMonths(mainRange.from, 3), to: subMonths(mainRange.to, 3) };
      }
      case 'year_over_year': {
        return { from: subMonths(mainRange.from, 12), to: subMonths(mainRange.to, 12) };
      }
      case 'previous_period':
        return {
          from: subDays(mainRange.from, daysDiff + 1),
          to: subDays(mainRange.from, 1)
        };
      default:
        return null;
    }
  }, []);

  // Handle quick filter selection
  const handleQuickFilter = useCallback((filter) => {
    const now = new Date();
    let from, to;
    
    switch (filter) {
      case 'today':
        from = to = now;
        break;
      case 'yesterday':
        from = to = subDays(now, 1);
        break;
      case 'last_7_days':
        from = subDays(now, 6);
        to = now;
        break;
      case 'last_30_days':
        from = subDays(now, 29);
        to = now;
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = now;
        break;
      case 'last_month':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), quarter * 3, 1);
        to = now;
        break;
      case 'this_year':
        from = startOfYear(now);
        to = now;
        break;
      default:
        return;
    }
    
    setQuickFilter(filter);
    setDateRange({ from, to });
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters = {
        dateRange,
        comparisonDateRange: comparisonPeriod !== 'custom' 
          ? calculateComparisonRange(dateRange, comparisonPeriod)
          : comparisonDateRange,
        branches: selectedBranches.length > 0 ? selectedBranches : undefined,
        products: selectedProducts.length > 0 ? selectedProducts : undefined,
        metrics: selectedMetrics
      };
      
      const response = await DashboardService.getExecutiveDashboard(filters);
      
      if (response.success) {
        setDashboardData(response.data);
        
        // Extract available branches and products from response
        if (response.data.branches) {
          setAvailableBranches(response.data.branches.map(b => ({
            value: b.id,
            label: b.name
          })));
        }
        if (response.data.products) {
          setAvailableProducts(response.data.products.map(p => ({
            value: p.id,
            label: p.name
          })));
        }
      } else {
        toast.error(t('executiveDashboard.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(t('executiveDashboard.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, comparisonDateRange, comparisonPeriod, selectedBranches, selectedProducts, selectedMetrics, calculateComparisonRange, t]);

  // Auto-refresh
  const { refresh, isRefreshing, lastRefreshed } = useDataRefresh(
    fetchDashboardData,
    [dateRange, comparisonDateRange, comparisonPeriod, selectedBranches, selectedProducts, selectedMetrics],
    { refreshOnMount: true, refreshInterval: 60000, showNotification: false }
  );





  // Generate report
  const generateReport = useCallback(async () => {
    try {
      toast.loading(t('executiveDashboard.generatingReport'));
      
      // Create PDF
      const pdf = new jsPDF();
      
      // Add header
      pdf.setFontSize(20);
      pdf.text('Executive Dashboard Report', 14, 22);
      
      // Add date range
      pdf.setFontSize(12);
      pdf.text(`Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`, 14, 35);
      
      if (comparisonDateRange) {
        pdf.text(`Comparison: ${format(comparisonDateRange.from, 'MMM dd, yyyy')} - ${format(comparisonDateRange.to, 'MMM dd, yyyy')}`, 14, 42);
      }
      
      // Add metrics table
      const metricsData = selectedMetrics.map(metric => {
        const config = AVAILABLE_METRICS[metric];
        const current = dashboardData?.[metric]?.current || 0;
        const previous = dashboardData?.[metric]?.previous || 0;
        const change = previous ? ((current - previous) / previous * 100).toFixed(2) : 0;
        
        return [
          config.label,
          formatValue(current, config.format),
          formatValue(previous, config.format),
          `${change}%`
        ];
      });
      
      pdf.autoTable({
        head: [['Metric', 'Current', 'Previous', 'Change']],
        body: metricsData,
        startY: 55,
      });
      
      // Save PDF
      pdf.save(`executive-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.dismiss();
      toast.success(t('executiveDashboard.reportGenerated'));
    } catch (error) {
      console.error('Error generating report:', error);
      toast.dismiss();
      toast.error(t('executiveDashboard.reportGenerationError'));
    }
  }, [dateRange, comparisonDateRange, selectedMetrics, dashboardData, t]);

  // Export data
  const exportData = useCallback(async (format = 'xlsx') => {
    try {
      toast.loading(t('executiveDashboard.exportingData'));

      const summary = selectedMetrics.map(metric => {
        const config = AVAILABLE_METRICS[metric];
        return {
          Metric: config.label,
          Current: dashboardData?.[metric]?.current || 0,
          Previous: dashboardData?.[metric]?.previous || 0,
          Change: dashboardData?.[metric]?.change || '0%'
        };
      });

      const dataForExport = {
        summary,
        details: dashboardData?.details || null,
        dateRange: {
          From: format(dateRange.from, 'yyyy-MM-dd'),
          To: format(dateRange.to, 'yyyy-MM-dd')
        }
      };

      if (format === 'xlsx') {
        const wb = await reportGenerator.generateExcel(dataForExport, 'executiveDashboard', 'Executive Dashboard', {});
        reportGenerator.saveExcel(wb, 'executive-dashboard');
      } else if (format === 'csv') {
        const wb = await reportGenerator.generateExcel(dataForExport, 'executiveDashboard', 'Executive Dashboard', {});
        const blob = await reportGenerator.getExcelBlob(wb);
        if (!blob) {
          toast.error('CSV export unavailable. Please use Excel export.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `executive-dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.dismiss();
      toast.success(t('executiveDashboard.dataExported'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.dismiss();
      toast.error(t('executiveDashboard.exportError'));
    }
  }, [dateRange, selectedMetrics, dashboardData, t]);

  // Navigate to detail page with current filters
  const handleCardClick = useCallback((metricKey) => {
    // Map metric keys to detail page kpiType
    const metricToKpiType = {
      revenue: 'revenue',
      loans: 'activeLoans',
      deposits: 'totalDeposits',
      npl: 'nplRatio',
      customers: 'customers',
      transactions: 'transactions'
    };

    const kpiType = metricToKpiType[metricKey];
    if (!kpiType) return;

    // Use single-branch if exactly one selected, otherwise 'all'
    const branch = selectedBranches?.length === 1 ? selectedBranches[0] : 'all';

    const filters = {
      dateRange,
      comparisonDateRange,
      branch,
      comparison: { type: comparisonPeriod, period: 'custom' },
      // Pass-through extras for future use
      products: selectedProducts,
      branches: selectedBranches
    };

    navigate(`/executive-dashboard/detail/${kpiType}`, { state: { filters } });
  }, [navigate, dateRange, comparisonPeriod, comparisonDateRange, selectedBranches, selectedProducts]);

  // Format value based on type
  const formatValue = (value, format) => {
    if (!value && value !== 0) return '-';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(i18n.language, {
          style: 'currency',
          currency: 'SAR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString(i18n.language);
      default:
        return value;
    }
  };

  // Metric card component
  const MetricCard = ({ metricKey, data }) => {
    const config = AVAILABLE_METRICS[metricKey];
    const Icon = config.icon;
    // Normalize service response fields per metric
    let current = 0;
    let previous = 0;
    if (metricKey === 'revenue') {
      current = data?.current || 0;
      previous = data?.previous || 0;
    } else if (metricKey === 'loans') {
      current = data?.active || 0;
      previous = data?.previousActive || 0;
    } else if (metricKey === 'deposits') {
      current = data?.total || 0;
      previous = data?.previousTotal || 0;
    } else if (metricKey === 'npl') {
      current = data?.ratio || 0;
      previous = data?.previousRatio || 0;
    } else if (metricKey === 'transactions') {
      current = dashboardData?.transactionsKpi?.total || 0;
      previous = dashboardData?.transactionsKpi?.previousTotal || 0;
    } else {
      current = data?.current || 0;
      previous = data?.previous || 0;
    }
    const change = previous ? ((current - previous) / previous * 100) : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -4 }}
      >
        <Card onClick={() => handleCardClick(metricKey)} className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
          "bg-gradient-to-br from-background to-muted/20"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
            <div className={cn(
              "p-2 rounded-lg",
              `bg-${config.color}-500/10`
            )}>
              <Icon className={cn("h-4 w-4", `text-${config.color}-600`)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(current, config.format)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {comparisonPeriod !== 'custom' ? t(`executiveDashboard.${comparisonPeriod}`) : 'Previous'}
                : {formatValue(previous, config.format)}
              </p>
              {change !== 0 && (
                <div className="flex items-center">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium ml-1",
                    trend === 'up' ? 'text-green-500' : 'text-red-500'
                  )}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Quick Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('executiveDashboard.title')}</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={refresh}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map(filter => (
            <Button
              key={filter.value}
              variant={quickFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        
        {/* Main Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            
            {/* Comparison */}
            <div className="space-y-2">
              <Label>Comparison</Label>
              <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison" />
                </SelectTrigger>
                <SelectContent>
                  {COMPARISON_PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom comparison range (visible when custom selected) */}
            <div className="space-y-2">
              <Label>Custom Compare Range</Label>
              <DatePickerWithRange
                date={comparisonDateRange}
                onDateChange={setComparisonDateRange}
                disabled={comparisonPeriod !== 'custom'}
              />
            </div>
            
            {/* Branch selection */}
            <div className="space-y-2">
              <Label>Branches</Label>
              <MultiSelect
                options={availableBranches}
                value={selectedBranches}
                onChange={setSelectedBranches}
                placeholder="Select branches"
              />
            </div>
            
            {/* Product selection */}
            <div className="space-y-2">
              <Label>Products</Label>
              <MultiSelect
                options={availableProducts}
                value={selectedProducts}
                onChange={setSelectedProducts}
                placeholder="Select products"
              />
            </div>
          </div>
        </Card>

        {/* Metric selector */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Label className="text-sm">Metrics</Label>
            {Object.entries(AVAILABLE_METRICS).map(([key, cfg]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`metric-${key}`}
                  checked={selectedMetrics.includes(key)}
                  onCheckedChange={(checked) => {
                    setSelectedMetrics(prev => checked
                      ? [...prev, key]
                      : prev.filter(m => m !== key));
                  }}
                />
                <Label htmlFor={`metric-${key}`}>{cfg.label}</Label>
              </div>
            ))}
          </div>
        </Card>

      </div>
 
      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedMetrics.map(metric => (
            <Card key={metric} className="animate-pulse">
              <CardHeader className="space-y-2"></CardHeader>
              <CardContent></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedMetrics.map(metric => (
            <MetricCard
              key={metric}
              metricKey={metric}
              data={dashboardData?.[metric]}
            />
          ))}
        </div>
      )}
 
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="current" stroke={COLORS.success[0]} name="Current" />
                <Line type="monotone" dataKey="previous" stroke={COLORS.primary[0]} name="Previous" />
                <Line type="monotone" dataKey="target" stroke={COLORS.warning[0]} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
 
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>Distribution across products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dashboardData?.portfolio || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {(dashboardData?.portfolio || []).map((_, idx) => (
                    <Cell key={idx} fill={COLORS.chart?.[idx % (COLORS.chart?.length || 6)] || COLORS.primary[0]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row-level data: Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest activity within selected filters</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportData('xlsx')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dashboardData?.recentTransactions || []).slice(0, 25).map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/40">
                    <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                    <TableCell>{tx.customer_name || '-'}</TableCell>
                    <TableCell>{tx.account_number || '-'}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell className="text-right">{tx.formatted_amount || tx.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'COMPLETED' ? 'secondary' : tx.status === 'FAILED' ? 'destructive' : 'outline'}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutiveDashboardNew;