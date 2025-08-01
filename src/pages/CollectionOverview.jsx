import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  Phone, Calendar, AlertTriangle, CheckCircle,
  Clock, Target, Activity, FileText, Filter,
  ArrowUpRight, ArrowDownRight, Minus,
  Eye, MousePointer
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';
import { useTranslation } from 'react-i18next';

const CollectionOverview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filters, setFilters] = useState({
    branch: 'all',
    team: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadCollectionData();
  }, [selectedPeriod, filters]);

  const loadCollectionData = async () => {
    setLoading(true);
    try {
      // Filter out 'all' values
      const processedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const [overviewResponse, performanceResponse] = await Promise.all([
        CollectionService.getCollectionOverview(processedFilters),
        CollectionService.getCollectionPerformance(selectedPeriod, processedFilters)
      ]);

      if (overviewResponse.success) {
        setOverview(overviewResponse.data);
      } else {
        console.error('Collection overview error:', overviewResponse.error);
        // Set fallback data for demo
        setOverview({
          totalCases: 0,
          activeCases: 0,
          totalOutstanding: 0,
          monthlyRecovery: 0,
          collectionRate: 0,
          statusDistribution: [],
          bucketDistribution: [],
          priorityDistribution: []
        });
      }
      
      if (performanceResponse.success) {
        setPerformance(performanceResponse.data);
      } else {
        console.error('Collection performance error:', performanceResponse.error);
        // Set fallback data
        setPerformance({
          dailyTrends: [],
          topOfficers: [],
          teamComparison: [],
          campaignEffectiveness: []
        });
      }
    } catch (error) {
      console.error('Error loading collection data:', error);
      // Set fallback data
      setOverview({
        totalCases: 0,
        activeCases: 0,
        totalOutstanding: 0,
        monthlyRecovery: 0,
        collectionRate: 0,
        statusDistribution: [],
        bucketDistribution: [],
        priorityDistribution: []
      });
      setPerformance({
        dailyTrends: [],
        topOfficers: [],
        teamComparison: [],
        campaignEffectiveness: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      branch: 'all',
      team: 'all',
      status: 'all'
    });
  };

  const handleCardClick = (cardType, data) => {
    // Navigate to detail page with card data
    navigate(`/collection/detail/${cardType}`, { 
      state: { 
        cardData: data,
        filters,
        period: selectedPeriod 
      } 
    });
  };

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

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-blue-500',
      'RESOLVED': 'bg-green-500',
      'LEGAL': 'bg-purple-500',
      'WRITTEN_OFF': 'bg-gray-500',
      'SETTLED': 'bg-yellow-500',
      'CLOSED': 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'CRITICAL': 'bg-red-500',
      'HIGH': 'bg-orange-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getTrendIcon = (value, prevValue) => {
    if (!prevValue || value === prevValue) return <Minus className="h-4 w-4 text-gray-500" />;
    if (value > prevValue) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF'];

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
          <h1 className="text-3xl font-bold text-gray-900">Collection Overview</h1>
          <p className="text-gray-600 mt-1">Comprehensive collection management dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('daily')}
          >
            {t('common.daily')}
          </Button>
          <Button
            variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('weekly')}
          >
            {t('common.weekly')}
          </Button>
          <Button
            variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('monthly')}
          >
            {t('common.monthly')}
          </Button>
          <Button
            variant={selectedPeriod === 'quarterly' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('quarterly')}
          >
            {t('common.quarterly')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('common.filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.branch} onValueChange={(value) => handleFilterChange('branch', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allBranches')}</SelectItem>
                <SelectItem value="RIYADH_MAIN">{t('branches.riyadhMain')}</SelectItem>
                <SelectItem value="JEDDAH">{t('branches.jeddah')}</SelectItem>
                <SelectItem value="DAMMAM">{t('branches.dammam')}</SelectItem>
                <SelectItem value="KHOBAR">{t('branches.khobar')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.team} onValueChange={(value) => handleFilterChange('team', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="TEAM_A">Team A</SelectItem>
                <SelectItem value="TEAM_B">Team B</SelectItem>
                <SelectItem value="TEAM_C">Team C</SelectItem>
                <SelectItem value="TEAM_D">Team D</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
          onClick={() => handleCardClick('total-cases', { 
            title: 'Total Cases',
            value: overview?.totalCases || 0,
            activeCases: overview?.activeCases || 0,
            statusDistribution: overview?.statusDistribution || []
          })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Eye className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview?.totalCases || 0)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formatNumber(overview?.activeCases || 0)} active cases
              </p>
              {getTrendIcon(overview?.totalCases, 0)}
            </div>
            <div className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for breakdown →
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
          onClick={() => handleCardClick('total-outstanding', {
            title: 'Total Outstanding',
            value: overview?.totalOutstanding || 0,
            bucketDistribution: overview?.bucketDistribution || []
          })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Eye className="h-4 w-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.totalOutstanding || 0)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Amount due for collection
              </p>
              {getTrendIcon(overview?.totalOutstanding, 0)}
            </div>
            <div className="text-xs text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for bucket analysis →
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
          onClick={() => handleCardClick('monthly-recovery', {
            title: 'Monthly Recovery',
            value: overview?.monthlyRecovery || 0,
            dailyTrends: performance?.dailyTrends || []
          })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recovery</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Eye className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.monthlyRecovery || 0)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                This month's collection
              </p>
              {getTrendIcon(overview?.monthlyRecovery, 0)}
            </div>
            <div className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for trends →
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
          onClick={() => handleCardClick('collection-rate', {
            title: 'Collection Rate',
            value: overview?.collectionRate || 0,
            teamPerformance: overview?.teamPerformance || []
          })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Eye className="h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(overview?.collectionRate || 0).toFixed(1)}%</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Recovery efficiency
              </p>
              {getTrendIcon(overview?.collectionRate, 0)}
            </div>
            <div className="text-xs text-yellow-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for team analysis →
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Cases by Status</CardTitle>
                <CardDescription>Distribution of collection cases by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={overview?.statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {overview?.statusDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cases by Bucket */}
            <Card>
              <CardHeader>
                <CardTitle>Cases by Risk Bucket</CardTitle>
                <CardDescription>Collection cases distributed by risk buckets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overview?.bucketDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucketName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#E6B800" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Collection Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Trends</CardTitle>
              <CardDescription>Daily collection performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performance?.dailyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalCollected" fill="#E6B800" name="Amount Collected" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="collectionRate" 
                    stroke="#8884d8" 
                    name="Collection Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Officers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Officers</CardTitle>
                <CardDescription>Best collection officers by recovery amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance?.topOfficers?.slice(0, 5).map((officer, index) => (
                    <div key={officer.officerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{officer.officerName}</p>
                          <p className="text-sm text-gray-600">{officer.officerType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(officer.totalCollected)}</p>
                        <p className="text-sm text-gray-600">Quality: {officer.qualityScore}/10</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Collection performance by team</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performance?.teamComparison || []}>
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

          {/* Campaign Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Current collection campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performance?.campaignEffectiveness?.map((campaign) => (
                  <div key={campaign.campaignName} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{campaign.campaignName}</h4>
                    <p className="text-sm text-gray-600 mb-2">{campaign.campaignType}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Target:</span>
                        <span className="text-sm font-medium">{formatCurrency(campaign.targetRecovery)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actual:</span>
                        <span className="text-sm font-medium">{formatCurrency(campaign.actualRecovery)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="text-sm font-medium">{campaign.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ROI:</span>
                        <span className="text-sm font-medium">{campaign.roi}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Rate Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Recovery Rate Trends</CardTitle>
                <CardDescription>Collection efficiency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="collectionRate" 
                      stroke="#E6B800" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical collection metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Active Cases</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {formatNumber(overview?.activeCases || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Resolution Rate</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {(overview?.collectionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Avg. Collection Time</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600">
                      45 days
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">High Priority Cases</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">
                      {formatNumber(Math.floor((overview?.activeCases || 0) * 0.15))}
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

export default CollectionOverview;

