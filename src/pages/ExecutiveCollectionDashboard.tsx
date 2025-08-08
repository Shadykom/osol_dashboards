import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle,
  Phone, Clock, CheckCircle, XCircle, Activity, Award, Building2,
  FileText, Zap, Shield, Eye, Download, RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '@/contexts/FilterContext';

const ExecutiveCollectionDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { filters, updateFilter } = useFilters();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date())
  });

  // State for dashboard data - US-001: Key Portfolio Metrics
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalPortfolioValue: 0,
    totalOverdueAmount: 0,
    nplRatio: 0,
    collectionRate: 0,
    monthlyTarget: 0,
    monthlyAchievement: 0
  });

  // State for aging distribution - US-002: Overdue Loans by Aging Categories
  const [agingDistribution, setAgingDistribution] = useState([
    { category: '30-60', amount: 0, percentage: 0, count: 0 },
    { category: '60-90', amount: 0, percentage: 0, count: 0 },
    { category: '90-180', amount: 0, percentage: 0, count: 0 },
    { category: '180-360', amount: 0, percentage: 0, count: 0 },
    { category: '>360', amount: 0, percentage: 0, count: 0 }
  ]);

  // State for remediation summary - US-003: Remediation Efforts Summary
  const [remediationSummary, setRemediationSummary] = useState({
    restructuredLoans: { count: 0, amount: 0 },
    settlements: { count: 0, amount: 0 },
    legalReferrals: { count: 0, amount: 0 },
    writeOffs: { count: 0, amount: 0 }
  });

  // State for NPL trend - US-004: NPL Ratio Evolution
  const [nplTrend, setNplTrend] = useState([]);

  // State for performance comparison - US-005: Performance Comparison
  const [performanceComparison, setPerformanceComparison] = useState({
    currentMonth: {},
    previousMonth: {},
    targets: {}
  });

  // Fetch portfolio metrics
  const fetchPortfolioMetrics = async () => {
    try {
      // Fetch current portfolio metrics
      let casesQuery = supabase
        .from('collection_cases')
        .select('total_outstanding, days_past_due, case_status, branch_id')
        .in('case_status', ['ACTIVE', 'LEGAL']);

      if (selectedBranch && selectedBranch !== 'all') {
        casesQuery = casesQuery.eq('branch_id', selectedBranch);
      }

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) {
        console.error('Error fetching cases:', casesError);
        // Continue with empty data if RLS is blocking
        if (casesError.code === '42501') {
          console.warn('Permission denied - check RLS policies');
        }
      }

      // Calculate metrics
      const totalPortfolio = cases.reduce((sum, c) => sum + (c.total_outstanding || 0), 0);
      const overdueAmount = cases.filter(c => c.days_past_due > 0)
        .reduce((sum, c) => sum + (c.total_outstanding || 0), 0);
      const nplAmount = cases.filter(c => c.days_past_due > 90)
        .reduce((sum, c) => sum + (c.total_outstanding || 0), 0);

      // Fetch collection targets
      const currentMonth = format(new Date(), 'yyyy-MM-01');
      const { data: targets } = await supabase
        .from('collection_targets')
        .select('target_amount, target_npl_ratio, target_collection_rate')
        .eq('target_type', 'COMPANY')
        .eq('target_month', currentMonth)
        .single();

      // Fetch collections for current month
      const { data: collections } = await supabase
        .from('daily_collection_summary')
        .select('collection_amount')
        .gte('summary_date', currentMonth)
        .lte('summary_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));

      const monthlyCollection = collections?.reduce((sum, c) => sum + (c.collection_amount || 0), 0) || 0;

      setPortfolioMetrics({
        totalPortfolioValue: totalPortfolio,
        totalOverdueAmount: overdueAmount,
        nplRatio: totalPortfolio > 0 ? (nplAmount / totalPortfolio) * 100 : 0,
        collectionRate: overdueAmount > 0 ? (monthlyCollection / overdueAmount) * 100 : 0,
        monthlyTarget: targets?.target_amount || 0,
        monthlyAchievement: monthlyCollection
      });
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
    }
  };

  // Fetch aging distribution
  const fetchAgingDistribution = async () => {
    try {
      let query = supabase
        .from('collection_cases')
        .select('days_past_due, total_outstanding, branch_id')
        .in('case_status', ['ACTIVE', 'LEGAL']);

      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data: cases, error } = await query;

      if (error) throw error;

      // Categorize by aging buckets
      const buckets = {
        '30-60': { amount: 0, count: 0 },
        '60-90': { amount: 0, count: 0 },
        '90-180': { amount: 0, count: 0 },
        '180-360': { amount: 0, count: 0 },
        '>360': { amount: 0, count: 0 }
      };

      cases.forEach(c => {
        const dpd = c.days_past_due || 0;
        const amount = c.total_outstanding || 0;

        if (dpd >= 30 && dpd < 60) {
          buckets['30-60'].amount += amount;
          buckets['30-60'].count += 1;
        } else if (dpd >= 60 && dpd < 90) {
          buckets['60-90'].amount += amount;
          buckets['60-90'].count += 1;
        } else if (dpd >= 90 && dpd < 180) {
          buckets['90-180'].amount += amount;
          buckets['90-180'].count += 1;
        } else if (dpd >= 180 && dpd < 360) {
          buckets['180-360'].amount += amount;
          buckets['180-360'].count += 1;
        } else if (dpd >= 360) {
          buckets['>360'].amount += amount;
          buckets['>360'].count += 1;
        }
      });

      const totalOverdue = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);

      setAgingDistribution(
        Object.entries(buckets).map(([category, data]) => ({
          category,
          amount: data.amount,
          percentage: totalOverdue > 0 ? (data.amount / totalOverdue) * 100 : 0,
          count: data.count
        }))
      );
    } catch (error) {
      console.error('Error fetching aging distribution:', error);
    }
  };

  // Fetch remediation summary
  const fetchRemediationSummary = async () => {
    try {
      const { data: actions, error } = await supabase
        .from('remediation_actions')
        .select('action_type, approved_amount, action_status')
        .eq('action_status', 'APPROVED')
        .gte('action_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('action_date', format(dateRange.end, 'yyyy-MM-dd'));

      if (error) throw error;

      const summary = {
        restructuredLoans: { count: 0, amount: 0 },
        settlements: { count: 0, amount: 0 },
        legalReferrals: { count: 0, amount: 0 },
        writeOffs: { count: 0, amount: 0 }
      };

      actions.forEach(action => {
        switch (action.action_type) {
          case 'RESTRUCTURE':
            summary.restructuredLoans.count += 1;
            summary.restructuredLoans.amount += action.approved_amount || 0;
            break;
          case 'SETTLEMENT':
            summary.settlements.count += 1;
            summary.settlements.amount += action.approved_amount || 0;
            break;
          case 'LEGAL_REFERRAL':
            summary.legalReferrals.count += 1;
            summary.legalReferrals.amount += action.approved_amount || 0;
            break;
          case 'WRITE_OFF':
            summary.writeOffs.count += 1;
            summary.writeOffs.amount += action.approved_amount || 0;
            break;
        }
      });

      setRemediationSummary(summary);
    } catch (error) {
      console.error('Error fetching remediation summary:', error);
    }
  };

  // Fetch NPL trend
  const fetchNPLTrend = async () => {
    try {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push(format(date, 'yyyy-MM-01'));
      }

      const { data: metrics, error } = await supabase
        .from('portfolio_metrics')
        .select('metric_date, npl_ratio, collection_rate')
        .in('metric_date', months)
        .order('metric_date', { ascending: true });

      if (error) throw error;

      setNplTrend(metrics.map(m => ({
        month: format(new Date(m.metric_date), 'MMM yyyy'),
        nplRatio: m.npl_ratio || 0,
        collectionRate: m.collection_rate || 0
      })));
    } catch (error) {
      console.error('Error fetching NPL trend:', error);
    }
  };

  // Fetch performance comparison
  const fetchPerformanceComparison = async () => {
    try {
      const currentMonth = format(new Date(), 'yyyy-MM-01');
      const previousMonth = format(subMonths(new Date(), 1), 'yyyy-MM-01');

      // Fetch current and previous month metrics
      const { data: metrics } = await supabase
        .from('portfolio_metrics')
        .select('*')
        .in('metric_date', [currentMonth, previousMonth]);

      // Fetch targets
      const { data: targets } = await supabase
        .from('collection_targets')
        .select('*')
        .eq('target_type', 'COMPANY')
        .eq('target_month', currentMonth)
        .single();

      const current = metrics?.find(m => m.metric_date === currentMonth) || {};
      const previous = metrics?.find(m => m.metric_date === previousMonth) || {};

      setPerformanceComparison({
        currentMonth: current,
        previousMonth: previous,
        targets: targets || {}
      });
    } catch (error) {
      console.error('Error fetching performance comparison:', error);
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPortfolioMetrics(),
        fetchAgingDistribution(),
        fetchRemediationSummary(),
        fetchNPLTrend(),
        fetchPerformanceComparison()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, selectedBranch]);

  // Map local period selector to global dateRange
  useEffect(() => {
    const periodToDateRange = {
      daily: 'today',
      weekly: 'last_7_days',
      monthly: 'last_30_days',
      quarterly: 'last_quarter'
    };
    const mapped = periodToDateRange[selectedPeriod] || 'last_30_days';
    updateFilter('dateRange', mapped);
  }, [selectedPeriod]);

  // Sync local branch with global filters
  useEffect(() => {
    if (selectedBranch !== filters.branch) {
      updateFilter('branch', selectedBranch);
    }
  }, [selectedBranch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleDrill = (section: string, widgetId: string) => {
    const query = new URLSearchParams();
    if (filters.dateRange && filters.dateRange !== 'all') query.set('dateRange', filters.dateRange);
    if (filters.branch && filters.branch !== 'all') query.set('branch', filters.branch);
    if (filters.productType && filters.productType !== 'all') query.set('productType', filters.productType);
    if (filters.customerSegment && filters.customerSegment !== 'all') query.set('customerSegment', filters.customerSegment);
    navigate(`/dashboard/detail-new/${section}/${widgetId}?${query.toString()}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'CRITICAL': 'bg-red-500',
      'HIGH': 'bg-orange-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500'
    };
    return <Badge className={`${colors[priority]} text-white`}>{t(`executiveCollection.priority.${priority.toLowerCase()}`)}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'GOOD':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('collection.executiveDashboard.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('collection.executiveDashboard.subtitle')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('common.daily')}</SelectItem>
              <SelectItem value="weekly">{t('common.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
              <SelectItem value="quarterly">{t('common.quarterly')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('dashboard.filters.branch')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.filters.allBranches')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.productType} onValueChange={(v) => updateFilter('productType', v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('dashboard.filters.productType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.filters.allProducts')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.customerSegment} onValueChange={(v) => updateFilter('customerSegment', v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('dashboard.filters.customerSegment')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.filters.allSegments')}</SelectItem>
              <SelectItem value="RETAIL">RETAIL</SelectItem>
              <SelectItem value="PREMIUM">PREMIUM</SelectItem>
              <SelectItem value="HNI">HNI</SelectItem>
              <SelectItem value="CORPORATE">CORPORATE</SelectItem>
              <SelectItem value="SME">SME</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className={refreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* US-001: Key Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card onClick={() => handleDrill('overview', 'total_assets')} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.metrics.totalPortfolioValue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground">
              {t('collection.metrics.totalAccounts', { count: 45320 })}
            </p>
          </CardContent>
        </Card>

        <Card onClick={() => handleDrill('collections', 'active_cases')} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.metrics.totalOverdueAmount')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.totalOverdueAmount)}</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatPercentage(12.5)} {t('common.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => handleDrill('lending', 'npl_ratio')} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.metrics.nplRatio')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(portfolioMetrics.nplRatio)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              {formatPercentage(0.3)} {t('common.improvement')}
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => handleDrill('collections', 'collection_rate')} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.metrics.collectionRate')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(portfolioMetrics.collectionRate)}</div>
            <Progress 
              value={portfolioMetrics.collectionRate} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* US-002: Aging Distribution & US-003: Remediation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('collection.agingDistribution.title')}</CardTitle>
            <CardDescription>{t('collection.agingDistribution.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#8884d8">
                  {agingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {agingDistribution.map((bucket, index) => (
                <div key={bucket.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{bucket.category} {t('common.days')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{formatCurrency(bucket.amount)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatPercentage(bucket.percentage)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Remediation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('collection.remediation.title')}</CardTitle>
            <CardDescription>{t('collection.remediation.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium">{t('collection.remediation.restructured')}</p>
                    <p className="text-sm text-muted-foreground">
                      {remediationSummary.restructuredLoans.count} {t('common.cases')}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatCurrency(remediationSummary.restructuredLoans.amount)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">{t('collection.remediation.settlements')}</p>
                    <p className="text-sm text-muted-foreground">
                      {remediationSummary.settlements.count} {t('common.cases')}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatCurrency(remediationSummary.settlements.amount)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium">{t('collection.remediation.legalReferrals')}</p>
                    <p className="text-sm text-muted-foreground">
                      {remediationSummary.legalReferrals.count} {t('common.cases')}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatCurrency(remediationSummary.legalReferrals.amount)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <p className="font-medium">{t('collection.remediation.writeOffs')}</p>
                    <p className="text-sm text-muted-foreground">
                      {remediationSummary.writeOffs.count} {t('common.cases')}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatCurrency(remediationSummary.writeOffs.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* US-004: NPL Trend & US-005: Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPL Trend */}
        <Card className="cursor-pointer" onClick={() => handleDrill('overview', 'performance_radar')}>
          <CardHeader>
            <CardTitle>{t('collection.nplTrend.title')}</CardTitle>
            <CardDescription>{t('collection.nplTrend.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={nplTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPercentage(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="nplRatio" 
                  stroke="#8884d8" 
                  name={t('collection.metrics.nplRatio')}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="collectionRate" 
                  stroke="#82ca9d" 
                  name={t('collection.metrics.collectionRate')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance vs Target */}
        <Card className="cursor-pointer" onClick={() => handleDrill('collections', 'collection_rate')}>
          <CardHeader>
            <CardTitle>{t('collection.performance.title')}</CardTitle>
            <CardDescription>{t('collection.performance.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t('collection.performance.collectionTarget')}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(portfolioMetrics.monthlyAchievement)} / {formatCurrency(portfolioMetrics.monthlyTarget)}
                  </span>
                </div>
                <Progress 
                  value={(portfolioMetrics.monthlyAchievement / portfolioMetrics.monthlyTarget) * 100} 
                  className="h-3"
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">{t('collection.performance.monthComparison')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('collection.metrics.nplRatio')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatPercentage(performanceComparison.currentMonth.npl_ratio || 0)}
                      </span>
                      <Badge variant={
                        (performanceComparison.currentMonth.npl_ratio || 0) < (performanceComparison.previousMonth.npl_ratio || 0) 
                          ? 'success' : 'destructive'
                      }>
                        {(performanceComparison.currentMonth.npl_ratio || 0) < (performanceComparison.previousMonth.npl_ratio || 0) 
                          ? <TrendingDown className="h-3 w-3" /> 
                          : <TrendingUp className="h-3 w-3" />
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('collection.metrics.collectionRate')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatPercentage(performanceComparison.currentMonth.collection_rate || 0)}
                      </span>
                      <Badge variant={
                        (performanceComparison.currentMonth.collection_rate || 0) > (performanceComparison.previousMonth.collection_rate || 0) 
                          ? 'success' : 'destructive'
                      }>
                        {(performanceComparison.currentMonth.collection_rate || 0) > (performanceComparison.previousMonth.collection_rate || 0) 
                          ? <TrendingUp className="h-3 w-3" /> 
                          : <TrendingDown className="h-3 w-3" />
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveCollectionDashboard;