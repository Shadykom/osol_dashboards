import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, Cell
} from 'recharts';
import { 
  Trophy, TrendingUp, Phone, Clock, Target, Award, Users, DollarSign,
  Calendar, Filter, Download, Star, AlertTriangle, CheckCircle,
  Activity, Zap, MessageSquare, MapPin, PhoneCall, Mail, Timer, Shield, FileText
} from 'lucide-react';

const OfficerPerformanceDashboard = () => {
  const [selectedOfficer, setSelectedOfficer] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('collection');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const officers = [
    { id: 'OFF001', name: 'Ahmed Al-Rashid', team: 'Team Alpha', type: 'SENIOR_COLLECTOR' },
    { id: 'OFF002', name: 'Fatima Hassan', team: 'Team Beta', type: 'CALL_AGENT' },
    { id: 'OFF003', name: 'Mohammed Noor', team: 'Team Alpha', type: 'FIELD_AGENT' },
    { id: 'OFF004', name: 'Sara Abdullah', team: 'Team Gamma', type: 'CALL_AGENT' },
    { id: 'OFF005', name: 'Khalid Ibrahim', team: 'Team Beta', type: 'SENIOR_COLLECTOR' }
  ];

  const performanceMetrics = {
    overview: {
      totalCollected: 15800000,
      targetAchievement: 87.5,
      callsMade: 4532,
      contactRate: 68.5,
      ptpObtained: 234,
      ptpKeptRate: 82.3,
      avgCollectionTime: 12.5,
      qualityScore: 8.7
    },
    topPerformers: [
      { 
        name: 'Ahmed Al-Rashid', 
        collected: 2850000, 
        target: 3000000,
        achievement: 95,
        calls: 512,
        ptps: 45,
        score: 9.2,
        trend: 'up',
        avatar: 'AR'
      },
      { 
        name: 'Fatima Hassan', 
        collected: 2450000, 
        target: 2500000,
        achievement: 98,
        calls: 489,
        ptps: 42,
        score: 9.0,
        trend: 'up',
        avatar: 'FH'
      },
      { 
        name: 'Mohammed Noor', 
        collected: 2280000, 
        target: 2600000,
        achievement: 87.7,
        calls: 601,
        ptps: 38,
        score: 8.5,
        trend: 'stable',
        avatar: 'MN'
      }
    ],
    performanceTrend: [
      { month: 'Jan', collected: 12500000, target: 14000000, officers: 95 },
      { month: 'Feb', collected: 13200000, target: 14500000, officers: 98 },
      { month: 'Mar', collected: 14100000, target: 15000000, officers: 102 },
      { month: 'Apr', collected: 14800000, target: 15500000, officers: 105 },
      { month: 'May', collected: 15300000, target: 16000000, officers: 105 },
      { month: 'Jun', collected: 15800000, target: 18000000, officers: 108 }
    ],
    skillMatrix: [
      { skill: 'Phone Skills', A: 85, B: 78, fullMark: 100 },
      { skill: 'Negotiation', A: 90, B: 82, fullMark: 100 },
      { skill: 'Documentation', A: 75, B: 88, fullMark: 100 },
      { skill: 'Customer Service', A: 88, B: 85, fullMark: 100 },
      { skill: 'Product Knowledge', A: 82, B: 80, fullMark: 100 },
      { skill: 'Compliance', A: 95, B: 92, fullMark: 100 }
    ],
    activityBreakdown: [
      { activity: 'Calls', time: 35, efficiency: 85 },
      { activity: 'Documentation', time: 20, efficiency: 78 },
      { activity: 'Field Visits', time: 15, efficiency: 92 },
      { activity: 'Follow-ups', time: 15, efficiency: 88 },
      { activity: 'Training', time: 10, efficiency: 95 },
      { activity: 'Other', time: 5, efficiency: 70 }
    ],
    teamComparison: [
      { team: 'Alpha', collected: 5200000, target: 5500000, rate: 94.5, officers: 25 },
      { team: 'Beta', collected: 4800000, target: 5000000, rate: 96.0, officers: 22 },
      { team: 'Gamma', collected: 4500000, target: 5000000, rate: 90.0, officers: 20 },
      { team: 'Delta', collected: 4200000, target: 4500000, rate: 93.3, officers: 18 }
    ],
    customerSatisfaction: {
      overall: 4.2,
      breakdown: [
        { category: 'Professionalism', score: 4.5 },
        { category: 'Communication', score: 4.3 },
        { category: 'Problem Resolution', score: 4.0 },
        { category: 'Follow-up', score: 3.9 },
        { category: 'Overall Experience', score: 4.2 }
      ]
    },
    trainingNeeds: [
      { area: 'Advanced Negotiation', priority: 'HIGH', officers: 15 },
      { area: 'Digital Tools', priority: 'MEDIUM', officers: 28 },
      { area: 'Compliance Updates', priority: 'HIGH', officers: 45 },
      { area: 'Customer Psychology', priority: 'LOW', officers: 12 },
      { area: 'Legal Procedures', priority: 'MEDIUM', officers: 8 }
    ]
  };

  const individualPerformance = {
    basicInfo: {
      name: 'Ahmed Al-Rashid',
      id: 'OFF001',
      team: 'Team Alpha',
      type: 'SENIOR_COLLECTOR',
      joinDate: '2020-03-15',
      experience: '4.3 years',
      languages: ['Arabic', 'English'],
      specialization: 'High-value accounts'
    },
    currentMonth: {
      collected: 2850000,
      target: 3000000,
      achievement: 95,
      ranking: 1,
      totalRanking: 108
    },
    dailyMetrics: [
      { day: 'Mon', calls: 85, collected: 450000, ptps: 8, contacts: 62 },
      { day: 'Tue', calls: 92, collected: 520000, ptps: 10, contacts: 68 },
      { day: 'Wed', calls: 78, collected: 380000, ptps: 6, contacts: 55 },
      { day: 'Thu', calls: 88, collected: 490000, ptps: 9, contacts: 65 },
      { day: 'Fri', calls: 72, collected: 350000, ptps: 5, contacts: 48 },
      { day: 'Sat', calls: 45, collected: 180000, ptps: 3, contacts: 28 },
      { day: 'Sun', calls: 52, collected: 480000, ptps: 4, contacts: 35 }
    ],
    monthlyTrend: [
      { month: 'Jan', achievement: 88, quality: 8.5 },
      { month: 'Feb', achievement: 91, quality: 8.7 },
      { month: 'Mar', achievement: 89, quality: 8.6 },
      { month: 'Apr', achievement: 93, quality: 8.9 },
      { month: 'May', achievement: 94, quality: 9.0 },
      { month: 'Jun', achievement: 95, quality: 9.2 }
    ],
    accountPortfolio: {
      total: 145,
      bucketDistribution: [
        { bucket: 'Current', accounts: 45, amount: 850000 },
        { bucket: '1-30', accounts: 38, amount: 720000 },
        { bucket: '31-60', accounts: 28, amount: 580000 },
        { bucket: '61-90', accounts: 20, amount: 450000 },
        { bucket: '90+', accounts: 14, amount: 250000 }
      ]
    },
    qualityMetrics: {
      callQuality: 92,
      documentationAccuracy: 88,
      complianceScore: 95,
      customerComplaints: 2,
      escalations: 5,
      commendations: 12
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': 'bg-red-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF'];

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Officer Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Individual and team performance tracking</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="alpha">Team Alpha</SelectItem>
              <SelectItem value="beta">Team Beta</SelectItem>
              <SelectItem value="gamma">Team Gamma</SelectItem>
              <SelectItem value="delta">Team Delta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Officer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Officers</SelectItem>
              {officers.map(officer => (
                <SelectItem key={officer.id} value={officer.id}>
                  {officer.name}
                </SelectItem>
              ))}
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(performanceMetrics.overview.totalCollected)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.overview.targetAchievement}% of target
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contact Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.overview.contactRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(performanceMetrics.overview.callsMade)} calls made
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PTP Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.overview.ptpKeptRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.overview.ptpObtained} PTPs obtained
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.overview.qualityScore}/10</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg collection time: {performanceMetrics.overview.avgCollectionTime} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Performers - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/api/placeholder/48/48`} />
                          <AvatarFallback>{performer.avatar}</AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{performer.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatCurrency(performer.collected)}</span>
                          <span>•</span>
                          <span>{performer.calls} calls</span>
                          <span>•</span>
                          <span>{performer.ptps} PTPs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getPerformanceColor(performer.achievement)}`}>
                          {performer.achievement}%
                        </p>
                        <p className="text-sm text-gray-600">Achievement</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{performer.score}</span>
                          {getTrendIcon(performer.trend)}
                        </div>
                        <p className="text-sm text-gray-600">Quality</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Performance Trend</CardTitle>
                <CardDescription>Monthly collection vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceMetrics.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="target" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="Target"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="collected" 
                      stackId="2" 
                      stroke="#E6B800" 
                      fill="#E6B800" 
                      fillOpacity={0.6}
                      name="Collected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>Time allocation and efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceMetrics.activityBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="activity" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="time" fill="#E6B800" name="Time (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#82ca9d" name="Efficiency (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {selectedOfficer !== 'all' ? (
            <>
              {/* Officer Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Officer Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={`/api/placeholder/64/64`} />
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{individualPerformance.basicInfo.name}</h3>
                        <p className="text-sm text-gray-600">{individualPerformance.basicInfo.id}</p>
                        <Badge className="mt-1">{individualPerformance.basicInfo.type}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Team:</span>
                        <span className="font-medium">{individualPerformance.basicInfo.team}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Experience:</span>
                        <span className="font-medium">{individualPerformance.basicInfo.experience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Languages:</span>
                        <span className="font-medium">{individualPerformance.basicInfo.languages.join(', ')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Ranking:</span>
                        <span className="font-medium">#{individualPerformance.currentMonth.ranking} of {individualPerformance.currentMonth.totalRanking}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Specialization:</span>
                        <span className="font-medium">{individualPerformance.basicInfo.specialization}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Join Date:</span>
                        <span className="font-medium">{new Date(individualPerformance.basicInfo.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Month Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Month Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-gray-600">Amount Collected</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(individualPerformance.currentMonth.collected)}</p>
                      <p className="text-sm text-gray-600 mt-1">Target: {formatCurrency(individualPerformance.currentMonth.target)}</p>
                    </div>
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-gray-600">Achievement Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{individualPerformance.currentMonth.achievement}%</p>
                      <Progress value={individualPerformance.currentMonth.achievement} className="mt-2" />
                    </div>
                    <div className="text-center p-6 bg-yellow-50 rounded-lg">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-sm text-gray-600">Current Ranking</p>
                      <p className="text-2xl font-bold text-yellow-600">#{individualPerformance.currentMonth.ranking}</p>
                      <p className="text-sm text-gray-600 mt-1">of {individualPerformance.currentMonth.totalRanking} officers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>This week's daily metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={individualPerformance.dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="calls" fill="#8884d8" name="Calls" />
                      <Bar yAxisId="left" dataKey="contacts" fill="#82ca9d" name="Contacts" />
                      <Bar yAxisId="left" dataKey="ptps" fill="#ffc658" name="PTPs" />
                      <Line yAxisId="right" type="monotone" dataKey="collected" stroke="#E6B800" name="Amount (SAR)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Account Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Portfolio</CardTitle>
                  <CardDescription>Distribution by bucket</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Total Accounts: {individualPerformance.accountPortfolio.total}</p>
                      <div className="space-y-3">
                        {individualPerformance.accountPortfolio.bucketDistribution.map((bucket, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{bucket.bucket}</span>
                              <span className="text-sm">{bucket.accounts} accounts</span>
                            </div>
                            <Progress value={(bucket.accounts / individualPerformance.accountPortfolio.total) * 100} className="h-2" />
                            <p className="text-xs text-gray-600 mt-1">{formatCurrency(bucket.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={individualPerformance.accountPortfolio.bucketDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bucket" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="accounts" fill="#E6B800" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Please select an officer to view individual performance</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {/* Team Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
              <CardDescription>Collection performance by team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceMetrics.teamComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="team" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="collected" fill="#E6B800" name="Amount Collected" />
                  <Bar yAxisId="left" dataKey="target" fill="#8884d8" name="Target" />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#82ca9d" strokeWidth={3} name="Achievement Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.teamComparison.map((team, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">Team {team.team}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Collection</p>
                      <p className="text-xl font-bold">{formatCurrency(team.collected)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Achievement</p>
                      <div className="flex items-center gap-2">
                        <Progress value={team.rate} className="flex-1" />
                        <span className="text-sm font-medium">{team.rate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Officers</p>
                      <p className="text-lg font-medium">{team.officers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          {/* Skills Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment Matrix</CardTitle>
              <CardDescription>Comparative skill analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceMetrics.skillMatrix}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Top Performer" dataKey="A" stroke="#E6B800" fill="#E6B800" fillOpacity={0.6} />
                  <Radar name="Average" dataKey="B" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skill Development Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Development Areas</CardTitle>
              <CardDescription>Areas requiring improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { skill: 'Negotiation', current: 75, target: 90, gap: 15 },
                  { skill: 'Digital Tools', current: 68, target: 85, gap: 17 },
                  { skill: 'Customer Service', current: 82, target: 90, gap: 8 },
                  { skill: 'Compliance', current: 88, target: 95, gap: 7 }
                ].map((skill, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{skill.skill}</h4>
                      <Badge variant={skill.gap > 10 ? 'destructive' : 'secondary'}>
                        Gap: {skill.gap}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Current</span>
                          <span>{skill.current}%</span>
                        </div>
                        <Progress value={skill.current} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Target</span>
                          <span>{skill.target}%</span>
                        </div>
                        <Progress value={skill.target} className="h-2 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          {/* Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Call Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {individualPerformance.qualityMetrics.callQuality}%
                  </div>
                  <Progress value={individualPerformance.qualityMetrics.callQuality} className="mt-2" />
                  <p className="text-sm text-gray-600 mt-2">Based on call monitoring</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {individualPerformance.qualityMetrics.documentationAccuracy}%
                  </div>
                  <Progress value={individualPerformance.qualityMetrics.documentationAccuracy} className="mt-2" />
                  <p className="text-sm text-gray-600 mt-2">Accuracy rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {individualPerformance.qualityMetrics.complianceScore}%
                  </div>
                  <Progress value={individualPerformance.qualityMetrics.complianceScore} className="mt-2" />
                  <p className="text-sm text-gray-600 mt-2">Policy adherence</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction Scores</CardTitle>
              <CardDescription>Based on customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold">{performanceMetrics.customerSatisfaction.overall}</div>
                    <div className="flex justify-center mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= Math.floor(performanceMetrics.customerSatisfaction.overall)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Overall Rating</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {performanceMetrics.customerSatisfaction.breakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">{item.score}/5</span>
                      </div>
                      <Progress value={item.score * 20} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Incidents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Customer Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">
                    {individualPerformance.qualityMetrics.customerComplaints}
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-600 mt-2">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Escalations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-600">
                    {individualPerformance.qualityMetrics.escalations}
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Cases escalated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Commendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    {individualPerformance.qualityMetrics.commendations}
                  </div>
                  <Award className="h-8 w-8 text-green-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Positive feedback</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          {/* Training Needs Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Training Needs Analysis</CardTitle>
              <CardDescription>Identified training requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.trainingNeeds.map((training, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getPriorityColor(training.priority)} text-white`}>
                        {training.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{training.area}</p>
                        <p className="text-sm text-gray-600">{training.officers} officers need this training</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Schedule Training
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Training Completion Status</CardTitle>
              <CardDescription>Current training programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { program: 'Collection Best Practices', enrolled: 85, completed: 72, deadline: '2024-08-15' },
                  { program: 'Digital Tools Mastery', enrolled: 65, completed: 45, deadline: '2024-08-30' },
                  { program: 'Compliance Update 2024', enrolled: 108, completed: 95, deadline: '2024-07-31' },
                  { program: 'Customer Psychology', enrolled: 42, completed: 38, deadline: '2024-09-15' }
                ].map((program, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{program.program}</h4>
                        <p className="text-sm text-gray-600">Deadline: {new Date(program.deadline).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={program.completed / program.enrolled > 0.8 ? 'default' : 'secondary'}>
                        {((program.completed / program.enrolled) * 100).toFixed(0)}% Complete
                      </Badge>
                    </div>
                    <Progress value={(program.completed / program.enrolled) * 100} className="mt-2" />
                    <p className="text-sm text-gray-600 mt-1">
                      {program.completed} of {program.enrolled} officers completed
                    </p>
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

export default OfficerPerformanceDashboard;