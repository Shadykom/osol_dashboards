import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
// Table components implemented inline
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

const TableRow = ({ children, className = "" }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
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
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  User, Phone, MessageSquare, Calendar, DollarSign, Target,
  Clock, AlertTriangle, CheckCircle, TrendingUp, Download,
  FileText, Eye, Filter, RefreshCw
} from 'lucide-react';
import SpecialistReportService from '@/services/specialistReportService';

// Create instance of the service
const specialistService = new SpecialistReportService();

const SpecialistReport = () => {
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'current_month',
    loanStatus: 'all',
    delinquencyBucket: 'all'
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
      const response = await specialistService.getSpecialists();
      if (response.success) {
        setSpecialists(response.data);
        if (response.data.length > 0) {
          setSelectedSpecialist(response.data[0].officer_id);
        }
      }
    } catch (error) {
      console.error('Error loading specialists:', error);
    }
  };

  const loadSpecialistReport = async () => {
    if (!selectedSpecialist) return;
    
    setLoading(true);
    try {
      const response = await specialistService.getSpecialistReport(selectedSpecialist, filters);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error loading specialist report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير متوفر';
    return new Date(dateString).toLocaleDateString('ar-SA');
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportReport = (format) => {
    console.log(`Exporting report in ${format} format`);
    // Implementation for export functionality
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const performanceData = [
    { name: 'معدل التحصيل', value: reportData.performance.collectionRate, max: 100 },
    { name: 'معدل الاستجابة', value: reportData.performance.responseRate, max: 100 },
    { name: 'معدل الوعود', value: reportData.performance.promiseRate, max: 100 },
    { name: 'معدل الوفاء', value: reportData.performance.fulfillmentRate, max: 100 }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقرير مستوى الأخصائي</h1>
          <p className="text-gray-600 mt-1">تقرير تفصيلي لأداء أخصائي التحصيل</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="اختر الأخصائي" />
            </SelectTrigger>
            <SelectContent>
              {specialists.map(specialist => (
                <SelectItem key={specialist.officer_id} value={specialist.officer_id}>
                  {specialist.officer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadSpecialistReport}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 ml-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 ml-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters({...filters, dateRange: value})}
            >
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

            <Select 
              value={filters.loanStatus} 
              onValueChange={(value) => setFilters({...filters, loanStatus: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="حالة القرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
                <SelectItem value="delinquent">متعثر</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.delinquencyBucket} 
              onValueChange={(value) => setFilters({...filters, delinquencyBucket: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="فئة التقادم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="Current">جاري</SelectItem>
                <SelectItem value="1-30 Days">1-30 يوم</SelectItem>
                <SelectItem value="31-60 Days">31-60 يوم</SelectItem>
                <SelectItem value="61-90 Days">61-90 يوم</SelectItem>
                <SelectItem value="90+ Days">أكثر من 90 يوم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">إجمالي القروض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(reportData.kpis.totalLoans)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(reportData.kpis.overdueLoans)} متأخر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">قيمة المحفظة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.kpis.totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي القروض
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">المتأخرات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reportData.kpis.totalOverdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي المتأخرات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">معدل التحصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.kpis.collectionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">نشاط التواصل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="font-bold">{reportData.kpis.callsMade}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="font-bold">{reportData.kpis.messagesSent}</span>
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

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة القروض المخصصة</CardTitle>
              <CardDescription>جميع القروض المخصصة للأخصائي مع التفاصيل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم القرض</TableHead>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>نوع المنتج</TableHead>
                      <TableHead>قيمة القرض</TableHead>
                      <TableHead>المسدد</TableHead>
                      <TableHead>المستحق</TableHead>
                      <TableHead>المتأخر</TableHead>
                      <TableHead>أيام التأخير</TableHead>
                      <TableHead>فئة التقادم</TableHead>
                      <TableHead>آخر اتصال</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.loans.map((loan) => (
                      <TableRow key={loan.loanNumber}>
                        <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                        <TableCell>{loan.customerName}</TableCell>
                        <TableCell>{loan.productType}</TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(loan.paidAmount)}
                        </TableCell>
                        <TableCell>{formatCurrency(loan.dueAmount)}</TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(loan.totalOverdueAmount)}
                        </TableCell>
                        <TableCell>{loan.totalOverdueDays}</TableCell>
                        <TableCell>
                          <Badge className={getDelinquencyColor(loan.delinquencyBucket)}>
                            {loan.delinquencyBucket}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(loan.lastContactDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نشاط التواصل اليومي</CardTitle>
              <CardDescription>عدد المكالمات والرسائل خلال الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.communicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" fill="#3B82F6" name="المكالمات" />
                  <Bar dataKey="messages" fill="#10B981" name="الرسائل" />
                  <Bar dataKey="responses" fill="#F59E0B" name="الردود" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معدل الاستجابة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.kpis.averageResponseRate}%</div>
                <p className="text-xs text-muted-foreground">من إجمالي المحاولات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">متوسط المكالمات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(reportData.kpis.callsMade / 30)}
                </div>
                <p className="text-xs text-muted-foreground">مكالمة/يوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">نسبة الوعود</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.kpis.promisesToPay > 0 ? 
                    Math.round((reportData.kpis.promisesToPay / reportData.kpis.totalLoans) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">من إجمالي القروض</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>وعود الدفع النشطة</CardTitle>
              <CardDescription>جميع وعود الدفع القائمة والمنتظرة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>تاريخ الوعد</TableHead>
                      <TableHead>مبلغ الوعد</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الأيام المتبقية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.promisesToPay.map((ptp, index) => {
                      const daysRemaining = ptp.daysRemaining || 0;
                      return (
                        <TableRow key={ptp.ptpId || index}>
                          <TableCell>{ptp.customerName}</TableCell>
                          <TableCell>{formatDate(ptp.ptpDate)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(ptp.ptpAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={ptp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {ptp.status === 'ACTIVE' ? 'نشط' : ptp.status === 'KEPT' ? 'محقق' : 'منتهي'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={daysRemaining < 0 ? 'destructive' : 'outline'}>
                              {daysRemaining} يوم
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">إجمالي وعود الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.kpis.promisesToPay}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.kpis.promisesFulfilled} تم الوفاء بها
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معدل الوفاء بالوعود</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.kpis.promisesToPay > 0 ?
                    Math.round((reportData.kpis.promisesFulfilled / reportData.kpis.promisesToPay) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">نسبة الوفاء</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={performanceData}>
                    <RadialBar dataKey="value" fill="#8884d8" label={{ position: 'insideStart', fill: '#fff' }} />
                    <Legend />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((metric, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm font-medium">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>معلومات الأخصائي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم</p>
                  <p className="font-medium">{reportData.specialist.officer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">النوع</p>
                  <p className="font-medium">{reportData.specialist.officer_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                  <p className="font-medium">{reportData.specialist.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">رقم الهاتف</p>
                  <p className="font-medium">{reportData.specialist.contact_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpecialistReport;