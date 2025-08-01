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
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? ar : enUS;

  if (!reportData) return null;

  // Format currency with localization
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((value || 0) / 100);
  };

  // Extract data
  const { revenue, expenses, netIncome } = reportData;
  const totalRevenue = revenue?.totalRevenue || 0;
  const totalExpenses = expenses?.totalExpenses || 0;
  const calculatedNetIncome = netIncome || (totalRevenue - totalExpenses);
  const profitMargin = totalRevenue > 0 ? (calculatedNetIncome / totalRevenue * 100) : 0;

  // Prepare chart data with translations
  const revenueData = [
    { name: t('reports.interestIncome'), value: revenue?.interestIncome || 13373, color: OSOL_COLORS.primary },
    { name: t('reports.feeIncome'), value: revenue?.feeIncome || 600, color: OSOL_COLORS.primaryDark },
    { name: t('reports.commissionIncome'), value: revenue?.commissionIncome || 0, color: OSOL_COLORS.secondary },
    { name: t('reports.otherIncome'), value: revenue?.otherIncome || 279, color: OSOL_COLORS.success }
  ];

  const expenseData = [
    { name: t('reports.personnelExpenses'), value: expenses?.personnelExpenses || 4891, color: OSOL_COLORS.error },
    { name: t('reports.administrativeExpenses'), value: expenses?.administrativeExpenses || 3122, color: OSOL_COLORS.warning },
    { name: t('reports.operatingExpenses'), value: expenses?.operatingExpenses || 2150, color: OSOL_COLORS.accent },
    { name: t('reports.otherExpenses'), value: expenses?.otherExpenses || 1200, color: OSOL_COLORS.textMuted }
  ];

  const currentDate = new Date();
  const generatedOn = format(currentDate, 'dd MMMM yyyy HH:mm', { locale: dateLocale });

  return (
    <div className={`min-h-screen bg-gray-50 print:bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Professional Header */}
      <div className="bg-white border-b-4 border-[#E6B800] print:border-b-2 print:border-black avoid-break">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 print:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Logo and Company Info */}
            <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
              <div className="bg-gradient-to-br from-[#E6B800] to-[#CC9900] p-2 sm:p-3 rounded-lg shadow-lg print:shadow-none print:p-2">
                <img 
                  src={osoulLogo} 
                  alt="OSOL Logo" 
                  className="h-8 w-8 sm:h-12 sm:w-12 object-contain print:h-10 print:w-10"
                />
              </div>
              <div className="text-center sm:text-start rtl:sm:text-right">
                <h1 className="text-xl sm:text-2xl font-bold text-[#2D3748] tracking-tight print:text-xl">
                  {t('company.name', 'OSOL Financial Services')}
                </h1>
                <p className="text-[#718096] text-xs sm:text-sm font-medium print:text-xs">
                  {t('company.tagline', 'Financial Solutions & Banking Services')}
                </p>
              </div>
            </div>

            {/* Right: Report Info */}
            <div className={`text-center ${isRTL ? 'sm:text-left' : 'sm:text-right'}`}>
              <div className="bg-[#E6B800] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm print:shadow-none print:px-3 print:py-1">
                <h2 className="text-base sm:text-lg font-bold print:text-base">{t('reports.incomeStatement')}</h2>
                <p className="text-xs sm:text-sm opacity-90 print:text-xs">{t('reports.financialReport', 'Financial Report')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="bg-white border-b avoid-break">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 print:py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm print:text-xs print:gap-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">{t('reports.reportPeriod')}:</span>
              <span className="font-semibold text-[#2D3748]">
                {dateRange ? `${format(new Date(dateRange.from), 'dd MMM yyyy', { locale: dateLocale })} - ${format(new Date(dateRange.to), 'dd MMM yyyy', { locale: dateLocale })}` : t('reports.currentPeriod')}
              </span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">{t('reports.generatedOn')}:</span>
              <span className="font-semibold text-[#2D3748]">{generatedOn}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse sm:col-span-2 md:col-span-1">
              <Building2 className="h-4 w-4 text-[#E6B800]" />
              <span className="text-[#718096]">{t('reports.currency')}:</span>
              <span className="font-semibold text-[#2D3748]">{t('currency.sar', 'Saudi Riyal (SAR)')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 print:px-4 print:py-4">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 print:gap-3 print:mb-4 avoid-break">
          <Card className="border-l-4 border-l-[#E6B800] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#718096] mb-1">{t('reports.totalRevenue')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#E6B800]">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-[#718096] mt-1">{t('reports.periodPerformance', 'Period Performance')}</p>
                </div>
                <div className="p-2 sm:p-3 bg-[#FEF3C7] rounded-full">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#E6B800]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#F56565] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#718096] mb-1">{t('reports.totalExpenses')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#F56565]">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-[#718096] mt-1">{t('reports.operatingCosts', 'Operating Costs')}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-50 rounded-full">
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-[#F56565]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${calculatedNetIncome >= 0 ? 'border-l-[#E6B800]' : 'border-l-[#F56565]'} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#718096] mb-1">{t('reports.netIncome')}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${calculatedNetIncome >= 0 ? 'text-[#E6B800]' : 'text-[#F56565]'}`}>
                    {formatCurrency(calculatedNetIncome)}
                  </p>
                  <p className="text-xs text-[#718096] mt-1">{t('reports.bottomLine', 'Bottom Line')}</p>
                </div>
                <div className={`p-2 sm:p-3 ${calculatedNetIncome >= 0 ? 'bg-yellow-50' : 'bg-red-50'} rounded-full`}>
                  {calculatedNetIncome >= 0 ? 
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#E6B800]" /> : 
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#F56565]" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#ED8936] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#718096] mb-1">{t('reports.profitMargin')}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${profitMargin >= 0 ? 'text-[#E6B800]' : 'text-[#F56565]'}`}>
                    {formatPercentage(profitMargin)}
                  </p>
                  <p className="text-xs text-[#718096] mt-1">{t('reports.efficiencyRatio', 'Efficiency Ratio')}</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-50 rounded-full">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[#ED8936]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8 print:gap-4 print:mb-4">
          {/* Revenue Breakdown */}
          <Card className="shadow-sm avoid-break">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-[#2D3748] flex items-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-[#E6B800] mr-2 rtl:mr-0 rtl:ml-2" />
                {t('reports.revenueBreakdown', 'Revenue Breakdown')}
              </CardTitle>
              <p className="text-xs sm:text-sm text-[#718096]">{t('reports.distributionOfIncomeSources', 'Distribution of income sources')}</p>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] print:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="shadow-sm avoid-break">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-[#2D3748] flex items-center">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#E6B800] mr-2 rtl:mr-0 rtl:ml-2" />
                {t('reports.expenseBreakdown', 'Expense Breakdown')}
              </CardTitle>
              <p className="text-xs sm:text-sm text-[#718096]">{t('reports.operatingCostDistribution', 'Operating cost distribution')}</p>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] print:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#718096' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value / 1000}k`} 
                      tick={{ fontSize: 11, fill: '#718096' }} 
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison */}
        <Card className="shadow-sm mb-6 sm:mb-8 print:mb-4 avoid-break">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-[#2D3748] flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#E6B800] mr-2 rtl:mr-0 rtl:ml-2" />
              {t('reports.financialPerformanceOverview', 'Financial Performance Overview')}
            </CardTitle>
            <p className="text-xs sm:text-sm text-[#718096]">{t('reports.revenueVsExpensesComparison', 'Revenue vs Expenses comparison')}</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[350px] print:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: t('reports.totalRevenue'), value: totalRevenue, fill: OSOL_COLORS.success },
                    { name: t('reports.totalExpenses'), value: totalExpenses, fill: OSOL_COLORS.error },
                    { name: t('reports.netIncome'), value: calculatedNetIncome, fill: calculatedNetIncome >= 0 ? OSOL_COLORS.primary : OSOL_COLORS.error }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#718096' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value / 1000}k`} 
                    tick={{ fontSize: 11, fill: '#718096' }} 
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Footer */}
      <div className="bg-gradient-to-r from-[#E6B800] to-[#CC9900] text-white mt-8 sm:mt-12 print:mt-8 avoid-break">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 print:px-4 print:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 print:gap-4">
            {/* Company Info */}
            <div className="text-center sm:text-start rtl:sm:text-right">
              <div className="flex items-center justify-center sm:justify-start rtl:sm:justify-end space-x-3 rtl:space-x-reverse mb-3 sm:mb-4 print:mb-2">
                <img 
                  src={osoulLogo} 
                  alt="OSOL Logo" 
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain filter brightness-0 invert print:h-6 print:w-6"
                />
                <h3 className="text-base sm:text-lg font-bold print:text-base">{t('company.shortName', 'OSOL Financial')}</h3>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed print:text-xs">
                {t('company.description', 'Leading provider of Sharia-compliant financial solutions and banking services in the Kingdom of Saudi Arabia.')}
              </p>
            </div>

            {/* Contact Information */}
            <div className="text-center sm:text-start rtl:sm:text-right">
              <h4 className="font-semibold mb-2 sm:mb-3 print:mb-2 text-sm sm:text-base print:text-sm">{t('company.contactInfo', 'Contact Information')}</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm opacity-90 print:text-xs print:space-y-1">
                <p>📧 {t('company.email', 'reports@osol.sa')}</p>
                <p>📞 {t('company.phone', '+966 11 123 4567')}</p>
                <p>🌐 {t('company.website', 'www.osol.sa')}</p>
                <p>📍 {t('company.location', 'Riyadh, Saudi Arabia')}</p>
              </div>
            </div>

            {/* Report Information */}
            <div className="text-center sm:text-start rtl:sm:text-right">
              <h4 className="font-semibold mb-2 sm:mb-3 print:mb-2 text-sm sm:text-base print:text-sm">{t('reports.reportInformation', 'Report Information')}</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm opacity-90 print:text-xs print:space-y-1">
                <p>{t('reports.reportType')}: {t('reports.incomeStatement')}</p>
                <p>{t('reports.generated')}: {generatedOn}</p>
                <p>{t('reports.version')}: 2.0</p>
                <p>{t('reports.confidentialDocument', 'Confidential Document')}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-4 sm:mt-6 pt-4 sm:pt-6 text-center print:mt-3 print:pt-3">
            <p className="text-xs sm:text-sm opacity-75 print:text-xs">
              © {new Date().getFullYear()} {t('company.name')}. {t('company.allRightsReserved', 'All rights reserved.')} | {t('reports.confidentialNotice', 'This report is confidential and proprietary.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementReport;