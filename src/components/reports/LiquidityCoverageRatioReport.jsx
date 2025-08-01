import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  Droplets, AlertTriangle, CheckCircle, TrendingUp,
  DollarSign, Activity, BarChart3, Info
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const LiquidityCoverageRatioReport = ({ data, isRTL = false }) => {
  if (!data) return null;

  const {
    asOfDate,
    hqla,
    cashFlows,
    ratio,
    breakdown
  } = data;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Check LCR compliance
  const getLCRStatus = () => {
    const lcrValue = parseFloat(ratio?.lcr || 0);
    if (lcrValue >= 100) {
      return { status: 'compliant', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    } else if (lcrValue >= 80) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    } else {
      return { status: 'non-compliant', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    }
  };

  const lcrStatus = getLCRStatus();
  const StatusIcon = lcrStatus.icon;

  // Prepare data for charts
  const hqlaData = [
    { name: 'Level 1', value: hqla?.level1 || 0, weight: 100 },
    { name: 'Level 2A', value: hqla?.level2A || 0, weight: 85 },
    { name: 'Level 2B', value: hqla?.level2B || 0, weight: 50 }
  ];

  const cashFlowData = [
    { name: 'Total Outflows', value: cashFlows?.totalOutflows || 0, type: 'outflow' },
    { name: 'Total Inflows', value: cashFlows?.totalInflows || 0, type: 'inflow' },
    { name: 'Net Cash Outflows', value: cashFlows?.netCashOutflows || 0, type: 'net' }
  ];

  const depositBreakdownData = [
    {
      category: 'Retail Deposits',
      amount: breakdown?.retailDeposits?.amount || 0,
      outflowRate: breakdown?.retailDeposits?.outflowRate || '5%',
      outflow: breakdown?.retailDeposits?.outflow || 0
    },
    {
      category: 'Corporate Deposits',
      amount: breakdown?.corporateDeposits?.amount || 0,
      outflowRate: breakdown?.corporateDeposits?.outflowRate || '25%',
      outflow: breakdown?.corporateDeposits?.outflow || 0
    }
  ];

  // Calculate weighted HQLA
  const weightedHQLA = hqlaData.reduce((sum, item) => {
    return sum + (item.value * item.weight / 100);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Droplets className="h-6 w-6" />
              Liquidity Coverage Ratio Report
            </h2>
            <p className="text-white/80 mt-1">
              As of {format(new Date(asOfDate), 'dd MMMM yyyy')}
            </p>
          </div>
          <Badge className="bg-white text-blue-600 hover:bg-white/90">
            Daily Report
          </Badge>
        </div>
      </div>

      {/* LCR Summary Card */}
      <Card className={lcrStatus.bgColor}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liquidity Coverage Ratio (LCR)</span>
            <StatusIcon className={`h-6 w-6 ${lcrStatus.color}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${lcrStatus.color}`}>
                {formatPercentage(ratio?.lcr)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Current LCR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{ratio?.minimumRequirement}</p>
              <p className="text-sm text-muted-foreground mt-1">Minimum Requirement</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{formatPercentage(ratio?.buffer)}</p>
              <p className="text-sm text-muted-foreground mt-1">Buffer Above Minimum</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">LCR Progress</span>
              <span className="text-sm">{formatPercentage(ratio?.lcr)} / 100%</span>
            </div>
            <Progress value={Math.min(parseFloat(ratio?.lcr || 0), 150)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Key Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              High Quality Liquid Assets (HQLA)
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>Breakdown by asset level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total HQLA</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(hqla?.totalHQLA)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">After applicable haircuts</p>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hqlaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2 text-sm">
                {hqlaData.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name} ({item.weight}% weight)</span>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cash Flows
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>30-day stressed period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Net Cash Outflows</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(cashFlows?.netCashOutflows)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Stressed scenario calculation</p>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill={(entry) => 
                    entry.type === 'outflow' ? '#EF4444' : 
                    entry.type === 'inflow' ? '#10B981' : '#F59E0B'
                  } />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-600">Total Outflows</span>
                  <span className="font-medium">{formatCurrency(cashFlows?.totalOutflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Total Inflows</span>
                  <span className="font-medium">{formatCurrency(cashFlows?.totalInflows)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Net Cash Outflows</span>
                  <span className="font-bold">{formatCurrency(cashFlows?.netCashOutflows)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Outflow Analysis</CardTitle>
          <CardDescription>Breakdown by deposit type and outflow rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Deposit Categories</h4>
              <div className="space-y-4">
                {depositBreakdownData.map((item, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium">{item.category}</h5>
                        <p className="text-sm text-muted-foreground">
                          Outflow rate: {item.outflowRate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-red-600">
                          -{formatCurrency(item.outflow)}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={parseFloat(item.outflowRate)} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Outflow Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={depositBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="outflow"
                  >
                    {depositBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LCR Formula Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            LCR Calculation
          </CardTitle>
          <CardDescription>Formula and components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-6 rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-lg font-mono">
                LCR = HQLA / Net Cash Outflows × 100
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">HQLA</p>
                  <p className="text-xl font-bold">{formatCurrency(hqla?.totalHQLA)}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl">÷</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Cash Outflows</p>
                  <p className="text-xl font-bold">{formatCurrency(cashFlows?.netCashOutflows)}</p>
                </div>
              </div>
              <div className="text-center pt-4 border-t">
                <p className="text-3xl font-bold text-blue-600">= {formatPercentage(ratio?.lcr)}</p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Regulatory Requirement</AlertTitle>
            <AlertDescription>
              The minimum LCR requirement is 100%. Banks must maintain sufficient high-quality liquid assets 
              to cover net cash outflows over a 30-day stressed period.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Assessment</CardTitle>
          <CardDescription>LCR regulatory compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          {parseFloat(ratio?.lcr) >= 100 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Compliant</AlertTitle>
              <AlertDescription className="text-green-700">
                The bank's LCR of {formatPercentage(ratio?.lcr)} exceeds the minimum requirement of 100%. 
                The liquidity position is strong with adequate high-quality liquid assets to meet potential 
                cash outflows during stressed conditions.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Non-Compliant</AlertTitle>
              <AlertDescription className="text-red-700">
                The bank's LCR of {formatPercentage(ratio?.lcr)} is below the minimum requirement of 100%. 
                Immediate action is required to increase high-quality liquid assets or reduce potential 
                cash outflows to meet regulatory requirements.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Current LCR</p>
              <p className="text-2xl font-bold">{formatPercentage(ratio?.lcr)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Target LCR</p>
              <p className="text-2xl font-bold">≥ 100%</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Buffer</p>
              <p className="text-2xl font-bold">{formatPercentage(ratio?.buffer)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Report Date: {format(new Date(asOfDate), 'dd MMM yyyy')}</span>
          <span>Generated on: {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};

export default LiquidityCoverageRatioReport;