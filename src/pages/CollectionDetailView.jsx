import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign,
  Target, Activity, AlertTriangle, Clock, Calendar,
  Download, Filter, RefreshCw
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';

const CollectionDetailView = () => {
  const { cardType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const { cardData, filters, period } = location.state || {};

  useEffect(() => {
    if (cardData) {
      loadDetailData();
    }
  }, [cardType, cardData]);

  const loadDetailData = async () => {
    setLoading(true);
    try {
      // Load additional detail data based on card type
      switch (cardType) {
        case 'total-cases':
          await loadCasesDetail();
          break;
        case 'total-outstanding':
          await loadOutstandingDetail();
          break;
        case 'monthly-recovery':
          await loadRecoveryDetail();
          break;
        case 'collection-rate':
          await loadCollectionRateDetail();
          break;
        default:
          setDetailData(cardData);
      }
    } catch (error) {
      console.error('Error loading detail data:', error);
      setDetailData(cardData);
    } finally {
      setLoading(false);
    }
  };

  const loadCasesDetail = async () => {
    const response = await CollectionService.getCollectionCases({
      page: 1,
      limit: 100,
      ...filters
    });

    if (response.success) {
      const cases = response.data;
      
      // Analyze case trends
      const casesByDay = {};
      const casesByPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
      const casesByStatus = {};
      
      cases.forEach(caseItem => {
        // Day analysis
        const day = new Date(caseItem.createdAt).toLocaleDateString();
        casesByDay[day] = (casesByDay[day] || 0) + 1;
        
        // Priority analysis
        casesByPriority[caseItem.priority] = (casesByPriority[caseItem.priority] || 0) + 1;
        
        // Status analysis
        casesByStatus[caseItem.status] = (casesByStatus[caseItem.status] || 0) + 1;
      });

      setDetailData({
        ...cardData,
        cases,
        trends: {
          byDay: Object.entries(casesByDay).map(([day, count]) => ({ day, count })),
          byPriority: Object.entries(casesByPriority).map(([priority, count]) => ({ priority, count })),
          byStatus: Object.entries(casesByStatus).map(([status, count]) => ({ status, count }))
        },
        totalValue: cases.length,
        recentCases: cases.slice(0, 10)
      });
    } else {
      setDetailData(cardData);
    }
  };

  const loadOutstandingDetail = async () => {
    const response = await CollectionService.getCollectionCases({
      page: 1,
      limit: 100,
      ...filters
    });

    if (response.success) {
      const cases = response.data;
      
      // Analyze outstanding amounts
      const outstandingByBucket = {};
      const outstandingByCustomer = [];
      const highValueCases = [];
      
      cases.forEach(caseItem => {
        // Bucket analysis
        const bucket = caseItem.delinquencyBucket;
        outstandingByBucket[bucket] = (outstandingByBucket[bucket] || 0) + caseItem.totalOutstanding;
        
        // High value cases
        if (caseItem.totalOutstanding > 50000) {
          highValueCases.push(caseItem);
        }
        
        // Customer analysis
        outstandingByCustomer.push({
          customer: caseItem.customerName,
          amount: caseItem.totalOutstanding,
          dpd: caseItem.daysPastDue
        });
      });

      setDetailData({
        ...cardData,
        breakdown: {
          byBucket: Object.entries(outstandingByBucket).map(([bucket, amount]) => ({ bucket, amount })),
          byCustomer: outstandingByCustomer.sort((a, b) => b.amount - a.amount).slice(0, 20)
        },
        highValueCases: highValueCases.sort((a, b) => b.totalOutstanding - a.totalOutstanding),
        totalValue: cases.reduce((sum, c) => sum + c.totalOutstanding, 0),
        avgOutstanding: cases.length > 0 ? cases.reduce((sum, c) => sum + c.totalOutstanding, 0) / cases.length : 0
      });
    } else {
      setDetailData(cardData);
    }
  };

  const loadRecoveryDetail = async () => {
    const performanceResponse = await CollectionService.getCollectionPerformance(period, filters);
    
    if (performanceResponse.success) {
      const performance = performanceResponse.data;
      
      setDetailData({
        ...cardData,
        trends: performance.dailyTrends || [],
        recovery: {
          thisMonth: cardData.value,
          target: cardData.value * 1.2, // Assume 20% increase target
          achieved: (cardData.value / (cardData.value * 1.2)) * 100
        },
        topPerformers: performance.topOfficers || [],
        channelBreakdown: performance.channelPerformance || []
      });
    } else {
      setDetailData(cardData);
    }
  };

  const loadCollectionRateDetail = async () => {
    const response = await CollectionService.getTeamsPerformance(period);
    
    if (response.success) {
      const teamData = response.data;
      
      setDetailData({
        ...cardData,
        teamPerformance: teamData.teamPerformance || [],
        efficiency: {
          current: cardData.value,
          target: 85, // Target collection rate
          variance: cardData.value - 85
        },
        factors: [
          { factor: 'Contact Rate', impact: 'High', value: 78 },
          { factor: 'Promise Rate', impact: 'Medium', value: 65 },
          { factor: 'Fulfillment Rate', impact: 'High', value: 72 }
        ]
      });
    } else {
      setDetailData(cardData);
    }
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

  const getCardIcon = () => {
    switch (cardType) {
      case 'total-cases': return <Users className="h-6 w-6" />;
      case 'total-outstanding': return <DollarSign className="h-6 w-6" />;
      case 'monthly-recovery': return <TrendingUp className="h-6 w-6" />;
      case 'collection-rate': return <Target className="h-6 w-6" />;
      default: return <Activity className="h-6 w-6" />;
    }
  };

  const getCardColor = () => {
    switch (cardType) {
      case 'total-cases': return 'text-blue-600';
      case 'total-outstanding': return 'text-red-600';
      case 'monthly-recovery': return 'text-green-600';
      case 'collection-rate': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/collection/overview')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <div className={`p-2 rounded-lg bg-gray-100 ${getCardColor()}`}>
            {getCardIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {detailData?.title || cardType.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </h1>
            <p className="text-gray-600">Detailed analysis and breakdown</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadDetailData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Value</p>
                <p className="text-2xl font-bold">
                  {cardType === 'total-outstanding' || cardType === 'monthly-recovery' 
                    ? formatCurrency(detailData?.value || detailData?.totalValue || 0)
                    : cardType === 'collection-rate'
                    ? `${(detailData?.value || 0).toFixed(1)}%`
                    : formatNumber(detailData?.value || detailData?.totalValue || 0)
                  }
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100 ${getCardColor()}`}>
                {getCardIcon()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional metrics based on card type */}
        {cardType === 'total-cases' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold">{formatNumber(detailData?.activeCases || 0)}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(detailData?.trends?.byPriority?.find(p => p.priority === 'HIGH')?.count || 0)}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Days Past Due</p>
                    <p className="text-2xl font-bold">
                      {detailData?.cases ? 
                        Math.round(detailData.cases.reduce((sum, c) => sum + c.daysPastDue, 0) / detailData.cases.length) : 0
                      }
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {cardType === 'total-outstanding' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Outstanding</p>
                    <p className="text-2xl font-bold">{formatCurrency(detailData?.avgOutstanding || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Value Cases</p>
                    <p className="text-2xl font-bold">{formatNumber(detailData?.highValueCases?.length || 0)}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recovery Target</p>
                    <p className="text-2xl font-bold">85%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {cardType === 'monthly-recovery' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Target</p>
                    <p className="text-2xl font-bold">{formatCurrency(detailData?.recovery?.target || 0)}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievement</p>
                    <p className="text-2xl font-bold">{(detailData?.recovery?.achieved || 0).toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Top Collector</p>
                    <p className="text-lg font-bold">
                      {detailData?.topPerformers?.[0]?.officerName || 'N/A'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {cardType === 'collection-rate' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Target Rate</p>
                    <p className="text-2xl font-bold">{detailData?.efficiency?.target || 85}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Variance</p>
                    <p className={`text-2xl font-bold ${
                      (detailData?.efficiency?.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(detailData?.efficiency?.variance || 0) >= 0 ? '+' : ''}
                      {(detailData?.efficiency?.variance || 0).toFixed(1)}%
                    </p>
                  </div>
                  {(detailData?.efficiency?.variance || 0) >= 0 ? 
                    <TrendingUp className="h-8 w-8 text-green-500" /> :
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Team</p>
                    <p className="text-lg font-bold">
                      {detailData?.teamPerformance?.[0]?.teamName || 'N/A'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart based on card type */}
            {cardType === 'total-cases' && detailData?.trends?.byStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Cases by Status</CardTitle>
                  <CardDescription>Current distribution of collection cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={detailData.trends.byStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {detailData.trends.byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {cardType === 'total-outstanding' && detailData?.breakdown?.byBucket && (
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding by Bucket</CardTitle>
                  <CardDescription>Amount distribution across delinquency buckets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={detailData.breakdown.byBucket}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#E6B800" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {cardType === 'monthly-recovery' && detailData?.trends && (
              <Card>
                <CardHeader>
                  <CardTitle>Recovery Trends</CardTitle>
                  <CardDescription>Daily recovery performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={detailData.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="totalCollected" stroke="#E6B800" fill="#E6B800" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {cardType === 'collection-rate' && detailData?.teamPerformance && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Collection rate by team</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={detailData.teamPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="teamName" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="collectionRate" fill="#E6B800" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Priority/Impact Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Critical factors and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cardType === 'collection-rate' && detailData?.factors?.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{factor.factor}</p>
                        <p className="text-sm text-gray-600">Impact: {factor.impact}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{factor.value}%</p>
                        <Badge variant={factor.impact === 'High' ? 'destructive' : factor.impact === 'Medium' ? 'default' : 'secondary'}>
                          {factor.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {cardType !== 'collection-rate' && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Detailed insights will be displayed here based on data analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Trend analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>Historical performance and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Trend analysis charts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {/* Detailed breakdown tables */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
              <CardDescription>Comprehensive data analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed breakdown tables will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Raw data and export options */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>Access to underlying data and export options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Raw data tables and export functionality will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollectionDetailView;