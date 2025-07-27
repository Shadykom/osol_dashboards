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
import { useTranslation } from 'react-i18next';
// Simple table components
const Table = ({ children, className = "" }) => (
  <table className={`w-full border-collapse ${className}`}>{children}</table>
);
const TableHeader = ({ children }) => <thead>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children, className = "" }) => (
  <tr className={`border-b ${className}`}>{children}</tr>
);
const TableHead = ({ children, className = "" }) => (
  <th className={`text-left p-2 font-medium text-gray-900 ${className}`}>{children}</th>
);
const TableCell = ({ children, className = "" }) => (
  <td className={`p-2 ${className}`}>{children}</td>
);
import { 
  LineChart, Line, BarChart, Bar, ComposedChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Treemap, Sankey
} from 'recharts';
import { 
  Package, TrendingUp, Users, DollarSign, AlertTriangle, MapPin,
  Calendar, Filter, Download, RefreshCw, ChevronRight, Eye,
  AlertCircle, CheckCircle, Clock, Target, Award, ArrowUpRight,
  ArrowDownRight, Loader2, BarChart3, Shield, Zap, CreditCard,
  Phone, MessageSquare, Trophy
} from 'lucide-react';
import { ProductReportService } from '@/services/productReportService';
import { BranchReportService } from '@/services/branchReportService';

const ProductLevelReport = () => {
  const { t } = useTranslation();
  
  // State Management
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showDefaulterDetails, setShowDefaulterDetails] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('current_month');
  const [branch, setBranch] = useState('all');
  const [customerType, setCustomerType] = useState('all');
  const [delinquencyBucket, setDelinquencyBucket] = useState('all');
  const [showComparison, setShowComparison] = useState(true);

  // Load products and branches on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load report data when product or filters change
  useEffect(() => {
    if (selectedProduct) {
      loadProductReport();
    }
  }, [selectedProduct, dateRange, branch, customerType, delinquencyBucket]);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [productsResult, branchesResult] = await Promise.all([
        ProductReportService.getProducts(),
        BranchReportService.getBranches()
      ]);
      
      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data);
        if (productsResult.data.length > 0) {
          setSelectedProduct(productsResult.data[0].product_id);
        }
      }
      
      if (branchesResult.success && branchesResult.data) {
        setBranches(branchesResult.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Load product report
  const loadProductReport = async () => {
    try {
      setLoading(true);
      const filters = {
        dateRange,
        branch,
        customerType,
        delinquencyBucket,
        comparison: showComparison
      };
      
      const result = await ProductReportService.getProductReport(selectedProduct, filters);
      if (result.success && result.data) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error loading product report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProductReport();
    setRefreshing(false);
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      const result = await ProductReportService.exportProductReport(selectedProduct, format, {
        dateRange,
        branch,
        customerType,
        delinquencyBucket
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
    chart: ['#E6B800', '#4A5568', '#48BB78', '#ED8936', '#F56565', '#4299E1', '#9F7AEA', '#ED64A6']
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
              <Package className="h-8 w-8 text-primary" />
              {t('productReport.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('productReport.subtitle')}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t('productReport.selectProduct')} />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.product_id} value={product.product_id}>
                    {product.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
              {t('productReport.refresh')}
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
              <SelectItem value="current_month">{t('productReport.filters.currentMonth')}</SelectItem>
              <SelectItem value="last_month">{t('productReport.filters.lastMonth')}</SelectItem>
              <SelectItem value="current_quarter">{t('productReport.filters.currentQuarter')}</SelectItem>
              <SelectItem value="current_year">{t('productReport.filters.currentYear')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('productReport.filters.allBranches')}</SelectItem>
              {branches.map(br => (
                <SelectItem key={br.branch_id} value={br.branch_id}>
                  {br.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={delinquencyBucket} onValueChange={setDelinquencyBucket}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('productReport.filters.allCategories')}</SelectItem>
              <SelectItem value="current">{t('productReport.filters.current')}</SelectItem>
              <SelectItem value="1-30">{t('productReport.filters.days1_30')}</SelectItem>
              <SelectItem value="31-60">{t('productReport.filters.days31_60')}</SelectItem>
              <SelectItem value="61-90">{t('productReport.filters.days61_90')}</SelectItem>
              <SelectItem value="90+">{t('productReport.filters.days90Plus')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerType} onValueChange={setCustomerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('productReport.filters.allCustomers')}</SelectItem>
              <SelectItem value="INDIVIDUAL">{t('productReport.filters.individual')}</SelectItem>
              <SelectItem value="CORPORATE">{t('productReport.filters.corporate')}</SelectItem>
              <SelectItem value="SME">{t('productReport.filters.sme')}</SelectItem>
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
                <CardTitle className="text-sm font-medium text-gray-600">{t('productReport.metrics.totalPortfolio')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary?.totalPortfolio)}
                </div>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatNumber(reportData.summary?.totalLoans)} {t('productReport.metrics.loans')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('productReport.metrics.delinquency')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.summary?.totalOverdue)}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">{t('productReport.metrics.delinquencyRate')}</span>
                  <span className={`text-sm font-bold ${
                    reportData.summary?.delinquencyRate > 15 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatPercentage(reportData.summary?.delinquencyRate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('productReport.metrics.collectionRate')}</CardTitle>
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
                <CardTitle className="text-sm font-medium text-gray-600">{t('productReport.metrics.avgLoanSize')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary?.avgLoanSize)}
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-600">
                  <CreditCard className="h-3 w-3 ml-1" />
                  {t('productReport.metrics.interestRate')} {reportData.summary?.avgInterestRate?.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('productReport.metrics.ranking')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      #{reportData.productComparison?.rankings?.collectionRank}
                    </div>
                    <p className="text-xs text-gray-600">{t('productReport.metrics.collection')}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      #{reportData.productComparison?.rankings?.delinquencyRank}
                    </div>
                    <p className="text-xs text-gray-600">{t('productReport.metrics.delinquencyRank')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7 bg-white">
              <TabsTrigger value="overview">{t('productReport.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="branches">{t('productReport.tabs.branches')}</TabsTrigger>
              <TabsTrigger value="customers">{t('productReport.tabs.customers')}</TabsTrigger>
              <TabsTrigger value="risk">{t('productReport.tabs.risk')}</TabsTrigger>
              <TabsTrigger value="vintage">{t('productReport.tabs.vintage')}</TabsTrigger>
              <TabsTrigger value="defaulters">{t('productReport.tabs.defaulters')}</TabsTrigger>
              <TabsTrigger value="comparison">{t('productReport.tabs.comparison')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('productReport.charts.performanceTrends')}</CardTitle>
                  <CardDescription>{t('productReport.charts.performanceDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
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
                        name={t('productReport.charts.delinquencyRate')}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="collectionRate"
                        stroke={COLORS.success}
                        strokeWidth={3}
                        name={t('productReport.charts.collectionRate')}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="newLoans"
                        fill={COLORS.primary}
                        name={t('productReport.charts.newLoans')}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgLoanSize"
                        stroke={COLORS.info}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={t('productReport.charts.avgLoanSize')}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Communication Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات التواصل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Phone className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                          <p className="text-2xl font-bold">{formatNumber(reportData.communicationStats?.summary?.totalCalls)}</p>
                          <p className="text-xs text-gray-600">مكالمات</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <MessageSquare className="h-6 w-6 mx-auto mb-1 text-green-600" />
                          <p className="text-2xl font-bold">{formatNumber(reportData.communicationStats?.summary?.totalSMS)}</p>
                          <p className="text-xs text-gray-600">رسائل SMS</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Mail className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                          <p className="text-2xl font-bold">{formatNumber(reportData.communicationStats?.summary?.totalEmails)}</p>
                          <p className="text-xs text-gray-600">بريد إلكتروني</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{t('productReport.charts.avgCallsPerCase')}</span>
                          <span className="font-bold">{reportData.communicationStats?.summary?.avgCallsPerCase?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{t('productReport.charts.responseRate')}</span>
                          <Badge variant="outline" className="font-bold">
                            {formatPercentage(reportData.communicationStats?.effectiveness?.contactRate)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">وعود الدفع من المكالمات</span>
                          <span className="font-bold">{formatNumber(reportData.communicationStats?.ptpFromCalls)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>نتائج المكالمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.communicationStats?.callOutcomes || {}).map(([outcome, count]) => ({
                            name: outcome,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                        >
                          {Object.entries(reportData.communicationStats?.callOutcomes || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="branches" className="space-y-4">
              {/* Branch Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>أداء الفروع للمنتج</CardTitle>
                  <CardDescription>مقارنة أداء المنتج عبر جميع الفروع</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('productReport.table.branch')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.region')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.loanCount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.portfolioSize')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.delinquentLoans')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.delinquencyAmount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.delinquencyRate')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.avgDPD')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.portfolioShare')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.branchPerformance?.map((branch) => (
                          <TableRow key={branch.branchId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium">{branch.branchName}</p>
                                  <p className="text-xs text-gray-600">{branch.city}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{branch.region}</TableCell>
                            <TableCell className="text-center">{formatNumber(branch.totalLoans)}</TableCell>
                            <TableCell className="text-center">{formatCurrency(branch.totalAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={branch.overdueLoans > 100 ? 'destructive' : 'secondary'}>
                                {formatNumber(branch.overdueLoans)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-red-600 font-medium">
                              {formatCurrency(branch.overdueAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={branch.delinquencyRate > 15 ? 'destructive' : 'outline'}>
                                {formatPercentage(branch.delinquencyRate)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{branch.avgDPD.toFixed(0)} يوم</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={branch.portfolioShare} className="w-16 h-2" />
                                <span className="text-sm">{formatPercentage(branch.portfolioShare)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Branch Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('productReport.charts.branchDelinquencyComparison')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.branchPerformance?.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="branchName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                                              <Bar dataKey="delinquencyRate" fill={COLORS.danger} name={t('productReport.charts.delinquencyRate')} />
                                              <Bar dataKey="portfolioShare" fill={COLORS.primary} name={t('productReport.table.portfolioShare') + ' %'} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              {/* Customer Type Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>توزيع العملاء حسب النوع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.customerAnalysis?.byCustomerType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {reportData.customerAnalysis?.byCustomerType?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 space-y-2">
                      {reportData.customerAnalysis?.byCustomerType?.map((type, index) => (
                        <div key={type.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }}
                            />
                            <span className="text-sm font-medium">{type.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatNumber(type.count)} عميل</p>
                            <p className="text-xs text-gray-600">
                              تعثر: {formatPercentage(type.delinquencyRate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('productReport.metrics.customerDistributionByRisk')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.customerAnalysis?.byRiskCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="amount" fill={COLORS.primary} name={t('productReport.metrics.portfolioVolume')} />
                        <Bar dataKey="overdueAmount" fill={COLORS.danger} name={t('productReport.metrics.overdues')} />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('productReport.metrics.alert')}:</strong> {t('productReport.metrics.highRiskCustomers')} 
                                                  {' '}{((reportData.customerAnalysis?.byRiskCategory?.find(r => r.category === 'High')?.count || 0) / 
                                                   reportData.summary?.totalLoans * 100).toFixed(1)}% {t('productReport.metrics.ofCustomers')}
                          {' '}{t('productReport.metrics.butContribute')}{' '}
                          {((reportData.customerAnalysis?.byRiskCategory?.find(r => r.category === 'High')?.overdueAmount || 0) / 
                                                    reportData.summary?.totalOverdue * 100).toFixed(1)}% {t('productReport.metrics.ofOverdues')}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Segments Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>أداء شرائح العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.customerAnalysis?.byCustomerType?.map((segment) => (
                      <div key={segment.name} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{segment.name}</h4>
                            <p className="text-sm text-gray-600">
                              {formatNumber(segment.count)} عميل | {formatCurrency(segment.amount)}
                            </p>
                          </div>
                          <Badge 
                            variant={segment.delinquencyRate > 15 ? 'destructive' : 'secondary'}
                            className="text-lg px-3 py-1"
                          >
                            {t('productReport.charts.delinquencyRate')}: {formatPercentage(segment.delinquencyRate)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-600">{t('productReport.table.overdueCount')}</p>
                            <p className="text-xl font-bold">{formatNumber(segment.overdueCount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{t('productReport.table.overdueAmount')}</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(segment.overdueAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{t('productReport.table.avgLoan')}</p>
                            <p className="text-xl font-bold">{formatCurrency(segment.amount / segment.count)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">نسبة من المحفظة</p>
                            <p className="text-xl font-bold">
                              {formatPercentage((segment.amount / reportData.summary?.totalPortfolio) * 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                                      <CardTitle>{t('productReport.metrics.riskDistributionByAging')}</CardTitle>
                  <CardDescription>{t('productReport.metrics.portfolioAnalysisByDPD')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={reportData.riskAnalysis?.bucketDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value, name) => 
                                                  name === t('productReport.metrics.amount') ? formatCurrency(value) : formatNumber(value)
                      } />
                      <Legend />
                                              <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name={t('productReport.table.loanCount')} />
                                              <Line yAxisId="right" type="monotone" dataKey="amount" stroke={COLORS.danger} strokeWidth={3} name={t('productReport.metrics.amount')} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {reportData.riskAnalysis?.riskIndicators && (
                      <>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                          <p className="text-sm text-gray-600">تركز المخاطر العالية</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatPercentage(reportData.riskAnalysis.riskIndicators.highDPDConcentration)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Zap className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                          <p className="text-sm text-gray-600">تعثر القروض الجديدة</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatPercentage(reportData.riskAnalysis.riskIndicators.newLoanDefaultRate)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <Shield className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                          <p className="text-sm text-gray-600">قروض معاد هيكلتها</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {formatNumber(reportData.riskAnalysis.riskIndicators.restructuredLoans)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg">
                          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                          <p className="text-sm text-gray-600">مرشحة للشطب</p>
                          <p className="text-xl font-bold text-gray-800">
                            {formatNumber(reportData.riskAnalysis.riskIndicators.writeOffCandidates)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Heatmap */}
              <Card>
                <CardHeader>
                                      <CardTitle>{t('productReport.metrics.riskHeatmap')}</CardTitle>
                  <CardDescription>{t('productReport.metrics.riskDistributionByBranch')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-right">{t('productReport.metrics.branchCustomerType')}</th>
                                                      <th className="border p-2 text-center">{t('productReport.metrics.individual')}</th>
                            <th className="border p-2 text-center">{t('productReport.metrics.corporate')}</th>
                            <th className="border p-2 text-center">{t('productReport.metrics.sme')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.branchPerformance?.slice(0, 5).map((branch) => (
                          <tr key={branch.branchId}>
                            <td className="border p-2 font-medium">{branch.branchName}</td>
                            <td className={`border p-2 text-center ${
                              branch.delinquencyRate > 15 ? 'bg-red-100' : 
                              branch.delinquencyRate > 10 ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              {formatPercentage(branch.delinquencyRate * 0.9)}
                            </td>
                            <td className={`border p-2 text-center ${
                              branch.delinquencyRate > 15 ? 'bg-red-100' : 
                              branch.delinquencyRate > 10 ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              {formatPercentage(branch.delinquencyRate * 1.1)}
                            </td>
                            <td className={`border p-2 text-center ${
                              branch.delinquencyRate > 15 ? 'bg-red-200' : 
                              branch.delinquencyRate > 10 ? 'bg-yellow-200' : 'bg-green-100'
                            }`}>
                              {formatPercentage(branch.delinquencyRate * 1.3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vintage" className="space-y-4">
              {/* Vintage Analysis Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('productReport.metrics.vintageAnalysis')}</CardTitle>
                  <CardDescription>{t('productReport.charts.vintageDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={reportData.riskAnalysis?.vintageAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                                              <Tooltip formatter={(value, name) => 
                          name === t('productReport.metrics.portfolioVolume') || name === t('productReport.metrics.overdues') ? formatCurrency(value) : 
                                                     name === t('productReport.charts.delinquencyRate') ? formatPercentage(value) : formatNumber(value)
                        } />
                      <Legend />
                                              <Bar yAxisId="left" dataKey="totalLoans" fill={COLORS.primary} name={t('productReport.table.loanCount')} />
                        <Line yAxisId="right" type="monotone" dataKey="totalAmount" stroke={COLORS.info} strokeWidth={2} name={t('productReport.metrics.portfolioVolume')} />
                                              <Line yAxisId="left" type="monotone" dataKey="delinquencyRate" stroke={COLORS.danger} strokeWidth={3} name={t('productReport.charts.delinquencyRate')} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <Alert className="mt-4">
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t('productReport.charts.note')}:</strong> {t('productReport.charts.vintageNote')}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Vintage Cohort Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('productReport.metrics.detailedVintageTable')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('productReport.table.disbursementMonth')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.loanCount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.totalAmount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.delinquentLoans')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.overdueAmount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.delinquencyRate')}</TableHead>
                          <TableHead className="text-center">{t('productReport.table.avgLoan')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.riskAnalysis?.vintageAnalysis?.map((vintage) => (
                          <TableRow key={vintage.month}>
                            <TableCell className="font-medium">{vintage.month}</TableCell>
                            <TableCell className="text-center">{formatNumber(vintage.totalLoans)}</TableCell>
                            <TableCell className="text-center">{formatCurrency(vintage.totalAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={vintage.overdueLoans > 50 ? 'destructive' : 'secondary'}>
                                {formatNumber(vintage.overdueLoans)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-red-600 font-medium">
                              {formatCurrency(vintage.overdueAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={vintage.delinquencyRate > 15 ? 'destructive' : 'outline'}>
                                {formatPercentage(vintage.delinquencyRate)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {formatCurrency(vintage.totalAmount / vintage.totalLoans)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defaulters" className="space-y-4">
              {/* Top Defaulters */}
              <Card>
                <CardHeader>
                  <CardTitle>أكبر المتعثرين</CardTitle>
                  <CardDescription>القروض ذات أعلى مبالغ متأخرة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                                                      <TableHead>{t('productReport.metrics.loanNumber')}</TableHead>
                            <TableHead>{t('productReport.metrics.customerName')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.customerType')}</TableHead>
                          <TableHead>{t('productReport.table.branch')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.loanAmount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.overdueAmount')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.overdueDaysLabel')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.riskCategory')}</TableHead>
                          <TableHead className="text-center">{t('productReport.metrics.action')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.topDefaulters?.map((defaulter) => (
                          <TableRow key={defaulter.loanAccountNumber}>
                            <TableCell className="font-mono text-sm">{defaulter.loanAccountNumber}</TableCell>
                            <TableCell className="font-medium">{defaulter.customerName}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {defaulter.customerType === 'CORPORATE' ? 'شركة' :
                                 defaulter.customerType === 'SME' ? 'منشأة صغيرة' : 'فرد'}
                              </Badge>
                            </TableCell>
                            <TableCell>{defaulter.branchName}</TableCell>
                            <TableCell className="text-center">{formatCurrency(defaulter.loanAmount)}</TableCell>
                            <TableCell className="text-center text-red-600 font-bold">
                              {formatCurrency(defaulter.overdueAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">
                                {defaulter.overdueDays} يوم
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={defaulter.riskCategory === 'High' ? 'destructive' : 'secondary'}>
                                {defaulter.riskCategory}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedDefaulter(defaulter);
                                  setShowDefaulterDetails(true);
                                }}
                              >
                                عرض التفاصيل
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {/* Product Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة المنتج مع المنتجات الأخرى</CardTitle>
                  <CardDescription>تحليل مقارن لأداء جميع المنتجات التمويلية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Ranking Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600">{t('productReport.charts.overallRank')}</p>
                        <p className="text-3xl font-bold text-blue-600">
                          #{Math.round((reportData.productComparison?.rankings?.collectionRank + 
                                       reportData.productComparison?.rankings?.delinquencyRank) / 2)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {t('common.of')} {reportData.productComparison?.rankings?.totalProducts} {t('common.products')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-gray-600">{t('productReport.charts.collectionRank')}</p>
                        <p className="text-3xl font-bold text-green-600">
                          #{reportData.productComparison?.rankings?.collectionRank}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {reportData.productComparison?.performance?.vsCompanyAvg?.collectionRate > 0 ? '+' : ''}
                          {reportData.productComparison?.performance?.vsCompanyAvg?.collectionRate?.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-gray-600">{t('productReport.charts.delinquencyRankLabel')}</p>
                        <p className="text-3xl font-bold text-orange-600">
                          #{reportData.productComparison?.rankings?.delinquencyRank}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {reportData.productComparison?.performance?.vsCompanyAvg?.delinquencyRate > 0 ? '+' : ''}
                          {reportData.productComparison?.performance?.vsCompanyAvg?.delinquencyRate?.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Comparison Chart */}
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={[
                        {
                          metric: t('productReport.charts.delinquencyRate'),
                          product: reportData.summary?.delinquencyRate,
                          average: reportData.productComparison?.companyAverage?.delinquencyRate
                        },
                        {
                          metric: t('productReport.charts.collectionRate'),
                          product: reportData.summary?.collectionRate,
                          average: reportData.productComparison?.companyAverage?.collectionRate
                        },
                        {
                          metric: t('productReport.charts.avgDelay'),
                          product: reportData.summary?.avgDPD,
                          average: reportData.productComparison?.companyAverage?.avgDPD
                        },
                        {
                          metric: 'حجم المحفظة',
                          product: (reportData.summary?.totalPortfolio / 1000000) || 0, // Convert to millions
                          average: 100
                        }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis />
                        <Radar
                          name="المنتج"
                          dataKey="product"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                        />
                        <Radar
                          name={t('productReport.charts.companyAverage')}
                          dataKey="average"
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>

                    {/* Products Comparison Table */}
                    <div>
                      <h4 className="font-medium mb-3">مقارنة جميع المنتجات</h4>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('common.product')}</TableHead>
                              <TableHead className="text-center">{t('productReport.table.delinquencyRate')}</TableHead>
                              <TableHead className="text-center">{t('productReport.charts.collectionRate')}</TableHead>
                              <TableHead className="text-center">{t('productReport.table.portfolioSize')}</TableHead>
                              <TableHead className="text-center">{t('productReport.table.avgDPD')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.productComparison?.productComparison?.map((prod) => (
                              <TableRow 
                                key={prod.productId}
                                className={prod.productId === selectedProduct ? 'bg-primary/10' : ''}
                              >
                                <TableCell className="font-medium">
                                  {prod.productName}
                                  {prod.productId === selectedProduct && (
                                    <Badge variant="default" className="mr-2">الحالي</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={prod.delinquencyRate > 15 ? 'destructive' : 'outline'}>
                                    {formatPercentage(prod.delinquencyRate)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={prod.collectionRate > 70 ? 'success' : 'secondary'}>
                                    {formatPercentage(prod.collectionRate)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {formatCurrency(prod.portfolioSize)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {prod.avgDPD.toFixed(0)} يوم
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Defaulter Details Dialog */}
      <Dialog open={showDefaulterDetails} onOpenChange={setShowDefaulterDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل القرض المتعثر</DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن القرض رقم {selectedDefaulter?.loanAccountNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDefaulter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('productReport.metrics.customerName')}</p>
                  <p className="font-medium">{selectedDefaulter.customerName}</p>
                </div>
                <div>
                                      <p className="text-sm text-gray-600">{t('productReport.metrics.customerType')}</p>
                  <p className="font-medium">
                                          {selectedDefaulter.customerType === 'CORPORATE' ? t('productReport.metrics.corporate') :
                       selectedDefaulter.customerType === 'SME' ? t('productReport.metrics.sme') : t('productReport.metrics.individual')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الفرع</p>
                  <p className="font-medium">{selectedDefaulter.branchName}</p>
                </div>
                <div>
                                      <p className="text-sm text-gray-600">{t('productReport.metrics.riskCategory')}</p>
                  <Badge variant={selectedDefaulter.riskCategory === 'High' ? 'destructive' : 'secondary'}>
                    {selectedDefaulter.riskCategory}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">{t('productReport.metrics.financialDetails')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">{t('productReport.metrics.originalLoanAmount')}</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedDefaulter.loanAmount)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-sm text-gray-600">{t('productReport.metrics.overdueAmount')}</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedDefaulter.overdueAmount)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="text-sm text-gray-600">{t('productReport.table.overdueDays')}</p>
                    <p className="text-xl font-bold text-orange-600">{selectedDefaulter.overdueDays} {t('productReport.table.days')}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <p className="text-sm text-gray-600">{t('productReport.table.delinquencyPercentage')}</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatPercentage((selectedDefaulter.overdueAmount / selectedDefaulter.loanAmount) * 100)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDefaulterDetails(false)}>
                  {t('productReport.actions.close')}
                </Button>
                <Button onClick={() => window.location.href = `/collection/cases?loan=${selectedDefaulter.loanAccountNumber}`}>
                  {t('productReport.actions.viewCollectionStatus')}
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

// Add Mail icon since it's not imported
const Mail = ({ className }) => (
  <svg
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22,7-10,5L2,7" />
  </svg>
);

// Add separator component
const Separator = () => <div className="border-t my-4" />;

export default ProductLevelReport;