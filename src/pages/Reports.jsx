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
import PDFViewer from '@/components/PDFViewer';
import { useIsMobile, responsiveClasses } from '@/utils/responsive';
import { useRTLClasses } from '@/components/ui/rtl-wrapper';
import { cn } from '@/lib/utils';
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
import IncomeStatementReport from '@/components/reports/IncomeStatementReport';

const REPORT_CATEGORIES = {
  financial: {
    title: 'reports.financialReports',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    reports: [
      { id: 'income_statement', name: 'reports.incomeStatement', frequency: 'reports.monthly', description: 'reports.incomeStatementDesc' },
      { id: 'balance_sheet', name: 'reports.balanceSheet', frequency: 'reports.quarterlyReport', description: 'reports.balanceSheetDesc' },
      { id: 'cash_flow', name: 'reports.cashFlowStatement', frequency: 'reports.monthly', description: 'reports.cashFlowDesc' },
      { id: 'profit_loss', name: 'reports.profitLoss', frequency: 'reports.monthly', description: 'reports.profitLossDesc' },
      { id: 'budget_variance', name: 'reports.budgetVarianceAnalysis', frequency: 'reports.monthly', description: 'reports.budgetVarianceDesc' }
    ]
  },
  regulatory: {
    title: 'reports.regulatoryReports',
    icon: Building2,
    color: 'text-[#E6B800]',
    bgColor: 'bg-yellow-50',
    reports: [
      { id: 'sama_monthly', name: 'reports.samaMonthlyReport', frequency: 'reports.monthly', description: 'reports.samaMonthlyDesc' },
      { id: 'basel_iii', name: 'reports.baselIIICompliance', frequency: 'reports.quarterlyReport', description: 'reports.baselIIIDesc' },
      { id: 'aml_report', name: 'reports.amlCftReport', frequency: 'reports.monthly', description: 'reports.amlCftDesc' },
      { id: 'liquidity_coverage', name: 'reports.liquidityCoverageRatio', frequency: 'reports.daily', description: 'reports.liquidityCoverageDesc' },
      { id: 'capital_adequacy', name: 'reports.capitalAdequacyReport', frequency: 'reports.quarterlyReport', description: 'reports.capitalAdequacyDesc' }
    ]
  },
  customer: {
    title: 'reports.customerReports',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    reports: [
      { id: 'customer_acquisition', name: 'reports.customerAcquisition', frequency: 'reports.weekly', description: 'reports.customerAcquisitionDesc' },
      { id: 'customer_segmentation', name: 'reports.customerSegmentation', frequency: 'reports.monthly', description: 'reports.customerSegmentationDesc' },
      { id: 'customer_satisfaction', name: 'reports.customerSatisfaction', frequency: 'reports.quarterlyReport', description: 'reports.customerSatisfactionDesc' },
      { id: 'dormant_accounts', name: 'reports.dormantAccounts', frequency: 'reports.monthly', description: 'reports.dormantAccountsDesc' },
      { id: 'kyc_compliance', name: 'reports.kycComplianceStatus', frequency: 'reports.weekly', description: 'reports.kycComplianceDesc' }
    ]
  },
  risk: {
    title: 'reports.riskReports',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    reports: [
      { id: 'credit_risk', name: 'reports.creditRiskAssessment', frequency: 'reports.daily', description: 'reports.creditRiskDesc' },
      { id: 'operational_risk', name: 'reports.operationalRisk', frequency: 'reports.monthly', description: 'reports.operationalRiskDesc' },
      { id: 'market_risk', name: 'reports.marketRiskAnalysis', frequency: 'reports.daily', description: 'reports.marketRiskDesc' },
      { id: 'liquidity_risk', name: 'reports.liquidityRiskReport', frequency: 'reports.weekly', description: 'reports.liquidityRiskDesc' },
      { id: 'npl_analysis', name: 'reports.nplAnalysis', frequency: 'reports.weekly', description: 'reports.nplAnalysisDesc' }
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

export function ReportsResponsive() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const rtl = useRTLClasses();
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

  // Check if RTL
  const isRTL = i18n.language === 'ar';

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
      toast.error(t('reports.pleaseSelectReport'));
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
        throw new Error(`Unknown report category for report: ${selectedReport}`);
      }

      switch (category) {
        case 'financial':
          data = await comprehensiveReportService.getFinancialReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() },
            filters
          );
          break;
        case 'regulatory':
          data = await comprehensiveReportService.getFinancialReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() },
            filters
          );
          break;
        case 'customer':
          data = await comprehensiveReportService.getCustomerReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() },
            filters
          );
          break;
        case 'risk':
          data = await comprehensiveReportService.getRiskReportData(
            selectedReport,
            { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() },
            filters
          );
          break;
        default:
          throw new Error(`Unknown report category: ${category}`);
      }

      setReportData(data);

      // Generate PDF and Excel with enhanced branding for Income Statement
      let pdf, excel;
      // Prepare report metadata with filters
      const reportMetadata = {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        filters: filters,
        generatedAt: new Date().toISOString()
      };

      if (selectedReport === 'income_statement') {
        pdf = reportGenerator.generateIncomeStatementPDF(data, t(reportInfo.name), reportMetadata);
        excel = await reportGenerator.generateExcel(data, selectedReport, t(reportInfo.name), reportMetadata);
      } else {
        pdf = await reportGenerator.generatePDF(data, selectedReport, t(reportInfo.name), reportMetadata);
        excel = await reportGenerator.generateExcel(data, selectedReport, t(reportInfo.name), reportMetadata);
      }

      setGeneratedReport({
        pdf,
        excel,
        reportInfo,
        data
      });

      // Automatically switch to preview tab
      setActiveTab('preview');

      // Add to history
      const newHistoryItem = {
        id: reportHistory.length + 1,
        reportName: `${t(reportInfo.name)} - ${format(new Date(), 'MMMM yyyy')}`,
        reportType: selectedReport,
        generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        generatedBy: 'Current User',
        size: '2.1 MB',
        status: 'completed'
      };
      setReportHistory([newHistoryItem, ...reportHistory]);

      // Show success toast with action buttons
      toast.success(
        <div className="flex items-center justify-between w-full">
          <span>{t('reports.reportGeneratedSuccessfully')}</span>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setPreviewDialogOpen(true);
                toast.dismiss();
              }}
            >
              <Eye className="mr-1 h-3 w-3" />
              {t('reports.preview')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                handlePrint();
                toast.dismiss();
              }}
            >
              <Printer className="mr-1 h-3 w-3" />
              {t('reports.print')}
            </Button>
          </div>
        </div>,
        {
          duration: 10000,
        }
      );
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(t('reports.failedToGenerateReport') + ': ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download report
  const handleDownload = (format) => {
    if (!generatedReport) return;

    if (format === 'pdf') {
      reportGenerator.savePDF(generatedReport.pdf, t(generatedReport.reportInfo.name));
    } else if (format === 'excel') {
      reportGenerator.saveExcel(generatedReport.excel, t(generatedReport.reportInfo.name));
    }
    
    toast.success(`${format.toUpperCase()} ${t('reports.downloadedSuccessfully')}`);
  };

  // Print report
  const handlePrint = () => {
    if (!generatedReport || !generatedReport.pdf) {
      toast.error(t('reports.pleaseGenerateReportFirst'));
      return;
    }
    
    try {
      reportGenerator.printReport(generatedReport.pdf);
      toast.success(t('reports.printDialogOpened'));
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error(t('reports.failedToPrintReport'));
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!generatedReport) {
      toast.error(t('reports.pleaseGenerateReportFirst'));
      return;
    }

    if (!emailForm.recipients) {
      toast.error(t('reports.pleaseEnterRecipients'));
      return;
    }

    setIsGenerating(true);
    try {
      const attachments = [];
      
      if (emailForm.includePDF) {
        const pdfBlob = reportGenerator.getPDFBlob(generatedReport.pdf);
        attachments.push({
          filename: `${t(generatedReport.reportInfo.name)}_${format(new Date(), 'yyyyMMdd')}.pdf`,
          content: pdfBlob,
          type: 'application/pdf'
        });
      }

      if (emailForm.includeExcel) {
        const excelBlob = reportGenerator.getExcelBlob(generatedReport.excel);
        attachments.push({
          filename: `${t(generatedReport.reportInfo.name)}_${format(new Date(), 'yyyyMMdd')}.xlsx`,
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
          reportTitle: t(generatedReport.reportInfo.name),
          reportType: selectedReport,
          attachments,
          ccEmails,
          bccEmails
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }
      }

      toast.success(t('reports.reportSentSuccessfully'));
      
      // Check if mock service is being used
      const emailServiceType = import.meta.env.VITE_EMAIL_SERVICE || 'mock';
      if (emailServiceType === 'mock') {
        toast.warning(t('reports.mockEmailServiceNote'), {
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
      
      if (error.message.includes('API key not configured')) {
        toast.error(t('reports.emailServiceNotConfigured'));
      } else if (error.message.includes('MOCK')) {
        toast.info(t('reports.emailLoggedButNotSent'));
      } else {
        toast.error(`${t('reports.failedToSendEmail')}: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Schedule report
  const handleScheduleReport = async () => {
    if (!selectedReport) {
      toast.error(t('reports.pleaseSelectReport'));
      return;
    }

    if (!scheduleForm.recipients) {
      toast.error(t('reports.pleaseEnterRecipients'));
      return;
    }

    try {
      const reportInfo = Object.values(REPORT_CATEGORIES)
        .flatMap(cat => cat.reports)
        .find(r => r.id === selectedReport);

      const result = await emailService.scheduleReportEmail({
        reportType: selectedReport,
        reportTitle: t(reportInfo.name),
        recipients: scheduleForm.recipients.split(',').map(email => email.trim()),
        frequency: scheduleForm.frequency,
        scheduleTime: scheduleForm.time,
        dayOfWeek: scheduleForm.frequency === 'weekly' ? parseInt(scheduleForm.dayOfWeek) : null,
        dayOfMonth: scheduleForm.frequency === 'monthly' ? parseInt(scheduleForm.dayOfMonth) : null,
        enabled: scheduleForm.enabled
      });

      if (result.success) {
        toast.success(t('reports.reportScheduledSuccessfully'));
        setScheduleDialogOpen(false);
        loadScheduledReports();
      } else {
        throw new Error(result.error || 'Failed to schedule report');
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error(t('reports.failedToScheduleReport') + ': ' + error.message);
    }
  };

  // Cancel scheduled report
  const handleCancelSchedule = async (scheduleId) => {
    try {
      const result = await emailService.cancelScheduledReport(scheduleId);
      if (result.success) {
        toast.success(t('reports.scheduleCancelledSuccessfully'));
        loadScheduledReports();
      } else {
        throw new Error(result.error || 'Failed to cancel schedule');
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast.error(t('reports.failedToCancelSchedule') + ': ' + error.message);
    }
  };

  return (
    <div className={cn(
      "space-y-4 sm:space-y-6",
      isMobile ? "p-3" : "p-4 sm:p-6"
    )} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn(
        "flex justify-between gap-4",
        isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center"
      )}>
        <div>
          <h1 className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl sm:text-3xl"
          )}>{t('reports.reportsCenter')}</h1>
          {!isMobile && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t('reports.reportsCenterDescription')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setActiveTab('history')}>
            <Clock className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t('reports.history')}</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setActiveTab('scheduled')}>
            <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t('reports.scheduled')}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-3 sm:gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        <Card>
          <CardHeader className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            isMobile ? "p-3" : "p-3 sm:p-6"
          )}>
            <CardTitle className={cn(
              "font-medium",
              isMobile ? "text-xs" : "text-xs sm:text-sm"
            )}>{t('reports.totalReports')}</CardTitle>
            <FileText className={cn(
              "text-muted-foreground",
              isMobile ? "h-3 w-3" : "h-4 w-4"
            )} />
          </CardHeader>
          <CardContent className={cn(
            "pt-0",
            isMobile ? "p-3" : "p-3 sm:p-6"
          )}>
            <div className={cn(
              "font-bold",
              isMobile ? "text-lg" : "text-xl sm:text-2xl"
            )}>156</div>
            <p className="text-xs text-muted-foreground">{t('reports.thisMonth')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reports.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">{t('reports.inQueue')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reports.scheduled')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">{t('reports.active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reports.failed')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">{t('reports.attention')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="text-xs sm:text-sm">{t('reports.generate')}</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs sm:text-sm" disabled={!generatedReport}>
            {t('reports.preview')}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs sm:text-sm">{t('reports.scheduled')}</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">{t('reports.history')}</TabsTrigger>
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
                          <CardTitle className="text-base sm:text-lg">{t(category.title)}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{category.reports.length} {t('reports.reportsAvailable')}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={selectedCategory === key ? 'default' : 'outline'} className="text-xs">
                        {selectedCategory === key ? t('reports.selected') : t('reports.select')}
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
                                <h4 className="font-medium text-sm sm:text-base">{t(report.name)}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">{t(report.description)}</p>
                              </div>
                              <div className="ml-2">
                                <Badge variant="secondary" className="text-xs">{t(report.frequency)}</Badge>
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
                  <CardTitle className="text-base sm:text-xl">{t('reports.reportConfiguration')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t('reports.configureParameters')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm">{t('reports.dateRange')}</Label>
                    <DatePickerWithRange
                      date={dateRange}
                      setDate={setDateRange}
                    />
                  </div>

                  {/* Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm">{t('reports.branch')}</Label>
                    <Select value={filters.branch} onValueChange={(value) => setFilters({...filters, branch: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={t('reports.branch')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('reports.allBranches')}</SelectItem>
                        <SelectItem value="main">{t('reports.mainBranch')}</SelectItem>
                        <SelectItem value="north">{t('reports.northBranch')}</SelectItem>
                        <SelectItem value="south">{t('reports.southBranch')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('reports.product')}</Label>
                    <Select value={filters.product} onValueChange={(value) => setFilters({...filters, product: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={t('reports.product')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('reports.allProducts')}</SelectItem>
                        <SelectItem value="savings">{t('reports.savingsAccount')}</SelectItem>
                        <SelectItem value="current">{t('reports.currentAccount')}</SelectItem>
                        <SelectItem value="loan">{t('reports.loans')}</SelectItem>
                        <SelectItem value="credit">{t('reports.creditCards')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('reports.customerSegment')}</Label>
                    <Select value={filters.segment} onValueChange={(value) => setFilters({...filters, segment: value})}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={t('reports.customerSegment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('reports.allSegments')}</SelectItem>
                        <SelectItem value="retail">{t('reports.retail')}</SelectItem>
                        <SelectItem value="corporate">{t('reports.corporate')}</SelectItem>
                        <SelectItem value="sme">{t('reports.sme')}</SelectItem>
                        <SelectItem value="private">{t('reports.privateBanking')}</SelectItem>
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
                          {t('reports.generating')}
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          {t('reports.generateReport')}
                        </>
                      )}
                    </Button>
                    
                    {/* Show additional actions when report is generated */}
                    {generatedReport && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setPreviewDialogOpen(true)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('reports.preview')}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handlePrint}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          {t('reports.print')}
                        </Button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setScheduleDialogOpen(true)}
                        disabled={!selectedReport}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {t('reports.schedule')}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setEmailDialogOpen(true)}
                        disabled={!generatedReport}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {t('reports.email')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('reports.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {generatedReport ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => handleDownload('pdf')}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        {t('reports.downloadPDF')}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => handleDownload('excel')}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        {t('reports.downloadExcel')}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={handlePrint}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        {t('reports.printReport')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        {t('reports.downloadLastReport')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        {t('reports.previewTemplates')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('reports.reportSettings')}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Report Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {generatedReport && reportData ? (
            <div className="space-y-4">
              {/* Enhanced Income Statement Report */}
              {selectedReport === 'income_statement' ? (
                <IncomeStatementReport 
                  reportData={reportData}
                  reportType={selectedReport}
                  dateRange={dateRange}
                />
              ) : (
                /* Fallback to original VisualReportView for other reports */
                <div className="bg-white rounded-lg border p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#2D3748] mb-2">
                      {t(generatedReport.reportInfo.name)}
                    </h2>
                    <p className="text-[#718096]">
                      Generated on {format(new Date(), 'dd MMMM yyyy HH:mm')}
                    </p>
                  </div>
                  <VisualReportView 
                    reportData={reportData}
                    reportType={selectedReport}
                  />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                <Button 
                  onClick={() => handleDownload('pdf')}
                  className="bg-[#E6B800] hover:bg-[#CC9900] text-white"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDownload('excel')}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Report
                </Button>
              </div>
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
                <CardTitle>{t('reports.scheduledReports')}</CardTitle>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('reports.addSchedule')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('reports.reportName')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.frequency')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.recipients')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.lastRun')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.nextRun')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.status')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.actions')}</TableHead>
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
                            {schedule.recipients.length > 2 && ` +${schedule.recipients.length - 2} ${t('reports.more')}`}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('reports.reportHistory')}</CardTitle>
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('reports.refresh')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('reports.reportName')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.generatedAt')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.generatedBy')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.size')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.status')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('reports.actions')}</TableHead>
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
                            {t('reports.completed')}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('reports.sendReportViaEmail')}</DialogTitle>
            <DialogDescription>
              {t('reports.sendReportDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipients">{t('reports.recipientsCommaSeparated')}</Label>
              <Input
                id="recipients"
                placeholder={t('reports.recipientsPlaceholder')}
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cc">{t('reports.ccOptional')}</Label>
              <Input
                id="cc"
                placeholder="cc@example.com"
                value={emailForm.cc}
                onChange={(e) => setEmailForm({...emailForm, cc: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bcc">{t('reports.bccOptional')}</Label>
              <Input
                id="bcc"
                placeholder="bcc@example.com"
                value={emailForm.bcc}
                onChange={(e) => setEmailForm({...emailForm, bcc: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">{t('reports.additionalMessage')}</Label>
              <Textarea
                id="message"
                placeholder={t('reports.addCustomMessage')}
                value={emailForm.message}
                onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reports.attachments')}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePDF"
                    checked={emailForm.includePDF}
                    onCheckedChange={(checked) => setEmailForm({...emailForm, includePDF: checked})}
                  />
                  <label htmlFor="includePDF" className="text-sm">{t('reports.includePDFVersion')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeExcel"
                    checked={emailForm.includeExcel}
                    onCheckedChange={(checked) => setEmailForm({...emailForm, includeExcel: checked})}
                  />
                  <label htmlFor="includeExcel" className="text-sm">{t('reports.includeExcelVersion')}</label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              {t('reports.cancel')}
            </Button>
            <Button onClick={handleSendEmail} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('reports.sending')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('reports.sendEmail')}
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
            <DialogTitle>{t('reports.scheduleReport')}</DialogTitle>
            <DialogDescription>
              {t('reports.scheduleReportDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="frequency">{t('reports.frequency')}</Label>
              <Select value={scheduleForm.frequency} onValueChange={(value) => setScheduleForm({...scheduleForm, frequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('reports.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('reports.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('reports.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {scheduleForm.frequency === 'weekly' && (
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">{t('reports.dayOfWeek')}</Label>
                <Select value={scheduleForm.dayOfWeek} onValueChange={(value) => setScheduleForm({...scheduleForm, dayOfWeek: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('reports.monday')}</SelectItem>
                    <SelectItem value="2">{t('reports.tuesday')}</SelectItem>
                    <SelectItem value="3">{t('reports.wednesday')}</SelectItem>
                    <SelectItem value="4">{t('reports.thursday')}</SelectItem>
                    <SelectItem value="5">{t('reports.friday')}</SelectItem>
                    <SelectItem value="6">{t('reports.saturday')}</SelectItem>
                    <SelectItem value="0">{t('reports.sunday')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {scheduleForm.frequency === 'monthly' && (
              <div className="grid gap-2">
                <Label htmlFor="dayOfMonth">{t('reports.dayOfMonth')}</Label>
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
              <Label htmlFor="time">{t('reports.time')}</Label>
              <Input
                id="time"
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="scheduleRecipients">{t('reports.recipientsCommaSeparated')}</Label>
              <Input
                id="scheduleRecipients"
                placeholder={t('reports.recipientsPlaceholder')}
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
              <Label htmlFor="enabled">{t('reports.enableScheduleImmediately')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              {t('reports.cancel')}
            </Button>
            <Button onClick={handleScheduleReport}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('reports.createSchedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Using new PDFViewer component */}
      <PDFViewer
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        pdfDoc={generatedReport?.pdf}
        reportName={generatedReport?.reportInfo?.name ? t(generatedReport.reportInfo.name) : ''}
        onDownload={() => handleDownload('pdf')}
        onPrint={handlePrint}
      />
    </div>
  );
}

// Export as Reports for backward compatibility
export const Reports = ReportsResponsive;
export default ReportsResponsive;