import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDataRefresh } from '@/hooks/useDataRefresh';
// Table components will be implemented inline
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, ScatterChart, Scatter
} from 'recharts';
import { 
  MapPin, Navigation, Users, DollarSign, Clock, AlertTriangle,
  CheckCircle, Calendar, Route, Phone, Car, Shield, TrendingUp,
  Activity, Target, Home, Timer, Camera, FileText, UserCheck, Star, RefreshCw
} from 'lucide-react';
import { supabaseBanking } from '@/lib/supabase';

const FieldCollectionDashboard = () => {
  const { t, i18n, ready } = useTranslation('translation');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [mapView, setMapView] = useState('heat');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Database fetch functions
  const fetchFieldVisitsSummary = async (date) => {
    try {
      // Get today's field visits
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: visits, error } = await supabaseBanking
        .from('field_visits')
        .select('*')
        .gte('visit_date', startOfDay.toISOString())
        .lte('visit_date', endOfDay.toISOString());

      if (error) throw error;

      // Calculate summary metrics
      const totalScheduled = visits?.length || 0;
      const completed = visits?.filter(v => v.visit_status === 'COMPLETED').length || 0;
      const inProgress = visits?.filter(v => v.visit_status === 'IN_PROGRESS').length || 0;
      const pending = visits?.filter(v => v.visit_status === 'SCHEDULED').length || 0;
      const customerNotAvailable = visits?.filter(v => v.visit_status === 'CUSTOMER_NOT_AVAILABLE').length || 0;
      
      // Calculate total amount collected
      const totalCollected = visits?.reduce((sum, v) => sum + (v.amount_collected || 0), 0) || 0;
      const avgCollection = completed > 0 ? totalCollected / completed : 0;
      const successRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

      // Get unique active agents
      const uniqueAgents = new Set(visits?.map(v => v.officer_id)).size;

      return {
        summary: {
          totalVisitsScheduled: totalScheduled,
          visitsCompleted: completed,
          visitsInProgress: inProgress,
          visitsPending: pending,
          totalAgentsActive: uniqueAgents,
          totalAmountCollected: totalCollected,
          avgCollectionPerVisit: avgCollection,
          successRate: successRate
        },
        visitsByStatus: [
          { status: 'Completed', count: completed, percentage: totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0 },
          { status: 'Customer Not Available', count: customerNotAvailable, percentage: totalScheduled > 0 ? (customerNotAvailable / totalScheduled) * 100 : 0 },
          { status: 'In Progress', count: inProgress, percentage: totalScheduled > 0 ? (inProgress / totalScheduled) * 100 : 0 },
          { status: 'Pending', count: pending, percentage: totalScheduled > 0 ? (pending / totalScheduled) * 100 : 0 }
        ],
        visits: visits || []
      };
    } catch (error) {
      console.error('Error fetching field visits summary:', error);
      throw error;
    }
  };

  const fetchAgentLocations = async () => {
    try {
      // Get active field agents with their current status
      const { data: officers, error } = await supabaseBanking
        .from('collection_officers')
        .select(`
          officer_id,
          officer_name,
          officer_type,
          status
        `)
        .eq('officer_type', 'FIELD_AGENT')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      // For now, we'll simulate location data since we don't have real GPS tracking
      // In a real implementation, this would come from a real-time location service
      const agentLocations = officers?.map((officer, index) => ({
        id: officer.officer_id,
        name: officer.officer_name,
        status: ['ON_VISIT', 'IN_TRANSIT', 'AVAILABLE'][index % 3],
        location: {
          lat: 24.7136 + (Math.random() - 0.5) * 0.1,
          lng: 46.6753 + (Math.random() - 0.5) * 0.1
        },
        currentCustomer: index % 3 === 0 ? 'Sample Customer' : null,
        visitsCompleted: Math.floor(Math.random() * 10),
        nextVisit: `${14 + index}:${index % 2 === 0 ? '30' : '15'}`
      })) || [];

      return agentLocations;
    } catch (error) {
      console.error('Error fetching agent locations:', error);
      return [];
    }
  };

  const fetchAgentPerformance = async (date) => {
    try {
      // Get performance metrics for field agents
      const { data: performance, error } = await supabaseBanking
        .from('officer_performance_summary')
        .select(`
          *,
          collection_officers(officer_name)
        `)
        .eq('summary_date', date)
        .in('officer_id', (await supabaseBanking
          .from('collection_officers')
          .select('officer_id')
          .eq('officer_type', 'FIELD_AGENT')
          .then(res => res.data?.map(o => o.officer_id) || [])));

      if (error) throw error;

      return performance?.map(p => ({
        name: p.collection_officers?.officer_name || 'Unknown',
        visits: p.total_cases || 0,
        successful: p.cases_resolved || 0,
        collected: p.amount_collected || 0,
        successRate: p.total_cases > 0 ? (p.cases_resolved / p.total_cases) * 100 : 0,
        avgTime: 35, // Placeholder - would need to calculate from actual visit times
        distance: Math.floor(Math.random() * 300) + 150, // Placeholder
        rating: 4.5 + Math.random() * 0.5 // Placeholder
      })) || [];
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      return [];
    }
  };

  const fetchUpcomingVisits = async (date) => {
    try {
      // Get upcoming visits for today
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: visits, error } = await supabaseBanking
        .from('field_visits')
        .select('*')
        .eq('visit_status', 'SCHEDULED')
        .gte('scheduled_time', new Date().toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(10);

      if (error) throw error;

      return visits?.map(visit => ({
        time: visit.scheduled_time ? new Date(visit.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        agent: visit.officer_id || 'Unknown',
        customer: visit.customer_id || 'Unknown',
        address: visit.visit_address || 'No address',
        amount: visit.amount_collected || 0,
        priority: 'MEDIUM',
        dpd: 0
      })) || [];
    } catch (error) {
      console.error('Error fetching upcoming visits:', error);
      return [];
    }
  };

  // Force translation reload if needed
  useEffect(() => {
    if (!ready && i18n.language) {
      i18n.reloadResources();
    }
    // Debug: Check if translations are loaded
    console.log('FieldCollectionDashboard - Translation ready:', ready);
    console.log('FieldCollectionDashboard - Language:', i18n.language);
    console.log('FieldCollectionDashboard - Has namespace:', i18n.hasResourceBundle(i18n.language, 'translation'));
    if (ready) {
      console.log('FieldCollectionDashboard - Test key:', t('common.loading'));
      console.log('FieldCollectionDashboard - Nested key:', t('executiveCollection.fieldCollection.metrics.completed'));
    }
  }, [ready, i18n, t]);
  
  // Initialize field metrics state
  const [fieldMetrics, setFieldMetrics] = useState({
    summary: {
      totalVisitsScheduled: 0,
      visitsCompleted: 0,
      visitsInProgress: 0,
      visitsPending: 0,
      totalAgentsActive: 0,
      totalAmountCollected: 0,
      avgCollectionPerVisit: 0,
      successRate: 0
    },
    visitsByStatus: [],
    agentLocations: [
      { 
        id: 'FA001',
        name: 'Ahmed Hassan',
        status: 'ON_VISIT',
        location: { lat: 24.7136, lng: 46.6753 },
        currentCustomer: 'Al-Rashid Trading',
        visitsCompleted: 5,
        nextVisit: '14:30'
      },
      { 
        id: 'FA002',
        name: 'Omar Khalid',
        status: 'IN_TRANSIT',
        location: { lat: 24.7236, lng: 46.6853 },
        currentCustomer: null,
        visitsCompleted: 4,
        nextVisit: '14:15'
      },
      { 
        id: 'FA003',
        name: 'Faisal Ahmed',
        status: 'AVAILABLE',
        location: { lat: 24.7036, lng: 46.6653 },
        currentCustomer: null,
        visitsCompleted: 6,
        nextVisit: '15:00'
      }
    ],
    todaysVisits: [
      {
        visitId: 'V001',
        agent: 'Ahmed Hassan',
        customer: 'Al-Rashid Trading Co.',
        scheduledTime: '09:00',
        actualTime: '09:15',
        status: 'COMPLETED',
        amount: 125000,
        duration: 45,
        distance: 12.5,
        notes: 'paymentCollectedInCash'
      },
      {
        visitId: 'V002',
        agent: 'Omar Khalid',
        customer: 'Gulf Industries LLC',
        scheduledTime: '10:30',
        actualTime: '10:45',
        status: 'CUSTOMER_NOT_AVAILABLE',
        amount: 0,
        duration: 15,
        distance: 18.2,
        notes: 'customerOutOfTownRescheduled'
      },
      {
        visitId: 'V003',
        agent: 'Faisal Ahmed',
        customer: 'Desert Palm Enterprises',
        scheduledTime: '11:00',
        actualTime: '11:00',
        status: 'COMPLETED',
        amount: 85000,
        duration: 30,
        distance: 8.7,
        notes: 'partialPaymentReceived'
      }
    ],
    performanceTrend: [
      { date: 'Mon', visits: 145, successful: 105, amount: 920000 },
      { date: 'Tue', visits: 132, successful: 98, amount: 850000 },
      { date: 'Wed', visits: 128, successful: 92, amount: 780000 },
      { date: 'Thu', visits: 135, successful: 101, amount: 890000 },
      { date: 'Fri', visits: 98, successful: 72, amount: 620000 },
      { date: 'Sat', visits: 65, successful: 48, amount: 410000 }
    ],
    regionPerformance: [
      { region: 'North Riyadh', visits: 45, collected: 380000, success: 82 },
      { region: 'South Riyadh', visits: 38, collected: 290000, success: 76 },
      { region: 'East Riyadh', visits: 32, collected: 250000, success: 78 },
      { region: 'West Riyadh', visits: 28, collected: 180000, success: 64 },
      { region: 'Central', visits: 25, collected: 220000, success: 88 }
    ],
    safetyMetrics: {
      totalIncidents: 0,
      lastIncidentDays: 127,
      safetyScore: 98.5,
      checkInsCompleted: 124,
      checkInsMissed: 3,
      sosAlerts: 0
    },
    costAnalysis: {
      totalFuelCost: 4850,
      totalDistanceTraveled: 1245,
      avgCostPerVisit: 125,
      avgDistancePerVisit: 15.2,
      totalExpenses: 8920,
      costPerCollection: 145
    }
  });

  // Hardcoded data for demo purposes (will be replaced with actual data)
  const upcomingVisits = [
    {
      time: '14:00',
      agent: 'Ahmed Hassan',
      customer: 'Noor Holdings',
      address: '123 King Fahd Road',
      amount: 45000,
      priority: 'HIGH',
      dpd: 95
    },
    {
      time: '14:30',
      agent: 'Omar Khalid',
      customer: 'Tech Solutions Ltd',
      address: '456 Olaya Street',
      amount: 78000,
      priority: 'MEDIUM',
      dpd: 65
    },
    {
      time: '15:00',
      agent: 'Faisal Ahmed',
      customer: 'Green Valley Trading',
      address: '789 Prince Sultan Road',
      amount: 120000,
      priority: 'HIGH',
      dpd: 120
    }
  ];

  const routeOptimization = {
    originalDistance: 458,
    optimizedDistance: 385,
    distanceSaved: 73,
    timeSaved: 95,
    fuelSaved: 28,
    efficiency: 15.9
  };

  // Fetch all field collection data from database
  const fetchFieldData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [visitsSummary, agentLocations, agentPerformance, upcomingVisitsData] = await Promise.all([
        fetchFieldVisitsSummary(selectedDate),
        fetchAgentLocations(),
        fetchAgentPerformance(selectedDate),
        fetchUpcomingVisits(selectedDate)
      ]);

      // Update state with fetched data
      setFieldMetrics({
        summary: visitsSummary.summary,
        visitsByStatus: visitsSummary.visitsByStatus,
        agentLocations: agentLocations,
        todaysVisits: visitsSummary.visits.map(visit => ({
          visitId: visit.visit_id,
          agent: visit.collection_officers?.officer_name || 'Unknown',
          customer: visit.collection_cases?.customers?.customer_name || 'Unknown Customer',
          scheduledTime: new Date(visit.scheduled_time || visit.visit_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: visit.visit_status,
          amount: visit.collection_cases?.total_amount_due || 0,
          collected: visit.amount_collected || 0,
          address: visit.visit_address || 'No address',
          notes: visit.notes || ''
        })),
        upcomingVisits: upcomingVisitsData.length > 0 ? upcomingVisitsData : upcomingVisits, // Fall back to demo data if no real data
        routeOptimization: routeOptimization, // Keep hardcoded for now as this requires complex calculation
        safetyMetrics: {
          checkInsOnTime: visitsSummary.visits.filter(v => v.visit_status === 'COMPLETED').length,
          checkInsMissed: 0, // Would need real-time tracking data
          emergencyAlerts: 0,
          avgResponseTime: 3.2,
          totalIncidents: 0,
          lastIncidentDays: 127,
          safetyScore: 98.5,
          checkInsCompleted: visitsSummary.visits.filter(v => v.visit_status === 'COMPLETED').length,
          sosAlerts: 0
        },
        agentPerformance: agentPerformance.length > 0 ? agentPerformance : [],
        // Add costAnalysis to prevent undefined error
        costAnalysis: {
          totalFuelCost: 4850,
          totalDistanceTraveled: 1245,
          avgCostPerVisit: 125,
          avgDistancePerVisit: 15.2,
          totalExpenses: 8920,
          costPerCollection: 145
        },
        // Add performanceTrend and regionPerformance as they might also be missing
        performanceTrend: [
          { date: 'Mon', visits: 145, successful: 105, amount: 920000 },
          { date: 'Tue', visits: 132, successful: 98, amount: 850000 },
          { date: 'Wed', visits: 128, successful: 92, amount: 780000 },
          { date: 'Thu', visits: 135, successful: 101, amount: 890000 },
          { date: 'Fri', visits: 98, successful: 72, amount: 620000 },
          { date: 'Sat', visits: 65, successful: 48, amount: 410000 }
        ],
        regionPerformance: [
          { region: 'North Riyadh', visits: 45, collected: 380000, success: 82 },
          { region: 'South Riyadh', visits: 38, collected: 290000, success: 76 },
          { region: 'East Riyadh', visits: 32, collected: 250000, success: 78 },
          { region: 'West Riyadh', visits: 28, collected: 180000, success: 64 },
          { region: 'Central', visits: 25, collected: 220000, success: 88 }
        ]
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching field data:', err);
      setError(err.message || 'Failed to load field collection data');
      setIsLoading(false);
      
      // Fall back to default data if fetch fails
      setFieldMetrics(prev => prev);
    }
  };

  // Use the data refresh hook
  const { refresh, isRefreshing, lastRefreshed } = useDataRefresh(
    fetchFieldData,
    [selectedDate, selectedAgent, selectedRegion], // Refresh when filters change
    {
      refreshOnMount: true,
      refreshInterval: 30000, // Auto-refresh every 30 seconds for real-time tracking
      showNotification: false // Don't show notification for auto-refresh
    }
  );

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

  const getStatusColor = (status) => {
    const colors = {
      'COMPLETED': 'bg-green-500',
      'IN_PROGRESS': 'bg-blue-500',
      'CUSTOMER_NOT_AVAILABLE': 'bg-yellow-500',
      'WRONG_ADDRESS': 'bg-orange-500',
      'REFUSED': 'bg-red-500',
      'PENDING': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getAgentStatusColor = (status) => {
    const colors = {
      'ON_VISIT': 'bg-green-500',
      'IN_TRANSIT': 'bg-blue-500',
      'AVAILABLE': 'bg-gray-500',
      'BREAK': 'bg-yellow-500',
      'OFFLINE': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': 'text-red-600',
      'MEDIUM': 'text-yellow-600',
      'LOW': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getTranslatedNote = (noteKey) => {
    return t(`executiveCollection.fieldCollection.notes.${noteKey}`);
  };

  const COLORS = ['#E6B800', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF'];

  // Data is loaded by fetchFieldData which is called by useDataRefresh hook
  // The hook handles loading states and refresh automatically

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            size="sm"
          >
            {t('common.retry')}
          </Button>
        </Alert>
      </div>
    );
  }

  // Wait for translations to be ready
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('executiveCollection.fieldCollection.dashboard.title') || 'Field Collection Dashboard'}</h1>
          <p className="text-gray-600 mt-1">{t('executiveCollection.fieldCollection.dashboard.subtitle') || 'Monitor and manage field collection activities'}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-xs">
            {t('executiveCollection.fieldCollection.dashboard.lastUpdated')}: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Loading...'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`${i18n.dir() === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('executiveCollection.fieldCollection.dashboard.refresh')}
          </Button>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('executiveCollection.fieldCollection.dashboard.selectRegion')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('executiveCollection.fieldCollection.dashboard.allRegions')}</SelectItem>
              <SelectItem value="north">{t('executiveCollection.fieldCollection.dashboard.regions.north')}</SelectItem>
              <SelectItem value="south">{t('executiveCollection.fieldCollection.dashboard.regions.south')}</SelectItem>
              <SelectItem value="east">{t('executiveCollection.fieldCollection.dashboard.regions.east')}</SelectItem>
              <SelectItem value="west">{t('executiveCollection.fieldCollection.dashboard.regions.west')}</SelectItem>
              <SelectItem value="central">{t('executiveCollection.fieldCollection.dashboard.regions.central')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('executiveCollection.fieldCollection.dashboard.selectAgent')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('executiveCollection.fieldCollection.dashboard.allAgents')}</SelectItem>
              {(fieldMetrics.agentPerformance || []).map(agent => (
                <SelectItem key={agent.name} value={agent.name}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'ml-2' : 'mr-2'}`} />
            {selectedDate}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{t('executiveCollection.fieldCollection.metrics.visitsToday')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatNumber(fieldMetrics.summary.totalVisitsScheduled)}</div>
            <Progress 
              value={(fieldMetrics.summary.visitsCompleted / fieldMetrics.summary.totalVisitsScheduled) * 100} 
              className="mt-2 h-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {formatNumber(fieldMetrics.summary.visitsCompleted)} {t('executiveCollection.fieldCollection.metrics.completed')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{t('executiveCollection.fieldCollection.metrics.amountCollected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(fieldMetrics.summary.totalAmountCollected)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('executiveCollection.fieldCollection.metrics.average')}: {formatCurrency(fieldMetrics.summary.avgCollectionPerVisit)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{t('executiveCollection.fieldCollection.metrics.activeAgents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatNumber(fieldMetrics.summary.totalAgentsActive)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {formatNumber(fieldMetrics.summary.visitsInProgress)} {t('executiveCollection.fieldCollection.metrics.visitsInProgress')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{t('executiveCollection.fieldCollection.metrics.successRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{fieldMetrics.summary.successRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('executiveCollection.fieldCollection.metrics.collectionSuccess')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Alert */}
      {fieldMetrics.safetyMetrics.checkInsMissed > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{fieldMetrics.safetyMetrics.checkInsMissed} {t('executiveCollection.fieldCollection.alerts.missedCheckIns')}</span>
              <Button size="sm" variant="outline">{t('executiveCollection.fieldCollection.alerts.viewDetails')}</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{t('executiveCollection.fieldCollection.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="agents">{t('executiveCollection.fieldCollection.tabs.agents')}</TabsTrigger>
          <TabsTrigger value="visits">{t('executiveCollection.fieldCollection.tabs.visits')}</TabsTrigger>
          <TabsTrigger value="routing">{t('executiveCollection.fieldCollection.tabs.routing')}</TabsTrigger>
          <TabsTrigger value="safety">{t('executiveCollection.fieldCollection.tabs.safety')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('executiveCollection.fieldCollection.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visit Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('executiveCollection.fieldCollection.overview.visitStatusDistribution')}</CardTitle>
                <CardDescription>{t('executiveCollection.fieldCollection.overview.todaysFieldVisitsByStatus')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fieldMetrics.visitsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {fieldMetrics.visitsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Real-time Agent Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('executiveCollection.fieldCollection.overview.agentLocations')}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={mapView === 'heat' ? 'default' : 'outline'}
                      onClick={() => setMapView('heat')}
                    >
                      {t('executiveCollection.fieldCollection.overview.heat')}
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'pins' ? 'default' : 'outline'}
                      onClick={() => setMapView('pins')}
                    >
                      {t('executiveCollection.fieldCollection.overview.pins')}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">{t('executiveCollection.fieldCollection.overview.interactiveMapPlaceholder')}</p>
                    <div className="mt-4 space-y-2">
                      {fieldMetrics.agentLocations.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getAgentStatusColor(agent.status)}`} />
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                          <Badge variant="outline">{(() => {
                            const statusKey = {
                              'ON_VISIT': 'onVisit',
                              'IN_TRANSIT': 'inTransit',
                              'AVAILABLE': 'available',
                              'BREAK': 'break',
                              'OFFLINE': 'offline'
                            }[agent.status] || agent.status.toLowerCase();
                            return t(`executiveCollection.fieldCollection.overview.agentStatus.${statusKey}`);
                          })()}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Visits Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.overview.todaysFieldVisits')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.overview.detailedVisitInformation')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-9 gap-4 p-4 border-b font-medium text-sm">
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.visitId')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.agent')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.customer')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.scheduled')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.actual')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.status')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.amount')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.duration')}</div>
                    <div>{t('executiveCollection.fieldCollection.overview.tableHeaders.distance')}</div>
                  </div>
                  {fieldMetrics.todaysVisits.map((visit) => (
                    <div key={visit.visitId} className="grid grid-cols-9 gap-4 p-4 border-b text-sm">
                      <div className="font-medium">{visit.visitId}</div>
                      <div>{visit.agent}</div>
                      <div>{visit.customer}</div>
                      <div>{visit.scheduledTime}</div>
                      <div>{visit.actualTime}</div>
                      <div>
                        <Badge className={`${getStatusColor(visit.status)} text-white`}>
                          {(() => {
                            const statusKey = {
                              'COMPLETED': 'completed',
                              'CUSTOMER_NOT_AVAILABLE': 'customerNotAvailable',
                              'IN_PROGRESS': 'inProgress',
                              'PENDING': 'pending',
                              'WRONG_ADDRESS': 'wrongAddress',
                              'REFUSED': 'refused'
                            }[visit.status] || visit.status.toLowerCase();
                            return t(`executiveCollection.fieldCollection.overview.visitStatus.${statusKey}`);
                          })()}
                        </Badge>
                      </div>
                      <div className="font-bold">{formatCurrency(visit.amount)}</div>
                      <div>{visit.duration} {t('executiveCollection.fieldCollection.time.min')}</div>
                      <div>{visit.distance} {t('executiveCollection.fieldCollection.time.km')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Visits */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.overview.upcomingVisits')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.overview.nextScheduledFieldVisits')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingVisits.map((visit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Clock className="h-5 w-5 mx-auto text-gray-400" />
                        <p className="text-sm font-medium">{visit.time}</p>
                      </div>
                      <div>
                        <p className="font-medium">{visit.customer}</p>
                        <p className="text-sm text-gray-600">{visit.address}</p>
                        <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.overview.upcomingVisitDetails.agent')}: {visit.agent}</p>
                      </div>
                    </div>
                    <div className={i18n.dir() === 'rtl' ? 'text-left' : 'text-right'}>
                      <p className={`font-bold ${getPriorityColor(visit.priority)}`}>
                        {formatCurrency(visit.amount)}
                      </p>
                      <Badge variant="outline">{t('executiveCollection.fieldCollection.overview.upcomingVisitDetails.dpd')}: {visit.dpd}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          {/* Agent Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.agents.fieldAgentPerformance')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.agents.monthlyPerformanceMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-4 p-4 border-b font-medium text-sm">
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.agentName')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.visits')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.successful')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.successRate')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.amountCollected')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.avgTime')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.distance')}</div>
                    <div>{t('executiveCollection.fieldCollection.agents.tableHeaders.rating')}</div>
                  </div>
                  {(fieldMetrics.agentPerformance || []).map((agent, index) => (
                    <div key={index} className="grid grid-cols-8 gap-4 p-4 border-b text-sm">
                      <div className="font-medium">{agent.name}</div>
                      <div>{agent.visits}</div>
                      <div>{agent.successful}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Progress value={agent.successRate} className="w-16" />
                          <span>{agent.successRate}%</span>
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        {formatCurrency(agent.collected)}
                      </div>
                      <div>{agent.avgTime} {t('executiveCollection.fieldCollection.time.min')}</div>
                      <div>{agent.distance} {t('executiveCollection.fieldCollection.time.km')}</div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span>{agent.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.agents.agentActivityTimeline')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.agents.realtimeAgentActivities')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {[
                    { time: '13:45', agent: 'Ahmed Hassan', action: 'completedVisit', customer: 'Al-Rashid Trading', result: 'paymentCollected', amount: 125000 },
                    { time: '13:30', agent: 'Omar Khalid', action: 'startedVisit', customer: 'Gulf Industries', result: 'visitInProgress' },
                    { time: '13:15', agent: 'Faisal Ahmed', action: 'enRoute', customer: 'Desert Palm', result: 'eta', eta: '13:25' },
                    { time: '13:00', agent: 'Ahmed Hassan', action: 'checkIn', customer: '-', result: 'safetyCheckCompleted' },
                    { time: '12:45', agent: 'Khalid Mohammed', action: 'visitAttempt', customer: 'Tech Solutions', result: 'customerNotAvailable' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="text-sm text-gray-500">{activity.time}</div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.agent}</p>
                        <p className="text-sm text-gray-600">{t(`executiveCollection.fieldCollection.agents.activities.${activity.action}`)}</p>
                        {activity.customer !== '-' && (
                          <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.agents.activities.customer')}: {activity.customer}</p>
                        )}
                        <p className="text-sm font-medium mt-1">
                          {activity.result === 'paymentCollected' && `${t(`executiveCollection.fieldCollection.agents.activities.${activity.result}`)}: ${formatCurrency(activity.amount)}`}
                          {activity.result === 'eta' && `${t(`executiveCollection.fieldCollection.agents.activities.${activity.result}`)}: ${activity.eta}`}
                          {!['paymentCollected', 'eta'].includes(activity.result) && t(`executiveCollection.fieldCollection.agents.activities.${activity.result}`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {/* Visit Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.visits.fieldVisitPerformanceTrend')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.visits.dailyVisitsAndCollectionAmounts')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={fieldMetrics.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="visits" fill="#8884d8" name={t('executiveCollection.fieldCollection.visits.chartLabels.totalVisits')} />
                  <Bar yAxisId="left" dataKey="successful" fill="#82ca9d" name={t('executiveCollection.fieldCollection.visits.chartLabels.successful')} />
                  <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#E6B800" name={t('executiveCollection.fieldCollection.visits.chartLabels.amount')} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Region Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.visits.performanceByRegion')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.visits.fieldCollectionEffectivenessAcrossRegions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fieldMetrics.regionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="visits" fill="#8884d8" name={t('executiveCollection.fieldCollection.visits.chartLabels.visits')} />
                  <Line yAxisId="right" type="monotone" dataKey="success" stroke="#82ca9d" name={t('executiveCollection.fieldCollection.visits.chartLabels.successRate')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          {/* Route Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.routing.routeOptimizationSummary')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.routing.dailyRouteEfficiencyImprovements')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Route className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.routing.metrics.originalDistance')}</p>
                  <p className="text-2xl font-bold">{routeOptimization.originalDistance} {t('executiveCollection.fieldCollection.time.km')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Navigation className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.routing.metrics.optimizedDistance')}</p>
                  <p className="text-2xl font-bold">{routeOptimization.optimizedDistance} {t('executiveCollection.fieldCollection.time.km')}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Timer className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.routing.metrics.timeSaved')}</p>
                  <p className="text-2xl font-bold">{routeOptimization.timeSaved} {t('executiveCollection.fieldCollection.time.min')}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.routing.metrics.efficiencyGain')}</p>
                  <p className="text-2xl font-bold">{routeOptimization.efficiency}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Planning Map */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.routing.routePlanning')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.routing.optimizedRoutesForFieldAgents')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Route className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">{t('executiveCollection.fieldCollection.routing.mapPlaceholder')}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {t('executiveCollection.fieldCollection.routing.mapDescription')}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm font-medium">{t('executiveCollection.fieldCollection.routing.metrics.distanceSaved')}</p>
                      <p className="text-lg font-bold text-green-600">{routeOptimization.distanceSaved} {t('executiveCollection.fieldCollection.time.km')}</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm font-medium">{t('executiveCollection.fieldCollection.routing.metrics.fuelSaved')}</p>
                      <p className="text-lg font-bold text-green-600">SAR {routeOptimization.fuelSaved}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          {/* Safety Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t('executiveCollection.fieldCollection.safety.safetyScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {fieldMetrics.safetyMetrics.safetyScore}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('executiveCollection.fieldCollection.safety.excellentSafetyRecord')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('executiveCollection.fieldCollection.safety.daysWithoutIncident')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fieldMetrics.safetyMetrics.lastIncidentDays}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('executiveCollection.fieldCollection.safety.continuousImprovement')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('executiveCollection.fieldCollection.safety.checkInsToday')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fieldMetrics.safetyMetrics.checkInsCompleted}/{fieldMetrics.safetyMetrics.checkInsCompleted + fieldMetrics.safetyMetrics.checkInsMissed}
                </div>
                <Progress 
                  value={(fieldMetrics.safetyMetrics.checkInsCompleted / (fieldMetrics.safetyMetrics.checkInsCompleted + fieldMetrics.safetyMetrics.checkInsMissed)) * 100} 
                  className="mt-1 h-1"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('executiveCollection.fieldCollection.safety.sosAlerts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fieldMetrics.safetyMetrics.sosAlerts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('executiveCollection.fieldCollection.safety.noEmergenciesToday')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Safety Protocol Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.safety.safetyProtocolCompliance')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.safety.agentComplianceWithSafetyProcedures')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { protocol: 'preVisitCheckIn', compliance: 98, agents: 28 },
                  { protocol: 'postVisitCheckOut', compliance: 95, agents: 28 },
                  { protocol: 'routeSharing', compliance: 100, agents: 28 },
                  { protocol: 'emergencyContactUpdate', compliance: 92, agents: 28 },
                  { protocol: 'vehicleInspection', compliance: 88, agents: 28 }
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{t(`executiveCollection.fieldCollection.safety.protocols.${item.protocol}`)}</span>
                      <span className="text-sm">{item.compliance}%</span>
                    </div>
                    <Progress value={item.compliance} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">{Math.floor(item.agents * item.compliance / 100)} {t('executiveCollection.fieldCollection.safety.of')} {item.agents} {t('executiveCollection.fieldCollection.safety.agentsCompliant')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.analytics.fieldCollectionCostAnalysis')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.analytics.operationalCostsAndEfficiencyMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Car className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.analytics.costMetrics.totalFuelCost')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(fieldMetrics.costAnalysis?.totalFuelCost || 0)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.analytics.costMetrics.costPerVisit')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(fieldMetrics.costAnalysis?.avgCostPerVisit || 0)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{t('executiveCollection.fieldCollection.analytics.costMetrics.costPerCollection')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(fieldMetrics.costAnalysis?.costPerCollection || 0)}</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: 'Jan', cost: 125, collections: 85 },
                  { month: 'Feb', cost: 118, collections: 88 },
                  { month: 'Mar', cost: 122, collections: 86 },
                  { month: 'Apr', cost: 115, collections: 90 },
                  { month: 'May', cost: 112, collections: 92 },
                  { month: 'Jun', cost: 108, collections: 94 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#8884d8" name={t('executiveCollection.fieldCollection.analytics.chartLabels.costPerVisit')} />
                  <Line yAxisId="right" type="monotone" dataKey="collections" stroke="#82ca9d" name={t('executiveCollection.fieldCollection.analytics.chartLabels.collectionRate')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visit Outcome Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('executiveCollection.fieldCollection.analytics.visitOutcomeAnalysis')}</CardTitle>
              <CardDescription>{t('executiveCollection.fieldCollection.analytics.reasonsForUnsuccessfulVisits')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { reason: 'customerNotAvailable', count: 45, percentage: 35 },
                  { reason: 'wrongAddress', count: 23, percentage: 18 },
                  { reason: 'customerRefused', count: 19, percentage: 15 },
                  { reason: 'partialPaymentOnly', count: 16, percentage: 12 },
                  { reason: 'rescheduled', count: 14, percentage: 11 },
                  { reason: 'other', count: 11, percentage: 9 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="reason" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tickFormatter={(value) => t(`executiveCollection.fieldCollection.analytics.visitOutcomes.${value}`)}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value,
                      t(`executiveCollection.fieldCollection.analytics.visitOutcomes.${props.payload.reason}`)
                    ]}
                  />
                  <Bar dataKey="count" fill="#E6B800" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldCollectionDashboard;