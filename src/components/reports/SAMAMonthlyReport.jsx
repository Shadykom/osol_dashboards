import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Building2, CreditCard, DollarSign, Users,
  Shield, AlertTriangle, Activity
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SAMAMonthlyReport = ({ data, isRTL = false }) => {
  if (!data) return null;

  const {
    reportPeriod,
    summary,
    liquidityMetrics,
    creditMetrics,
    capitalMetrics,
    depositBreakdown,
    compliance
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

  // Prepare data for charts
  const depositData = [
    { name: 'Savings', value: depositBreakdown?.savingsDeposits || 0 },
    { name: 'Checking', value: depositBreakdown?.checkingDeposits || 0 },
    { name: 'Term', value: depositBreakdown?.termDeposits || 0 }
  ];

  const metricsData = [
    { 
      name: 'Liquidity Ratio', 
      value: parseFloat(liquidityMetrics?.liquidityRatio || 0),
      requirement: 20,
      fill: '#0088FE'
    },
    { 
      name: 'NPL Ratio', 
      value: parseFloat(creditMetrics?.nplRatio || 0),
      requirement: 5,
      fill: '#FF8042'
    },
    { 
      name: 'Capital Adequacy', 
      value: parseFloat(capitalMetrics?.capitalAdequacyRatio || 0),
      requirement: 10.5,
      fill: '#00C49F'
    }
  ];

  const complianceData = [
    { metric: 'AML Screenings', value: compliance?.amlScreenings || 0 },
    { metric: 'CTRs Filed', value: compliance?.ctrsFiledDelta || 0 },
    { metric: 'SARs Filed', value: compliance?.sarsFiledDelta || 0 },
    { metric: 'Suspicious Transactions', value: compliance?.suspiciousTransactions || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#005740] to-[#E6B800] p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              SAMA Monthly Report
            </h2>
            <p className="text-white/80 mt-1">
              {reportPeriod?.month || format(new Date(reportPeriod?.startDate), 'MMMM yyyy')}
            </p>
          </div>
          <Badge className="bg-white text-[#005740] hover:bg-white/90">
            Official Report
          </Badge>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Deposits
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              New Accounts: {summary?.newAccounts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Loans
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalLoans)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              New Loans: {summary?.newLoans}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Assets
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalAssets)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Transactions: {summary?.totalTransactions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Compliance Status
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold">Compliant</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All requirements met
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="liquidity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Liquidity Metrics</CardTitle>
                <CardDescription>Key liquidity indicators and ratios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Liquidity Ratio</span>
                    <span className="text-sm font-bold">{formatPercentage(liquidityMetrics?.liquidityRatio)}</span>
                  </div>
                  <Progress 
                    value={parseFloat(liquidityMetrics?.liquidityRatio || 0)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Requirement: ≥ 20%</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Quick Ratio</span>
                    <span className="text-sm font-bold">{formatPercentage(liquidityMetrics?.quickRatio)}</span>
                  </div>
                  <Progress 
                    value={parseFloat(liquidityMetrics?.quickRatio || 0)} 
                    className="h-2"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm">Liquid Assets</span>
                    <span className="text-sm font-medium">{formatCurrency(liquidityMetrics?.liquidAssets)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deposit Breakdown</CardTitle>
                <CardDescription>Distribution by account type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={depositData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {depositData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Credit Metrics</CardTitle>
                <CardDescription>Loan portfolio health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">NPL Ratio</span>
                    <span className={`text-sm font-bold ${parseFloat(creditMetrics?.nplRatio) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercentage(creditMetrics?.nplRatio)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(parseFloat(creditMetrics?.nplRatio || 0) * 10, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Requirement: ≤ 5%</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Provision Coverage</span>
                    <span className="text-sm font-bold">{formatPercentage(creditMetrics?.provisionCoverage)}</span>
                  </div>
                  <Progress 
                    value={parseFloat(creditMetrics?.provisionCoverage || 0)} 
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Loan to Deposit Ratio</span>
                    <span className="text-sm font-bold">{formatPercentage(creditMetrics?.loanToDepositRatio)}</span>
                  </div>
                  <Progress 
                    value={parseFloat(creditMetrics?.loanToDepositRatio || 0)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Ratios Comparison</CardTitle>
                <CardDescription>Actual vs Requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Actual" />
                    <Bar dataKey="requirement" fill="#82ca9d" name="Requirement" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capital Structure</CardTitle>
              <CardDescription>Capital adequacy and composition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tier 1 Capital</h4>
                  <p className="text-2xl font-bold">{formatCurrency(capitalMetrics?.tier1Capital)}</p>
                  <p className="text-xs text-muted-foreground">Core capital base</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tier 2 Capital</h4>
                  <p className="text-2xl font-bold">{formatCurrency(capitalMetrics?.tier2Capital)}</p>
                  <p className="text-xs text-muted-foreground">Supplementary capital</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Total Capital</h4>
                  <p className="text-2xl font-bold">{formatCurrency(capitalMetrics?.totalCapital)}</p>
                  <p className="text-xs text-muted-foreground">Total regulatory capital</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Capital Adequacy Ratio (CAR)</h4>
                    <p className="text-xs text-muted-foreground mt-1">Minimum requirement: 10.5%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatPercentage(capitalMetrics?.capitalAdequacyRatio)}</p>
                    <Badge variant="success">Compliant</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Activities</CardTitle>
              <CardDescription>AML/CFT and regulatory compliance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{item.metric}</span>
                    <span className="text-lg font-bold">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">All compliance requirements met</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  No regulatory violations or warnings for this reporting period.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Report Period: {format(new Date(reportPeriod?.startDate), 'dd MMM yyyy')} - {format(new Date(reportPeriod?.endDate), 'dd MMM yyyy')}</span>
          <span>Generated on: {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};

export default SAMAMonthlyReport;