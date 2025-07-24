// src/pages/CustomDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid,
  Save,
  RefreshCw,
  Settings,
  Plus,
  X,
  GripVertical,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  PiggyBank,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Shield,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase, TABLES } from '@/lib/supabase';
import { DashboardService } from '@/services/dashboardService';
import { CustomerService } from '@/services/customerService';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Widget Types Configuration
const WIDGET_TYPES = {
  KPI_OVERVIEW: {
    id: 'kpi_overview',
    name: 'KPI Overview',
    icon: TrendingUp,
    minWidth: 4,
    minHeight: 2,
    defaultSize: { w: 12, h: 2 }
  },
  REVENUE_CHART: {
    id: 'revenue_chart',
    name: 'Revenue Trends',
    icon: LineChart,
    minWidth: 6,
    minHeight: 3,
    defaultSize: { w: 6, h: 3 }
  },
  CUSTOMER_SEGMENTS: {
    id: 'customer_segments',
    name: 'Customer Segments',
    icon: PieChart,
    minWidth: 4,
    minHeight: 3,
    defaultSize: { w: 4, h: 3 }
  },
  TRANSACTION_ACTIVITY: {
    id: 'transaction_activity',
    name: 'Transaction Activity',
    icon: Activity,
    minWidth: 6,
    minHeight: 3,
    defaultSize: { w: 6, h: 3 }
  },
  LOAN_PORTFOLIO: {
    id: 'loan_portfolio',
    name: 'Loan Portfolio',
    icon: PiggyBank,
    minWidth: 4,
    minHeight: 3,
    defaultSize: { w: 4, h: 3 }
  },
  ACCOUNT_STATS: {
    id: 'account_stats',
    name: 'Account Statistics',
    icon: CreditCard,
    minWidth: 4,
    minHeight: 2,
    defaultSize: { w: 4, h: 2 }
  },
  BRANCH_PERFORMANCE: {
    id: 'branch_performance',
    name: 'Branch Performance',
    icon: Building2,
    minWidth: 6,
    minHeight: 3,
    defaultSize: { w: 6, h: 3 }
  },
  COMPLIANCE_STATUS: {
    id: 'compliance_status',
    name: 'Compliance Status',
    icon: Shield,
    minWidth: 4,
    minHeight: 2,
    defaultSize: { w: 4, h: 2 }
  },
  RECENT_TRANSACTIONS: {
    id: 'recent_transactions',
    name: 'Recent Transactions',
    icon: Clock,
    minWidth: 6,
    minHeight: 3,
    defaultSize: { w: 6, h: 3 }
  },
  ALERTS_PANEL: {
    id: 'alerts_panel',
    name: 'System Alerts',
    icon: AlertCircle,
    minWidth: 4,
    minHeight: 2,
    defaultSize: { w: 4, h: 2 }
  },
  COMPARISON_WIDGET: {
    id: 'comparison_widget',
    name: 'Period Comparison',
    icon: BarChart3,
    minWidth: 12,
    minHeight: 3,
    defaultSize: { w: 12, h: 3 }
  }
};

// Default dashboard layout
const DEFAULT_LAYOUT = [
  { id: 'kpi_1', type: 'KPI_OVERVIEW', x: 0, y: 0, w: 12, h: 2 },
  { id: 'revenue_1', type: 'REVENUE_CHART', x: 0, y: 2, w: 6, h: 3 },
  { id: 'segments_1', type: 'CUSTOMER_SEGMENTS', x: 6, y: 2, w: 6, h: 3 },
  { id: 'transactions_1', type: 'TRANSACTION_ACTIVITY', x: 0, y: 5, w: 8, h: 3 },
  { id: 'alerts_1', type: 'ALERTS_PANEL', x: 8, y: 5, w: 4, h: 3 },
  { id: 'comparison_1', type: 'COMPARISON_WIDGET', x: 0, y: 8, w: 12, h: 3 }
];

export function CustomDashboard() {
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('customDashboardLayout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [widgets, setWidgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [widgetData, setWidgetData] = useState({});

  // Fetch all widget data
  const fetchAllData = useCallback(async () => {
    try {
      const [kpis, comparison, customerAnalytics, transactionAnalytics, loanAnalytics, recentTransactions] = await Promise.all([
        DashboardService.getExecutiveKPIs(),
        DashboardService.getMonthlyComparison(),
        CustomerService.getCustomerAnalytics(),
        DashboardService.getTransactionAnalytics(),
        DashboardService.getLoanAnalytics(),
        DashboardService.getRecentTransactions(5)
      ]);

      // Mock additional data that might not be in the service yet
      const mockAlerts = [
        { id: 1, type: 'warning', message: 'High transaction volume detected', severity: 'medium' },
        { id: 2, type: 'info', message: 'System maintenance scheduled', severity: 'low' },
        { id: 3, type: 'error', message: 'Failed transaction spike', severity: 'high' }
      ];

      const mockBranchData = [
        { branch: 'Riyadh Main', revenue: 12500000, customers: 3500, efficiency: 92 },
        { branch: 'Jeddah Central', revenue: 10200000, customers: 2800, efficiency: 88 },
        { branch: 'Dammam Branch', revenue: 7800000, customers: 2100, efficiency: 85 }
      ];

      const mockAccountStats = {
        totalAccounts: kpis.data?.total_accounts || 18293,
        activeAccounts: Math.round((kpis.data?.total_accounts || 18293) * 0.85),
        dormantAccounts: Math.round((kpis.data?.total_accounts || 18293) * 0.1),
        blockedAccounts: Math.round((kpis.data?.total_accounts || 18293) * 0.05)
      };

      const mockComplianceData = {
        overallScore: 88,
        amlScore: 92,
        kycScore: 85,
        regulatoryScore: 90,
        dataPrivacyScore: 87
      };

      setWidgetData({
        kpis: kpis.data,
        comparison: comparison.data,
        customerAnalytics: customerAnalytics.data,
        transactionAnalytics: transactionAnalytics.data,
        loanAnalytics: loanAnalytics.data,
        recentTransactions: recentTransactions.data,
        alerts: mockAlerts,
        branchPerformance: mockBranchData,
        accountStats: mockAccountStats,
        complianceData: mockComplianceData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'kastle_banking' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const addWidget = (type) => {
    const widgetConfig = WIDGET_TYPES[type];
    const newWidget = {
      id: `${widgetConfig.id}_${Date.now()}`,
      type,
      x: 0,
      y: Math.max(...layout.map(w => w.y + w.h), 0),
      ...widgetConfig.defaultSize
    };
    setLayout([...layout, newWidget]);
    setShowAddWidget(false);
    toast.success(`${widgetConfig.name} added to dashboard`);
  };

  const removeWidget = (widgetId) => {
    setLayout(layout.filter(w => w.id !== widgetId));
    toast.success('Widget removed');
  };

  const saveLayout = () => {
    localStorage.setItem('customDashboardLayout', JSON.stringify(layout));
    toast.success('Dashboard layout saved');
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('customDashboardLayout');
    toast.success('Dashboard reset to default');
  };

  // Widget Renderers
  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'KPI_OVERVIEW':
        return <KPIOverviewWidget data={widgetData.kpis} />;
      case 'REVENUE_CHART':
        return <RevenueChartWidget data={widgetData.comparison} />;
      case 'CUSTOMER_SEGMENTS':
        return <CustomerSegmentsWidget data={widgetData.customerAnalytics} />;
      case 'TRANSACTION_ACTIVITY':
        return <TransactionActivityWidget data={widgetData.transactionAnalytics} />;
      case 'LOAN_PORTFOLIO':
        return <LoanPortfolioWidget data={widgetData.loanAnalytics} />;
      case 'ACCOUNT_STATS':
        return <AccountStatsWidget data={widgetData.accountStats} />;
      case 'BRANCH_PERFORMANCE':
        return <BranchPerformanceWidget data={widgetData.branchPerformance} />;
      case 'COMPLIANCE_STATUS':
        return <ComplianceStatusWidget data={widgetData.complianceData} />;
      case 'RECENT_TRANSACTIONS':
        return <RecentTransactionsWidget data={widgetData.recentTransactions} />;
      case 'ALERTS_PANEL':
        return <AlertsPanelWidget data={widgetData.alerts} />;
      case 'COMPARISON_WIDGET':
        return (
          <ComparisonWidget
            title="Performance Comparison"
            data={{ monthlyComparison: widgetData.comparison }}
            comparisonType="month"
          />
        );
      default:
        return <div>Unknown widget type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Dashboard</h1>
          <p className="text-muted-foreground">Personalized view of your banking operations</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto Refresh Controls */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            {autoRefresh && (
              <Select value={refreshInterval.toString()} onValueChange={(v) => setRefreshInterval(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                  <SelectItem value="300000">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? 'Done' : 'Customize'}
          </Button>
          {editMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWidget(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveLayout}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showAddWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddWidget(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background p-6 rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Widget</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddWidget(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(WIDGET_TYPES).map(([key, config]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addWidget(key)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <config.icon className="h-5 w-5" />
                        <CardTitle className="text-base">{config.name}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4">
        {layout.map((widget) => (
          <motion.div
            key={widget.id}
            className={`col-span-${widget.w}`}
            style={{ gridColumn: `span ${widget.w}` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="h-full relative group">
              {editMode && (
                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeWidget(widget.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="h-full">
                {renderWidget(widget)}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Widget Components
function KPIOverviewWidget({ data }) {
  const kpis = [
    {
      label: 'Total Customers',
      value: data?.total_customers || 0,
      icon: Users,
      change: '+12.5%',
      trend: 'up'
    },
    {
      label: 'Total Accounts',
      value: data?.total_accounts || 0,
      icon: CreditCard,
      change: '+8.2%',
      trend: 'up'
    },
    {
      label: 'Total Deposits',
      value: `SAR ${((data?.total_deposits || 0) / 1000000000).toFixed(1)}B`,
      icon: DollarSign,
      change: '+15.3%',
      trend: 'up'
    },
    {
      label: 'Loan Portfolio',
      value: `SAR ${((data?.total_loans || 0) / 1000000000).toFixed(1)}B`,
      icon: PiggyBank,
      change: '+22.1%',
      trend: 'up'
    }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="text-center">
            <kpi.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</div>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <div className={`text-sm mt-1 ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpi.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueChartWidget({ data }) {
  const chartData = data?.trends || [];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
          <Area type="monotone" dataKey="revenue" stroke="#E6B800" fill="#E6B800" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomerSegmentsWidget({ data }) {
  const segments = data?.by_segment || [];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie
            data={segments}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ segment, percentage }) => `${segment}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {segments.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TransactionActivityWidget({ data }) {
  const channels = data?.by_channel || [];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Transaction Activity by Channel</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={channels}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="channel" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#4A5568" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <Badge variant="outline" className="text-lg">
          Success Rate: {data?.success_rate || 0}%
        </Badge>
      </div>
    </div>
  );
}

function LoanPortfolioWidget({ data }) {
  const portfolioData = [
    { name: 'Disbursed', value: data?.disbursed_amount || 0 },
    { name: 'Outstanding', value: data?.outstanding_amount || 0 }
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Loan Portfolio</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Portfolio</p>
          <p className="text-2xl font-bold">SAR {((data?.total_portfolio || 0) / 1000000).toFixed(1)}M</p>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={portfolioData}>
            <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
            <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Default Rate</p>
            <p className="font-semibold">{data?.default_rate || 0}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Active Loans</p>
            <p className="font-semibold">{data?.by_status?.find(s => s.status === 'ACTIVE')?.count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountStatsWidget({ data }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Accounts</p>
          <p className="text-xl font-bold">{(data?.totalAccounts || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-xl font-bold text-green-500">{(data?.activeAccounts || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dormant</p>
          <p className="text-xl font-bold text-yellow-500">{(data?.dormantAccounts || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Blocked</p>
          <p className="text-xl font-bold text-red-500">{(data?.blockedAccounts || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function BranchPerformanceWidget({ data = [] }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Branch Performance</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="branch" angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="efficiency" fill="#68D391" name="Efficiency %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComplianceStatusWidget({ data }) {
  const scores = [
    { name: 'Overall', score: data?.overallScore || 0 },
    { name: 'AML/CFT', score: data?.amlScore || 0 },
    { name: 'KYC', score: data?.kycScore || 0 },
    { name: 'Regulatory', score: data?.regulatoryScore || 0 }
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
      <div className="space-y-3">
        {scores.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.name}</span>
              <span className="font-semibold">{item.score}%</span>
            </div>
            <Progress value={item.score} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTransactionsWidget({ data = [] }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {data.slice(0, 5).map((transaction, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{transaction.customer}</p>
              <p className="text-sm text-muted-foreground">{transaction.type} • {transaction.time}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{transaction.amount}</p>
              <Badge variant={transaction.status === 'Completed' ? 'success' : 'warning'}>
                {transaction.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPanelWidget({ data = [] }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
      <div className="space-y-3">
        {data.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <p className="text-sm">{alert.message}</p>
              <Badge variant="outline" className="mt-1">{alert.severity}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}