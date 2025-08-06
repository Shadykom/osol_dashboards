// src/pages/collection/BranchReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Building2, TrendingUp, Users, DollarSign, Phone, MessageSquare,
  Calendar, Filter, Download, RefreshCw, ChevronRight, Eye,
  AlertCircle, CheckCircle, Clock, Target, Award, ArrowUpRight,
  ArrowDownRight, Loader2, MapPin, BarChart3, Trophy, Search,
  FileDown, Zap, Globe, Smartphone, Monitor, X, AlertTriangle,
  CheckCircle2, Info
} from 'lucide-react';
import { BranchReportService } from '@/services/branchReportService';
import { useRealtimeBranchPerformance } from '@/hooks/useRealtimeData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import PrintService from '@/services/printService';
import { RTLWrapper, useRTLClasses } from '@/components/ui/rtl-wrapper';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const BranchReport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isRTL, textAlign, flexRow, spaceX, marginStart, marginEnd } = useRTLClasses();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchSummary, setBranchSummary] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [activeView, setActiveView] = useState('summary'); // summary, detailed, comparison
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'current_month',
    customDateRange: { from: null, to: null },
    region: 'all',
    branchType: 'all',
    performanceLevel: 'all',
    collectionTarget: 'all',
    customerSegment: 'all',
    productType: 'all',
    delinquencyBucket: 'all'
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'totalCollection',
    direction: 'desc'
  });

  // Real-time updates
  const { isConnected, lastUpdate } = useRealtimeBranchPerformance(
    'all',
    (payload) => {
      console.log('Branch performance update:', payload);
      loadBranchData();
    }
  );

  // Load branch data
  const loadBranchData = async () => {
    try {
      setError(null);
      const data = await BranchReportService.getBranchSummary(filters);
      setBranches(data.branches || []);
      setBranchSummary(data.summary || []);
    } catch (error) {
      console.error('Error loading branch data:', error);
      setError(t('branchReport.errorLoadingData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBranchData();
  }, [filters]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBranchData();
  };

  // Filter branches based on search
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      const searchLower = searchQuery.toLowerCase();
      return (
        branch.name.toLowerCase().includes(searchLower) ||
        branch.code?.toLowerCase().includes(searchLower) ||
        branch.region?.toLowerCase().includes(searchLower) ||
        branch.manager?.toLowerCase().includes(searchLower)
      );
    });
  }, [branches, searchQuery]);

  // Sort branches
  const sortedBranches = useMemo(() => {
    const sorted = [...filteredBranches];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredBranches, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle branch selection for comparison
  const handleBranchSelect = (branchId) => {
    setSelectedBranches(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      } else if (prev.length < 5) { // Limit to 5 branches for comparison
        return [...prev, branchId];
      }
      return prev;
    });
  };

  // Navigate to branch detail
  const navigateToBranchDetail = (branchId) => {
    navigate(`/collection/branch-report/${branchId}`);
  };

  // Export functionality
  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        await PrintService.printBranchReport(sortedBranches, filters);
      } else if (format === 'excel') {
        await BranchReportService.exportBranchReport(sortedBranches, filters, 'excel');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError(t('branchReport.exportError'));
    }
  };

  // Performance metrics colors
  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percentage) => {
    if (percentage >= 90) return { text: t('branchReport.excellent'), variant: 'success' };
    if (percentage >= 70) return { text: t('branchReport.good'), variant: 'warning' };
    return { text: t('branchReport.needsImprovement'), variant: 'destructive' };
  };

  // Summary cards data
  const summaryCards = [
    {
      title: t('branchReport.totalBranches'),
      value: branches.length,
      icon: Building2,
      change: '+5%',
      trend: 'up',
      color: 'blue'
    },
    {
      title: t('branchReport.totalCollection'),
      value: branches.reduce((sum, b) => sum + (b.totalCollection || 0), 0),
      icon: DollarSign,
      change: '+12%',
      trend: 'up',
      format: 'currency',
      color: 'green'
    },
    {
      title: t('branchReport.avgPerformance'),
      value: branches.reduce((sum, b) => sum + (b.performanceScore || 0), 0) / branches.length || 0,
      icon: TrendingUp,
      change: '+8%',
      trend: 'up',
      format: 'percentage',
      color: 'purple'
    },
    {
      title: t('branchReport.activeOfficers'),
      value: branches.reduce((sum, b) => sum + (b.activeOfficers || 0), 0),
      icon: Users,
      change: '+3%',
      trend: 'up',
      color: 'orange'
    }
  ];

  const formatValue = (value, format) => {
    if (format === 'currency') {
      return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );

  if (loading && !refreshing) {
    return (
      <RTLWrapper>
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
          <LoadingSkeleton />
        </div>
      </RTLWrapper>
    );
  }

  return (
    <RTLWrapper>
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4", flexRow)}
        >
          <div>
            <h1 className={cn("text-2xl md:text-3xl font-bold", textAlign)}>
              {t('branchReport.title')}
            </h1>
            <p className={cn("text-muted-foreground mt-1", textAlign)}>
              {t('branchReport.subtitle')}
            </p>
          </div>
          
          <div className={cn("flex flex-wrap gap-2", flexRow)}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("gap-2", flexRow)}
            >
              <Filter className="h-4 w-4" />
              {t('common.filters')}
              {Object.values(filters).filter(v => v !== 'all' && v !== null).length > 0 && (
                <Badge variant="secondary" className={marginStart}>
                  {Object.values(filters).filter(v => v !== 'all' && v !== null).length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("gap-2", flexRow)}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              {t('common.refresh')}
            </Button>

            <Select value="pdf" onValueChange={handleExport}>
              <SelectTrigger className="w-[120px]">
                <FileDown className="h-4 w-4" />
                <SelectValue placeholder={t('common.export')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">{t('common.exportPDF')}</SelectItem>
                <SelectItem value="excel">{t('common.exportExcel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time connection status */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className={cn("text-green-800 dark:text-green-200", textAlign)}>
                  {t('branchReport.realtimeActive')}
                  {lastUpdate && ` • ${t('common.lastUpdate')}: ${new Date(lastUpdate).toLocaleTimeString()}`}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className={cn("flex justify-between items-center", flexRow)}>
                    <CardTitle className="text-lg">{t('branchReport.filterOptions')}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.dateRange')}
                      </label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">{t('common.today')}</SelectItem>
                          <SelectItem value="yesterday">{t('common.yesterday')}</SelectItem>
                          <SelectItem value="last_7_days">{t('common.last7Days')}</SelectItem>
                          <SelectItem value="current_month">{t('common.currentMonth')}</SelectItem>
                          <SelectItem value="last_month">{t('common.lastMonth')}</SelectItem>
                          <SelectItem value="custom">{t('common.custom')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.region')}
                      </label>
                      <Select
                        value={filters.region}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="Central">{t('branchReport.regions.central')}</SelectItem>
                          <SelectItem value="Eastern">{t('branchReport.regions.eastern')}</SelectItem>
                          <SelectItem value="Western">{t('branchReport.regions.western')}</SelectItem>
                          <SelectItem value="Northern">{t('branchReport.regions.northern')}</SelectItem>
                          <SelectItem value="Southern">{t('branchReport.regions.southern')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.performanceLevel')}
                      </label>
                      <Select
                        value={filters.performanceLevel}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, performanceLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="excellent">{t('branchReport.excellent')}</SelectItem>
                          <SelectItem value="good">{t('branchReport.good')}</SelectItem>
                          <SelectItem value="average">{t('branchReport.average')}</SelectItem>
                          <SelectItem value="poor">{t('branchReport.poor')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.productType')}
                      </label>
                      <Select
                        value={filters.productType}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, productType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="personal">{t('products.personal')}</SelectItem>
                          <SelectItem value="auto">{t('products.auto')}</SelectItem>
                          <SelectItem value="mortgage">{t('products.mortgage')}</SelectItem>
                          <SelectItem value="credit_card">{t('products.creditCard')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.delinquencyBucket')}
                      </label>
                      <Select
                        value={filters.delinquencyBucket}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, delinquencyBucket: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="current">{t('delinquency.current')}</SelectItem>
                          <SelectItem value="1-30">{t('delinquency.bucket1to30')}</SelectItem>
                          <SelectItem value="31-60">{t('delinquency.bucket31to60')}</SelectItem>
                          <SelectItem value="61-90">{t('delinquency.bucket61to90')}</SelectItem>
                          <SelectItem value="90+">{t('delinquency.bucket90Plus')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.customerSegment')}
                      </label>
                      <Select
                        value={filters.customerSegment}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, customerSegment: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="retail">{t('customerSegments.retail')}</SelectItem>
                          <SelectItem value="sme">{t('customerSegments.sme')}</SelectItem>
                          <SelectItem value="corporate">{t('customerSegments.corporate')}</SelectItem>
                          <SelectItem value="vip">{t('customerSegments.vip')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-sm font-medium", textAlign)}>
                        {t('branchReport.branchType')}
                      </label>
                      <Select
                        value={filters.branchType}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, branchType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="HEAD_OFFICE">{t('branchTypes.headOffice')}</SelectItem>
                          <SelectItem value="MAIN">{t('branchTypes.main')}</SelectItem>
                          <SelectItem value="SUB">{t('branchTypes.sub')}</SelectItem>
                          <SelectItem value="RURAL">{t('branchTypes.rural')}</SelectItem>
                          <SelectItem value="URBAN">{t('branchTypes.urban')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => setFilters({
                          dateRange: 'current_month',
                          customDateRange: { from: null, to: null },
                          region: 'all',
                          branchType: 'all',
                          performanceLevel: 'all',
                          collectionTarget: 'all',
                          customerSegment: 'all',
                          productType: 'all',
                          delinquencyBucket: 'all'
                        })}
                        className="w-full"
                      >
                        {t('common.resetFilters')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4"
                style={{ borderLeftColor: `var(--${card.color}-500)` }}>
                <CardContent className="p-6">
                  <div className={cn("flex items-center justify-between", flexRow)}>
                    <div className="space-y-1">
                      <p className={cn("text-sm text-muted-foreground", textAlign)}>
                        {card.title}
                      </p>
                      <p className={cn("text-2xl font-bold", textAlign)}>
                        {formatValue(card.value, card.format)}
                      </p>
                      <div className={cn("flex items-center gap-1 text-sm", flexRow)}>
                        {card.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={card.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                          {card.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-900/20`}>
                      <card.icon className={`h-6 w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="summary">{t('branchReport.views.summary')}</TabsTrigger>
            <TabsTrigger value="detailed">{t('branchReport.views.detailed')}</TabsTrigger>
            <TabsTrigger value="comparison">{t('branchReport.views.comparison')}</TabsTrigger>
          </TabsList>

          {/* Summary View */}
          <TabsContent value="summary" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                placeholder={t('branchReport.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10", isRTL && "pl-3 pr-10")}
              />
            </div>

            {/* Branch Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('branchReport.performanceOverview')}</CardTitle>
                <CardDescription>{t('branchReport.performanceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedBranches.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="totalCollection" 
                      fill="#3b82f6" 
                      name={t('branchReport.totalCollection')}
                    />
                    <Bar 
                      dataKey="performanceScore" 
                      fill="#10b981" 
                      name={t('branchReport.performanceScore')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Branches Table */}
            <Card>
              <CardHeader>
                <div className={cn("flex justify-between items-center", flexRow)}>
                  <div>
                    <CardTitle>{t('branchReport.branchesTable')}</CardTitle>
                    <CardDescription>
                      {t('branchReport.showingBranches', { count: sortedBranches.length })}
                    </CardDescription>
                  </div>
                  {selectedBranches.length > 0 && (
                    <Badge variant="secondary" className="animate-pulse">
                      {t('branchReport.selectedForComparison', { count: selectedBranches.length })}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sortedBranches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('branchReport.noBranchesFound')}</h3>
                    <p className="text-muted-foreground mb-4">{t('branchReport.tryAdjustingFilters')}</p>
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        dateRange: 'current_month',
                        customDateRange: { from: null, to: null },
                        region: 'all',
                        branchType: 'all',
                        performanceLevel: 'all',
                        collectionTarget: 'all',
                        customerSegment: 'all',
                        productType: 'all',
                        delinquencyBucket: 'all'
                      })}
                    >
                      {t('common.resetFilters')}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[50px] sticky top-0 bg-background">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBranches(sortedBranches.slice(0, 5).map(b => b.id));
                                } else {
                                  setSelectedBranches([]);
                                }
                              }}
                              checked={selectedBranches.length > 0}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 sticky top-0 bg-background"
                            onClick={() => handleSort('name')}
                          >
                            <div className={cn("flex items-center gap-1", flexRow)}>
                              {t('branchReport.branchName')}
                              <BarChart3 className={cn("h-4 w-4 transition-transform", 
                                sortConfig.key === 'name' && sortConfig.direction === 'asc' && "rotate-180"
                              )} />
                            </div>
                          </TableHead>
                          <TableHead className="sticky top-0 bg-background">{t('branchReport.region')}</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 sticky top-0 bg-background"
                            onClick={() => handleSort('totalCollection')}
                          >
                            <div className={cn("flex items-center gap-1", flexRow)}>
                              {t('branchReport.totalCollection')}
                              <BarChart3 className={cn("h-4 w-4 transition-transform", 
                                sortConfig.key === 'totalCollection' && sortConfig.direction === 'asc' && "rotate-180"
                              )} />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 sticky top-0 bg-background"
                            onClick={() => handleSort('performanceScore')}
                          >
                            <div className={cn("flex items-center gap-1", flexRow)}>
                              {t('branchReport.performance')}
                              <BarChart3 className={cn("h-4 w-4 transition-transform", 
                                sortConfig.key === 'performanceScore' && sortConfig.direction === 'asc' && "rotate-180"
                              )} />
                            </div>
                          </TableHead>
                          <TableHead className="sticky top-0 bg-background">{t('branchReport.activeOfficers')}</TableHead>
                          <TableHead className="sticky top-0 bg-background">{t('branchReport.totalCases')}</TableHead>
                          <TableHead className="sticky top-0 bg-background">{t('branchReport.status')}</TableHead>
                          <TableHead className="sticky top-0 bg-background">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {sortedBranches.map((branch, index) => (
                            <motion.tr
                              key={branch.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedBranches.includes(branch.id)}
                                  onChange={() => handleBranchSelect(branch.id)}
                                  className="rounded border-gray-300 transition-all hover:scale-110"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <p className="font-semibold">{branch.name || t('branchReport.unnamed')}</p>
                                  <p className="text-sm text-muted-foreground">{branch.code}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={cn("flex items-center gap-1", flexRow)}>
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="capitalize">
                                    {branch.region || t('branchReport.regions.unknown')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {formatValue(branch.totalCollection || 0, 'currency')}
                                  </p>
                                  {branch.collectionTarget > 0 && (
                                    <div className="mt-1">
                                      <Progress 
                                        value={(branch.totalCollection / branch.collectionTarget) * 100} 
                                        className="h-1 w-24"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {t('branchReport.target')}: {formatValue(branch.collectionTarget || 0, 'currency')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className={cn("flex items-center gap-2", flexRow)}>
                                    <Progress 
                                      value={branch.performanceScore || 0} 
                                      className="h-2 w-20"
                                    />
                                    <span className={cn("text-sm font-medium", getPerformanceColor(branch.performanceScore || 0))}>
                                      {branch.performanceScore?.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={getPerformanceBadge(branch.performanceScore || 0).variant}
                                    className="text-xs"
                                  >
                                    {getPerformanceBadge(branch.performanceScore || 0).text}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={cn("flex items-center gap-1", flexRow)}>
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{branch.activeOfficers || 0}</span>
                                  {branch.totalOfficers > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      / {branch.totalOfficers}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{branch.totalCases || 0}</p>
                                  {branch.resolvedCases > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                      <CheckCircle2 className="inline h-3 w-3 mr-1" />
                                      {t('branchReport.resolved')}: {branch.resolvedCases || 0}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={branch.isActive ? 'success' : 'secondary'}
                                  className="font-medium"
                                >
                                  {branch.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {t('common.active')}
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      {t('common.inactive')}
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigateToBranchDetail(branch.id)}
                                  className={cn("gap-1 hover:bg-primary hover:text-primary-foreground transition-colors", flexRow)}
                                >
                                  <Eye className="h-4 w-4" />
                                  {t('common.viewDetails')}
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed View */}
          <TabsContent value="detailed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.performanceDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('branchReport.excellent'), value: branches.filter(b => b.performanceScore >= 90).length },
                          { name: t('branchReport.good'), value: branches.filter(b => b.performanceScore >= 70 && b.performanceScore < 90).length },
                          { name: t('branchReport.average'), value: branches.filter(b => b.performanceScore >= 50 && b.performanceScore < 70).length },
                          { name: t('branchReport.poor'), value: branches.filter(b => b.performanceScore < 50).length }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Regional Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.regionalPerformance')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { region: t('branchReport.regions.central'), performance: 85, collection: 92 },
                      { region: t('branchReport.regions.eastern'), performance: 78, collection: 85 },
                      { region: t('branchReport.regions.western'), performance: 82, collection: 88 },
                      { region: t('branchReport.regions.northern'), performance: 75, collection: 80 },
                      { region: t('branchReport.regions.southern'), performance: 79, collection: 83 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="region" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={t('branchReport.performance')} dataKey="performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name={t('branchReport.collection')} dataKey="collection" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Collection Trends */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('branchReport.collectionTrends')}</CardTitle>
                  <CardDescription>{t('branchReport.last30Days')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { date: '1', branch1: 4000, branch2: 2400, branch3: 2400 },
                      { date: '5', branch1: 3000, branch2: 1398, branch3: 2210 },
                      { date: '10', branch1: 2000, branch2: 9800, branch3: 2290 },
                      { date: '15', branch1: 2780, branch2: 3908, branch3: 2000 },
                      { date: '20', branch1: 1890, branch2: 4800, branch3: 2181 },
                      { date: '25', branch1: 2390, branch2: 3800, branch3: 2500 },
                      { date: '30', branch1: 3490, branch2: 4300, branch3: 2100 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="branch1" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                      <Area type="monotone" dataKey="branch2" stackId="1" stroke="#10b981" fill="#10b981" />
                      <Area type="monotone" dataKey="branch3" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison View */}
          <TabsContent value="comparison" className="space-y-6">
            {selectedBranches.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('branchReport.selectBranchesForComparison')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Comparison Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {sortedBranches
                    .filter(branch => selectedBranches.includes(branch.id))
                    .map(branch => (
                      <Card key={branch.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{branch.name}</CardTitle>
                          <Badge variant="outline">{branch.code}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('branchReport.collection')}</p>
                            <p className="text-lg font-semibold">
                              {formatValue(branch.totalCollection || 0, 'currency')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('branchReport.performance')}</p>
                            <div className={cn("flex items-center gap-2", flexRow)}>
                              <Progress value={branch.performanceScore || 0} className="h-2" />
                              <span className="text-sm font-medium">{branch.performanceScore?.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('branchReport.officers')}</p>
                            <p className="text-lg font-semibold">{branch.activeOfficers || 0}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Comparison Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('branchReport.performanceComparison')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={sortedBranches.filter(b => selectedBranches.includes(b.id))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalCollection" fill="#3b82f6" name={t('branchReport.totalCollection')} />
                        <Bar yAxisId="right" dataKey="performanceScore" fill="#10b981" name={t('branchReport.performanceScore')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RTLWrapper>
  );
};

export default BranchReport;