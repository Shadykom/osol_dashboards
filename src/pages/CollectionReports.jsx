import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  Download, FileText, TrendingUp, TrendingDown, 
  Calendar, Filter, BarChart3, PieChart as PieChartIcon,
  Users, DollarSign, Phone, Target, Award, AlertTriangle
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';

const CollectionReports = () => {
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [officersPerformance, setOfficersPerformance] = useState([]);
  const [teamsPerformance, setTeamsPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  useEffect(() => {
    loadReportData();
  }, [selectedReportType, selectedPeriod]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [reportResponse, analyticsResponse, officersResponse, teamsResponse] = await Promise.all([
        CollectionService.generateCollectionReport(selectedReportType),
        CollectionService.getCollectionAnalytics(selectedPeriod),
        CollectionService.getOfficersPerformance(selectedPeriod),
        CollectionService.getTeamsPerformance(selectedPeriod)
      ]);

      if (reportResponse.success) setReportData(reportResponse.data);
      if (analyticsResponse.success) setAnalytics(analyticsResponse.data);
      if (officersResponse.success) setOfficersPerformance(officersResponse.data);
      if (teamsResponse.success) setTeamsPerformance(teamsResponse.data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const exportReport = (format) => {
    // Implementation for exporting reports in different formats
    console.log(`Exporting report in ${format} format`);
  };

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF', '#85C1E9', '#AED6F1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collection Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive collection performance analysis</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Collection Report</SelectItem>
                <SelectItem value="weekly">Weekly Performance Summary</SelectItem>
                <SelectItem value="monthly">Monthly Collection Analysis</SelectItem>
                <SelectItem value="officer_performance">Officer Performance Report</SelectItem>
                <SelectItem value="campaign_effectiveness">Campaign Effectiveness Report</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadReportData}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Reports Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData?.totalCollected || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPeriod} collection amount
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(reportData?.totalInteractions || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer contacts made
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(reportData?.activeCampaigns || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Running collection campaigns
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatNumber(reportData?.totalOfficers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Collection officers working
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Collection Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Performance Trends</CardTitle>
              <CardDescription>Daily collection amounts and rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analytics?.recoveryTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="summary_date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_collected" fill="#E6B800" name="Amount Collected" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="collection_rate" 
                    stroke="#8884d8" 
                    name="Collection Rate (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Officers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Officers
                </CardTitle>
                <CardDescription>Best collection officers by total recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {officersPerformance.slice(0, 8).map((officer, index) => (
                    <div key={officer.officerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{officer.officerName}</p>
                          <p className="text-sm text-gray-600">{officer.officerType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(officer.totalCollected)}</p>
                        <p className="text-sm text-gray-600">
                          Contact Rate: {officer.contactRate}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Comparison</CardTitle>
                <CardDescription>Collection performance by team</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={teamsPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="teamName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCollected" fill="#E6B800" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Officer Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Officer Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analysis for all officers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={officersPerformance.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="officerName" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalCollected" fill="#E6B800" name="Total Collected" />
                  <Bar yAxisId="right" dataKey="totalCalls" fill="#8884d8" name="Total Calls" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bucket Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Bucket Migration Analysis</CardTitle>
                <CardDescription>Case distribution and resolution rates by bucket</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.bucketAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucketName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCases" fill="#E6B800" name="Total Cases" />
                    <Bar dataKey="resolvedCases" fill="#82ca9d" name="Resolved Cases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle>Digital Channel Effectiveness</CardTitle>
                <CardDescription>Performance of different collection channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.channelEffectiveness || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ channel, successRate }) => `${channel}: ${successRate}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="successfulPayments"
                    >
                      {analytics?.channelEffectiveness?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Promise to Pay Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Promise to Pay Analysis</CardTitle>
              <CardDescription>PTP effectiveness and fulfillment rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(analytics?.ptpAnalysis?.totalPtps || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total PTPs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.ptpAnalysis?.keepRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Keep Rate</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(analytics?.ptpAnalysis?.totalPromised || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Promised</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics?.ptpAnalysis?.fulfillmentRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Fulfillment Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Period Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Period-over-Period Comparison</CardTitle>
              <CardDescription>Compare collection performance across different periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Current Period</h3>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(reportData?.totalCollected || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Collected</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Previous Period</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatCurrency((reportData?.totalCollected || 0) * 0.85)}
                  </div>
                  <p className="text-sm text-gray-600">Total Collected</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Growth</h3>
                  <div className="text-3xl font-bold text-green-600 mb-1 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 mr-1" />
                    +15%
                  </div>
                  <p className="text-sm text-gray-600">Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branch Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance Comparison</CardTitle>
              <CardDescription>Collection performance across different branches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData?.dailySummaries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_collected" fill="#E6B800" name="Total Collected" />
                  <Bar dataKey="collection_rate" fill="#82ca9d" name="Collection Rate" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Collection Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Trends Analysis</CardTitle>
              <CardDescription>Long-term collection performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics?.recoveryTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="summary_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_collected" 
                    stackId="1" 
                    stroke="#E6B800" 
                    fill="#E6B800" 
                    name="Amount Collected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Performance</CardTitle>
                <CardDescription>Collection performance by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.recoveryTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="summary_date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="collection_rate" 
                      stroke="#E6B800" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast & Projections</CardTitle>
                <CardDescription>Predicted collection performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Next Month Projection</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency((reportData?.totalCollected || 0) * 1.1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Quarter Target</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency((reportData?.totalCollected || 0) * 3.2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">Annual Goal</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {formatCurrency((reportData?.totalCollected || 0) * 12.5)}
                    </span>
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

export default CollectionReports;

