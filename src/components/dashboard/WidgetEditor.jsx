import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, RotateCcw, Eye, Settings, BarChart3, PieChart,
  LineChart, TrendingUp, Users, DollarSign, Activity,
  CreditCard, Target, Layers, Database, GitBranch,
  Package, FileText, AlertCircle, CheckCircle, Info,
  AreaChart, Sparkles, Brain, Zap, Globe, Timer
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Widget type definitions
const WIDGET_TYPES = {
  kpi: {
    label: 'KPI Card',
    icon: TrendingUp,
    description: 'Display key performance indicators',
    category: 'metrics',
    configurable: ['title', 'metric', 'comparison', 'format', 'color']
  },
  chart: {
    label: 'Chart',
    icon: BarChart3,
    description: 'Visualize data with various chart types',
    category: 'visualization',
    configurable: ['title', 'chartType', 'dataSource', 'metrics', 'dimensions', 'colors']
  },
  table: {
    label: 'Data Table',
    icon: Database,
    description: 'Display data in tabular format',
    category: 'data',
    configurable: ['title', 'columns', 'dataSource', 'pagination', 'sorting']
  },
  stat: {
    label: 'Statistics',
    icon: Activity,
    description: 'Show statistical summaries',
    category: 'metrics',
    configurable: ['title', 'stats', 'format', 'comparison']
  },
  progress: {
    label: 'Progress',
    icon: Target,
    description: 'Display progress towards goals',
    category: 'metrics',
    configurable: ['title', 'current', 'target', 'format', 'color']
  },
  alert: {
    label: 'Alert',
    icon: AlertCircle,
    description: 'Show alerts and notifications',
    category: 'monitoring',
    configurable: ['title', 'severity', 'message', 'dismissible']
  },
  custom: {
    label: 'Custom Widget',
    icon: Sparkles,
    description: 'Custom widget with flexible configuration',
    category: 'advanced',
    configurable: ['title', 'content', 'style']
  }
};

// Chart type definitions
const CHART_TYPES = {
  line: {
    label: 'Line Chart',
    icon: LineChart,
    description: 'Show trends over time',
    supportedData: ['timeSeries', 'continuous']
  },
  bar: {
    label: 'Bar Chart',
    icon: BarChart3,
    description: 'Compare values across categories',
    supportedData: ['categorical', 'comparison']
  },
  pie: {
    label: 'Pie Chart',
    icon: PieChart,
    description: 'Show proportions of a whole',
    supportedData: ['categorical', 'percentage']
  },
  area: {
    label: 'Area Chart',
    icon: AreaChart,
    description: 'Show cumulative trends',
    supportedData: ['timeSeries', 'continuous']
  },
  scatter: {
    label: 'Scatter Plot',
    icon: Sparkles,
    description: 'Show correlations between variables',
    supportedData: ['correlation', 'distribution']
  },
  radar: {
    label: 'Radar Chart',
    icon: Globe,
    description: 'Compare multiple variables',
    supportedData: ['multivariate', 'comparison']
  },
  heatmap: {
    label: 'Heatmap',
    icon: Layers,
    description: 'Show intensity across dimensions',
    supportedData: ['matrix', 'intensity']
  },
  gauge: {
    label: 'Gauge Chart',
    icon: Timer,
    description: 'Show progress or performance',
    supportedData: ['single', 'percentage']
  }
};

// Data source options
const DATA_SOURCES = {
  collection: 'Collection Data',
  revenue: 'Revenue Data',
  customers: 'Customer Data',
  branches: 'Branch Data',
  products: 'Product Data',
  performance: 'Performance Data',
  custom: 'Custom Query'
};

// Metric format options
const METRIC_FORMATS = {
  number: 'Number',
  currency: 'Currency',
  percentage: 'Percentage',
  decimal: 'Decimal',
  compact: 'Compact (K, M, B)',
  duration: 'Duration',
  date: 'Date'
};

export function WidgetEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen,
  availableMetrics = [],
  availableDimensions = []
}) {
  // State for widget configuration
  const [widgetConfig, setWidgetConfig] = useState({
    type: widget?.type || 'kpi',
    title: widget?.title || '',
    description: widget?.description || '',
    config: widget?.config || {},
    position: widget?.position || { x: 0, y: 0, w: 3, h: 2 }
  });

  const [activeTab, setActiveTab] = useState('type');
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize configuration when widget changes
  useEffect(() => {
    if (widget) {
      setWidgetConfig({
        type: widget.type || 'kpi',
        title: widget.title || '',
        description: widget.description || '',
        config: widget.config || {},
        position: widget.position || { x: 0, y: 0, w: 3, h: 2 }
      });
    }
  }, [widget]);

  // Track changes
  useEffect(() => {
    if (widget) {
      const changed = JSON.stringify(widget) !== JSON.stringify(widgetConfig);
      setHasChanges(changed);
    }
  }, [widgetConfig, widget]);

  // Handle widget type change
  const handleTypeChange = (newType) => {
    setWidgetConfig(prev => ({
      ...prev,
      type: newType,
      config: {
        ...prev.config,
        // Reset chart type if changing from chart widget
        chartType: newType === 'chart' ? (prev.config.chartType || 'bar') : undefined
      }
    }));
  };

  // Handle chart type change
  const handleChartTypeChange = (chartType) => {
    setWidgetConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        chartType
      }
    }));
  };

  // Handle configuration changes
  const handleConfigChange = (key, value) => {
    setWidgetConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  // Handle size change
  const handleSizeChange = (dimension, value) => {
    setWidgetConfig(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [dimension]: parseInt(value) || 1
      }
    }));
  };

  // Save widget configuration
  const handleSave = () => {
    if (!widgetConfig.title) {
      toast.error('Please enter a widget title');
      return;
    }

    onSave({
      ...widget,
      ...widgetConfig,
      id: widget?.id || `widget-${Date.now()}`
    });

    toast.success('Widget saved successfully');
  };

  // Reset to original configuration
  const handleReset = () => {
    if (widget) {
      setWidgetConfig({
        type: widget.type || 'kpi',
        title: widget.title || '',
        description: widget.description || '',
        config: widget.config || {},
        position: widget.position || { x: 0, y: 0, w: 3, h: 2 }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Widget</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {previewMode ? 'Hide' : 'Show'} Preview
              </Button>
              {hasChanges && (
                <Badge variant="secondary">Unsaved Changes</Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Customize your widget type, appearance, and data configuration
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              {/* Type Selection Tab */}
              <TabsContent value="type" className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Widget Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(WIDGET_TYPES).map(([key, type]) => {
                      const Icon = type.icon;
                      const isSelected = widgetConfig.type === key;
                      
                      return (
                        <Card
                          key={key}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected && "ring-2 ring-primary"
                          )}
                          onClick={() => handleTypeChange(key)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              {type.description}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {type.category}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Chart Type Selection (for chart widgets) */}
                {widgetConfig.type === 'chart' && (
                  <div>
                    <Separator className="my-4" />
                    <Label className="text-base font-semibold mb-3 block">Chart Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(CHART_TYPES).map(([key, chart]) => {
                        const Icon = chart.icon;
                        const isSelected = widgetConfig.config.chartType === key;
                        
                        return (
                          <Card
                            key={key}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              isSelected && "ring-2 ring-primary"
                            )}
                            onClick={() => handleChartTypeChange(key)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {chart.label}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground">
                                {chart.description}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Data Configuration Tab */}
              <TabsContent value="data" className="space-y-4">
                <div>
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Select
                    value={widgetConfig.config.dataSource || 'collection'}
                    onValueChange={(value) => handleConfigChange('dataSource', value)}
                  >
                    <SelectTrigger id="dataSource">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATA_SOURCES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {widgetConfig.type === 'chart' && (
                  <>
                    <div>
                      <Label htmlFor="metrics">Metrics</Label>
                      <Select
                        value={widgetConfig.config.metrics?.[0] || ''}
                        onValueChange={(value) => handleConfigChange('metrics', [value])}
                      >
                        <SelectTrigger id="metrics">
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="collection">Collection</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="transactions">Transactions</SelectItem>
                          <SelectItem value="growth">Growth Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Select
                        value={widgetConfig.config.dimensions?.[0] || ''}
                        onValueChange={(value) => handleConfigChange('dimensions', [value])}
                      >
                        <SelectTrigger id="dimensions">
                          <SelectValue placeholder="Select dimension" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="region">Region</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {(widgetConfig.type === 'kpi' || widgetConfig.type === 'stat') && (
                  <>
                    <div>
                      <Label htmlFor="metric">Metric</Label>
                      <Select
                        value={widgetConfig.config.metric || ''}
                        onValueChange={(value) => handleConfigChange('metric', value)}
                      >
                        <SelectTrigger id="metric">
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="totalRevenue">Total Revenue</SelectItem>
                          <SelectItem value="totalCollection">Total Collection</SelectItem>
                          <SelectItem value="collectionRate">Collection Rate</SelectItem>
                          <SelectItem value="activeCustomers">Active Customers</SelectItem>
                          <SelectItem value="avgTransactionValue">Avg Transaction Value</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="format">Display Format</Label>
                      <Select
                        value={widgetConfig.config.format || 'number'}
                        onValueChange={(value) => handleConfigChange('format', value)}
                      >
                        <SelectTrigger id="format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(METRIC_FORMATS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showComparison"
                        checked={widgetConfig.config.showComparison || false}
                        onCheckedChange={(checked) => handleConfigChange('showComparison', checked)}
                      />
                      <Label htmlFor="showComparison">Show Comparison</Label>
                    </div>
                  </>
                )}

                {widgetConfig.config.showComparison && (
                  <div>
                    <Label htmlFor="comparisonPeriod">Comparison Period</Label>
                    <Select
                      value={widgetConfig.config.comparisonPeriod || 'previous'}
                      onValueChange={(value) => handleConfigChange('comparisonPeriod', value)}
                    >
                      <SelectTrigger id="comparisonPeriod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous">Previous Period</SelectItem>
                        <SelectItem value="lastYear">Last Year</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="lastWeek">Last Week</SelectItem>
                        <SelectItem value="target">Target</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                <div>
                  <Label htmlFor="title">Widget Title</Label>
                  <Input
                    id="title"
                    value={widgetConfig.title}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter widget title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={widgetConfig.description}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter widget description"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (Grid Units)</Label>
                    <Select
                      value={widgetConfig.position.w.toString()}
                      onValueChange={(value) => handleSizeChange('w', value)}
                    >
                      <SelectTrigger id="width">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 6, 8, 12].map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? 'unit' : 'units'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="height">Height (Grid Units)</Label>
                    <Select
                      value={widgetConfig.position.h.toString()}
                      onValueChange={(value) => handleSizeChange('h', value)}
                    >
                      <SelectTrigger id="height">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? 'unit' : 'units'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">Color Theme</Label>
                  <Select
                    value={widgetConfig.config.color || 'default'}
                    onValueChange={(value) => handleConfigChange('color', value)}
                  >
                    <SelectTrigger id="color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                      <SelectItem value="warning">Warning (Yellow)</SelectItem>
                      <SelectItem value="danger">Danger (Red)</SelectItem>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showBorder"
                    checked={widgetConfig.config.showBorder !== false}
                    onCheckedChange={(checked) => handleConfigChange('showBorder', checked)}
                  />
                  <Label htmlFor="showBorder">Show Border</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showShadow"
                    checked={widgetConfig.config.showShadow !== false}
                    onCheckedChange={(checked) => handleConfigChange('showShadow', checked)}
                  />
                  <Label htmlFor="showShadow">Show Shadow</Label>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                  <Input
                    id="refreshInterval"
                    type="number"
                    value={widgetConfig.config.refreshInterval || 30}
                    onChange={(e) => handleConfigChange('refreshInterval', parseInt(e.target.value))}
                    min="5"
                    max="3600"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRefresh"
                    checked={widgetConfig.config.autoRefresh !== false}
                    onCheckedChange={(checked) => handleConfigChange('autoRefresh', checked)}
                  />
                  <Label htmlFor="autoRefresh">Auto Refresh</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="exportable"
                    checked={widgetConfig.config.exportable !== false}
                    onCheckedChange={(checked) => handleConfigChange('exportable', checked)}
                  />
                  <Label htmlFor="exportable">Allow Export</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="interactive"
                    checked={widgetConfig.config.interactive !== false}
                    onCheckedChange={(checked) => handleConfigChange('interactive', checked)}
                  />
                  <Label htmlFor="interactive">Interactive</Label>
                </div>

                {widgetConfig.type === 'chart' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showLegend"
                        checked={widgetConfig.config.showLegend !== false}
                        onCheckedChange={(checked) => handleConfigChange('showLegend', checked)}
                      />
                      <Label htmlFor="showLegend">Show Legend</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showTooltip"
                        checked={widgetConfig.config.showTooltip !== false}
                        onCheckedChange={(checked) => handleConfigChange('showTooltip', checked)}
                      />
                      <Label htmlFor="showTooltip">Show Tooltip</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showGrid"
                        checked={widgetConfig.config.showGrid !== false}
                        onCheckedChange={(checked) => handleConfigChange('showGrid', checked)}
                      />
                      <Label htmlFor="showGrid">Show Grid Lines</Label>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="customCSS">Custom CSS (Advanced)</Label>
                  <Textarea
                    id="customCSS"
                    value={widgetConfig.config.customCSS || ''}
                    onChange={(e) => handleConfigChange('customCSS', e.target.value)}
                    placeholder="Enter custom CSS styles"
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Preview Section */}
        {previewMode && (
          <div className="border-t pt-4">
            <Label className="text-sm font-semibold mb-2 block">Preview</Label>
            <Card className="p-4 bg-muted/50">
              <div className="text-center text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Widget preview will appear here</p>
                <p className="text-xs mt-1">
                  Type: {WIDGET_TYPES[widgetConfig.type]?.label}
                  {widgetConfig.type === 'chart' && widgetConfig.config.chartType && 
                    ` - ${CHART_TYPES[widgetConfig.config.chartType]?.label}`
                  }
                </p>
              </div>
            </Card>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!widgetConfig.title}>
            <Save className="w-4 h-4 mr-2" />
            Save Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}