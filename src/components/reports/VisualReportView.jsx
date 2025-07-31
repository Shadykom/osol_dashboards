import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  CreditCard, AlertCircle, CheckCircle, Activity 
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = {
  primary: '#E6B800',    // OSOL Golden
  secondary: '#CC9900',  // Darker Golden
  success: '#48BB78',    // Green
  danger: '#F56565',     // Red
  info: '#F6AD55',       // Light Orange (replaced blue)
  warning: '#ED8936',    // Orange
  gray: '#718096'
};

const VisualReportView = ({ reportData, reportType }) => {
  if (!reportData) return null;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Render Income Statement Visual
  const renderIncomeStatement = () => {
    const { revenue, expenses, netIncome } = reportData;
    
    // Prepare data for charts
    const revenueData = [
      { name: 'Transaction Fees', value: revenue?.transactionFees || 0, color: COLORS.primary },
      { name: 'Interest Income', value: revenue?.interestIncome || 0, color: COLORS.secondary },
      { name: 'Other Income', value: revenue?.otherIncome || 0, color: COLORS.info }
    ];

    const expenseData = [
      { name: 'Operating', value: expenses?.operatingExpenses || 0 },
      { name: 'Personnel', value: expenses?.personnelCosts || 0 },
      { name: 'Provisions', value: expenses?.provisions || 0 },
      { name: 'Other', value: expenses?.otherExpenses || 0 }
    ];

    const totalRevenue = revenue?.totalRevenue || 0;
    const totalExpenses = expenses?.totalExpenses || 0;
    const calculatedNetIncome = netIncome || (totalRevenue - totalExpenses);
    const profitMargin = totalRevenue > 0 ? (calculatedNetIncome / totalRevenue * 100) : 0;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#48BB78]">{formatCurrency(totalRevenue)}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#F56565]">{formatCurrency(totalExpenses)}</p>
                </div>
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Net Income</p>
                  <p className={`text-lg sm:text-2xl font-bold ${calculatedNetIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(calculatedNetIncome)}
                  </p>
                </div>
                {calculatedNetIncome >= 0 ? 
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" /> : 
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Profit Margin</p>
                  <p className={`text-lg sm:text-2xl font-bold ${profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(profitMargin)}
                  </p>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[#F6AD55]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue Breakdown */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base text-[#4A5568]">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base text-[#4A5568]">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill={COLORS.warning} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Expenses Comparison */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base text-[#4A5568]">Revenue vs Expenses Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart
                data={[
                  { name: 'Revenue', value: totalRevenue, fill: COLORS.success },
                  { name: 'Expenses', value: totalExpenses, fill: COLORS.danger },
                  { name: 'Net Income', value: calculatedNetIncome, fill: calculatedNetIncome >= 0 ? COLORS.primary : COLORS.danger }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill={(entry) => entry.fill} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Balance Sheet Visual
  const renderBalanceSheet = () => {
    const { assets, liabilities, equity } = reportData;
    
    const assetsData = [
      { name: 'Cash', value: assets?.cash || 0 },
      { name: 'Loans', value: assets?.loans || 0 },
      { name: 'Investments', value: assets?.investments || 0 },
      { name: 'Fixed Assets', value: assets?.fixedAssets || 0 }
    ];

    const liabilitiesData = [
      { name: 'Deposits', value: liabilities?.deposits || 0 },
      { name: 'Borrowings', value: liabilities?.borrowings || 0 },
      { name: 'Other', value: liabilities?.otherLiabilities || 0 }
    ];

    const totalAssets = assets?.totalAssets || assetsData.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilities?.totalLiabilities || liabilitiesData.reduce((sum, item) => sum + item.value, 0);
    const totalEquity = equity?.totalEquity || (totalAssets - totalLiabilities);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{formatCurrency(totalAssets)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Liabilities</p>
                  <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalLiabilities)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Equity</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(totalEquity)}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Assets Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.info, COLORS.success][index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Liabilities Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Liabilities Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={liabilitiesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill={COLORS.warning} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Balance Sheet Equation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#4A5568]">Balance Sheet Equation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={[
                  { name: 'Assets', value: totalAssets },
                  { name: 'Liabilities', value: totalLiabilities },
                  { name: 'Equity', value: totalEquity }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Cash Flow Statement Visual
  const renderCashFlowStatement = () => {
    const { 
      operatingActivities, 
      investingActivities, 
      financingActivities, 
      netCashFlow, 
      openingBalance, 
      closingBalance 
    } = reportData;

    // Prepare waterfall chart data
    const waterfallData = [
      { name: 'Opening Balance', value: openingBalance || 0, type: 'start' },
      { name: 'Operating Activities', value: operatingActivities?.netOperating || 0, type: operatingActivities?.netOperating >= 0 ? 'positive' : 'negative' },
      { name: 'Investing Activities', value: investingActivities?.netInvesting || 0, type: investingActivities?.netInvesting >= 0 ? 'positive' : 'negative' },
      { name: 'Financing Activities', value: financingActivities?.netFinancing || 0, type: financingActivities?.netFinancing >= 0 ? 'positive' : 'negative' },
      { name: 'Closing Balance', value: closingBalance || 0, type: 'end' }
    ];

    // Calculate cumulative values for waterfall
    let cumulative = openingBalance || 0;
    const waterfallWithCumulative = waterfallData.map((item, index) => {
      if (index === 0) {
        return { ...item, cumulative: item.value };
      } else if (index === waterfallData.length - 1) {
        return { ...item, cumulative: closingBalance || 0 };
      } else {
        cumulative += item.value;
        return { ...item, cumulative };
      }
    });

    // Prepare detailed breakdown data
    const operatingDetails = [
      { name: 'Cash from Operations', value: operatingActivities?.cashFromOperations || 0 },
      { name: 'Interest Received', value: operatingActivities?.interestReceived || 0 },
      { name: 'Interest Paid', value: -(operatingActivities?.interestPaid || 0) }
    ];

    const investingDetails = [
      { name: 'Purchase of Investments', value: investingActivities?.purchaseOfInvestments || 0 },
      { name: 'Sale of Investments', value: investingActivities?.saleOfInvestments || 0 }
    ];

    const financingDetails = [
      { name: 'Proceeds from Borrowings', value: financingActivities?.proceedsFromBorrowings || 0 },
      { name: 'Repayment of Borrowings', value: financingActivities?.repaymentOfBorrowings || 0 },
      { name: 'Dividends Paid', value: financingActivities?.dividendsPaid || 0 }
    ];

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Opening Cash</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#4A5568]">{formatCurrency(openingBalance)}</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-[#718096]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-lg sm:text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(netCashFlow)}
                  </p>
                </div>
                {netCashFlow >= 0 ? 
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" /> :
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Closing Cash</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#E6B800]">{formatCurrency(closingBalance)}</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Cash Change %</p>
                  <p className={`text-lg sm:text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {openingBalance > 0 ? formatPercentage((netCashFlow / openingBalance) * 100) : '0%'}
                  </p>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Waterfall Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#4A5568]">Cash Flow Waterfall</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={waterfallWithCumulative} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallWithCumulative.map((entry, index) => {
                    let color = COLORS.gray;
                    if (entry.type === 'positive') color = COLORS.success;
                    else if (entry.type === 'negative') color = COLORS.danger;
                    else if (entry.type === 'start' || entry.type === 'end') color = COLORS.primary;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568] text-lg">Operating Activities</CardTitle>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(operatingActivities?.netOperating || 0)}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {operatingDetails.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className={`font-medium ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(item.value))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568] text-lg">Investing Activities</CardTitle>
              <p className={`text-2xl font-bold ${investingActivities?.netInvesting >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(investingActivities?.netInvesting || 0)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investingDetails.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className={`font-medium ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(item.value))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568] text-lg">Financing Activities</CardTitle>
              <p className={`text-2xl font-bold ${financingActivities?.netFinancing >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(financingActivities?.netFinancing || 0)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {financingDetails.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className={`font-medium ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(item.value))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#4A5568]">Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Amount (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Opening Cash Balance</td>
                    <td className="text-right font-medium">{formatCurrency(openingBalance)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Net Cash from Operating Activities</td>
                    <td className={`text-right font-medium ${operatingActivities?.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(operatingActivities?.netOperating || 0)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Net Cash from Investing Activities</td>
                    <td className={`text-right font-medium ${investingActivities?.netInvesting >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(investingActivities?.netInvesting || 0)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Net Cash from Financing Activities</td>
                    <td className={`text-right font-medium ${financingActivities?.netFinancing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financingActivities?.netFinancing || 0)}
                    </td>
                  </tr>
                  <tr className="border-t-2 font-bold">
                    <td className="py-2">Closing Cash Balance</td>
                    <td className="text-right text-[#E6B800]">{formatCurrency(closingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Cash Flow Trend */}
        {reportData.monthlyTrend && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Monthly Cash Flow Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={reportData.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="inflows" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    name="Cash Inflows"
                    dot={{ fill: COLORS.success }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outflows" 
                    stroke={COLORS.danger} 
                    strokeWidth={2}
                    name="Cash Outflows"
                    dot={{ fill: COLORS.danger }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netFlow" 
                    stroke={COLORS.primary} 
                    strokeWidth={3}
                    name="Net Cash Flow"
                    dot={{ fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Flow Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#E6B800]">
                {reportData.cashFlowRatio ? reportData.cashFlowRatio.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Operating Cash Flow / Operating Expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Free Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.freeCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(reportData.freeCashFlow || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Operating Cash - Capital Expenditures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Conversion Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A5568]">
                {reportData.cashConversionCycle || 45} days
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Days to convert investments to cash
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render Customer Report Visual
  const renderCustomerReport = () => {
    const customerData = reportData.customerMetrics || reportData;
    
    // Monthly trend data
    const monthlyData = customerData.monthlyTrend || [
      { month: 'Jan', new: 150, active: 2500, churned: 30 },
      { month: 'Feb', new: 180, active: 2650, churned: 25 },
      { month: 'Mar', new: 200, active: 2825, churned: 20 },
      { month: 'Apr', new: 170, active: 2975, churned: 35 },
      { month: 'May', new: 220, active: 3160, churned: 15 },
      { month: 'Jun', new: 250, active: 3395, churned: 20 }
    ];

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{customerData.totalCustomers || 3395}</p>
                </div>
                <Users className="h-8 w-8 text-[#E6B800]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold text-green-500">{customerData.newCustomers || 250}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <p className="text-2xl font-bold text-red-500">{customerData.churnRate || '2.5%'}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Account Value</p>
                  <p className="text-2xl font-bold text-[#F6AD55]">{formatCurrency(customerData.avgAccountValue || 125000)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#F6AD55]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#4A5568]">Customer Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="new" stroke={COLORS.success} name="New Customers" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke={COLORS.primary} name="Active Customers" strokeWidth={2} />
                <Line type="monotone" dataKey="churned" stroke={COLORS.danger} name="Churned" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Retail', value: 2500, fill: COLORS.primary },
                      { name: 'Corporate', value: 500, fill: COLORS.secondary },
                      { name: 'SME', value: 300, fill: COLORS.info },
                      { name: 'Premium', value: 95, fill: COLORS.success }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { age: '18-25', count: 450 },
                    { age: '26-35', count: 1200 },
                    { age: '36-45', count: 900 },
                    { age: '46-55', count: 600 },
                    { age: '56+', count: 245 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Main render based on report type
  const renderReportContent = () => {
    switch (reportType) {
      case 'income_statement':
      case 'profit_loss':
        return renderIncomeStatement();
      case 'balance_sheet':
        return renderBalanceSheet();
      case 'cash_flow':
        return renderCashFlowStatement();
      case 'customer_acquisition':
      case 'customer_retention':
      case 'customer_demographics':
        return renderCustomerReport();
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Visual representation for {reportType} is being developed.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Report Header with OSOL Branding */}
      <div className="bg-gradient-to-r from-[#E6B800] to-[#CC9900] text-white p-4 sm:p-6 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Financial Report Analysis</h2>
            <p className="text-xs sm:text-sm opacity-90">
              {reportData.period ? 
                `Period: ${format(new Date(reportData.period.startDate), 'MMM dd, yyyy')} - ${format(new Date(reportData.period.endDate), 'MMM dd, yyyy')}` :
                `As of: ${format(new Date(), 'MMM dd, yyyy')}`
              }
            </p>
          </div>
          <img src="/osol-logo.png" alt="OSOL" className="h-10 sm:h-12 w-auto filter brightness-0 invert" />
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-b-lg">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default VisualReportView;