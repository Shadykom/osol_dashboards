import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle,
  Phone, Clock, CheckCircle, XCircle, Activity, Award, Building2,
  FileText, Zap, Shield, Eye, Download, RefreshCw, Calendar
} from 'lucide-react';

const ExecutiveCollectionDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const kpiData = {
    totalOutstanding: 850000000,
    totalOutstandingChange: 12.5,
    collectionTarget: 120000000,
    collectionAchievement: 95000000,
    achievementRate: 79.2,
    npfRate: 4.8,
    npfRateChange: -0.3,
    recoveryRate: 68.5,
    recoveryRateChange: 2.1,
    activeAccounts: 45320,
    activeAccountsChange: -5.2
  };

  const top10Defaulters = [
    { name: 'Al-Rashid Corporation', amount: 12500000, dpd: 180, priority: 'CRITICAL' },
    { name: 'Jazeera Trading Co.', amount: 8900000, dpd: 150, priority: 'HIGH' },
    { name: 'Desert Palm Industries', amount: 7200000, dpd: 120, priority: 'HIGH' },
    { name: 'Gulf Star Holdings', amount: 6800000, dpd: 95, priority: 'MEDIUM' },
    { name: 'Oasis Development', amount: 5500000, dpd: 88, priority: 'MEDIUM' },
    { name: 'Falcon Enterprises', amount: 4900000, dpd: 75, priority: 'MEDIUM' },
    { name: 'Noor Finance Group', amount: 4200000, dpd: 65, priority: 'LOW' },
    { name: 'Horizon Tech Solutions', amount: 3800000, dpd: 60, priority: 'LOW' },
    { name: 'Pearl Investment LLC', amount: 3500000, dpd: 55, priority: 'LOW' },
    { name: 'Crescent Moon Trading', amount: 3200000, dpd: 50, priority: 'LOW' }
  ];

  const branchPerformance = [
    { branch: 'Riyadh Main', target: 25000000, achieved: 22000000, rate: 88 },
    { branch: 'Jeddah Central', target: 20000000, achieved: 19500000, rate: 97.5 },
    { branch: 'Dammam', target: 18000000, achieved: 14500000, rate: 80.6 },
    { branch: 'Khobar', target: 15000000, achieved: 13200000, rate: 88 },
    { branch: 'Makkah', target: 12000000, achieved: 9800000, rate: 81.7 },
    { branch: 'Madinah', target: 10000000, achieved: 8500000, rate: 85 }
  ];

  const portfolioHealthScore = {
    overall: 72,
    components: [
      { name: 'Collection Efficiency', score: 78, weight: 30 },
      { name: 'Risk Management', score: 65, weight: 25 },
      { name: 'Customer Contact', score: 82, weight: 20 },
      { name: 'Digital Adoption', score: 70, weight: 15 },
      { name: 'Compliance', score: 68, weight: 10 }
    ]
  };

  const npfTrend = [
    { month: 'Jan', rate: 5.2, amount: 780000000 },
    { month: 'Feb', rate: 5.1, amount: 770000000 },
    { month: 'Mar', rate: 5.3, amount: 795000000 },
    { month: 'Apr', rate: 5.0, amount: 750000000 },
    { month: 'May', rate: 4.9, amount: 735000000 },
    { month: 'Jun', rate: 4.8, amount: 720000000 },
    { month: 'Jul', rate: 4.8, amount: 850000000 }
  ];

  const bucketDistribution = [
    { name: 'Current', value: 35, amount: 297500000 },
    { name: '1-30 DPD', value: 25, amount: 212500000 },
    { name: '31-60 DPD', value: 20, amount: 170000000 },
    { name: '61-90 DPD', value: 12, amount: 102000000 },
    { name: '90+ DPD', value: 8, amount: 68000000 }
  ];

  const strategicInitiatives = [
    { 
      name: 'Digital Collection Enhancement', 
      progress: 75, 
      impact: 'HIGH',
      status: 'ON_TRACK',
      target: 'Increase digital collections by 40%'
    },
    { 
      name: 'AI-Powered Risk Scoring', 
      progress: 60, 
      impact: 'MEDIUM',
      status: 'AT_RISK',
      target: 'Reduce default rate by 15%'
    },
    { 
      name: 'Field Force Optimization', 
      progress: 85, 
      impact: 'HIGH',
      status: 'ON_TRACK',
      target: 'Improve field collection efficiency by 30%'
    },
    { 
      name: 'Customer Segmentation', 
      progress: 90, 
      impact: 'MEDIUM',
      status: 'COMPLETED',
      target: 'Personalized collection strategies'
    }
  ];

  const riskIndicators = [
    { indicator: 'First Payment Default Rate', value: 2.3, threshold: 3.0, status: 'GOOD' },
    { indicator: 'Roll Rate (30-60)', value: 15.2, threshold: 12.0, status: 'WARNING' },
    { indicator: 'Customer Contact Rate', value: 68.5, threshold: 70.0, status: 'WARNING' },
    { indicator: 'PTP Keep Rate', value: 82.3, threshold: 80.0, status: 'GOOD' },
    { indicator: 'Legal Success Rate', value: 45.8, threshold: 50.0, status: 'CRITICAL' }
  ];

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'CRITICAL': 'bg-red-500',
      'HIGH': 'bg-orange-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500'
    };
    return <Badge className={`${colors[priority]} text-white`}>{priority}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'GOOD':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Collection Dashboard</h1>
          <p className="text-gray-600 mt-1">High-level overview for C-suite executives</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="riyadh">Riyadh Main</SelectItem>
              <SelectItem value="jeddah">Jeddah Central</SelectItem>
              <SelectItem value="dammam">Dammam</SelectItem>
              <SelectItem value="khobar">Khobar</SelectItem>
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
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData.totalOutstanding)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getChangeIcon(kpiData.totalOutstandingChange)}
              <span className={kpiData.totalOutstandingChange > 0 ? 'text-red-500' : 'text-green-500'}>
                {Math.abs(kpiData.totalOutstandingChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.achievementRate}%</div>
            <Progress value={kpiData.achievementRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpiData.collectionAchievement)} / {formatCurrency(kpiData.collectionTarget)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPF Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.npfRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getChangeIcon(kpiData.npfRateChange)}
              <span className={kpiData.npfRateChange < 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(kpiData.npfRateChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.recoveryRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getChangeIcon(kpiData.recoveryRateChange)}
              <span className={kpiData.recoveryRateChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(kpiData.recoveryRateChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NPF Trend */}
            <Card>
              <CardHeader>
                <CardTitle>NPF Rate Trend</CardTitle>
                <CardDescription>Non-performing finance rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={npfTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="right" dataKey="amount" fill="#E6B800" name="NPF Amount" />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="NPF Rate (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Portfolio Health Score */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Health Score</CardTitle>
                <CardDescription>Overall collection portfolio health assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold">{portfolioHealthScore.overall}</div>
                  <p className="text-sm text-gray-600">Overall Score</p>
                </div>
                <div className="space-y-3">
                  {portfolioHealthScore.components.map((component) => (
                    <div key={component.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{component.name}</span>
                        <span className="text-sm">{component.score}%</span>
                      </div>
                      <Progress value={component.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Defaulters */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Defaulters</CardTitle>
              <CardDescription>Largest outstanding amounts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Customer</th>
                      <th className="text-right py-2">Outstanding</th>
                      <th className="text-center py-2">DPD</th>
                      <th className="text-center py-2">Priority</th>
                      <th className="text-center py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Defaulters.map((defaulter, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">{defaulter.name}</td>
                        <td className="text-right font-bold text-red-600">{formatCurrency(defaulter.amount)}</td>
                        <td className="text-center">{defaulter.dpd} days</td>
                        <td className="text-center">{getPriorityBadge(defaulter.priority)}</td>
                        <td className="text-center">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bucket Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Distribution by Bucket</CardTitle>
                <CardDescription>Outstanding amounts by delinquency buckets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bucketDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bucketDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branch-wise Collection Performance</CardTitle>
                <CardDescription>Collection achievement by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {branchPerformance.map((branch) => (
                    <div key={branch.branch}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{branch.branch}</span>
                        <span className="text-sm">{branch.rate}%</span>
                      </div>
                      <Progress value={branch.rate} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">
                        {formatCurrency(branch.achieved)} / {formatCurrency(branch.target)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance metrics content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Calls Made</span>
                    <span className="font-bold">45,892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Contact Rate</span>
                    <span className="font-bold">68.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Promise Rate</span>
                    <span className="font-bold">42.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Call Time</span>
                    <span className="font-bold">3:45</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Field Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Visits Completed</span>
                    <span className="font-bold">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-bold">72.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Amount Collected</span>
                    <span className="font-bold">{formatCurrency(8500000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost per Visit</span>
                    <span className="font-bold">SAR 125</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Digital Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">SMS Sent</span>
                    <span className="font-bold">125,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Email Campaigns</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Digital Payments</span>
                    <span className="font-bold">{formatCurrency(12500000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Self-Service Rate</span>
                    <span className="font-bold">28.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {/* Risk Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Key Risk Indicators</CardTitle>
              <CardDescription>Critical metrics requiring management attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskIndicators.map((indicator) => (
                  <div key={indicator.indicator} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(indicator.status)}
                      <div>
                        <p className="font-medium">{indicator.indicator}</p>
                        <p className="text-sm text-gray-600">Threshold: {indicator.threshold}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        indicator.status === 'GOOD' ? 'text-green-600' :
                        indicator.status === 'WARNING' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {indicator.value}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          {/* Strategic Initiatives */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Initiatives Progress</CardTitle>
              <CardDescription>Key collection improvement programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategicInitiatives.map((initiative) => (
                  <div key={initiative.name} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{initiative.name}</h4>
                        <p className="text-sm text-gray-600">{initiative.target}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={initiative.status === 'ON_TRACK' ? 'default' : 
                                       initiative.status === 'AT_RISK' ? 'destructive' : 'secondary'}>
                          {initiative.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          Impact: {initiative.impact}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={initiative.progress} className="h-2" />
                    <p className="text-sm text-gray-600 mt-1">{initiative.progress}% Complete</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SAMA Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">NPF Reporting</span>
                    <Badge className="bg-green-500 text-white">Compliant</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Provision Coverage</span>
                    <Badge className="bg-green-500 text-white">125%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Collection Practices</span>
                    <Badge className="bg-green-500 text-white">Compliant</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Protection</span>
                    <Badge className="bg-yellow-500 text-white">1 Violation</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sharia Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Late Payment Charges</span>
                    <span className="font-bold">{formatCurrency(450000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Charity Distribution</span>
                    <Badge className="bg-green-500 text-white">Completed</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Rate</span>
                    <span className="font-bold">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('common.pendingReviews')}</span>
                    <span className="font-bold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveCollectionDashboard;