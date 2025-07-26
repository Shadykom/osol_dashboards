import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import specialistReportService from '@/services/specialistReportService';

const SpecialistLevelReport = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State management
  const [loading, setLoading] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [dateRange, setDateRange] = useState('current_month');
  const [loanStatus, setLoanStatus] = useState('all');
  const [delinquencyBucket, setDelinquencyBucket] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data state
  const [specialists, setSpecialists] = useState([]);
  const [reportData, setReportData] = useState({
    specialist: null,
    kpis: {},
    loans: [],
    communications: [],
    promisesToPay: [],
    performance: {}
  });

  // Load specialists on component mount
  useEffect(() => {
    loadSpecialists();
  }, []);

  // Load report data when specialist or filters change
  useEffect(() => {
    if (selectedSpecialist) {
      fetchReportData();
    }
  }, [selectedSpecialist, dateRange, loanStatus, delinquencyBucket]);

  const loadSpecialists = async () => {
    try {
      const response = await specialistReportService.getSpecialists();
      if (response.success) {
        setSpecialists(response.data);
      }
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading specialists:', error);
      }
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const filters = {
        dateRange,
        loanStatus,
        delinquencyBucket
      };
      
      const response = await specialistReportService.getSpecialistReport(selectedSpecialist, filters);
      
      if (response.success) {
        setReportData(response.data);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching report data:', response.error);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching report data:', error);
      }
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

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-800';
      case 'متأخر': return 'bg-yellow-100 text-yellow-800';
      case 'متعثر': return 'bg-red-100 text-red-800';
      case 'مغلق': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getBucketColor = (bucket) => {
    switch (bucket) {
      case 'Current': return 'text-green-600';
      case '1-30 Days': return 'text-yellow-600';
      case '31-60 Days': return 'text-orange-600';
      case '61-90 Days': return 'text-red-600';
      case '90+ Days': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const handleExport = async (format) => {
    try {
      const filters = {
        dateRange,
        loanStatus,
        delinquencyBucket
      };
      
      const response = await specialistReportService.exportReport(selectedSpecialist, format, filters);
      
      if (response.success) {
        // Handle successful export - silent in production
        if (process.env.NODE_ENV === 'development') {
          console.log(`Report exported successfully in ${format} format`);
        }
        // You can add logic here to download the file or show success message
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Export failed:', response.error);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Export error:', error);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate dynamic chart data based on reportData
  const delinquencyDistribution = React.useMemo(() => {
    if (!reportData.loans || reportData.loans.length === 0) {
      return [
        { name: 'Current', value: 27, amount: 6750000, color: '#22c55e' },
        { name: '1-30 Days', value: 8, amount: 2000000, color: '#eab308' },
        { name: '31-60 Days', value: 6, amount: 1500000, color: '#f97316' },
        { name: '61-90 Days', value: 3, amount: 750000, color: '#ef4444' },
        { name: '90+ Days', value: 1, amount: 250000, color: '#991b1b' }
      ];
    }

    return reportData.loans.reduce((acc, loan) => {
      const bucket = loan.delinquencyBucket || 'Current';
      const existing = acc.find(item => item.name === bucket);
      if (existing) {
        existing.value += 1;
        existing.amount += loan.overdueAmount || 0;
      } else {
        acc.push({
          name: bucket,
          value: 1,
          amount: loan.overdueAmount || 0,
          color: bucket === 'Current' ? '#22c55e' : 
                 bucket === '1-30 Days' ? '#eab308' :
                 bucket === '31-60 Days' ? '#f97316' :
                 bucket === '61-90 Days' ? '#ef4444' : '#991b1b'
        });
      }
      return acc;
    }, []);
  }, [reportData.loans]);

  // Collection trend data (mock for now, can be enhanced with real data)
  const collectionTrend = React.useMemo(() => [
    { month: 'يناير', collected: 850000, target: 1000000 },
    { month: 'فبراير', collected: 920000, target: 1000000 },
    { month: 'مارس', collected: 780000, target: 1000000 },
    { month: 'أبريل', collected: 1100000, target: 1000000 },
    { month: 'مايو', collected: 950000, target: 1000000 },
    { month: 'يونيو', collected: 1050000, target: 1000000 },
    { month: 'يوليو', collected: 890000, target: 1000000 }
  ], []);

  // Communication activity data
  const communicationActivity = React.useMemo(() => {
    return reportData.communications && reportData.communications.length > 0 
      ? reportData.communications 
      : [
          { day: 'الأحد', calls: 25, messages: 12, responses: 16 },
          { day: 'الاثنين', calls: 32, messages: 18, responses: 21 },
          { day: 'الثلاثاء', calls: 28, messages: 15, responses: 18 },
          { day: 'الأربعاء', calls: 35, messages: 20, responses: 23 },
          { day: 'الخميس', calls: 30, messages: 16, responses: 19 },
          { day: 'الجمعة', calls: 15, messages: 8, responses: 10 },
          { day: 'السبت', calls: 0, messages: 0, responses: 0 }
        ];
  }, [reportData.communications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقرير مستوى الأخصائي</h1>
          <p className="text-gray-600 mt-2">تقرير تفصيلي لأداء أخصائي التحصيل</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            تصدير PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            المرشحات والتحكم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">اختيار الأخصائي</label>
              <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأخصائي" />
                </SelectTrigger>
                <SelectContent>
                  {specialists.map(specialist => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      {specialist.name} - {specialist.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">الفترة الزمنية</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">الشهر الحالي</SelectItem>
                  <SelectItem value="last_month">الشهر الماضي</SelectItem>
                  <SelectItem value="current_quarter">الربع الحالي</SelectItem>
                  <SelectItem value="last_quarter">الربع الماضي</SelectItem>
                  <SelectItem value="current_year">السنة الحالية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">حالة القرض</label>
              <Select value={loanStatus} onValueChange={setLoanStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="delinquent">متعثر</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">فئة التقادم</label>
              <Select value={delinquencyBucket} onValueChange={setDelinquencyBucket}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="1-30">1-30 أيام</SelectItem>
                  <SelectItem value="31-60">31-60 أيام</SelectItem>
                  <SelectItem value="61-90">61-90 أيام</SelectItem>
                  <SelectItem value="90+">90+ أيام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في العملاء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedSpecialist ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            يرجى اختيار أخصائي التحصيل لعرض التقرير التفصيلي.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Specialist Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{reportData.specialist?.name}</h2>
                  <p className="text-gray-600">{reportData.specialist?.department}</p>
                  <p className="text-sm text-gray-500">كود الأخصائي: {reportData.specialist?.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي القروض</p>
                    <p className="text-2xl font-bold">{reportData.kpis.totalLoans || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">قيمة المحفظة</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.kpis.totalPortfolioValue || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">القروض المتأخرة</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.kpis.overdueLoans || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المكالمات الشهرية</p>
                    <p className="text-2xl font-bold">{reportData.kpis.callsMade || 0}</p>
                  </div>
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">معدل التحصيل</p>
                    <p className="text-2xl font-bold text-green-600">{formatPercentage(reportData.kpis.collectionRate || 0)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed data */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="loans">القروض التفصيلية</TabsTrigger>
              <TabsTrigger value="communications">نشاط التواصل</TabsTrigger>
              <TabsTrigger value="promises">وعود الدفع</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delinquency Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>توزيع فئات التقادم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={delinquencyDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {delinquencyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Collection Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>اتجاه التحصيل الشهري</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={collectionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="collected" stroke="#22c55e" name="المحصل" />
                        <Line type="monotone" dataKey="target" stroke="#ef4444" name="المستهدف" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Communication Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>نشاط التواصل الأسبوعي</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={communicationActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="calls" fill="#3b82f6" name="المكالمات" />
                      <Bar dataKey="messages" fill="#10b981" name="الرسائل" />
                      <Bar dataKey="responses" fill="#f59e0b" name="الردود" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <CardTitle>القروض التفصيلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">العميل</th>
                          <th className="text-right p-2">رقم القرض</th>
                          <th className="text-right p-2">قيمة القرض</th>
                          <th className="text-right p-2">المتأخر</th>
                          <th className="text-right p-2">أيام التأخير</th>
                          <th className="text-right p-2">الفئة</th>
                          <th className="text-right p-2">الحالة</th>
                          <th className="text-right p-2">آخر اتصال</th>
                          <th className="text-right p-2">المكالمات</th>
                          <th className="text-right p-2">وعد الدفع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.loans.map((loan) => (
                          <tr key={loan.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{loan.customerName}</div>
                                <div className="text-xs text-gray-500">{loan.customerId}</div>
                              </div>
                            </td>
                            <td className="p-2">{loan.id}</td>
                            <td className="p-2">{formatCurrency(loan.loanAmount)}</td>
                            <td className="p-2 text-red-600 font-medium">{formatCurrency(loan.overdueAmount)}</td>
                            <td className="p-2">{loan.overdueDays} يوم</td>
                            <td className="p-2">
                              <span className={`text-sm ${getBucketColor(loan.delinquencyBucket)}`}>
                                {loan.delinquencyBucket}
                              </span>
                            </td>
                            <td className="p-2">
                              <Badge className={getStatusBadgeColor(loan.loanStatus)}>
                                {loan.loanStatus}
                              </Badge>
                            </td>
                            <td className="p-2">{loan.lastContactDate}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {loan.callsThisMonth}
                                <MessageSquare className="h-3 w-3 ml-2" />
                                {loan.messagesThisMonth}
                              </div>
                            </td>
                            <td className="p-2">
                              {loan.hasPromiseToPay ? (
                                <div className="text-xs">
                                  <div className="text-green-600">✓ {formatCurrency(loan.promiseAmount)}</div>
                                  <div className="text-gray-500">{loan.promiseDate}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">لا يوجد</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات التواصل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-blue-600" />
                          <span>إجمالي المكالمات</span>
                        </div>
                        <span className="font-bold text-blue-600">{reportData.kpis.callsMade}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                          <span>إجمالي الرسائل</span>
                        </div>
                        <span className="font-bold text-green-600">{reportData.kpis.messagesSent}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-yellow-600" />
                          <span>معدل الاستجابة</span>
                        </div>
                        <span className="font-bold text-yellow-600">{formatPercentage(reportData.kpis.averageResponseRate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>نتائج آخر المكالمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.loans.map((loan) => (
                        <div key={loan.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{loan.customerName}</div>
                            <div className="text-xs text-gray-500">{loan.lastContactDate}</div>
                          </div>
                          <div className="text-xs">
                            <Badge variant={loan.lastCallResult.includes('تم الرد') ? 'default' : 'secondary'}>
                              {loan.lastCallResult}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="promises">
              <Card>
                <CardHeader>
                  <CardTitle>وعود الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{reportData.kpis.promisesToPay}</div>
                      <div className="text-sm text-gray-600">إجمالي الوعود</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{reportData.kpis.promisesFulfilled}</div>
                      <div className="text-sm text-gray-600">الوعود المنجزة</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{formatPercentage((reportData.kpis.promisesFulfilled / reportData.kpis.promisesToPay) * 100)}</div>
                      <div className="text-sm text-gray-600">معدل الإنجاز</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">العميل</th>
                          <th className="text-right p-2">رقم القرض</th>
                          <th className="text-right p-2">تاريخ الوعد</th>
                          <th className="text-right p-2">مبلغ الوعد</th>
                          <th className="text-right p-2">الحالة</th>
                          <th className="text-right p-2">الأيام المتبقية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.promisesToPay.map((loan) => (
                          <tr key={loan.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{loan.customerName}</td>
                            <td className="p-2">{loan.id}</td>
                            <td className="p-2">{loan.promiseDate}</td>
                            <td className="p-2 font-medium">{formatCurrency(loan.promiseAmount)}</td>
                            <td className="p-2">
                              <Badge variant={loan.promiseStatus === 'تم الوفاء بالوعد' ? 'default' : 'secondary'}>
                                {loan.promiseStatus}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {loan.promiseStatus === 'قيد الانتظار' ? (
                                <span className="text-orange-600">3 أيام</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SpecialistLevelReport;

