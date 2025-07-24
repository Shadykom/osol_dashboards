// Enhanced CustomDashboard.jsx with DashboardSharing integration and Widget Configuration
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Save, RefreshCw, Settings, Plus, X, GripVertical,
  Maximize2, Minimize2, Eye, EyeOff, TrendingUp, Users, DollarSign,
  CreditCard, PiggyBank, Activity, BarChart3, PieChart, LineChart,
  Calendar, Clock, AlertCircle, CheckCircle, Shield, Building2,
  Download, Upload, RotateCcw, Lock, Unlock, Grid3X3, Palette,
  ArrowUpDown, Sparkles, ChevronRight, Share2, Filter, Columns,
  Type, Move, Trash2, Copy, Database, SlidersHorizontal, Target,
  Layers, ChevronLeft, Info, FileText, Code, Image, Zap, MoreVertical
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  RadialBar,
  ComposedChart,
  ScatterChart,
  Scatter,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap
} from 'recharts';

// Import the DashboardSharing component
// Note: In real implementation, import from actual file
// import { DashboardSharing } from '@/components/dashboard/DashboardSharing';

// Mock DashboardSharing for this example
const DashboardSharing = ({ dashboard, isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share Dashboard</DialogTitle>
      </DialogHeader>
      <p>DashboardSharing component implementation here</p>
    </DialogContent>
  </Dialog>
);

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Enhanced widget catalog with more options
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
        dataKey: 'total_customers',
        configurable: {
          dataSource: true,
          format: true,
          comparison: true,
          threshold: true,
          sparkline: true
        }
      },
      accounts_kpi: {
        name: 'Total Accounts',
        icon: CreditCard,
        description: 'All account types',
        defaultSize: { w: 3, h: 2 },
        minW: 2,
        minH: 2,
        dataKey: 'total_accounts',
        configurable: {
          dataSource: true,
          format: true,
          comparison: true,
          threshold: true,
          sparkline: true
        }
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
        chartType: 'area',
        configurable: {
          chartType: true,
          dataSource: true,
          timeRange: true,
          aggregation: true,
          filters: true,
          axes: true,
          colors: true,
          legend: true
        }
      },
      customer_segments: {
        name: 'Customer Segments',
        icon: PieChart,
        description: 'Customer distribution',
        defaultSize: { w: 4, h: 4 },
        minW: 3,
        minH: 3,
        chartType: 'pie',
        configurable: {
          chartType: true,
          dataSource: true,
          filters: true,
          colors: true,
          labels: true,
          animation: true
        }
      }
    }
  }
};

// Chart type options
const CHART_TYPES = {
  line: { name: 'Line Chart', icon: LineChart, component: RechartsLineChart },
  area: { name: 'Area Chart', icon: AreaChart, component: AreaChart },
  bar: { name: 'Bar Chart', icon: BarChart3, component: BarChart },
  pie: { name: 'Pie Chart', icon: PieChart, component: RechartsPieChart },
  scatter: { name: 'Scatter Plot', icon: Activity, component: ScatterChart },
  radar: { name: 'Radar Chart', icon: Activity, component: RadarChart },
  radial: { name: 'Radial Bar', icon: PieChart, component: RadialBarChart }
};

// Data aggregation options
const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' }
];

// Time range options
const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

export function CustomDashboard() {
  // Layout state
  const [layouts, setLayouts] = useState({});
  const [widgets, setWidgets] = useState(new Map());
  const [widgetConfigs, setWidgetConfigs] = useState(new Map());
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
  const [showSharing, setShowSharing] = useState(false);
  const [selectedWidgetConfig, setSelectedWidgetConfig] = useState(null);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  
  // Widget configuration dialog state
  const [configFormData, setConfigFormData] = useState({
    title: '',
    chartType: 'area',
    dataSource: 'default',
    timeRange: 'last30days',
    aggregation: 'sum',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    animationEnabled: true,
    colorScheme: 'default',
    filters: {},
    customQuery: '',
    refreshRate: 'inherit',
    thresholds: [],
    sparklineEnabled: false,
    comparisonEnabled: false,
    comparisonType: 'previous_period'
  });

  // Mock data for the example
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setWidgetData({
        kpis: {
          total_customers: 12847,
          total_accounts: 18293,
          monthly_revenue: 4250000,
          daily_transactions: 3294,
          total_deposits: 850000000,
          total_loans: 320000000
        },
        comparison: {
          trends: [
            { month: 'Jan', revenue: 3200000 },
            { month: 'Feb', revenue: 3500000 },
            { month: 'Mar', revenue: 3800000 },
            { month: 'Apr', revenue: 4250000 }
          ]
        },
        customerAnalytics: {
          by_segment: [
            { segment: 'Premium', count: 2500 },
            { segment: 'Standard', count: 8000 },
            { segment: 'Basic', count: 2347 }
          ]
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  // Open widget configuration
  const openWidgetConfig = useCallback((widgetId) => {
    const widget = widgets.get(widgetId);
    if (!widget) return;

    const existingConfig = widgetConfigs.get(widgetId) || {};
    const widgetDef = WIDGET_CATALOG[widget.category]?.widgets[widget.type];
    
    setSelectedWidgetConfig({ id: widgetId, ...widget, definition: widgetDef });
    setConfigFormData({
      title: existingConfig.title || widgetDef?.name || '',
      chartType: existingConfig.chartType || widgetDef?.chartType || 'area',
      dataSource: existingConfig.dataSource || 'default',
      timeRange: existingConfig.timeRange || 'last30days',
      aggregation: existingConfig.aggregation || 'sum',
      showLegend: existingConfig.showLegend ?? true,
      showGrid: existingConfig.showGrid ?? true,
      showTooltip: existingConfig.showTooltip ?? true,
      animationEnabled: existingConfig.animationEnabled ?? true,
      colorScheme: existingConfig.colorScheme || 'default',
      filters: existingConfig.filters || {},
      customQuery: existingConfig.customQuery || '',
      refreshRate: existingConfig.refreshRate || 'inherit',
      thresholds: existingConfig.thresholds || [],
      sparklineEnabled: existingConfig.sparklineEnabled || false,
      comparisonEnabled: existingConfig.comparisonEnabled || false,
      comparisonType: existingConfig.comparisonType || 'previous_period'
    });
    setShowWidgetConfig(true);
  }, [widgets, widgetConfigs]);

  // Save widget configuration
  const saveWidgetConfig = useCallback(() => {
    if (!selectedWidgetConfig) return;

    setWidgetConfigs(prev => {
      const newMap = new Map(prev);
      newMap.set(selectedWidgetConfig.id, { ...configFormData });
      return newMap;
    });

    toast.success('Widget configuration saved');
    setShowWidgetConfig(false);
    setSelectedWidgetConfig(null);
  }, [selectedWidgetConfig, configFormData]);

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

    setWidgetConfigs(prev => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });

    toast.success('Widget removed');
  }, []);

  // Duplicate widget
  const duplicateWidget = useCallback((widgetId) => {
    const widget = widgets.get(widgetId);
    const config = widgetConfigs.get(widgetId);
    if (!widget) return;

    const widgetDef = WIDGET_CATALOG[widget.category]?.widgets[widget.type];
    const newWidgetId = `${widget.type}_${Date.now()}`;
    const originalLayout = layouts.lg?.find(item => item.i === widgetId);
    
    const newLayout = {
      i: newWidgetId,
      x: (originalLayout?.x || 0) + 1,
      y: originalLayout?.y || 0,
      w: originalLayout?.w || widgetDef?.defaultSize.w || 4,
      h: originalLayout?.h || widgetDef?.defaultSize.h || 3,
      minW: widgetDef?.minW || 2,
      minH: widgetDef?.minH || 2,
      static: false
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayout]
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.set(newWidgetId, { ...widget });
      return newMap;
    });

    if (config) {
      setWidgetConfigs(prev => {
        const newMap = new Map(prev);
        newMap.set(newWidgetId, { ...config });
        return newMap;
      });
    }

    toast.success('Widget duplicated');
  }, [widgets, widgetConfigs, layouts]);

  // Render enhanced widget
  const renderWidget = useCallback((widgetId) => {
    const widget = widgets.get(widgetId);
    const config = widgetConfigs.get(widgetId) || {};
    if (!widget) return null;

    const { type, category } = widget;
    const widgetDef = WIDGET_CATALOG[category]?.widgets[type];
    if (!widgetDef) return null;

    const title = config.title || widgetDef.name;

    // Handle KPI widgets with enhancements
    if (category === 'kpis') {
      const value = widgetData.kpis?.[widgetDef.dataKey] || 0;
      let formattedValue = value.toLocaleString();
      let change = '+12.5%';
      let trend = 'up';

      // Apply custom formatting
      if (config.format === 'currency') {
        formattedValue = `SAR ${(value / 1000000).toFixed(1)}M`;
      }

      const sparklineData = [
        { value: value * 0.8 },
        { value: value * 0.85 },
        { value: value * 0.9 },
        { value: value * 0.95 },
        { value: value }
      ];

      return (
        <WidgetWrapper
          id={widgetId}
          title={title}
          icon={widgetDef.icon}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => openWidgetConfig(widgetId) : undefined}
          onDuplicate={isEditMode ? () => duplicateWidget(widgetId) : undefined}
          actions={isEditMode ? ['configure', 'duplicate', 'remove'] : []}
        >
          <div className="p-6">
            <div className="text-2xl font-bold">{formattedValue}</div>
            <p className="text-sm text-muted-foreground">{widgetDef.description}</p>
            
            {config.comparisonEnabled && (
              <div className={`text-sm mt-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? <TrendingUp className="inline h-3 w-3" /> : <TrendingUp className="inline h-3 w-3 rotate-180" />}
                {change} vs {config.comparisonType.replace('_', ' ')}
              </div>
            )}
            
            {config.sparklineEnabled && (
              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="value" stroke="#E6B800" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </WidgetWrapper>
      );
    }

    // Handle chart widgets with custom configurations
    if (category === 'charts') {
      let chartData = [];
      
      switch (type) {
        case 'revenue_trend':
          chartData = widgetData.comparison?.trends || [];
          break;
        case 'customer_segments':
          chartData = widgetData.customerAnalytics?.by_segment || [];
          break;
      }

      const ChartComponent = CHART_TYPES[config.chartType || widgetDef.chartType]?.component || AreaChart;

      return (
        <WidgetWrapper
          id={widgetId}
          title={title}
          icon={widgetDef.icon}
          onRemove={isEditMode ? () => removeWidget(widgetId) : undefined}
          onConfigure={isEditMode ? () => openWidgetConfig(widgetId) : undefined}
          onDuplicate={isEditMode ? () => duplicateWidget(widgetId) : undefined}
          actions={isEditMode ? ['configure', 'duplicate', 'remove'] : []}
        >
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              {config.chartType === 'pie' || widgetDef.chartType === 'pie' ? (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={config.showLabels !== false ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={type === 'customer_segments' ? 'count' : 'value'}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  {config.showTooltip && <Tooltip />}
                  {config.showLegend && <Legend />}
                </RechartsPieChart>
              ) : (
                <ChartComponent data={chartData}>
                  {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis dataKey={type === 'revenue_trend' ? 'month' : 'name'} />
                  <YAxis />
                  {config.showTooltip && <Tooltip />}
                  {config.showLegend && <Legend />}
                  {config.chartType === 'area' && (
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#E6B800" 
                      fill="#E6B800" 
                      fillOpacity={0.3}
                      animationDuration={config.animationEnabled ? 1000 : 0}
                    />
                  )}
                  {config.chartType === 'line' && (
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#E6B800"
                      animationDuration={config.animationEnabled ? 1000 : 0}
                    />
                  )}
                  {config.chartType === 'bar' && (
                    <Bar 
                      dataKey="revenue" 
                      fill="#4A5568"
                      animationDuration={config.animationEnabled ? 1000 : 0}
                    />
                  )}
                </ChartComponent>
              )}
            </ResponsiveContainer>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Unknown widget type: {type}</p>
        </CardContent>
      </Card>
    );
  }, [widgets, widgetConfigs, widgetData, isEditMode, removeWidget, openWidgetConfig, duplicateWidget]);

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

  const dashboardData = {
    id: 'custom-dashboard',
    name: dashboardName,
    layouts,
    widgets: Array.from(widgets.entries()),
    configs: Array.from(widgetConfigs.entries()),
    theme: colorTheme,
    settings: {
      autoRefresh,
      refreshInterval,
      showGridLines,
      compactMode
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
            onClick={() => setShowSharing(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Refreshing dashboard...')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => toast.success('Dashboard saved')}
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
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={(current, all) => setLayouts(all)}
        >
          {Array.from(widgets.keys()).map((widgetId) => (
            <div key={widgetId}>
              {renderWidget(widgetId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Configuration Dialog */}
      <Dialog open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Configure Widget</DialogTitle>
            <DialogDescription>
              Customize the widget appearance and behavior
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <Tabs defaultValue="general" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="data">Data Source</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-title">Widget Title</Label>
                  <Input
                    id="widget-title"
                    value={configFormData.title}
                    onChange={(e) => setConfigFormData({ ...configFormData, title: e.target.value })}
                    placeholder="Enter widget title"
                  />
                </div>

                {selectedWidgetConfig?.definition?.configurable?.chartType && (
                  <div className="space-y-2">
                    <Label>Chart Type</Label>
                    <RadioGroup
                      value={configFormData.chartType}
                      onValueChange={(value) => setConfigFormData({ ...configFormData, chartType: value })}
                    >
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(CHART_TYPES).map(([key, type]) => (
                          <Card
                            key={key}
                            className={cn(
                              "cursor-pointer",
                              configFormData.chartType === key && "ring-2 ring-primary"
                            )}
                            onClick={() => setConfigFormData({ ...configFormData, chartType: key })}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value={key} />
                                <type.icon className="h-4 w-4" />
                                <span className="text-sm">{type.name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {selectedWidgetConfig?.definition?.configurable?.comparison && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Comparison</Label>
                      <Switch
                        checked={configFormData.comparisonEnabled}
                        onCheckedChange={(checked) => 
                          setConfigFormData({ ...configFormData, comparisonEnabled: checked })
                        }
                      />
                    </div>
                    
                    {configFormData.comparisonEnabled && (
                      <div className="space-y-2">
                        <Label>Comparison Type</Label>
                        <Select
                          value={configFormData.comparisonType}
                          onValueChange={(value) => 
                            setConfigFormData({ ...configFormData, comparisonType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="previous_period">Previous Period</SelectItem>
                            <SelectItem value="previous_year">Previous Year</SelectItem>
                            <SelectItem value="target">Target</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="data" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select
                    value={configFormData.dataSource}
                    onValueChange={(value) => setConfigFormData({ ...configFormData, dataSource: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="custom">Custom Query</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedWidgetConfig?.definition?.configurable?.timeRange && (
                  <div className="space-y-2">
                    <Label>Time Range</Label>
                    <Select
                      value={configFormData.timeRange}
                      onValueChange={(value) => setConfigFormData({ ...configFormData, timeRange: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_RANGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedWidgetConfig?.definition?.configurable?.aggregation && (
                  <div className="space-y-2">
                    <Label>Aggregation</Label>
                    <Select
                      value={configFormData.aggregation}
                      onValueChange={(value) => setConfigFormData({ ...configFormData, aggregation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGGREGATION_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {configFormData.dataSource === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Query</Label>
                    <Textarea
                      value={configFormData.customQuery}
                      onChange={(e) => setConfigFormData({ ...configFormData, customQuery: e.target.value })}
                      placeholder="Enter SQL query..."
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Refresh Rate</Label>
                  <Select
                    value={configFormData.refreshRate}
                    onValueChange={(value) => setConfigFormData({ ...configFormData, refreshRate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit from Dashboard</SelectItem>
                      <SelectItem value="30s">Every 30 seconds</SelectItem>
                      <SelectItem value="1m">Every minute</SelectItem>
                      <SelectItem value="5m">Every 5 minutes</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="display" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {selectedWidgetConfig?.definition?.configurable?.legend && (
                    <div className="flex items-center justify-between">
                      <Label>Show Legend</Label>
                      <Switch
                        checked={configFormData.showLegend}
                        onCheckedChange={(checked) => 
                          setConfigFormData({ ...configFormData, showLegend: checked })
                        }
                      />
                    </div>
                  )}
                  
                  {selectedWidgetConfig?.definition?.configurable?.axes && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Show Grid Lines</Label>
                        <Switch
                          checked={configFormData.showGrid}
                          onCheckedChange={(checked) => 
                            setConfigFormData({ ...configFormData, showGrid: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Show Tooltip</Label>
                        <Switch
                          checked={configFormData.showTooltip}
                          onCheckedChange={(checked) => 
                            setConfigFormData({ ...configFormData, showTooltip: checked })
                          }
                        />
                      </div>
                    </>
                  )}
                  
                  {selectedWidgetConfig?.definition?.configurable?.animation && (
                    <div className="flex items-center justify-between">
                      <Label>Enable Animation</Label>
                      <Switch
                        checked={configFormData.animationEnabled}
                        onCheckedChange={(checked) => 
                          setConfigFormData({ ...configFormData, animationEnabled: checked })
                        }
                      />
                    </div>
                  )}

                  {selectedWidgetConfig?.definition?.configurable?.sparkline && (
                    <div className="flex items-center justify-between">
                      <Label>Show Sparkline</Label>
                      <Switch
                        checked={configFormData.sparklineEnabled}
                        onCheckedChange={(checked) => 
                          setConfigFormData({ ...configFormData, sparklineEnabled: checked })
                        }
                      />
                    </div>
                  )}

                  {selectedWidgetConfig?.definition?.configurable?.colors && (
                    <div className="space-y-2">
                      <Label>Color Scheme</Label>
                      <Select
                        value={configFormData.colorScheme}
                        onValueChange={(value) => setConfigFormData({ ...configFormData, colorScheme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {selectedWidgetConfig?.definition?.configurable?.threshold && (
                  <div className="space-y-4">
                    <Label>Thresholds</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input placeholder="Warning at" type="number" />
                        <Input placeholder="Critical at" type="number" />
                        <Button size="sm">Add</Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWidgetConfig?.definition?.configurable?.filters && (
                  <div className="space-y-4">
                    <Label>Filters</Label>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Add filters to refine the data shown in this widget
                      </AlertDescription>
                    </Alert>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Widget Notes</Label>
                  <Textarea
                    placeholder="Add notes about this widget configuration..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowWidgetConfig(false)}>
              Cancel
            </Button>
            <Button onClick={saveWidgetConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>Choose a widget to add to your dashboard</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="kpis">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kpis">Key Metrics</TabsTrigger>
              <TabsTrigger value="charts">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kpis" className="grid grid-cols-2 gap-3 mt-4">
              {Object.entries(WIDGET_CATALOG.kpis.widgets).map(([key, widget]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => addWidget(key, 'kpis')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <widget.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{widget.name}</h4>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="charts" className="grid grid-cols-2 gap-3 mt-4">
              {Object.entries(WIDGET_CATALOG.charts.widgets).map(([key, widget]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => addWidget(key, 'charts')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <widget.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{widget.name}</h4>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dashboard Sharing Dialog */}
      <DashboardSharing 
        dashboard={dashboardData}
        isOpen={showSharing}
        onClose={() => setShowSharing(false)}
      />

      <style jsx>{`
        .dashboard-grid {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

// Enhanced Widget wrapper with more actions
function WidgetWrapper({ id, title, icon: Icon, children, onRemove, onConfigure, onDuplicate, actions = [] }) {
  return (
    <Card className="h-full relative group overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          {actions.length > 0 && (
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
                {actions.includes('configure') && (
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                )}
                {actions.includes('duplicate') && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {actions.includes('remove') && (
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        {children}
      </CardContent>
    </Card>
  );
}