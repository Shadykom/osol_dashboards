import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSearch,
  UserCheck,
  Lock,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
  Users,
  Building2,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884D8'];

const COMPLIANCE_AREAS = {
  aml: { label: 'AML/CFT', icon: Shield, color: 'text-blue-500' },
  kyc: { label: 'KYC', icon: UserCheck, color: 'text-green-500' },
  regulatory: { label: 'Regulatory', icon: Building2, color: 'text-purple-500' },
  data: { label: 'Data Privacy', icon: Lock, color: 'text-orange-500' },
  financial: { label: 'Financial', icon: FileText, color: 'text-indigo-500' }
};

const RISK_LEVELS = {
  low: { label: 'Low Risk', color: 'text-green-500', bgColor: 'bg-green-100' },
  medium: { label: 'Medium Risk', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  high: { label: 'High Risk', color: 'text-red-500', bgColor: 'bg-red-100' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-200' }
};

export function Compliance() {
  const { t } = useTranslation();
  const [complianceStats, setComplianceStats] = useState({
    overallScore: 0,
    amlScore: 0,
    kycScore: 0,
    regulatoryScore: 0,
    dataPrivacyScore: 0,
    pendingReviews: 0,
    flaggedTransactions: 0,
    openIssues: 0,
    resolvedIssues: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [complianceTrends, setComplianceTrends] = useState([]);
  const [kycStatus, setKycStatus] = useState({
    verified: 0,
    pending: 0,
    expired: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplianceData();
    fetchAlerts();
    fetchAuditTrail();
    fetchRiskAssessments();
  }, [selectedArea]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      
      // Mock compliance scores
      const scores = {
        overallScore: 88,
        amlScore: 92,
        kycScore: 85,
        regulatoryScore: 90,
        dataPrivacyScore: 87,
        pendingReviews: 23,
        flaggedTransactions: 7,
        openIssues: 12,
        resolvedIssues: 145
      };

      // Mock KYC status
      const kyc = {
        verified: 42567,
        pending: 1234,
        expired: 567,
        rejected: 89
      };

      // Mock compliance trends
      const trends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        trends.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          overallScore: 85 + Math.random() * 10,
          amlScore: 88 + Math.random() * 10,
          kycScore: 82 + Math.random() * 10,
          issues: Math.floor(Math.random() * 20) + 5
        });
      }

      setComplianceStats(scores);
      setKycStatus(kyc);
      setComplianceTrends(trends);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      // Mock alerts data
      const mockAlerts = [
        {
          id: 1,
          type: 'aml',
          severity: 'high',
          title: 'Suspicious Transaction Pattern Detected',
          description: 'Multiple high-value transactions from account ACC-2345 within 24 hours',
          timestamp: new Date().toISOString(),
          status: 'open'
        },
        {
          id: 2,
          type: 'kyc',
          severity: 'medium',
          title: 'KYC Documents Expiring Soon',
          description: '45 customer KYC documents will expire within the next 30 days',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'open'
        },
        {
          id: 3,
          type: 'regulatory',
          severity: 'critical',
          title: 'SAMA Reporting Deadline Approaching',
          description: 'Monthly SAMA compliance report due in 2 days',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'acknowledged'
        },
        {
          id: 4,
          type: 'data',
          severity: 'low',
          title: 'Data Retention Policy Review',
          description: 'Quarterly review of data retention policies is due',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'resolved'
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      // Mock audit trail
      const mockAudit = [
        {
          id: 1,
          action: 'KYC Verification Completed',
          user: 'Compliance Officer',
          timestamp: new Date().toISOString(),
          details: 'Customer ID: CUST-12345',
          status: 'success'
        },
        {
          id: 2,
          action: 'AML Alert Reviewed',
          user: 'Risk Analyst',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          details: 'Alert ID: AML-789, Status: False Positive',
          status: 'info'
        },
        {
          id: 3,
          action: 'Regulatory Report Submitted',
          user: 'System',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'SAMA Monthly Report - November 2024',
          status: 'success'
        },
        {
          id: 4,
          action: 'High Risk Transaction Flagged',
          user: 'AML System',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'Transaction ID: TXN-45678, Amount: SAR 250,000',
          status: 'warning'
        }
      ];

      setAuditTrail(mockAudit);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      // Mock risk assessments
      const mockRisks = [
        { customer: 'ABC Corporation', riskLevel: 'high', score: 78, lastAssessment: '2024-01-15' },
        { customer: 'XYZ Trading', riskLevel: 'medium', score: 45, lastAssessment: '2024-01-10' },
        { customer: 'Global Imports Ltd', riskLevel: 'low', score: 22, lastAssessment: '2024-01-08' },
        { customer: 'Tech Solutions Inc', riskLevel: 'medium', score: 52, lastAssessment: '2024-01-05' },
        { customer: 'Finance Partners', riskLevel: 'critical', score: 92, lastAssessment: '2024-01-03' }
      ];

      setRiskAssessments(mockRisks);
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
    }
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

  const ScoreCard = ({ title, score, icon: Icon, color, subtitle }) => {
    const getScoreColor = (score) => {
      if (score >= 90) return 'text-green-500';
      if (score >= 80) return 'text-blue-500';
      if (score >= 70) return 'text-yellow-500';
      return 'text-red-500';
    };

    return (
      <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            <Progress value={score} className="mt-2" />
          </CardContent>
          <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`} />
        </Card>
      </motion.div>
    );
  };

  const filteredAlerts = alerts.filter(alert => 
    selectedArea === 'all' || alert.type === selectedArea
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
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">Monitor regulatory compliance and risk management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Data refreshed')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => toast.info('Export functionality coming soon')}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'critical' && a.status === 'open').length > 0 && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Compliance Alert</AlertTitle>
            <AlertDescription>
              {alerts.find(a => a.severity === 'critical' && a.status === 'open')?.description}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Compliance Scores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ScoreCard
          title="Overall Compliance"
          score={complianceStats.overallScore}
          icon={Shield}
          color="text-blue-500"
          subtitle="Across all areas"
        />
        <ScoreCard
          title="AML/CFT"
          score={complianceStats.amlScore}
          icon={Shield}
          color="text-green-500"
          subtitle="Anti-money laundering"
        />
        <ScoreCard
          title="KYC Compliance"
          score={complianceStats.kycScore}
          icon={UserCheck}
          color="text-purple-500"
          subtitle="Know your customer"
        />
        <ScoreCard
          title="Regulatory"
          score={complianceStats.regulatoryScore}
          icon={Building2}
          color="text-orange-500"
          subtitle="SAMA compliance"
        />
        <ScoreCard
          title="Data Privacy"
          score={complianceStats.dataPrivacyScore}
          icon={Lock}
          color="text-indigo-500"
          subtitle="GDPR & local laws"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('common.pendingReviews')}</CardTitle>
              <FileSearch className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStats.flaggedTransactions}</div>
              <p className="text-xs text-muted-foreground">Under investigation</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStats.openIssues}</div>
              <p className="text-xs text-muted-foreground">Active cases</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceStats.resolvedIssues}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Compliance Trends & KYC Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score Trends</CardTitle>
              <CardDescription>Monthly compliance performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={complianceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overallScore" stroke="#8884d8" name="Overall" strokeWidth={2} />
                  <Line type="monotone" dataKey="amlScore" stroke="#82ca9d" name="AML" strokeWidth={2} />
                  <Line type="monotone" dataKey="kycScore" stroke="#ffc658" name="KYC" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>KYC Status Distribution</CardTitle>
              <CardDescription>Customer verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Verified', value: kycStatus.verified, color: '#00C49F' },
                      { name: 'Pending', value: kycStatus.pending, color: '#FFBB28' },
                      { name: 'Expired', value: kycStatus.expired, color: '#FF8042' },
                      { name: 'Rejected', value: kycStatus.rejected, color: '#FF0000' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Verified', value: kycStatus.verified, color: '#00C49F' },
                      { name: 'Pending', value: kycStatus.pending, color: '#FFBB28' },
                      { name: 'Expired', value: kycStatus.expired, color: '#FF8042' },
                      { name: 'Rejected', value: kycStatus.rejected, color: '#FF0000' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Verified</span>
                  <Badge variant="success">{kycStatus.verified.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('common.pending')}</span>
                  <Badge variant="warning">{kycStatus.pending.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expired</span>
                  <Badge variant="destructive">{kycStatus.expired.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected</span>
                  <Badge variant="destructive">{kycStatus.rejected.toLocaleString()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Compliance Alerts */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Compliance Alerts</CardTitle>
                <CardDescription>Recent compliance notifications and warnings</CardDescription>
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {Object.entries(COMPLIANCE_AREAS).map(([key, area]) => (
                    <SelectItem key={key} value={key}>{area.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const area = COMPLIANCE_AREAS[alert.type];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 p-4 rounded-lg border"
                  >
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'high' ? 'bg-orange-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <area.icon className={`h-4 w-4 ${area.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'destructive' :
                              alert.severity === 'medium' ? 'warning' :
                              'secondary'
                            }>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant={
                          alert.status === 'open' ? 'destructive' :
                          alert.status === 'acknowledged' ? 'warning' :
                          'success'
                        }>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Risk Assessments */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>High Risk Assessments</CardTitle>
            <CardDescription>Customers requiring enhanced due diligence</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Last Assessment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskAssessments
                  .filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical')
                  .map((assessment) => (
                    <TableRow key={assessment.customer}>
                      <TableCell className="font-medium">{assessment.customer}</TableCell>
                      <TableCell>
                        <Badge 
                          className={RISK_LEVELS[assessment.riskLevel].bgColor}
                          variant="outline"
                        >
                          <span className={RISK_LEVELS[assessment.riskLevel].color}>
                            {RISK_LEVELS[assessment.riskLevel].label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assessment.score}/100</span>
                          <Progress value={assessment.score} className="w-20" />
                        </div>
                      </TableCell>
                      <TableCell>{new Date(assessment.lastAssessment).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audit Trail */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Recent compliance activities and actions</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View Full Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    entry.status === 'success' ? 'bg-green-500' :
                    entry.status === 'warning' ? 'bg-yellow-500' :
                    entry.status === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-sm text-muted-foreground">{entry.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}