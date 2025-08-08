import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, Users, Phone, Calendar, DollarSign, Target,
  Clock, AlertTriangle, CheckCircle, TrendingUp, RefreshCw,
  MapPin, MessageSquare, Mail, User, Zap, Eye, PhoneCall,
  UserCheck, UserX, Timer, Award, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CollectionService } from '@/services/collectionService';
import { supabaseCollection } from '@/lib/supabase';

const DailyCollectionDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState('all');

  // Advanced filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    dateRange: { from: new Date(), to: new Date() },
    branch: 'all',
    team: 'all',
    status: 'all',
    bucket: 'all',
    search: ''
  });

  // DB-backed summaries
  const [summary, setSummary] = useState<any>({
    totalCollected: 0,
    totalCalls: 0,
    ptpCreated: 0,
    ptpKept: 0
  });
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topOfficers, setTopOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update time every second for real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock real-time data (kept as fallback visual)
  const morningSnapshot = {
    totalDueToday: 15500000,
    ptpDueToday: 8200000,
    fieldVisitsScheduled: 145,
    legalCasesUpdates: 23,
    yesterdayCollection: 12800000,
    yesterdayTarget: 14000000,
    yesterdayAchievement: 91.4
  };

  const liveTracking = {
    collectorsOnline: 85,
    collectorsOffline: 12,
    collectorsOnBreak: 8,
    totalCollectors: 105,
    
    realTimePayments: summary.totalCollected,
    paymentsCount: dailyTrend.reduce((sum, d) => sum + (d.payments || 0), 0),
    failedAttempts: 45,
    
    contactSuccessRate: topOfficers.length > 0 ?
      (topOfficers.reduce((s, o) => s + (o.contactRate || 0), 0) / topOfficers.length) : 0,
    ptpObtained: summary.ptpCreated,
    ptpTarget: Math.max(summary.ptpCreated, 1) * 1.2,
    
    currentHourCollection: 850000,
    lastHourCollection: 720000,
    
    activeCalls: 42,
    avgCallDuration: '3:25',
    
    recentPayments: [
      { time: '10:45:23', customer: 'Ahmed Al-Rashid', amount: 25000, method: t('dailyCollectionDashboard.analytics.paymentMethods.online') },
      { time: '10:44:15', customer: 'Fatima Enterprises', amount: 150000, method: t('dailyCollectionDashboard.analytics.paymentMethods.bankTransfer') },
      { time: '10:43:58', customer: 'Gulf Trading Co.', amount: 75000, method: t('dailyCollectionDashboard.analytics.paymentMethods.fieldCollection') },
      { time: '10:42:30', customer: 'Noor Holdings', amount: 45000, method: t('dailyCollectionDashboard.analytics.paymentMethods.ivr') },
      { time: '10:41:12', customer: 'Desert Palm LLC', amount: 90000, method: t('dailyCollectionDashboard.analytics.paymentMethods.mobileApp') }
    ],
    
    criticalAlerts: [
      { type: 'HIGH_VALUE', message: `${t('dailyCollectionDashboard.criticalAlerts.highValue')}: ${t('common.currency')} 2.5M - Al-Jazeera Corp`, time: '10:30' },
      { type: 'LEGAL', message: `${t('dailyCollectionDashboard.criticalAlerts.legal')}: Case #2024-1234`, time: '14:00' },
      { type: 'SYSTEM', message: `${t('dailyCollectionDashboard.criticalAlerts.system')}: IVR system response slow - IT investigating`, time: '09:45' }
    ]
  };

  // Load DB data based on filters
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Performance and daily trends
        const perf = await CollectionService.getCollectionPerformance('daily', {
          branch: filters.branch,
          team: filters.team,
          status: filters.status,
          dateFrom: filters?.dateRange?.from ? new Date(filters.dateRange.from).toISOString().split('T')[0] : undefined,
          dateTo: filters?.dateRange?.to ? new Date(filters.dateRange.to).toISOString().split('T')[0] : undefined
        });
        if (perf.success) {
          const p = perf.data;
          setDailyTrend(p.dailyTrends || []);
          setTopOfficers(p.topOfficers || []);
          setSummary({
            totalCollected: p.summary?.totalCollected || 0,
            totalCalls: p.summary?.totalCalls || 0,
            ptpCreated: p.summary?.totalPTPs || 0,
            ptpKept: (p.dailyTrends || []).reduce((s, d) => s + (d.ptpKept || 0), 0)
          });
        }
      } catch (e: any) {
        console.error('Daily load error:', e);
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.branch, filters.team, filters.status, filters.bucket, filters.dateRange?.from, filters.dateRange?.to]);

  const collectorActivity = [
    { name: 'Mohammed Ali', status: 'ON_CALL', duration: '5:23', customer: 'Tech Solutions Ltd', team: `${t('dailyCollectionDashboard.collectors.team')} A` },
    { name: 'Sara Ahmed', status: 'AFTER_CALL', duration: '0:45', customer: 'Green Valley Trading', team: `${t('dailyCollectionDashboard.collectors.team')} B` },
    { name: 'Abdullah Hassan', status: 'BREAK', duration: '12:30', customer: '-', team: `${t('dailyCollectionDashboard.collectors.team')} A` },
    { name: 'Fatima Noor', status: 'ON_CALL', duration: '2:15', customer: 'Pearl Investments', team: `${t('dailyCollectionDashboard.collectors.team')} C` },
    { name: 'Khalid Omar', status: 'AVAILABLE', duration: '-', customer: '-', team: `${t('dailyCollectionDashboard.collectors.team')} B` }
  ];

  const hourlyCollectionTrend = [
    { hour: '08:00', collected: 450000, calls: 125, contacts: 89 },
    { hour: '09:00', collected: 680000, calls: 156, contacts: 112 },
    { hour: '10:00', collected: 850000, calls: 189, contacts: 134 },
    { hour: '11:00', collected: 920000, calls: 198, contacts: 145 },
    { hour: '12:00', collected: 0, calls: 0, contacts: 0 }, // Current hour projection
  ];

  const queueStatus = {
    priority: { total: 45, assigned: 42, pending: 3, avgWait: '2:15' },
    normal: { total: 234, assigned: 210, pending: 24, avgWait: '15:30' },
    automated: { total: 567, assigned: 567, pending: 0, avgWait: '0:00' },
    legal: { total: 23, assigned: 20, pending: 3, avgWait: '45:00' }
  };

  const topPerformers = [
    { name: 'Ahmed Al-Rashid', collected: 450000, calls: 45, ptp: 12, rate: 85 },
    { name: 'Fatima Hassan', collected: 380000, calls: 38, ptp: 10, rate: 82 },
    { name: 'Mohammed Noor', collected: 320000, calls: 52, ptp: 15, rate: 78 },
    { name: 'Sara Abdullah', collected: 290000, calls: 41, ptp: 9, rate: 75 },
    { name: 'Khalid Ibrahim', collected: 250000, calls: 35, ptp: 8, rate: 71 }
  ];

  const channelPerformance = [
    { channel: t('dailyCollectionDashboard.performance.channels.phoneCalls'), attempts: 1245, successful: 845, amount: 2150000 },
    { channel: t('dailyCollectionDashboard.performance.channels.sms'), attempts: 5670, successful: 234, amount: 450000 },
    { channel: t('dailyCollectionDashboard.performance.channels.email'), attempts: 2340, successful: 156, amount: 320000 },
    { channel: t('dailyCollectionDashboard.performance.channels.whatsapp'), attempts: 890, successful: 345, amount: 180000 },
    { channel: t('dailyCollectionDashboard.performance.channels.fieldVisit'), attempts: 145, successful: 98, amount: 890000 }
  ];

  const slaCompliance = {
    firstCallResolution: { target: 70, actual: 68.5, status: 'WARNING' },
    avgResponseTime: { target: 30, actual: 28, status: 'GOOD' },
    ptpFollowUp: { target: 95, actual: 92, status: 'WARNING' },
    escalationTime: { target: 120, actual: 115, status: 'GOOD' }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'ON_CALL': 'bg-green-500',
      'AFTER_CALL': 'bg-yellow-500',
      'BREAK': 'bg-orange-500',
      'AVAILABLE': 'bg-blue-500',
      'OFFLINE': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'ON_CALL': t('dailyCollectionDashboard.collectors.statuses.onCall'),
      'AFTER_CALL': t('dailyCollectionDashboard.collectors.statuses.afterCall'),
      'BREAK': t('dailyCollectionDashboard.collectors.statuses.break'),
      'AVAILABLE': t('dailyCollectionDashboard.collectors.statuses.available'),
      'OFFLINE': t('dailyCollectionDashboard.collectors.statuses.offline')
    };
    return statusMap[status] || status;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'HIGH_VALUE':
        return <DollarSign className="h-4 w-4" />;
      case 'LEGAL':
        return <AlertTriangle className="h-4 w-4" />;
      case 'SYSTEM':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F'];

  return (
    <div className="space-y-6 p-6">
      {/* Advanced Filters */}
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">{t('common.filters') || 'Filters'}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
              {filtersOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <DateRangePicker value={filters.dateRange} onChange={(range: any) => setFilters((f: any) => ({ ...f, dateRange: range }))} />
            </div>
            <Select value={filters.branch} onValueChange={(v) => setFilters((f: any) => ({ ...f, branch: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.team} onValueChange={(v) => setFilters((f: any) => ({ ...f, team: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters((f: any) => ({ ...f, status: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        )}
      </Card>
      {/* Header with Live Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dailyCollectionDashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dailyCollectionDashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium">{isLive ? t('dailyCollectionDashboard.live') : t('dailyCollectionDashboard.paused')}</span>
          </div>
          <div className="text-lg font-medium">
            {formatTime(currentTime)}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? t('dailyCollectionDashboard.pause') : t('dailyCollectionDashboard.resume')}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Morning Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyCollectionDashboard.morningSnapshot.totalDueToday')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(morningSnapshot.totalDueToday)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyCollectionDashboard.morningSnapshot.ptpDueToday')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(morningSnapshot.ptpDueToday)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyCollectionDashboard.morningSnapshot.fieldVisits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{morningSnapshot.fieldVisitsScheduled}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyCollectionDashboard.morningSnapshot.legalUpdates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{morningSnapshot.legalCasesUpdates}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyCollectionDashboard.morningSnapshot.yesterdayAchievement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{morningSnapshot.yesterdayAchievement}%</div>
            <Progress value={morningSnapshot.yesterdayAchievement} className="mt-1 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {liveTracking.criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {liveTracking.criticalAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span>{alert.message}</span>
                  </div>
                  <span className="text-sm text-gray-600">{alert.time}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live">{t('dailyCollectionDashboard.tabs.liveTracking')}</TabsTrigger>
          <TabsTrigger value="collectors">{t('dailyCollectionDashboard.tabs.collectors')}</TabsTrigger>
          <TabsTrigger value="performance">{t('dailyCollectionDashboard.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="queues">{t('dailyCollectionDashboard.tabs.queues')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('dailyCollectionDashboard.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Payment Tracking */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('dailyCollectionDashboard.liveTracking.livePaymentTracking')}</span>
                  <Badge variant="secondary" className="animate-pulse">
                    {liveTracking.paymentsCount} {t('dailyCollectionDashboard.liveTracking.paymentsToday')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(liveTracking.realTimePayments)}
                  </div>
                  <p className="text-sm text-gray-600">{t('dailyCollectionDashboard.liveTracking.collectedSoFar')}</p>
                </div>
                {/* Add click-through to detail with filters */}
                <div className="mb-4">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/collection/daily/detail/payments`, { state: { filters } })}>
                    View daily details
                  </Button>
                </div>
                
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {liveTracking.recentPayments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">{payment.time}</div>
                          <div>
                            <p className="font-medium">{payment.customer}</p>
                            <p className="text-sm text-gray-600">{payment.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Collector Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dailyCollectionDashboard.liveTracking.collectorStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{t('dailyCollectionDashboard.liveTracking.online')}</span>
                    </div>
                    <span className="font-bold">{liveTracking.collectorsOnline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{t('dailyCollectionDashboard.liveTracking.onBreak')}</span>
                    </div>
                    <span className="font-bold">{liveTracking.collectorsOnBreak}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{t('dailyCollectionDashboard.liveTracking.offline')}</span>
                    </div>
                    <span className="font-bold">{liveTracking.collectorsOffline}</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: t('dailyCollectionDashboard.liveTracking.online'), value: liveTracking.collectorsOnline },
                            { name: t('dailyCollectionDashboard.liveTracking.onBreak'), value: liveTracking.collectorsOnBreak },
                            { name: t('dailyCollectionDashboard.liveTracking.offline'), value: liveTracking.collectorsOffline }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#eab308" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('dailyCollectionDashboard.liveTracking.activeCalls')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveTracking.activeCalls}</div>
                <div className="mt-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/collection/daily/detail/collectors`, { state: { filters } })}>
                    Inspect collectors
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('dailyCollectionDashboard.liveTracking.ptpObtained')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveTracking.ptpObtained}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {t('dailyCollectionDashboard.liveTracking.collectorStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveTracking.totalCollectors}</div>
                <div className="mt-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/collection/daily/detail/collectors`, { state: { filters } })}>
                    View performance
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('dailyCollectionDashboard.liveTracking.failedAttempts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveTracking.failedAttempts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Collection Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.liveTracking.hourlyCollectionTrend')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.liveTracking.collectionPerformance')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyCollectionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="collected" 
                    stroke="#E6B800" 
                    fill="#E6B800" 
                    fillOpacity={0.6}
                    name={t('dailyCollectionDashboard.liveTracking.amountCollected')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collectors" className="space-y-4">
          {/* Collector Activity Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.collectors.liveCollectorActivity')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.collectors.realtimeStatus')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('dailyCollectionDashboard.collectors.collector')}</th>
                      <th className="text-left py-2">{t('dailyCollectionDashboard.collectors.status')}</th>
                      <th className="text-left py-2">{t('dailyCollectionDashboard.collectors.duration')}</th>
                      <th className="text-left py-2">{t('dailyCollectionDashboard.collectors.currentCustomer')}</th>
                      <th className="text-left py-2">{t('dailyCollectionDashboard.collectors.team')}</th>
                      <th className="text-center py-2">{t('dailyCollectionDashboard.collectors.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectorActivity.map((collector, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 font-medium">{collector.name}</td>
                        <td className="py-3">
                          <Badge className={`${getStatusColor(collector.status)} text-white`}>
                            {getStatusText(collector.status)}
                          </Badge>
                        </td>
                        <td className="py-3">{collector.duration}</td>
                        <td className="py-3">{collector.customer}</td>
                        <td className="py-3">{collector.team}</td>
                        <td className="py-3 text-center">
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

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('dailyCollectionDashboard.collectors.topPerformers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-gray-600">
                          {performer.calls} {t('dailyCollectionDashboard.collectors.calls')} | {performer.ptp} {t('dailyCollectionDashboard.collectors.ptps')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(performer.collected)}</p>
                      <p className="text-sm text-gray-600">{t('dailyCollectionDashboard.collectors.successRate')}: {performer.rate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.performance.channelPerformance')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.performance.channelEffectiveness')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('dailyCollectionDashboard.performance.channel')}</th>
                      <th className="text-right py-2">{t('dailyCollectionDashboard.performance.attempts')}</th>
                      <th className="text-right py-2">{t('dailyCollectionDashboard.performance.successful')}</th>
                      <th className="text-right py-2">{t('dailyCollectionDashboard.performance.successRate')}</th>
                      <th className="text-right py-2">{t('dailyCollectionDashboard.performance.amountCollected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance.map((channel, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 font-medium">{channel.channel}</td>
                        <td className="py-3 text-right">{channel.attempts}</td>
                        <td className="py-3 text-right">{channel.successful}</td>
                        <td className="py-3 text-right">
                          <Badge variant="outline">
                            {((channel.successful / channel.attempts) * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-bold text-green-600">
                          {formatCurrency(channel.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.performance.slaCompliance')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.performance.slaPerformance')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(slaCompliance).map(([key, metric]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {t(`dailyCollectionDashboard.performance.metrics.${key}`)}
                      </span>
                      <Badge variant={metric.status === 'GOOD' ? 'default' : 'destructive'}>
                        {t(`dailyCollectionDashboard.performance.${metric.status.toLowerCase()}`)}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{metric.actual}</span>
                      <span className="text-sm text-gray-600">/ {metric.target} {t('dailyCollectionDashboard.performance.target')}</span>
                    </div>
                    <Progress 
                      value={(metric.actual / metric.target) * 100} 
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          {/* Queue Management */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.queues.queueStatus')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.queues.queueDistribution')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(queueStatus).map(([queue, stats]) => (
                  <Card key={queue}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t(`dailyCollectionDashboard.queues.queueTypes.${queue}`)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">{t('dailyCollectionDashboard.queues.total')}</span>
                          <span className="font-bold">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">{t('dailyCollectionDashboard.queues.assigned')}</span>
                          <span className="font-bold text-green-600">{stats.assigned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">{t('dailyCollectionDashboard.queues.pending')}</span>
                          <span className="font-bold text-yellow-600">{stats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">{t('dailyCollectionDashboard.queues.avgWait')}</span>
                          <span className="font-bold">{stats.avgWait}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.queues.workloadDistribution')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.queues.casesPerCollector')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { collector: 'Ahmed', cases: 45, amount: 2500000 },
                  { collector: 'Fatima', cases: 38, amount: 1800000 },
                  { collector: 'Mohammed', cases: 52, amount: 3200000 },
                  { collector: 'Sara', cases: 41, amount: 2100000 },
                  { collector: 'Khalid', cases: 35, amount: 1600000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="collector" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cases" fill="#E6B800" name={t('dailyCollectionDashboard.queues.casesAssigned')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Real-time Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dailyCollectionDashboard.analytics.collectionVelocity')}</CardTitle>
                <CardDescription>{t('dailyCollectionDashboard.analytics.speedOfCollections')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyCollectionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#8884d8" 
                      name={t('dailyCollectionDashboard.analytics.callsMade')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="contacts" 
                      stroke="#82ca9d" 
                      name={t('dailyCollectionDashboard.analytics.successfulContacts')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dailyCollectionDashboard.analytics.paymentMethodsDistribution')}</CardTitle>
                <CardDescription>{t('dailyCollectionDashboard.analytics.breakdownPaymentMethods')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('dailyCollectionDashboard.analytics.paymentMethods.online'), value: 35 },
                        { name: t('dailyCollectionDashboard.analytics.paymentMethods.bankTransfer'), value: 25 },
                        { name: t('dailyCollectionDashboard.analytics.paymentMethods.fieldCollection'), value: 20 },
                        { name: t('dailyCollectionDashboard.analytics.paymentMethods.ivr'), value: 12 },
                        { name: t('dailyCollectionDashboard.analytics.paymentMethods.mobileApp'), value: 8 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyCollectionDashboard.analytics.endOfDayProjections')}</CardTitle>
              <CardDescription>{t('dailyCollectionDashboard.analytics.aiPoweredPredictions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">{t('dailyCollectionDashboard.analytics.projectedCollection')}</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(18500000)}</p>
                  <p className="text-xs text-gray-600 mt-1">119% {t('dailyCollectionDashboard.analytics.ofTarget')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">{t('dailyCollectionDashboard.analytics.expectedPtps')}</p>
                  <p className="text-2xl font-bold text-green-600">285</p>
                  <p className="text-xs text-gray-600 mt-1">95% {t('dailyCollectionDashboard.analytics.ofTarget')}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm text-gray-600">{t('dailyCollectionDashboard.analytics.contactsToMake')}</p>
                  <p className="text-2xl font-bold text-yellow-600">450</p>
                  <p className="text-xs text-gray-600 mt-1">{t('dailyCollectionDashboard.analytics.toAchieveTarget')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cases tile linking to details */}
      <div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/collection/daily/detail/cases`, { state: { filters } })}>
          View cases (filtered)
        </Button>
      </div>
    </div>
  );
};

export default DailyCollectionDashboard;