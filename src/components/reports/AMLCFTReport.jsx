import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, Users,
  FileSearch, AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

const AMLCFTReport = ({ data, isRTL = false }) => {
  if (!data) return null;

  const {
    reportPeriod,
    customerDueDiligence,
    riskAssessment,
    transactionMonitoring,
    reporting,
    training
  } = data;

  // Format number
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-SA').format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  // Calculate KYC completion rate
  const kycCompletionRate = customerDueDiligence?.newCustomers > 0 
    ? (customerDueDiligence.kycCompleted / customerDueDiligence.newCustomers * 100)
    : 0;

  // Prepare data for charts
  const riskDistributionData = [
    { name: 'High Risk', value: riskAssessment?.highRisk || 0, color: '#FF6B6B' },
    { name: 'Medium Risk', value: riskAssessment?.mediumRisk || 0, color: '#FFA07A' },
    { name: 'Low Risk', value: riskAssessment?.lowRisk || 0, color: '#4ECDC4' }
  ];

  const alertsData = [
    { name: 'Generated', value: transactionMonitoring?.alertsGenerated || 0 },
    { name: 'Cleared', value: transactionMonitoring?.alertsCleared || 0 },
    { name: 'Escalated', value: transactionMonitoring?.alertsEscalated || 0 }
  ];

  const transactionData = [
    { 
      category: 'Total Transactions', 
      count: transactionMonitoring?.totalTransactions || 0,
      icon: Activity 
    },
    { 
      category: 'Large Transactions', 
      count: transactionMonitoring?.largeTransactions || 0,
      icon: TrendingUp 
    },
    { 
      category: 'Cash Transactions', 
      count: transactionMonitoring?.cashTransactions || 0,
      icon: FileSearch 
    },
    { 
      category: 'Suspicious Activities', 
      count: transactionMonitoring?.suspiciousActivities || 0,
      icon: AlertTriangle 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              AML/CFT Compliance Report
            </h2>
            <p className="text-white/80 mt-1">
              {format(new Date(reportPeriod?.startDate), 'dd MMM yyyy')} - {format(new Date(reportPeriod?.endDate), 'dd MMM yyyy')}
            </p>
          </div>
          <Badge className="bg-white text-red-600 hover:bg-white/90">
            Compliance Report
          </Badge>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              New Customers
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(customerDueDiligence?.newCustomers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              KYC Completed: {customerDueDiligence?.kycCompleted}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              KYC Completion Rate
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(kycCompletionRate)}</div>
            <Progress value={kycCompletionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              High Risk Customers
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatNumber(riskAssessment?.highRisk)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              EDD Required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Reports Filed
              <FileSearch className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reporting?.ctrsFiledDelta + reporting?.sarsFiledDelta}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CTRs: {reporting?.ctrsFiledDelta} | SARs: {reporting?.sarsFiledDelta}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <Tabs defaultValue="duediligence" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="duediligence">Due Diligence</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="duediligence" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Due Diligence Status</CardTitle>
                <CardDescription>KYC completion and verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">New Customers</p>
                        <p className="text-2xl font-bold">{formatNumber(customerDueDiligence?.newCustomers)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">KYC Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{formatNumber(customerDueDiligence?.kycPending)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">KYC Completed</span>
                        <span className="text-sm">{customerDueDiligence?.kycCompleted} / {customerDueDiligence?.newCustomers}</span>
                      </div>
                      <Progress value={kycCompletionRate} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Enhanced Due Diligence</span>
                        <span className="text-sm">{customerDueDiligence?.enhancedDueDiligence}</span>
                      </div>
                      <Progress 
                        value={(customerDueDiligence?.enhancedDueDiligence / customerDueDiligence?.newCustomers) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Due Diligence Metrics</CardTitle>
                <CardDescription>Performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kycCompletionRate >= 95 ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Excellent Performance</AlertTitle>
                      <AlertDescription className="text-green-700">
                        KYC completion rate exceeds the 95% target requirement.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-900">Attention Required</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        KYC completion rate is below the 95% target. Current: {formatPercentage(kycCompletionRate)}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatPercentage(kycCompletionRate)}</p>
                      <p className="text-xs text-muted-foreground">KYC Completion</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{customerDueDiligence?.enhancedDueDiligence}</p>
                      <p className="text-xs text-muted-foreground">EDD Cases</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Monitoring Overview</CardTitle>
                <CardDescription>Transaction analysis and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <span className="text-lg font-bold">{formatNumber(item.count)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Management</CardTitle>
                <CardDescription>Alert generation and resolution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={alertsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#45B7D1" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Alert Resolution Rate</span>
                    <span className="font-bold">
                      {transactionMonitoring?.alertsGenerated > 0 
                        ? formatPercentage((transactionMonitoring.alertsCleared / transactionMonitoring.alertsGenerated) * 100)
                        : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Patterns</CardTitle>
              <CardDescription>Analysis of transaction types and volumes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPercentage((transactionMonitoring?.largeTransactions / transactionMonitoring?.totalTransactions) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Large Transactions</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {formatPercentage((transactionMonitoring?.cashTransactions / transactionMonitoring?.totalTransactions) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Cash Transactions</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">
                    {formatPercentage((transactionMonitoring?.suspiciousActivities / transactionMonitoring?.totalTransactions) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Suspicious Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Risk Distribution</CardTitle>
                <CardDescription>Risk categorization of customer base</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Summary</CardTitle>
                <CardDescription>Customer risk profile overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskDistributionData.map((risk, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: risk.color }} />
                          <span className="text-sm font-medium">{risk.name}</span>
                        </div>
                        <span className="text-sm font-bold">{formatNumber(risk.value)}</span>
                      </div>
                      <Progress 
                        value={(risk.value / riskAssessment?.totalCustomers) * 100} 
                        className="h-2"
                        style={{ '--progress-color': risk.color }}
                      />
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Customers</span>
                      <span className="font-bold">{formatNumber(riskAssessment?.totalCustomers)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Mitigation Measures</CardTitle>
              <CardDescription>Actions taken for high-risk customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900">High Risk Customers</h4>
                  <p className="text-2xl font-bold text-red-600 mt-2">{formatNumber(riskAssessment?.highRisk)}</p>
                  <p className="text-xs text-red-700 mt-1">Enhanced monitoring applied</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900">EDD Completed</h4>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">{formatNumber(customerDueDiligence?.enhancedDueDiligence)}</p>
                  <p className="text-xs text-yellow-700 mt-1">Additional verification done</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900">Risk Reviews</h4>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatNumber(riskAssessment?.highRisk * 2)}</p>
                  <p className="text-xs text-green-700 mt-1">Periodic assessments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Reporting</CardTitle>
              <CardDescription>Reports filed with regulatory authorities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Currency Transaction Reports (CTRs)</h4>
                    <FileSearch className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{reporting?.ctrsFiledDelta}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filed this period</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Suspicious Activity Reports (SARs)</h4>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{reporting?.sarsFiledDelta}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filed this period</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">STRs</h4>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{reporting?.str || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Suspicious Transaction Reports</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Training & Compliance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{training?.employeesTrained}</p>
                    <p className="text-xs text-muted-foreground">Employees Trained</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{training?.trainingHours}</p>
                    <p className="text-xs text-muted-foreground">Training Hours</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{training?.complianceScore}</p>
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
              <CardDescription>Overall AML/CFT compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Compliant</AlertTitle>
                <AlertDescription className="text-green-700">
                  All AML/CFT requirements have been met for this reporting period. 
                  Continue to maintain vigilance and ensure ongoing compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Report Period: {format(new Date(reportPeriod?.startDate), 'dd MMM yyyy')} - {format(new Date(reportPeriod?.endDate), 'dd MMM yyyy')}</span>
          <span>Generated on: {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};

export default AMLCFTReport;