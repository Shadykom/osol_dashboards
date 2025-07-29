import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, HeatmapChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle, Activity,
  BarChart3, PieChart, Target, Clock, Layers, Filter,
  Download, ChevronDown, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const VintageAnalysisDashboard = () => {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState('2023-Q4');
  const [viewType, setViewType] = useState('percentage');
  const [loading, setLoading] = useState(false);

  // Mock vintage analysis data
  const vintageData = {
    cohorts: [
      '2023-Q1', '2023-Q2', '2023-Q3', '2023-Q4', '2024-Q1'
    ],
    products: [
      'Auto Finance', 'Personal Finance', 'Home Finance', 'SME Finance'
    ],
    performance: {
      '2023-Q1': {
        origination: { accounts: 2500, amount: 125000000 },
        months: [
          { mob: 0, dpd0_30: 100, dpd31_60: 0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 1, dpd0_30: 98.5, dpd31_60: 1.5, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 2, dpd0_30: 96.8, dpd31_60: 2.2, dpd61_90: 1.0, dpd90_plus: 0 },
          { mob: 3, dpd0_30: 95.2, dpd31_60: 2.8, dpd61_90: 1.5, dpd90_plus: 0.5 },
          { mob: 6, dpd0_30: 92.5, dpd31_60: 3.5, dpd61_90: 2.5, dpd90_plus: 1.5 },
          { mob: 9, dpd0_30: 90.8, dpd31_60: 4.2, dpd61_90: 3.0, dpd90_plus: 2.0 },
          { mob: 12, dpd0_30: 89.5, dpd31_60: 4.5, dpd61_90: 3.5, dpd90_plus: 2.5 }
        ]
      },
      '2023-Q2': {
        origination: { accounts: 2800, amount: 140000000 },
        months: [
          { mob: 0, dpd0_30: 100, dpd31_60: 0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 1, dpd0_30: 98.8, dpd31_60: 1.2, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 2, dpd0_30: 97.2, dpd31_60: 1.8, dpd61_90: 0.8, dpd90_plus: 0.2 },
          { mob: 3, dpd0_30: 95.8, dpd31_60: 2.5, dpd61_90: 1.2, dpd90_plus: 0.5 },
          { mob: 6, dpd0_30: 93.2, dpd31_60: 3.2, dpd61_90: 2.1, dpd90_plus: 1.5 },
          { mob: 9, dpd0_30: 91.5, dpd31_60: 3.8, dpd61_90: 2.7, dpd90_plus: 2.0 }
        ]
      },
      '2023-Q3': {
        origination: { accounts: 3100, amount: 155000000 },
        months: [
          { mob: 0, dpd0_30: 100, dpd31_60: 0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 1, dpd0_30: 99.0, dpd31_60: 1.0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 2, dpd0_30: 97.5, dpd31_60: 1.5, dpd61_90: 0.8, dpd90_plus: 0.2 },
          { mob: 3, dpd0_30: 96.2, dpd31_60: 2.3, dpd61_90: 1.0, dpd90_plus: 0.5 },
          { mob: 6, dpd0_30: 93.8, dpd31_60: 3.0, dpd61_90: 1.9, dpd90_plus: 1.3 }
        ]
      },
      '2023-Q4': {
        origination: { accounts: 3500, amount: 175000000 },
        months: [
          { mob: 0, dpd0_30: 100, dpd31_60: 0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 1, dpd0_30: 99.2, dpd31_60: 0.8, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 2, dpd0_30: 97.8, dpd31_60: 1.4, dpd61_90: 0.6, dpd90_plus: 0.2 },
          { mob: 3, dpd0_30: 96.5, dpd31_60: 2.1, dpd61_90: 0.9, dpd90_plus: 0.5 }
        ]
      },
      '2024-Q1': {
        origination: { accounts: 3800, amount: 190000000 },
        months: [
          { mob: 0, dpd0_30: 100, dpd31_60: 0, dpd61_90: 0, dpd90_plus: 0 },
          { mob: 1, dpd0_30: 99.3, dpd31_60: 0.7, dpd61_90: 0, dpd90_plus: 0 }
        ]
      }
    },
    flowRates: {
      '30_to_60': [
        { cohort: '2023-Q1', rate: 28.5 },
        { cohort: '2023-Q2', rate: 25.2 },
        { cohort: '2023-Q3', rate: 23.8 },
        { cohort: '2023-Q4', rate: 22.1 }
      ],
      '60_to_90': [
        { cohort: '2023-Q1', rate: 45.2 },
        { cohort: '2023-Q2', rate: 42.8 },
        { cohort: '2023-Q3', rate: 40.5 },
        { cohort: '2023-Q4', rate: 38.9 }
      ],
      '90_plus': [
        { cohort: '2023-Q1', rate: 68.5 },
        { cohort: '2023-Q2', rate: 65.2 },
        { cohort: '2023-Q3', rate: 62.8 },
        { cohort: '2023-Q4', rate: 60.5 }
      ]
    },
    productComparison: [
      { product: 'Auto Finance', mob3_dpd: 2.8, mob6_dpd: 4.2, mob12_dpd: 5.8, lossRate: 1.2 },
      { product: 'Personal Finance', mob3_dpd: 3.5, mob6_dpd: 5.8, mob12_dpd: 7.2, lossRate: 2.1 },
      { product: 'Home Finance', mob3_dpd: 1.2, mob6_dpd: 2.1, mob12_dpd: 2.8, lossRate: 0.5 },
      { product: 'SME Finance', mob3_dpd: 4.2, mob6_dpd: 6.8, mob12_dpd: 8.5, lossRate: 3.2 }
    ],
    expectedLoss: {
      totalExposure: 750000000,
      expectedLoss: 15750000,
      lossRate: 2.1,
      provisions: 18900000,
      coverageRatio: 120
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPerformanceColor = (value, type = 'default') => {
    if (type === 'dpd') {
      if (value < 2) return 'text-green-600';
      if (value < 5) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-900';
  };

  const getTrendIcon = (current, previous) => {
    const change = current - previous;
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    return null;
  };

  // Transform vintage data for charts
  const getVintageChartData = (cohort) => {
    const cohortData = vintageData.performance[cohort];
    if (!cohortData) return [];
    
    return cohortData.months.map(month => ({
      mob: `MOB ${month.mob}`,
      current: month.dpd0_30,
      '1-30 DPD': 100 - month.dpd0_30,
      '31-60 DPD': month.dpd31_60,
      '61-90 DPD': month.dpd61_90,
      '90+ DPD': month.dpd90_plus
    }));
  };

  const getCohortComparison = () => {
    const comparison = [];
    Object.entries(vintageData.performance).forEach(([cohort, data]) => {
      const mob3 = data.months.find(m => m.mob === 3);
      const mob6 = data.months.find(m => m.mob === 6);
      const mob12 = data.months.find(m => m.mob === 12);
      
      comparison.push({
        cohort,
        origination: data.origination.amount,
        accounts: data.origination.accounts,
        mob3_dpd: mob3 ? (100 - mob3.dpd0_30) : 0,
        mob6_dpd: mob6 ? (100 - mob6.dpd0_30) : 0,
        mob12_dpd: mob12 ? (100 - mob12.dpd0_30) : 0
      });
    });
    return comparison;
  };

  const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('vintageAnalysisDashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('vintageAnalysisDashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('vintageAnalysisDashboard.selectProduct')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('vintageAnalysisDashboard.allProducts')}</SelectItem>
              {vintageData.products.map(product => (
                <SelectItem key={product} value={product}>{product}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('vintageAnalysisDashboard.selectCohort')} />
            </SelectTrigger>
            <SelectContent>
              {vintageData.cohorts.map(cohort => (
                <SelectItem key={cohort} value={cohort}>{cohort}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('vintageAnalysisDashboard.export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('vintageAnalysisDashboard.totalExposure')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(vintageData.expectedLoss.totalExposure)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('vintageAnalysisDashboard.acrossAllCohorts')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('vintageAnalysisDashboard.expectedLoss')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(vintageData.expectedLoss.expectedLoss)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {vintageData.expectedLoss.lossRate}% {t('vintageAnalysisDashboard.lossRate')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(vintageData.expectedLoss.provisions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vintageData.expectedLoss.coverageRatio}% coverage
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2024-Q1</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(vintageData.performance['2024-Q1'].origination.accounts)} accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="flow">Flow Rates</TabsTrigger>
          <TabsTrigger value="product">Product View</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="cohort" className="space-y-4">
          {/* Cohort Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Performance - {selectedCohort}</CardTitle>
              <CardDescription>Delinquency progression by months on book (MOB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Origination Date</p>
                    <p className="font-semibold">{selectedCohort}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Origination Volume</p>
                    <p className="font-semibold">{formatCurrency(vintageData.performance[selectedCohort]?.origination.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Accounts</p>
                    <p className="font-semibold">{formatNumber(vintageData.performance[selectedCohort]?.origination.accounts || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Ticket</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        (vintageData.performance[selectedCohort]?.origination.amount || 0) / 
                        (vintageData.performance[selectedCohort]?.origination.accounts || 1)
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getVintageChartData(selectedCohort)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mob" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="current" stackId="1" stroke="#22c55e" fill="#22c55e" name="Current" />
                  <Area type="monotone" dataKey="31-60 DPD" stackId="1" stroke="#eab308" fill="#eab308" name="31-60 DPD" />
                  <Area type="monotone" dataKey="61-90 DPD" stackId="1" stroke="#f97316" fill="#f97316" name="61-90 DPD" />
                  <Area type="monotone" dataKey="90+ DPD" stackId="1" stroke="#ef4444" fill="#ef4444" name="90+ DPD" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cohort Metrics</CardTitle>
              <CardDescription>Performance breakdown by delinquency bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-6 gap-4 p-4 border-b font-medium text-sm bg-gray-50">
                    <div>MOB</div>
                    <div>Current</div>
                    <div>1-30 DPD</div>
                    <div>31-60 DPD</div>
                    <div>61-90 DPD</div>
                    <div>90+ DPD</div>
                  </div>
                  {vintageData.performance[selectedCohort]?.months.map((month) => (
                    <div key={month.mob} className="grid grid-cols-6 gap-4 p-4 border-b text-sm">
                      <div className="font-medium">MOB {month.mob}</div>
                      <div className={getPerformanceColor(100 - month.dpd0_30, 'dpd')}>
                        {month.dpd0_30.toFixed(1)}%
                      </div>
                      <div className={getPerformanceColor(100 - month.dpd0_30, 'dpd')}>
                        {(100 - month.dpd0_30).toFixed(1)}%
                      </div>
                      <div className={getPerformanceColor(month.dpd31_60, 'dpd')}>
                        {month.dpd31_60.toFixed(1)}%
                      </div>
                      <div className={getPerformanceColor(month.dpd61_90, 'dpd')}>
                        {month.dpd61_90.toFixed(1)}%
                      </div>
                      <div className={getPerformanceColor(month.dpd90_plus, 'dpd')}>
                        {month.dpd90_plus.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Cohort Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Comparison Analysis</CardTitle>
              <CardDescription>Compare delinquency rates across different origination cohorts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={getCohortComparison()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="origination" fill="#e5e7eb" name="Origination (SAR)" />
                  <Line yAxisId="left" type="monotone" dataKey="mob3_dpd" stroke="#eab308" strokeWidth={2} name="MOB 3 DPD%" />
                  <Line yAxisId="left" type="monotone" dataKey="mob6_dpd" stroke="#f97316" strokeWidth={2} name="MOB 6 DPD%" />
                  <Line yAxisId="left" type="monotone" dataKey="mob12_dpd" stroke="#ef4444" strokeWidth={2} name="MOB 12 DPD%" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Heatmap</CardTitle>
              <CardDescription>Visual comparison of delinquency rates by cohort and MOB</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 text-xs font-medium">
                  <div className="p-2"></div>
                  <div className="p-2 text-center">MOB 1</div>
                  <div className="p-2 text-center">MOB 2</div>
                  <div className="p-2 text-center">MOB 3</div>
                  <div className="p-2 text-center">MOB 6</div>
                  <div className="p-2 text-center">MOB 9</div>
                  <div className="p-2 text-center">MOB 12</div>
                  <div className="p-2 text-center">Trend</div>
                  
                  {Object.entries(vintageData.performance).map(([cohort, data]) => {
                    const mob1 = data.months.find(m => m.mob === 1);
                    const mob2 = data.months.find(m => m.mob === 2);
                    const mob3 = data.months.find(m => m.mob === 3);
                    const mob6 = data.months.find(m => m.mob === 6);
                    const mob9 = data.months.find(m => m.mob === 9);
                    const mob12 = data.months.find(m => m.mob === 12);
                    
                    const getHeatmapColor = (value) => {
                      if (!value) return 'bg-gray-100';
                      const dpd = 100 - value.dpd0_30;
                      if (dpd < 2) return 'bg-green-100';
                      if (dpd < 3) return 'bg-yellow-100';
                      if (dpd < 5) return 'bg-orange-100';
                      return 'bg-red-100';
                    };
                    
                    return (
                      <React.Fragment key={cohort}>
                        <div className="p-2 font-medium">{cohort}</div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob1)}`}>
                          {mob1 ? (100 - mob1.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob2)}`}>
                          {mob2 ? (100 - mob2.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob3)}`}>
                          {mob3 ? (100 - mob3.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob6)}`}>
                          {mob6 ? (100 - mob6.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob9)}`}>
                          {mob9 ? (100 - mob9.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className={`p-2 text-center ${getHeatmapColor(mob12)}`}>
                          {mob12 ? (100 - mob12.dpd0_30).toFixed(1) : '-'}%
                        </div>
                        <div className="p-2 text-center">
                          {mob3 && mob6 && (mob3.dpd0_30 > mob6.dpd0_30 ? 
                            <ArrowUpRight className="h-4 w-4 text-red-500 mx-auto" /> : 
                            <ArrowDownRight className="h-4 w-4 text-green-500 mx-auto" />
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          {/* Flow Rate Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>30 to 60 DPD Flow Rate</CardTitle>
                <CardDescription>Migration from 30 DPD to 60 DPD</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vintageData.flowRates['30_to_60']}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#eab308" 
                      strokeWidth={3}
                      dot={{ fill: '#eab308' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <Alert className="mt-4">
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    Flow rate improving by 22% over last 4 cohorts
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>60 to 90 DPD Flow Rate</CardTitle>
                <CardDescription>Migration from 60 DPD to 90 DPD</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vintageData.flowRates['60_to_90']}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <Alert className="mt-4">
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    Flow rate improving by 14% over last 4 cohorts
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>90+ DPD Flow Rate</CardTitle>
                <CardDescription>Migration to 90+ DPD</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vintageData.flowRates['90_plus']}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <Alert className="mt-4">
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    Flow rate improving by 12% over last 4 cohorts
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Roll Rate Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Roll Rate Matrix</CardTitle>
              <CardDescription>Probability of account movement between buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-6 gap-2 text-sm">
                    <div className="p-3 font-medium">From / To</div>
                    <div className="p-3 font-medium text-center bg-gray-50">Current</div>
                    <div className="p-3 font-medium text-center bg-gray-50">1-30 DPD</div>
                    <div className="p-3 font-medium text-center bg-gray-50">31-60 DPD</div>
                    <div className="p-3 font-medium text-center bg-gray-50">61-90 DPD</div>
                    <div className="p-3 font-medium text-center bg-gray-50">90+ DPD</div>
                    
                    {/* Current row */}
                    <div className="p-3 font-medium bg-gray-50">Current</div>
                    <div className="p-3 text-center bg-green-100">94.5%</div>
                    <div className="p-3 text-center bg-yellow-50">5.5%</div>
                    <div className="p-3 text-center">-</div>
                    <div className="p-3 text-center">-</div>
                    <div className="p-3 text-center">-</div>
                    
                    {/* 1-30 DPD row */}
                    <div className="p-3 font-medium bg-gray-50">1-30 DPD</div>
                    <div className="p-3 text-center bg-green-50">65.2%</div>
                    <div className="p-3 text-center bg-yellow-100">12.3%</div>
                    <div className="p-3 text-center bg-orange-100">22.5%</div>
                    <div className="p-3 text-center">-</div>
                    <div className="p-3 text-center">-</div>
                    
                    {/* 31-60 DPD row */}
                    <div className="p-3 font-medium bg-gray-50">31-60 DPD</div>
                    <div className="p-3 text-center bg-green-50">35.8%</div>
                    <div className="p-3 text-center bg-yellow-50">18.5%</div>
                    <div className="p-3 text-center bg-orange-100">15.2%</div>
                    <div className="p-3 text-center bg-orange-100">30.5%</div>
                    <div className="p-3 text-center">-</div>
                    
                    {/* 61-90 DPD row */}
                    <div className="p-3 font-medium bg-gray-50">61-90 DPD</div>
                    <div className="p-3 text-center bg-green-50">18.2%</div>
                    <div className="p-3 text-center bg-yellow-50">12.5%</div>
                    <div className="p-3 text-center bg-orange-50">15.8%</div>
                    <div className="p-3 text-center bg-orange-100">12.0%</div>
                    <div className="p-3 text-center bg-red-100">41.5%</div>
                    
                    {/* 90+ DPD row */}
                    <div className="p-3 font-medium bg-gray-50">90+ DPD</div>
                    <div className="p-3 text-center bg-green-50">5.2%</div>
                    <div className="p-3 text-center">3.8%</div>
                    <div className="p-3 text-center">4.5%</div>
                    <div className="p-3 text-center">8.2%</div>
                    <div className="p-3 text-center bg-red-100">78.3%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          {/* Product Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Comparison</CardTitle>
              <CardDescription>Delinquency rates by product type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={vintageData.productComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="mob3_dpd" fill="#eab308" name="MOB 3 DPD%" />
                  <Bar dataKey="mob6_dpd" fill="#f97316" name="MOB 6 DPD%" />
                  <Bar dataKey="mob12_dpd" fill="#ef4444" name="MOB 12 DPD%" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Risk Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Risk Profile</CardTitle>
                <CardDescription>Risk assessment by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vintageData.productComparison.map((product, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{product.product}</h4>
                        <Badge variant={product.lossRate < 1 ? 'default' : product.lossRate < 2 ? 'secondary' : 'destructive'}>
                          {product.lossRate}% Loss Rate
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">MOB 3</p>
                          <p className={`font-medium ${getPerformanceColor(product.mob3_dpd, 'dpd')}`}>
                            {product.mob3_dpd}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">MOB 6</p>
                          <p className={`font-medium ${getPerformanceColor(product.mob6_dpd, 'dpd')}`}>
                            {product.mob6_dpd}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">MOB 12</p>
                          <p className={`font-medium ${getPerformanceColor(product.mob12_dpd, 'dpd')}`}>
                            {product.mob12_dpd}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loss Rate Analysis</CardTitle>
                <CardDescription>Expected loss by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={vintageData.productComparison}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="product" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="lossRate" fill="#ef4444" name="Loss Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          {/* Forecast Summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Forecast based on historical vintage performance and current market conditions
            </AlertDescription>
          </Alert>

          {/* Expected Loss Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Expected Loss Forecast</CardTitle>
              <CardDescription>Projected losses for next 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Total Exposure</p>
                  <p className="text-2xl font-bold">{formatCurrency(vintageData.expectedLoss.totalExposure)}</p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="text-sm text-gray-600">Expected Loss</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(vintageData.expectedLoss.expectedLoss)}</p>
                  <p className="text-sm text-gray-600 mt-1">{vintageData.expectedLoss.lossRate}% of exposure</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Coverage Ratio</p>
                  <p className="text-2xl font-bold text-green-600">{vintageData.expectedLoss.coverageRatio}%</p>
                  <p className="text-sm text-gray-600 mt-1">Provision coverage</p>
                </div>
              </div>

              {/* Forecast Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { month: 'Jan', baseline: 2.1, optimistic: 1.8, pessimistic: 2.5 },
                  { month: 'Feb', baseline: 2.0, optimistic: 1.7, pessimistic: 2.4 },
                  { month: 'Mar', baseline: 2.0, optimistic: 1.7, pessimistic: 2.4 },
                  { month: 'Apr', baseline: 1.9, optimistic: 1.6, pessimistic: 2.3 },
                  { month: 'May', baseline: 1.9, optimistic: 1.6, pessimistic: 2.3 },
                  { month: 'Jun', baseline: 1.8, optimistic: 1.5, pessimistic: 2.2 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Pessimistic" />
                  <Area type="monotone" dataKey="baseline" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Baseline" />
                  <Area type="monotone" dataKey="optimistic" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Optimistic" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scenario Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Analysis</CardTitle>
              <CardDescription>Impact of different economic scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    scenario: 'Base Case',
                    assumptions: 'Current economic conditions continue',
                    lossRate: 2.1,
                    expectedLoss: 15750000,
                    probability: 60
                  },
                  {
                    scenario: 'Optimistic',
                    assumptions: 'Economic improvement, lower unemployment',
                    lossRate: 1.6,
                    expectedLoss: 12000000,
                    probability: 25
                  },
                  {
                    scenario: 'Pessimistic',
                    assumptions: 'Economic downturn, higher defaults',
                    lossRate: 2.8,
                    expectedLoss: 21000000,
                    probability: 15
                  }
                ].map((scenario, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{scenario.scenario}</h4>
                        <p className="text-sm text-gray-600">{scenario.assumptions}</p>
                      </div>
                      <Badge variant="outline">
                        {scenario.probability}% probability
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">Loss Rate</p>
                        <p className="font-medium">{scenario.lossRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expected Loss</p>
                        <p className="font-medium">{formatCurrency(scenario.expectedLoss)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VintageAnalysisDashboard;