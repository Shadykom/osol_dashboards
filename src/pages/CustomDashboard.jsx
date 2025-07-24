// src/pages/CustomDashboard.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
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
  Building2,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Unlock,
  Grid3X3,
  Palette,
  ArrowUpDown,
  Sparkles,
  ChevronRight
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase, TABLES } from '@/lib/supabase';
import { DashboardService } from '@/services/dashboardService';
import { CustomerService } from '@/services/customerService';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
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

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Widget catalog with categories
const WIDGET_CATALOG = {
  kpis: {
    category: 'Key Metrics',
    icon: TrendingUp,
    widgets: {
      customers_kpi: {
        name: 'Total Customers',
        icon: Users,
        description: 'Active customer count',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'total_customers'
      },
      accounts_kpi: {
        name: 'Total Accounts',
        icon: CreditCard,
        description: 'All account types',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'total_accounts'
      },
      revenue_kpi: {
        name: 'Monthly Revenue',
        icon: DollarSign,
        description: 'Current month revenue',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'monthly_revenue'
      },
      transactions_kpi: {
        name: 'Daily Transactions',
        icon: Activity,
        description: "Today's transaction count",
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'daily_transactions'
      },
      deposits_kpi: {
        name: 'Total Deposits',
        icon: PiggyBank,
        description: 'Customer deposits',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'total_deposits'
      },
      loans_kpi: {
        name: 'Loan Portfolio',
        icon: PiggyBank,
        description: 'Outstanding loans',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'total_loans'
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
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3,
        chartType: 'area'
      },
      customer_segments: {
        name: 'Customer Segments',
        icon: PieChart,
        description: 'Customer distribution',
        defaultSize: { w: 4, h: 4 },
        minW: 3,
        minH: 3,
        chartType: 'pie'
      },
      transaction_activity: {
        name: 'Transaction Activity',
        icon: Activity,
        description: 'Transaction by channel',
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3,
        chartType: 'bar'
      },
      loan_portfolio: {
        name: 'Loan Portfolio',
        icon: PiggyBank,
        description: 'Loan distribution',
        defaultSize: { w: 4, h: 4 },
        minW: 3,
        minH: 3,
        chartType: 'radial'
      },
      account_types: {
        name: 'Account Types',
        icon: CreditCard,
        description: 'Account distribution',
        defaultSize: { w: 4, h: 4 },
        minW: 3,
        minH: 3,
        chartType: 'pie'
      },
      branch_performance: {
        name: 'Branch Performance',
        icon: Building2,
        description: 'Performance by branch',
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3,
        chartType: 'bar'
      }
    }
  },
  comparisons: {
    category: 'Comparisons',
    icon: ArrowUpDown,
    widgets: {
      period_comparison: {
        name: 'Period Comparison',
        icon: Calendar,
        description: 'Compare time periods',
        defaultSize: { w: 12, h: 4 },
        minW: 8,
        minH: 3,
        comparisonType: 'month'
      },
      branch_comparison: {
        name: 'Branch Comparison',
        icon: Building2,
        description: 'Compare branches',
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3,
        comparisonType: 'branch'
      },
      product_comparison: {
        name: 'Product Comparison',
        icon: BarChart3,
        description: 'Compare products',
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3,
        comparisonType: 'product'
      }
    }
  },
  status: {
    category: 'Status & Alerts',
    icon: AlertCircle,
    widgets: {
      compliance_status: {
        name: 'Compliance Status',
        icon: Shield,
        description: 'Compliance scores',
        defaultSize: { w: 4, h: 3 },
        minW: 3,
        minH: 2
      },
      recent_transactions: {
        name: 'Recent Transactions',
        icon: Clock,
        description: 'Latest transactions',
        defaultSize: { w: 6, h: 4 },
        minW: 4,
        minH: 3
      },
      system_alerts: {
        name: 'System Alerts',
        icon: AlertCircle,
        description: 'Active alerts',
        defaultSize: { w: 4, h: 3 },
        minW: 3,
        minH: 2
      }
    }
  }
};

// Dashboard templates
const DASHBOARD_TEMPLATES = {
  executive: {
    name: 'Executive Overview',
    description: 'High-level KPIs and strategic metrics',
    icon: TrendingUp,
    layout: [
      { i: 'customers_kpi_1', x: 0, y: 0, w: 3, h: 2, static: false },
      { i: 'accounts_kpi_1', x: 3, y: 0, w: 3, h: 2, static: false },
      { i: 'revenue_kpi_1', x: 6, y: 0, w: 3, h: 2, static: false },
      { i: 'deposits_kpi_1', x: 9, y: 0, w: 3, h: 2, static: false },
      { i: 'revenue_trend_1', x: 0, y: 2, w: 6, h: 4, static: false },
      { i: 'customer_segments_1', x: 6, y: 2, w: 6, h: 4, static: false },
      { i: 'period_comparison_1', x: 0, y: 6, w: 12, h: 4, static: false }
    ],
    widgets: {
      'customers_kpi_1': { type: 'customers_kpi', category: 'kpis' },
      'accounts_kpi_1': { type: 'accounts_kpi', category: 'kpis' },
      'revenue_kpi_1': { type: 'revenue_kpi', category: 'kpis' },
      'deposits_kpi_1': { type: 'deposits_kpi', category: 'kpis' },
      'revenue_trend_1': { type: 'revenue_trend', category: 'charts' },
      'customer_segments_1': { type: 'customer_segments', category: 'charts' },
      'period_comparison_1': { type: 'period_comparison', category: 'comparisons' }
    }
  },
  operations: {
    name: 'Operations Dashboard',
    description: 'Real-time operational metrics',
    icon: Activity,
    layout: [
      { i: 'transactions_kpi_1', x: 0, y: 0, w: 3, h: 2, static: false },
      { i: 'accounts_kpi_1', x: 3, y: 0, w: 3, h: 2, static: false },
      { i: 'system_alerts_1', x: 6, y: 0, w: 6, h: 2, static: false },
      { i: 'transaction_activity_1', x: 0, y: 2, w: 6, h: 4, static: false },
      { i: 'recent_transactions_1', x: 6, y: 2, w: 6, h: 4, static: false },
      { i: 'branch_performance_1', x: 0, y: 6, w: 12, h: 4, static: false }
    ],
    widgets: {
      'transactions_kpi_1': { type: 'transactions_kpi', category: 'kpis' },
      'accounts_kpi_1': { type: 'accounts_kpi', category: 'kpis' },
      'system_alerts_1': { type: 'system_alerts', category: 'status' },
      'transaction_activity_1': { type: 'transaction_activity', category: 'charts' },
      'recent_transactions_1': { type: 'recent_transactions', category: 'status' },
      'branch_performance_1': { type: 'branch_performance', category: 'charts' }
    }
  }
};

// Color themes
const COLOR_THEMES = {
  default: {
    name: 'Default Gold',
    primary: '#E6B800',
    secondary: '#4A5568',
    accent: '#68D391'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA'
  },
  forest: {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    accent: '#34D399'
  },
  sunset: {
    name: 'Sunset Orange',
    primary: '#F97316',
    secondary: '#DC2626',
    accent: '#FB923C'
  }
};

export function CustomDashboard() {
  // Layout state
  const [layouts, setLayouts] = useState({});
  const [widgets, setWidgets] = useState(new Map());
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  
  // Data state
  const [widgetData, setWidgetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Settings state
  const [dashboardName, setDashboardName] = useState('My Custom Dashboard');
  const [colorTheme, setColorTheme] = useState('default');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [showGridLines, setShowGridLines] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  
  // Dialog states
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedWidgetConfig, setSelectedWidgetConfig] = useState(null);
  
  // Responsive breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Load saved layout on mount
  useEffect(() => {
    const saved = localStorage.getItem('customDashboardLayout');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setLayouts(config.layouts || {});
        setWidgets(new Map(config.widgets || []));
        setDashboardName(config.name || 'My Custom Dashboard');
        setColorTheme(config.theme || 'default');
        setAutoRefresh(config.autoRefresh ?? true);
        setRefreshInterval(config.refreshInterval || 30000);
      } catch (error) {
        console.error('Error loading saved layout:', error);
        loadTemplate(selectedTemplate);
      }
    } else {
      loadTemplate(selectedTemplate);
    }
  }, []);

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

      // Mock additional data
      const mockAlerts = [
        { id: 1, type: 'warning', message: 'High transaction volume detected', severity: 'medium', time: '5 min ago' },
        { id: 2, type: 'info', message: 'System maintenance scheduled', severity: 'low', time: '1 hour ago' },
        { id: 3, type: 'error', message: 'Failed transaction spike', severity: 'high', time: '2 hours ago' }
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

  // Real-time subscriptions
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

  // Load template
  const loadTemplate = useCallback((templateKey) => {
    const template = DASHBOARD_TEMPLATES[templateKey];
    if (!template) return;

    setLayouts({ lg: template.layout });
    setWidgets(new Map(Object.entries(template.widgets)));
    setSelectedTemplate(templateKey);
  }, []);

  // Add widget
  const addWidget = useCallback((widgetType, category) => {
    const widgetConfig = WIDGET_CATALOG[category].widgets[widgetType];
    if (!widgetConfig) return;

    const newWidgetId = `${widgetType}_${Date.now()}`;
    const maxY = layouts.lg ? Math.max(...layouts.lg.map(item => item.y + item.h), 0) : 0;
    
    const newLayout = {
      i: newWidgetId,
      x: 0,
      y: maxY,
      ...widgetConfig.defaultSize,
      minW: widgetConfig.minW,
      minH: widgetConfig.minH,
      static: false
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayout]
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.set(newWidgetId, { type: widgetType, category });
      return newMap;
    });

    setShowAddWidget(false);
    toast.success(`${widgetConfig.name} added to dashboard`);
  }, [layouts]);

  // Remove widget
  const removeWidget = useCallback((widgetId) => {
    setLayouts(prev => ({
      ...prev,
      lg: prev.lg.filter(item => item.i !== widgetId)
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });

    toast.success('Widget removed');
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
    setLayouts(allLayouts);
  }, []);

  // Save dashboard
  const saveDashboard = useCallback(() => {
    const config = {
      name: dashboardName,
      layouts,
      widgets: Array.from(widgets.entries()),
      theme: colorTheme,
      autoRefresh,
      refreshInterval,
      showGridLines,
      compactMode,
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem('customDashboardLayout', JSON.stringify(config));
    toast.success('Dashboard saved successfully');
  }, [dashboardName, layouts, widgets, colorTheme, autoRefresh, refreshInterval, showGridLines, compactMode]);

  // Export dashboard
  const exportDashboard = useCallback(() => {
    const config = {
      name: dashboardName,
      layouts,
      widgets: Array.from(widgets.entries()),
      theme: colorTheme,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${dashboardName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Dashboard exported');
  }, [dashboardName, layouts, widgets, colorTheme]);

  // Import dashboard
  const importDashboard = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setDashboardName(config.name || 'Imported Dashboard');
        setLayouts(config.layouts || {});
        setWidgets(new Map(config.widgets || []));
        setColorTheme(config.theme || 'default');
        toast.success('Dashboard imported successfully');
      } catch (error) {
        console.error('Error importing dashboard:', error);
        toast.error('Failed to import dashboard');
      }
    };
    reader.readAsText(file);
  }, []);

  // Render widget
  const renderWidget = useCallback((widgetId) => {
    const widget = widgets.get(widgetId);
    if (!widget) return null;

    const { type, category } = widget;
    const widgetConfig = WIDGET_CATALOG[category]?.widgets[type];
    if (!widgetConfig) return null;

    // Handle KPI widgets
    if (category === 'kpis') {
      const value = widgetData.kpis?.[widgetConfig.dataKey] || 0;
      let formattedValue = value.toLocaleString();
      let change = '+12.5%';
      let trend = 'up';

      switch (type) {
        case 'revenue_kpi':
          formattedValue = `SAR ${(value / 1000000).toFixed(1)}M`;
          break;
        case 'deposits_kpi':
        case 'loans_kpi':
          formattedValue = `SAR ${(value / 1000000000).toFixed(1)}B`;
          break;
      }

      return (
        <WidgetWrapper
          id={widgetId}
          title={widgetConfig.name}
          icon={widgetConfig.icon}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
        >
          <div className="p-6">
            <div className="text-2xl font-bold">{formattedValue}</div>
            <p className="text-sm text-muted-foreground">{widgetConfig.description}</p>
            <div className={`text-sm mt-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
              {change}
            </div>
          </div>
        </WidgetWrapper>
      );
    }

    // Handle chart widgets
    if (category === 'charts') {
      let chartData = [];
      
      switch (type) {
        case 'revenue_trend':
          chartData = widgetData.comparison?.trends || [];
          break;
        case 'customer_segments':
          chartData = widgetData.customerAnalytics?.by_segment || [];
          break;
        case 'transaction_activity':
          chartData = widgetData.transactionAnalytics?.by_channel || [];
          break;
        case 'branch_performance':
          chartData = widgetData.branchPerformance || [];
          break;
        case 'loan_portfolio':
          const loanData = widgetData.loanAnalytics;
          chartData = [
            { name: 'Disbursed', value: loanData?.disbursed_amount || 0 },
            { name: 'Outstanding', value: loanData?.outstanding_amount || 0 }
          ];
          break;
      }

      return (
        <WidgetWrapper
          id={widgetId}
          title={widgetConfig.name}
          icon={widgetConfig.icon}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
        >
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              {widgetConfig.chartType === 'pie' ? (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={type === 'customer_segments' ? 'count' : 'value'}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              ) : widgetConfig.chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
                  <Area type="monotone" dataKey="revenue" stroke="#E6B800" fill="#E6B800" fillOpacity={0.3} />
                </AreaChart>
              ) : widgetConfig.chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={type === 'branch_performance' ? 'branch' : 'channel'} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={type === 'branch_performance' ? 'efficiency' : 'count'} fill="#4A5568" />
                </BarChart>
              ) : widgetConfig.chartType === 'radial' ? (
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={chartData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
                </RadialBarChart>
              ) : null}
            </ResponsiveContainer>
          </div>
        </WidgetWrapper>
      );
    }

    // Handle comparison widgets
    if (category === 'comparisons') {
      return (
        <WidgetWrapper
          id={widgetId}
          title={widgetConfig.name}
          icon={widgetConfig.icon}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
          noPadding
        >
          <ComparisonWidget
            title=""
            data={{ monthlyComparison: widgetData.comparison }}
            comparisonType={widgetConfig.comparisonType}
          />
        </WidgetWrapper>
      );
    }

    // Handle status widgets
    if (category === 'status') {
      if (type === 'compliance_status') {
        const scores = [
          { name: 'Overall', score: widgetData.complianceData?.overallScore || 0 },
          { name: 'AML/CFT', score: widgetData.complianceData?.amlScore || 0 },
          { name: 'KYC', score: widgetData.complianceData?.kycScore || 0 },
          { name: 'Regulatory', score: widgetData.complianceData?.regulatoryScore || 0 }
        ];

        return (
          <WidgetWrapper
            id={widgetId}
            title={widgetConfig.name}
            icon={widgetConfig.icon}
            onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
            onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
          >
            <div className="p-6 space-y-3">
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
          </WidgetWrapper>
        );
      }

      if (type === 'recent_transactions') {
        return (
          <WidgetWrapper
            id={widgetId}
            title={widgetConfig.name}
            icon={widgetConfig.icon}
            onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
            onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
          >
            <div className="p-6 space-y-3">
              {(widgetData.recentTransactions || []).slice(0, 5).map((transaction, index) => (
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
          </WidgetWrapper>
        );
      }

      if (type === 'system_alerts') {
        return (
          <WidgetWrapper
            id={widgetId}
            title={widgetConfig.name}
            icon={widgetConfig.icon}
            onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
            onConfigure={isEditMode ? () => setSelectedWidgetConfig({ id: widgetId, ...widget }) : undefined}
          >
            <div className="p-6 space-y-3">
              {(widgetData.alerts || []).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {alert.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WidgetWrapper>
        );
      }
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Unknown widget type: {type}</p>
        </CardContent>
      </Card>
    );
  }, [widgets, widgetData, isEditMode, removeWidget]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const theme = COLOR_THEMES[colorTheme];

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
            <Badge variant="outline" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Custom
            </Badge>
          </h1>
          <p className="text-muted-foreground">Drag and drop widgets to customize your dashboard</p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={exportDashboard}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={saveDashboard}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dashboard Controls</CardTitle>
              <CardDescription>Customize your dashboard layout and settings</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-mode"
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
                <Label htmlFor="edit-mode" className="flex items-center gap-2 cursor-pointer">
                  {isEditMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isEditMode ? 'Edit Mode' : 'View Mode'}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="cursor-pointer">
                  Auto Refresh
                </Label>
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
            </div>
          </div>
        </CardHeader>
        
        {isEditMode && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddWidget(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTemplates(true)}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Load Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTemplate(selectedTemplate)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Layout
              </Button>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={importDashboard}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => e.currentTarget.previousSibling.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dashboard Grid */}
      <div
        className={cn(
          "min-h-[600px] rounded-lg",
          isEditMode && "ring-2 ring-primary/50 p-4",
          showGridLines && isEditMode && "dashboard-grid"
        )}
        style={{
          '--theme-primary': theme.primary,
          '--theme-secondary': theme.secondary,
          '--theme-accent': theme.accent,
        }}
      >
        {widgets.size === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding widgets to your dashboard
              </p>
              {isEditMode && (
                <Button onClick={() => setShowAddWidget(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Widget
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={compactMode ? 50 : 60}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            onLayoutChange={handleLayoutChange}
            margin={compactMode ? [12, 12] : [16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            preventCollision={false}
            compactType="vertical"
          >
            {Array.from(widgets.keys()).map((widgetId) => (
              <div key={widgetId} className="dashboard-widget">
                {renderWidget(widgetId)}
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Widget to Dashboard</DialogTitle>
            <DialogDescription>
              Choose from our widget catalog to enhance your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="kpis" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(WIDGET_CATALOG).map(([key, category]) => (
                <TabsTrigger key={key} value={key}>
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(WIDGET_CATALOG).map(([categoryKey, category]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(category.widgets).map(([widgetKey, widget]) => (
                    <Card
                      key={widgetKey}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addWidget(widgetKey, categoryKey)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <widget.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{widget.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {widget.description}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-2">
                              {widget.defaultSize.w}x{widget.defaultSize.h}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Dashboard Template</DialogTitle>
            <DialogDescription>
              Start with a pre-configured template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            {Object.entries(DASHBOARD_TEMPLATES).map(([key, template]) => (
              <Card
                key={key}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedTemplate === key && "ring-2 ring-primary"
                )}
                onClick={() => {
                  loadTemplate(key);
                  setShowTemplates(false);
                  toast.success(`Loaded ${template.name} template`);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <template.icon className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    {selectedTemplate === key && <Badge>Active</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Configure your dashboard appearance and behavior
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Dashboard Name */}
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
              />
            </div>

            {/* Color Theme */}
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <Card
                    key={key}
                    className={cn(
                      "cursor-pointer transition-all",
                      colorTheme === key && "ring-2 ring-primary"
                    )}
                    onClick={() => setColorTheme(key)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span className="text-sm font-medium">{theme.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Display Settings</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="grid-lines">Show Grid Lines</Label>
                  <p className="text-sm text-muted-foreground">
                    Display grid lines in edit mode
                  </p>
                </div>
                <Switch
                  id="grid-lines"
                  checked={showGridLines}
                  onCheckedChange={setShowGridLines}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing between widgets
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              saveDashboard();
              setShowSettings(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Tips */}
      {isEditMode && (
        <Card className="border-muted bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Dashboard Customization Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Drag widgets to rearrange and resize by dragging corners</span>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Use templates as a starting point then customize</span>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Save your layout to preserve your customizations</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        .dashboard-grid {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .dashboard-widget {
          transition: all 0.3s ease;
        }
        
        .dashboard-widget:hover {
          z-index: 10;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item.resizing {
          z-index: 1;
          will-change: width, height;
        }
        
        .react-grid-item.dragging {
          transition: none;
          z-index: 3;
          will-change: transform;
        }
        
        .react-grid-item.dropping {
          visibility: hidden;
        }
        
        .react-grid-placeholder {
          background: hsl(var(--primary) / 0.2);
          opacity: 0.5;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.5rem;
          border: 2px dashed hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}

// Widget wrapper component
function WidgetWrapper({ id, title, icon: Icon, children, onRemove, onConfigure, noPadding }) {
  return (
    <Card className="h-full relative group overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          {(onRemove || onConfigure) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onConfigure && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onConfigure}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("h-[calc(100%-4rem)]", noPadding && "p-0")}>
        {children}
      </CardContent>
    </Card>
  );
}