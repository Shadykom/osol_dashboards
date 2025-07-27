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
  ArrowDownRight, Loader2, MapPin, BarChart3, Trophy
} from 'lucide-react';
import { BranchReportService } from '@/services/branchReportService';

const BranchLevelReport = () => {
  const { t } = useTranslation();
  
  // State Management
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showOfficerDetails, setShowOfficerDetails] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('current_month');
  const [productType, setProductType] = useState('all');
  const [delinquencyBucket, setDelinquencyBucket] = useState('all');
  const [customerType, setCustomerType] = useState('all');
  const [showComparison, setShowComparison] = useState(true);

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load report data when branch or filters change
  useEffect(() => {
    if (selectedBranch) {
      loadBranchReport();
    }
  }, [selectedBranch, dateRange, productType, delinquencyBucket, customerType]);

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
        productType,
        delinquencyBucket,
        customerType,
        comparison: showComparison
      };
      
      const result = await BranchReportService.getBranchReport(selectedBranch, filters);
      if (result.success && result.data) {
        setReportData(result.data);
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
      const result = await BranchReportService.exportBranchReport(selectedBranch, format, {
        dateRange,
        productType,
        delinquencyBucket,
        customerType
      });
      
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Format functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num || 0);
  };

  const formatPercentage = (value) => {
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

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                              <Building2 className="h-8 w-8 text-primary" />
              {t('branchReport.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('branchReport.subtitle')}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-64">
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
            
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">الشهر الحالي</SelectItem>
              <SelectItem value="last_month">الشهر الماضي</SelectItem>
              <SelectItem value="current_quarter">الربع الحالي</SelectItem>
              <SelectItem value="current_year">السنة الحالية</SelectItem>
            </SelectContent>
          </Select>

          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المنتجات</SelectItem>
              <SelectItem value="Tawarruq">قرض تورق</SelectItem>
              <SelectItem value="Cash">قرض كاش</SelectItem>
              <SelectItem value="Auto">تمويل سيارات</SelectItem>
              <SelectItem value="Real Estate">تمويل عقاري</SelectItem>
            </SelectContent>
          </Select>

          <Select value={delinquencyBucket} onValueChange={setDelinquencyBucket}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="current">جاري</SelectItem>
              <SelectItem value="1-30">1-30 يوم</SelectItem>
              <SelectItem value="31-60">31-60 يوم</SelectItem>
              <SelectItem value="61-90">61-90 يوم</SelectItem>
              <SelectItem value="90+">أكثر من 90 يوم</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerType} onValueChange={setCustomerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع العملاء</SelectItem>
              <SelectItem value="INDIVIDUAL">أفراد</SelectItem>
              <SelectItem value="CORPORATE">شركات</SelectItem>
              <SelectItem value="SME">منشآت صغيرة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {reportData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">إجمالي المحفظة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary?.totalPortfolio)}
                </div>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatNumber(reportData.summary?.totalLoans)} قرض
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">المتأخرات</CardTitle>
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
                <CardTitle className="text-sm font-medium text-gray-600">الحالات النشطة</CardTitle>
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
            <TabsList className="grid w-full grid-cols-6 bg-white">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="officers">أداء الأخصائيين</TabsTrigger>
              <TabsTrigger value="products">تحليل المنتجات</TabsTrigger>
              <TabsTrigger value="delinquency">توزيع التقادم</TabsTrigger>
              <TabsTrigger value="communication">التواصل</TabsTrigger>
              <TabsTrigger value="comparison">المقارنات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>اتجاهات الأداء</CardTitle>
                  <CardDescription>تطور معدلات التعثر والتحصيل خلال الأشهر الماضية</CardDescription>
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
                        name="معدل التعثر %"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="collectionRate"
                        stroke={COLORS.success}
                        strokeWidth={3}
                        name="معدل التحصيل %"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="newCases"
                        fill={COLORS.warning}
                        name="حالات جديدة"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Portfolio at Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>المحفظة المعرضة للخطر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">PAR 30+</span>
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
                            <p className="text-sm text-gray-600">قروض متعثرة</p>
                            <p className="text-2xl font-bold text-red-600">
                              {formatNumber(reportData.summary?.overdueLoans)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">متوسط التأخير</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {reportData.summary?.avgDPD?.toFixed(1)} يوم
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>أداء الفرع مقابل المتوسط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={[
                        {
                          metric: 'معدل التعثر',
                          branch: reportData.summary?.delinquencyRate,
                          company: reportData.branchComparison?.companyAverage?.delinquencyRate
                        },
                        {
                          metric: 'معدل التحصيل',
                          branch: reportData.summary?.collectionRate,
                          company: reportData.branchComparison?.companyAverage?.collectionRate
                        },
                        {
                          metric: 'الحالات النشطة',
                          branch: (reportData.summary?.activeCases / reportData.summary?.totalLoans) * 100,
                          company: 15
                        },
                        {
                          metric: 'جودة المحفظة',
                          branch: 100 - reportData.summary?.portfolioAtRisk,
                          company: 85
                        }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis />
                        <Radar
                          name="الفرع"
                          dataKey="branch"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="متوسط الشركة"
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
                      أفضل الأخصائيين أداءً
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
                                {officer.totalCases} حالة | {formatCurrency(officer.totalOutstanding)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {officer.performance.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-600">الأداء</p>
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
                      يحتاجون إلى دعم
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
                                معدل الاتصال: {officer.contactRate.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-600">
                                PTP: {officer.ptpRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            عرض التفاصيل
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
                  <CardTitle>جميع أخصائيي التحصيل في الفرع</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الأخصائي</TableHead>
                          <TableHead className="text-center">الحالات</TableHead>
                          <TableHead className="text-center">المبلغ المستحق</TableHead>
                          <TableHead className="text-center">المكالمات</TableHead>
                          <TableHead className="text-center">وعود الدفع</TableHead>
                          <TableHead className="text-center">معدل الاتصال</TableHead>
                          <TableHead className="text-center">معدل PTP</TableHead>
                          <TableHead className="text-center">الأداء</TableHead>
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
                                  ({officer.keptPTPs} محقق)
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
                  <CardTitle>أداء المنتجات التمويلية</CardTitle>
                  <CardDescription>تحليل معدلات التعثر والتحصيل حسب نوع المنتج</CardDescription>
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
                        name="عدد القروض"
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="overdueLoans" 
                        fill={COLORS.danger} 
                        name="قروض متعثرة"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="delinquencyRate"
                        stroke={COLORS.warning}
                        strokeWidth={3}
                        name="معدل التعثر %"
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
                          <span className="text-sm text-gray-600">حجم المحفظة</span>
                          <span className="font-bold">{formatCurrency(product.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">عدد القروض</span>
                          <span className="font-bold">{formatNumber(product.totalLoans)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">معدل التعثر</span>
                          <Badge 
                            variant={product.delinquencyRate > 15 ? 'destructive' : 'secondary'}
                          >
                            {formatPercentage(product.delinquencyRate)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">متوسط التأخير</span>
                          <span className="font-medium">{product.avgDPD.toFixed(0)} يوم</span>
                        </div>
                        <Progress 
                          value={product.portfolioShare} 
                          className="h-2 mt-2"
                        />
                        <p className="text-xs text-center text-gray-600">
                          {formatPercentage(product.portfolioShare)} من المحفظة
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
                  <CardTitle>توزيع المتأخرات حسب فئات التقادم</CardTitle>
                  <CardDescription>تحليل المحفظة حسب عدد أيام التأخير</CardDescription>
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
                              {formatNumber(bucket.count)} قرض ({formatPercentage(bucket.percentage)})
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
                  <CardTitle>مؤشرات الخطر</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>تنبيه:</strong> {reportData.summary?.overdueLoans} قرض في حالة تأخر،
                      منها {reportData.delinquencyDistribution?.find(d => d.bucket === '61-90')?.count || 0} قرض
                      في المرحلة الحرجة (61-90 يوم) تحتاج إلى تدخل عاجل
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-sm text-gray-600">مرحلة التنبيه</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reportData.delinquencyDistribution?.find(d => d.bucket === '1-30')?.count || 0}
                      </p>
                      <p className="text-xs text-gray-600">1-30 يوم</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-sm text-gray-600">مرحلة الخطر</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reportData.delinquencyDistribution?.find(d => d.bucket === '31-60')?.count || 0}
                      </p>
                      <p className="text-xs text-gray-600">31-60 يوم</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <p className="text-sm text-gray-600">مرحلة حرجة</p>
                      <p className="text-2xl font-bold text-red-600">
                        {(reportData.delinquencyDistribution?.find(d => d.bucket === '61-90')?.count || 0) +
                         (reportData.delinquencyDistribution?.find(d => d.bucket === '91-180')?.count || 0)}
                      </p>
                      <p className="text-xs text-gray-600">أكثر من 60 يوم</p>
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
                      إجمالي المكالمات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(reportData.communicationStats?.summary?.totalCalls)}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      متوسط {reportData.communicationStats?.summary?.avgCallsPerCase?.toFixed(1)} مكالمة/حالة
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      الرسائل المرسلة
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
                    <CardTitle className="text-sm">معدل الاستجابة</CardTitle>
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
                    <CardTitle className="text-sm">وعود الدفع من المكالمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(reportData.communicationStats?.ptpFromCalls)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      معدل {formatPercentage(reportData.communicationStats?.effectiveness?.promiseRate)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Call Outcomes */}
              <Card>
                <CardHeader>
                  <CardTitle>نتائج المكالمات</CardTitle>
                  <CardDescription>تحليل نتائج محاولات الاتصال بالعملاء</CardDescription>
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
                  <CardTitle>توزيع التواصل اليومي</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.communicationStats?.dailyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="calls" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} name="مكالمات" />
                      <Area type="monotone" dataKey="sms" stackId="1" stroke={COLORS.info} fill={COLORS.info} name="رسائل نصية" />
                      <Area type="monotone" dataKey="emails" stackId="1" stroke={COLORS.secondary} fill={COLORS.secondary} name="بريد إلكتروني" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {/* Branch Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle>ترتيب الفرع مقابل الفروع الأخرى</CardTitle>
                  <CardDescription>مقارنة أداء الفرع مع جميع فروع الشركة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Ranking Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600">الترتيب العام</p>
                        <p className="text-3xl font-bold text-blue-600">
                          #{Math.round((reportData.branchComparison?.rankings?.collectionRank + 
                                       reportData.branchComparison?.rankings?.delinquencyRank) / 2)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          من {reportData.branchComparison?.rankings?.totalBranches} فرع
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-gray-600">ترتيب التحصيل</p>
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
                        <p className="text-sm text-gray-600">ترتيب التعثر</p>
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
                        <Bar yAxisId="left" dataKey="delinquencyRate" fill={COLORS.danger} name="معدل التعثر %" />
                        <Bar yAxisId="left" dataKey="collectionRate" fill={COLORS.success} name="معدل التحصيل %" />
                        <Line yAxisId="right" type="monotone" dataKey="portfolioSize" stroke={COLORS.primary} strokeWidth={3} name="حجم المحفظة" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Performance vs Company Average */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">الفرع مقابل متوسط الشركة</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">معدل التعثر</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatPercentage(reportData.summary?.delinquencyRate)}</span>
                              <span className="text-sm text-gray-500">vs</span>
                              <span className="text-sm text-gray-600">
                                {formatPercentage(reportData.branchComparison?.companyAverage?.delinquencyRate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">معدل التحصيل</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatPercentage(reportData.summary?.collectionRate)}</span>
                              <span className="text-sm text-gray-500">vs</span>
                              <span className="text-sm text-gray-600">
                                {formatPercentage(reportData.branchComparison?.companyAverage?.collectionRate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">حجم المحفظة</span>
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
                        <h4 className="font-medium mb-3">مؤشرات الأداء</h4>
                        <div className="space-y-3">
                          {reportData.branchComparison?.performance?.vsCompanyAvg?.delinquencyRate < 0 ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">معدل تعثر أقل من المتوسط</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">معدل تعثر أعلى من المتوسط</span>
                            </div>
                          )}
                          
                          {reportData.branchComparison?.performance?.vsCompanyAvg?.collectionRate > 0 ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">معدل تحصيل أفضل من المتوسط</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">معدل تحصيل أقل من المتوسط</span>
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
            <DialogTitle>تفاصيل أداء الأخصائي</DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن أداء {selectedOfficer?.officerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOfficer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">النوع</p>
                  <p className="font-medium">{selectedOfficer.officerType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الحالات</p>
                  <p className="font-medium">{formatNumber(selectedOfficer.totalCases)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المبلغ المستحق</p>
                  <p className="font-medium">{formatCurrency(selectedOfficer.totalOutstanding)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">معدل الأداء</p>
                  <p className="font-medium">{selectedOfficer.performance.toFixed(1)}%</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">مؤشرات الأداء</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">معدل الاتصال</span>
                      <span className="text-sm font-medium">{selectedOfficer.contactRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedOfficer.contactRate} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">معدل وعود الدفع</span>
                      <span className="text-sm font-medium">{selectedOfficer.ptpRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedOfficer.ptpRate * 10} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">معدل تحقيق الوعود</span>
                      <span className="text-sm font-medium">{selectedOfficer.ptpFulfillmentRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedOfficer.ptpFulfillmentRate} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOfficerDetails(false)}>
                  إغلاق
                </Button>
                <Button onClick={() => window.location.href = `/collection/specialist-report?id=${selectedOfficer.officerId}`}>
                  عرض التقرير الكامل
                  <ChevronRight className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add separator component
const Separator = () => <div className="border-t my-4" />;

export default BranchLevelReport;