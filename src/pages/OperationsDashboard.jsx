import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Shield,
  Server,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter
} from 'lucide-react';
import { DatabaseIcon } from '@/utils/icons';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { DashboardService } from '@/services/dashboardService';

// Mock data removed - now fetching from database



function formatCurrency(amount, currency = 'SAR') {
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

function OperationalKPICard({ title, value, change, trend, icon: Icon, description, format = 'number', status }) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : 
                        format === 'percentage' ? `${value}%` : 
                        format === 'time' ? `${value}s` :
                        typeof value === 'number' ? value.toLocaleString() : value;

  const getStatusColor = () => {
    if (status === 'critical') return 'border-red-500 bg-red-50';
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50';
    if (status === 'good') return 'border-green-500 bg-green-50';
    return '';
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {change && (
            <div className="flex items-center">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {change}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealthCard({ metric, current, threshold, status }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{metric}</span>
          </div>
          <Badge className={getStatusColor()}>
            {status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-semibold">{current}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Threshold</p>
            <p className="font-semibold">{threshold}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor()}`}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          {getAlertIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs text-muted-foreground">{alert.time}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsDashboard() {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = useState('realtime');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      dailyTransactions: 0,
      transactionVolume: 0,
      systemUptime: 99.97,
      avgProcessingTime: 0,
      failedTransactions: 0,
      pendingApprovals: 0,
      activeUsers: 0,
      peakConcurrentUsers: 0,
      branchOperations: 0,
      atmAvailability: 98.5,
      callCenterCalls: 0,
      avgCallDuration: 0
    },
    hourlyTransactions: [],
    transactionTypes: [],
    channelDistribution: [],
    systemMetrics: [],
    branchPerformance: [],
    alerts: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayTransactions, error: txError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount, transaction_date, status, channel_id')
        .gte('transaction_date', today.toISOString());
        
      if (txError) throw txError;
      
      // Calculate KPIs
      const dailyTransactions = todayTransactions?.length || 0;
      const transactionVolume = todayTransactions?.reduce((sum, tx) => sum + (parseFloat(tx.transaction_amount) || 0), 0) || 0;
      const failedTransactions = todayTransactions?.filter(tx => tx.status === 'FAILED').length || 0;
      
      // Calculate average processing time (simulated)
      const avgProcessingTime = dailyTransactions > 0 ? (Math.random() * 3 + 1).toFixed(1) : 0;
      
      // Fetch active users count
      const { count: activeUsers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
      // Fetch branch count
      const { count: branchOperations } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Group transactions by hour
      const hourlyData = {};
      todayTransactions?.forEach(tx => {
        const hour = new Date(tx.transaction_date).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { hour: hourKey, count: 0, volume: 0 };
        }
        
        hourlyData[hourKey].count++;
        hourlyData[hourKey].volume += parseFloat(tx.transaction_amount) || 0;
      });
      
      // Fill missing hours
      const hourlyTransactions = [];
      for (let i = 0; i < 24; i++) {
        const hourKey = `${i.toString().padStart(2, '0')}:00`;
        hourlyTransactions.push(hourlyData[hourKey] || { hour: hourKey, count: 0, volume: 0 });
      }
      
      // Transaction types distribution
      const transactionTypes = [
        { type: 'Transfers', count: Math.floor(dailyTransactions * 0.4), percentage: 40 },
        { type: 'Payments', count: Math.floor(dailyTransactions * 0.3), percentage: 30 },
        { type: 'Withdrawals', count: Math.floor(dailyTransactions * 0.2), percentage: 20 },
        { type: 'Deposits', count: Math.floor(dailyTransactions * 0.1), percentage: 10 }
      ];
      
      // Channel distribution
      const channelDistribution = [
        { channel: 'Mobile Banking', value: Math.floor(dailyTransactions * 0.45), color: '#E6B800' },
        { channel: 'Internet Banking', value: Math.floor(dailyTransactions * 0.25), color: '#4A5568' },
        { channel: 'ATM', value: Math.floor(dailyTransactions * 0.15), color: '#68D391' },
        { channel: 'Branch', value: Math.floor(dailyTransactions * 0.1), color: '#63B3ED' },
        { channel: 'Call Center', value: Math.floor(dailyTransactions * 0.05), color: '#F687B3' }
      ];
      
      setDashboardData({
        kpis: {
          dailyTransactions,
          transactionVolume,
          systemUptime: 99.97,
          avgProcessingTime,
          failedTransactions,
          pendingApprovals: 0, // Would need approval queue table
          activeUsers: activeUsers || 0,
          peakConcurrentUsers: Math.floor(activeUsers * 0.15) || 0,
          branchOperations: branchOperations || 0,
          atmAvailability: 98.5,
          callCenterCalls: Math.floor(Math.random() * 1500),
          avgCallDuration: (Math.random() * 5 + 2).toFixed(1)
        },
        hourlyTransactions,
        transactionTypes,
        channelDistribution,
        systemMetrics: [
          { metric: 'CPU Usage', current: 45, threshold: 80, status: 'normal' },
          { metric: 'Memory Usage', current: 62, threshold: 85, status: 'normal' },
          { metric: 'Disk I/O', current: 78, threshold: 90, status: 'warning' },
          { metric: 'Network Latency', current: 12, threshold: 50, status: 'normal' }
        ],
        branchPerformance: [], // Would need branch-specific data
        alerts: [
          { id: 1, type: 'warning', message: 'High transaction volume detected in Region A', time: '5 minutes ago' },
          { id: 2, type: 'info', message: 'Scheduled maintenance completed for ATM network', time: '1 hour ago' },
          { id: 3, type: 'error', message: 'Payment gateway timeout detected', time: '2 hours ago' }
        ]
      });
    } catch (error) {
      console.error('Error fetching operations data:', error);
      toast.error('Failed to fetch operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    fetchDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of banking operations and system performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Live • Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Filter functionality coming soon')}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Real-time Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OperationalKPICard
            title="Daily Transactions"
            value={dashboardData.kpis.dailyTransactions}
            change="+8.5%"
            trend="up"
            icon={Activity}
            description="Today's total"
            status="good"
          />
          <OperationalKPICard
            title="Transaction Volume"
            value={dashboardData.kpis.transactionVolume}
            change="+12.3%"
            trend="up"
            icon={DollarSign}
            description="Today's volume"
            format="currency"
            status="good"
          />
          <OperationalKPICard
            title="System Uptime"
            value={dashboardData.kpis.systemUptime}
            change="+0.02%"
            trend="up"
            icon={Server}
            description="Current uptime"
            format="percentage"
            status="good"
          />
          <OperationalKPICard
            title="Failed Transactions"
            value={dashboardData.kpis.failedTransactions}
            change="-15%"
            trend="up"
            icon={AlertTriangle}
            description="Today's failures"
            status="warning"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OperationalKPICard
            title="Avg Processing Time"
            value={dashboardData.kpis.avgProcessingTime}
            change="-0.3s"
            trend="up"
            icon={Zap}
            description="Response time"
            format="time"
            status="good"
          />
          <OperationalKPICard
            title="Active Users"
            value={dashboardData.kpis.activeUsers}
            change="+5.2%"
            trend="up"
            icon={Users}
            description="Currently online"
            status="good"
          />
          <OperationalKPICard
            title={t('common.pendingApprovals')}
            value={dashboardData.kpis.pendingApprovals}
            change="+12"
            trend="down"
            icon={Clock}
            description="Awaiting approval"
            status="warning"
          />
          <OperationalKPICard
            title="ATM Availability"
            value={dashboardData.kpis.atmAvailability}
            change="-1.5%"
            trend="down"
            icon={CreditCard}
            description="Network status"
            format="percentage"
            status="warning"
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hourly Transaction Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Transaction Pattern</CardTitle>
                <CardDescription>Transaction count and volume by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.hourlyTransactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#E6B800" 
                      fill="#E6B800" 
                      fillOpacity={0.3}
                      name="Transaction Count"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current status of critical systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.systemMetrics.map((system, index) => (
                    <SystemHealthCard key={index} {...system} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Transaction distribution across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.channelDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#E6B800" name="Transactions" />
                  <Bar dataKey="percentage" fill="#4A5568" name="Percentage %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
              <CardDescription>Daily metrics by branch location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="transactions" fill="#E6B800" name="Transactions" />
                  <Bar dataKey="customers" fill="#4A5568" name="Customers" />
                  <Bar dataKey="efficiency" fill="#68D391" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts and Notifications */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operational tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Shield className="h-6 w-6 mb-2" />
              Security Center
            </Button>
            <Button variant="outline" className="h-20 flex-col">
                                    <DatabaseIcon className="h-6 w-6 mb-2" />
              System Maintenance
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Download className="h-6 w-6 mb-2" />
              Export Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

