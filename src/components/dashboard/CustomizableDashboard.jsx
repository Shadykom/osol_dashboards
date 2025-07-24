import { useState, useCallback, useMemo } from 'react';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Activity
} from 'lucide-react';

import { KPIWidget } from '@/components/widgets/KPIWidget';
import { ChartWidget, CHART_CONFIGS } from '@/components/widgets/ChartWidget';
import { cn } from '@/lib/utils';

// Note: CSS imports are handled by Vite automatically
// import 'react-grid-layout/css/styles.css';
// import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types available for adding
const WIDGET_TYPES = {
  kpi: {
    name: 'KPI Card',
    icon: TrendingUp,
    description: 'Display key performance indicators',
    defaultSize: { w: 4, h: 3 },
    category: 'metrics'
  },
  chart_line: {
    name: 'Line Chart',
    icon: TrendingUp,
    description: 'Show trends over time',
    defaultSize: { w: 8, h: 6 },
    category: 'charts'
  },
  chart_bar: {
    name: 'Bar Chart',
    icon: BarChart3,
    description: 'Compare values across categories',
    defaultSize: { w: 8, h: 6 },
    category: 'charts'
  },
  chart_pie: {
    name: 'Pie Chart',
    icon: PieChart,
    description: 'Show proportional data',
    defaultSize: { w: 6, h: 6 },
    category: 'charts'
  },
  customers_kpi: {
    name: 'Customer Metrics',
    icon: Users,
    description: 'Customer-related KPIs',
    defaultSize: { w: 4, h: 3 },
    category: 'banking'
  },
  accounts_kpi: {
    name: 'Account Metrics',
    icon: CreditCard,
    description: 'Account-related KPIs',
    defaultSize: { w: 4, h: 3 },
    category: 'banking'
  },
  revenue_kpi: {
    name: 'Revenue Metrics',
    icon: DollarSign,
    description: 'Revenue and financial KPIs',
    defaultSize: { w: 4, h: 3 },
    category: 'banking'
  },
  transactions_kpi: {
    name: 'Transaction Metrics',
    icon: Activity,
    description: 'Transaction-related KPIs',
    defaultSize: { w: 4, h: 3 },
    category: 'banking'
  }
};

// Default dashboard layouts
const DEFAULT_LAYOUTS = {
  executive: [
    { i: 'customers_kpi', x: 0, y: 0, w: 4, h: 3 },
    { i: 'accounts_kpi', x: 4, y: 0, w: 4, h: 3 },
    { i: 'revenue_kpi', x: 8, y: 0, w: 4, h: 3 },
    { i: 'transactions_chart', x: 0, y: 3, w: 8, h: 6 },
    { i: 'customer_segments', x: 8, y: 3, w: 4, h: 6 }
  ],
  operations: [
    { i: 'transactions_kpi', x: 0, y: 0, w: 3, h: 3 },
    { i: 'accounts_kpi', x: 3, y: 0, w: 3, h: 3 },
    { i: 'customers_kpi', x: 6, y: 0, w: 3, h: 3 },
    { i: 'revenue_kpi', x: 9, y: 0, w: 3, h: 3 },
    { i: 'daily_transactions', x: 0, y: 3, w: 12, h: 6 }
  ]
};

export function CustomizableDashboard({ 
  initialLayout = 'executive',
  onLayoutChange,
  isEditable = true 
}) {
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS[initialLayout] || DEFAULT_LAYOUTS.executive);
  const [widgets, setWidgets] = useState(new Set(layouts.map(item => item.i)));
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Breakpoints for responsive design
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layout);
    if (onLayoutChange) {
      onLayoutChange(layout, layouts);
    }
  }, [onLayoutChange]);

  const addWidget = useCallback((widgetType) => {
    const widgetConfig = WIDGET_TYPES[widgetType];
    if (!widgetConfig) return;

    const newWidgetId = `${widgetType}_${Date.now()}`;
    const newLayout = {
      i: newWidgetId,
      x: 0,
      y: 0,
      ...widgetConfig.defaultSize
    };

    setLayouts(prev => [...prev, newLayout]);
    setWidgets(prev => new Set([...prev, newWidgetId]));
    setShowAddWidget(false);
  }, []);

  const removeWidget = useCallback((widgetId) => {
    setLayouts(prev => prev.filter(item => item.i !== widgetId));
    setWidgets(prev => {
      const newSet = new Set(prev);
      newSet.delete(widgetId);
      return newSet;
    });
  }, []);

  const resetLayout = useCallback(() => {
    const defaultLayout = DEFAULT_LAYOUTS[initialLayout] || DEFAULT_LAYOUTS.executive;
    setLayouts(defaultLayout);
    setWidgets(new Set(defaultLayout.map(item => item.i)));
  }, [initialLayout]);

  const renderWidget = useCallback((widgetId) => {
    // Mock data for demonstration
    const mockData = {
      transactionTrend: [
        { date: '2025-01-20', count: 1200 },
        { date: '2025-01-21', count: 1350 },
        { date: '2025-01-22', count: 1100 },
        { date: '2025-01-23', count: 1450 },
        { date: '2025-01-24', count: 1600 }
      ],
      customerSegments: [
        { segment: 'Retail', count: 8500 },
        { segment: 'Premium', count: 3200 },
        { segment: 'HNI', count: 1100 },
        { segment: 'Corporate', count: 200 }
      ]
    };

    // Determine widget type from ID
    const widgetType = widgetId.split('_')[0];
    const widgetSubtype = widgetId.split('_')[1];

    switch (widgetType) {
      case 'customers':
        return (
          <KPIWidget
            id={widgetId}
            title="Total Customers"
            value={12847}
            change="+12.5%"
            trend="up"
            description="Active customers"
            icon={Users}
            onRemove={isEditMode ? removeWidget : undefined}
          />
        );

      case 'accounts':
        return (
          <KPIWidget
            id={widgetId}
            title="Total Accounts"
            value={18293}
            change="+8.2%"
            trend="up"
            description="All account types"
            icon={CreditCard}
            onRemove={isEditMode ? removeWidget : undefined}
          />
        );

      case 'revenue':
        return (
          <KPIWidget
            id={widgetId}
            title="Monthly Revenue"
            value="SAR 45.2M"
            change="+18.7%"
            trend="up"
            description="This month's revenue"
            icon={DollarSign}
            onRemove={isEditMode ? removeWidget : undefined}
          />
        );

      case 'transactions':
        if (widgetSubtype === 'chart') {
          return (
            <ChartWidget
              id={widgetId}
              title="Transaction Trend"
              description="Daily transaction volume"
              data={mockData.transactionTrend}
              chartType="line"
              xAxisKey="date"
              yAxisKey="count"
              onRemove={isEditMode ? removeWidget : undefined}
            />
          );
        }
        return (
          <KPIWidget
            id={widgetId}
            title="Daily Transactions"
            value={8547}
            change="-2.4%"
            trend="down"
            description="Today's transactions"
            icon={Activity}
            onRemove={isEditMode ? removeWidget : undefined}
          />
        );

      case 'customer':
        if (widgetSubtype === 'segments') {
          return (
            <ChartWidget
              id={widgetId}
              title="Customer Segments"
              description="Distribution by segment"
              data={mockData.customerSegments}
              chartType="pie"
              xAxisKey="segment"
              yAxisKey="count"
              showLegend={true}
              onRemove={isEditMode ? removeWidget : undefined}
            />
          );
        }
        break;

      case 'daily':
        if (widgetSubtype === 'transactions') {
          return (
            <ChartWidget
              id={widgetId}
              title="Daily Transaction Volume"
              description="Hourly breakdown"
              data={mockData.transactionTrend}
              chartType="bar"
              xAxisKey="date"
              yAxisKey="count"
              onRemove={isEditMode ? removeWidget : undefined}
            />
          );
        }
        break;

      default:
        return (
          <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-sm text-muted-foreground">Unknown widget: {widgetId}</p>
          </div>
        );
    }
  }, [isEditMode, removeWidget]);

  const widgetsByCategory = useMemo(() => {
    const categories = {};
    Object.entries(WIDGET_TYPES).forEach(([key, widget]) => {
      if (!categories[widget.category]) {
        categories[widget.category] = [];
      }
      categories[widget.category].push({ key, ...widget });
    });
    return categories;
  }, []);

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      {isEditable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Dashboard Customization</CardTitle>
                <CardDescription>
                  Customize your dashboard layout and widgets
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isEditMode ? "default" : "secondary"}>
                  {isEditMode ? "Edit Mode" : "View Mode"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  {isEditMode ? "Exit Edit" : "Edit Layout"}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {isEditMode && (
            <CardContent>
              <div className="flex items-center space-x-2">
                <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Widget</DialogTitle>
                      <DialogDescription>
                        Choose a widget type to add to your dashboard
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                        <div key={category}>
                          <h4 className="font-medium mb-2 capitalize">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {widgets.map((widget) => (
                              <Button
                                key={widget.key}
                                variant="outline"
                                className="h-auto p-3 justify-start"
                                onClick={() => addWidget(widget.key)}
                              >
                                <div className="flex items-start space-x-3">
                                  <widget.icon className="h-5 w-5 mt-0.5" />
                                  <div className="text-left">
                                    <p className="font-medium">{widget.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {widget.description}
                                    </p>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={resetLayout}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Layout
                </Button>

                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save Layout
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className={cn(
        "min-h-[600px]",
        isEditMode && "border-2 border-dashed border-primary/25 rounded-lg p-4"
      )}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layouts }}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={handleLayoutChange}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {Array.from(widgets).map((widgetId) => (
            <div key={widgetId}>
              {renderWidget(widgetId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {isEditMode && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <Grid3X3 className="h-4 w-4 inline mr-2" />
              Drag widgets to rearrange • Resize by dragging corners • Use widget menu to configure or remove
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

