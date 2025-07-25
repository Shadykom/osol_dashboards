import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter
} from 'lucide-react';

// Mock data for operations dashboard
const operationalKPIs = {
  dailyTransactions: 45678,
  transactionVolume: 125000000, // SAR 125M
  systemUptime: 99.97,
  avgProcessingTime: 2.3, // seconds
  failedTransactions: 23,
  pendingApprovals: 156,
  activeUsers: 8547,
  peakConcurrentUsers: 12890,
  branchOperations: 45,
  atmAvailability: 98.5,
  callCenterCalls: 1247,
  avgCallDuration: 4.2 // minutes
};

const hourlyTransactions = [
  { hour: '00:00', count: 245, volume: 850000 },
  { hour: '01:00', count: 189, volume: 620000 },
  { hour: '02:00', count: 156, volume: 480000 },
  { hour: '03:00', count: 134, volume: 390000 },
  { hour: '04:00', count: 167, volume: 520000 },
  { hour: '05:00', count: 298, volume: 890000 },
  { hour: '06:00', count: 567, volume: 1650000 },
  { hour: '07:00', count: 1234, volume: 3200000 },
  { hour: '08:00', count: 2890, volume: 7800000 },
  { hour: '09:00', count: 4567, volume: 12500000 },
  { hour: '10:00', count: 5234, volume: 15200000 },
  { hour: '11:00', count: 4890, volume: 14100000 },
  { hour: '12:00', count: 5678, volume: 16800000 },
  { hour: '13:00', count: 4234, volume: 12900000 },
  { hour: '14:00', count: 3890, volume: 11200000 },
  { hour: '15:00', count: 3456, volume: 9800000 },
  { hour: '16:00', count: 2890, volume: 8100000 },
  { hour: '17:00', count: 2345, volume: 6700000 },
  { hour: '18:00', count: 1890, volume: 5200000 },
  { hour: '19:00', count: 1456, volume: 3900000 },
  { hour: '20:00', count: 1123, volume: 2800000 },
  { hour: '21:00', count: 890, volume: 2100000 },
  { hour: '22:00', count: 678, volume: 1600000 },
  { hour: '23:00', count: 456, volume: 1200000 }
];

const channelPerformance = [
  { channel: 'Mobile App', transactions: 18500, percentage: 40.5, status: 'operational' },
  { channel: 'Internet Banking', transactions: 12300, percentage: 27.0, status: 'operational' },
  { channel: 'ATM', transactions: 8900, percentage: 19.5, status: 'operational' },
  { channel: 'Branch', transactions: 4200, percentage: 9.2, status: 'operational' },
  { channel: 'Call Center', transactions: 1778, percentage: 3.8, status: 'maintenance' }
];

const systemHealth = [
  { system: 'Core Banking', status: 'operational', uptime: 99.98, response: 1.2 },
  { system: 'Payment Gateway', status: 'operational', uptime: 99.95, response: 0.8 },
  { system: 'Mobile App Backend', status: 'operational', uptime: 99.92, response: 1.5 },
  { system: 'ATM Network', status: 'warning', uptime: 98.5, response: 2.1 },
  { system: 'Card Processing', status: 'operational', uptime: 99.97, response: 0.9 }
];

const alerts = [
  { id: 1, type: 'warning', message: 'ATM #ATM-045 low cash alert', time: '10 minutes ago', severity: 'medium' },
  { id: 2, type: 'info', message: 'Scheduled maintenance completed', time: '25 minutes ago', severity: 'low' },
  { id: 3, type: 'error', message: 'Failed transaction spike detected', time: '1 hour ago', severity: 'high' },
  { id: 4, type: 'warning', message: 'High call center volume', time: '2 hours ago', severity: 'medium' }
];

const branchMetrics = [
  { branch: 'Riyadh Main', transactions: 1250, customers: 340, efficiency: 92 },
  { branch: 'Jeddah Central', transactions: 980, customers: 280, efficiency: 88 },
  { branch: 'Dammam Branch', transactions: 750, customers: 210, efficiency: 85 },
  { branch: 'Mecca Branch', transactions: 680, customers: 190, efficiency: 90 },
  { branch: 'Medina Branch', transactions: 520, customers: 150, efficiency: 87 }
];

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

function SystemHealthCard({ system, status, uptime, response }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{system}</span>
          </div>
          <Badge className={getStatusColor()}>
            {status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-semibold">{uptime}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Response</p>
            <p className="font-semibold">{response}s</p>
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
  const [selectedView, setSelectedView] = useState('realtime');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // In a real app, this would trigger data refresh
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
          <Button variant="outline" size="sm">
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
            value={operationalKPIs.dailyTransactions}
            change="+8.5%"
            trend="up"
            icon={Activity}
            description="Today's total"
            status="good"
          />
          <OperationalKPICard
            title="Transaction Volume"
            value={operationalKPIs.transactionVolume}
            change="+12.3%"
            trend="up"
            icon={DollarSign}
            description="Today's volume"
            format="currency"
            status="good"
          />
          <OperationalKPICard
            title="System Uptime"
            value={operationalKPIs.systemUptime}
            change="+0.02%"
            trend="up"
            icon={Server}
            description="Current uptime"
            format="percentage"
            status="good"
          />
          <OperationalKPICard
            title="Failed Transactions"
            value={operationalKPIs.failedTransactions}
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
            value={operationalKPIs.avgProcessingTime}
            change="-0.3s"
            trend="up"
            icon={Zap}
            description="Response time"
            format="time"
            status="good"
          />
          <OperationalKPICard
            title="Active Users"
            value={operationalKPIs.activeUsers}
            change="+5.2%"
            trend="up"
            icon={Users}
            description="Currently online"
            status="good"
          />
          <OperationalKPICard
            title="Pending Approvals"
            value={operationalKPIs.pendingApprovals}
            change="+12"
            trend="down"
            icon={Clock}
            description="Awaiting approval"
            status="warning"
          />
          <OperationalKPICard
            title="ATM Availability"
            value={operationalKPIs.atmAvailability}
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
                  <AreaChart data={hourlyTransactions}>
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
                  {systemHealth.map((system, index) => (
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
                <BarChart data={channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#E6B800" name="Transactions" />
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
                <BarChart data={branchMetrics}>
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
          {alerts.map((alert) => (
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
              <Database className="h-6 w-6 mb-2" />
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

