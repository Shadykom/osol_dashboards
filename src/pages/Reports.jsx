import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatCurrency as formatCurrencyUtil, formatDate, formatDateTime } from '@/utils/formatters';
import { ClientOnly } from '@/components/ui/ClientOnly';
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
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { supabase, TABLES } from '@/lib/supabase';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const REPORT_CATEGORIES = {
  financial: {
    title: 'Financial Reports',
    icon: DollarSign,
    color: 'text-green-500',
    reports: [
      { id: 'income_statement', name: 'Income Statement', frequency: 'Monthly' },
      { id: 'balance_sheet', name: 'Balance Sheet', frequency: 'Quarterly' },
      { id: 'cash_flow', name: 'Cash Flow Statement', frequency: 'Monthly' },
      { id: 'profit_loss', name: 'Profit & Loss', frequency: 'Monthly' },
      { id: 'budget_variance', name: 'Budget Variance Analysis', frequency: 'Monthly' }
    ]
  },
  regulatory: {
    title: 'Regulatory Reports',
    icon: Building2,
    color: 'text-blue-500',
    reports: [
      { id: 'sama_monthly', name: 'SAMA Monthly Report', frequency: 'Monthly' },
      { id: 'basel_iii', name: 'Basel III Compliance', frequency: 'Quarterly' },
      { id: 'aml_report', name: 'AML/CFT Report', frequency: 'Monthly' },
      { id: 'liquidity_coverage', name: 'Liquidity Coverage Ratio', frequency: 'Daily' },
      { id: 'capital_adequacy', name: 'Capital Adequacy Report', frequency: 'Quarterly' }
    ]
  },
  customer: {
    title: 'Customer Reports',
    icon: Users,
    color: 'text-purple-500',
    reports: [
      { id: 'customer_acquisition', name: 'Customer Acquisition', frequency: 'Weekly' },
      { id: 'customer_segmentation', name: 'Customer Segmentation', frequency: 'Monthly' },
      { id: 'customer_satisfaction', name: 'Customer Satisfaction', frequency: 'Quarterly' },
      { id: 'dormant_accounts', name: 'Dormant Accounts', frequency: 'Monthly' },
      { id: 'kyc_compliance', name: 'KYC Compliance Status', frequency: 'Weekly' }
    ]
  },
  risk: {
    title: 'Risk Reports',
    icon: AlertCircle,
    color: 'text-red-500',
    reports: [
      { id: 'credit_risk', name: 'Credit Risk Assessment', frequency: 'Daily' },
      { id: 'operational_risk', name: 'Operational Risk', frequency: 'Monthly' },
      { id: 'market_risk', name: 'Market Risk Analysis', frequency: 'Daily' },
      { id: 'fraud_detection', name: 'Fraud Detection Report', frequency: 'Daily' },
      { id: 'npl_analysis', name: 'NPL Analysis', frequency: 'Weekly' }
    ]
  }
};

export function Reports() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('financial');
  const [recentReports, setRecentReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [reportStats, setReportStats] = useState({
    totalGenerated: 0,
    pendingReports: 0,
    scheduledReports: 0,
    failedReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [reportData, setReportData] = useState({});
  const [generatingReport, setGeneratingReport] = useState(null);

  useEffect(() => {
    fetchRecentReports();
    fetchScheduledReports();
    fetchReportStats();
    generateSampleReportData();
  }, []);

  const fetchRecentReports = async () => {
    try {
      // Mock recent reports data
      const mockReports = [
        {
          id: 1,
          name: 'Monthly Financial Statement',
          category: 'financial',
          generated_at: new Date().toISOString(),
          generated_by: 'System',
          status: 'completed',
          size: '2.4 MB',
          format: 'PDF'
        },
        {
          id: 2,
          name: 'SAMA Compliance Report',
          category: 'regulatory',
          generated_at: new Date(Date.now() - 86400000).toISOString(),
          generated_by: 'Admin User',
          status: 'completed',
          size: '1.8 MB',
          format: 'Excel'
        },
        {
          id: 3,
          name: 'Customer Segmentation Analysis',
          category: 'customer',
          generated_at: new Date(Date.now() - 172800000).toISOString(),
          generated_by: 'Analytics Team',
          status: 'completed',
          size: '3.1 MB',
          format: 'PDF'
        },
        {
          id: 4,
          name: 'Daily Risk Assessment',
          category: 'risk',
          generated_at: new Date(Date.now() - 3600000).toISOString(),
          generated_by: 'Risk Management',
          status: 'processing',
          size: '-',
          format: 'PDF'
        }
      ];
      
      setRecentReports(mockReports);
    } catch (error) {
      console.error('Error fetching recent reports:', error);
      toast.error('Failed to load recent reports');
    }
  };

  const fetchScheduledReports = async () => {
    try {
      // Mock scheduled reports
      const mockScheduled = [
        {
          id: 1,
          name: 'Weekly Customer Acquisition Report',
          category: 'customer',
          schedule: 'Every Monday at 9:00 AM',
          next_run: new Date(Date.now() + 259200000).toISOString(),
          recipients: ['management@bank.com', 'analytics@bank.com']
        },
        {
          id: 2,
          name: 'Daily Liquidity Coverage Ratio',
          category: 'regulatory',
          schedule: 'Daily at 6:00 PM',
          next_run: new Date(Date.now() + 28800000).toISOString(),
          recipients: ['compliance@bank.com', 'risk@bank.com']
        },
        {
          id: 3,
          name: 'Monthly Income Statement',
          category: 'financial',
          schedule: 'First day of month at 8:00 AM',
          next_run: new Date(Date.now() + 604800000).toISOString(),
          recipients: ['cfo@bank.com', 'finance@bank.com']
        }
      ];
      
      setScheduledReports(mockScheduled);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  };

  const fetchReportStats = async () => {
    try {
      // Mock report statistics
      setReportStats({
        totalGenerated: 156,
        pendingReports: 3,
        scheduledReports: 12,
        failedReports: 2
      });
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleReportData = async () => {
    try {
      // Generate sample data for financial report visualization
      const financialData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        financialData.push({
          month: formatDate(date, { month: 'short' }),
          revenue: Math.floor(Math.random() * 50000000) + 100000000,
          expenses: Math.floor(Math.random() * 30000000) + 70000000,
          profit: Math.floor(Math.random() * 20000000) + 20000000
        });
      }

      // Customer growth data
      const customerData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        customerData.push({
          date: formatDate(date, { weekday: 'short' }),
          new: Math.floor(Math.random() * 100) + 50,
          churned: Math.floor(Math.random() * 30) + 10,
          total: Math.floor(Math.random() * 1000) + 5000
        });
      }

      setReportData({
        financial: financialData,
        customer: customerData
      });
    } catch (error) {
      console.error('Error generating report data:', error);
    }
  };

  const generateReport = async (reportId, reportName) => {
    setGeneratingReport(reportId);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`${reportName} generated successfully`, {
      description: 'The report is ready for download'
    });
    
    setGeneratingReport(null);
    
    // Refresh recent reports
    fetchRecentReports();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`} />
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
          <p className="text-muted-foreground">Generate, schedule, and manage all banking reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Report
          </Button>
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Create Custom Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports Generated"
          value={reportStats.totalGenerated}
          icon={FileText}
          color="text-blue-500"
          subtitle="This month"
        />
        <StatCard
          title={t('common.pendingReports')}
          value={reportStats.pendingReports}
          icon={Clock}
          color="text-yellow-500"
          subtitle="In queue"
        />
        <StatCard
          title="Scheduled Reports"
          value={reportStats.scheduledReports}
          icon={Calendar}
          color="text-green-500"
          subtitle="Active schedules"
        />
        <StatCard
          title="Failed Reports"
          value={reportStats.failedReports}
          icon={AlertCircle}
          color="text-red-500"
          subtitle="Require attention"
        />
      </div>

      {/* Report Categories */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <category.icon className="h-4 w-4" />
                {category.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>Generate and manage {category.title.toLowerCase()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {category.reports.map((report) => (
                      <motion.div
                        key={report.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{report.name}</CardTitle>
                                <CardDescription className="text-sm">
                                  {report.frequency} Report
                                </CardDescription>
                              </div>
                              <Badge variant="outline">{report.frequency}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => generateReport(report.id, report.name)}
                                disabled={generatingReport === report.id}
                              >
                                {generatingReport === report.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-2" />
                                    Generate
                                  </>
                                )}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Calendar className="h-3 w-3 mr-2" />
                                Schedule
                              </Button>
                              <Button size="sm" variant="outline">
                                <Mail className="h-3 w-3 mr-2" />
                                Email
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Report Visualization */}
      {selectedCategory === 'financial' && reportData.financial && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue, expenses, and profit trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.financial}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Reports */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Recently generated reports</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((report) => {
                  const category = Object.entries(REPORT_CATEGORIES).find(
                    ([key]) => key === report.category
                  )?.[1];
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {category && <category.icon className={`h-4 w-4 ${category.color}`} />}
                          <span>{category?.title || report.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                                                        <ClientOnly fallback="--/--/----">{formatDateTime(report.generated_at)}</ClientOnly>
                      </TableCell>
                      <TableCell>{report.generated_by}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            report.status === 'completed' ? 'success' :
                            report.status === 'processing' ? 'warning' :
                            'destructive'
                          }
                        >
                          {report.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {report.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {report.status === 'completed' && (
                            <>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scheduled Reports */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Automated report generation schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledReports.map((report) => {
                  const category = Object.entries(REPORT_CATEGORIES).find(
                    ([key]) => key === report.category
                  )?.[1];
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {category && <category.icon className={`h-4 w-4 ${category.color}`} />}
                          <span>{category?.title || report.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>{report.schedule}</TableCell>
                      <TableCell>
                                                        <ClientOnly fallback="--/--/----">{formatDateTime(report.next_run)}</ClientOnly>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report.recipients.slice(0, 2).map((email, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {email.split('@')[0]}
                            </Badge>
                          ))}
                          {report.recipients.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{report.recipients.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost">
                            Pause
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}