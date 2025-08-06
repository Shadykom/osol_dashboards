import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Package, 
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Printer,
  Mail,
  Eye,
  Filter,
  Calendar,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const COLORS = {
  primary: '#E6B800',
  secondary: '#4A5568',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6'
};

const CashFlowStatementReport = ({ 
  dateRange, 
  branch = 'all', 
  product = 'all', 
  customerSegment = 'all',
  onExport,
  onEmail,
  onPrint,
  onSchedule 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // summary, detailed, waterfall
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_period');

  // Fetch cash flow data based on parameters
  useEffect(() => {
    fetchCashFlowData();
  }, [dateRange, branch, product, customerSegment]);

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      // Build query with filters
      let query = supabase
        .from('cash_flow_view')
        .select('*')
        .gte('date', dateRange?.from || new Date())
        .lte('date', dateRange?.to || new Date());

      // Apply branch filter
      if (branch !== 'all') {
        query = query.eq('branch_id', branch);
      }

      // Apply product filter
      if (product !== 'all') {
        query = query.eq('product_id', product);
      }

      // Apply customer segment filter
      if (customerSegment !== 'all') {
        query = query.eq('customer_segment', customerSegment);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process and aggregate data
      const processedData = processCashFlowData(data);
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      toast.error(t('reports.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const processCashFlowData = (rawData) => {
    // Calculate operating activities
    const operatingActivities = {
      netIncome: rawData.reduce((sum, item) => sum + (item.net_income || 0), 0),
      depreciation: rawData.reduce((sum, item) => sum + (item.depreciation || 0), 0),
      amortization: rawData.reduce((sum, item) => sum + (item.amortization || 0), 0),
      stockBasedCompensation: rawData.reduce((sum, item) => sum + (item.stock_based_compensation || 0), 0),
      deferredIncomeTax: rawData.reduce((sum, item) => sum + (item.deferred_income_tax || 0), 0),
      accountsReceivableChange: rawData.reduce((sum, item) => sum + (item.accounts_receivable_change || 0), 0),
      inventoryChange: rawData.reduce((sum, item) => sum + (item.inventory_change || 0), 0),
      accountsPayableChange: rawData.reduce((sum, item) => sum + (item.accounts_payable_change || 0), 0),
      otherOperatingActivities: rawData.reduce((sum, item) => sum + (item.other_operating_activities || 0), 0)
    };

    // Calculate total operating cash flow
    operatingActivities.total = Object.values(operatingActivities).reduce((sum, val) => sum + val, 0);

    // Calculate investing activities
    const investingActivities = {
      capitalExpenditures: rawData.reduce((sum, item) => sum + (item.capital_expenditures || 0), 0),
      acquisitions: rawData.reduce((sum, item) => sum + (item.acquisitions || 0), 0),
      purchaseOfInvestments: rawData.reduce((sum, item) => sum + (item.purchase_of_investments || 0), 0),
      saleOfInvestments: rawData.reduce((sum, item) => sum + (item.sale_of_investments || 0), 0),
      saleOfAssets: rawData.reduce((sum, item) => sum + (item.sale_of_assets || 0), 0),
      otherInvestingActivities: rawData.reduce((sum, item) => sum + (item.other_investing_activities || 0), 0)
    };

    // Calculate total investing cash flow
    investingActivities.total = Object.values(investingActivities).reduce((sum, val) => sum + val, 0);

    // Calculate financing activities
    const financingActivities = {
      debtIssuance: rawData.reduce((sum, item) => sum + (item.debt_issuance || 0), 0),
      debtRepayment: rawData.reduce((sum, item) => sum + (item.debt_repayment || 0), 0),
      commonStockIssuance: rawData.reduce((sum, item) => sum + (item.common_stock_issuance || 0), 0),
      commonStockRepurchase: rawData.reduce((sum, item) => sum + (item.common_stock_repurchase || 0), 0),
      dividendsPaid: rawData.reduce((sum, item) => sum + (item.dividends_paid || 0), 0),
      otherFinancingActivities: rawData.reduce((sum, item) => sum + (item.other_financing_activities || 0), 0)
    };

    // Calculate total financing cash flow
    financingActivities.total = Object.values(financingActivities).reduce((sum, val) => sum + val, 0);

    // Calculate cash position
    const openingCash = rawData[0]?.opening_cash_balance || 0;
    const netCashFlow = operatingActivities.total + investingActivities.total + financingActivities.total;
    const closingCash = openingCash + netCashFlow;

    // Calculate free cash flow
    const freeCashFlow = operatingActivities.total + investingActivities.capitalExpenditures;

    // Calculate key metrics
    const metrics = {
      operatingCashFlowMargin: operatingActivities.total > 0 && rawData[0]?.revenue > 0 
        ? (operatingActivities.total / rawData.reduce((sum, item) => sum + (item.revenue || 0), 0)) * 100 
        : 0,
      cashFlowToDebtRatio: operatingActivities.total > 0 && rawData[0]?.total_debt > 0 
        ? operatingActivities.total / rawData.reduce((sum, item) => sum + (item.total_debt || 0), 0) 
        : 0,
      cashFlowCoverageRatio: operatingActivities.total > 0 && rawData[0]?.interest_expense > 0 
        ? operatingActivities.total / rawData.reduce((sum, item) => sum + (item.interest_expense || 0), 0) 
        : 0,
      cashReturnOnAssets: operatingActivities.total > 0 && rawData[0]?.total_assets > 0 
        ? (operatingActivities.total / rawData.reduce((sum, item) => sum + (item.total_assets || 0), 0)) * 100 
        : 0
    };

    return {
      operatingActivities,
      investingActivities,
      financingActivities,
      cashPosition: {
        opening: openingCash,
        closing: closingCash,
        netChange: netCashFlow,
        percentageChange: openingCash > 0 ? (netCashFlow / openingCash) * 100 : 0
      },
      freeCashFlow,
      metrics,
      metadata: {
        reportDate: new Date(),
        dateRange,
        filters: { branch, product, customerSegment }
      }
    };
  };

  const renderSummaryView = () => {
    if (!reportData) return null;

    const { operatingActivities, investingActivities, financingActivities, cashPosition, freeCashFlow, metrics } = reportData;

    // Prepare waterfall chart data
    const waterfallData = [
      { name: 'Opening Cash', value: cashPosition.opening, cumulative: cashPosition.opening, type: 'start' },
      { 
        name: 'Operating Activities', 
        value: operatingActivities.total, 
        cumulative: cashPosition.opening + operatingActivities.total,
        type: operatingActivities.total >= 0 ? 'positive' : 'negative' 
      },
      { 
        name: 'Investing Activities', 
        value: investingActivities.total, 
        cumulative: cashPosition.opening + operatingActivities.total + investingActivities.total,
        type: investingActivities.total >= 0 ? 'positive' : 'negative' 
      },
      { 
        name: 'Financing Activities', 
        value: financingActivities.total, 
        cumulative: cashPosition.closing,
        type: financingActivities.total >= 0 ? 'positive' : 'negative' 
      },
      { name: 'Closing Cash', value: cashPosition.closing, cumulative: cashPosition.closing, type: 'end' }
    ];

    // Prepare activity breakdown chart data
    const activityBreakdown = [
      { name: 'Operating', value: Math.abs(operatingActivities.total), actual: operatingActivities.total },
      { name: 'Investing', value: Math.abs(investingActivities.total), actual: investingActivities.total },
      { name: 'Financing', value: Math.abs(financingActivities.total), actual: financingActivities.total }
    ];

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.openingCash')}</p>
                  <p className="text-2xl font-bold text-[#4A5568]">{formatCurrency(cashPosition.opening)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.beginningOfPeriod')}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-[#4A5568]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.netCashFlow')}</p>
                  <p className={`text-2xl font-bold ${cashPosition.netChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(cashPosition.netChange)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercentage(cashPosition.percentageChange)} {t('reports.change')}
                  </p>
                </div>
                {cashPosition.netChange >= 0 ? 
                  <ArrowUpRight className="h-8 w-8 text-green-500" /> :
                  <ArrowDownRight className="h-8 w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.closingCash')}</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{formatCurrency(cashPosition.closing)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.endOfPeriod')}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.freeCashFlow')}</p>
                  <p className={`text-2xl font-bold ${freeCashFlow >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                    {formatCurrency(freeCashFlow)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.afterCapex')}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Activities Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{t('reports.operatingActivities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${operatingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(operatingActivities.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('reports.coreBusinessOperations')}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('reports.netIncome')}</span>
                  <span>{formatCurrency(operatingActivities.netIncome)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{t('reports.adjustments')}</span>
                  <span>{formatCurrency(operatingActivities.total - operatingActivities.netIncome)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{t('reports.investingActivities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${investingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(investingActivities.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('reports.assetInvestments')}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('reports.capex')}</span>
                  <span>{formatCurrency(investingActivities.capitalExpenditures)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{t('reports.investments')}</span>
                  <span>{formatCurrency(investingActivities.purchaseOfInvestments + investingActivities.saleOfInvestments)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{t('reports.financingActivities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(financingActivities.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('reports.capitalStructure')}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('reports.debtChanges')}</span>
                  <span>{formatCurrency(financingActivities.debtIssuance + financingActivities.debtRepayment)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{t('reports.dividends')}</span>
                  <span>{formatCurrency(financingActivities.dividendsPaid)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Waterfall */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.cashFlowWaterfall')}</CardTitle>
              <CardDescription>{t('reports.periodCashMovement')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill={COLORS.primary}>
                    {waterfallData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.type === 'start' || entry.type === 'end' ? COLORS.primary :
                          entry.type === 'positive' ? COLORS.success :
                          COLORS.danger
                        } 
                      />
                    ))}
                  </Bar>
                  <Line 
                    type="step" 
                    dataKey="cumulative" 
                    stroke={COLORS.secondary} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.secondary, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.cashFlowByActivity')}</CardTitle>
              <CardDescription>{t('reports.absoluteValueComparison')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      formatCurrency(props.payload.actual),
                      name
                    ]} 
                  />
                  <Bar dataKey="value" fill={COLORS.primary}>
                    {activityBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.actual >= 0 ? COLORS.success : COLORS.danger} 
                      />
                    ))}
                  </Bar>
                  <ReferenceLine y={0} stroke="#000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.cashFlowMetrics')}</CardTitle>
            <CardDescription>{t('reports.keyPerformanceIndicators')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.operatingCashFlowMargin')}</p>
                <p className="text-xl font-semibold">{formatPercentage(metrics.operatingCashFlowMargin)}</p>
                <Badge variant={metrics.operatingCashFlowMargin >= 15 ? 'success' : metrics.operatingCashFlowMargin >= 10 ? 'warning' : 'destructive'}>
                  {metrics.operatingCashFlowMargin >= 15 ? t('reports.strong') : metrics.operatingCashFlowMargin >= 10 ? t('reports.moderate') : t('reports.weak')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.cashFlowToDebtRatio')}</p>
                <p className="text-xl font-semibold">{metrics.cashFlowToDebtRatio.toFixed(2)}</p>
                <Badge variant={metrics.cashFlowToDebtRatio >= 0.5 ? 'success' : metrics.cashFlowToDebtRatio >= 0.2 ? 'warning' : 'destructive'}>
                  {metrics.cashFlowToDebtRatio >= 0.5 ? t('reports.excellent') : metrics.cashFlowToDebtRatio >= 0.2 ? t('reports.adequate') : t('reports.poor')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.cashFlowCoverageRatio')}</p>
                <p className="text-xl font-semibold">{metrics.cashFlowCoverageRatio.toFixed(2)}</p>
                <Badge variant={metrics.cashFlowCoverageRatio >= 2 ? 'success' : metrics.cashFlowCoverageRatio >= 1 ? 'warning' : 'destructive'}>
                  {metrics.cashFlowCoverageRatio >= 2 ? t('reports.comfortable') : metrics.cashFlowCoverageRatio >= 1 ? t('reports.sufficient') : t('reports.insufficient')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.cashReturnOnAssets')}</p>
                <p className="text-xl font-semibold">{formatPercentage(metrics.cashReturnOnAssets)}</p>
                <Badge variant={metrics.cashReturnOnAssets >= 10 ? 'success' : metrics.cashReturnOnAssets >= 5 ? 'warning' : 'destructive'}>
                  {metrics.cashReturnOnAssets >= 10 ? t('reports.high') : metrics.cashReturnOnAssets >= 5 ? t('reports.average') : t('reports.low')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDetailedView = () => {
    if (!reportData) return null;

    const { operatingActivities, investingActivities, financingActivities, cashPosition } = reportData;

    return (
      <div className="space-y-6">
        {/* Operating Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.cashFlowFromOperatingActivities')}</CardTitle>
            <CardDescription>{t('reports.coreBusinessCashGeneration')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">{t('reports.netIncome')}</span>
                <span className="font-medium">{formatCurrency(operatingActivities.netIncome)}</span>
              </div>
              
              <div className="pl-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground mt-3">{t('reports.adjustmentsToReconcile')}</p>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.depreciationAndAmortization')}</span>
                  <span className="font-medium">{formatCurrency(operatingActivities.depreciation + operatingActivities.amortization)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.stockBasedCompensation')}</span>
                  <span className="font-medium">{formatCurrency(operatingActivities.stockBasedCompensation)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.deferredIncomeTax')}</span>
                  <span className="font-medium">{formatCurrency(operatingActivities.deferredIncomeTax)}</span>
                </div>
                
                <p className="text-sm font-medium text-muted-foreground mt-3">{t('reports.changesInWorkingCapital')}</p>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.accountsReceivable')}</span>
                  <span className={`font-medium ${operatingActivities.accountsReceivableChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(operatingActivities.accountsReceivableChange)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.inventory')}</span>
                  <span className={`font-medium ${operatingActivities.inventoryChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(operatingActivities.inventoryChange)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.accountsPayable')}</span>
                  <span className={`font-medium ${operatingActivities.accountsPayableChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(operatingActivities.accountsPayableChange)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.otherOperatingActivities')}</span>
                  <span className="font-medium">{formatCurrency(operatingActivities.otherOperatingActivities)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg mt-4">
                <span className="font-bold text-lg">{t('reports.netCashFromOperatingActivities')}</span>
                <span className={`font-bold text-lg ${operatingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(operatingActivities.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investing Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.cashFlowFromInvestingActivities')}</CardTitle>
            <CardDescription>{t('reports.capitalAllocationsAndInvestments')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.capitalExpenditures')}</span>
                <span className="font-medium text-red-500">{formatCurrency(investingActivities.capitalExpenditures)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.acquisitions')}</span>
                <span className="font-medium">{formatCurrency(investingActivities.acquisitions)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.purchaseOfInvestments')}</span>
                <span className="font-medium text-red-500">{formatCurrency(investingActivities.purchaseOfInvestments)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.saleOfInvestments')}</span>
                <span className="font-medium text-green-500">{formatCurrency(investingActivities.saleOfInvestments)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.saleOfAssets')}</span>
                <span className="font-medium text-green-500">{formatCurrency(investingActivities.saleOfAssets)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.otherInvestingActivities')}</span>
                <span className="font-medium">{formatCurrency(investingActivities.otherInvestingActivities)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg mt-4">
                <span className="font-bold text-lg">{t('reports.netCashFromInvestingActivities')}</span>
                <span className={`font-bold text-lg ${investingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(investingActivities.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financing Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.cashFlowFromFinancingActivities')}</CardTitle>
            <CardDescription>{t('reports.capitalStructureChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.proceedsFromDebtIssuance')}</span>
                <span className="font-medium text-green-500">{formatCurrency(financingActivities.debtIssuance)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.debtRepayment')}</span>
                <span className="font-medium text-red-500">{formatCurrency(financingActivities.debtRepayment)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.proceedsFromStockIssuance')}</span>
                <span className="font-medium text-green-500">{formatCurrency(financingActivities.commonStockIssuance)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.stockRepurchase')}</span>
                <span className="font-medium text-red-500">{formatCurrency(financingActivities.commonStockRepurchase)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.dividendsPaid')}</span>
                <span className="font-medium text-red-500">{formatCurrency(financingActivities.dividendsPaid)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.otherFinancingActivities')}</span>
                <span className="font-medium">{formatCurrency(financingActivities.otherFinancingActivities)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-orange-50 px-4 rounded-lg mt-4">
                <span className="font-bold text-lg">{t('reports.netCashFromFinancingActivities')}</span>
                <span className={`font-bold text-lg ${financingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(financingActivities.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.cashSummary')}</CardTitle>
            <CardDescription>{t('reports.periodCashReconciliation')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">{t('reports.cashAtBeginningOfPeriod')}</span>
                <span className="font-bold text-lg">{formatCurrency(cashPosition.opening)}</span>
              </div>
              
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.netCashFromOperatingActivities')}</span>
                  <span className={`font-medium ${operatingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(operatingActivities.total)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.netCashFromInvestingActivities')}</span>
                  <span className={`font-medium ${investingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(investingActivities.total)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">{t('reports.netCashFromFinancingActivities')}</span>
                  <span className={`font-medium ${financingActivities.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(financingActivities.total)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-t">
                <span className="font-medium">{t('reports.netIncreaseDecreaseInCash')}</span>
                <span className={`font-bold text-lg ${cashPosition.netChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(cashPosition.netChange)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-[#E6B800] bg-opacity-10 px-4 rounded-lg">
                <span className="font-bold text-lg">{t('reports.cashAtEndOfPeriod')}</span>
                <span className="font-bold text-lg text-[#E6B800]">{formatCurrency(cashPosition.closing)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('reports.cashFlowStatement')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('reports.cashInflowsOutflowsAnalysis')} • {format(new Date(), 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('reports.print')}
          </Button>
          <Button variant="outline" size="sm" onClick={onEmail}>
            <Mail className="h-4 w-4 mr-2" />
            {t('reports.email')}
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {/* Filters Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 mr-1" />
              {dateRange?.from && dateRange?.to 
                ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                : t('reports.allTime')}
            </Badge>
            {branch !== 'all' && (
              <Badge variant="secondary">
                <Building2 className="h-3 w-3 mr-1" />
                {t('reports.branch')}: {branch}
              </Badge>
            )}
            {product !== 'all' && (
              <Badge variant="secondary">
                <Package className="h-3 w-3 mr-1" />
                {t('reports.product')}: {product}
              </Badge>
            )}
            {customerSegment !== 'all' && (
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {t('reports.segment')}: {customerSegment}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">{t('reports.summary')}</TabsTrigger>
          <TabsTrigger value="detailed">{t('reports.detailed')}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E6B800]"></div>
            </div>
          ) : (
            renderSummaryView()
          )}
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E6B800]"></div>
            </div>
          ) : (
            renderDetailedView()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlowStatementReport;