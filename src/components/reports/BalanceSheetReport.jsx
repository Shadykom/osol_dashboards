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
  PieChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
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

const BalanceSheetReport = ({ 
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
  const [viewMode, setViewMode] = useState('summary'); // summary, detailed, comparative
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_period');

  // Fetch balance sheet data based on parameters
  useEffect(() => {
    fetchBalanceSheetData();
  }, [dateRange, branch, product, customerSegment]);

  const fetchBalanceSheetData = async () => {
    setLoading(true);
    try {
      // Build query with filters
      let query = supabase
        .from('balance_sheet_view')
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
      const processedData = processBalanceSheetData(data);
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
      toast.error(t('reports.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const processBalanceSheetData = (rawData) => {
    // Aggregate assets
    const assets = {
      current: {
        cash: rawData.reduce((sum, item) => sum + (item.cash || 0), 0),
        accountsReceivable: rawData.reduce((sum, item) => sum + (item.accounts_receivable || 0), 0),
        inventory: rawData.reduce((sum, item) => sum + (item.inventory || 0), 0),
        otherCurrentAssets: rawData.reduce((sum, item) => sum + (item.other_current_assets || 0), 0),
      },
      nonCurrent: {
        propertyPlantEquipment: rawData.reduce((sum, item) => sum + (item.property_plant_equipment || 0), 0),
        investments: rawData.reduce((sum, item) => sum + (item.investments || 0), 0),
        intangibleAssets: rawData.reduce((sum, item) => sum + (item.intangible_assets || 0), 0),
        otherNonCurrentAssets: rawData.reduce((sum, item) => sum + (item.other_non_current_assets || 0), 0),
      }
    };

    // Calculate total current and non-current assets
    assets.current.total = Object.values(assets.current).reduce((sum, val) => sum + val, 0);
    assets.nonCurrent.total = Object.values(assets.nonCurrent).reduce((sum, val) => sum + val, 0);
    assets.total = assets.current.total + assets.nonCurrent.total;

    // Aggregate liabilities
    const liabilities = {
      current: {
        accountsPayable: rawData.reduce((sum, item) => sum + (item.accounts_payable || 0), 0),
        shortTermDebt: rawData.reduce((sum, item) => sum + (item.short_term_debt || 0), 0),
        accruedExpenses: rawData.reduce((sum, item) => sum + (item.accrued_expenses || 0), 0),
        otherCurrentLiabilities: rawData.reduce((sum, item) => sum + (item.other_current_liabilities || 0), 0),
      },
      nonCurrent: {
        longTermDebt: rawData.reduce((sum, item) => sum + (item.long_term_debt || 0), 0),
        deferredTaxLiabilities: rawData.reduce((sum, item) => sum + (item.deferred_tax_liabilities || 0), 0),
        otherNonCurrentLiabilities: rawData.reduce((sum, item) => sum + (item.other_non_current_liabilities || 0), 0),
      }
    };

    // Calculate total current and non-current liabilities
    liabilities.current.total = Object.values(liabilities.current).reduce((sum, val) => sum + val, 0);
    liabilities.nonCurrent.total = Object.values(liabilities.nonCurrent).reduce((sum, val) => sum + val, 0);
    liabilities.total = liabilities.current.total + liabilities.nonCurrent.total;

    // Calculate equity
    const equity = {
      commonStock: rawData.reduce((sum, item) => sum + (item.common_stock || 0), 0),
      retainedEarnings: rawData.reduce((sum, item) => sum + (item.retained_earnings || 0), 0),
      additionalPaidInCapital: rawData.reduce((sum, item) => sum + (item.additional_paid_in_capital || 0), 0),
      treasuryStock: rawData.reduce((sum, item) => sum + (item.treasury_stock || 0), 0),
      otherEquity: rawData.reduce((sum, item) => sum + (item.other_equity || 0), 0),
    };

    equity.total = Object.values(equity).reduce((sum, val) => sum + val, 0);

    // Calculate key ratios
    const ratios = {
      currentRatio: liabilities.current.total > 0 ? assets.current.total / liabilities.current.total : 0,
      quickRatio: liabilities.current.total > 0 ? (assets.current.total - assets.current.inventory) / liabilities.current.total : 0,
      debtToEquity: equity.total > 0 ? liabilities.total / equity.total : 0,
      debtToAssets: assets.total > 0 ? liabilities.total / assets.total : 0,
      equityMultiplier: equity.total > 0 ? assets.total / equity.total : 0,
      workingCapital: assets.current.total - liabilities.current.total
    };

    return {
      assets,
      liabilities,
      equity,
      ratios,
      metadata: {
        reportDate: new Date(),
        dateRange,
        filters: { branch, product, customerSegment }
      }
    };
  };

  const renderSummaryView = () => {
    if (!reportData) return null;

    const { assets, liabilities, equity, ratios } = reportData;

    // Prepare chart data
    const balanceSheetComposition = [
      { name: 'Current Assets', value: assets.current.total, category: 'Assets' },
      { name: 'Non-Current Assets', value: assets.nonCurrent.total, category: 'Assets' },
      { name: 'Current Liabilities', value: liabilities.current.total, category: 'Liabilities' },
      { name: 'Non-Current Liabilities', value: liabilities.nonCurrent.total, category: 'Liabilities' },
      { name: 'Total Equity', value: equity.total, category: 'Equity' }
    ];

    const assetsBreakdown = [
      { name: 'Cash', value: assets.current.cash },
      { name: 'Accounts Receivable', value: assets.current.accountsReceivable },
      { name: 'Inventory', value: assets.current.inventory },
      { name: 'PP&E', value: assets.nonCurrent.propertyPlantEquipment },
      { name: 'Investments', value: assets.nonCurrent.investments }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalAssets')}</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{formatCurrency(assets.total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.currentAssets')}: {formatCurrency(assets.current.total)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalLiabilities')}</p>
                  <p className="text-2xl font-bold text-orange-500">{formatCurrency(liabilities.total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.currentLiabilities')}: {formatCurrency(liabilities.current.total)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalEquity')}</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(equity.total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.equityRatio')}: {formatPercentage((equity.total / assets.total) * 100)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.currentRatio')}</p>
                  <p className="text-2xl font-bold text-blue-500">{ratios.currentRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('reports.quickRatio')}: {ratios.quickRatio.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Sheet Composition */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.balanceSheetComposition')}</CardTitle>
              <CardDescription>{t('reports.assetsLiabilitiesEquityBreakdown')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceSheetComposition}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill={COLORS.primary}>
                    {balanceSheetComposition.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.category === 'Assets' ? COLORS.success :
                          entry.category === 'Liabilities' ? COLORS.warning :
                          COLORS.info
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assets Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.assetsBreakdown')}</CardTitle>
              <CardDescription>{t('reports.majorAssetCategories')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsChart>
                  <Pie
                    data={assetsBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.info, COLORS.success, COLORS.warning][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Financial Ratios */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.keyFinancialRatios')}</CardTitle>
            <CardDescription>{t('reports.liquiditySolvencyRatios')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.currentRatio')}</p>
                <p className="text-xl font-semibold">{ratios.currentRatio.toFixed(2)}</p>
                <Badge variant={ratios.currentRatio >= 1.5 ? 'success' : ratios.currentRatio >= 1 ? 'warning' : 'destructive'}>
                  {ratios.currentRatio >= 1.5 ? t('reports.healthy') : ratios.currentRatio >= 1 ? t('reports.acceptable') : t('reports.concerning')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.quickRatio')}</p>
                <p className="text-xl font-semibold">{ratios.quickRatio.toFixed(2)}</p>
                <Badge variant={ratios.quickRatio >= 1 ? 'success' : ratios.quickRatio >= 0.8 ? 'warning' : 'destructive'}>
                  {ratios.quickRatio >= 1 ? t('reports.healthy') : ratios.quickRatio >= 0.8 ? t('reports.acceptable') : t('reports.concerning')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.debtToEquity')}</p>
                <p className="text-xl font-semibold">{ratios.debtToEquity.toFixed(2)}</p>
                <Badge variant={ratios.debtToEquity <= 1 ? 'success' : ratios.debtToEquity <= 2 ? 'warning' : 'destructive'}>
                  {ratios.debtToEquity <= 1 ? t('reports.conservative') : ratios.debtToEquity <= 2 ? t('reports.moderate') : t('reports.aggressive')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.debtToAssets')}</p>
                <p className="text-xl font-semibold">{formatPercentage(ratios.debtToAssets * 100)}</p>
                <Badge variant={ratios.debtToAssets <= 0.4 ? 'success' : ratios.debtToAssets <= 0.6 ? 'warning' : 'destructive'}>
                  {ratios.debtToAssets <= 0.4 ? t('reports.low') : ratios.debtToAssets <= 0.6 ? t('reports.moderate') : t('reports.high')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.workingCapital')}</p>
                <p className="text-xl font-semibold">{formatCurrency(ratios.workingCapital)}</p>
                <Badge variant={ratios.workingCapital > 0 ? 'success' : 'destructive'}>
                  {ratios.workingCapital > 0 ? t('reports.positive') : t('reports.negative')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('reports.equityMultiplier')}</p>
                <p className="text-xl font-semibold">{ratios.equityMultiplier.toFixed(2)}</p>
                <Badge variant="outline">{t('reports.leverage')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDetailedView = () => {
    if (!reportData) return null;

    const { assets, liabilities, equity } = reportData;

    return (
      <div className="space-y-6">
        {/* Assets Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.assets')}</CardTitle>
            <CardDescription>{t('reports.detailedAssetsBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Assets */}
              <div>
                <h4 className="font-semibold text-lg mb-3">{t('reports.currentAssets')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.cash')}</span>
                    <span className="font-medium">{formatCurrency(assets.current.cash)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.accountsReceivable')}</span>
                    <span className="font-medium">{formatCurrency(assets.current.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.inventory')}</span>
                    <span className="font-medium">{formatCurrency(assets.current.inventory)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.otherCurrentAssets')}</span>
                    <span className="font-medium">{formatCurrency(assets.current.otherCurrentAssets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span>{t('reports.totalCurrentAssets')}</span>
                    <span className="text-[#E6B800]">{formatCurrency(assets.current.total)}</span>
                  </div>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div>
                <h4 className="font-semibold text-lg mb-3">{t('reports.nonCurrentAssets')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.propertyPlantEquipment')}</span>
                    <span className="font-medium">{formatCurrency(assets.nonCurrent.propertyPlantEquipment)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.investments')}</span>
                    <span className="font-medium">{formatCurrency(assets.nonCurrent.investments)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.intangibleAssets')}</span>
                    <span className="font-medium">{formatCurrency(assets.nonCurrent.intangibleAssets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.otherNonCurrentAssets')}</span>
                    <span className="font-medium">{formatCurrency(assets.nonCurrent.otherNonCurrentAssets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span>{t('reports.totalNonCurrentAssets')}</span>
                    <span className="text-[#E6B800]">{formatCurrency(assets.nonCurrent.total)}</span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-lg">
                <span className="font-bold text-lg">{t('reports.totalAssets')}</span>
                <span className="font-bold text-lg text-[#E6B800]">{formatCurrency(assets.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.liabilities')}</CardTitle>
            <CardDescription>{t('reports.detailedLiabilitiesBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Liabilities */}
              <div>
                <h4 className="font-semibold text-lg mb-3">{t('reports.currentLiabilities')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.accountsPayable')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.current.accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.shortTermDebt')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.current.shortTermDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.accruedExpenses')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.current.accruedExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.otherCurrentLiabilities')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.current.otherCurrentLiabilities)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span>{t('reports.totalCurrentLiabilities')}</span>
                    <span className="text-orange-500">{formatCurrency(liabilities.current.total)}</span>
                  </div>
                </div>
              </div>

              {/* Non-Current Liabilities */}
              <div>
                <h4 className="font-semibold text-lg mb-3">{t('reports.nonCurrentLiabilities')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.longTermDebt')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.nonCurrent.longTermDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.deferredTaxLiabilities')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.nonCurrent.deferredTaxLiabilities)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{t('reports.otherNonCurrentLiabilities')}</span>
                    <span className="font-medium">{formatCurrency(liabilities.nonCurrent.otherNonCurrentLiabilities)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span>{t('reports.totalNonCurrentLiabilities')}</span>
                    <span className="text-orange-500">{formatCurrency(liabilities.nonCurrent.total)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="flex justify-between items-center py-3 bg-orange-50 px-4 rounded-lg">
                <span className="font-bold text-lg">{t('reports.totalLiabilities')}</span>
                <span className="font-bold text-lg text-orange-500">{formatCurrency(liabilities.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equity Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('reports.shareholdersEquity')}</CardTitle>
            <CardDescription>{t('reports.detailedEquityBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.commonStock')}</span>
                <span className="font-medium">{formatCurrency(equity.commonStock)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.retainedEarnings')}</span>
                <span className="font-medium">{formatCurrency(equity.retainedEarnings)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.additionalPaidInCapital')}</span>
                <span className="font-medium">{formatCurrency(equity.additionalPaidInCapital)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.treasuryStock')}</span>
                <span className="font-medium">({formatCurrency(Math.abs(equity.treasuryStock))})</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{t('reports.otherEquity')}</span>
                <span className="font-medium">{formatCurrency(equity.otherEquity)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-bold text-lg">{t('reports.totalEquity')}</span>
                <span className="font-bold text-lg text-green-500">{formatCurrency(equity.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Check */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{t('reports.totalAssetsCheck')}</span>
              <span className="font-bold text-lg">{formatCurrency(assets.total)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-lg">{t('reports.totalLiabilitiesAndEquity')}</span>
              <span className="font-bold text-lg">{formatCurrency(liabilities.total + equity.total)}</span>
            </div>
            <div className="mt-4 text-center">
              <Badge variant={Math.abs(assets.total - (liabilities.total + equity.total)) < 1 ? 'success' : 'destructive'}>
                {Math.abs(assets.total - (liabilities.total + equity.total)) < 1 ? t('reports.balanced') : t('reports.unbalanced')}
              </Badge>
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
          <h2 className="text-2xl font-bold text-gray-900">{t('reports.balanceSheet')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('reports.assetsLiabilitiesEquityPosition')} • {format(new Date(), 'PPP')}
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

export default BalanceSheetReport;