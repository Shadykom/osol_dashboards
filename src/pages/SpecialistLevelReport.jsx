import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber as formatNumberUtil, formatCurrency as formatCurrencyUtil } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, Treemap, Funnel, FunnelChart
} from 'recharts';
import { 
  User, Phone, Mail, Calendar as CalendarIcon, DollarSign, AlertTriangle,
  FileText, Download, RefreshCw, Filter, Search, Target, BarChart3,
  TrendingUp, Clock, MessageSquare, PhoneCall, CheckCircle, Activity,
  XCircle, Loader2, FileDown, Eye, ChevronRight, Settings, Save,
  MoreVertical, ChevronDown, ChevronUp, Zap, Shield, Brain,
  Users, Building2, CreditCard, AlertCircle, TrendingDown,
  ArrowUp, ArrowDown, Info, Play, Pause, SkipForward, History,
  Layers, Map, PieChart as PieChartIcon, LineChart as LineChartIcon, BarChart as BarChartIcon
} from 'lucide-react';
import specialistReportService from '@/services/specialistReportService';
import reportService from '@/services/reportService';

// Use the existing service instance
const specialistService = specialistReportService;

const SpecialistLevelReport = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [specialists, setSpecialists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [customReportConfig, setCustomReportConfig] = useState({
    reportType: '',
    period: '',
    contents: []
  });
  const [dbConnectionIssue, setDbConnectionIssue] = useState(false);
  
  // Advanced filter states
  const [filters, setFilters] = useState({
    dateRange: 'current_month',
    loanStatus: 'all',
    delinquencyBucket: 'all',
    customerType: 'all',
    productType: 'all',
    ptpStatus: 'all',
    minAmount: 0,
    maxAmount: 10000000,
    minDPD: 0,
    maxDPD: 360,
    riskLevel: 'all',
    lastContactResult: 'all',
    communicationChannel: 'all'
  });

  // Filter presets
  const [filterPresets] = useState([
    { name: 'High Risk', filters: { riskLevel: 'high', minDPD: 90 } },
    { name: 'Active Promises', filters: { ptpStatus: 'active' } },
    { name: 'Large Loans', filters: { minAmount: 1000000 } }
  ]);

  useEffect(() => {
    fetchSpecialists();
  }, []);

  useEffect(() => {
    if (selectedSpecialist) {
      fetchReportData();
    }
  }, [selectedSpecialist, filters]);

  useEffect(() => {
    if (activeView === 'reports' && selectedSpecialist) {
      fetchReports();
    }
  }, [activeView, selectedSpecialist]);

  const fetchSpecialists = async () => {
    try {
      const result = await specialistService.getSpecialists();
      if (result.success && result.data) {
        setSpecialists(result.data);
        
        // Check if we're using mock data (which indicates a database issue)
        if (result.data.length > 0 && result.data[0].officer_id === 'SP001') {
          setDbConnectionIssue(true);
        }
        
        if (result.data.length > 0 && !selectedSpecialist) {
          setSelectedSpecialist(result.data[0].officer_id);
        }
      } else {
        setError('Failed to fetch specialists list');
      }
    } catch (error) {
      console.error('Error fetching specialists:', error);
      setError('An error occurred while fetching data');
      setDbConnectionIssue(true);
    }
  };

  const fetchReportData = async () => {
    if (!selectedSpecialist) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await specialistService.getSpecialistReport(selectedSpecialist, filters);
      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        setError('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
              setError('An error occurred while fetching report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedSpecialist) return;
    
    try {
      setLoadingReports(true);
      
      // Fetch all three report types in parallel
      const [monthlyReport, portfolioReport, trendsReport] = await Promise.all([
        reportService.getMonthlyPerformanceReport({ specialistId: selectedSpecialist }),
        reportService.getDetailedPortfolioReport({ specialistId: selectedSpecialist }),
        reportService.getTrendsReport({ specialistId: selectedSpecialist })
      ]);
      
      const reportsData = [
        {
          title: 'تقرير الأداء الشهري',
          description: 'ملخص شامل لأداء الشهر الحالي',
          icon: BarChartIcon,
          lastGenerated: monthlyReport.data?.generatedAt ? new Date(monthlyReport.data.generatedAt).toLocaleDateString('ar') : 'غير متوفر',
          format: 'PDF',
          data: monthlyReport.data,
          type: 'monthly'
        },
        {
          title: 'تقرير المحفظة التفصيلي',
          description: 'تحليل مفصل لجميع القروض في المحفظة',
          icon: PieChartIcon,
          lastGenerated: portfolioReport.data?.generatedAt ? new Date(portfolioReport.data.generatedAt).toLocaleDateString('ar') : 'غير متوفر',
          format: 'Excel',
          data: portfolioReport.data,
          type: 'portfolio'
        },
        {
          title: 'تقرير الاتجاهات',
          description: 'تحليل الاتجاهات والتوقعات المستقبلية',
          icon: LineChartIcon,
          lastGenerated: trendsReport.data?.generatedAt ? new Date(trendsReport.data.generatedAt).toLocaleDateString('ar') : 'غير متوفر',
          format: 'PDF',
          data: trendsReport.data,
          type: 'trends'
        }
      ];
      
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const result = await reportService.exportReport(report.data, report.format.toLowerCase());
      if (result.success) {
        // Here you would implement actual file download logic
        console.log('Report exported:', result.data);
        // For now, just show a success message
        alert(`تم تحميل ${report.title} بنجاح`);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('فشل تحميل التقرير');
    }
  };

  const handleGenerateCustomReport = async () => {
    try {
      setLoadingReports(true);
      const result = await reportService.generateCustomReport({
        ...customReportConfig,
        filters: { specialistId: selectedSpecialist, ...filters }
      });
      
      if (result.success) {
        alert('تم إنشاء التقرير المخصص بنجاح');
        // You can add the custom report to the reports list or handle it differently
      }
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('فشل إنشاء التقرير المخصص');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  const applyFilterPreset = (preset) => {
    setFilters({ ...filters, ...preset.filters });
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount || 0);
  };

  const formatNumber = (num) => {
    return formatNumberUtil(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
    } catch {
      return dateString;
    }
  };

  const getDelinquencyColor = (bucket) => {
    const colors = {
      'Current': 'text-green-600 bg-green-50',
      '1-30 Days': 'text-yellow-600 bg-yellow-50',
      '31-60 Days': 'text-orange-600 bg-orange-50',
      '61-90 Days': 'text-red-600 bg-red-50',
      '91-180 Days': 'text-red-700 bg-red-100',
      '181-360 Days': 'text-red-800 bg-red-200',
      '>360 Days': 'text-red-900 bg-red-300'
    };
    return colors[bucket] || 'text-gray-600 bg-gray-50';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Filter sidebar component
  const FilterSidebar = () => (
    <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('specialistLevelReport.filters.title')}</SheetTitle>
          <SheetDescription>
            {t('specialistLevelReport.filters.description')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Filter Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('specialistLevelReport.filters.quickSettings')}</Label>
            <div className="space-y-2">
              {filterPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => applyFilterPreset(preset)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('specialistLevelReport.filters.dateRange')}</Label>
            <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('specialistLevelReport.filters.today')}</SelectItem>
                <SelectItem value="yesterday">{t('specialistLevelReport.filters.yesterday')}</SelectItem>
                <SelectItem value="last_7_days">{t('specialistLevelReport.filters.last7Days')}</SelectItem>
                <SelectItem value="current_month">{t('specialistLevelReport.filters.currentMonth')}</SelectItem>
                <SelectItem value="last_month">{t('specialistLevelReport.filters.lastMonth')}</SelectItem>
                <SelectItem value="current_quarter">{t('specialistLevelReport.filters.currentQuarter')}</SelectItem>
                <SelectItem value="current_year">{t('specialistLevelReport.filters.currentYear')}</SelectItem>
                <SelectItem value="custom">{t('specialistLevelReport.filters.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {t('specialistLevelReport.filters.amountRange')}: {formatCurrency(filters.minAmount)} - {formatCurrency(filters.maxAmount)}
            </Label>
            <div className="space-y-3">
              <Slider
                value={[filters.minAmount]}
                onValueChange={([value]) => setFilters({...filters, minAmount: value})}
                max={10000000}
                step={100000}
                className="w-full"
              />
              <Slider
                value={[filters.maxAmount]}
                onValueChange={([value]) => setFilters({...filters, maxAmount: value})}
                max={10000000}
                step={100000}
                className="w-full"
              />
            </div>
          </div>
          
          {/* DPD Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              أيام التأخير: {filters.minDPD} - {filters.maxDPD} يوم
            </Label>
            <div className="space-y-3">
              <Slider
                value={[filters.minDPD]}
                onValueChange={([value]) => setFilters({...filters, minDPD: value})}
                max={360}
                step={1}
                className="w-full"
              />
              <Slider
                value={[filters.maxDPD]}
                onValueChange={([value]) => setFilters({...filters, maxDPD: value})}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Risk Level */}
          <div>
            <Label className="text-sm font-medium mb-3 block">مستوى المخاطر</Label>
            <Select value={filters.riskLevel} onValueChange={(value) => setFilters({...filters, riskLevel: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="very_low">منخفض جداً</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="very_high">عالي جداً</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Communication Channel */}
          <div>
            <Label className="text-sm font-medium mb-3 block">قناة التواصل</Label>
            <Select value={filters.communicationChannel} onValueChange={(value) => setFilters({...filters, communicationChannel: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع القنوات</SelectItem>
                <SelectItem value="phone">المكالمات</SelectItem>
                <SelectItem value="sms">الرسائل النصية</SelectItem>
                <SelectItem value="email">البريد الإلكتروني</SelectItem>
                <SelectItem value="whatsapp">واتساب</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => setShowFilterSheet(false)}
            >
              تطبيق الفلاتر
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  dateRange: 'current_month',
                  loanStatus: 'all',
                  delinquencyBucket: 'all',
                  customerType: 'all',
                  productType: 'all',
                  ptpStatus: 'all',
                  minAmount: 0,
                  maxAmount: 10000000,
                  minDPD: 0,
                  maxDPD: 360,
                  riskLevel: 'all',
                  lastContactResult: 'all',
                  communicationChannel: 'all'
                });
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Loan detail modal
  const LoanDetailModal = ({ loan, isOpen, onClose }) => {
    if (!loan) return null;
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل القرض - {loan.loanNumber}</DialogTitle>
            <DialogDescription>
              معلومات شاملة عن القرض والعميل
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">معلومات العميل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم</span>
                    <span className="font-medium">{loan.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الهوية</span>
                    <span className="font-medium">{loan.customerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الجوال</span>
                    <span className="font-medium">{loan.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع العميل</span>
                    <Badge variant="outline">{loan.customerType}</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">معلومات القرض</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع المنتج</span>
                    <span className="font-medium">{loan.productType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">قيمة القرض</span>
                    <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المسدد</span>
                    <span className="font-medium text-green-600">{formatCurrency(loan.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المتأخر</span>
                    <span className="font-medium text-red-600">{formatCurrency(loan.totalOverdueAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Risk Assessment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  تقييم المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مؤشر المخاطر</span>
                    <div className="flex items-center gap-2">
                      <Progress value={loan.riskScore} className="w-24" />
                      <span className="text-sm font-medium">{loan.riskScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">احتمالية التحصيل</span>
                    <div className="flex items-center gap-2">
                      <Progress value={loan.collectionProbability} className="w-24" />
                      <span className="text-sm font-medium">{loan.collectionProbability?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">سلوك الدفع</span>
                    <div className="flex items-center gap-2">
                      <Progress value={loan.behaviorScore} className="w-24" />
                      <span className="text-sm font-medium">{loan.behaviorScore}/100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Communication History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  سجل التواصل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>آخر اتصال</span>
                    <span className="font-medium">{loan.lastContactDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>النتيجة</span>
                    <Badge variant="outline">{loan.lastCallResult}</Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <PhoneCall className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <span className="text-sm font-medium">{loan.callsThisMonth}</span>
                      <p className="text-xs text-muted-foreground">مكالمة</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <MessageSquare className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">{loan.messagesThisMonth}</span>
                      <p className="text-xs text-muted-foreground">رسالة</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <Mail className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <span className="text-sm font-medium">3</span>
                      <p className="text-xs text-muted-foreground">بريد</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1">
                <PhoneCall className="h-4 w-4 mr-2" />
                اتصال مباشر
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                إرسال رسالة
              </Button>
              <Button variant="outline" className="flex-1">
                <CalendarIcon className="h-4 w-4 mr-2" />
                جدولة موعد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Process data for charts and analytics
  const processChartData = () => {
    if (!reportData) return {};

    // Process communication data for bar chart
    const communicationChartData = reportData.communicationData || [];
    
    // Process trend data
    const trendData = reportData.trends || [];
    
    // Process promises data for pie chart
    const promiseChartData = reportData.promisesToPay ? [
      { 
        name: 'محقق', 
        value: reportData.promisesToPay.filter(p => p.status === 'KEPT').length, 
        color: '#22c55e' 
      },
      { 
        name: 'قيد الانتظار', 
        value: reportData.promisesToPay.filter(p => p.status === 'ACTIVE').length, 
        color: '#f59e0b' 
      },
      { 
        name: 'غير محقق', 
        value: reportData.promisesToPay.filter(p => p.status === 'BROKEN').length, 
        color: '#ef4444' 
      }
    ] : [];

    // Process portfolio distribution from loans
    const portfolioDistribution = processPortfolioDistribution(reportData.loans);

    return {
      communicationChartData,
      trendData,
      promiseChartData,
      portfolioDistribution
    };
  };

  const processPortfolioDistribution = (loans) => {
    if (!loans || loans.length === 0) return [];
    
    const distribution = {};
    loans.forEach(loan => {
      const product = loan.productType || 'غير محدد';
      if (!distribution[product]) {
        distribution[product] = { name: product, value: 0, amount: 0 };
      }
      distribution[product].value++;
      distribution[product].amount += loan.loanAmount || 0;
    });
    
    return Object.values(distribution);
  };

  const chartData = processChartData();

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full"
              onClick={() => {
                setError(null);
                fetchSpecialists();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterSidebar />
      
      {/* Database Connection Alert */}
      {dbConnectionIssue && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-semibold mb-2">Database Connection Issue</div>
            <div className="text-sm space-y-2">
              <p>The application is currently using sample data because the database schema is not properly configured.</p>
              <p className="font-medium">To fix this issue:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to your <a href="https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase project settings</a></li>
                <li>In the "Exposed schemas" section, add: <code className="bg-orange-100 px-1 py-0.5 rounded">kastle_banking</code></li>
                <li>Click "Save" to apply the changes</li>
                <li>Refresh this page to see real data</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('specialistLevelReport.title')}</h1>
              <p className="text-gray-600 mt-1">{t('specialistLevelReport.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder={t('specialistLevelReport.selectSpecialist')} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists.map(specialist => (
                      <SelectItem key={specialist.officer_id} value={specialist.officer_id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {specialist.officer_name} - {specialist.officer_type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowFilterSheet(true)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh} 
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {['dashboard', 'portfolio', 'communication', 'analytics', 'timeline', 'reports'].map((view) => (
              <Button
                key={view}
                variant={activeView === view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView(view)}
                className="min-w-fit"
              >
                {view === 'dashboard' && <BarChart3 className="h-4 w-4 mr-2" />}
                {view === 'portfolio' && <Layers className="h-4 w-4 mr-2" />}
                {view === 'communication' && <Phone className="h-4 w-4 mr-2" />}
                {view === 'analytics' && <Brain className="h-4 w-4 mr-2" />}
                {view === 'timeline' && <Clock className="h-4 w-4 mr-2" />}
                {view === 'reports' && <FileText className="h-4 w-4 mr-2" />}
                {view === 'dashboard' && t('specialistLevelReport.tabs.portfolio')}
                {view === 'portfolio' && t('specialistLevelReport.tabs.portfolio')}
                {view === 'communication' && 'سجل التواصل'}
                {view === 'analytics' && t('specialistLevelReport.tabs.activities')}
                {view === 'timeline' && t('specialistLevelReport.tabs.collections')}
                {view === 'reports' && t('specialistLevelReport.tabs.reports')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {reportData && (
          <>
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                {/* Enhanced KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {[
                    { 
                      title: t('specialistLevelReport.metrics.loansMissed'), 
                      value: reportData.kpis?.totalLoans || 0, 
                      change: '+12%', 
                      icon: CreditCard, 
                      color: 'blue',
                      subValue: `${reportData.kpis?.overdueLoans || 0} ${t('specialistLevelReport.metrics.loansCount')}`
                    },
                    { 
                      title: t('specialistLevelReport.metrics.collectionValue'), 
                      value: formatCurrency(reportData.kpis?.totalPortfolioValue || 0), 
                      change: '+8%', 
                      icon: DollarSign, 
                      color: 'green',
                      subValue: formatCurrency(reportData.kpis?.totalOverdueAmount || 0)
                    },
                    { 
                      title: t('specialistLevelReport.metrics.collectionRate'), 
                      value: `${reportData.kpis?.collectionRate || 0}%`, 
                      change: '+5%', 
                      icon: TrendingUp, 
                      color: 'emerald',
                      progress: reportData.kpis?.collectionRate || 0
                    },
                    { 
                      title: t('specialistLevelReport.metrics.recoveryRate'), 
                      value: `${reportData.kpis?.averageResponseRate || 0}%`, 
                      change: '-2%', 
                      icon: PhoneCall, 
                      color: 'purple',
                      progress: reportData.kpis?.averageResponseRate || 0
                    },
                    { 
                      title: t('specialistLevelReport.metrics.promisesToPay'), 
                      value: reportData.kpis?.promisesToPay || 0, 
                      change: '+15%', 
                      icon: CheckCircle, 
                      color: 'orange',
                      subValue: `${reportData.kpis?.promisesFulfilled || 0} ${t('specialistLevelReport.metrics.achieved')}`
                    },
                    { 
                      title: t('specialistLevelReport.metrics.followUps'), 
                      value: `${reportData.kpis?.callsMade || 0}`, 
                      change: '+0.3', 
                      icon: Users, 
                      color: 'pink',
                      subValue: `${reportData.kpis?.messagesSent || 0} ${t('specialistLevelReport.metrics.tasks')}`
                    }
                  ].map((kpi, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {kpi.title}
                          </CardTitle>
                          <kpi.icon className={`h-4 w-4 text-${kpi.color}-500`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">{kpi.value}</span>
                            <span className={`text-xs font-medium ${
                              kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {kpi.change}
                            </span>
                          </div>
                          {kpi.progress && (
                            <Progress value={kpi.progress} className="h-1" />
                          )}
                          {kpi.subValue && (
                            <p className="text-xs text-muted-foreground">{kpi.subValue}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance Radar */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        {t('specialistLevelReport.charts.performanceIndicators')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[
                          { metric: 'التحصيل', value: reportData.performance?.collectionRate || 0 },
                          { metric: 'الاستجابة', value: reportData.performance?.responseRate || 0 },
                          { metric: 'الوعود', value: reportData.performance?.promiseRate || 0 },
                          { metric: 'الإنجاز', value: reportData.performance?.fulfillmentRate || 0 },
                          { metric: 'الكفاءة', value: reportData.performance?.efficiency || 85 },
                          { metric: 'الجودة', value: reportData.performance?.qualityScore || 90 }
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar
                            name="الأداء"
                            dataKey="value"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Collection Trends */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          {t('specialistLevelReport.charts.collectionTrends')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">يومي</Button>
                          <Button variant="default" size="sm">أسبوعي</Button>
                          <Button variant="ghost" size="sm">شهري</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={reportData.trends || chartData.trendData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="collected"
                            fill="#3b82f6"
                            stroke="#3b82f6"
                            fillOpacity={0.6}
                            name="المبلغ المحصل"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="responseRate"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="معدل الاستجابة %"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="promises"
                            fill="#f59e0b"
                            name="وعود الدفع"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Customer Segments */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base">شرائح العملاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={reportData.customerSegments || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {(reportData.customerSegments || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {(reportData.customerSegments || []).map((segment, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{segment.segment}</span>
                            </div>
                            <span className="font-medium">{segment.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Distribution */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        توزيع المخاطر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(reportData.riskAnalysis?.distribution || []).map((risk, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{risk.level}</span>
                              <span className="text-sm font-medium">{risk.count} ({risk.percentage}%)</span>
                            </div>
                            <Progress 
                              value={risk.percentage} 
                              className={`h-2 ${
                                risk.level.includes('منخفض') ? 'bg-green-100' :
                                risk.level.includes('متوسط') ? 'bg-yellow-100' :
                                'bg-red-100'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Communication Effectiveness */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">فعالية قنوات التواصل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.communicationChartData || reportData.communicationData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="calls" stackId="a" fill="#3b82f6" name="مكالمات" />
                          <Bar dataKey="messages" stackId="a" fill="#10b981" name="رسائل" />
                          <Bar dataKey="emails" stackId="a" fill="#f59e0b" name="بريد" />
                          <Line 
                            type="monotone" 
                            dataKey="successful" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            name="ناجحة"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Timeline */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        النشاط الأخير
                      </CardTitle>
                      <Button variant="ghost" size="sm">
                        عرض الكل
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(reportData.timeline || []).map((event, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              event.type === 'call' ? 'bg-blue-100' :
                              event.type === 'message' ? 'bg-green-100' :
                              event.type === 'email' ? 'bg-orange-100' :
                              'bg-purple-100'
                            }`}>
                              {event.type === 'call' && <PhoneCall className="h-5 w-5 text-blue-600" />}
                              {event.type === 'message' && <MessageSquare className="h-5 w-5 text-green-600" />}
                              {event.type === 'email' && <Mail className="h-5 w-5 text-orange-600" />}
                              {event.type === 'payment' && <DollarSign className="h-5 w-5 text-purple-600" />}
                            </div>
                            {index < (reportData.timeline?.length || 0) - 1 && (
                              <div className="absolute top-10 left-5 w-0.5 h-12 bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.customer}</h4>
                              <span className="text-sm text-muted-foreground">{event.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{event.result}</p>
                            {event.amount && (
                              <p className="text-sm font-medium text-green-600 mt-1">
                                {formatCurrency(event.amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!reportData.timeline || reportData.timeline.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>لا توجد أنشطة حديثة</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Portfolio View */}
            {activeView === 'portfolio' && (
              <div className="space-y-6">
                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>توزيع المحفظة حسب المنتج</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData.portfolioDistribution || reportData.portfolioDistribution || [
                              { name: 'قرض تورق', value: 35, amount: 15000000 },
                              { name: 'قرض كاش', value: 25, amount: 8000000 },
                              { name: 'تمويل شخصي', value: 40, amount: 12000000 },
                              { name: 'تمويل عقاري', value: 27, amount: 10750000 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0,1,2,3].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => [
                            `${value} قرض`,
                            `${formatCurrency(props.payload.amount)}`
                          ]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>حالة المحفظة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <Treemap
                          data={[
                            { name: 'جاري', size: 55, fill: '#10b981' },
                            { name: '1-30 يوم', size: 20, fill: '#f59e0b' },
                            { name: '31-60 يوم', size: 15, fill: '#ef4444' },
                            { name: '61-90 يوم', size: 7, fill: '#dc2626' },
                            { name: '+90 يوم', size: 3, fill: '#991b1b' }
                          ]}
                          dataKey="size"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          <Tooltip formatter={(value) => `${value}%`} />
                        </Treemap>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>معدل النمو الشهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={Array.from({length: 6}, (_, i) => ({
                          month: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'][i],
                          portfolio: 35000000 + (i * 2000000) + Math.random() * 5000000,
                          collected: 5000000 + (i * 500000) + Math.random() * 1000000
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Area 
                            type="monotone" 
                            dataKey="portfolio" 
                            stackId="1"
                            stroke="#3b82f6" 
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            name="المحفظة"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="collected" 
                            stackId="1"
                            stroke="#10b981" 
                            fill="#10b981"
                            fillOpacity={0.6}
                            name="المحصل"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Portfolio Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>تفاصيل المحفظة</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <FileDown className="h-4 w-4 mr-2" />
                          تصدير
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم القرض</TableHead>
                            <TableHead>العميل</TableHead>
                            <TableHead>المنتج</TableHead>
                            <TableHead>القيمة</TableHead>
                            <TableHead>المتأخر</TableHead>
                            <TableHead>أيام التأخير</TableHead>
                            <TableHead>المخاطر</TableHead>
                            <TableHead>احتمالية التحصيل</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(reportData.loans || [])
                            .filter(loan => 
                              loan.customerName?.includes(searchTerm) ||
                              loan.loanNumber?.includes(searchTerm)
                            )
                            .slice(0, 20)
                            .map((loan) => (
                            <TableRow key={loan.loanNumber} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{loan.customerName}</p>
                                  <p className="text-xs text-gray-500">{loan.customerPhone}</p>
                                </div>
                              </TableCell>
                              <TableCell>{loan.productType}</TableCell>
                              <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                              <TableCell className="text-red-600 font-medium">
                                {formatCurrency(loan.totalOverdueAmount)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getDelinquencyColor(loan.delinquencyBucket)}>
                                  {loan.totalOverdueDays} يوم
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    loan.riskScore < 30 ? 'bg-green-500' :
                                    loan.riskScore < 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`} />
                                  <span className="text-sm">{loan.riskScore || 0}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Progress value={loan.collectionProbability || 0} className="w-20" />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedLoan(loan)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <PhoneCall className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
              <div className="space-y-6">
                {/* Predictive Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      التحليلات التنبؤية
                    </CardTitle>
                    <CardDescription>
                      توقعات الأداء للـ 30 يوم القادمة بناءً على البيانات التاريخية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-medium mb-2">توقع التحصيل</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(3850000)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            بناءً على معدل التحصيل الحالي
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h3 className="font-medium mb-2">وعود الدفع المتوقعة</h3>
                          <p className="text-2xl font-bold text-green-600">87</p>
                          <p className="text-sm text-gray-600 mt-1">
                            بمعدل تحقيق 76%
                          </p>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={Array.from({length: 30}, (_, i) => ({
                            day: i + 1,
                            actual: i <= 15 ? Math.random() * 200000 + 100000 : null,
                            predicted: i >= 10 ? Math.random() * 200000 + 100000 : null,
                            confidence_upper: i >= 10 ? (Math.random() * 200000 + 100000) * 1.2 : null,
                            confidence_lower: i >= 10 ? (Math.random() * 200000 + 100000) * 0.8 : null
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Line 
                              type="monotone" 
                              dataKey="actual" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              name="فعلي"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="متوقع"
                            />
                            <Area
                              type="monotone"
                              dataKey="confidence_upper"
                              stroke="none"
                              fill="#10b981"
                              fillOpacity={0.1}
                            />
                            <Area
                              type="monotone"
                              dataKey="confidence_lower"
                              stroke="none"
                              fill="#10b981"
                              fillOpacity={0.1}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Behavior Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>تحليل سلوك العملاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="contactAttempts" name="محاولات الاتصال" />
                          <YAxis dataKey="paymentProbability" name="احتمالية الدفع %" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter
                            name="العملاء"
                            data={Array.from({length: 50}, () => ({
                              contactAttempts: Math.floor(Math.random() * 20),
                              paymentProbability: Math.random() * 100,
                              amount: Math.floor(Math.random() * 50000)
                            }))}
                            fill="#3b82f6"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>قمع التحصيل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <FunnelChart>
                          <Funnel
                            dataKey="value"
                            data={[
                              { name: 'إجمالي العملاء', value: 127, fill: '#3b82f6' },
                              { name: 'تم الاتصال', value: 98, fill: '#10b981' },
                              { name: 'تم الرد', value: 72, fill: '#f59e0b' },
                              { name: 'وعد بالدفع', value: 45, fill: '#8b5cf6' },
                              { name: 'تم الدفع', value: 34, fill: '#ef4444' }
                            ]}
                            labelLine={false}
                          >
                            <Tooltip />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Factor Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>تحليل عوامل المخاطر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-4">تأثير العوامل على احتمالية التعثر</h3>
                        <div className="space-y-3">
                          {(reportData.riskAnalysis?.factors || []).map((factor, index) => (
                            <div key={index}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{factor.factor}</span>
                                <span className="text-sm font-medium">{factor.impact}%</span>
                              </div>
                              <Progress value={factor.impact} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-4">مصفوفة المخاطر</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {['منخفض', 'متوسط', 'عالي'].map((probability) => (
                            ['منخفض', 'متوسط', 'عالي'].map((impact) => {
                              const risk = probability === impact ? 'medium' :
                                         (probability === 'عالي' && impact === 'عالي') ? 'high' :
                                         (probability === 'منخفض' && impact === 'منخفض') ? 'low' : 'medium';
                              return (
                                <div
                                  key={`${probability}-${impact}`}
                                  className={`p-3 rounded text-center text-xs font-medium ${
                                    risk === 'high' ? 'bg-red-100 text-red-700' :
                                    risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {Math.floor(Math.random() * 20) + 1}
                                </div>
                              );
                            })
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                          <span>← الأثر</span>
                          <span>الاحتمالية ↓</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Timeline View */}
            {activeView === 'timeline' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>الجدول الزمني للأنشطة</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          اليوم
                        </Button>
                        <Button variant="ghost" size="sm">الأسبوع</Button>
                        <Button variant="ghost" size="sm">الشهر</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline content */}
                      <div className="space-y-6">
                        {Array.from({length: 10}, (_, i) => {
                          const types = ['call', 'message', 'email', 'payment', 'meeting'];
                          const type = types[Math.floor(Math.random() * types.length)];
                          const time = new Date();
                          time.setHours(9 + i);
                          
                          return (
                            <div key={i} className="flex gap-4">
                              <div className="flex-shrink-0 w-24 text-right">
                                <span className="text-sm text-muted-foreground">
                                  {time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${
                                  type === 'payment' ? 'bg-green-500' :
                                  type === 'call' ? 'bg-blue-500' :
                                  type === 'message' ? 'bg-purple-500' :
                                  type === 'email' ? 'bg-orange-500' :
                                  'bg-gray-500'
                                }`} />
                                {i < 9 && (
                                  <div className="absolute top-3 left-1.5 w-0.5 h-20 bg-gray-200" />
                                )}
                              </div>
                              <div className="flex-1 pb-8">
                                <Card className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <h4 className="font-medium">
                                          {type === 'call' && 'مكالمة هاتفية'}
                                          {type === 'message' && 'رسالة نصية'}
                                          {type === 'email' && 'بريد إلكتروني'}
                                          {type === 'payment' && 'دفعة مستلمة'}
                                          {type === 'meeting' && 'اجتماع'}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          عميل #{Math.floor(Math.random() * 1000)}
                                        </p>
                                        {type === 'payment' && (
                                          <p className="text-sm font-medium text-green-600">
                                            {formatCurrency(Math.floor(Math.random() * 50000))}
                                          </p>
                                        )}
                                      </div>
                                      <Badge variant="outline">
                                        {type === 'call' && 'تم الرد'}
                                        {type === 'message' && 'تم الإرسال'}
                                        {type === 'email' && 'تم القراءة'}
                                        {type === 'payment' && 'مكتمل'}
                                        {type === 'meeting' && 'مجدول'}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reports View */}
            {activeView === 'reports' && (
              <div className="space-y-6">
                {loadingReports ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {reports.map((report, index) => (
                      <Card key={index} className="hover:shadow-lg transition-all">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <report.icon className="h-8 w-8 text-blue-500" />
                            <Badge variant="outline">{report.format}</Badge>
                          </div>
                          <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                          <CardDescription>{report.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <span>آخر إنشاء</span>
                            <span>{report.lastGenerated}</span>
                          </div>
                          {report.data && (
                            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                              {report.type === 'monthly' && report.data.summary && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>إجمالي المكالمات:</span>
                                    <span className="font-medium">{report.data.summary.totalCalls || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>إجمالي التحصيل:</span>
                                    <span className="font-medium">{report.data.summary.totalCollected || 0}</span>
                                  </div>
                                </div>
                              )}
                              {report.type === 'portfolio' && report.data.analysis && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>عدد الحسابات:</span>
                                    <span className="font-medium">{report.data.analysis.totalAccounts || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>متوسط DPD:</span>
                                    <span className="font-medium">{report.data.analysis.averageDPD || 0}</span>
                                  </div>
                                </div>
                              )}
                              {report.type === 'trends' && report.data.analysis && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>اتجاه التحصيل:</span>
                                    <span className="font-medium">
                                      {report.data.analysis.collectionTrend === 'increasing' ? 'تصاعدي' :
                                       report.data.analysis.collectionTrend === 'decreasing' ? 'تنازلي' : 'مستقر'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>نقاط البيانات:</span>
                                    <span className="font-medium">{report.data.analysis.dataPoints || 0}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              تحميل
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={fetchReports}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Custom Report Builder */}
                <Card>
                  <CardHeader>
                    <CardTitle>إنشاء تقرير مخصص</CardTitle>
                    <CardDescription>
                      قم بإنشاء تقرير مخصص حسب احتياجاتك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>نوع التقرير</Label>
                          <Select
                            value={customReportConfig.reportType}
                            onValueChange={(value) => setCustomReportConfig(prev => ({ ...prev, reportType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع التقرير" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="performance">تقرير الأداء</SelectItem>
                              <SelectItem value="portfolio">تقرير المحفظة</SelectItem>
                              <SelectItem value="collection">تقرير التحصيل</SelectItem>
                              <SelectItem value="risk">تقرير المخاطر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>الفترة الزمنية</Label>
                          <Select
                            value={customReportConfig.period}
                            onValueChange={(value) => setCustomReportConfig(prev => ({ ...prev, period: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفترة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">يومي</SelectItem>
                              <SelectItem value="weekly">أسبوعي</SelectItem>
                              <SelectItem value="monthly">شهري</SelectItem>
                              <SelectItem value="quarterly">ربع سنوي</SelectItem>
                              <SelectItem value="yearly">سنوي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>المحتويات</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            'ملخص تنفيذي',
                            'مؤشرات الأداء',
                            'تحليل المحفظة',
                            'تحليل المخاطر',
                            'توزيع العملاء',
                            'اتجاهات التحصيل',
                            'تحليل قنوات التواصل',
                            'التوصيات'
                          ].map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Switch 
                                id={item} 
                                checked={customReportConfig.contents.includes(item)}
                                onCheckedChange={(checked) => {
                                  setCustomReportConfig(prev => ({
                                    ...prev,
                                    contents: checked 
                                      ? [...prev.contents, item]
                                      : prev.contents.filter(c => c !== item)
                                  }));
                                }}
                              />
                              <Label htmlFor={item} className="text-sm font-normal mr-2">
                                {item}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          className="flex-1"
                          onClick={handleGenerateCustomReport}
                          disabled={!customReportConfig.reportType || !customReportConfig.period || customReportConfig.contents.length === 0 || loadingReports}
                        >
                          {loadingReports ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          إنشاء التقرير
                        </Button>
                        <Button variant="outline">
                          <Save className="h-4 w-4 mr-2" />
                          حفظ كقالب
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Communication Tracking View */}
            {activeView === 'communication' && (
              <div className="space-y-6">
                {/* Communication Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        إجمالي المكالمات هذا الشهر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{reportData.kpis?.callsMade || 0}</span>
                        <PhoneCall className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        متوسط {((reportData.kpis?.callsMade || 0) / (reportData.kpis?.totalLoans || 1)).toFixed(1)} مكالمة/عميل
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        الرسائل المرسلة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{reportData.kpis?.messagesSent || 0}</span>
                        <MessageSquare className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        SMS: {Math.floor((reportData.kpis?.messagesSent || 0) * 0.7)} | WhatsApp: {Math.floor((reportData.kpis?.messagesSent || 0) * 0.3)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        البريد الإلكتروني
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{Math.floor((reportData.kpis?.messagesSent || 0) * 0.2)}</span>
                        <Mail className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        معدل الفتح: 65%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        الزيارات الميدانية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{Math.floor((reportData.kpis?.callsMade || 0) * 0.05)}</span>
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        نسبة النجاح: 78%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Communication Log */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        سجل التواصل الشهري
                      </CardTitle>
                      <div className="flex gap-2">
                        <Input
                          placeholder="البحث بالاسم أو رقم العميل..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                          icon={<Search className="h-4 w-4" />}
                        />
                        <Button variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العميل</TableHead>
                            <TableHead>رقم القرض</TableHead>
                            <TableHead className="text-center">المكالمات</TableHead>
                            <TableHead className="text-center">الرسائل</TableHead>
                            <TableHead className="text-center">البريد</TableHead>
                            <TableHead className="text-center">الزيارات</TableHead>
                            <TableHead>آخر اتصال</TableHead>
                            <TableHead>النتيجة</TableHead>
                            <TableHead>وعد الدفع</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(reportData.loans || [])
                            .filter(loan => 
                              loan.customerName?.includes(searchTerm) ||
                              loan.loanNumber?.includes(searchTerm) ||
                              loan.customerId?.includes(searchTerm)
                            )
                            .map((loan) => {
                              // Generate communication data for each customer
                              const callCount = Math.floor(Math.random() * 8) + 1;
                              const smsCount = Math.floor(Math.random() * 5);
                              const emailCount = Math.floor(Math.random() * 3);
                              const visitCount = Math.random() > 0.8 ? 1 : 0;
                              const lastContactDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
                              const outcomes = ['No Answer', 'Customer Disputed', 'Promise to Pay', 'Partial Payment Agreed', 'Requested Call Back', 'Payment Made'];
                              const lastOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
                              
                              return (
                                <TableRow key={loan.loanNumber} className="hover:bg-gray-50">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{loan.customerName}</p>
                                      <p className="text-xs text-gray-500">{loan.customerPhone}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{loan.loanNumber}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="gap-1">
                                      <PhoneCall className="h-3 w-3" />
                                      {callCount}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {smsCount}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="gap-1">
                                      <Mail className="h-3 w-3" />
                                      {emailCount}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {visitCount > 0 ? (
                                      <Badge variant="outline" className="gap-1">
                                        <Users className="h-3 w-3" />
                                        {visitCount}
                                      </Badge>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm">{lastContactDate.toLocaleDateString('ar-SA')}</p>
                                      <p className="text-xs text-gray-500">{lastContactDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={
                                      lastOutcome === 'Payment Made' ? 'bg-green-100 text-green-800' :
                                      lastOutcome === 'Promise to Pay' ? 'bg-blue-100 text-blue-800' :
                                      lastOutcome === 'No Answer' ? 'bg-gray-100 text-gray-800' :
                                      lastOutcome === 'Customer Disputed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }>
                                      {lastOutcome === 'No Answer' ? 'لا يوجد رد' :
                                       lastOutcome === 'Customer Disputed' ? 'اعتراض العميل' :
                                       lastOutcome === 'Promise to Pay' ? 'وعد بالدفع' :
                                       lastOutcome === 'Partial Payment Agreed' ? 'دفعة جزئية' :
                                       lastOutcome === 'Requested Call Back' ? 'طلب اتصال لاحق' :
                                       lastOutcome === 'Payment Made' ? 'تم الدفع' :
                                       lastOutcome}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {lastOutcome === 'Promise to Pay' && (
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium text-blue-600">
                                          {formatCurrency(Math.floor(loan.totalOverdueAmount * (0.3 + Math.random() * 0.7)))}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}
                                        </p>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                          <DialogTitle>تفاصيل التواصل - {loan.customerName}</DialogTitle>
                                          <DialogDescription>
                                            سجل كامل لجميع محاولات التواصل مع العميل
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                          {/* Communication attempts log */}
                                          {Array.from({ length: callCount + smsCount + emailCount + visitCount }, (_, i) => {
                                            const attemptDate = new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
                                            const attemptType = i < callCount ? 'call' : 
                                                              i < callCount + smsCount ? 'sms' :
                                                              i < callCount + smsCount + emailCount ? 'email' : 'visit';
                                            const duration = attemptType === 'call' ? Math.floor(Math.random() * 300) + 30 : null;
                                            
                                            return (
                                              <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                  attemptType === 'call' ? 'bg-blue-100' :
                                                  attemptType === 'sms' ? 'bg-green-100' :
                                                  attemptType === 'email' ? 'bg-orange-100' :
                                                  'bg-purple-100'
                                                }`}>
                                                  {attemptType === 'call' && <PhoneCall className="h-5 w-5 text-blue-600" />}
                                                  {attemptType === 'sms' && <MessageSquare className="h-5 w-5 text-green-600" />}
                                                  {attemptType === 'email' && <Mail className="h-5 w-5 text-orange-600" />}
                                                  {attemptType === 'visit' && <Users className="h-5 w-5 text-purple-600" />}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">
                                                      {attemptType === 'call' ? 'مكالمة هاتفية' :
                                                       attemptType === 'sms' ? 'رسالة نصية' :
                                                       attemptType === 'email' ? 'بريد إلكتروني' :
                                                       'زيارة ميدانية'}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                      {attemptDate.toLocaleString('ar-SA')}
                                                    </span>
                                                  </div>
                                                  {duration && (
                                                    <p className="text-sm text-gray-600 mb-1">
                                                      المدة: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} دقيقة
                                                    </p>
                                                  )}
                                                  <p className="text-sm text-gray-600">
                                                    النتيجة: {outcomes[Math.floor(Math.random() * outcomes.length)]}
                                                  </p>
                                                  {Math.random() > 0.5 && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                      ملاحظات: {['العميل طلب الاتصال مساءً', 'العميل في السفر', 'وعد بالدفع الأسبوع القادم'][Math.floor(Math.random() * 3)]}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Communication Outcomes Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>تحليل نتائج الاتصالات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'لا يوجد رد', value: 35, color: '#6b7280' },
                              { name: 'وعد بالدفع', value: 25, color: '#3b82f6' },
                              { name: 'تم الدفع', value: 15, color: '#10b981' },
                              { name: 'اعتراض', value: 10, color: '#ef4444' },
                              { name: 'طلب اتصال لاحق', value: 10, color: '#f59e0b' },
                              { name: 'رقم خاطئ', value: 5, color: '#8b5cf6' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[0,1,2,3,4,5].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={[
                                '#6b7280', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'
                              ][index]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                          { label: 'لا يوجد رد', value: 35, color: 'bg-gray-500' },
                          { label: 'وعد بالدفع', value: 25, color: 'bg-blue-500' },
                          { label: 'تم الدفع', value: 15, color: 'bg-green-500' },
                          { label: 'اعتراض', value: 10, color: 'bg-red-500' },
                          { label: 'طلب اتصال لاحق', value: 10, color: 'bg-yellow-500' },
                          { label: 'رقم خاطئ', value: 5, color: 'bg-purple-500' }
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm">{item.label}: {item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>معدل الاستجابة حسب الوقت</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={Array.from({ length: 24 }, (_, i) => ({
                          hour: i,
                          responseRate: 
                            i < 8 ? 20 + Math.random() * 10 :
                            i < 12 ? 60 + Math.random() * 20 :
                            i < 14 ? 40 + Math.random() * 15 :
                            i < 18 ? 70 + Math.random() * 15 :
                            i < 21 ? 50 + Math.random() * 20 :
                            30 + Math.random() * 10
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                          <Line 
                            type="monotone" 
                            dataKey="responseRate" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="معدل الاستجابة"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          أفضل أوقات الاتصال: 10:00 صباحاً - 12:00 ظهراً و 3:00 عصراً - 6:00 مساءً
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>

                {/* Promise to Pay Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      متابعة وعود الدفع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* PTP Summary */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">إجمالي الوعود</p>
                          <p className="text-2xl font-bold text-blue-600">{reportData.kpis?.promisesToPay || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">محققة</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.kpis?.promisesFulfilled || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-gray-600">قيد الانتظار</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {(reportData.kpis?.promisesToPay || 0) - (reportData.kpis?.promisesFulfilled || 0) - Math.floor((reportData.kpis?.promisesToPay || 0) * 0.1)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">متأخرة</p>
                          <p className="text-2xl font-bold text-red-600">
                            {Math.floor((reportData.kpis?.promisesToPay || 0) * 0.1)}
                          </p>
                        </div>
                      </div>

                      {/* PTP List */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العميل</TableHead>
                            <TableHead>المبلغ الموعود</TableHead>
                            <TableHead>تاريخ الوعد</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>أيام متبقية</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(reportData.promisesToPay || []).slice(0, 10).map((ptp, index) => {
                            const daysRemaining = Math.floor((new Date(ptp.promiseDate) - new Date()) / (1000 * 60 * 60 * 24));
                            const status = ptp.status || (daysRemaining < 0 ? 'overdue' : daysRemaining === 0 ? 'due_today' : 'pending');
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{ptp.customerName}</p>
                                    <p className="text-xs text-gray-500">{ptp.loanNumber}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{formatCurrency(ptp.promisedAmount)}</TableCell>
                                <TableCell>{new Date(ptp.promiseDate).toLocaleDateString('ar-SA')}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                                    status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    status === 'due_today' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {status === 'fulfilled' ? 'محقق' :
                                     status === 'overdue' ? 'متأخر' :
                                     status === 'due_today' ? 'مستحق اليوم' :
                                     'قيد الانتظار'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {status === 'fulfilled' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <span className={daysRemaining < 0 ? 'text-red-600' : ''}>
                                      {daysRemaining === 0 ? 'اليوم' : 
                                       daysRemaining < 0 ? `متأخر ${Math.abs(daysRemaining)} يوم` :
                                       `${daysRemaining} يوم`}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* SAMA Compliance Section */}
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      الامتثال لمتطلبات البنك المركزي السعودي (SAMA)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">حدود الاتصال</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">الحد اليومي</span>
                            <Badge variant="outline">3 محاولات</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">الحد الأسبوعي</span>
                            <Badge variant="outline">7 محاولات</Badge>
                          </div>
                          <Progress value={70} className="mt-2" />
                          <p className="text-xs text-gray-500">70% من الحد المسموح</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">أوقات الاتصال المسموحة</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">8:00 ص - 9:00 م</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm">أوقات الصلاة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm">الجمعة والعطل الرسمية</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">ممارسات التحصيل العادلة</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">معاملة محترمة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">شفافية كاملة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">حماية البيانات</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loan Detail Modal */}
      <LoanDetailModal 
        loan={selectedLoan} 
        isOpen={!!selectedLoan} 
        onClose={() => setSelectedLoan(null)} 
      />
    </div>
  );
};

export default SpecialistLevelReport;