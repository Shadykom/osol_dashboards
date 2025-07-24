import { useState, useCallback, useMemo, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Settings, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Grid3X3,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  GitBranch,
  ArrowUpDown,
  Download,
  Upload,
  Palette,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import { KPIWidget } from '@/components/widgets/KPIWidget';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { cn } from '@/lib/utils';

// Services
import { DashboardService } from '@/services/dashboardService';
import { CustomerService } from '@/services/customerService';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Enhanced widget types with categories
const WIDGET_CATALOG = {
  // KPI Widgets
  kpis: {
    category: 'Key Metrics',
    icon: TrendingUp,
    widgets: {
      customers_kpi: {
        name: 'Total Customers',
        icon: Users,
        description: 'Active customer count',
        defaultSize: { w: 3, h: 3 },
        dataKey: 'total_customers'
      },
      accounts_kpi: {
        name: 'Total Accounts',
        icon: CreditCard,
        description: 'All account types',
        defaultSize: { w: 3, h: 3 },
        dataKey: 'total_accounts'
      },
      revenue_kpi: {
        name: 'Monthly Revenue',
        icon: DollarSign,
        description: 'Current month revenue',
        defaultSize: { w: 3, h: 3 },
        dataKey: 'monthly_revenue'
      },
      transactions_kpi: {
        name: 'Daily Transactions',
        icon: Activity,
        description: 'Today\'s transaction count',
        defaultSize: { w: 3, h: 3 },
        dataKey: 'daily_transactions'
      }
    }
  },
  
  // Chart Widgets
  charts: {
    category: 'Analytics',
    icon: BarChart3,
    widgets: {
      transaction_trend: {
        name: 'Transaction Trend',
        icon: TrendingUp,
        description: 'Daily transaction volume',
        defaultSize: { w: 6, h: 5 },
        chartType: 'line'
      },
      revenue_growth: {
        name: 'Revenue Growth',
        icon: DollarSign,
        description: 'Monthly revenue trend',
        defaultSize: { w: 6, h: 5 },
        chartType: 'area'
      },
      customer_segments: {
        name: 'Customer Segments',
        icon: PieChart,
        description: 'Customer distribution',
        defaultSize: { w: 4, h: 5 },
        chartType: 'pie'
      },
      channel_distribution: {
        name: 'Channel Usage',
        icon: GitBranch,
        description: 'Transaction channels',
        defaultSize: { w: 4, h: 5 },
        chartType: 'bar'
      }
    }
  },
  
  // Comparison Widgets
  comparisons: {
    category: 'Comparisons',
    icon: ArrowUpDown,
    widgets: {
      month_comparison: {
        name: 'Month-to-Month',
        icon: Calendar,
        description: 'Compare monthly metrics',
        defaultSize: { w: 6, h: 5 },
        comparisonType: 'month'
      },
      branch_comparison: {
        name: 'Branch Performance',
        icon: GitBranch,
        description: 'Compare branch metrics',
        defaultSize: { w: 6, h: 5 },
        comparisonType: 'branch'
      },
      yoy_comparison: {
        name: 'Year-over-Year',
        icon: Calendar,
        description: 'Yearly comparison',
        defaultSize: { w: 6, h: 5 },
        comparisonType: 'year'
      }
    }
  }
};

// Predefined dashboard templates
const DASHBOARD_TEMPLATES = {
  executive: {
    name: 'Executive Overview',
    description: 'High-level KPIs and strategic metrics',
    icon: TrendingUp,
    layout: [
      { i: 'customers_kpi_1', x: 0, y: 0, w: 3, h: 3, widget: 'customers_kpi' },
      { i: 'accounts_kpi_1', x: 3, y: 0, w: 3, h: 3, widget: 'accounts_kpi' },
      { i: 'revenue_kpi_1', x: 6, y: 0, w: 3, h: 3, widget: 'revenue_kpi' },
      { i: 'transactions_kpi_1', x: 9, y: 0, w: 3, h: 3, widget: 'transactions_kpi' },
      { i: 'revenue_growth_1', x: 0, y: 3, w: 6, h: 5, widget: 'revenue_growth' },
      { i: 'customer_segments_1', x: 6, y: 3, w: 4, h: 5, widget: 'customer_segments' },
      { i: 'month_comparison_1', x: 0, y: 8, w: 6, h: 5, widget: 'month_comparison' }
    ]
  },
  operations: {
    name: 'Operations Monitor',
    description: 'Real-time operational metrics',
    icon: Activity,
    layout: [
      { i: 'transactions_kpi_1', x: 0, y: 0, w: 3, h: 3, widget: 'transactions_kpi' },
      { i: 'transaction_trend_1', x: 3, y: 0, w: 6, h: 5, widget: 'transaction_trend' },
      { i: 'channel_distribution_1', x: 9, y: 0, w: 3, h: 5, widget: 'channel_distribution' },
      { i: 'branch_comparison_1', x: 0, y: 5, w: 12, h: 5, widget: 'branch_comparison' }
    ]
  },
  analytics: {
    name: 'Analytics Deep Dive',
    description: 'Comprehensive analytics and comparisons',
    icon: BarChart3,
    layout: [
      { i: 'month_comparison_1', x: 0, y: 0, w: 6, h: 5, widget: 'month_comparison' },
      { i: 'yoy_comparison_1', x: 6, y: 0, w: 6, h: 5, widget: 'yoy_comparison' },
      { i: 'customer_segments_1', x: 0, y: 5, w: 4, h: 5, widget: 'customer_segments' },
      { i: 'channel_distribution_1', x: 4, y: 5, w: 4, h: 5, widget: 'channel_distribution' },
      { i: 'branch_comparison_1', x: 8, y: 5, w: 4, h: 5, widget: 'branch_comparison' }
    ]
  }
};

// Color themes
const COLOR_THEMES = {
  default: {
    name: 'Default',
    primary: '#E6B800',
    secondary: '#4A5568',
    accent: '#68D391',
    background: 'bg-white dark:bg-gray-900'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: 'bg-blue-50 dark:bg-blue-950'
  },
  forest: {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    accent: '#34D399',
    background: 'bg-green-50 dark:bg-green-950'
  },
  sunset: {
    name: 'Sunset Orange',
    primary: '#F97316',
    secondary: '#DC2626',
    accent: '#FB923C',
    background: 'bg-orange-50 dark:bg-orange-950'
  }
};

export function EnhancedCustomDashboard() {
  // State management
  const [layouts, setLayouts] = useState({});
  const [widgets, setWidgets] = useState(new Map());
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  const [dashboardName, setDashboardName] = useState('My Custom Dashboard');
  const [colorTheme, setColorTheme] = useState('default');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [showGridLines, setShowGridLines] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Dialog states
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedWidgetForConfig, setSelectedWidgetForConfig] = useState(null);

  // Breakpoints for responsive design
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Initialize dashboard with template
  useEffect(() => {
    loadDashboardTemplate(selectedTemplate);
    loadDashboardData();
  }, [selectedTemplate]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Load dashboard data from services
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all dashboard data
      const [kpis, transactions, customers, loans] = await Promise.all([
        DashboardService.getExecutiveKPIs(),
        DashboardService.getTransactionAnalytics(),
        CustomerService.getCustomerAnalytics(),
        DashboardService.getLoanAnalytics()
      ]);

      setDashboardData({
        kpis: kpis.data || {},
        transactions: transactions.data || {},
        customers: customers.data || {},
        loans: loans.data || {},
        lastUpdated: new Date()
      });

      toast({
        title: "Dashboard Updated",
        description: "All widgets have been refreshed with latest data",
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load some dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load dashboard template
  const loadDashboardTemplate = useCallback((templateKey) => {
    const template = DASHBOARD_TEMPLATES[templateKey];
    if (!template) return;

    const layoutMap = {};
    const widgetMap = new Map();

    template.layout.forEach(item => {
      layoutMap[item.i] = { ...item };
      delete layoutMap[item.i].widget;
      widgetMap.set(item.i, { type: item.widget, config: {} });
    });

    setLayouts({ lg: Object.values(layoutMap) });
    setWidgets(widgetMap);
  }, []);

  // Add widget
  const addWidget = useCallback((widgetType, category) => {
    const widgetConfig = WIDGET_CATALOG[category].widgets[widgetType];
    if (!widgetConfig) return;

    const newWidgetId = `${widgetType}_${Date.now()}`;
    const newLayout = {
      i: newWidgetId,
      x: 0,
      y: 0,
      ...widgetConfig.defaultSize
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayout]
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.set(newWidgetId, { 
        type: widgetType, 
        category,
        config: {
          refreshRate: 30000,
          showTrend: true,
          animate: true
        }
      });
      return newMap;
    });

    setShowAddWidget(false);
    toast({
      title: "Widget Added",
      description: `${widgetConfig.name} has been added to your dashboard`,
    });
  }, []);

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

    toast({
      title: "Widget Removed",
      description: "Widget has been removed from your dashboard",
    });
  }, []);

  // Configure widget
  const configureWidget = useCallback((widgetId, newConfig) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(widgetId);
      if (widget) {
        newMap.set(widgetId, {
          ...widget,
          config: { ...widget.config, ...newConfig }
        });
      }
      return newMap;
    });
  }, []);

  // Save dashboard
  const saveDashboard = useCallback(() => {
    const dashboardConfig = {
      name: dashboardName,
      template: selectedTemplate,
      layouts,
      widgets: Array.from(widgets.entries()).map(([id, widget]) => ({
        id,
        ...widget
      })),
      theme: colorTheme,
      settings: {
        autoRefresh,
        refreshInterval,
        showGridLines,
        compactMode
      },
      lastModified: new Date().toISOString()
    };

    localStorage.setItem('osol_custom_dashboard', JSON.stringify(dashboardConfig));
    setLastSaved(new Date());
    
    toast({
      title: "Dashboard Saved",
      description: "Your dashboard configuration has been saved successfully",
    });
  }, [dashboardName, selectedTemplate, layouts, widgets, colorTheme, autoRefresh, refreshInterval, showGridLines, compactMode]);

  // Load saved dashboard
  const loadSavedDashboard = useCallback(() => {
    const saved = localStorage.getItem('osol_custom_dashboard');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setDashboardName(config.name);
        setLayouts(config.layouts);
        
        const widgetMap = new Map();
        config.widgets.forEach(widget => {
          widgetMap.set(widget.id, {
            type: widget.type,
            category: widget.category,
            config: widget.config
          });
        });
        setWidgets(widgetMap);
        
        setColorTheme(config.theme || 'default');
        setAutoRefresh(config.settings?.autoRefresh || false);
        setRefreshInterval(config.settings?.refreshInterval || 30000);
        setShowGridLines(config.settings?.showGridLines ?? true);
        setCompactMode(config.settings?.compactMode || false);
        
        toast({
          title: "Dashboard Loaded",
          description: "Your saved dashboard has been restored",
        });
      } catch (error) {
        console.error('Error loading saved dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load saved dashboard",
          variant: "destructive"
        });
      }
    }
  }, []);

  // Export dashboard configuration
  const exportDashboard = useCallback(() => {
    const config = {
      name: dashboardName,
      layouts,
      widgets: Array.from(widgets.entries()),
      theme: colorTheme,
      settings: {
        autoRefresh,
        refreshInterval,
        showGridLines,
        compactMode
      },
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

    toast({
      title: "Dashboard Exported",
      description: "Dashboard configuration has been downloaded",
    });
  }, [dashboardName, layouts, widgets, colorTheme, autoRefresh, refreshInterval, showGridLines, compactMode]);

  // Render widget based on type
  const renderWidget = useCallback((widgetId) => {
    const widget = widgets.get(widgetId);
    if (!widget) return null;

    const { type, category, config } = widget;
    const widgetCatalog = WIDGET_CATALOG[category]?.widgets[type];

    // KPI Widgets
    if (category === 'kpis') {
      const value = dashboardData.kpis?.[widgetCatalog.dataKey] || 0;
      const formattedValue = widgetCatalog.dataKey === 'monthly_revenue' ? 
        `SAR ${(value / 1000000).toFixed(1)}M` : value.toLocaleString();

      return (
        <KPIWidget
          id={widgetId}
          title={widgetCatalog.name}
          value={formattedValue}
          change="+12.5%"
          trend="up"
          description={widgetCatalog.description}
          icon={widgetCatalog.icon}
          isLoading={isLoading}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => {
            setSelectedWidgetForConfig({ id: widgetId, ...widget });
            setShowSettings(true);
          } : undefined}
        />
      );
    }

    // Chart Widgets
    if (category === 'charts') {
      let chartData = [];
      
      if (type === 'transaction_trend') {
        // Mock data for now - replace with real data
        chartData = [
          { date: '2025-01-20', value: 1200 },
          { date: '2025-01-21', value: 1350 },
          { date: '2025-01-22', value: 1100 },
          { date: '2025-01-23', value: 1450 },
          { date: '2025-01-24', value: 1600 }
        ];
      } else if (type === 'customer_segments' && dashboardData.customers?.by_segment) {
        chartData = dashboardData.customers.by_segment.map(segment => ({
          name: segment.segment,
          value: segment.count
        }));
      } else if (type === 'channel_distribution' && dashboardData.transactions?.by_channel) {
        chartData = dashboardData.transactions.by_channel.map(channel => ({
          name: channel.channel,
          value: channel.count
        }));
      }

      return (
        <ChartWidget
          id={widgetId}
          title={widgetCatalog.name}
          description={widgetCatalog.description}
          data={chartData}
          chartType={widgetCatalog.chartType}
          xAxisKey={type === 'transaction_trend' ? 'date' : 'name'}
          yAxisKey="value"
          isLoading={isLoading}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => {
            setSelectedWidgetForConfig({ id: widgetId, ...widget });
            setShowSettings(true);
          } : undefined}
        />
      );
    }

    // Comparison Widgets
    if (category === 'comparisons') {
      return (
        <ComparisonWidget
          id={widgetId}
          title={widgetCatalog.name}
          description={widgetCatalog.description}
          comparisonType={widgetCatalog.comparisonType}
          data={dashboardData}
          isLoading={isLoading}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => {
            setSelectedWidgetForConfig({ id: widgetId, ...widget });
            setShowSettings(true);
          } : undefined}
        />
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Unknown widget type: {type}</p>
        </CardContent>
      </Card>
    );
  }, [widgets, dashboardData, isLoading, isEditMode, removeWidget]);

  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
  }, []);

  const theme = COLOR_THEMES[colorTheme];

  return (
    <div className={cn("min-h-screen p-6", theme.background)}>
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {dashboardName}
              <Badge variant="outline" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Custom
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Drag, drop, and configure widgets to create your perfect dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <Badge variant="outline" className="text-xs">
                Saved {lastSaved.toLocaleTimeString()}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportDashboard}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button
              size="sm"
              onClick={saveDashboard}
            >
              <Save className="w-4 h-4 mr-2" />
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
                <CardDescription>
                  Customize your dashboard layout and appearance
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                  />
                  <Label htmlFor="edit-mode" className="flex items-center gap-2 cursor-pointer">
                    {isEditMode ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        Edit Mode
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        View Mode
                      </>
                    )}
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
                </div>
              </div>
            </div>
          </CardHeader>
          
          {isEditMode && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Widget to Dashboard</DialogTitle>
                      <DialogDescription>
                        Choose from our widget catalog to enhance your dashboard
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="kpis" className="mt-4">
                      <TabsList className="grid w-full grid-cols-3">
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
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      "bg-primary/10 text-primary"
                                    )}>
                                      <widget.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{widget.name}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {widget.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {widget.defaultSize.w}x{widget.defaultSize.h}
                                        </Badge>
                                      </div>
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

                <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Load Template
                    </Button>
                  </DialogTrigger>
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
                            setSelectedTemplate(key);
                            setShowTemplateSelector(false);
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
                              {selectedTemplate === key && (
                                <Badge>Active</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    loadDashboardTemplate(selectedTemplate);
                    toast({
                      title: "Layout Reset",
                      description: "Dashboard has been reset to template defaults",
                    });
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Layout
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSavedDashboard}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Load Saved
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Dashboard Grid */}
        <div
          className={cn(
            "relative rounded-lg transition-all",
            isEditMode && "ring-2 ring-primary/50 ring-offset-2",
            showGridLines && isEditMode && "dashboard-grid",
            compactMode && "compact-dashboard"
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
              transformScale={1}
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

              {/* Auto Refresh Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh-toggle">Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update dashboard data
                    </p>
                  </div>
                  <Switch
                    id="auto-refresh-toggle"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                
                {autoRefresh && (
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval">Refresh Interval</Label>
                    <Select
                      value={refreshInterval.toString()}
                      onValueChange={(value) => setRefreshInterval(parseInt(value))}
                    >
                      <SelectTrigger id="refresh-interval">
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

        {/* Help Section */}
        {isEditMode && (
          <Card className="border-muted bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pro Tips for Dashboard Customization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Drag widgets to rearrange them and resize by dragging corners</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Use templates as a starting point then customize to your needs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Enable auto-refresh to keep your data always up-to-date</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
        
        .compact-dashboard .dashboard-widget {
          transform: scale(0.95);
        }
        
        :root {
          --theme-primary: #E6B800;
          --theme-secondary: #4A5568;
          --theme-accent: #68D391;
        }
      `}</style>
    </div>
  );
}