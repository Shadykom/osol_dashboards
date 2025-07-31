import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileDown,
  Printer,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  CreditCard,
  ArrowUpDown,
  Send,
  Loader2,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import comprehensiveReportService from '@/services/comprehensiveReportService';
import reportGenerator from '@/utils/reportGenerator';
import emailService from '@/services/emailService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import VisualReportView from '@/components/reports/VisualReportView';

const REPORT_CATEGORIES = {
  financial: {
    title: 'Financial Reports',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    reports: [
      { id: 'income_statement', name: 'Income Statement', frequency: 'Monthly', description: 'Revenue, expenses, and profitability analysis' },
      { id: 'balance_sheet', name: 'Balance Sheet', frequency: 'Quarterly', description: 'Assets, liabilities, and equity position' },
      { id: 'cash_flow', name: 'Cash Flow Statement', frequency: 'Monthly', description: 'Cash inflows and outflows analysis' },
      { id: 'profit_loss', name: 'Profit & Loss', frequency: 'Monthly', description: 'Detailed profit and loss breakdown' },
      { id: 'budget_variance', name: 'Budget Variance Analysis', frequency: 'Monthly', description: 'Actual vs budget comparison' }
    ]
  },
  regulatory: {
    title: 'Regulatory Reports',
    icon: Building2,
            color: 'text-[#E6B800]',
        bgColor: 'bg-yellow-50',
    reports: [
      { id: 'sama_monthly', name: 'SAMA Monthly Report', frequency: 'Monthly', description: 'Saudi Central Bank compliance report' },
      { id: 'basel_iii', name: 'Basel III Compliance', frequency: 'Quarterly', description: 'Capital adequacy and risk metrics' },
      { id: 'aml_report', name: 'AML/CFT Report', frequency: 'Monthly', description: 'Anti-money laundering compliance' },
      { id: 'liquidity_coverage', name: 'Liquidity Coverage Ratio', frequency: 'Daily', description: 'LCR compliance monitoring' },
      { id: 'capital_adequacy', name: 'Capital Adequacy Report', frequency: 'Quarterly', description: 'CAR calculation and analysis' }
    ]
  },
  customer: {
    title: 'Customer Reports',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    reports: [
      { id: 'customer_acquisition', name: 'Customer Acquisition', frequency: 'Weekly', description: 'New customer trends and analysis' },
      { id: 'customer_segmentation', name: 'Customer Segmentation', frequency: 'Monthly', description: 'Customer base breakdown by segments' },
      { id: 'customer_satisfaction', name: 'Customer Satisfaction', frequency: 'Quarterly', description: 'NPS and satisfaction metrics' },
      { id: 'dormant_accounts', name: 'Dormant Accounts', frequency: 'Monthly', description: 'Inactive account identification' },
      { id: 'kyc_compliance', name: 'KYC Compliance Status', frequency: 'Weekly', description: 'Know Your Customer compliance tracking' }
    ]
  },
  risk: {
    title: 'Risk Reports',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    reports: [
      { id: 'credit_risk', name: 'Credit Risk Assessment', frequency: 'Daily', description: 'Loan portfolio risk analysis' },
      { id: 'operational_risk', name: 'Operational Risk', frequency: 'Monthly', description: 'Operational incidents and controls' },
      { id: 'market_risk', name: 'Market Risk Analysis', frequency: 'Daily', description: 'Market exposure and VaR calculations' },
      { id: 'liquidity_risk', name: 'Liquidity Risk Report', frequency: 'Weekly', description: 'Liquidity position and stress testing' },
      { id: 'npl_analysis', name: 'NPL Analysis', frequency: 'Weekly', description: 'Non-performing loans detailed analysis' }
    ]
  }
};

// Mock scheduled reports data
const MOCK_SCHEDULED_REPORTS = [
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
  },
  {
    id: 3,
    reportName: 'Weekly NPL Analysis',
    reportType: 'npl_analysis',
    frequency: 'Weekly',
    recipients: ['collections@bank.com'],
    lastRun: '2024-01-22 07:00',
    nextRun: '2024-01-29 07:00',
    status: 'active'
  }
];

// Mock report history
const MOCK_REPORT_HISTORY = [
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
  },
  {
    id: 3,
    reportName: 'Customer Acquisition - Week 52',
    reportType: 'customer_acquisition',
    generatedAt: '2024-01-02 09:45',
    generatedBy: 'System',
    size: '1.8 MB',
    status: 'completed'
  }
];

export function Reports() {
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

  const [scheduledReports, setScheduledReports] = useState(MOCK_SCHEDULED_REPORTS);
  const [reportHistory, setReportHistory] = useState(MOCK_REPORT_HISTORY);
  const [activeTab, setActiveTab] = useState('generate');

  // Load scheduled reports
  useEffect(() => {
    loadScheduledReports();
  }, []);

  const loadScheduledReports = async () => {
    const result = await emailService.getScheduledReports();
    if (result.success && result.schedules.length > 0) {
      setScheduledReports(result.schedules);
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report to generate');
      return;
    }

    setIsGenerating(true);
    try {
      let data;
      const reportInfo = Object.values(REPORT_CATEGORIES)
        .flatMap(cat => cat.reports)
        .find(r => r.id === selectedReport);

      // Fetch report data based on category
      const category = Object.keys(REPORT_CATEGORIES).find(key => 
        REPORT_CATEGORIES[key].reports.some(r => r.id === selectedReport)
      );

      if (!category) {
        console.error('No category found for report:', selectedReport);
        console.error('Available categories:', Object.keys(REPORT_CATEGORIES));
        console.error('All reports:', Object.values(REPORT_CATEGORIES).flatMap(cat => cat.reports.map(r => r.id)));
        throw new Error(`Unknown report category for report: ${selectedReport}`);
      }

      switch (category) {
        case 'financial':
          data = await comprehensiveReportService.getFinancialReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }
          );
          break;
        case 'regulatory':
          // For now, use financial data as placeholder for regulatory reports
          data = await comprehensiveReportService.getFinancialReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }
          );
          break;
        case 'customer':
          data = await comprehensiveReportService.getCustomerReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }
          );
          break;
        case 'risk':
          data = await comprehensiveReportService.getRiskReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }
          );
          break;
        default:
          throw new Error(`Unknown report category: ${category}`);
      }

      setReportData(data);

      // Generate PDF and Excel
      const pdf = await reportGenerator.generatePDF(data, selectedReport, reportInfo.name);
      const excel = await reportGenerator.generateExcel(data, selectedReport, reportInfo.name);

      setGeneratedReport({
        pdf,
        excel,
        reportInfo,
        data
      });

      // Add to history
      const newHistoryItem = {
        id: reportHistory.length + 1,
        reportName: `${reportInfo.name} - ${format(new Date(), 'MMMM yyyy')}`,
        reportType: selectedReport,
        generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        generatedBy: 'Current User',
        size: '2.1 MB',
        status: 'completed'
      };
      setReportHistory([newHistoryItem, ...reportHistory]);

      toast.success('Report generated successfully!');
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download report
  const handleDownload = (format) => {
    if (!generatedReport) return;

    if (format === 'pdf') {
      reportGenerator.savePDF(generatedReport.pdf, generatedReport.reportInfo.name);
    } else if (format === 'excel') {
      reportGenerator.saveExcel(generatedReport.excel, generatedReport.reportInfo.name);
    }
    
    toast.success(`${format.toUpperCase()} downloaded successfully!`);
  };

  // Print report
  const handlePrint = () => {
    if (!generatedReport || !generatedReport.pdf) {
      toast.error('Please generate a report first');
      return;
    }
    
    try {
      reportGenerator.printReport(generatedReport.pdf);
      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error('Failed to print report');
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!generatedReport) {
      toast.error('Please generate a report first');
      return;
    }

    if (!emailForm.recipients) {
      toast.error('Please enter recipient email addresses');
      return;
    }

    setIsGenerating(true);
    try {
      const attachments = [];
      
      if (emailForm.includePDF) {
        const pdfBlob = reportGenerator.getPDFBlob(generatedReport.pdf);
        attachments.push({
          filename: `${generatedReport.reportInfo.name}_${format(new Date(), 'yyyyMMdd')}.pdf`,
          content: pdfBlob,
          type: 'application/pdf'
        });
      }

      if (emailForm.includeExcel) {
        const excelBlob = reportGenerator.getExcelBlob(generatedReport.excel);
        attachments.push({
          filename: `${generatedReport.reportInfo.name}_${format(new Date(), 'yyyyMMdd')}.xlsx`,
          content: excelBlob,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      const recipients = emailForm.recipients.split(',').map(email => email.trim());
      const ccEmails = emailForm.cc ? emailForm.cc.split(',').map(email => email.trim()) : [];
      const bccEmails = emailForm.bcc ? emailForm.bcc.split(',').map(email => email.trim()) : [];

      for (const recipient of recipients) {
        const result = await emailService.sendReport({
          recipientEmail: recipient,
          recipientName: recipient.split('@')[0],
          reportTitle: generatedReport.reportInfo.name,
          reportType: selectedReport,
          attachments,
          ccEmails,
          bccEmails
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }
      }

      toast.success('Report sent successfully to all recipients!');
      
      // Check if mock service is being used
      const emailService = import.meta.env.VITE_EMAIL_SERVICE || 'mock';
      if (emailService === 'mock') {
        toast.warning('Note: Using MOCK email service - emails were not actually delivered. Check EMAIL_CONFIGURATION_GUIDE.md to set up real email delivery.', {
          duration: 8000
        });
      }
      
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
      
      // Provide helpful error messages
      if (error.message.includes('API key not configured')) {
        toast.error('Email service not configured. Please check your environment variables.');
      } else if (error.message.includes('MOCK')) {
        toast.info('Email logged but not sent (using mock service)');
            } else {
        toast.error(`Failed to send email: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Schedule report
  const handleScheduleReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report to schedule');
      return;
    }

    if (!scheduleForm.recipients) {
      toast.error('Please enter recipient email addresses');
      return;
    }

    try {
      const reportInfo = Object.values(REPORT_CATEGORIES)
        .flatMap(cat => cat.reports)
        .find(r => r.id === selectedReport);

      const result = await emailService.scheduleReportEmail({
        reportType: selectedReport,
        reportTitle: reportInfo.name,
        recipients: scheduleForm.recipients.split(',').map(email => email.trim()),
        frequency: scheduleForm.frequency,
        scheduleTime: scheduleForm.time,
        dayOfWeek: scheduleForm.frequency === 'weekly' ? parseInt(scheduleForm.dayOfWeek) : null,
        dayOfMonth: scheduleForm.frequency === 'monthly' ? parseInt(scheduleForm.dayOfMonth) : null,
        enabled: scheduleForm.enabled
      });

      if (result.success) {
        toast.success('Report scheduled successfully!');
        setScheduleDialogOpen(false);
        loadScheduledReports();
      } else {
        throw new Error(result.error || 'Failed to schedule report');
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report: ' + error.message);
    }
  };

  // Cancel scheduled report
  const handleCancelSchedule = async (scheduleId) => {
    try {
      const result = await emailService.cancelScheduledReport(scheduleId);
      if (result.success) {
        toast.success('Schedule cancelled successfully');
        loadScheduledReports();
      } else {
        throw new Error(result.error || 'Failed to cancel schedule');
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast.error('Failed to cancel schedule: ' + error.message);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Generate, schedule, and manage all banking reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setActiveTab('history')}>
            <Clock className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setActiveTab('scheduled')}>
            <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Scheduled</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="text-xs sm:text-sm">Generate</TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs sm:text-sm">Scheduled</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Report Categories */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
                <Card key={key} className={selectedCategory === key ? 'ring-2 ring-primary' : ''}>
                  <CardHeader 
                    className="cursor-pointer p-3 sm:p-6"
                    onClick={() => setSelectedCategory(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${category.bgColor}`}>
                          <category.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${category.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg">{category.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{category.reports.length} reports available</CardDescription>
                        </div>
                      </div>
                      <Badge variant={selectedCategory === key ? 'default' : 'outline'} className="text-xs">
                        {selectedCategory === key ? 'Selected' : 'Select'}
                      </Badge>
                    </div>
                  </CardHeader>
                  {selectedCategory === key && (
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="space-y-2">
                        {category.reports.map((report) => (
                          <div
                            key={report.id}
                            className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedReport === report.id 
                                ? 'bg-primary/10 border-primary' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedReport(report.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm sm:text-base">{report.name}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">{report.description}</p>
                              </div>
                              <div className="ml-2">
                                <Badge variant="secondary" className="text-xs">{report.frequency}</Badge>
                              </div>
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
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-xl">Report Configuration</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Configure report parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm">Date Range</Label>
                    <DatePickerWithRange
                      date={dateRange}
                      setDate={setDateRange}
                    />
                  </div>

                  {/* Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm">Branch</Label>
                    <Select value={filters.branch} onValueChange={(value) => setFilters({...filters, branch: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select branch" />
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
                    <Label className="text-sm">Product</Label>
                    <Select value={filters.product} onValueChange={(value) => setFilters({...filters, product: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="loan">Loans</SelectItem>
                        <SelectItem value="credit">Credit Cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Customer Segment</Label>
                    <Select value={filters.segment} onValueChange={(value) => setFilters({...filters, segment: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Segments</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="sme">SME</SelectItem>
                        <SelectItem value="private">Private Banking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full text-sm" 
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Last Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Report Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Reports</CardTitle>
                <Button size="sm">
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
                    <TableHead>Last Run</TableHead>
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
                      <TableCell className="text-sm">{schedule.lastRun}</TableCell>
                      <TableCell className="text-sm">{schedule.nextRun}</TableCell>
                      <TableCell>
                        <Badge variant={schedule.status === 'active' ? 'success' : 'secondary'}>
                          {schedule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCancelSchedule(schedule.id)}
                          >
                            <AlertCircle className="h-4 w-4" />
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

        {/* Report History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report History</CardTitle>
                <Button size="sm" variant="outline">
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
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
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
              Send the generated report to specified recipients
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipients">Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cc">CC (optional)</Label>
              <Input
                id="cc"
                placeholder="cc@example.com"
                value={emailForm.cc}
                onChange={(e) => setEmailForm({...emailForm, cc: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bcc">BCC (optional)</Label>
              <Input
                id="bcc"
                placeholder="bcc@example.com"
                value={emailForm.bcc}
                onChange={(e) => setEmailForm({...emailForm, bcc: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Additional Message (optional)</Label>
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
              Set up automatic report generation and delivery
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
            
            {scheduleForm.frequency === 'weekly' && (
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={scheduleForm.dayOfWeek} onValueChange={(value) => setScheduleForm({...scheduleForm, dayOfWeek: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {scheduleForm.frequency === 'monthly' && (
              <div className="grid gap-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Select value={scheduleForm.dayOfMonth} onValueChange={(value) => setScheduleForm({...scheduleForm, dayOfMonth: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
              <Label htmlFor="scheduleRecipients">Recipients (comma-separated)</Label>
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

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[900px] p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-6 pb-0 no-print">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              <img src="/osol-logo.png" alt="OSOL Logo" className="h-6 sm:h-8 w-auto" />
              <span>Report Preview</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {generatedReport?.reportInfo.name} - Generated successfully
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(100%-120px)] w-full">
            <div className="p-4 sm:p-6">
              {reportData && (
                <div className="space-y-4">
                  {/* OSOL Branded Header */}
                  <div className="bg-gradient-to-r from-[#E6B800] to-[#CC9900] text-white p-3 sm:p-4 rounded-lg avoid-break">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/osol-logo.png" alt="OSOL" className="h-8 sm:h-10 w-auto filter brightness-0 invert" />
                        <div>
                          <h2 className="text-base sm:text-xl font-bold">OSOL Financial Report</h2>
                          <p className="text-xs sm:text-sm opacity-90">{generatedReport?.reportInfo.name}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm">Generated on</p>
                        <p className="font-semibold text-sm sm:text-base">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 avoid-break">
                      <div>
                        <h3 className="font-semibold mb-2 text-[#4A5568] text-sm sm:text-base">Report Summary</h3>
                        <div className="space-y-1 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p><span className="font-medium">Type:</span> {generatedReport?.reportInfo.name}</p>
                        <p><span className="font-medium">Period:</span> {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}</p>
                        <p><span className="font-medium">Generated:</span> {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-[#4A5568] text-sm sm:text-base">Key Metrics</h3>
                      <div className="space-y-2 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg max-h-[300px] overflow-y-auto">
                        {generatedReport?.data && (
                          <>
                            {/* Period Information */}
                            {generatedReport.data.period && (
                              <div className="border-b pb-2">
                                <span className="font-medium text-[#4A5568]">Period:</span>
                                <span className="ml-2">
                                  {format(new Date(generatedReport.data.period.startDate), 'MMM dd, yyyy')} - 
                                  {format(new Date(generatedReport.data.period.endDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}
                            
                            {/* Revenue */}
                            {generatedReport.data.revenue && (
                              <div className="border-b pb-2">
                                <span className="font-medium text-[#4A5568]">Revenue:</span>
                                <div className="ml-4 mt-1 space-y-1">
                                  {generatedReport.data.revenue.transactionFees !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Transaction Fees:</span>
                                      <span>SAR {generatedReport.data.revenue.transactionFees?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.revenue.interestIncome !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Interest Income:</span>
                                      <span>SAR {generatedReport.data.revenue.interestIncome?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.revenue.totalRevenue !== undefined && (
                                    <div className="flex justify-between font-medium">
                                      <span>Total Revenue:</span>
                                      <span>SAR {generatedReport.data.revenue.totalRevenue?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Expenses */}
                            {generatedReport.data.expenses && (
                              <div className="border-b pb-2">
                                <span className="font-medium text-[#4A5568]">Expenses:</span>
                                <div className="ml-4 mt-1 space-y-1">
                                  {generatedReport.data.expenses.operatingExpenses !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Operating Expenses:</span>
                                      <span>SAR {generatedReport.data.expenses.operatingExpenses?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.expenses.personnelCosts !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Personnel Costs:</span>
                                      <span>SAR {generatedReport.data.expenses.personnelCosts?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.expenses.provisions !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Provisions:</span>
                                      <span>SAR {generatedReport.data.expenses.provisions?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.expenses.totalExpenses !== undefined && (
                                    <div className="flex justify-between font-medium">
                                      <span>Total Expenses:</span>
                                      <span>SAR {generatedReport.data.expenses.totalExpenses?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Net Income */}
                            {generatedReport.data.netIncome !== undefined && (
                              <div className="border-b pb-2">
                                <div className="flex justify-between">
                                  <span className="font-medium text-[#4A5568]">Net Income:</span>
                                  <span className={`font-medium ${generatedReport.data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    SAR {generatedReport.data.netIncome?.toLocaleString() || '0'}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Additional Metrics */}
                            {generatedReport.data.metrics && (
                              <div>
                                <span className="font-medium text-[#4A5568]">Metrics:</span>
                                <div className="ml-4 mt-1 space-y-1">
                                  {generatedReport.data.metrics.totalTransactions !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Total Transactions:</span>
                                      <span>{generatedReport.data.metrics.totalTransactions?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.metrics.activeLoans !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Active Loans:</span>
                                      <span>{generatedReport.data.metrics.activeLoans?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                  {generatedReport.data.metrics.activeAccounts !== undefined && (
                                    <div className="flex justify-between">
                                      <span>Active Accounts:</span>
                                      <span>{generatedReport.data.metrics.activeAccounts?.toLocaleString() || '0'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 text-[#4A5568]">Report Preview</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {/* Visual Report View */}
                      {generatedReport?.data && (
                        <VisualReportView 
                          reportData={generatedReport.data} 
                          reportType={selectedReport}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t p-4 sm:p-6 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <img src="/osol-logo.png" alt="OSOL" className="h-4 w-auto opacity-50" />
                <span>© 2025 OSOL Financial Services</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload('excel')}
                  className="w-full sm:w-auto text-sm"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Excel</span>
                  <span className="hidden sm:inline">Download Excel</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload('pdf')}
                  className="w-full sm:w-auto text-sm"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">PDF</span>
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  className="w-full sm:w-auto text-sm"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Print</span>
                  <span className="hidden sm:inline">Print Report</span>
                </Button>
                <Button 
                  onClick={() => setEmailDialogOpen(true)} 
                  className="bg-[#E6B800] hover:bg-[#CC9900] w-full sm:w-auto text-sm"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Email</span>
                  <span className="hidden sm:inline">Send Email</span>
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}