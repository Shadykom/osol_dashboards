import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  AlertCircle, Calendar, Target, Activity
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

// ألوان فئات التقادم
const AGING_COLORS = {
  'Current': '#4CAF50',
  '1-30 Days': '#8BC34A',
  '31-60 Days': '#FFC107',
  '61-90 Days': '#FF9800',
  '91-180 Days': '#FF5722',
  '181-365 Days': '#F44336',
  'Over 365 Days': '#B71C1C'
};

const DelinquencyExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [dashboardData, setDashboardData] = useState({
    portfolioSummary: null,
    agingDistribution: [],
    collectionTrends: [],
    topDelinquents: [],
    performanceComparison: null
  });

  // جلب البيانات من قاعدة البيانات
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // جلب ملخص المحفظة
      const portfolioSummary = await fetchPortfolioSummary();
      
      // جلب توزيع فئات التقادم
      const agingDistribution = await fetchAgingDistribution();
      
      // جلب اتجاهات التحصيل
      const collectionTrends = await fetchCollectionTrends();
      
      // جلب أكبر العملاء المتأخرين
      const topDelinquents = await fetchTopDelinquents();
      
      // جلب مقارنة الأداء
      const performanceComparison = await fetchPerformanceComparison();

      setDashboardData({
        portfolioSummary,
        agingDistribution,
        collectionTrends,
        topDelinquents,
        performanceComparison
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioSummary = async () => {
    const { data, error } = await supabase
      .from('executive_delinquency_summary')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  };

  const fetchAgingDistribution = async () => {
    const { data, error } = await supabase
      .from('aging_distribution')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  };

  const fetchCollectionTrends = async () => {
    const { data, error } = await supabase
      .from('collection_rates')
      .select('*')
      .eq('period_type', 'MONTHLY')
      .order('period_date', { ascending: false })
      .limit(12);

    if (error) throw error;
    return data?.reverse() || [];
  };

  const fetchTopDelinquents = async () => {
    const { data, error } = await supabase
      .from('top_delinquent_customers')
      .select('*')
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  const fetchPerformanceComparison = async () => {
    const { data, error } = await supabase
      .from('executive_delinquency_summary')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  };

  // حساب التغيير في النسبة المئوية
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(2);
  };

  // تنسيق الأرقام
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const { portfolioSummary, agingDistribution, collectionTrends, topDelinquents, performanceComparison } = dashboardData;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* العنوان والفترة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة بيانات المتأخرات - المستوى التنفيذي</h1>
          <p className="text-gray-600 mt-2">نظرة شاملة على أداء التحصيل وصحة المحفظة</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">الشهر الحالي</SelectItem>
            <SelectItem value="quarter">الربع الحالي</SelectItem>
            <SelectItem value="year">السنة الحالية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي المحفظة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحفظة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary?.total_portfolio_value || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioSummary?.total_loans || 0} قرض نشط
            </p>
          </CardContent>
        </Card>

        {/* إجمالي المتأخرات */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المتأخرات</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary?.total_delinquent_value || 0)}</div>
            <div className="flex items-center mt-1">
              <Badge variant={portfolioSummary?.delinquency_rate > 5 ? "destructive" : "secondary"}>
                {formatPercentage(portfolioSummary?.delinquency_rate || 0)}
              </Badge>
              <span className="text-xs text-muted-foreground mr-2">من إجمالي المحفظة</span>
            </div>
          </CardContent>
        </Card>

        {/* معدل التحصيل */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التحصيل الشهري</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(portfolioSummary?.monthly_collection_rate || 0)}</div>
            <Progress value={portfolioSummary?.monthly_collection_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* عدد الحسابات المتأخرة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحسابات المتأخرة</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioSummary?.delinquent_loans || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((portfolioSummary?.delinquent_loans / portfolioSummary?.total_loans) * 100).toFixed(1)}% من إجمالي القروض
            </p>
          </CardContent>
        </Card>
      </div>

      {/* مقارنة الأداء */}
      {performanceComparison && (
        <Card>
          <CardHeader>
            <CardTitle>مقارنة الأداء بالفترات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* مقارنة بالشهر السابق */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">مقارنة بالشهر السابق</p>
                <div className="flex items-center justify-center mt-2">
                  {performanceComparison.delinquency_rate < performanceComparison.prev_month_delinquency_rate ? (
                    <TrendingDown className="h-5 w-5 text-green-500 ml-1" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-red-500 ml-1" />
                  )}
                  <span className={`text-lg font-bold ${
                    performanceComparison.delinquency_rate < performanceComparison.prev_month_delinquency_rate
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange(
                      performanceComparison.delinquency_rate,
                      performanceComparison.prev_month_delinquency_rate
                    )}%
                  </span>
                </div>
              </div>

              {/* مقارنة بالربع السابق */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">مقارنة بالربع السابق</p>
                <div className="flex items-center justify-center mt-2">
                  {performanceComparison.delinquency_rate < performanceComparison.prev_quarter_delinquency_rate ? (
                    <TrendingDown className="h-5 w-5 text-green-500 ml-1" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-red-500 ml-1" />
                  )}
                  <span className={`text-lg font-bold ${
                    performanceComparison.delinquency_rate < performanceComparison.prev_quarter_delinquency_rate
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange(
                      performanceComparison.delinquency_rate,
                      performanceComparison.prev_quarter_delinquency_rate
                    )}%
                  </span>
                </div>
              </div>

              {/* مقارنة بالعام السابق */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">مقارنة بالعام السابق</p>
                <div className="flex items-center justify-center mt-2">
                  {performanceComparison.delinquency_rate < performanceComparison.prev_year_delinquency_rate ? (
                    <TrendingDown className="h-5 w-5 text-green-500 ml-1" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-red-500 ml-1" />
                  )}
                  <span className={`text-lg font-bold ${
                    performanceComparison.delinquency_rate < performanceComparison.prev_year_delinquency_rate
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange(
                      performanceComparison.delinquency_rate,
                      performanceComparison.prev_year_delinquency_rate
                    )}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزيع المتأخرات حسب فئات التقادم */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المتأخرات حسب فئات التقادم</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ bucket_name, percentage }) => `${bucket_name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_amount"
                >
                  {agingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color_code || AGING_COLORS[entry.bucket_name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {agingDistribution.map((bucket) => (
                <div key={bucket.bucket_name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full ml-2"
                      style={{ backgroundColor: bucket.color_code || AGING_COLORS[bucket.bucket_name] }}
                    />
                    <span className="text-sm">{bucket.bucket_name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{formatCurrency(bucket.total_amount)}</span>
                    <span className="text-gray-500 mr-2">({bucket.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* اتجاهات معدل التحصيل */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات معدل التحصيل الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={collectionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period_date"
                  tickFormatter={(date) => format(new Date(date), 'MMM yyyy', { locale: ar })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'collection_rate') return formatPercentage(value);
                    return formatCurrency(value);
                  }}
                  labelFormatter={(date) => format(new Date(date), 'MMMM yyyy', { locale: ar })}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total_collected_amount"
                  fill="#4CAF50"
                  name="المبلغ المحصل"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="collection_rate"
                  stroke="#2196F3"
                  strokeWidth={2}
                  name="معدل التحصيل %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* أكبر العملاء المتأخرين */}
      <Card>
        <CardHeader>
          <CardTitle>أكبر 10 عملاء متأخرين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">اسم العميل</th>
                  <th className="text-right py-2">رقم العميل</th>
                  <th className="text-right py-2">عدد القروض المتأخرة</th>
                  <th className="text-right py-2">إجمالي المتأخرات</th>
                  <th className="text-right py-2">أقصى أيام تأخير</th>
                  <th className="text-right py-2">حالة التحصيل</th>
                </tr>
              </thead>
              <tbody>
                {topDelinquents.map((customer, index) => (
                  <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{customer.customer_name}</td>
                    <td className="py-3">{customer.customer_number}</td>
                    <td className="py-3 text-center">{customer.delinquent_accounts}</td>
                    <td className="py-3 font-medium">{formatCurrency(customer.total_outstanding)}</td>
                    <td className="py-3 text-center">
                      <Badge variant={customer.max_days_past_due > 90 ? "destructive" : "warning"}>
                        {customer.max_days_past_due} يوم
                      </Badge>
                    </td>
                    <td className="py-3">{customer.collection_statuses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* التوصيات */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>التوصيات الاستراتيجية:</strong>
          <ul className="mt-2 mr-4 list-disc">
            <li>التركيز على العملاء في فئة 61-90 يوم لمنع انتقالهم لفئات أعلى</li>
            <li>مراجعة سياسات الإقراض للعملاء ذوي المخاطر العالية</li>
            <li>تعزيز فرق التحصيل في الفروع ذات الأداء المنخفض</li>
            <li>تطوير برامج إعادة الهيكلة للقروض المتعثرة طويلة الأجل</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DelinquencyExecutiveDashboard;