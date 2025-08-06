import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Download, Calendar, Filter, TrendingUp, Users, DollarSign,
  BarChart3, PieChart, FileSpreadsheet, FileDown, Printer, Mail,
  Clock, CheckCircle, AlertCircle, Building2, CreditCard, ArrowUpDown,
  Send, Loader2, RefreshCw, Settings, Eye, X, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==================== REPORT CATEGORIES ====================
const REPORT_CATEGORIES = {
  financial: {
    title: 'Financial Reports',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    reports: [
      { id: 'income_statement', name: 'Income Statement', frequency: 'Monthly', description: 'Revenue and expense analysis' },
      { id: 'balance_sheet', name: 'Balance Sheet', frequency: 'Quarterly', description: 'Assets and liabilities overview' },
      { id: 'cash_flow', name: 'Cash Flow Statement', frequency: 'Monthly', description: 'Cash inflows and outflows' },
      { id: 'profit_loss', name: 'Profit & Loss', frequency: 'Monthly', description: 'Profitability analysis' },
      { id: 'budget_variance', name: 'Budget Variance Analysis', frequency: 'Monthly', description: 'Budget vs actual comparison' }
    ]
  },
  regulatory: {
    title: 'Regulatory Reports',
    icon: Building2,
    color: 'text-[#E6B800]',
    bgColor: 'bg-yellow-50',
    reports: [
      { id: 'sama_monthly', name: 'SAMA Monthly Report', frequency: 'Monthly', description: 'Saudi Central Bank compliance' },
      { id: 'basel_iii', name: 'Basel III Compliance', frequency: 'Quarterly', description: 'Capital adequacy requirements' },
      { id: 'aml_report', name: 'AML/CFT Report', frequency: 'Monthly', description: 'Anti-money laundering compliance' },
      { id: 'liquidity_coverage', name: 'Liquidity Coverage Ratio', frequency: 'Daily', description: 'Liquidity risk metrics' },
      { id: 'capital_adequacy', name: 'Capital Adequacy Report', frequency: 'Quarterly', description: 'Capital requirements analysis' }
    ]
  },
  customer: {
    title: 'Customer Reports',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    reports: [
      { id: 'customer_acquisition', name: 'Customer Acquisition', frequency: 'Weekly', description: 'New customer analysis' },
      { id: 'customer_segmentation', name: 'Customer Segmentation', frequency: 'Monthly', description: 'Customer demographics' },
      { id: 'customer_satisfaction', name: 'Customer Satisfaction', frequency: 'Quarterly', description: 'NPS and satisfaction metrics' },
      { id: 'dormant_accounts', name: 'Dormant Accounts', frequency: 'Monthly', description: 'Inactive account analysis' },
      { id: 'kyc_compliance', name: 'KYC Compliance Status', frequency: 'Weekly', description: 'Know your customer compliance' }
    ]
  },
  risk: {
    title: 'Risk Reports',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    reports: [
      { id: 'credit_risk', name: 'Credit Risk Assessment', frequency: 'Daily', description: 'Credit exposure analysis' },
      { id: 'operational_risk', name: 'Operational Risk', frequency: 'Monthly', description: 'Operational risk metrics' },
      { id: 'market_risk', name: 'Market Risk Analysis', frequency: 'Daily', description: 'Market exposure assessment' },
      { id: 'liquidity_risk', name: 'Liquidity Risk Report', frequency: 'Weekly', description: 'Liquidity position analysis' },
      { id: 'npl_analysis', name: 'NPL Analysis', frequency: 'Weekly', description: 'Non-performing loans analysis' }
    ]
  }
};

// ==================== MOCK DATA GENERATOR ====================
class MockDataGenerator {
  static generateFinancialReport(reportType) {
    const baseRevenue = 3500000;
    const baseExpenses = 2250000;
    
    return {
      period: {
        startDate: startOfMonth(new Date()).toISOString(),
        endDate: endOfMonth(new Date()).toISOString()
      },
      revenue: {
        interestIncome: Math.round(baseRevenue * 0.7),
        feeIncome: Math.round(baseRevenue * 0.15),
        commissionIncome: Math.round(baseRevenue * 0.1),
        otherIncome: Math.round(baseRevenue * 0.05),
        totalRevenue: baseRevenue
      },
      expenses: {
        personnelExpenses: Math.round(baseExpenses * 0.5),
        administrativeExpenses: Math.round(baseExpenses * 0.2),
        technologyExpenses: Math.round(baseExpenses * 0.15),
        marketingExpenses: Math.round(baseExpenses * 0.1),
        otherExpenses: Math.round(baseExpenses * 0.05),
        totalExpenses: baseExpenses
      },
      summary: {
        operatingIncome: baseRevenue - baseExpenses,
        netIncomeBeforeTax: baseRevenue - baseExpenses,
        taxExpense: Math.round((baseRevenue - baseExpenses) * 0.2),
        netIncome: Math.round((baseRevenue - baseExpenses) * 0.8)
      },
      metrics: {
        operatingMargin: ((baseRevenue - baseExpenses) / baseRevenue * 100).toFixed(2),
        netMargin: (((baseRevenue - baseExpenses) * 0.8) / baseRevenue * 100).toFixed(2),
        revenueGrowth: (Math.random() * 10).toFixed(2),
        expenseRatio: (baseExpenses / baseRevenue * 100).toFixed(2)
      },
      monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
        month: format(subMonths(new Date(), 5 - i), 'MMM'),
        revenue: baseRevenue + (Math.random() - 0.5) * 500000,
        expenses: baseExpenses + (Math.random() - 0.5) * 300000,
        profit: (baseRevenue - baseExpenses) + (Math.random() - 0.5) * 200000
      }))
    };
  }

  static generateRegulatoryReport(reportType) {
    return {
      reportPeriod: {
        startDate: startOfMonth(new Date()).toISOString(),
        endDate: endOfMonth(new Date()).toISOString()
      },
      summary: {
        totalDeposits: 50000000,
        totalLoans: 35000000,
        totalAssets: 85000000,
        newAccounts: 250,
        newLoans: 180,
        totalTransactions: 45000
      },
      liquidityMetrics: {
        liquidAssets: 12750000,
        liquidityRatio: '15.0%',
        quickRatio: '25.5%',
        lcrRatio: '125%',
        nsfrRatio: '112%'
      },
      capitalMetrics: {
        tier1Capital: 6800000,
        tier2Capital: 3400000,
        totalCapital: 10200000,
        capitalAdequacyRatio: '15.2%',
        leverageRatio: '8.5%'
      },
      compliance: {
        amlScreenings: 300,
        suspiciousTransactions: 2,
        ctrsFiledDelta: 5,
        sarsFiledDelta: 1,
        complianceScore: '98%'
      },
      trendsData: Array.from({ length: 6 }, (_, i) => ({
        month: format(subMonths(new Date(), 5 - i), 'MMM'),
        deposits: 50000000 + (Math.random() - 0.5) * 5000000,
        loans: 35000000 + (Math.random() - 0.5) * 3000000,
        car: 15.2 + (Math.random() - 0.5) * 1
      }))
    };
  }

  static generateCustomerReport(reportType) {
    return {
      period: {
        startDate: startOfMonth(new Date()).toISOString(),
        endDate: endOfMonth(new Date()).toISOString()
      },
      overview: {
        totalNewCustomers: 450,
        verifiedCustomers: 380,
        pendingKYC: 70,
        conversionRate: '75%',
        totalAccountsOpened: 520,
        averageAccountsPerCustomer: '1.16',
        totalInitialDeposits: 12500000
      },
      segmentation: [
        { segment: 'Retail', count: 320, percentage: 71 },
        { segment: 'Premium', count: 95, percentage: 21 },
        { segment: 'Corporate', count: 35, percentage: 8 }
      ],
      satisfaction: {
        npsScore: 45,
        csat: '4.2/5',
        responseRate: '65%',
        topComplaints: [
          { issue: 'Long wait times', count: 145 },
          { issue: 'App performance', count: 98 },
          { issue: 'Fee structure', count: 87 }
        ]
      },
      acquisitionTrend: Array.from({ length: 6 }, (_, i) => ({
        month: format(subMonths(new Date(), 5 - i), 'MMM'),
        newCustomers: 400 + Math.floor(Math.random() * 100),
        activeCustomers: 8000 + Math.floor(Math.random() * 500),
        churnedCustomers: 50 + Math.floor(Math.random() * 30)
      }))
    };
  }

  static generateRiskReport(reportType) {
    return {
      period: {
        startDate: startOfMonth(new Date()).toISOString(),
        endDate: endOfMonth(new Date()).toISOString()
      },
      overview: {
        totalLoans: 1250,
        totalExposure: 35000000,
        nplAmount: 1750000,
        nplRatio: '5.0%',
        provisionCoverage: '85.0%',
        totalProvisions: 1487500
      },
      riskDistribution: [
        { category: 'Low Risk', value: 60, count: 750, color: '#10B981' },
        { category: 'Medium Risk', value: 30, count: 375, color: '#F59E0B' },
        { category: 'High Risk', value: 10, count: 125, color: '#EF4444' }
      ],
      portfolioQuality: {
        performing: 1180,
        closed: 25,
        npa: 35,
        restructured: 8,
        writtenOff: 2
      },
      creditMetrics: {
        expectedLoss: 875000,
        unexpectedLoss: 350000,
        economicCapital: 2100000,
        raroc: '18.5%'
      },
      nplTrend: Array.from({ length: 6 }, (_, i) => ({
        month: format(subMonths(new Date(), 5 - i), 'MMM'),
        nplRatio: 5 + (Math.random() - 0.5) * 2,
        recoveryRate: 30 + (Math.random() - 0.5) * 10
      }))
    };
  }
}

// ==================== REPORT VISUALIZATION COMPONENT ====================
const ReportVisualization = ({ reportData, reportType, category }) => {
  if (!reportData) return null;

  const renderFinancialCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {reportData.monthlyTrend && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `SAR ${(value/1000000).toFixed(2)}M`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={[
                  { name: 'Interest Income', value: reportData.revenue?.interestIncome || 0 },
                  { name: 'Fee Income', value: reportData.revenue?.feeIncome || 0 },
                  { name: 'Commission', value: reportData.revenue?.commissionIncome || 0 },
                  { name: 'Other', value: reportData.revenue?.otherIncome || 0 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#10B981" />
                <Cell fill="#3B82F6" />
                <Cell fill="#F59E0B" />
                <Cell fill="#8B5CF6" />
              </Pie>
              <Tooltip formatter={(value) => `SAR ${(value/1000).toFixed(0)}K`} />
            </RePieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderRiskCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {reportData.riskDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={reportData.riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ category, value }) => `${category}: ${value}%`}
                >
                  {reportData.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {reportData.nplTrend && (
        <Card>
          <CardHeader>
            <CardTitle>NPL & Recovery Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.nplTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nplRatio" stroke="#EF4444" strokeWidth={2} name="NPL Ratio %" />
                <Line type="monotone" dataKey="recoveryRate" stroke="#10B981" strokeWidth={2} name="Recovery Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCustomerCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {reportData.segmentation && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.segmentation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {reportData.acquisitionTrend && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.acquisitionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newCustomers" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="churnedCustomers" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRegulatoryCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {reportData.trendsData && (
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="deposits" stroke="#10B981" strokeWidth={2} name="Deposits" />
                <Line yAxisId="left" type="monotone" dataKey="loans" stroke="#3B82F6" strokeWidth={2} name="Loans" />
                <Line yAxisId="right" type="monotone" dataKey="car" stroke="#F59E0B" strokeWidth={2} name="CAR %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Capital Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={[
                  { name: 'Tier 1 Capital', value: reportData.capitalMetrics?.tier1Capital || 0 },
                  { name: 'Tier 2 Capital', value: reportData.capitalMetrics?.tier2Capital || 0 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#10B981" />
                <Cell fill="#F59E0B" />
              </Pie>
              <Tooltip formatter={(value) => `SAR ${(value/1000000).toFixed(2)}M`} />
            </RePieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Render charts based on category
  switch (category) {
    case 'financial':
      return renderFinancialCharts();
    case 'risk':
      return renderRiskCharts();
    case 'customer':
      return renderCustomerCharts();
    case 'regulatory':
      return renderRegulatoryCharts();
    default:
      return null;
  }
};

// ==================== MAIN REPORTS COMPONENT ====================
export default function Reports() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('financial');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    cc: '',
    bcc: '',
    message: '',
    includeExcel: true,
    includePDF: true
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'daily',
    time: '08:00',
    dayOfWeek: '1',
    dayOfMonth: '1',
    recipients: '',
    enabled: true
  });

  // Filters
  const [filters, setFilters] = useState({
    branch: 'all',
    product: 'all',
    segment: 'all'
  });

  // Scheduled reports (stored in state for demo)
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      reportName: 'Daily Credit Risk Report',
      reportType: 'credit_risk',
      frequency: 'Daily',
      recipients: ['risk@bank.com', 'cro@bank.com'],
      lastRun: '2024-01-29 08:00',
      nextRun: '2024-01-30 08:00',
      status: 'active'
    },
    {
      id: 2,
      reportName: 'Monthly Income Statement',
      reportType: 'income_statement',
      frequency: 'Monthly',
      recipients: ['cfo@bank.com', 'finance@bank.com'],
      lastRun: '2024-01-01 09:00',
      nextRun: '2024-02-01 09:00',
      status: 'active'
    }
  ]);

  // Report history (stored in state for demo)
  const [reportHistory, setReportHistory] = useState([
    {
      id: 1,
      reportName: 'Income Statement - December 2023',
      reportType: 'income_statement',
      generatedAt: '2024-01-05 10:30',
      generatedBy: 'John Doe',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 2,
      reportName: 'Credit Risk Assessment - Q4 2023',
      reportType: 'credit_risk',
      generatedAt: '2024-01-03 14:15',
      generatedBy: 'Jane Smith',
      size: '5.1 MB',
      status: 'completed'
    }
  ]);

  // Generate report
  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock data based on category and report type
      let data;
      const category = Object.keys(REPORT_CATEGORIES).find(key => 
        REPORT_CATEGORIES[key].reports.some(r => r.id === selectedReport)
      );

      switch (category) {
        case 'financial':
          data = MockDataGenerator.generateFinancialReport(selectedReport);
          break;
        case 'regulatory':
          data = MockDataGenerator.generateRegulatoryReport(selectedReport);
          break;
        case 'customer':
          data = MockDataGenerator.generateCustomerReport(selectedReport);
          break;
        case 'risk':
          data = MockDataGenerator.generateRiskReport(selectedReport);
          break;
        default:
          data = {};
      }

      setReportData(data);
      setGeneratedReport({
        data,
        reportType: selectedReport,
        category,
        generatedAt: new Date()
      });

      // Add to history
      const reportInfo = REPORT_CATEGORIES[category].reports.find(r => r.id === selectedReport);
      const newHistoryItem = {
        id: Date.now(),
        reportName: `${reportInfo.name} - ${format(new Date(), 'MMMM yyyy')}`,
        reportType: selectedReport,
        generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        generatedBy: 'Current User',
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        status: 'completed'
      };
      setReportHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);

      toast.success('Report generated successfully');
      setActiveTab('preview');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download report
  const handleDownload = (format) => {
    if (!generatedReport) {
      toast.error('Please generate a report first');
      return;
    }

    // Create a blob with report data
    const dataStr = JSON.stringify(generatedReport.data, null, 2);
    const blob = new Blob([dataStr], { type: format === 'pdf' ? 'application/pdf' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const reportName = REPORT_CATEGORIES[generatedReport.category].reports
      .find(r => r.id === generatedReport.reportType)?.name || 'Report';
    
    a.download = `${reportName}_${format(new Date(), 'yyyyMMdd')}.${format === 'pdf' ? 'pdf' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${format.toUpperCase()} downloaded successfully`);
  };

  // Send email
  const handleSendEmail = async () => {
    if (!generatedReport) {
      toast.error('Please generate a report first');
      return;
    }

    if (!emailForm.recipients) {
      toast.error('Please enter recipients');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Sending email to:', emailForm.recipients);
      console.log('Report data:', generatedReport);
      
      toast.success('Report sent successfully');
      setEmailDialogOpen(false);
      setEmailForm({
        recipients: '',
        cc: '',
        bcc: '',
        message: '',
        includeExcel: true,
        includePDF: true
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsGenerating(false);
    }
  };

  // Schedule report
  const handleScheduleReport = () => {
    if (!selectedReport) {
      toast.error('Please select a report');
      return;
    }

    if (!scheduleForm.recipients) {
      toast.error('Please enter recipients');
      return;
    }

    const reportInfo = Object.values(REPORT_CATEGORIES)
      .flatMap(cat => cat.reports)
      .find(r => r.id === selectedReport);

    const newSchedule = {
      id: Date.now(),
      reportName: reportInfo.name,
      reportType: selectedReport,
      frequency: scheduleForm.frequency.charAt(0).toUpperCase() + scheduleForm.frequency.slice(1),
      recipients: scheduleForm.recipients.split(',').map(email => email.trim()),
      lastRun: null,
      nextRun: format(new Date(), 'yyyy-MM-dd HH:mm'),
      status: scheduleForm.enabled ? 'active' : 'paused'
    };

    setScheduledReports(prev => [newSchedule, ...prev]);
    toast.success('Report scheduled successfully');
    setScheduleDialogOpen(false);
  };

  // Print report
  const handlePrint = () => {
    if (!generatedReport) {
      toast.error('Please generate a report first');
      return;
    }
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports Center</h1>
          <p className="text-muted-foreground mt-1">Generate, schedule, and manage all your reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
            <Clock className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('scheduled')}>
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedReport}>Preview</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Categories */}
            <div className="lg:col-span-2 space-y-4">
              {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
                <Card key={key} className={selectedCategory === key ? 'ring-2 ring-primary' : ''}>
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.bgColor}`}>
                          <category.icon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <div>
                          <CardTitle>{category.title}</CardTitle>
                          <CardDescription>{category.reports.length} reports available</CardDescription>
                        </div>
                      </div>
                      <Badge variant={selectedCategory === key ? 'default' : 'outline'}>
                        {selectedCategory === key ? 'Selected' : 'Select'}
                      </Badge>
                    </div>
                  </CardHeader>
                  {selectedCategory === key && (
                    <CardContent>
                      <div className="space-y-2">
                        {category.reports.map((report) => (
                          <div
                            key={report.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedReport === report.id 
                                ? 'bg-primary/10 border-primary' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedReport(report.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{report.name}</h4>
                                <p className="text-sm text-muted-foreground">{report.description}</p>
                              </div>
                              <Badge variant="secondary">{report.frequency}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Report Configuration */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Configure report parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="date" 
                        value={format(dateRange.from, 'yyyy-MM-dd')}
                        onChange={(e) => setDateRange({...dateRange, from: new Date(e.target.value)})}
                      />
                      <Input 
                        type="date" 
                        value={format(dateRange.to, 'yyyy-MM-dd')}
                        onChange={(e) => setDateRange({...dateRange, to: new Date(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select value={filters.branch} onValueChange={(value) => setFilters({...filters, branch: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="main">Main Branch</SelectItem>
                        <SelectItem value="north">North Branch</SelectItem>
                        <SelectItem value="south">South Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={filters.product} onValueChange={(value) => setFilters({...filters, product: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="loan">Loans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Segment</Label>
                    <Select value={filters.segment} onValueChange={(value) => setFilters({...filters, segment: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Segments</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="sme">SME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateReport}
                      disabled={!selectedReport || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setScheduleDialogOpen(true)}
                        disabled={!selectedReport}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setEmailDialogOpen(true)}
                        disabled={!generatedReport}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {generatedReport && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => handleDownload('pdf')}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => handleDownload('excel')}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {generatedReport ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {REPORT_CATEGORIES[generatedReport.category].reports
                          .find(r => r.id === generatedReport.reportType)?.name || 'Report'}
                      </CardTitle>
                      <CardDescription>
                        Generated on {format(generatedReport.generatedAt, 'dd MMMM yyyy HH:mm')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleDownload('pdf')}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload('excel')}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEmailDialogOpen(true)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Report Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {reportData.overview && Object.entries(reportData.overview).slice(0, 4).map(([key, value]) => (
                      <Card key={key}>
                        <CardHeader className="pb-2">
                          <CardDescription>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {typeof value === 'number' 
                              ? value > 1000000 
                                ? `${(value/1000000).toFixed(1)}M` 
                                : value > 1000 
                                  ? `${(value/1000).toFixed(1)}K`
                                  : value
                              : value}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Report Visualizations */}
                  <ReportVisualization 
                    reportData={reportData} 
                    reportType={generatedReport.reportType}
                    category={generatedReport.category}
                  />

                  {/* Detailed Data Tables */}
                  {reportData.revenue && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Revenue Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            {Object.entries(reportData.revenue).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </TableCell>
                                <TableCell className="text-right">
                                  SAR {typeof value === 'number' ? value.toLocaleString() : value}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {reportData.expenses && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Expenses Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            {Object.entries(reportData.expenses).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </TableCell>
                                <TableCell className="text-right">
                                  SAR {typeof value === 'number' ? value.toLocaleString() : value}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
                <p className="text-gray-500 mb-4">Generate a report first to see the preview here.</p>
                <Button onClick={() => setActiveTab('generate')}>
                  Go to Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Reports</CardTitle>
                <Button size="sm" onClick={() => setScheduleDialogOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReports.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.reportName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.frequency}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {schedule.recipients.slice(0, 2).join(', ')}
                          {schedule.recipients.length > 2 && ` +${schedule.recipients.length - 2} more`}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{schedule.nextRun}</TableCell>
                      <TableCell>
                        <Badge variant={schedule.status === 'active' ? 'success' : 'secondary'}>
                          {schedule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setScheduledReports(prev => prev.filter(s => s.id !== schedule.id));
                            toast.success('Schedule removed');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report History</CardTitle>
                <Button size="sm" variant="outline" onClick={() => toast.success('History refreshed')}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportHistory.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.reportName}</TableCell>
                      <TableCell className="text-sm">{report.generatedAt}</TableCell>
                      <TableCell>{report.generatedBy}</TableCell>
                      <TableCell className="text-sm">{report.size}</TableCell>
                      <TableCell>
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => toast.success('Downloading report...')}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEmailDialogOpen(true)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Send Report via Email</DialogTitle>
            <DialogDescription>
              Send this report to specified recipients
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipients">Recipients (comma separated)</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a custom message..."
                value={emailForm.message}
                onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePDF"
                    checked={emailForm.includePDF}
                    onCheckedChange={(checked) => setEmailForm({...emailForm, includePDF: checked})}
                  />
                  <label htmlFor="includePDF" className="text-sm">Include PDF version</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeExcel"
                    checked={emailForm.includeExcel}
                    onCheckedChange={(checked) => setEmailForm({...emailForm, includeExcel: checked})}
                  />
                  <label htmlFor="includeExcel" className="text-sm">Include Excel version</label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Set up automated report generation and delivery
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={scheduleForm.frequency} onValueChange={(value) => setScheduleForm({...scheduleForm, frequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="scheduleRecipients">Recipients (comma separated)</Label>
              <Input
                id="scheduleRecipients"
                placeholder="email1@example.com, email2@example.com"
                value={scheduleForm.recipients}
                onChange={(e) => setScheduleForm({...scheduleForm, recipients: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={scheduleForm.enabled}
                onCheckedChange={(checked) => setScheduleForm({...scheduleForm, enabled: checked})}
              />
              <Label htmlFor="enabled">Enable schedule immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReport}>
              <Calendar className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}