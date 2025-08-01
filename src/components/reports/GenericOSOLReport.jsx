import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Building2, 
  Calendar, Clock, FileText, Users, AlertTriangle, 
  Shield, Activity, BarChart3
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

// Report type configurations
const REPORT_CONFIGS = {
  cash_flow: {
    title: 'Cash Flow Statement',
    subtitle: 'Statement of Cash Flows',
    icon: TrendingUp,
    color: OSOL_COLORS.info
  },
  sama_monthly: {
    title: 'SAMA Monthly Report',
    subtitle: 'Regulatory Compliance Report',
    icon: Building2,
    color: OSOL_COLORS.warning
  },
  basel_iii: {
    title: 'Basel III Compliance',
    subtitle: 'Capital Adequacy Report',
    icon: Shield,
    color: OSOL_COLORS.secondary
  },
  aml_report: {
    title: 'AML/CFT Report',
    subtitle: 'Anti-Money Laundering Report',
    icon: AlertTriangle,
    color: OSOL_COLORS.error
  },
  liquidity_coverage: {
    title: 'Liquidity Coverage Ratio',
    subtitle: 'LCR Compliance Report',
    icon: Activity,
    color: OSOL_COLORS.info
  },
  capital_adequacy: {
    title: 'Capital Adequacy Report',
    subtitle: 'CAR Analysis',
    icon: BarChart3,
    color: OSOL_COLORS.success
  },
  default: {
    title: 'Financial Report',
    subtitle: 'Business Report',
    icon: FileText,
    color: OSOL_COLORS.primary
  }
};

const GenericOSOLReport = ({ reportData, reportType, dateRange }) => {
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

  // Get report configuration
  const config = REPORT_CONFIGS[reportType] || REPORT_CONFIGS.default;
  const IconComponent = config.icon;

  const currentDate = new Date();
  const generatedOn = format(currentDate, 'dd MMMM yyyy HH:mm');
  const reportPeriod = dateRange ? 
    `${format(new Date(dateRange.from), 'dd MMM yyyy')} - ${format(new Date(dateRange.to), 'dd MMM yyyy')}` : 
    'Current Period';

  // Render different content based on report type
  const renderReportContent = () => {
    switch (reportType) {
      case 'cash_flow':
        return renderCashFlowContent();
      case 'sama_monthly':
        return renderSAMAContent();
      case 'basel_iii':
        return renderBaselContent();
      case 'aml_report':
        return renderAMLContent();
      case 'liquidity_coverage':
      case 'capital_adequacy':
        return renderRegulatoryContent();
      default:
        return renderGenericContent();
    }
  };

  const renderCashFlowContent = () => {
    const { operatingActivities, investingActivities, financingActivities, netChangeInCash } = reportData;
    
    const cashFlowData = [
      { name: 'Operating Activities', value: operatingActivities?.netCashFromOperating || 2675000, color: OSOL_COLORS.success },
      { name: 'Investing Activities', value: investingActivities?.netCashFromInvesting || -325000, color: OSOL_COLORS.error },
      { name: 'Financing Activities', value: financingActivities?.netCashFromFinancing || 200000, color: OSOL_COLORS.warning }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cashFlowData.map((item, index) => (
            <Card key={index} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow`} style={{borderLeftColor: item.color}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#718096] mb-1">{item.name}</p>
                    <p className="text-2xl font-bold" style={{color: item.color}}>{formatCurrency(item.value)}</p>
                    <p className="text-xs text-[#718096] mt-1">Cash Flow</p>
                  </div>
                  <div className="p-3 rounded-full" style={{backgroundColor: `${item.color}20`}}>
                    {item.value >= 0 ? 
                      <TrendingUp className="h-6 w-6" style={{color: item.color}} /> : 
                      <TrendingDown className="h-6 w-6" style={{color: item.color}} />
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cash Flow Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center">
              <Activity className="h-5 w-5 text-[#E6B800] mr-2" />
              Cash Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#718096' }} />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fontSize: 12, fill: '#718096' }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSAMAContent = () => {
    const { capitalAdequacy, assetQuality, liquidity, earnings } = reportData;
    
    const ratiosData = [
      { name: 'Capital Adequacy Ratio', value: capitalAdequacy?.ratio || 16.8, target: 12.5, status: 'compliant' },
      { name: 'NPL Ratio', value: assetQuality?.nplRatio || 1.5, target: 5.0, status: 'compliant' },
      { name: 'Liquidity Coverage Ratio', value: liquidity?.lcr || 125.3, target: 100.0, status: 'compliant' },
      { name: 'Return on Assets', value: earnings?.roa || 2.1, target: 1.0, status: 'compliant' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ratiosData.map((ratio, index) => (
            <Card key={index} className="border-l-4 border-l-[#E6B800] shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-[#2D3748] mb-2">{ratio.name}</h4>
                <p className="text-2xl font-bold text-[#E6B800]">{ratio.value}%</p>
                <p className="text-xs text-[#718096] mt-1">Target: {ratio.target}%</p>
                <div className="flex items-center mt-2">
                  <div className={`h-2 w-2 rounded-full mr-2 ${ratio.status === 'compliant' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs ${ratio.status === 'compliant' ? 'text-green-600' : 'text-red-600'}`}>
                    {ratio.status === 'compliant' ? 'Compliant' : 'Non-Compliant'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderBaselContent = () => {
    const { capitalRatios, riskWeightedAssets, leverageRatio, buffers } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-[#48BB78] shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-[#2D3748] mb-2">CET1 Ratio</h4>
              <p className="text-2xl font-bold text-[#48BB78]">{capitalRatios?.cet1 || 14.2}%</p>
              <p className="text-xs text-[#718096] mt-1">Common Equity Tier 1</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[#4299E1] shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-[#2D3748] mb-2">Tier 1 Ratio</h4>
              <p className="text-2xl font-bold text-[#4299E1]">{capitalRatios?.tier1 || 15.8}%</p>
              <p className="text-xs text-[#718096] mt-1">Tier 1 Capital</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[#E6B800] shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-[#2D3748] mb-2">Total Capital</h4>
              <p className="text-2xl font-bold text-[#E6B800]">{capitalRatios?.totalCapital || 16.8}%</p>
              <p className="text-xs text-[#718096] mt-1">Total Capital Ratio</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderAMLContent = () => {
    const { transactions, customers } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#2D3748]">Transaction Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Transactions</span>
                  <span className="font-semibold">{(transactions?.total || 12845).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged</span>
                  <span className="font-semibold text-orange-600">{transactions?.flagged || 23}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investigated</span>
                  <span className="font-semibold text-blue-600">{transactions?.investigated || 18}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reported (STRs)</span>
                  <span className="font-semibold text-red-600">{transactions?.reported || 2}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#2D3748]">Customer Risk Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Customers</span>
                  <span className="font-semibold">{(customers?.total || 1250).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>High Risk</span>
                  <span className="font-semibold text-red-600">{customers?.highRisk || 45}</span>
                </div>
                <div className="flex justify-between">
                  <span>PEPs</span>
                  <span className="font-semibold text-orange-600">{customers?.peps || 8}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sanctioned</span>
                  <span className="font-semibold text-red-600">{customers?.sanctioned || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderRegulatoryContent = () => {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#2D3748] mb-4">{config.title}</h3>
              <p className="text-[#718096] mb-4">Regulatory compliance metrics and analysis</p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-[#718096]">
                  This report contains regulatory compliance data and metrics as required by financial authorities.
                  Detailed analysis and compliance status are available in the PDF version.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGenericContent = () => {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <IconComponent className="h-12 w-12 text-[#E6B800] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">{config.title}</h3>
              <p className="text-[#718096] mb-4">Report data and analysis</p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <pre className="text-left text-sm text-[#718096] overflow-auto">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
                <h2 className="text-lg font-bold">{config.title}</h2>
                <p className="text-sm opacity-90">{config.subtitle}</p>
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
              <span className="font-semibold text-[#2D3748]">{reportPeriod}</span>
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
        {renderReportContent()}
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
                <p>Report Type: {config.title}</p>
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

export default GenericOSOLReport;