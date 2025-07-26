import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  User, Phone, Mail, Calendar, DollarSign, AlertTriangle,
  FileText, Download, RefreshCw, Filter, Search, Target,
  TrendingUp, Clock, MessageSquare, PhoneCall, CheckCircle,
  XCircle, Loader2, FileDown
} from 'lucide-react';
import { CollectionService } from '@/services/collectionService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SpecialistLevelReport = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [specialists, setSpecialists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState(null);
  const componentRef = useRef();

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'current_month',
    loanStatus: 'all',
    delinquencyBucket: 'all',
    customerType: 'all',
    productType: 'all',
    ptpStatus: 'all'
  });

  // Fetch specialists list
  const fetchSpecialists = async () => {
    try {
      const result = await CollectionService.getSpecialists();
      if (result.success && result.data) {
        setSpecialists(result.data);
        if (result.data.length > 0 && !selectedSpecialist) {
          setSelectedSpecialist(result.data[0].officer_id);
        }
      }
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  };

  // Fetch specialist report data
  const fetchReportData = async () => {
    if (!selectedSpecialist) return;
    
    try {
      setLoading(true);
      const result = await CollectionService.getSpecialistReport(selectedSpecialist, filters);
      if (result.success && result.data) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  // Export functions
  const exportToExcel = () => {
    if (!reportData || !reportData.loans) return;

    const ws = XLSX.utils.json_to_sheet(reportData.loans.map(loan => ({
      'رقم القرض': loan.loanNumber,
      'اسم العميل': loan.customerName,
      'رقم الهوية': loan.customerId,
      'نوع العميل': loan.customerType,
      'نوع المنتج': loan.productType,
      'قيمة القرض': loan.loanAmount,
      'المبلغ المسدد': loan.paidAmount,
      'المستحق': loan.dueAmount,
      'غير المستحق': loan.notDueAmount,
      'المتأخرات': loan.totalOverdueAmount,
      'أيام التأخير': loan.totalOverdueDays,
      'فئة التقادم': loan.delinquencyBucket,
      'حالة القرض': loan.loanStatus,
      'آخر اتصال': loan.lastContactDate,
      'المكالمات هذا الشهر': loan.callsThisMonth,
      'الرسائل هذا الشهر': loan.messagesThisMonth,
      'نتيجة آخر مكالمة': loan.lastCallResult,
      'وعد بالدفع': loan.hasPromiseToPay ? 'نعم' : 'لا',
      'تاريخ الوعد': loan.ptpDate || '-',
      'مبلغ الوعد': loan.ptpAmount || 0,
      'حالة الوعد': loan.ptpStatus || '-'
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الأخصائي');
    
    // Add summary sheet
    const summaryData = [
      { 'المؤشر': 'إجمالي القروض', 'القيمة': reportData.kpis.totalLoans },
      { 'المؤشر': 'إجمالي المحفظة', 'القيمة': formatCurrency(reportData.kpis.totalPortfolioValue) },
      { 'المؤشر': 'القروض المتأخرة', 'القيمة': reportData.kpis.overdueLoans },
      { 'المؤشر': 'إجمالي المتأخرات', 'القيمة': formatCurrency(reportData.kpis.totalOverdueAmount) },
      { 'المؤشر': 'معدل التحصيل', 'القيمة': `${reportData.kpis.collectionRate}%` },
      { 'المؤشر': 'المكالمات', 'القيمة': reportData.kpis.callsMade },
      { 'المؤشر': 'الرسائل', 'القيمة': reportData.kpis.messagesSent },
      { 'المؤشر': 'وعود الدفع', 'القيمة': reportData.kpis.promisesToPay },
      { 'المؤشر': 'الوعود المحققة', 'القيمة': reportData.kpis.promisesFulfilled }
    ];
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص');
    
    XLSX.writeFile(wb, `specialist_report_${selectedSpecialist}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Set Arabic font support (you would need to add an Arabic font)
    doc.setFontSize(16);
    doc.text('تقرير مستوى الأخصائي', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    // Add specialist info
    doc.setFontSize(12);
    doc.text(`الأخصائي: ${reportData.specialist?.officer_name || selectedSpecialist}`, 20, 25);
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, 20, 32);
    
    // Add KPIs
    doc.setFontSize(14);
    doc.text('مؤشرات الأداء الرئيسية', 20, 45);
    
    doc.setFontSize(10);
    const kpiData = [
      ['المؤشر', 'القيمة'],
      ['إجمالي القروض', reportData.kpis.totalLoans],
      ['إجمالي المحفظة', formatCurrency(reportData.kpis.totalPortfolioValue)],
      ['القروض المتأخرة', reportData.kpis.overdueLoans],
      ['إجمالي المتأخرات', formatCurrency(reportData.kpis.totalOverdueAmount)],
      ['معدل التحصيل', `${reportData.kpis.collectionRate}%`]
    ];
    
    doc.autoTable({
      startY: 50,
      head: [kpiData[0]],
      body: kpiData.slice(1),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [220, 38, 38] }
    });
    
    // Add loans table
    doc.addPage();
    doc.setFontSize(14);
    doc.text('تفاصيل القروض', 20, 15);
    
    const loansData = reportData.loans.map(loan => [
      loan.loanNumber,
      loan.customerName,
      formatCurrency(loan.totalOverdueAmount),
      loan.totalOverdueDays,
      loan.delinquencyBucket,
      loan.lastCallResult || '-'
    ]);
    
    doc.autoTable({
      startY: 20,
      head: [['رقم القرض', 'العميل', 'المتأخرات', 'أيام التأخير', 'فئة التقادم', 'آخر اتصال']],
      body: loansData,
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] }
    });
    
    doc.save(`specialist_report_${selectedSpecialist}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Helper functions
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

  const getDelinquencyColor = (bucket) => {
    const colors = {
      'Current': 'text-green-600',
      '1-30 Days': 'text-yellow-600',
      '31-60 Days': 'text-orange-600',
      '61-90 Days': 'text-red-600',
      '91-180 Days': 'text-red-700',
      '181-360 Days': 'text-red-800',
      '>360 Days': 'text-red-900'
    };
    return colors[bucket] || 'text-gray-600';
  };

  const getStatusBadge = (status) => {
    const variants = {
      'نشط': 'default',
      'متأخر': 'warning',
      'متعثر': 'destructive',
      'مغلق': 'secondary'
    };
    return variants[status] || 'default';
  };

  // Effects
  useEffect(() => {
    fetchSpecialists();
  }, []);

  useEffect(() => {
    if (selectedSpecialist) {
      fetchReportData();
    }
  }, [selectedSpecialist, filters]);

  // Filter loans based on search
  const filteredLoans = reportData?.loans?.filter(loan =>
    loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Chart data preparation
  const communicationChartData = reportData?.communicationData || [];
  const promiseChartData = reportData?.promisesToPay ? [
    { name: 'محقق', value: reportData.promisesToPay.filter(p => p.status === 'KEPT').length, color: '#22c55e' },
    { name: 'قيد الانتظار', value: reportData.promisesToPay.filter(p => p.status === 'ACTIVE').length, color: '#f59e0b' },
    { name: 'غير محقق', value: reportData.promisesToPay.filter(p => p.status === 'BROKEN').length, color: '#ef4444' }
  ] : [];

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" ref={componentRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقرير مستوى الأخصائي</h1>
          <p className="text-gray-600 mt-1">تقرير تفصيلي لأداء أخصائي التحصيل وحالة القروض المُدارة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="اختر الأخصائي" />
            </SelectTrigger>
            <SelectContent>
              {specialists.map(specialist => (
                <SelectItem key={specialist.officer_id} value={specialist.officer_id}>
                  {specialist.officer_name} - {specialist.officer_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
              <SelectTrigger>
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">الشهر الحالي</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="current_quarter">الربع الحالي</SelectItem>
                <SelectItem value="current_year">السنة الحالية</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.loanStatus} onValueChange={(value) => setFilters({...filters, loanStatus: value})}>
              <SelectTrigger>
                <SelectValue placeholder="حالة القرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="نشط">نشط</SelectItem>
                <SelectItem value="متأخر">متأخر</SelectItem>
                <SelectItem value="متعثر">متعثر</SelectItem>
                <SelectItem value="مغلق">مغلق</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.delinquencyBucket} onValueChange={(value) => setFilters({...filters, delinquencyBucket: value})}>
              <SelectTrigger>
                <SelectValue placeholder="فئة التقادم" />
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

            <Select value={filters.customerType} onValueChange={(value) => setFilters({...filters, customerType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="نوع العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="فرد">فرد</SelectItem>
                <SelectItem value="مؤسسة">مؤسسة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.productType} onValueChange={(value) => setFilters({...filters, productType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                <SelectItem value="قرض تورق">قرض تورق</SelectItem>
                <SelectItem value="قرض كاش">قرض كاش</SelectItem>
                <SelectItem value="تمويل شخصي">تمويل شخصي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.ptpStatus} onValueChange={(value) => setFilters({...filters, ptpStatus: value})}>
              <SelectTrigger>
                <SelectValue placeholder="وعد الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="has_ptp">يوجد وعد</SelectItem>
                <SelectItem value="no_ptp">لا يوجد وعد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي القروض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(reportData.kpis.totalLoans)}</div>
                <Progress value={70} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المحفظة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.kpis.totalPortfolioValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  متأخر: {formatCurrency(reportData.kpis.totalOverdueAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.kpis.collectionRate}%</div>
                <Progress value={reportData.kpis.collectionRate} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">نشاط التواصل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold">{reportData.kpis.callsMade}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold">{reportData.kpis.messagesSent}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  معدل الاستجابة: {reportData.kpis.averageResponseRate}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">وعود الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-2xl font-bold">{reportData.kpis.promisesToPay}</div>
                    <p className="text-xs text-muted-foreground">إجمالي</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{reportData.kpis.promisesFulfilled}</div>
                    <p className="text-xs text-muted-foreground">محقق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="loans" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="loans">القروض</TabsTrigger>
              <TabsTrigger value="communication">التواصل</TabsTrigger>
              <TabsTrigger value="promises">وعود الدفع</TabsTrigger>
              <TabsTrigger value="performance">الأداء</TabsTrigger>
            </TabsList>

            {/* Loans Tab */}
            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>تفاصيل القروض المُدارة</span>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="بحث بالاسم أو رقم القرض..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم القرض</TableHead>
                          <TableHead>العميل</TableHead>
                          <TableHead>رقم الهوية</TableHead>
                          <TableHead>نوع العميل</TableHead>
                          <TableHead>نوع المنتج</TableHead>
                          <TableHead className="text-right">قيمة القرض</TableHead>
                          <TableHead className="text-right">المسدد</TableHead>
                          <TableHead className="text-right">المستحق</TableHead>
                          <TableHead className="text-right">غير المستحق</TableHead>
                          <TableHead className="text-right">المتأخرات</TableHead>
                          <TableHead>أيام التأخير</TableHead>
                          <TableHead>فئة التقادم</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>آخر اتصال</TableHead>
                          <TableHead className="text-center">المكالمات</TableHead>
                          <TableHead className="text-center">الرسائل</TableHead>
                          <TableHead>نتيجة آخر مكالمة</TableHead>
                          <TableHead className="text-center">وعد بالدفع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLoans.map((loan, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{loan.customerName}</p>
                                <p className="text-xs text-gray-500">{loan.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>{loan.customerId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{loan.customerType}</Badge>
                            </TableCell>
                            <TableCell>{loan.productType}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.loanAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(loan.paidAmount)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatCurrency(loan.dueAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.notDueAmount)}</TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {formatCurrency(loan.totalOverdueAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{loan.totalOverdueDays}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${getDelinquencyColor(loan.delinquencyBucket)}`}>
                                {loan.delinquencyBucket}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(loan.loanStatus)}>
                                {loan.loanStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{loan.lastContactDate}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <PhoneCall className="h-4 w-4" />
                                {loan.callsThisMonth}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {loan.messagesThisMonth}
                              </div>
                            </TableCell>
                            <TableCell>{loan.lastCallResult}</TableCell>
                            <TableCell className="text-center">
                              {loan.hasPromiseToPay ? (
                                <div className="text-center">
                                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                                  <p className="text-xs mt-1">{loan.ptpDate}</p>
                                  <p className="text-xs font-semibold">{formatCurrency(loan.ptpAmount)}</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {loan.ptpStatus}
                                  </Badge>
                                </div>
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communication Tab */}
            <TabsContent value="communication">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>نشاط التواصل الأسبوعي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={communicationChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#3b82f6" name="مكالمات" />
                        <Bar dataKey="messages" fill="#10b981" name="رسائل" />
                        <Bar dataKey="answered" fill="#f59e0b" name="تم الرد" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات التواصل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">معدل الرد على المكالمات</span>
                          <span className="text-sm font-bold">{reportData.performance.responseRate}%</span>
                        </div>
                        <Progress value={reportData.performance.responseRate} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">معدل تحويل المكالمات لوعود</span>
                          <span className="text-sm font-bold">{reportData.performance.promiseRate}%</span>
                        </div>
                        <Progress value={reportData.performance.promiseRate} />
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">نتائج المكالمات</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">تم الرد - وعد بالدفع</span>
                            <Badge className="bg-green-500">{Math.floor(reportData.kpis.callsMade * 0.3)}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">تم الرد - رفض الدفع</span>
                            <Badge className="bg-orange-500">{Math.floor(reportData.kpis.callsMade * 0.2)}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">لم يتم الرد</span>
                            <Badge className="bg-red-500">{Math.floor(reportData.kpis.callsMade * 0.35)}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">خطأ بالرقم</span>
                            <Badge className="bg-gray-500">{Math.floor(reportData.kpis.callsMade * 0.1)}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">انشغال الخط</span>
                            <Badge className="bg-yellow-500">{Math.floor(reportData.kpis.callsMade * 0.05)}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Promises Tab */}
            <TabsContent value="promises">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>وعود الدفع النشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم القرض</TableHead>
                          <TableHead>العميل</TableHead>
                          <TableHead>تاريخ الوعد</TableHead>
                          <TableHead className="text-right">مبلغ الوعد</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الأيام المتبقية</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.promisesToPay?.filter(ptp => ptp.status === 'ACTIVE').map((ptp, index) => (
                          <TableRow key={index}>
                            <TableCell>{ptp.caseNumber}</TableCell>
                            <TableCell>{ptp.customerName}</TableCell>
                            <TableCell>{new Date(ptp.ptpDate).toLocaleDateString('ar-SA')}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(ptp.ptpAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="warning">قيد الانتظار</Badge>
                            </TableCell>
                            <TableCell>
                              {Math.ceil((new Date(ptp.ptpDate) - new Date()) / (1000 * 60 * 60 * 24))} يوم
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>توزيع وعود الدفع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={promiseChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {promiseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 space-y-2">
                      {promiseChartData.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded`} style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <Badge variant="outline">{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>مؤشرات الأداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">معدل التحصيل</span>
                          <span className="text-2xl font-bold text-green-600">
                            {reportData.performance.collectionRate}%
                          </span>
                        </div>
                        <Progress value={reportData.performance.collectionRate} className="h-3" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">معدل الاستجابة</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {reportData.performance.responseRate}%
                          </span>
                        </div>
                        <Progress value={reportData.performance.responseRate} className="h-3" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">معدل الوعود</span>
                          <span className="text-2xl font-bold text-orange-600">
                            {reportData.performance.promiseRate}%
                          </span>
                        </div>
                        <Progress value={reportData.performance.promiseRate} className="h-3" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">معدل تحقيق الوعود</span>
                          <span className="text-2xl font-bold text-purple-600">
                            {reportData.performance.fulfillmentRate}%
                          </span>
                        </div>
                        <Progress value={reportData.performance.fulfillmentRate} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ملخص الأداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          <strong>نقاط القوة:</strong>
                          <ul className="list-disc list-inside mt-2">
                            <li>معدل استجابة عالي للمكالمات ({reportData.performance.responseRate}%)</li>
                            <li>معدل تحصيل جيد ({reportData.performance.collectionRate}%)</li>
                            <li>نشاط تواصل منتظم مع العملاء</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          <strong>مجالات التحسين:</strong>
                          <ul className="list-disc list-inside mt-2">
                            <li>زيادة معدل تحويل المكالمات لوعود دفع</li>
                            <li>تحسين متابعة الوعود لضمان تحقيقها</li>
                            <li>التركيز على العملاء ذوي المتأخرات العالية</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">التوصيات</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>زيادة معدل الاتصال في الفترة الصباحية</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>استخدام الرسائل النصية قبل الاتصال للحصول على معدل رد أفضل</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>التركيز على العملاء في فئة 31-60 يوم لمنع تدهور الحالة</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SpecialistLevelReport;