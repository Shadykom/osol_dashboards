import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Building2, 
  Calendar, Clock, Landmark, PiggyBank, CreditCard
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
  success: '#48BB78',     // Green
  warning: '#ED8936',     // Orange
  error: '#F56565',       // Red
  info: '#4299E1',        // Blue
  text: '#2D3748',
  textMuted: '#718096'
};

const BalanceSheetReport = ({ reportData, reportType, dateRange }) => {
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
    return `${(value || 0).toFixed(1)}%`;
  };

  // Extract data
  const { assets, liabilities, equity } = reportData;
  const totalAssets = assets?.totalAssets || 4885000;
  const totalLiabilities = liabilities?.totalLiabilities || 4285000;
  const totalEquity = equity?.totalEquity || 600000;

  // Prepare chart data
  const assetData = [
    { name: 'Cash & Cash Equivalents', value: assets?.cash || 850000, color: OSOL_COLORS.primary },
    { name: 'Loans & Advances', value: assets?.loans || 2335000, color: OSOL_COLORS.success },
    { name: 'Investments', value: assets?.investments || 1200000, color: OSOL_COLORS.info },
    { name: 'Fixed Assets', value: assets?.fixedAssets || 500000, color: OSOL_COLORS.warning }
  ];

  const liabilityData = [
    { name: 'Customer Deposits', value: liabilities?.deposits || 3200000, color: OSOL_COLORS.error },
    { name: 'Borrowings', value: liabilities?.borrowings || 800000, color: OSOL_COLORS.primaryDark },
    { name: 'Other Liabilities', value: liabilities?.otherLiabilities || 285000, color: OSOL_COLORS.secondary }
  ];

  const balanceData = [
    { name: 'Total Assets', value: totalAssets, fill: OSOL_COLORS.success },
    { name: 'Total Liabilities', value: totalLiabilities, fill: OSOL_COLORS.error },
    { name: 'Total Equity', value: totalEquity, fill: OSOL_COLORS.primary }
  ];

  const currentDate = new Date();
  const generatedOn = format(currentDate, 'dd MMMM yyyy HH:mm');
  const asOfDate = dateRange?.to ? format(new Date(dateRange.to), 'dd MMMM yyyy') : format(currentDate, 'dd MMMM yyyy');

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
                <h2 className="text-lg font-bold">Balance Sheet</h2>
                <p className="text-sm opacity-90">Statement of Financial Position</p>
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
              <span className="text-[#718096]">As of Date:</span>
              <span className="font-semibold text-[#2D3748]">{asOfDate}</span>
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
        {/* Financial Position Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#48BB78] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Total Assets</p>
                  <p className="text-2xl font-bold text-[#48BB78]">{formatCurrency(totalAssets)}</p>
                  <p className="text-xs text-[#718096] mt-1">Financial Resources</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Landmark className="h-6 w-6 text-[#48BB78]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#F56565] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Total Liabilities</p>
                  <p className="text-2xl font-bold text-[#F56565]">{formatCurrency(totalLiabilities)}</p>
                  <p className="text-xs text-[#718096] mt-1">Financial Obligations</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <CreditCard className="h-6 w-6 text-[#F56565]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#E6B800] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#718096] mb-1">Shareholders' Equity</p>
                  <p className="text-2xl font-bold text-[#E6B800]">{formatCurrency(totalEquity)}</p>
                  <p className="text-xs text-[#718096] mt-1">Owners' Interest</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <PiggyBank className="h-6 w-6 text-[#E6B800]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Composition Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Assets Breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
                <Landmark className="h-5 w-5 text-[#E6B800] mr-2" />
                Assets Composition
              </CardTitle>
              <p className="text-sm text-[#718096]">Distribution of financial resources</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Liabilities Breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
                <CreditCard className="h-5 w-5 text-[#E6B800] mr-2" />
                Liabilities Composition
              </CardTitle>
              <p className="text-sm text-[#718096]">Distribution of financial obligations</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={liabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#718096' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value / 1000000}M`} 
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
                  <Bar dataKey="value" fill={OSOL_COLORS.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Balance Overview */}
        <Card className="shadow-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
              <TrendingUp className="h-5 w-5 text-[#E6B800] mr-2" />
              Financial Position Overview
            </CardTitle>
            <p className="text-sm text-[#718096]">Assets, Liabilities, and Equity comparison</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={balanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14, fill: '#718096' }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value / 1000000}M`} 
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

        {/* Financial Ratios */}
        <Card className="shadow-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#2D3748]">Key Financial Ratios</CardTitle>
            <p className="text-sm text-[#718096]">Balance sheet analysis and financial health indicators</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-[#2D3748] mb-2">Equity Ratio</h4>
                <p className="text-2xl font-bold text-[#E6B800]">
                  {formatPercentage((totalEquity / totalAssets) * 100)}
                </p>
                <p className="text-xs text-[#718096] mt-1">Equity / Total Assets</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-[#2D3748] mb-2">Debt Ratio</h4>
                <p className="text-2xl font-bold text-[#F56565]">
                  {formatPercentage((totalLiabilities / totalAssets) * 100)}
                </p>
                <p className="text-xs text-[#718096] mt-1">Liabilities / Total Assets</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-[#2D3748] mb-2">Asset Efficiency</h4>
                <p className="text-2xl font-bold text-[#48BB78]">
                  {formatPercentage(((assets?.loans || 2335000) / totalAssets) * 100)}
                </p>
                <p className="text-xs text-[#718096] mt-1">Loans / Total Assets</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-[#2D3748] mb-2">Liquidity Ratio</h4>
                <p className="text-2xl font-bold text-[#4299E1]">
                  {formatPercentage(((assets?.cash || 850000) / totalAssets) * 100)}
                </p>
                <p className="text-xs text-[#718096] mt-1">Cash / Total Assets</p>
              </div>
            </div>
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
                <p>Report Type: Balance Sheet</p>
                <p>Generated: {generatedOn}</p>
                <p>As of: {asOfDate}</p>
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

export default BalanceSheetReport;