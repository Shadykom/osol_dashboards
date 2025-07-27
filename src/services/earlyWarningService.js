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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, Users, Activity, Bell, Shield,
  Eye, DollarSign, Calendar, Clock, Zap, Target, AlertCircle,
  ChevronRight, Filter, RefreshCw, FileWarning, UserX, Building2,
  Phone, Mail, Loader2
} from 'lucide-react';
import { EarlyWarningService } from '@/services/earlyWarningService';

const EarlyWarningDashboard = () => {
  const { t } = useTranslation();
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [selectedIndicator, setSelectedIndicator] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [criticalAccountsOpen, setCriticalAccountsOpen] = useState(false);
  const [criticalAccounts, setCriticalAccounts] = useState([]);
  const [loadingCritical, setLoadingCritical] = useState(false);

  // State for all data
  const [summary, setSummary] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    highRiskAccounts: 0,
    mediumRiskAccounts: 0,
    potentialLoss: 0,
    accountsMonitored: 0,
    alertsResolved: 0,
    falsePositives: 0
  });
  const [riskIndicators, setRiskIndicators] = useState(null);
  const [riskScoreTrend, setRiskScoreTrend] = useState([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState(null);
  const [alertsTimeline, setAlertsTimeline] = useState([]);
  const [actionableInsights, setActionableInsights] = useState([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryResult = await EarlyWarningService.getSummary();
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }

      // Fetch risk indicators based on filters
      const indicatorFilters = {
        riskLevel: selectedRiskLevel !== 'all' ? selectedRiskLevel : undefined,
        indicatorType: selectedIndicator !== 'all' ? selectedIndicator : undefined
      };
      
      const indicatorsResult = await EarlyWarningService.getAllRiskIndicators(indicatorFilters);
      if (indicatorsResult.success && indicatorsResult.data) {
        setRiskIndicators(indicatorsResult.data);
      }

      // Fetch risk score trends
      const trendsResult = await EarlyWarningService.getRiskScoreTrends();
      if (trendsResult.success && trendsResult.data) {
        setRiskScoreTrend(trendsResult.data);
      }

      // Fetch predictive analytics
      const predictiveResult = await EarlyWarningService.getPredictiveAnalytics();
      if (predictiveResult.success && predictiveResult.data) {
        setPredictiveAnalytics(predictiveResult.data);
      }

      // Fetch alerts timeline
      const alertsResult = await EarlyWarningService.getRealTimeAlerts({ limit: 10 });
      if (alertsResult.success && alertsResult.data) {
        setAlertsTimeline(alertsResult.data);
      }

      // Fetch actionable insights
      const insightsResult = await EarlyWarningService.getActionableInsights();
      if (insightsResult.success && insightsResult.data) {
        setActionableInsights(insightsResult.data);
      }
    } catch (error) {
      console.error('Error fetching early warning data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Handle view critical accounts
  const handleViewCriticalAccounts = async () => {
    setCriticalAccountsOpen(true);
    setLoadingCritical(true);
    
    const result = await EarlyWarningService.getCriticalAccounts({ limit: 50 });
    if (result.success && result.data) {
      setCriticalAccounts(result.data);
    }
    
    setLoadingCritical(false);
  };

  // Handle account click - navigate to collection cases
  const handleAccountClick = (account) => {
    // Navigate to collection case details
    window.location.href = `/collection/cases/${account.caseId}`;
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [selectedRiskLevel, selectedIndicator]);

  // Format functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getRiskColor = (level) => {
    const colors = {
      'CRITICAL': 'text-red-600',
      'HIGH': 'text-orange-600',
      'MEDIUM': 'text-yellow-600',
      'LOW': 'text-green-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      'CRITICAL': 'bg-red-500',
      'HIGH': 'bg-orange-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const getTrendIcon = (trend, changePercent) => {
    if (trend === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (trend === 'decreasing') {
      return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const COLORS = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Early Warning Dashboard</h1>
          <p className="text-gray-600 mt-1">Proactive risk detection and prevention system</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Indicator Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Indicators</SelectItem>
              <SelectItem value="payment">Payment Patterns</SelectItem>
              <SelectItem value="behavioral">Behavioral Changes</SelectItem>
              <SelectItem value="financial">Financial Stress</SelectItem>
              <SelectItem value="external">External Factors</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {summary.criticalAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Risk Alerts</AlertTitle>
          <AlertDescription>
            <div className="flex items-center justify-between mt-2">
              <span>{summary.criticalAlerts} accounts require immediate attention</span>
              <Button size="sm" variant="destructive" onClick={handleViewCriticalAccounts}>
                View Critical Accounts
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalAlerts)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-red-500 text-white text-xs">
                {summary.criticalAlerts} Critical
              </Badge>
              <Badge variant="outline" className="text-xs">
                {summary.alertsResolved} Resolved
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.highRiskAccounts)}</div>
            <Progress 
              value={(summary.highRiskAccounts / summary.accountsMonitored) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Potential Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.potentialLoss)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              If no action taken
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.accountsMonitored)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active accounts tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="indicators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="indicators">Risk Indicators</TabsTrigger>
          <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="trends">Risk Trends</TabsTrigger>
          <TabsTrigger value="actions">Action Center</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-4">
          {riskIndicators && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Payment Default */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileWarning className="h-5 w-5" />
                      First Payment Default
                    </span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(riskIndicators.firstPaymentDefault?.trend)}
                      <span className="text-sm font-normal">
                        {riskIndicators.firstPaymentDefault?.changePercent}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Accounts</p>
                      <p className="text-xl font-bold text-red-600">
                        {riskIndicators.firstPaymentDefault?.count || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Exposure</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(riskIndicators.firstPaymentDefault?.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {riskIndicators.firstPaymentDefault?.accounts?.slice(0, 3).map((account, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{account.customer_name}</p>
                          <p className="text-xs text-gray-600">{account.loan_account_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(account.loan_amount)}</p>
                          <Badge variant="destructive" className="text-xs">
                            Risk: {account.risk_score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Irregular Payment Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Irregular Payment Patterns
                    </span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(riskIndicators.irregularPayment?.trend)}
                      <span className="text-sm font-normal">
                        {riskIndicators.irregularPayment?.changePercent}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Accounts</p>
                      <p className="text-xl font-bold text-orange-600">
                        {riskIndicators.irregularPayment?.count || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">At Risk</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(riskIndicators.irregularPayment?.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {riskIndicators.irregularPayment?.patterns?.map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{pattern.pattern}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{pattern.count} cases</Badge>
                          <Badge variant="secondary">Avg Risk: {pattern.avgRisk}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Multiple Loans Stress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Multiple Loan Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {riskIndicators.multipleLoans?.count || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Exposure</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {formatCurrency(riskIndicators.multipleLoans?.totalExposure)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Loans</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {riskIndicators.multipleLoans?.avgLoansPerCustomer || 0}
                      </p>
                    </div>
                  </div>
                  {riskIndicators.multipleLoans?.highestExposure && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Highest Exposure:</strong> {riskIndicators.multipleLoans.highestExposure.customer} - 
                        {formatCurrency(riskIndicators.multipleLoans.highestExposure.amount)} 
                        ({riskIndicators.multipleLoans.highestExposure.loans} loans)
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* High DTI Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    High Debt-to-Income Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Average DTI</span>
                      <span className="text-2xl font-bold text-red-600">
                        {riskIndicators.highDTI?.avgDTI || 0}%
                      </span>
                    </div>
                    <Progress value={riskIndicators.highDTI?.avgDTI || 0} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">Threshold: {riskIndicators.highDTI?.threshold || 65}%</p>
                  </div>
                  <div className="space-y-2">
                    {riskIndicators.highDTI?.distribution?.map((range, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{range.range}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(range.count / (riskIndicators.highDTI?.count || 1)) * 100} className="w-20" />
                          <span className="text-sm font-medium">{range.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Industry Risk Analysis */}
          {riskIndicators?.industryRisk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Industry Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskIndicators.industryRisk.sectors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="accounts" fill="#8884d8" name="Accounts" />
                    <Bar yAxisId="right" dataKey="exposure" fill="#82ca9d" name="Exposure (SAR)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {riskIndicators.industryRisk.sectors?.map((sector, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <Badge className={`${getRiskBadgeColor(sector.riskLevel)} text-white mb-2`}>
                        {sector.riskLevel}
                      </Badge>
                      <p className="text-sm font-medium">{sector.sector}</p>
                      <p className="text-xs text-gray-600">{sector.accounts} accounts</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavioral Changes */}
          {riskIndicators?.behavioralChanges && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Behavioral Change Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Behavioral Changes Detected</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {riskIndicators.behavioralChanges.totalDetected || 0}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={riskIndicators.behavioralChanges.types}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" />
                    <PolarRadiusAxis />
                    <Radar name="Count" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Risk Increase %" dataKey="riskIncrease" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Live Alerts Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Real-time Risk Alerts
                </span>
                <Badge variant="outline" className="animate-pulse">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {alertsTimeline.map((alert, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="text-sm text-gray-500 min-w-[60px]">{alert.time}</div>
                      <div className={`p-2 rounded-full ${getRiskBadgeColor(alert.type)}`}>
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getRiskBadgeColor(alert.type)} text-white`}>
                            {alert.type}
                          </Badge>
                          <span className="text-sm text-gray-600">Account: {alert.account}</span>
                        </div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600 mt-1">Customer: {alert.customerName}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/collection/cases?customer=${alert.customerId}`}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alert Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {summary.alertsResolved > 0 
                      ? ((summary.alertsResolved - summary.falsePositives) / summary.alertsResolved * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">True positive rate</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {summary.falsePositives} false positives
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">2.3</div>
                  <p className="text-sm text-gray-600 mt-1">hours</p>
                  <Progress value={76} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">76% within SLA</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prevention Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">82%</div>
                  <p className="text-sm text-gray-600 mt-1">Defaults prevented</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Saved {formatCurrency(3250000)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Predictive Analytics */}
          {predictiveAnalytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Default Prediction Model</CardTitle>
                  <CardDescription>AI-powered risk forecasting for next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <p className="text-sm text-gray-600">Predicted Defaults</p>
                      <p className="text-3xl font-bold text-red-600">
                        {predictiveAnalytics.nextMonthDefaults?.predicted || 0}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {predictiveAnalytics.nextMonthDefaults?.confidence || 0}% confidence
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-sm text-gray-600">Expected Loss</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {formatCurrency(predictiveAnalytics.nextMonthDefaults?.expectedLoss)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-gray-600">Preventable Loss</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency((predictiveAnalytics.nextMonthDefaults?.expectedLoss || 0) * 0.7)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">With intervention</p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Top Risk Factors</h4>
                    <div className="space-y-2">
                      {predictiveAnalytics.nextMonthDefaults?.topRiskFactors?.map((factor, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{factor.factor}</span>
                            <span className="text-sm font-medium">{factor.weight}%</span>
                          </div>
                          <Progress value={factor.weight} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Migration */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Score Migration</CardTitle>
                  <CardDescription>Account movement between risk categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={predictiveAnalytics.riskMigration}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="from" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Accounts" />
                      <Line type="monotone" dataKey="percentage" stroke="#ff7300" name="Migration %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Key Insight:</strong> {predictiveAnalytics.riskMigration?.[2]?.percentage || 0}% of high-risk accounts are migrating to critical status - 
                      immediate intervention required for {predictiveAnalytics.riskMigration?.[2]?.count || 0} accounts
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Risk Score Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution Trend</CardTitle>
              <CardDescription>Portfolio risk profile evolution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={riskScoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="low" stackId="1" stroke={COLORS.low} fill={COLORS.low} name="Low Risk" />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke={COLORS.medium} fill={COLORS.medium} name="Medium Risk" />
                  <Area type="monotone" dataKey="high" stackId="1" stroke={COLORS.high} fill={COLORS.high} name="High Risk" />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke={COLORS.critical} fill={COLORS.critical} name="Critical Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Indicators Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Indicators Performance</CardTitle>
              <CardDescription>Effectiveness of different early warning indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { indicator: 'First Payment', accuracy: 89, coverage: 75, falsePositive: 12 },
                  { indicator: 'Payment Pattern', accuracy: 82, coverage: 85, falsePositive: 18 },
                  { indicator: 'Multiple Loans', accuracy: 76, coverage: 68, falsePositive: 24 },
                  { indicator: 'High DTI', accuracy: 85, coverage: 72, falsePositive: 15 },
                  { indicator: 'Industry Risk', accuracy: 71, coverage: 90, falsePositive: 29 },
                  { indicator: 'Behavioral', accuracy: 78, coverage: 65, falsePositive: 22 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="indicator" />
                  <PolarRadiusAxis />
                  <Radar name="Accuracy %" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Coverage %" dataKey="coverage" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {/* Actionable Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Prioritized interventions to prevent defaults</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionableInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getRiskBadgeColor(insight.priority)}`}>
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <Badge className={`${getRiskBadgeColor(insight.priority)} text-white mb-1`}>
                            {insight.priority}
                          </Badge>
                          <h4 className="font-semibold">{insight.insight}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Potential Saving</p>
                        <p className="font-bold text-green-600">{formatCurrency(insight.potentialSaving)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.recommendation}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => window.location.href = '/collection/cases'}
                      >
                        Take Action
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intervention Success Rate</CardTitle>
                <CardDescription>Effectiveness of preventive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { action: 'Immediate Contact', success: 85, avgSaving: 125000 },
                    { action: 'Restructuring', success: 72, avgSaving: 250000 },
                    { action: 'Payment Plan', success: 68, avgSaving: 85000 },
                    { action: 'Settlement Offer', success: 58, avgSaving: 180000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success" fill="#22c55e" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Queue</CardTitle>
                <CardDescription>Pending interventions by priority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500 text-white">Critical</Badge>
                      <span className="font-medium">{summary.criticalAlerts} accounts</span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={handleViewCriticalAccounts}>
                      Process
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white">High</Badge>
                      <span className="font-medium">{summary.highRiskAccounts} accounts</span>
                    </div>
                    <Button size="sm" variant="outline">Process</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500 text-white">Medium</Badge>
                      <span className="font-medium">{summary.mediumRiskAccounts} accounts</span>
                    </div>
                    <Button size="sm" variant="outline">Process</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Critical Accounts Dialog */}
      <Dialog open={criticalAccountsOpen} onOpenChange={setCriticalAccountsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Critical Risk Accounts</DialogTitle>
            <DialogDescription>
              Accounts requiring immediate intervention to prevent default
            </DialogDescription>
          </DialogHeader>
          
          {loadingCritical ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Case Number</th>
                    <th className="text-left p-2">Customer Name</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-right p-2">Outstanding</th>
                    <th className="text-left p-2">Days Past Due</th>
                    <th className="text-left p-2">Assigned To</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalAccounts.map((account) => (
                    <tr key={account.caseId} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{account.caseNumber}</td>
                      <td className="p-2">{account.customerName}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{account.customerPhone}</span>
                        </div>
                      </td>
                      <td className="p-2 text-right text-red-600 font-semibold">
                        {formatCurrency(account.totalOutstanding)}
                      </td>
                      <td className="p-2">
                        <Badge variant="destructive">
                          {account.daysPastDue} days
                        </Badge>
                      </td>
                      <td className="p-2">{account.assignedTo}</td>
                      <td className="p-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAccountClick(account)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EarlyWarningDashboard;