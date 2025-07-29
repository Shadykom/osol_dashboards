import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Save, RefreshCw, Settings, Plus, X,
  Eye, TrendingUp, Users, DollarSign, CreditCard, PiggyBank, 
  Activity, BarChart3, PieChart, LineChart, Calendar, Clock, 
  AlertCircle, CheckCircle, Shield, Building2, Download, Upload, 
  RotateCcw, Lock, Unlock, Share2, Trash2, Copy, MoreVertical,
  ArrowUpDown, Banknote, Wallet, TrendingDown, AlertTriangle,
  FileText, Sparkles, Layers, Target, Brain, Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { DashboardService } from '@/services/dashboardService';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Dashboard Templates
const DASHBOARD_TEMPLATES = {
  executive: {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'High-level KPIs and strategic metrics for executives',
    icon: TrendingUp,
    category: 'Leadership',
    widgets: [
      { type: 'revenue_kpi', category: 'kpis' },
      { type: 'customers_kpi', category: 'kpis' },
      { type: 'deposits_kpi', category: 'kpis' },
      { type: 'loans_kpi', category: 'kpis' },
      { type: 'revenue_trend', category: 'charts' },
      { type: 'customer_segments', category: 'charts' },
      { type: 'monthly_comparison', category: 'comparison' },
      { type: 'branch_performance', category: 'charts' }
    ]
  },
  operations: {
    id: 'operations',
    name: 'Operations Dashboard',
    description: 'Real-time operational metrics and system monitoring',
    icon: Activity,
    category: 'Operations',
    widgets: [
      { type: 'transactions_kpi', category: 'kpis' },
      { type: 'system_health', category: 'monitoring' },
      { type: 'transaction_volume', category: 'charts' },
      { type: 'alerts_summary', category: 'monitoring' },
      { type: 'recent_transactions', category: 'monitoring' },
      { type: 'branch_comparison', category: 'comparison' }
    ]
  },
  risk: {
    id: 'risk',
    name: 'Risk Management',
    description: 'Risk monitoring and compliance tracking',
    icon: Shield,
    category: 'Risk & Compliance',
    widgets: [
      { type: 'npl_ratio_kpi', category: 'kpis' },
      { type: 'loans_kpi', category: 'kpis' },
      { type: 'loan_distribution', category: 'charts' },
      { type: 'alerts_summary', category: 'monitoring' },
      { type: 'monthly_comparison', category: 'comparison' }
    ]
  },
  customer: {
    id: 'customer',
    name: 'Customer Analytics',
    description: 'Customer insights and segmentation analysis',
    icon: Users,
    category: 'Analytics',
    widgets: [
      { type: 'customers_kpi', category: 'kpis' },
      { type: 'accounts_kpi', category: 'kpis' },
      { type: 'avg_balance_kpi', category: 'kpis' },
      { type: 'customer_segments', category: 'charts' },
      { type: 'account_growth', category: 'charts' },
      { type: 'monthly_comparison', category: 'comparison' }
    ]
  },
  financial: {
    id: 'financial',
    name: 'Financial Overview',
    description: 'Comprehensive financial metrics and analysis',
    icon: DollarSign,
    category: 'Finance',
    widgets: [
      { type: 'revenue_kpi', category: 'kpis' },
      { type: 'deposits_kpi', category: 'kpis' },
      { type: 'loans_kpi', category: 'kpis' },
      { type: 'avg_balance_kpi', category: 'kpis' },
      { type: 'revenue_trend', category: 'charts' },
      { type: 'loan_distribution', category: 'charts' },
      { type: 'branch_performance', category: 'charts' },
      { type: 'monthly_comparison', category: 'comparison' }
    ]
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Dashboard',
    description: 'Essential metrics only',
    icon: Sparkles,
    category: 'Basic',
    widgets: [
      { type: 'revenue_kpi', category: 'kpis' },
      { type: 'customers_kpi', category: 'kpis' },
      { type: 'transactions_kpi', category: 'kpis' },
      { type: 'revenue_trend', category: 'charts' }
    ]
  }
};

// Enhanced widget catalog
const WIDGET_CATALOG = {
  kpis: {
    category: 'Key Metrics',
    icon: TrendingUp,
    widgets: {
      customers_kpi: {
        name: 'Total Customers',
        icon: Users,
        description: 'Active customer count',
        dataKey: 'total_customers',
        dataSource: 'customers'
      },
      accounts_kpi: {
        name: 'Total Accounts',
        icon: CreditCard,
        description: 'All account types',
        dataKey: 'total_accounts',
        dataSource: 'accounts'
      },
      deposits_kpi: {
        name: 'Total Deposits',
        icon: PiggyBank,
        description: 'Customer deposits',
        dataKey: 'total_deposits',
        dataSource: 'accounts'
      },
      loans_kpi: {
        name: 'Loan Portfolio',
        icon: Banknote,
        description: 'Outstanding loans',
        dataKey: 'total_loans',
        dataSource: 'loans'
      },
      revenue_kpi: {
        name: 'Monthly Revenue',
        icon: DollarSign,
        description: 'Revenue this month',
        dataKey: 'monthly_revenue',
        dataSource: 'revenue'
      },
      transactions_kpi: {
        name: 'Daily Transactions',
        icon: Activity,
        description: 'Today\'s transactions',
        dataKey: 'daily_transactions',
        dataSource: 'transactions'
      },
      npl_ratio_kpi: {
        name: 'NPL Ratio',
        icon: AlertCircle,
        description: 'Non-performing loans',
        dataKey: 'npl_ratio',
        dataSource: 'loans'
      },
      avg_balance_kpi: {
        name: 'Avg Account Balance',
        icon: Wallet,
        description: 'Average balance per account',
        dataKey: 'avg_balance',
        dataSource: 'accounts'
      }
    }
  },
  charts: {
    category: 'Analytics',
    icon: BarChart3,
    widgets: {
      revenue_trend: {
        name: 'Revenue Trends',
        icon: LineChart,
        description: 'Revenue over time',
        chartType: 'area',
        dataSource: 'revenue'
      },
      customer_segments: {
        name: 'Customer Segments',
        icon: PieChart,
        description: 'Customer distribution',
        chartType: 'pie',
        dataSource: 'customers'
      },
      transaction_volume: {
        name: 'Transaction Volume',
        icon: BarChart3,
        description: 'Daily transaction volume',
        chartType: 'bar',
        dataSource: 'transactions'
      },
      loan_distribution: {
        name: 'Loan Distribution',
        icon: PieChart,
        description: 'Loans by type',
        chartType: 'pie',
        dataSource: 'loans'
      },
      account_growth: {
        name: 'Account Growth',
        icon: LineChart,
        description: 'New accounts over time',
        chartType: 'line',
        dataSource: 'accounts'
      },
      branch_performance: {
        name: 'Branch Performance',
        icon: BarChart3,
        description: 'Performance by branch',
        chartType: 'bar',
        dataSource: 'branches'
      }
    }
  },
  comparison: {
    category: 'Comparisons',
    icon: ArrowUpDown,
    widgets: {
      monthly_comparison: {
        name: 'Monthly Comparison',
        icon: Calendar,
        description: 'Month-over-month metrics',
        dataSource: 'comparison'
      },
      branch_comparison: {
        name: 'Branch Comparison',
        icon: Building2,
        description: 'Compare branch metrics',
        dataSource: 'branches'
      }
    }
  },
  monitoring: {
    category: 'Monitoring',
    icon: Activity,
    widgets: {
      system_health: {
        name: 'System Health',
        icon: Shield,
        description: 'System status overview',
        dataSource: 'system'
      },
      alerts_summary: {
        name: 'Alerts Summary',
        icon: AlertCircle,
        description: 'Active alerts and issues',
        dataSource: 'alerts'
      },
      recent_transactions: {
        name: 'Recent Transactions',
        icon: Activity,
        description: 'Latest transaction activity',
        dataSource: 'transactions'
      }
    }
  }
};

// Local storage keys
const STORAGE_KEYS = {
  DASHBOARD_WIDGETS: 'kastle_dashboard_widgets',
  DASHBOARD_SETTINGS: 'kastle_dashboard_settings',
  CURRENT_TEMPLATE: 'kastle_dashboard_template'
};

export function CustomDashboard() {
  const { t } = useTranslation();
  
  // State for widgets and configurations
  const [widgets, setWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  // Settings
  const [dashboardName, setDashboardName] = useState('My Custom Dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  
  // Dialog states
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadDashboardConfiguration();
    fetchDashboardData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Load dashboard configuration from localStorage
  const loadDashboardConfiguration = () => {
    try {
      const savedWidgets = localStorage.getItem(STORAGE_KEYS.DASHBOARD_WIDGETS);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.DASHBOARD_SETTINGS);
      const savedTemplate = localStorage.getItem(STORAGE_KEYS.CURRENT_TEMPLATE);

      if (savedWidgets) {
        setWidgets(JSON.parse(savedWidgets));
      }

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDashboardName(settings.dashboardName || 'My Custom Dashboard');
        setAutoRefresh(settings.autoRefresh ?? true);
        setRefreshInterval(settings.refreshInterval || 30000);
      }

      if (savedTemplate) {
        setCurrentTemplate(savedTemplate);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  // Save dashboard configuration
  const saveDashboardConfiguration = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_WIDGETS, JSON.stringify(widgets));
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_SETTINGS, JSON.stringify({
        dashboardName,
        autoRefresh,
        refreshInterval,
        savedAt: new Date().toISOString()
      }));
      if (currentTemplate) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_TEMPLATE, currentTemplate);
      }

      toast.success('Dashboard saved successfully');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard');
    }
  }, [widgets, dashboardName, autoRefresh, refreshInterval, currentTemplate]);

  // Load a dashboard template
  const loadTemplate = (templateId) => {
    const template = DASHBOARD_TEMPLATES[templateId];
    if (!template) return;

    // Clear existing widgets
    setWidgets([]);

    // Add template widgets
    const newWidgets = template.widgets.map((widget, index) => {
      const widgetDef = WIDGET_CATALOG[widget.category].widgets[widget.type];
      return {
        id: `${widget.type}_${Date.now()}_${index}`,
        type: widget.type,
        category: widget.category,
        config: {
          title: widgetDef.name,
          ...widgetDef
        }
      };
    });

    setWidgets(newWidgets);
    setDashboardName(template.name);
    setCurrentTemplate(templateId);
    setShowTemplates(false);
    
    toast.success(`${template.name} template loaded`);
  };

  // Fetch data for widgets
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from the service
      const [kpisResponse, comparisonResponse] = await Promise.all([
        DashboardService.getExecutiveKPIs(),
        DashboardService.getMonthlyComparison()
      ]);

      const newData = {
        kpis: kpisResponse.success ? kpisResponse.data : {
          total_customers: 12847,
          total_accounts: 18293,
          total_deposits: 2400000000,
          total_loans: 1800000000,
          daily_transactions: 8547,
          monthly_revenue: 45200000,
          npl_ratio: 2.5,
          avg_balance: 131250
        },
        comparison: comparisonResponse.success ? comparisonResponse.data : {
          current_month: {
            revenue: 0,
            customers: 0,
            transactions: 0,
            deposits: 0
          },
          previous_month: {
            revenue: 0,
            customers: 0,
            transactions: 0,
            deposits: 0
          }
        },
        customerAnalytics: {
          by_segment: [
            { segment: 'Premium', count: 2500, value: 35 },
            { segment: 'Standard', count: 8000, value: 45 },
            { segment: 'Basic', count: 2347, value: 20 }
          ]
        },
        loans: {
          by_type: [
            { type: 'Personal', amount: 5000000, value: 25 },
            { type: 'Mortgage', amount: 15000000, value: 48 },
            { type: 'Auto', amount: 3000000, value: 12 },
            { type: 'Business', amount: 8000000, value: 15 }
          ]
        },
        transactions: {
          recent: [
            { time: '2 min ago', type: 'Deposit', amount: 5000, status: 'completed' },
            { time: '5 min ago', type: 'Withdrawal', amount: 2000, status: 'completed' },
            { time: '8 min ago', type: 'Transfer', amount: 10000, status: 'pending' },
            { time: '12 min ago', type: 'Payment', amount: 1500, status: 'completed' },
            { time: '15 min ago', type: 'Deposit', amount: 25000, status: 'completed' }
          ],
          volume: [
            { day: 'Mon', volume: 125000 },
            { day: 'Tue', volume: 145000 },
            { day: 'Wed', volume: 138000 },
            { day: 'Thu', volume: 152000 },
            { day: 'Fri', volume: 168000 },
            { day: 'Sat', volume: 98000 },
            { day: 'Sun', volume: 85000 }
          ]
        },
        accounts: {
          growth: [
            { month: 'Jul', accounts: 450 },
            { month: 'Aug', accounts: 520 },
            { month: 'Sep', accounts: 480 },
            { month: 'Oct', accounts: 590 },
            { month: 'Nov', accounts: 650 },
            { month: 'Dec', accounts: 720 }
          ]
        },
        branches: [
          { name: 'Riyadh Main', revenue: 12500000, customers: 3500, efficiency: 92 },
          { name: 'Jeddah Central', revenue: 10200000, customers: 2800, efficiency: 88 },
          { name: 'Dammam', revenue: 7800000, customers: 2100, efficiency: 85 },
          { name: 'Mecca', revenue: 6500000, customers: 1900, efficiency: 90 }
        ]
      };

      setWidgetData(newData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Add widget
  const addWidget = (widgetType, category) => {
    const widgetDef = WIDGET_CATALOG[category].widgets[widgetType];
    if (!widgetDef) return;

    const newWidget = {
      id: `${widgetType}_${Date.now()}`,
      type: widgetType,
      category,
      config: {
        title: widgetDef.name,
        ...widgetDef
      }
    };

    setWidgets(prev => [...prev, newWidget]);
    setShowAddWidget(false);
    toast.success(`${widgetDef.name} added`);
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    toast.success('Widget removed');
  };

  // Duplicate widget
  const duplicateWidget = (widget) => {
    const newWidget = {
      ...widget,
      id: `${widget.type}_${Date.now()}`
    };
    setWidgets(prev => [...prev, newWidget]);
    toast.success('Widget duplicated');
  };

  // Export dashboard
  const exportDashboard = () => {
    const config = {
      widgets,
      settings: {
        dashboardName,
        autoRefresh,
        refreshInterval
      },
      template: currentTemplate,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Dashboard exported');
  };

  // Import dashboard
  const importDashboard = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setWidgets(config.widgets || []);
        if (config.settings) {
          setDashboardName(config.settings.dashboardName || 'My Custom Dashboard');
          setAutoRefresh(config.settings.autoRefresh ?? true);
          setRefreshInterval(config.settings.refreshInterval || 30000);
        }
        if (config.template) {
          setCurrentTemplate(config.template);
        }
        toast.success('Dashboard imported');
      } catch (error) {
        toast.error('Failed to import dashboard');
      }
    };
    reader.readAsText(file);
  };

  // Reset dashboard
  const resetDashboard = () => {
    if (confirm('Are you sure you want to reset the dashboard?')) {
      setWidgets([]);
      setDashboardName('My Custom Dashboard');
      setCurrentTemplate(null);
      localStorage.removeItem(STORAGE_KEYS.DASHBOARD_WIDGETS);
      localStorage.removeItem(STORAGE_KEYS.DASHBOARD_SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TEMPLATE);
      toast.success('Dashboard reset');
    }
  };

  // Render individual widget
  const renderWidget = (widget) => {
    const { type, category, config } = widget;

    // KPI Widgets
    if (category === 'kpis') {
      const value = widgetData.kpis?.[config.dataKey] || 0;
      let formattedValue = value.toLocaleString();
      let change = Math.floor(Math.random() * 20) - 5;
      let trend = change > 0 ? 'up' : 'down';

      if (config.dataKey.includes('revenue') || config.dataKey.includes('deposits') || config.dataKey.includes('loans') || config.dataKey === 'avg_balance') {
        formattedValue = value >= 1000000000 
          ? `SAR ${(value / 1000000000).toFixed(1)}B`
          : `SAR ${(value / 1000000).toFixed(1)}M`;
      } else if (config.dataKey.includes('ratio')) {
        formattedValue = `${value.toFixed(1)}%`;
      }

      return (
        <WidgetWrapper
          widget={widget}
          onRemove={() => removeWidget(widget.id)}
          onDuplicate={() => duplicateWidget(widget)}
          isEditMode={isEditMode}
        >
          <div className="p-6">
            <div className="text-2xl font-bold">{formattedValue}</div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            <div className={`text-sm mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}% vs last period
            </div>
          </div>
        </WidgetWrapper>
      );
    }

    // Chart Widgets
    if (category === 'charts') {
      let chartData = [];
      
      switch (type) {
        case 'revenue_trend':
          chartData = widgetData.comparison?.trends || [];
          break;
        case 'customer_segments':
          chartData = widgetData.customerAnalytics?.by_segment || [];
          break;
        case 'transaction_volume':
          chartData = widgetData.transactions?.volume || [];
          break;
        case 'loan_distribution':
          chartData = widgetData.loans?.by_type || [];
          break;
        case 'account_growth':
          chartData = widgetData.accounts?.growth || [];
          break;
        case 'branch_performance':
          chartData = widgetData.branches || [];
          break;
      }

      return (
        <WidgetWrapper
          widget={widget}
          onRemove={() => removeWidget(widget.id)}
          onDuplicate={() => duplicateWidget(widget)}
          isEditMode={isEditMode}
        >
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              {config.chartType === 'pie' ? (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name || type}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              ) : config.chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={type === 'branch_performance' ? 'name' : type === 'transaction_volume' ? 'day' : 'name'} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={type === 'branch_performance' ? 'revenue' : type === 'transaction_volume' ? 'volume' : 'value'} fill="#E6B800" />
                </BarChart>
              ) : config.chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accounts" stroke="#E6B800" />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#E6B800" fill="#E6B800" fillOpacity={0.3} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </WidgetWrapper>
      );
    }

    // Comparison Widgets
    if (category === 'comparison') {
      if (type === 'monthly_comparison') {
        return (
          <WidgetWrapper
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget)}
            isEditMode={isEditMode}
          >
            <ComparisonWidget
              title="Monthly Performance"
              data={{ monthlyComparison: widgetData.comparison }}
              comparisonType="month"
            />
          </WidgetWrapper>
        );
      }

      if (type === 'branch_comparison') {
        return (
          <WidgetWrapper
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget)}
            isEditMode={isEditMode}
          >
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={widgetData.branches || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#E6B800" name="Revenue" />
                  <Bar dataKey="customers" fill="#4A5568" name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );
      }
    }

    // Monitoring Widgets
    if (category === 'monitoring') {
      if (type === 'system_health') {
        return (
          <WidgetWrapper
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget)}
            isEditMode={isEditMode}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-green-50">
                <span className="text-sm">Core Banking</span>
                <Badge className="bg-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50">
                <span className="text-sm">Payment Gateway</span>
                <Badge className="bg-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50">
                <span className="text-sm">Mobile Banking</span>
                <Badge className="bg-yellow-500">Degraded</Badge>
              </div>
            </div>
          </WidgetWrapper>
        );
      }

      if (type === 'alerts_summary') {
        return (
          <WidgetWrapper
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget)}
            isEditMode={isEditMode}
          >
            <div className="p-4 space-y-2">
              <Alert className="border-red-200 bg-red-50 p-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm ml-2">
                  High transaction failure rate
                </AlertDescription>
              </Alert>
              <Alert className="border-yellow-200 bg-yellow-50 p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm ml-2">
                  ATM cash level low
                </AlertDescription>
              </Alert>
            </div>
          </WidgetWrapper>
        );
      }

      if (type === 'recent_transactions') {
        return (
          <WidgetWrapper
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
            onDuplicate={() => duplicateWidget(widget)}
            isEditMode={isEditMode}
          >
            <div className="p-4">
              <div className="space-y-2">
                {widgetData.transactions?.recent?.map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border-b">
                    <div>
                      <span className="font-medium text-sm">{txn.type}</span>
                      <span className="text-xs text-muted-foreground ml-2">{txn.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">SAR {txn.amount.toLocaleString()}</span>
                      <Badge className={txn.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WidgetWrapper>
        );
      }
    }

    return null;
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {dashboardName}
            {currentTemplate && (
              <Badge variant="outline" className="ml-2">
                <Layers className="w-3 h-3 mr-1" />
                {DASHBOARD_TEMPLATES[currentTemplate]?.name}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Customize your dashboard with widgets and templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={saveDashboardConfiguration}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dashboard Controls</CardTitle>
              <CardDescription>Choose a template or build your own custom dashboard</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode"
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
              />
              <Label htmlFor="edit-mode" className="cursor-pointer">
                {isEditMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isEditMode ? ' Edit Mode' : ' View Mode'}
              </Label>
            </div>
          </div>
        </CardHeader>
        
        {isEditMode && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowTemplates(true)}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button size="sm" onClick={() => setShowAddWidget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" variant="outline" onClick={exportDashboard}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label htmlFor="import-file">
                <Button size="sm" variant="outline" as="span">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={importDashboard}
                  className="hidden"
                />
              </label>
              <Button size="sm" variant="outline" onClick={resetDashboard}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start with a Template or Build Your Own</h3>
            <p className="text-muted-foreground mb-4">Choose from pre-built templates or add widgets manually</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowTemplates(true)}>
                <Layers className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
              <Button variant="outline" onClick={() => setShowAddWidget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {widgets.map(widget => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  widget.category === 'comparison' ? 'col-span-full' : '',
                  widget.type === 'branch_performance' ? 'lg:col-span-2' : ''
                )}
              >
                {renderWidget(widget)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Dashboard Templates</DialogTitle>
            <DialogDescription>Choose a pre-built template to get started quickly</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DASHBOARD_TEMPLATES).map(([key, template]) => (
                <Card 
                  key={key} 
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    currentTemplate === key && "ring-2 ring-primary"
                  )}
                  onClick={() => loadTemplate(key)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          template.category === 'Leadership' && "bg-blue-100",
                          template.category === 'Operations' && "bg-green-100",
                          template.category === 'Risk & Compliance' && "bg-red-100",
                          template.category === 'Analytics' && "bg-purple-100",
                          template.category === 'Finance' && "bg-yellow-100",
                          template.category === 'Basic' && "bg-gray-100"
                        )}>
                          <template.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{template.category}</Badge>
                        </div>
                      </div>
                      {currentTemplate === key && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.widgets.slice(0, 5).map((widget, idx) => {
                        const widgetDef = WIDGET_CATALOG[widget.category]?.widgets[widget.type];
                        return widgetDef ? (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <widgetDef.icon className="h-3 w-3 mr-1" />
                            {widgetDef.name}
                          </Badge>
                        ) : null;
                      })}
                      {template.widgets.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.widgets.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>Choose a widget to add to your dashboard</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <Tabs defaultValue="kpis">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="kpis">Metrics</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="comparison">Compare</TabsTrigger>
                <TabsTrigger value="monitoring">Monitor</TabsTrigger>
              </TabsList>
              
              {Object.entries(WIDGET_CATALOG).map(([categoryKey, category]) => (
                <TabsContent key={categoryKey} value={categoryKey} className="grid grid-cols-2 gap-3">
                  {Object.entries(category.widgets).map(([widgetKey, widget]) => (
                    <Card
                      key={widgetKey}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addWidget(widgetKey, categoryKey)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <widget.icon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">{widget.name}</h4>
                            <p className="text-sm text-muted-foreground">{widget.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>Configure your dashboard preferences</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">Automatically refresh data</p>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            {autoRefresh && (
              <div className="space-y-2">
                <Label>Refresh Interval</Label>
                <Select
                  value={refreshInterval.toString()}
                  onValueChange={(value) => setRefreshInterval(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              saveDashboardConfiguration();
              setShowSettings(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Widget wrapper component
function WidgetWrapper({ widget, children, onRemove, onDuplicate, isEditMode }) {
  return (
    <Card className="h-full relative group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <widget.config.icon className="h-4 w-4" />
            {widget.config.title}
          </CardTitle>
          {isEditMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRemove} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}