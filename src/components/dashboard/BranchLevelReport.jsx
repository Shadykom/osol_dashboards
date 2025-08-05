import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, BarChart, Bar, ComposedChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Treemap
} from 'recharts';
import { 
  Building2, TrendingUp, Users, DollarSign, Phone, MessageSquare,
  Calendar, Filter, Download, RefreshCw, ChevronRight, Eye,
  AlertCircle, CheckCircle, Clock, Target, Award, ArrowUpRight,
  ArrowDownRight, Loader2, MapPin, BarChart3, Trophy, CalendarDays,
  FileDown, Zap
} from 'lucide-react';
import { BranchReportService } from '@/services/branchReportService';
import { useRealtimeBranchPerformance, useRealtimeCollectionMetrics } from '@/hooks/useRealtimeData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import PrintService from '@/services/printService';
import { PrintView } from '@/components/ui/print-view';
import { RTLWrapper, useRTLClasses } from '@/components/ui/rtl-wrapper';

const BranchLevelReport = () => {
  const { t, ready, i18n } = useTranslation();
  const { isRTL, textAlign, flexRow, spaceX, marginStart, marginEnd } = useRTLClasses();
  
  // State Management
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showOfficerDetails, setShowOfficerDetails] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true); // NEW: Toggle for real-time updates
  
  // Filters
  const [dateRange, setDateRange] = useState('current_month');
  const [customDateRange, setCustomDateRange] = useState({ from: null, to: null }); // NEW: Custom date range
  const [viewType, setViewType] = useState('daily'); // NEW: daily/weekly toggle
  const [productType, setProductType] = useState('all');
  const [delinquencyBucket, setDelinquencyBucket] = useState('all');
  const [customerType, setCustomerType] = useState('all');
  const [showComparison, setShowComparison] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date()); // NEW: Track refresh time

  // Real-time updates
  const { isConnected: performanceConnected, lastUpdate: performanceUpdate } = useRealtimeBranchPerformance(
    selectedBranch,
    (payload) => {
      if (realtimeEnabled) {
        console.log('Branch performance update:', payload);
        // Refresh the report data when performance metrics update
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          loadBranchReport();
        }
      }
    }
  );

  const { isConnected: metricsConnected, lastUpdate: metricsUpdate } = useRealtimeCollectionMetrics(
    selectedBranch,
    (payload) => {
      if (realtimeEnabled) {
        console.log('Collection metrics update:', payload);
        // Update specific metrics without full reload for better performance
        if (reportData && payload.new) {
          updateMetricsPartially(payload);
        }
      }
    }
  );

  // Partial update function for real-time metrics
  const updateMetricsPartially = (payload) => {
    setReportData(prevData => {
      if (!prevData) return prevData;
      
      // Update specific metrics based on the change
      const updatedData = { ...prevData };
      
      // If it's a new overdue case
      if (payload.eventType === 'INSERT' && payload.new.overdue_amount > 0) {
        updatedData.summary = {
          ...updatedData.summary,
          overdueLoans: (updatedData.summary.overdueLoans || 0) + 1,
          overduePortfolio: (updatedData.summary.overduePortfolio || 0) + payload.new.overdue_amount
        };
      }
      
      // If it's an update to collection status
      if (payload.eventType === 'UPDATE' && payload.old.overdue_amount !== payload.new.overdue_amount) {
        const difference = payload.new.overdue_amount - payload.old.overdue_amount;
        updatedData.summary = {
          ...updatedData.summary,
          overduePortfolio: (updatedData.summary.overduePortfolio || 0) + difference
        };
      }
      
      return updatedData;
    });
    
    setLastRefreshTime(new Date());
  };

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load report data when branch or filters change
  useEffect(() => {
    if (selectedBranch) {
      loadBranchReport();
    }
  }, [selectedBranch, dateRange, viewType, productType, delinquencyBucket, customerType]);

  // Load branches
  const loadBranches = async () => {
    try {
      const result = await BranchReportService.getBranches();
      if (result.success && result.data) {
        setBranches(result.data);
        if (result.data.length > 0) {
          setSelectedBranch(result.data[0].branch_id);
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  // Load branch report
  const loadBranchReport = async () => {
    try {
      setLoading(true);
      const filters = {
        dateRange,
        customDateRange: dateRange === 'custom' ? customDateRange : null, // NEW: Include custom date range
        viewType, // NEW: Include viewType in filters
        productType,
        delinquencyBucket,
        customerType,
        comparison: showComparison
      };
      
      const result = await BranchReportService.getBranchReport(selectedBranch, filters);
      if (result.success && result.data) {
        setReportData(result.data);
        setLastRefreshTime(new Date()); // NEW: Update refresh time
      }
    } catch (error) {
      console.error('Error loading branch report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBranchReport();
    setRefreshing(false);
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        // Use the new print service for PDF generation
        const reportElement = document.getElementById('branch-report-content');
        if (reportElement) {
          const pdf = await PrintService.generatePDF(reportElement, {
            title: `${t('reports.branch.title')} - ${branches.find(b => b.branch_id === selectedBranch)?.branch_name || ''}`,
            orientation: 'landscape',
            onProgress: (progress, message) => {
              console.log(`PDF Generation: ${progress}% - ${message}`);
            }
          });
          pdf.save(`branch_report_${selectedBranch}_${new Date().toISOString().split('T')[0]}.pdf`);
        }
      } else if (format === 'excel') {
        // Prepare data for Excel export
        const branchName = branches.find(b => b.branch_id === selectedBranch)?.branch_name || '';
        const exportData = [];
        
        // Add summary data
        if (reportData?.summary) {
          exportData.push([t('reports.branch.summary'), '']);
          exportData.push([t('reports.branch.totalPortfolio'), formatCurrency(reportData.summary.totalPortfolio)]);
          exportData.push([t('reports.branch.overdueAmount'), formatCurrency(reportData.summary.overduePortfolio)]);
          exportData.push([t('reports.branch.activeCases'), reportData.summary.activeCases]);
          exportData.push([t('reports.branch.collectionRate'), `${reportData.summary.collectionRate}%`]);
          exportData.push(['', '']);
        }
        
        // Add officer performance data
        if (reportData?.officerPerformance?.officers) {
          exportData.push([t('reports.branch.officers'), '']);
          exportData.push([
            t('reports.branch.officerName'), 
            t('reports.branch.cases'), 
            t('reports.branch.dueAmount'), 
            t('reports.branch.collectionRate'), 
            t('reports.branch.contactRate')
          ]);
          reportData.officerPerformance.officers.forEach(officer => {
            exportData.push([
              officer.officerName,
              officer.totalCases,
              formatCurrency(officer.totalOutstanding),
              `${officer.performance}%`,
              `${officer.contactRate}%`
            ]);
          });
        }
        
        await PrintService.exportToExcel(exportData, {
          filename: `branch_report_${branchName.replace(/\s+/g, '_')}`,
          sheetName: t('reports.branch.title'),
          title: `${t('reports.branch.performanceReport')} - ${branchName}`,
          metadata: {
            'التاريخ': new Date().toLocaleDateString('ar-SA'),
            'الفترة': dateRange,
            'نوع المنتج': productType === 'all' ? t('reports.branch.allProducts') : productType
          },
          rtl: true,
          columnWidths: { 0: 30, 1: 20, 2: 25, 3: 15, 4: 15 }
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(t('common.exportError'));
    }
  };

  // Format functions
  const formatCurrency = (amount) => {
    // Always use English numbers
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
    
    // Add currency prefix based on language
    return t('common.currency') === 'ريال' ? `${formatted} ر.س` : `SAR ${formatted}`;
  };

  const formatNumber = (num) => {
    // Always use English numbers
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (value) => {
    // Always use English numbers
    return `${(value || 0).toFixed(1)}%`;
  };

  // Chart colors
  const COLORS = {
    primary: '#E6B800',
    secondary: '#4A5568',
    success: '#48BB78',
    warning: '#ED8936',
    danger: '#F56565',
    info: '#4299E1',
    chart: ['#E6B800', '#4A5568', '#48BB78', '#ED8936', '#F56565', '#4299E1', '#9F7AEA']
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PrintView>
      <div id="branch-report-content" className="space-y-6 p-4 sm:p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold text-gray-900 ${textAlign}`}>
                {t('branchReport.title')}
              </h1>
              <p className={`text-sm sm:text-base text-gray-600 mt-1 ${textAlign}`}>
                {t('branchReport.performanceReport')}
              </p>
            </div>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              {/* Real-time indicator */}
              <div className={`flex items-center gap-2 ${flexRow}`}>
                <div className={`w-2 h-2 rounded-full ${
                  performanceConnected && metricsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-600">
                  {performanceConnected && metricsConnected ? t('common.realtime') : t('common.notConnected')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                  className={marginStart(2)}
                >
                  <Zap className={`h-4 w-4 ${realtimeEnabled ? 'text-yellow-500' : 'text-gray-400'}`} />
                </Button>
              </div>
              
              {/* Action buttons */}
              <div className={`flex gap-2 ${flexRow}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="min-w-[100px]"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} ${marginEnd(2)}`} />
                  <span className="hidden sm:inline">{t('common.refresh')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  className="min-w-[100px]"
                >
                  <Download className={`h-4 w-4 ${marginEnd(2)}`} />
                  <span className="hidden sm:inline">{t('common.export')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  className="min-w-[100px]"
                >
                  <Download className={`h-4 w-4 ${marginEnd(2)}`} />
                  <span className="hidden sm:inline">{t('common.print')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="space-y-4">
            {/* Branch Selection */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('branchReport.selectBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Selection */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${flexRow}`}>
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium whitespace-nowrap">{t('branchReport.dataView')}:</span>
                </div>
                <Tabs value={viewType} onValueChange={setViewType} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="daily">{t('branchReport.daily')}</TabsTrigger>
                    <TabsTrigger value="weekly">{t('branchReport.weekly')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className={`flex items-center gap-2 text-sm text-gray-500 ${flexRow}`}>
                <Clock className="h-4 w-4" />
                <span className="whitespace-nowrap">{t('branchReport.lastRefresh')}: {lastRefreshTime.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}</span>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select 
                value={dateRange} 
                onValueChange={(value) => {
                  setDateRange(value);
                  if (value === 'custom') {
                    setCustomDateRange({ from: new Date(), to: new Date() });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">{t('branchReport.currentMonth')}</SelectItem>
                  <SelectItem value="last_month">{t('branchReport.lastMonth')}</SelectItem>
                  <SelectItem value="last_3_months">{t('branchReport.last3Months')}</SelectItem>
                  <SelectItem value="last_6_months">{t('branchReport.last6Months')}</SelectItem>
                  <SelectItem value="year_to_date">{t('branchReport.yearToDate')}</SelectItem>
                  <SelectItem value="custom">{t('branchReport.customRange')}</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <DateRangePicker 
                  date={customDateRange}
                  onDateChange={(range) => {
                    setCustomDateRange(range);
                    setDateRange('custom');
                  }}
                  placeholder={t('branchReport.selectDateRange')}
                  className="w-full"
                />
              )}

              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('branchReport.allProducts')}</SelectItem>
                  <SelectItem value="Tawarruq">{t('branchReport.tawarruqLoan')}</SelectItem>
                  <SelectItem value="Cash">{t('branchReport.cashLoan')}</SelectItem>
                  <SelectItem value="Auto">{t('branchReport.autoLoan')}</SelectItem>
                  <SelectItem value="Real Estate">{t('branchReport.realEstateLoan')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={delinquencyBucket} onValueChange={setDelinquencyBucket}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('branchReport.allBuckets')}</SelectItem>
                  <SelectItem value="current">{t('branchReport.current')}</SelectItem>
                  <SelectItem value="1-30">{t('branchReport.days1To30')}</SelectItem>
                  <SelectItem value="31-60">{t('branchReport.days31To60')}</SelectItem>
                  <SelectItem value="61-90">{t('branchReport.days61To90')}</SelectItem>
                  <SelectItem value="90+">{t('branchReport.moreThan90Days')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('branchReport.allCustomers')}</SelectItem>
                  <SelectItem value="INDIVIDUAL">{t('branchReport.individuals')}</SelectItem>
                  <SelectItem value="CORPORATE">{t('branchReport.corporates')}</SelectItem>
                  <SelectItem value="SME">{t('branchReport.smallAndMediumEnterprises')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('branchReport.totalPortfolio')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(reportData.summary?.totalPortfolio)}
                  </div>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {formatNumber(reportData.summary?.totalLoans)} {t('branchReport.loans')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('branchReport.delinquency')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.summary?.totalOverdue)}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600">{t('branchReport.metrics.delinquencyRate')}</span>
                    <span className={`text-sm font-bold ${
                      reportData.summary?.delinquencyRate > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatPercentage(reportData.summary?.delinquencyRate)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('branchReport.metrics.collectionRate')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(reportData.summary?.collectionRate)}
                  </div>
                  <Progress 
                    value={reportData.summary?.collectionRate} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('branchReport.activeCases')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(reportData.summary?.activeCases)}
                  </div>
                  <div className="flex items-center mt-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3 ml-1" />
                    {t('branchReport.metrics.avgProductivity')} {reportData.summary?.avgDPD?.toFixed(1)} {t('common.days')} {t('common.delay')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('branchReport.metrics.ranking')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        #{reportData.branchComparison?.rankings?.collectionRank}
                      </div>
                      <p className="text-xs text-gray-600">{t('common.collection')}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        #{reportData.branchComparison?.rankings?.delinquencyRank}
                      </div>
                      <p className="text-xs text-gray-600">{t('common.delinquency')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max">
                  <TabsTrigger value="overview" className="whitespace-nowrap">{t('branchReport.overview')}</TabsTrigger>
                  <TabsTrigger value="officers" className="whitespace-nowrap">{t('branchReport.officerPerformance')}</TabsTrigger>
                  <TabsTrigger value="products" className="whitespace-nowrap">{t('branchReport.productAnalysis')}</TabsTrigger>
                  <TabsTrigger value="delinquency" className="whitespace-nowrap">{t('branchReport.delinquencyDistribution')}</TabsTrigger>
                  <TabsTrigger value="communication" className="whitespace-nowrap">{t('branchReport.communication')}</TabsTrigger>
                  <TabsTrigger value="comparison" className="whitespace-nowrap">{t('branchReport.comparisons')}</TabsTrigger>
                </TabsList>
              </ScrollArea>

              <TabsContent value="overview" className="space-y-4">
                {/* Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.performanceTrends')}</CardTitle>
                    <CardDescription>{t('branchReport.performanceTrendsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={reportData.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="delinquencyRate"
                          fill={COLORS.danger}
                          stroke={COLORS.danger}
                          fillOpacity={0.3}
                          name={t('branchReport.delinquencyRate')}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="collectionRate"
                          stroke={COLORS.success}
                          strokeWidth={3}
                          name={t('branchReport.collectionRate')}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="newCases"
                          fill={COLORS.warning}
                          name={t('branchReport.newCases')}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Portfolio at Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('branchReport.portfolioAtRisk')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">{t('branchReport.par30')}</span>
                            <span className="text-sm font-bold">
                              {formatPercentage(reportData.summary?.portfolioAtRisk)}
                            </span>
                          </div>
                          <Progress 
                            value={reportData.summary?.portfolioAtRisk} 
                            className="h-3"
                          />
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600">{t('branchReport.overdueLoans')}</p>
                              <p className="text-2xl font-bold text-red-600">
                                {formatNumber(reportData.summary?.overdueLoans)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">{t('branchReport.avgDelay')}</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {reportData.summary?.avgDPD?.toFixed(1)} {t('common.days')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('branchReport.branchVsAverage')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={[
                          {
                            metric: t('branchReport.delinquencyRate'),
                            branch: reportData.summary?.delinquencyRate,
                            company: reportData.branchComparison?.companyAverage?.delinquencyRate
                          },
                          {
                            metric: t('branchReport.collectionRate'),
                            branch: reportData.summary?.collectionRate,
                            company: reportData.branchComparison?.companyAverage?.collectionRate
                          },
                          {
                            metric: t('branchReport.activeCases'),
                            branch: (reportData.summary?.activeCases / reportData.summary?.totalLoans) * 100,
                            company: 15
                          },
                          {
                            metric: t('branchReport.portfolioQuality'),
                            branch: 100 - reportData.summary?.portfolioAtRisk,
                            company: 85
                          }
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis />
                          <Radar
                            name={t('branchReport.branch')}
                            dataKey="branch"
                            stroke={COLORS.primary}
                            fill={COLORS.primary}
                            fillOpacity={0.6}
                          />
                          <Radar
                            name={t('branchReport.companyAverage')}
                            dataKey="company"
                            stroke={COLORS.secondary}
                            fill={COLORS.secondary}
                            fillOpacity={0.3}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="officers" className="space-y-4">
                {/* Top and Low Performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      {t('branchReport.topPerformers')}
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.officerPerformance?.topPerformers?.slice(0, 3).map((officer, index) => (
                          <div 
                            key={officer.officerId}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                            onClick={() => {
                              setSelectedOfficer(officer);
                              setShowOfficerDetails(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{officer.officerName}</p>
                                <p className="text-xs text-gray-600">
                                  {officer.totalCases} {t('branchReport.cases')} | {formatCurrency(officer.totalOutstanding)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                {officer.performance.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-600">{t('branchReport.performance')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      {t('branchReport.needSupport')}
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.officerPerformance?.lowPerformers?.slice(0, 3).map((officer) => (
                          <div 
                            key={officer.officerId}
                            className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                            onClick={() => {
                              setSelectedOfficer(officer);
                              setShowOfficerDetails(true);
                            }}
                          >
                            <div>
                              <p className="font-medium">{officer.officerName}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-600">
                                  {t('branchReport.contactRate')}: {officer.contactRate.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-600">
                                  {t('branchReport.ptpRate')}: {officer.ptpRate.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              {t('branchReport.viewDetails')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All Officers Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.allOfficers')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('branchReport.officer')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.cases')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.dueAmount')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.calls')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.promises')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.contactRate')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.ptpRate')}</TableHead>
                            <TableHead className="text-center">{t('branchReport.performance')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.officerPerformance?.officers?.map((officer) => (
                            <TableRow 
                              key={officer.officerId}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                setSelectedOfficer(officer);
                                setShowOfficerDetails(true);
                              }}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium">{officer.officerName}</p>
                                  <p className="text-xs text-gray-600">{officer.officerType}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {formatNumber(officer.totalCases)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatCurrency(officer.totalOutstanding)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatNumber(officer.totalCalls)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div>
                                  <p>{officer.totalPTPs}</p>
                                  <p className="text-xs text-gray-600">
                                    ({officer.keptPTPs} {t('branchReport.fulfilledPromises')})
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={officer.contactRate > 80 ? 'success' : 'secondary'}>
                                  {officer.contactRate.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={officer.ptpRate > 5 ? 'success' : 'secondary'}>
                                  {officer.ptpRate.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Progress 
                                    value={officer.performance} 
                                    className="w-16 h-2"
                                  />
                                  <span className="text-sm font-medium">
                                    {officer.performance.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                {/* Product Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.productPerformance')}</CardTitle>
                    <CardDescription>{t('branchReport.productPerformanceDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reportData.productPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="productName" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="totalLoans" 
                          fill={COLORS.primary} 
                          name={t('branchReport.totalLoans')}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="overdueLoans" 
                          fill={COLORS.danger} 
                          name={t('branchReport.overdueLoans')}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="delinquencyRate"
                          stroke={COLORS.warning}
                          strokeWidth={3}
                          name={t('branchReport.delinquencyRate')}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Product Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.productPerformance?.map((product) => (
                    <Card key={product.productType} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{product.productName}</CardTitle>
                        <Badge variant="outline">{product.productType}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t('branchReport.portfolioSize')}</span>
                            <span className="font-bold">{formatCurrency(product.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t('branchReport.totalLoans')}</span>
                            <span className="font-bold">{formatNumber(product.totalLoans)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t('branchReport.delinquencyRate')}</span>
                            <Badge 
                              variant={product.delinquencyRate > 15 ? 'destructive' : 'secondary'}
                            >
                              {formatPercentage(product.delinquencyRate)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t('branchReport.avgDelay')}</span>
                            <span className="font-medium">{product.avgDPD.toFixed(0)} {t('common.days')}</span>
                          </div>
                          <Progress 
                            value={product.portfolioShare} 
                            className="h-2 mt-2"
                          />
                          <p className="text-xs text-center text-gray-600">
                            {formatPercentage(product.portfolioShare)} {t('branchReport.ofPortfolio')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="delinquency" className="space-y-4">
                {/* Delinquency Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.delinquencyDistribution')}</CardTitle>
                    <CardDescription>{t('branchReport.delinquencyDistributionDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportData.delinquencyDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.bucket}: ${entry.percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {reportData.delinquencyDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="space-y-3">
                        {reportData.delinquencyDistribution?.map((bucket, index) => (
                          <div key={bucket.bucket} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }}
                              />
                              <span className="font-medium">{bucket.bucket}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(bucket.amount)}</p>
                              <p className="text-xs text-gray-600">
                                {formatNumber(bucket.count)} {t('branchReport.loans')} ({formatPercentage(bucket.percentage)})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Migration */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.riskIndicators')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('branchReport.warning')}:</strong> {reportData.summary?.overdueLoans} {t('branchReport.loansInDelay')},
                        {reportData.delinquencyDistribution?.find(d => d.bucket === '61-90')?.count || 0} {t('branchReport.loansInCriticalPhase')}(61-90 {t('common.days')}) {t('branchReport.requireImmediateIntervention')}
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                        <p className="text-sm text-gray-600">{t('branchReport.warningPhase')}</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {reportData.delinquencyDistribution?.find(d => d.bucket === '1-30')?.count || 0}
                        </p>
                        <p className="text-xs text-gray-600">{t('branchReport.days1To30')}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-gray-600">{t('branchReport.riskPhase')}</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {reportData.delinquencyDistribution?.find(d => d.bucket === '31-60')?.count || 0}
                        </p>
                        <p className="text-xs text-gray-600">{t('branchReport.days31To60')}</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <p className="text-sm text-gray-600">{t('branchReport.criticalPhase')}</p>
                        <p className="text-2xl font-bold text-red-600">
                          {(reportData.delinquencyDistribution?.find(d => d.bucket === '61-90')?.count || 0) +
                           (reportData.delinquencyDistribution?.find(d => d.bucket === '91-180')?.count || 0)}
                        </p>
                        <p className="text-xs text-gray-600">{t('branchReport.moreThan60Days')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                {/* Communication Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t('branchReport.totalCalls')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(reportData.communicationStats?.summary?.totalCalls)}</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('branchReport.average')} {reportData.communicationStats?.summary?.avgCallsPerCase?.toFixed(1)} {t('branchReport.callsPerCase')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t('branchReport.messagesSent')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber((reportData.communicationStats?.summary?.totalSMS || 0) + 
                                      (reportData.communicationStats?.summary?.totalEmails || 0))}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          SMS: {reportData.communicationStats?.summary?.totalSMS}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Email: {reportData.communicationStats?.summary?.totalEmails}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('branchReport.responseRate')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(reportData.communicationStats?.effectiveness?.contactRate)}
                      </div>
                      <Progress 
                        value={reportData.communicationStats?.effectiveness?.contactRate} 
                        className="mt-2 h-2"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('branchReport.promisesFromCalls')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(reportData.communicationStats?.ptpFromCalls)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('branchReport.promiseRate')}: {formatPercentage(reportData.communicationStats?.effectiveness?.promiseRate)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Call Outcomes */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.callOutcomes')}</CardTitle>
                    <CardDescription>{t('branchReport.callOutcomesDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={Object.entries(reportData.communicationStats?.callOutcomes || {}).map(([outcome, count]) => ({
                          outcome,
                          count
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="outcome" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.primary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Daily Communication Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.dailyCommunicationTrend')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={reportData.communicationStats?.dailyDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="calls" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} name={t('branchReport.calls')} />
                        <Area type="monotone" dataKey="sms" stackId="1" stroke={COLORS.info} fill={COLORS.info} name={t('branchReport.sms')} />
                        <Area type="monotone" dataKey="emails" stackId="1" stroke={COLORS.secondary} fill={COLORS.secondary} name={t('branchReport.emails')} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                {/* Branch Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.branchRanking')}</CardTitle>
                    <CardDescription>{t('branchReport.branchRankingDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Ranking Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm text-gray-600">{t('branchReport.overallRank')}</p>
                          <p className="text-3xl font-bold text-blue-600">
                            #{Math.round((reportData.branchComparison?.rankings?.collectionRank + 
                                         reportData.branchComparison?.rankings?.delinquencyRank) / 2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {t('branchReport.from')} {reportData.branchComparison?.rankings?.totalBranches} {t('branchReport.branches')}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="text-sm text-gray-600">{t('branchReport.collectionRank')}</p>
                          <p className="text-3xl font-bold text-green-600">
                            #{reportData.branchComparison?.rankings?.collectionRank}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.collectionRate > 0 ? '+' : ''}
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.collectionRate?.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                          <p className="text-sm text-gray-600">{t('branchReport.delinquencyRank')}</p>
                          <p className="text-3xl font-bold text-orange-600">
                            #{reportData.branchComparison?.rankings?.delinquencyRank}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.delinquencyRate > 0 ? '+' : ''}
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.delinquencyRate?.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      {/* Comparison Chart */}
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={reportData.branchComparison?.branchComparison}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="branchName" angle={-45} textAnchor="end" height={100} />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="delinquencyRate" fill={COLORS.danger} name={t('branchReport.delinquencyRate')} />
                          <Bar yAxisId="left" dataKey="collectionRate" fill={COLORS.success} name={t('branchReport.collectionRate')} />
                          <Line yAxisId="right" type="monotone" dataKey="portfolioSize" stroke={COLORS.primary} strokeWidth={3} name={t('branchReport.portfolioSize')} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Performance vs Company Average */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-3">{t('branchReport.branchVsAverage')}</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{t('branchReport.delinquencyRate')}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatPercentage(reportData.summary?.delinquencyRate)}</span>
                                <span className="text-sm text-gray-500">vs</span>
                                <span className="text-sm text-gray-600">
                                  {formatPercentage(reportData.branchComparison?.companyAverage?.delinquencyRate)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{t('branchReport.collectionRate')}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatPercentage(reportData.summary?.collectionRate)}</span>
                                <span className="text-sm text-gray-500">vs</span>
                                <span className="text-sm text-gray-600">
                                  {formatPercentage(reportData.branchComparison?.companyAverage?.collectionRate)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{t('branchReport.portfolioSize')}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(reportData.summary?.totalPortfolio)}</span>
                                <span className="text-sm text-gray-500">vs</span>
                                <span className="text-sm text-gray-600">
                                  {formatCurrency(reportData.branchComparison?.companyAverage?.portfolioSize)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-3">{t('branchReport.performanceIndicators')}</h4>
                          <div className="space-y-3">
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.delinquencyRate < 0 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">{t('branchReport.delinquencyBelowAverage')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">{t('branchReport.delinquencyAboveAverage')}</span>
                              </div>
                            )}
                            
                            {reportData.branchComparison?.performance?.vsCompanyAvg?.collectionRate > 0 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">{t('branchReport.collectionAboveAverage')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">{t('branchReport.collectionBelowAverage')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Officer Details Dialog */}
        <Dialog open={showOfficerDetails} onOpenChange={setShowOfficerDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('branchReport.officerDetails')}</DialogTitle>
              <DialogDescription>
                {t('branchReport.officerDetailsDescription', { officerName: selectedOfficer?.officerName })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOfficer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('branchReport.type')}</p>
                    <p className="font-medium">{selectedOfficer.officerType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('branchReport.totalCases')}</p>
                    <p className="font-medium">{formatNumber(selectedOfficer.totalCases)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('branchReport.dueAmount')}</p>
                    <p className="font-medium">{formatCurrency(selectedOfficer.totalOutstanding)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('branchReport.performance')}</p>
                    <p className="font-medium">{selectedOfficer.performance.toFixed(1)}%</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">{t('branchReport.performanceIndicators')}</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('branchReport.contactRate')}</span>
                        <span className="text-sm font-medium">{selectedOfficer.contactRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedOfficer.contactRate} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('branchReport.promiseRate')}</span>
                        <span className="text-sm font-medium">{selectedOfficer.ptpRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedOfficer.ptpRate * 10} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('branchReport.promiseFulfillmentRate')}</span>
                        <span className="text-sm font-medium">{selectedOfficer.ptpFulfillmentRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedOfficer.ptpFulfillmentRate} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowOfficerDetails(false)}>
                    {t('common.close')}
                  </Button>
                  <Button onClick={() => window.location.href = `/collection/specialist-report?id=${selectedOfficer.officerId}`}>
                    {t('branchReport.viewFullReport')}
                    <ChevronRight className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PrintView>
  );
};

// Add separator component
const Separator = () => <div className="border-t my-4" />;

export default BranchLevelReport;