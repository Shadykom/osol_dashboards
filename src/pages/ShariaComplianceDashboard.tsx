import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, DollarSign, Heart,
  FileText, Users, TrendingUp, Calendar, Scale, BookOpen,
  Building2, HandHeart, AlertCircle, Award, Activity
} from 'lucide-react';

const ShariaComplianceDashboard = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data for Sharia compliance
  const complianceMetrics = {
    overview: {
      complianceRate: 98.5,
      latePaymentCharges: 450000,
      charityDistributed: 425000,
      pendingDistribution: 25000,
      violations: 2,
      approvedMethods: 8,
      contractsReviewed: 145,
      correctiveActions: 3
    },
    latePaymentAnalysis: {
      totalCollected: 450000,
      distributionStatus: [
        { charity: 'Charity Foundation A', amount: 150000, status: 'DISTRIBUTED', date: '2024-06-30' },
        { charity: 'Charity Foundation B', amount: 125000, status: 'DISTRIBUTED', date: '2024-06-28' },
        { charity: 'Charity Foundation C', amount: 100000, status: 'DISTRIBUTED', date: '2024-06-25' },
        { charity: 'Charity Foundation D', amount: 50000, status: 'DISTRIBUTED', date: '2024-06-20' },
        { charity: 'Charity Foundation E', amount: 25000, status: 'PENDING', date: null }
      ],
      monthlyTrend: [
        { month: 'Jan', collected: 380000, distributed: 380000 },
        { month: 'Feb', collected: 420000, distributed: 420000 },
        { month: 'Mar', collected: 395000, distributed: 395000 },
        { month: 'Apr', collected: 410000, distributed: 410000 },
        { month: 'May', collected: 435000, distributed: 435000 },
        { month: 'Jun', collected: 450000, distributed: 425000 }
      ]
    },
    collectionMethods: {
      approved: [
        { method: 'Polite phone reminders', usage: 45, compliance: 100 },
        { method: 'Written notices', usage: 25, compliance: 100 },
        { method: 'Personal visits with respect', usage: 15, compliance: 98 },
        { method: 'Negotiation and settlement', usage: 10, compliance: 100 },
        { method: 'Legal action (last resort)', usage: 5, compliance: 100 }
      ],
      violations: [
        { date: '2024-06-15', method: 'Phone call during prayer time', officer: 'Ahmed Hassan', action: 'Warning issued' },
        { date: '2024-06-10', method: 'Aggressive tone reported', officer: 'Omar Khalid', action: 'Training required' }
      ]
    },
    contractCompliance: {
      totalContracts: 5420,
      compliantContracts: 5380,
      nonCompliantContracts: 40,
      categories: [
        { category: 'Auto Finance', total: 2150, compliant: 2140, rate: 99.5 },
        { category: 'Personal Finance', total: 1850, compliant: 1830, rate: 98.9 },
        { category: 'Home Finance', total: 980, compliant: 975, rate: 99.5 },
        { category: 'SME Finance', total: 440, compliant: 435, rate: 98.9 }
      ]
    },
    auditFindings: {
      lastAudit: '2024-06-01',
      nextAudit: '2024-09-01',
      findings: [
        { area: 'Late payment handling', status: 'COMPLIANT', score: 98 },
        { area: 'Contract documentation', status: 'COMPLIANT', score: 99 },
        { area: 'Collection practices', status: 'MINOR_ISSUES', score: 95 },
        { area: 'Charity distribution', status: 'COMPLIANT', score: 100 },
        { area: 'Staff training', status: 'IMPROVEMENT_NEEDED', score: 88 }
      ]
    },
    charityPartners: [
      { name: 'Charity Foundation A', category: 'Education', distributed: 850000, since: '2020' },
      { name: 'Charity Foundation B', category: 'Healthcare', distributed: 720000, since: '2019' },
      { name: 'Charity Foundation C', category: 'Poverty Alleviation', distributed: 680000, since: '2021' },
      { name: 'Charity Foundation D', category: 'Community Development', distributed: 450000, since: '2022' }
    ]
  };

  const approvedCollectionMethods = [
    'Polite and respectful phone reminders',
    'Written notices via mail or email',
    'Personal visits conducted with dignity',
    'Flexible negotiation and settlement offers',
    'Legal action only as last resort',
    'No harassment or public shaming',
    'No collection during prayer times',
    'Respectful treatment of all customers'
  ];

  const shariaGuidelines = [
    { principle: 'No Riba (Interest)', description: 'All contracts must be free from interest-based transactions', compliance: 100 },
    { principle: 'No Gharar (Uncertainty)', description: 'Clear terms and conditions in all contracts', compliance: 99 },
    { principle: 'No Haram Activities', description: 'Financing only for permissible activities', compliance: 100 },
    { principle: 'Profit and Loss Sharing', description: 'Fair distribution of risks and rewards', compliance: 98 },
    { principle: 'Asset-Backed Financing', description: 'All financing tied to real assets', compliance: 99 }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getComplianceColor = (rate) => {
    if (rate >= 98) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    const config = {
      'COMPLIANT': { color: 'bg-green-500', text: 'Compliant' },
      'MINOR_ISSUES': { color: 'bg-yellow-500', text: 'Minor Issues' },
      'IMPROVEMENT_NEEDED': { color: 'bg-orange-500', text: 'Needs Improvement' },
      'NON_COMPLIANT': { color: 'bg-red-500', text: 'Non-Compliant' },
      'DISTRIBUTED': { color: 'bg-green-500', text: 'Distributed' },
      'PENDING': { color: 'bg-yellow-500', text: 'Pending' }
    };
    const cfg = config[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={`${cfg.color} text-white`}>{cfg.text}</Badge>;
  };

  const COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sharia Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor Islamic finance compliance and charity distribution</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="late_payment">Late Payment Charges</SelectItem>
              <SelectItem value="collection_methods">Collection Methods</SelectItem>
              <SelectItem value="contracts">Contract Compliance</SelectItem>
              <SelectItem value="charity">Charity Distribution</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Alert */}
      {complianceMetrics.overview.violations > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Compliance Review Required</AlertTitle>
          <AlertDescription>
            {complianceMetrics.overview.violations} compliance violations detected this period. 
            Immediate review and corrective actions required.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(complianceMetrics.overview.complianceRate)}`}>
              {complianceMetrics.overview.complianceRate}%
            </div>
            <Progress value={complianceMetrics.overview.complianceRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Late Payment Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(complianceMetrics.overview.latePaymentCharges)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              To be distributed to charity
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Charity Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(complianceMetrics.overview.charityDistributed)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(complianceMetrics.overview.pendingDistribution)} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contracts Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.overview.contractsReviewed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This {selectedPeriod}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="late_payment">Late Payment</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="charity">Charity</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Sharia Principles Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Sharia Principles Compliance
              </CardTitle>
              <CardDescription>Adherence to Islamic finance principles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shariaGuidelines.map((guideline, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{guideline.principle}</h4>
                        <p className="text-sm text-gray-600">{guideline.description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getComplianceColor(guideline.compliance)}`}>
                          {guideline.compliance}%
                        </div>
                      </div>
                    </div>
                    <Progress value={guideline.compliance} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Overview Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trend</CardTitle>
                <CardDescription>Monthly compliance rate progression</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', rate: 97.5 },
                    { month: 'Feb', rate: 97.8 },
                    { month: 'Mar', rate: 98.0 },
                    { month: 'Apr', rate: 98.2 },
                    { month: 'May', rate: 98.3 },
                    { month: 'Jun', rate: 98.5 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[95, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('common.approvedMethods')}</CardTitle>
                <CardDescription>Sharia-compliant collection practices</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {approvedCollectionMethods.map((method, index) => (
                      <div key={index} className="flex items-start gap-2 p-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <p className="text-sm">{method}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="late_payment" className="space-y-4">
          {/* Late Payment Charges Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Late Payment Charges Management</CardTitle>
              <CardDescription>Collection and distribution to charity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceMetrics.latePaymentAnalysis.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collected" fill="#eab308" name="Collected" />
                  <Bar dataKey="distributed" fill="#22c55e" name="Distributed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution Status */}
          <Card>
            <CardHeader>
              <CardTitle>Charity Distribution Status</CardTitle>
              <CardDescription>Late payment charges distribution tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceMetrics.latePaymentAnalysis.distributionStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.charity}</p>
                      <p className="text-sm text-gray-600">
                        {item.status === 'DISTRIBUTED' ? `Distributed on ${formatDate(item.date)}` : 'Awaiting distribution'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatCurrency(item.amount)}</span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('common.totalPendingDistribution')}</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(complianceMetrics.overview.pendingDistribution)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          {/* Collection Methods Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Methods Usage</CardTitle>
              <CardDescription>Breakdown of collection approaches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={complianceMetrics.collectionMethods.approved}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, usage }) => `${method}: ${usage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {complianceMetrics.collectionMethods.approved.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compliance Violations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Collection Method Violations
              </CardTitle>
              <CardDescription>Non-compliant collection practices</CardDescription>
            </CardHeader>
            <CardContent>
              {complianceMetrics.collectionMethods.violations.length > 0 ? (
                <div className="space-y-3">
                  {complianceMetrics.collectionMethods.violations.map((violation, index) => (
                    <div key={index} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{violation.method}</p>
                          <p className="text-sm text-gray-600">Officer: {violation.officer}</p>
                          <p className="text-sm text-gray-600">Date: {formatDate(violation.date)}</p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-100">
                          {violation.action}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No violations recorded this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          {/* Contract Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Compliance by Category</CardTitle>
              <CardDescription>Sharia-compliant contract verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceMetrics.contractCompliance.categories.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{category.category}</h4>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${getComplianceColor(category.rate)}`}>
                          {category.rate}%
                        </span>
                        <p className="text-sm text-gray-600">
                          {category.compliant}/{category.total} compliant
                        </p>
                      </div>
                    </div>
                    <Progress value={category.rate} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Contracts</p>
                    <p className="text-xl font-bold">{complianceMetrics.contractCompliance.totalContracts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Compliant</p>
                    <p className="text-xl font-bold text-green-600">{complianceMetrics.contractCompliance.compliantContracts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Non-Compliant</p>
                    <p className="text-xl font-bold text-red-600">{complianceMetrics.contractCompliance.nonCompliantContracts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charity" className="space-y-4">
          {/* Charity Partners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5" />
                {t('common.approvedCharityPartners')}
              </CardTitle>
              <CardDescription>Organizations receiving late payment charge distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceMetrics.charityPartners.map((partner, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{partner.name}</h4>
                        <Badge variant="outline" className="mt-1">{partner.category}</Badge>
                      </div>
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Distributed:</span>
                        <span className="font-medium">{formatCurrency(partner.distributed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Partner Since:</span>
                        <span className="font-medium">{partner.since}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Charity Distribution Impact</CardTitle>
              <CardDescription>Total contributions by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Education', amount: 850000 },
                  { category: 'Healthcare', amount: 720000 },
                  { category: 'Poverty Alleviation', amount: 680000 },
                  { category: 'Community Development', amount: 450000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Audit Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sharia Audit Overview</span>
                <div className="text-sm font-normal text-gray-600">
                  Next Audit: {formatDate(complianceMetrics.auditFindings.nextAudit)}
                </div>
              </CardTitle>
              <CardDescription>Latest audit findings and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Audit Date:</span>
                  <span className="font-medium">{formatDate(complianceMetrics.auditFindings.lastAudit)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {complianceMetrics.auditFindings.findings.map((finding, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {finding.status === 'COMPLIANT' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : finding.status === 'MINOR_ISSUES' ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                        <div>
                          <p className="font-medium">{finding.area}</p>
                          {getStatusBadge(finding.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getComplianceColor(finding.score)}`}>
                          {finding.score}%
                        </div>
                        <p className="text-sm text-gray-600">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Action Plan</CardTitle>
              <CardDescription>Corrective actions and improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Enhanced staff training on Sharia principles', status: 'IN_PROGRESS', deadline: '2024-07-15' },
                  { action: 'Update collection scripts for prayer time compliance', status: 'COMPLETED', deadline: '2024-06-30' },
                  { action: 'Review all existing contracts for compliance', status: 'PENDING', deadline: '2024-08-01' },
                  { action: 'Implement automated charity distribution system', status: 'IN_PROGRESS', deadline: '2024-07-30' }
                ].map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{action.action}</p>
                      <p className="text-sm text-gray-600">Deadline: {formatDate(action.deadline)}</p>
                    </div>
                    <Badge variant={
                      action.status === 'COMPLETED' ? 'default' :
                      action.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                    }>
                      {action.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShariaComplianceDashboard;