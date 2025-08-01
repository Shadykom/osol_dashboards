import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  CreditCard, AlertCircle, CheckCircle, Activity, Building2, Calendar, Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import osoulLogo from '@/assets/osol-logo.png';

  // OSOL Brand Colors
  const OSOL_COLORS = {
    primary: '#E6B800',    // OSOL Golden
    primaryDark: '#CC9900', // Darker Golden
    secondary: '#4A5568',   // Dark Gray
    accent: '#2D3748',      // Darker Gray
    light: '#F7FAFC',       // Light Background
    success: '#E6B800',     // OSOL Golden (replaced green)
    warning: '#ED8936',     // Orange
    error: '#F56565',       // Red
    text: '#2D3748',
    textMuted: '#718096'
  };

const IncomeStatementReport = ({ reportData, reportType, dateRange }) => {
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

  // Extract data
  const { revenue, expenses, netIncome } = reportData;
  const totalRevenue = revenue?.totalRevenue || 0;
  const totalExpenses = expenses?.totalExpenses || 0;
  const calculatedNetIncome = netIncome || (totalRevenue - totalExpenses);
  const profitMargin = totalRevenue > 0 ? (calculatedNetIncome / totalRevenue * 100) : 0;

  // Prepare chart data
  const revenueData = [
    { name: 'Interest Income', value: revenue?.interestIncome || 13373, color: OSOL_COLORS.primary },
    { name: 'Fee Income', value: revenue?.feeIncome || 600, color: OSOL_COLORS.primaryDark },
    { name: 'Commission Income', value: revenue?.commissionIncome || 0, color: OSOL_COLORS.secondary },
    { name: 'Other Income', value: revenue?.otherIncome || 279, color: OSOL_COLORS.success }
  ];

  const expenseData = [
    { name: 'Personnel Expenses', value: expenses?.personnelExpenses || 4891, color: OSOL_COLORS.error },
    { name: 'Administrative Expenses', value: expenses?.administrativeExpenses || 3122, color: OSOL_COLORS.warning },
    { name: 'Operating Expenses', value: expenses?.operatingExpenses || 2150, color: OSOL_COLORS.accent },
    { name: 'Other Expenses', value: expenses?.otherExpenses || 1200, color: OSOL_COLORS.textMuted }
  ];

  const currentDate = new Date();
  const generatedOn = format(currentDate, 'dd MMMM yyyy HH:mm');

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Professional Header */}
      <div className="bg-white border-b-4 border-[#E6B800] print:border-b-2 print:border-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Company Info */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-[#E6B800] to-[#CC9900] p-3 rounded-lg shadow-lg">
                <img 
                  src={osoulLogo} 
                  alt="OSOL Logo" 
                  className="h-12 w-12 object-contain filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2D3748] tracking-tight">
                  OSOL Financial Services
                </h1>
                <p className="text-[#718096] text-sm font-medium">
                  Financial Solutions & Banking Services
                </p>
              </div>
            </div>

            {/* Right: Report Info */}
            <div className="text-right">
              <div className="bg-[#E6B800] text-white px-4 py-2 rounded-lg shadow-sm">
                <h2 className="text-lg font-bold">Income Statement</h2>
                <p className="text-sm opacity-90">Financial Report</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">Report Period:</span>
              <span className="font-semibold text-[#2D3748]">
                {dateRange ? `${format(new Date(dateRange.from), 'dd MMM yyyy')} - ${format(new Date(dateRange.to), 'dd MMM yyyy')}` : 'Current Period'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">Generated on:</span>
              <span className="font-semibold text-[#2D3748]">{generatedOn}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">Currency:</span>
              <span className="font-semibold text-[#2D3748]">Saudi Riyal (SAR)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#E6B800] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-[#718096] mt-1">Period Performance</p>
                </div>
                <div className="p-3 bg-[#FEF3C7] rounded-full">
                  <TrendingUp className="h-6 w-6 text-[#E6B800]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#F56565] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-[#F56565]">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-[#718096] mt-1">Operating Costs</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <TrendingDown className="h-6 w-6 text-[#F56565]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${calculatedNetIncome >= 0 ? 'border-l-[#E6B800]' : 'border-l-[#F56565]'} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Net Income</p>
                  <p className={`text-2xl font-bold ${calculatedNetIncome >= 0 ? 'text-[#E6B800]' : 'text-[#F56565]'}`}>
                    {formatCurrency(calculatedNetIncome)}
                  </p>
                  <p className="text-xs text-[#718096] mt-1">Bottom Line</p>
                </div>
                <div className={`p-3 ${calculatedNetIncome >= 0 ? 'bg-yellow-50' : 'bg-red-50'} rounded-full`}>
                  {calculatedNetIncome >= 0 ? 
                    <CheckCircle className="h-6 w-6 text-[#E6B800]" /> : 
                    <AlertCircle className="h-6 w-6 text-[#F56565]" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#ED8936] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Profit Margin</p>
                  <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-[#E6B800]' : 'text-[#F56565]'}`}>
                    {formatPercentage(profitMargin)}
                  </p>
                  <p className="text-xs text-[#718096] mt-1">Efficiency Ratio</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Activity className="h-6 w-6 text-[#ED8936]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
                <DollarSign className="h-5 w-5 text-[#E6B800] mr-2" />
                Revenue Breakdown
              </CardTitle>
              <p className="text-sm text-[#718096]">Distribution of income sources</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
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
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
                <CreditCard className="h-5 w-5 text-[#E6B800] mr-2" />
                Expense Breakdown
              </CardTitle>
              <p className="text-sm text-[#718096]">Operating cost distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#718096' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value / 1000}k`} 
                    tick={{ fontSize: 12, fill: '#718096' }} 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill={OSOL_COLORS.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison */}
        <Card className="shadow-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
              <TrendingUp className="h-5 w-5 text-[#E6B800] mr-2" />
              Financial Performance Overview
            </CardTitle>
            <p className="text-sm text-[#718096]">Revenue vs Expenses comparison</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={[
                  { name: 'Total Revenue', value: totalRevenue, fill: OSOL_COLORS.success },
                  { name: 'Total Expenses', value: totalExpenses, fill: OSOL_COLORS.error },
                  { name: 'Net Income', value: calculatedNetIncome, fill: calculatedNetIncome >= 0 ? OSOL_COLORS.primary : OSOL_COLORS.error }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14, fill: '#718096' }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value / 1000}k`} 
                  tick={{ fontSize: 12, fill: '#718096' }} 
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Professional Footer */}
      <div className="bg-gradient-to-r from-[#E6B800] to-[#CC9900] text-white mt-12 print:mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={osoulLogo} 
                  alt="OSOL Logo" 
                  className="h-8 w-8 object-contain filter brightness-0 invert"
                />
                <h3 className="text-lg font-bold">OSOL Financial</h3>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                Leading provider of Sharia-compliant financial solutions and banking services in the Kingdom of Saudi Arabia.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-semibold mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm opacity-90">
                <p>📧 reports@osol.sa</p>
                <p>📞 +966 11 123 4567</p>
                <p>🌐 www.osol.sa</p>
                <p>📍 Riyadh, Saudi Arabia</p>
              </div>
            </div>

            {/* Report Information */}
            <div>
              <h4 className="font-semibold mb-3">Report Information</h4>
              <div className="space-y-2 text-sm opacity-90">
                <p>Report Type: Income Statement</p>
                <p>Generated: {generatedOn}</p>
                <p>Version: 2.0</p>
                <p>Confidential Document</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-6 pt-6 text-center">
            <p className="text-sm opacity-75">
              © {new Date().getFullYear()} OSOL Financial Services. All rights reserved. | This report is confidential and proprietary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementReport;