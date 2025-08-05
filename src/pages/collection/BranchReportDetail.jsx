import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Progress } from '@/components/ui/progress';
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
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import { 
  Building2, TrendingUp, Users, DollarSign, Phone, MessageSquare,
  Calendar, Filter, Download, RefreshCw, ChevronLeft, Eye,
  AlertCircle, CheckCircle, Clock, Target, Award, ArrowUpRight,
  ArrowDownRight, Loader2, MapPin, BarChart3, Trophy, Search,
  FileDown, Zap, Globe, Smartphone, Monitor, Mail, UserCheck,
  Activity, Briefcase, CreditCard, FileText, Settings, Star
} from 'lucide-react';
import { BranchReportService } from '@/services/branchReportService';
import { useRealtimeBranchPerformance } from '@/hooks/useRealtimeData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import PrintService from '@/services/printService';
import { RTLWrapper, useRTLClasses } from '@/components/ui/rtl-wrapper';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BranchReportDetail = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isRTL, textAlign, flexRow, spaceX, marginStart, marginEnd } = useRTLClasses();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchData, setBranchData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [collectionData, setCollectionData] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showOfficerDetails, setShowOfficerDetails] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState('current_month');
  const [viewType, setViewType] = useState('overview'); // overview, performance, officers, analytics
  const [metricType, setMetricType] = useState('collection'); // collection, cases, performance
  
  // Real-time updates
  const { isConnected, lastUpdate } = useRealtimeBranchPerformance(
    branchId,
    (payload) => {
      console.log('Branch performance update:', payload);
      loadBranchDetails();
    }
  );

  // Load branch details
  const loadBranchDetails = async () => {
    try {
      setLoading(true);
      const [branch, performance, officersList, collection] = await Promise.all([
        BranchReportService.getBranchDetails(branchId),
        BranchReportService.getBranchPerformance(branchId, dateRange),
        BranchReportService.getBranchOfficers(branchId),
        BranchReportService.getBranchCollectionData(branchId, dateRange)
      ]);
      
      setBranchData(branch);
      setPerformanceData(performance);
      setOfficers(officersList);
      setCollectionData(collection);
    } catch (error) {
      console.error('Error loading branch details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      loadBranchDetails();
    }
  }, [branchId, dateRange]);

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

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Export functionality
  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        await PrintService.printBranchDetail(branchData, performanceData, officers);
      } else if (format === 'excel') {
        await BranchReportService.exportBranchDetail(branchId, format);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // View officer details
  const handleOfficerClick = (officer) => {
    setSelectedOfficer(officer);
    setShowOfficerDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!branchData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('branchReport.branchNotFound')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <RTLWrapper>
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4", flexRow)}>
          <div className={cn("flex items-center gap-4", flexRow)}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/collection/branch-report')}
              className={cn("gap-2", flexRow)}
            >
              <ChevronLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
              {t('common.back')}
            </Button>
            <div>
              <h1 className={cn("text-2xl md:text-3xl font-bold", textAlign)}>
                {branchData.name}
              </h1>
              <div className={cn("flex items-center gap-2 mt-1", flexRow)}>
                <Badge variant="outline">{branchData.code}</Badge>
                <Badge variant={branchData.isActive ? 'success' : 'secondary'}>
                  {branchData.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {t(`branchReport.regions.${branchData.region?.toLowerCase()}`)}
                </span>
              </div>
            </div>
          </div>
          
          <div className={cn("flex flex-wrap gap-2", flexRow)}>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('common.today')}</SelectItem>
                <SelectItem value="yesterday">{t('common.yesterday')}</SelectItem>
                <SelectItem value="last_7_days">{t('common.last7Days')}</SelectItem>
                <SelectItem value="current_month">{t('common.currentMonth')}</SelectItem>
                <SelectItem value="last_month">{t('common.lastMonth')}</SelectItem>
                <SelectItem value="last_3_months">{t('common.last3Months')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadBranchDetails()}
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
        </div>

        {/* Real-time connection status */}
        {isConnected && (
          <Alert className="bg-green-50 border-green-200">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className={cn("text-green-800", textAlign)}>
              {t('branchReport.realtimeActive')}
              {lastUpdate && ` • ${t('common.lastUpdate')}: ${new Date(lastUpdate).toLocaleTimeString()}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", flexRow)}>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('branchReport.totalCollection')}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(branchData.totalCollection || 0)}
                  </p>
                  <div className={cn("flex items-center gap-1 text-sm mt-1", flexRow)}>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">+12.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", flexRow)}>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('branchReport.performance')}
                  </p>
                  <p className={cn("text-2xl font-bold", getPerformanceColor(branchData.performanceScore || 0))}>
                    {(branchData.performanceScore || 0).toFixed(1)}%
                  </p>
                  <Badge 
                    variant={getPerformanceBadge(branchData.performanceScore || 0).variant}
                    className="mt-1"
                  >
                    {getPerformanceBadge(branchData.performanceScore || 0).text}
                  </Badge>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", flexRow)}>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('branchReport.activeOfficers')}
                  </p>
                  <p className="text-2xl font-bold">
                    {branchData.activeOfficers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('branchReport.totalOfficers')}: {branchData.totalOfficers || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", flexRow)}>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('branchReport.totalCases')}
                  </p>
                  <p className="text-2xl font-bold">
                    {branchData.totalCases || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('branchReport.resolved')}: {branchData.resolvedCases || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={viewType} onValueChange={setViewType} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">{t('branchReport.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="performance">{t('branchReport.tabs.performance')}</TabsTrigger>
            <TabsTrigger value="officers">{t('branchReport.tabs.officers')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('branchReport.tabs.analytics')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branch Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.branchInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.branchCode')}</span>
                    <span className="font-medium">{branchData.code}</span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.region')}</span>
                    <span className="font-medium">
                      {t(`branchReport.regions.${branchData.region?.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.branchType')}</span>
                    <span className="font-medium">
                      {t(`branchTypes.${branchData.type?.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.manager')}</span>
                    <span className="font-medium">{branchData.manager || '-'}</span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.phone')}</span>
                    <span className="font-medium">{branchData.phone || '-'}</span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.email')}</span>
                    <span className="font-medium">{branchData.email || '-'}</span>
                  </div>
                  <div className={cn("flex justify-between", flexRow)}>
                    <span className="text-muted-foreground">{t('branchReport.address')}</span>
                    <span className="font-medium text-right flex-1 ml-4">
                      {branchData.address || '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Collection Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.collectionSummary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className={cn("flex justify-between mb-2", flexRow)}>
                        <span className="text-sm text-muted-foreground">
                          {t('branchReport.collectionProgress')}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(branchData.totalCollection || 0)} / {formatCurrency(branchData.collectionTarget || 0)}
                        </span>
                      </div>
                      <Progress 
                        value={(branchData.totalCollection / branchData.collectionTarget) * 100 || 0} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.todayCollection')}</p>
                        <p className="text-lg font-semibold">{formatCurrency(branchData.todayCollection || 0)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.weekCollection')}</p>
                        <p className="text-lg font-semibold">{formatCurrency(branchData.weekCollection || 0)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.monthCollection')}</p>
                        <p className="text-lg font-semibold">{formatCurrency(branchData.monthCollection || 0)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.yearCollection')}</p>
                        <p className="text-lg font-semibold">{formatCurrency(branchData.yearCollection || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.productDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('products.personal'), value: 35 },
                          { name: t('products.auto'), value: 25 },
                          { name: t('products.mortgage'), value: 20 },
                          { name: t('products.creditCard'), value: 20 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.recentActivities')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { icon: CheckCircle, text: t('branchReport.activities.targetAchieved'), time: '2 hours ago', color: 'text-green-600' },
                      { icon: Users, text: t('branchReport.activities.newOfficerJoined'), time: '5 hours ago', color: 'text-blue-600' },
                      { icon: Trophy, text: t('branchReport.activities.topPerformer'), time: '1 day ago', color: 'text-yellow-600' },
                      { icon: AlertCircle, text: t('branchReport.activities.performanceAlert'), time: '2 days ago', color: 'text-red-600' }
                    ].map((activity, index) => (
                      <div key={index} className={cn("flex items-start gap-3", flexRow)}>
                        <activity.icon className={cn("h-5 w-5 mt-0.5", activity.color)} />
                        <div className="flex-1">
                          <p className="text-sm">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className={cn("flex justify-between items-center", flexRow)}>
                    <CardTitle>{t('branchReport.performanceTrend')}</CardTitle>
                    <Select value={metricType} onValueChange={setMetricType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collection">{t('branchReport.collection')}</SelectItem>
                        <SelectItem value="cases">{t('branchReport.cases')}</SelectItem>
                        <SelectItem value="performance">{t('branchReport.performanceScore')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name={t(`branchReport.${metricType}`)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={t('branchReport.target')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* KPI Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.kpiPerformance')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: t('branchReport.collectionRate'), value: 85, target: 90 },
                      { name: t('branchReport.resolutionRate'), value: 78, target: 80 },
                      { name: t('branchReport.customerSatisfaction'), value: 92, target: 85 },
                      { name: t('branchReport.officerProductivity'), value: 88, target: 85 },
                      { name: t('branchReport.responseTime'), value: 95, target: 90 }
                    ].map((kpi, index) => (
                      <div key={index} className="space-y-2">
                        <div className={cn("flex justify-between text-sm", flexRow)}>
                          <span>{kpi.name}</span>
                          <span className={kpi.value >= kpi.target ? 'text-green-600' : 'text-red-600'}>
                            {kpi.value}% / {kpi.target}%
                          </span>
                        </div>
                        <Progress 
                          value={kpi.value} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.performanceComparison')}</CardTitle>
                  <CardDescription>{t('branchReport.vsOtherBranches')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { metric: t('branchReport.collection'), branch: 85, average: 75 },
                      { metric: t('branchReport.cases'), branch: 78, average: 70 },
                      { metric: t('branchReport.officers'), branch: 92, average: 80 },
                      { metric: t('branchReport.efficiency'), branch: 88, average: 82 },
                      { metric: t('branchReport.quality'), branch: 95, average: 85 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={branchData.name} dataKey="branch" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name={t('branchReport.average')} dataKey="average" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Officers Tab */}
          <TabsContent value="officers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className={cn("flex justify-between items-center", flexRow)}>
                  <div>
                    <CardTitle>{t('branchReport.officersList')}</CardTitle>
                    <CardDescription>
                      {t('branchReport.totalOfficers')}: {officers.length}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t('branchReport.addOfficer')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('branchReport.officer')}</TableHead>
                        <TableHead>{t('branchReport.role')}</TableHead>
                        <TableHead>{t('branchReport.collection')}</TableHead>
                        <TableHead>{t('branchReport.cases')}</TableHead>
                        <TableHead>{t('branchReport.performance')}</TableHead>
                        <TableHead>{t('branchReport.status')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officers.map((officer) => (
                        <TableRow key={officer.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className={cn("flex items-center gap-3", flexRow)}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={officer.avatar} />
                                <AvatarFallback>
                                  {officer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{officer.name}</p>
                                <p className="text-sm text-muted-foreground">{officer.employeeId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{officer.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(officer.totalCollection || 0)}</p>
                              <p className="text-sm text-muted-foreground">
                                {t('branchReport.thisMonth')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{officer.totalCases || 0}</p>
                              <p className="text-sm text-muted-foreground">
                                {t('branchReport.active')}: {officer.activeCases || 0}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={cn("flex items-center gap-2", flexRow)}>
                                <Progress 
                                  value={officer.performanceScore || 0} 
                                  className="h-2 w-20"
                                />
                                <span className={cn("text-sm font-medium", getPerformanceColor(officer.performanceScore || 0))}>
                                  {officer.performanceScore?.toFixed(1)}%
                                </span>
                              </div>
                              <Badge 
                                variant={getPerformanceBadge(officer.performanceScore || 0).variant}
                                className="text-xs"
                              >
                                {getPerformanceBadge(officer.performanceScore || 0).text}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={officer.status === 'active' ? 'success' : 'secondary'}
                            >
                              {officer.status === 'active' ? t('common.active') : t('common.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOfficerClick(officer)}
                              className={cn("gap-1", flexRow)}
                            >
                              <Eye className="h-4 w-4" />
                              {t('common.view')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {t('branchReport.topCollector')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {officers[0] && (
                    <div className="space-y-3">
                      <div className={cn("flex items-center gap-3", flexRow)}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={officers[0].avatar} />
                          <AvatarFallback>
                            {officers[0].name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{officers[0].name}</p>
                          <p className="text-sm text-muted-foreground">{officers[0].role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.collection')}</span>
                          <span className="font-medium">{formatCurrency(officers[0].totalCollection || 0)}</span>
                        </div>
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.cases')}</span>
                          <span className="font-medium">{officers[0].totalCases || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-blue-500" />
                    {t('branchReport.mostEfficient')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {officers[1] && (
                    <div className="space-y-3">
                      <div className={cn("flex items-center gap-3", flexRow)}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={officers[1].avatar} />
                          <AvatarFallback>
                            {officers[1].name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{officers[1].name}</p>
                          <p className="text-sm text-muted-foreground">{officers[1].role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.efficiency')}</span>
                          <span className="font-medium">{officers[1].efficiency || 0}%</span>
                        </div>
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.responseTime')}</span>
                          <span className="font-medium">{officers[1].avgResponseTime || 0}h</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    {t('branchReport.bestPerformer')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {officers[2] && (
                    <div className="space-y-3">
                      <div className={cn("flex items-center gap-3", flexRow)}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={officers[2].avatar} />
                          <AvatarFallback>
                            {officers[2].name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{officers[2].name}</p>
                          <p className="text-sm text-muted-foreground">{officers[2].role}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.performance')}</span>
                          <span className="font-medium">{officers[2].performanceScore || 0}%</span>
                        </div>
                        <div className={cn("flex justify-between", flexRow)}>
                          <span className="text-sm text-muted-foreground">{t('branchReport.satisfaction')}</span>
                          <span className="font-medium">{officers[2].customerSatisfaction || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collection by Product */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.collectionByProduct')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { product: t('products.personal'), amount: 450000, cases: 120 },
                      { product: t('products.auto'), amount: 320000, cases: 85 },
                      { product: t('products.mortgage'), amount: 280000, cases: 45 },
                      { product: t('products.creditCard'), amount: 180000, cases: 200 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="amount" fill="#3b82f6" name={t('branchReport.amount')} />
                      <Bar yAxisId="right" dataKey="cases" fill="#10b981" name={t('branchReport.cases')} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Delinquency Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.delinquencyAnalysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('delinquency.current'), value: 60 },
                          { name: t('delinquency.bucket1to30'), value: 20 },
                          { name: t('delinquency.bucket31to60'), value: 10 },
                          { name: t('delinquency.bucket61to90'), value: 7 },
                          { name: t('delinquency.bucket90Plus'), value: 3 }
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
                        <Cell fill="#ef4444" />
                        <Cell fill="#dc2626" />
                        <Cell fill="#991b1b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Collection Efficiency */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('branchReport.collectionEfficiency')}</CardTitle>
                  <CardDescription>{t('branchReport.hourlyDistribution')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { hour: '8AM', calls: 20, collections: 5 },
                      { hour: '9AM', calls: 45, collections: 12 },
                      { hour: '10AM', calls: 60, collections: 18 },
                      { hour: '11AM', calls: 55, collections: 20 },
                      { hour: '12PM', calls: 30, collections: 10 },
                      { hour: '1PM', calls: 25, collections: 8 },
                      { hour: '2PM', calls: 50, collections: 15 },
                      { hour: '3PM', calls: 48, collections: 16 },
                      { hour: '4PM', calls: 40, collections: 14 },
                      { hour: '5PM', calls: 35, collections: 12 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={t('branchReport.calls')} />
                      <Area type="monotone" dataKey="collections" stackId="1" stroke="#10b981" fill="#10b981" name={t('branchReport.successfulCollections')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Segment Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.customerSegmentAnalysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { segment: t('customerSegments.retail'), count: 450, amount: 2500000, percentage: 45 },
                      { segment: t('customerSegments.sme'), count: 250, amount: 1800000, percentage: 25 },
                      { segment: t('customerSegments.corporate'), count: 150, amount: 3200000, percentage: 20 },
                      { segment: t('customerSegments.vip'), count: 50, amount: 1500000, percentage: 10 }
                    ].map((segment, index) => (
                      <div key={index} className="space-y-2">
                        <div className={cn("flex justify-between items-center", flexRow)}>
                          <span className="font-medium">{segment.segment}</span>
                          <span className="text-sm text-muted-foreground">
                            {segment.count} {t('branchReport.customers')}
                          </span>
                        </div>
                        <Progress value={segment.percentage} className="h-2" />
                        <div className={cn("flex justify-between text-sm text-muted-foreground", flexRow)}>
                          <span>{formatCurrency(segment.amount)}</span>
                          <span>{segment.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collection Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('branchReport.collectionMethods')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { method: t('branchReport.methods.fieldVisit'), count: 120, success: 85 },
                      { method: t('branchReport.methods.phoneCalls'), count: 450, success: 65 },
                      { method: t('branchReport.methods.sms'), count: 800, success: 45 },
                      { method: t('branchReport.methods.email'), count: 350, success: 55 },
                      { method: t('branchReport.methods.digital'), count: 200, success: 75 }
                    ]} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="method" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name={t('branchReport.attempts')} />
                      <Bar dataKey="success" fill="#10b981" name={t('branchReport.successRate')} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Officer Details Dialog */}
        {showOfficerDetails && selectedOfficer && (
          <Dialog open={showOfficerDetails} onOpenChange={setShowOfficerDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('branchReport.officerDetails')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className={cn("flex items-center gap-4", flexRow)}>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedOfficer.avatar} />
                    <AvatarFallback>
                      {selectedOfficer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedOfficer.name}</h3>
                    <p className="text-muted-foreground">{selectedOfficer.role}</p>
                    <div className={cn("flex items-center gap-4 mt-2", flexRow)}>
                      <div className={cn("flex items-center gap-1 text-sm", flexRow)}>
                        <Mail className="h-4 w-4" />
                        {selectedOfficer.email}
                      </div>
                      <div className={cn("flex items-center gap-1 text-sm", flexRow)}>
                        <Phone className="h-4 w-4" />
                        {selectedOfficer.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.totalCollection')}</p>
                        <p className="text-2xl font-bold">{formatCurrency(selectedOfficer.totalCollection || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t('branchReport.performance')}</p>
                        <p className="text-2xl font-bold">{selectedOfficer.performanceScore}%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('branchReport.recentPerformance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[
                        { day: 'Mon', collections: 5, cases: 12 },
                        { day: 'Tue', collections: 8, cases: 15 },
                        { day: 'Wed', collections: 6, cases: 10 },
                        { day: 'Thu', collections: 10, cases: 18 },
                        { day: 'Fri', collections: 7, cases: 14 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="collections" stroke="#3b82f6" name={t('branchReport.collections')} />
                        <Line type="monotone" dataKey="cases" stroke="#10b981" name={t('branchReport.casesHandled')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </RTLWrapper>
  );
};

export default BranchReportDetail;