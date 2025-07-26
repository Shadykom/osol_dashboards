import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, Area
} from 'recharts';
import { 
  User, Phone, MessageSquare, Calendar, DollarSign, Target,
  Clock, AlertTriangle, CheckCircle, TrendingUp, Download,
  FileText, Eye, Filter, RefreshCw, Search, ChevronRight,
  Building2, CreditCard, PhoneCall, Mail, X, Check,
  UserCheck, History, Briefcase, Hash, CalendarDays
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';
import { useTranslation } from 'react-i18next';

// Table components
const Table = ({ children, className = "" }) => (
  <table className={`w-full caption-bottom text-sm ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children, className = "" }) => (
  <thead className={`[&_tr]:border-b ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = "" }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = "", onClick = null }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "" }) => (
  <th className={`h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = "" }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

const SpecialistLevelReport = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Update the translation for the sidebar
  useEffect(() => {
    // This ensures the sidebar shows the correct name
    const sidebarTranslations = {
      'navigation.specialistReport': isRTL ? 'تقرير مستوى الأخصائي' : 'Specialist Level Report'
    };
    // Note: In a real implementation, this would be in your i18n translation files
  }, [isRTL]);

  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLoans, setSelectedLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'current_month',
    loanStatus: 'all',
    delinquencyBucket: 'all',
    customerType: 'all',
    productType: 'all',
    ptpStatus: 'all'
  });

  useEffect(() => {
    loadSpecialists();
  }, []);

  useEffect(() => {
    if (selectedSpecialist) {
      loadSpecialistReport();
    }
  }, [selectedSpecialist, filters]);

  const loadSpecialists = async () => {
    try {
      setError(null);
      const response = await CollectionService.getSpecialists();
      if (response.success) {
        setSpecialists(response.data);
        if (response.data.length > 0) {
          setSelectedSpecialist(response.data[0].officer_id);
        }
      } else {
        setError(isRTL ? 'فشل في تحميل قائمة الأخصائيين' : 'Failed to load specialists');
      }
    } catch (error) {
      console.error('Error loading specialists:', error);
      setError(isRTL ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
    }
  };

  const loadSpecialistReport = async () => {
    if (!selectedSpecialist) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await CollectionService.getSpecialistReport(selectedSpecialist, filters);
      if (response.success) {
        // Enrich the report data with mock communication and PTP data
        const enrichedData = {
          ...response.data,
          loans: response.data.loans?.map(loan => ({
            ...loan,
            // Customer data
            customerName: loan.customer_name || 'غير معروف',
            customerId: loan.customer_id || 'N/A',
            
            // Loan details
            loanNumber: loan.loan_account_number,
            loanStartDate: loan.loan_start_date || '2023-01-15',
            maturityDate: loan.maturity_date || '2025-01-15',
            totalLoanAmount: loan.loan_amount || 0,
            
            // Payment details
            paidAmount: loan.paid_amount || 0,
            dueAmount: loan.due_amount || 0,
            notDueAmount: (loan.loan_amount || 0) - (loan.paid_amount || 0) - (loan.due_amount || 0),
            totalOverdueAmount: loan.overdue_amount || loan.due_amount || 0,
            
            // Delinquency details
            delinquencyBucket: loan.delinquency_bucket || 'Current',
            totalOverdueDays: loan.overdue_days || 0,
            installmentDetails: generateInstallmentDetails(loan),
            
            // Product and customer info
            productType: loan.product_type || 'قرض تورق',
            customerType: loan.customer_type || 'فرد',
            loanStatus: loan.loan_status || 'نشط',
            
            // Communication data
            lastContactDate: loan.last_contact_date || generateRecentDate(),
            callsThisMonth: loan.calls_this_month || Math.floor(Math.random() * 15) + 1,
            messagesThisMonth: loan.messages_this_month || Math.floor(Math.random() * 10) + 1,
            lastCallResult: loan.last_call_result || generateCallResult(),
            
            // Promise to Pay
            hasPromiseToPay: loan.has_promise_to_pay || Math.random() > 0.6,
            ptpDate: loan.ptp_date || (loan.has_promise_to_pay ? generateFutureDate() : null),
            ptpAmount: loan.ptp_amount || (loan.has_promise_to_pay ? loan.due_amount * 0.5 : 0),
            ptpStatus: loan.ptp_status || (loan.has_promise_to_pay ? generatePTPStatus() : null)
          })) || []
        };
        
        setReportData(enrichedData);
      } else {
        setError(isRTL ? 'فشل في تحميل تقرير الأخصائي' : 'Failed to load specialist report');
      }
    } catch (error) {
      console.error('Error loading specialist report:', error);
      setError(isRTL ? 'حدث خطأ أثناء تحميل التقرير' : 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for generating mock data
  const generateInstallmentDetails = (loan) => {
    const details = [];
    const monthlyInstallment = (loan.loan_amount || 100000) / 24; // Assume 24 month loan
    const startDate = new Date(loan.loan_start_date || '2023-01-15');
    
    for (let i = 0; i < 6; i++) { // Show last 6 installments
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const isPaid = Math.random() > 0.3;
      const isOverdue = !isPaid && dueDate < new Date();
      const paidDate = isPaid ? new Date(dueDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000) : null;
      
      details.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: monthlyInstallment,
        paidDate: paidDate ? paidDate.toISOString().split('T')[0] : null,
        overdueDays: isOverdue ? Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0,
        status: isPaid ? 'مسدد' : isOverdue ? 'متأخر' : 'مستحق'
      });
    }
    
    return details;
  };

  const generateRecentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    return date.toISOString().split('T')[0];
  };

  const generateFutureDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
    return date.toISOString().split('T')[0];
  };

  const generateCallResult = () => {
    const results = [
      'تم الرد - وعد بالدفع',
      'تم الرد - طلب تأجيل',
      'تم الرد - رفض الدفع',
      'لم يتم الرد',
      'خطأ بالرقم',
      'انشغال الخط',
      'الهاتف مغلق'
    ];
    return results[Math.floor(Math.random() * results.length)];
  };

  const generatePTPStatus = () => {
    const statuses = ['تم الوفاء بالوعد', 'لم يتم الوفاء بالوعد', 'قيد الانتظار'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Formatting functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return isRTL ? 'غير متوفر' : 'N/A';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
  };

  const getDelinquencyColor = (bucket) => {
    const colors = {
      'Current': 'bg-green-100 text-green-800',
      '1-30 Days': 'bg-yellow-100 text-yellow-800',
      '31-60 Days': 'bg-orange-100 text-orange-800',
      '61-90 Days': 'bg-red-100 text-red-800',
      '91-180 Days': 'bg-red-200 text-red-900',
      '181-360 Days': 'bg-red-300 text-red-900',
      '>360 Days': 'bg-red-400 text-white'
    };
    return colors[bucket] || 'bg-gray-100 text-gray-800';
  };

  const getPTPStatusColor = (status) => {
    const colors = {
      'تم الوفاء بالوعد': 'bg-green-100 text-green-800',
      'لم يتم الوفاء بالوعد': 'bg-red-100 text-red-800',
      'قيد الانتظار': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCallResultIcon = (result) => {
    if (result?.includes('تم الرد')) return <PhoneCall className="h-4 w-4 text-green-600" />;
    if (result?.includes('لم يتم الرد')) return <X className="h-4 w-4 text-red-600" />;
    return <Phone className="h-4 w-4 text-gray-600" />;
  };

  // Export functions
  const exportReport = (format) => {
    console.log(`Exporting report in ${format} format`);
    // Implementation for export functionality
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLoans(reportData.loans.map(loan => loan.loanNumber));
    } else {
      setSelectedLoans([]);
    }
  };

  const handleSelectLoan = (loanNumber) => {
    setSelectedLoans(prev => 
      prev.includes(loanNumber) 
        ? prev.filter(id => id !== loanNumber)
        : [...prev, loanNumber]
    );
  };

  // Filter loans based on search and filters
  const filteredLoans = reportData?.loans?.filter(loan => {
    const matchesSearch = !searchTerm || 
      loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerId.includes(searchTerm) ||
      loan.loanNumber.includes(searchTerm);

    const matchesStatus = filters.loanStatus === 'all' || loan.loanStatus === filters.loanStatus;
    const matchesBucket = filters.delinquencyBucket === 'all' || loan.delinquencyBucket === filters.delinquencyBucket;
    const matchesCustomerType = filters.customerType === 'all' || loan.customerType === filters.customerType;
    const matchesProductType = filters.productType === 'all' || loan.productType === filters.productType;
    const matchesPTPStatus = filters.ptpStatus === 'all' || 
      (filters.ptpStatus === 'has_ptp' && loan.hasPromiseToPay) ||
      (filters.ptpStatus === 'no_ptp' && !loan.hasPromiseToPay);

    return matchesSearch && matchesStatus && matchesBucket && matchesCustomerType && matchesProductType && matchesPTPStatus;
  }) || [];

  // Calculate summary statistics
  const summaryStats = {
    totalLoans: filteredLoans.length,
    totalValue: filteredLoans.reduce((sum, loan) => sum + (loan.totalLoanAmount || 0), 0),
    totalPaid: filteredLoans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0),
    totalOverdue: filteredLoans.reduce((sum, loan) => sum + (loan.totalOverdueAmount || 0), 0),
    totalCalls: filteredLoans.reduce((sum, loan) => sum + (loan.callsThisMonth || 0), 0),
    totalMessages: filteredLoans.reduce((sum, loan) => sum + (loan.messagesThisMonth || 0), 0),
    loansWithPTP: filteredLoans.filter(loan => loan.hasPromiseToPay).length,
    avgCallsPerLoan: filteredLoans.length > 0 ? 
      (filteredLoans.reduce((sum, loan) => sum + (loan.callsThisMonth || 0), 0) / filteredLoans.length).toFixed(1) : 0
  };

  // Chart data
  const communicationTrend = [
    { day: isRTL ? 'الأحد' : 'Sun', calls: 25, messages: 12, answered: 18 },
    { day: isRTL ? 'الاثنين' : 'Mon', calls: 32, messages: 15, answered: 24 },
    { day: isRTL ? 'الثلاثاء' : 'Tue', calls: 28, messages: 18, answered: 20 },
    { day: isRTL ? 'الأربعاء' : 'Wed', calls: 35, messages: 14, answered: 28 },
    { day: isRTL ? 'الخميس' : 'Thu', calls: 30, messages: 16, answered: 22 },
    { day: isRTL ? 'الجمعة' : 'Fri', calls: 15, messages: 8, answered: 10 },
    { day: isRTL ? 'السبت' : 'Sat', calls: 20, messages: 10, answered: 12 }
  ];

  const performanceMetrics = [
    { metric: isRTL ? 'معدل الرد' : 'Answer Rate', value: 72, target: 80 },
    { metric: isRTL ? 'معدل PTP' : 'PTP Rate', value: 45, target: 50 },
    { metric: isRTL ? 'معدل الوفاء' : 'Fulfillment Rate', value: 65, target: 70 },
    { metric: isRTL ? 'معدل التحصيل' : 'Collection Rate', value: 78, target: 85 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (error) {
    return (
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isRTL ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setError(null);
                loadSpecialists();
              }}
            >
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isRTL ? 'تقرير مستوى الأخصائي' : 'Specialist Level Report'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isRTL ? 'تقرير تفصيلي لأداء أخصائي التحصيل وجهود التواصل' : 'Detailed report on collection specialist performance and communication efforts'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={isRTL ? "اختر الأخصائي" : "Select Specialist"} />
            </SelectTrigger>
            <SelectContent>
              {specialists.map(specialist => (
                <SelectItem key={specialist.officer_id} value={specialist.officer_id}>
                  {specialist.officer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadSpecialistReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {isRTL ? 'إجمالي القروض' : 'Total Loans'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summaryStats.totalLoans)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(summaryStats.totalValue)} {isRTL ? 'إجمالي القيمة' : 'Total Value'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {isRTL ? 'المتأخرات' : 'Overdue'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summaryStats.totalOverdue)}
                </div>
                <Progress 
                  value={(summaryStats.totalOverdue / summaryStats.totalValue) * 100} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {isRTL ? 'نشاط التواصل' : 'Communication Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                    <span className="font-bold">{summaryStats.totalCalls}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="font-bold">{summaryStats.totalMessages}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? 'متوسط' : 'Avg'} {summaryStats.avgCallsPerLoan} {isRTL ? 'مكالمة/قرض' : 'calls/loan'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {isRTL ? 'وعود الدفع' : 'Payment Promises'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.loansWithPTP}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((summaryStats.loansWithPTP / summaryStats.totalLoans) * 100).toFixed(1)}% 
                  {isRTL ? ' من القروض' : ' of loans'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {isRTL ? 'الفلاتر والبحث' : 'Filters & Search'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>{isRTL ? 'البحث' : 'Search'}</Label>
                    <div className="relative">
                      <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                      <Input
                        placeholder={isRTL ? "البحث بالاسم أو رقم الهوية أو رقم القرض..." : "Search by name, ID, or loan number..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <Label>{isRTL ? 'الفترة الزمنية' : 'Date Range'}</Label>
                    <Select 
                      value={filters.dateRange} 
                      onValueChange={(value) => setFilters({...filters, dateRange: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current_month">{isRTL ? 'الشهر الحالي' : 'Current Month'}</SelectItem>
                        <SelectItem value="last_month">{isRTL ? 'الشهر الماضي' : 'Last Month'}</SelectItem>
                        <SelectItem value="current_quarter">{isRTL ? 'الربع الحالي' : 'Current Quarter'}</SelectItem>
                        <SelectItem value="current_year">{isRTL ? 'السنة الحالية' : 'Current Year'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{isRTL ? 'حالة القرض' : 'Loan Status'}</Label>
                    <Select 
                      value={filters.loanStatus} 
                      onValueChange={(value) => setFilters({...filters, loanStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</SelectItem>
                        <SelectItem value="نشط">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                        <SelectItem value="متأخر">{isRTL ? 'متأخر' : 'Overdue'}</SelectItem>
                        <SelectItem value="متعثر">{isRTL ? 'متعثر' : 'Delinquent'}</SelectItem>
                        <SelectItem value="مغلق">{isRTL ? 'مغلق' : 'Closed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{isRTL ? 'فئة التقادم' : 'Delinquency Bucket'}</Label>
                    <Select 
                      value={filters.delinquencyBucket} 
                      onValueChange={(value) => setFilters({...filters, delinquencyBucket: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'جميع الفئات' : 'All Buckets'}</SelectItem>
                        <SelectItem value="Current">{isRTL ? 'جاري' : 'Current'}</SelectItem>
                        <SelectItem value="1-30 Days">1-30 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                        <SelectItem value="31-60 Days">31-60 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                        <SelectItem value="61-90 Days">61-90 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                        <SelectItem value="91-180 Days">91-180 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                        <SelectItem value="181-360 Days">181-360 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                        <SelectItem value=">360 Days">&gt;360 {isRTL ? 'يوم' : 'Days'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{isRTL ? 'نوع العميل' : 'Customer Type'}</Label>
                    <Select 
                      value={filters.customerType} 
                      onValueChange={(value) => setFilters({...filters, customerType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                        <SelectItem value="فرد">{isRTL ? 'فرد' : 'Individual'}</SelectItem>
                        <SelectItem value="مؤسسة">{isRTL ? 'مؤسسة' : 'Corporate'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{isRTL ? 'نوع المنتج' : 'Product Type'}</Label>
                    <Select 
                      value={filters.productType} 
                      onValueChange={(value) => setFilters({...filters, productType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'جميع المنتجات' : 'All Products'}</SelectItem>
                        <SelectItem value="قرض تورق">{isRTL ? 'قرض تورق' : 'Tawarruq Loan'}</SelectItem>
                        <SelectItem value="قرض كاش">{isRTL ? 'قرض كاش' : 'Cash Loan'}</SelectItem>
                        <SelectItem value="تمويل عقاري">{isRTL ? 'تمويل عقاري' : 'Real Estate'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{isRTL ? 'وعد الدفع' : 'Promise to Pay'}</Label>
                    <Select 
                      value={filters.ptpStatus} 
                      onValueChange={(value) => setFilters({...filters, ptpStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                        <SelectItem value="has_ptp">{isRTL ? 'يوجد وعد' : 'Has PTP'}</SelectItem>
                        <SelectItem value="no_ptp">{isRTL ? 'لا يوجد وعد' : 'No PTP'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="loans" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="loans">
                {isRTL ? 'قائمة القروض' : 'Loan Portfolio'}
              </TabsTrigger>
              <TabsTrigger value="communication">
                {isRTL ? 'نشاط التواصل' : 'Communication Activity'}
              </TabsTrigger>
              <TabsTrigger value="performance">
                {isRTL ? 'مؤشرات الأداء' : 'Performance Metrics'}
              </TabsTrigger>
              <TabsTrigger value="details">
                {isRTL ? 'تفاصيل الأقساط' : 'Installment Details'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loans" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{isRTL ? 'محفظة القروض المخصصة' : 'Assigned Loan Portfolio'}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {filteredLoans.length} {isRTL ? 'قرض' : 'loans'}
                      </Badge>
                      {selectedLoans.length > 0 && (
                        <Badge>
                          {selectedLoans.length} {isRTL ? 'محدد' : 'selected'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {isRTL ? 'جميع القروض المخصصة للأخصائي مع تفاصيل التواصل ووعود الدفع' : 'All loans assigned to specialist with communication details and payment promises'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>{isRTL ? 'رقم القرض' : 'Loan Number'}</TableHead>
                          <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                          <TableHead>{isRTL ? 'نوع المنتج' : 'Product Type'}</TableHead>
                          <TableHead>{isRTL ? 'قيمة القرض' : 'Loan Amount'}</TableHead>
                          <TableHead>{isRTL ? 'المسدد' : 'Paid'}</TableHead>
                          <TableHead>{isRTL ? 'المستحق' : 'Due'}</TableHead>
                          <TableHead>{isRTL ? 'المتأخر' : 'Overdue'}</TableHead>
                          <TableHead>{isRTL ? 'أيام التأخير' : 'Days Overdue'}</TableHead>
                          <TableHead>{isRTL ? 'فئة التقادم' : 'Bucket'}</TableHead>
                          <TableHead>{isRTL ? 'التواصل' : 'Communication'}</TableHead>
                          <TableHead>{isRTL ? 'آخر اتصال' : 'Last Contact'}</TableHead>
                          <TableHead>{isRTL ? 'وعد الدفع' : 'PTP'}</TableHead>
                          <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLoans.map((loan) => (
                          <TableRow key={loan.loanNumber} className="hover:bg-gray-50">
                            <TableCell>
                              <Checkbox
                                checked={selectedLoans.includes(loan.loanNumber)}
                                onCheckedChange={() => handleSelectLoan(loan.loanNumber)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{loan.customerName}</p>
                                <p className="text-xs text-gray-500">{loan.customerId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{loan.productType}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(loan.totalLoanAmount)}</TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(loan.paidAmount)}
                            </TableCell>
                            <TableCell>{formatCurrency(loan.dueAmount)}</TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {formatCurrency(loan.totalOverdueAmount)}
                            </TableCell>
                            <TableCell>
                              {loan.totalOverdueDays > 0 ? (
                                <Badge variant="destructive">{loan.totalOverdueDays}</Badge>
                              ) : (
                                <Badge variant="secondary">0</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getDelinquencyColor(loan.delinquencyBucket)}>
                                {loan.delinquencyBucket}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm">{loan.callsThisMonth}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-green-600" />
                                  <span className="text-sm">{loan.messagesThisMonth}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{formatDate(loan.lastContactDate)}</p>
                                <div className="flex items-center gap-1">
                                  {getCallResultIcon(loan.lastCallResult)}
                                  <span className="text-xs text-gray-600">{loan.lastCallResult}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {loan.hasPromiseToPay ? (
                                <div className="space-y-1">
                                  <Badge className={getPTPStatusColor(loan.ptpStatus)}>
                                    {loan.ptpStatus}
                                  </Badge>
                                  <p className="text-xs">{formatDate(loan.ptpDate)}</p>
                                  <p className="text-xs font-medium">{formatCurrency(loan.ptpAmount)}</p>
                                </div>
                              ) : (
                                <Badge variant="outline">{isRTL ? 'لا يوجد' : 'No PTP'}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" title={isRTL ? 'اتصال' : 'Call'}>
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" title={isRTL ? 'رسالة' : 'Message'}>
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" title={isRTL ? 'عرض' : 'View'}>
                                  <Eye className="h-4 w-4" />
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
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'نشاط التواصل الأسبوعي' : 'Weekly Communication Activity'}</CardTitle>
                    <CardDescription>
                      {isRTL ? 'عدد المكالمات والرسائل خلال الأسبوع الحالي' : 'Number of calls and messages during the current week'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={communicationTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#3B82F6" name={isRTL ? 'المكالمات' : 'Calls'} />
                        <Bar dataKey="messages" fill="#10B981" name={isRTL ? 'الرسائل' : 'Messages'} />
                        <Bar dataKey="answered" fill="#F59E0B" name={isRTL ? 'تم الرد' : 'Answered'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'فعالية التواصل' : 'Communication Effectiveness'}</CardTitle>
                    <CardDescription>
                      {isRTL ? 'نتائج محاولات التواصل مع العملاء' : 'Results of customer communication attempts'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{isRTL ? 'معدل الرد على المكالمات' : 'Call Answer Rate'}</span>
                          <span className="text-sm font-medium">72%</span>
                        </div>
                        <Progress value={72} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{isRTL ? 'معدل الاستجابة للرسائل' : 'Message Response Rate'}</span>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{isRTL ? 'معدل تحويل PTP' : 'PTP Conversion Rate'}</span>
                          <span className="text-sm font-medium">28%</span>
                        </div>
                        <Progress value={28} className="h-2" />
                      </div>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {summaryStats.avgCallsPerLoan}
                          </p>
                          <p className="text-xs text-gray-600">
                            {isRTL ? 'متوسط المكالمات/قرض' : 'Avg Calls/Loan'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {(summaryStats.totalMessages / summaryStats.totalLoans).toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {isRTL ? 'متوسط الرسائل/قرض' : 'Avg Messages/Loan'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'سجل المكالمات الأخيرة' : 'Recent Call Log'}</CardTitle>
                  <CardDescription>
                    {isRTL ? 'آخر 10 مكالمات تم إجراؤها' : 'Last 10 calls made'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredLoans.slice(0, 10).map((loan, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCallResultIcon(loan.lastCallResult)}
                          <div>
                            <p className="font-medium">{loan.customerName}</p>
                            <p className="text-sm text-gray-600">{loan.loanNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{loan.lastCallResult}</p>
                          <p className="text-xs text-gray-500">{formatDate(loan.lastContactDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={performanceMetrics}>
                        <RadialBar dataKey="value" fill="#8884d8" label={{ position: 'insideStart', fill: '#fff' }} />
                        <Legend />
                        <Tooltip />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'تفاصيل الأداء' : 'Performance Details'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{metric.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{metric.value}%</span>
                              <span className="text-xs text-gray-500">/ {metric.target}%</span>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={metric.value} className="h-2" />
                            <div 
                              className="absolute top-0 h-2 w-0.5 bg-gray-600"
                              style={{ left: `${metric.target}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{isRTL ? 'إجمالي القروض المحصلة' : 'Total Loans Collected'}</p>
                        <p className="text-2xl font-bold text-green-600">18</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{isRTL ? 'المبلغ المحصل هذا الشهر' : 'Amount Collected This Month'}</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(850000)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'معلومات الأخصائي' : 'Specialist Information'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <Label>{isRTL ? 'الاسم' : 'Name'}</Label>
                      </div>
                      <p className="font-medium">{reportData.specialist.officer_name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserCheck className="h-4 w-4" />
                        <Label>{isRTL ? 'النوع' : 'Type'}</Label>
                      </div>
                      <p className="font-medium">{reportData.specialist.officer_type}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      </div>
                      <p className="font-medium">{reportData.specialist.email}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <Label>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                      </div>
                      <p className="font-medium">{reportData.specialist.contact_number}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {selectedLoans.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{isRTL ? 'لم يتم تحديد أي قرض' : 'No Loan Selected'}</AlertTitle>
                  <AlertDescription>
                    {isRTL ? 'يرجى تحديد قرض من القائمة لعرض تفاصيل الأقساط' : 'Please select a loan from the list to view installment details'}
                  </AlertDescription>
                </Alert>
              ) : (
                selectedLoans.map(loanNumber => {
                  const loan = filteredLoans.find(l => l.loanNumber === loanNumber);
                  if (!loan) return null;
                  
                  return (
                    <Card key={loanNumber}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{isRTL ? 'تفاصيل أقساط القرض' : 'Loan Installment Details'}</CardTitle>
                            <CardDescription>
                              {loan.customerName} - {loanNumber}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {isRTL ? 'تاريخ البداية' : 'Start Date'}: {formatDate(loan.loanStartDate)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {isRTL ? 'تاريخ الاستحقاق' : 'Maturity Date'}: {formatDate(loan.maturityDate)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{isRTL ? 'رقم القسط' : 'Installment #'}</TableHead>
                              <TableHead>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</TableHead>
                              <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                              <TableHead>{isRTL ? 'تاريخ السداد' : 'Paid Date'}</TableHead>
                              <TableHead>{isRTL ? 'أيام التأخير' : 'Days Overdue'}</TableHead>
                              <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loan.installmentDetails.map((installment, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  #{installment.installmentNumber}
                                </TableCell>
                                <TableCell>{formatDate(installment.dueDate)}</TableCell>
                                <TableCell>{formatCurrency(installment.amount)}</TableCell>
                                <TableCell>
                                  {installment.paidDate ? formatDate(installment.paidDate) : '-'}
                                </TableCell>
                                <TableCell>
                                  {installment.overdueDays > 0 ? (
                                    <Badge variant="destructive">{installment.overdueDays}</Badge>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      installment.status === 'مسدد' ? 'success' : 
                                      installment.status === 'متأخر' ? 'destructive' : 
                                      'secondary'
                                    }
                                  >
                                    {installment.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
};

export default SpecialistLevelReport;