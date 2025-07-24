// WidgetConfiguration.jsx - Comprehensive widget configuration component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings, Database, Eye, Palette, Filter, Code, Info,
  LineChart, BarChart3, PieChart, Activity, TrendingUp,
  Calendar, Clock, Target, Layers, Plus, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';

// Configuration options for different widget types
const WIDGET_CONFIG_OPTIONS = {
  kpi: {
    general: ['title', 'subtitle', 'icon', 'size'],
    data: ['dataSource', 'metric', 'aggregation', 'filters', 'timeRange'],
    display: ['format', 'prefix', 'suffix', 'decimals', 'comparison', 'sparkline', 'trend'],
    advanced: ['thresholds', 'alerts', 'drillDown', 'customQuery']
  },
  chart: {
    general: ['title', 'subtitle', 'chartType', 'size'],
    data: ['dataSource', 'dimensions', 'measures', 'aggregation', 'filters', 'timeRange', 'sorting'],
    display: ['colors', 'legend', 'axes', 'grid', 'tooltip', 'animation', 'stacked'],
    advanced: ['customQuery', 'transformations', 'annotations', 'exportOptions']
  },
  table: {
    general: ['title', 'subtitle', 'size'],
    data: ['dataSource', 'columns', 'filters', 'sorting', 'pagination'],
    display: ['columnWidth', 'alignment', 'formatting', 'highlights', 'grouping'],
    advanced: ['customQuery', 'calculations', 'exportOptions']
  }
};

// Data source options
const DATA_SOURCES = [
  { value: 'customers', label: 'Customers', icon: Database },
  { value: 'accounts', label: 'Accounts', icon: Database },
  { value: 'transactions', label: 'Transactions', icon: Database },
  { value: 'loans', label: 'Loans', icon: Database },
  { value: 'revenue', label: 'Revenue', icon: Database },
  { value: 'custom', label: 'Custom Query', icon: Code }
];

// Metric options based on data source
const METRICS_BY_SOURCE = {
  customers: [
    { value: 'total_count', label: 'Total Customers' },
    { value: 'active_count', label: 'Active Customers' },
    { value: 'new_count', label: 'New Customers' },
    { value: 'retention_rate', label: 'Retention Rate' }
  ],
  accounts: [
    { value: 'total_count', label: 'Total Accounts' },
    { value: 'active_count', label: 'Active Accounts' },
    { value: 'total_balance', label: 'Total Balance' },
    { value: 'avg_balance', label: 'Average Balance' }
  ],
  transactions: [
    { value: 'total_count', label: 'Transaction Count' },
    { value: 'total_volume', label: 'Transaction Volume' },
    { value: 'avg_amount', label: 'Average Amount' },
    { value: 'success_rate', label: 'Success Rate' }
  ]
};

// Format options
const FORMAT_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percentage' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'compact', label: 'Compact (K, M, B)' }
];

// Time range presets
const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
];

// Comparison options
const COMPARISON_OPTIONS = [
  { value: 'none', label: 'No Comparison' },
  { value: 'previous_period', label: 'Previous Period' },
  { value: 'previous_year', label: 'Previous Year' },
  { value: 'target', label: 'vs Target' },
  { value: 'average', label: 'vs Average' }
];

// Chart types with their specific options
const CHART_TYPES = {
  line: {
    name: 'Line Chart',
    icon: LineChart,
    options: ['smooth', 'area', 'points', 'multiAxis']
  },
  bar: {
    name: 'Bar Chart',
    icon: BarChart3,
    options: ['horizontal', 'stacked', 'grouped', 'rounded']
  },
  pie: {
    name: 'Pie Chart',
    icon: PieChart,
    options: ['donut', 'labels', 'legend', 'percentages']
  },
  area: {
    name: 'Area Chart',
    icon: Activity,
    options: ['stacked', 'gradient', 'smooth', 'baseline']
  },
  scatter: {
    name: 'Scatter Plot',
    icon: Activity,
    options: ['bubble', 'regression', 'clusters', 'labels']
  }
};

export function WidgetConfiguration({ 
  isOpen, 
  onClose, 
  widget, 
  onSave,
  existingConfig = {} 
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({
    // General settings
    title: '',
    subtitle: '',
    icon: null,
    description: '',
    
    // Data settings
    dataSource: 'customers',
    metric: '',
    dimensions: [],
    measures: [],
    aggregation: 'sum',
    timeRange: 'last_30_days',
    customDateRange: { start: null, end: null },
    filters: [],
    sorting: { field: null, direction: 'asc' },
    
    // Display settings
    chartType: 'line',
    chartOptions: {},
    format: 'number',
    prefix: '',
    suffix: '',
    decimals: 0,
    showComparison: false,
    comparisonType: 'previous_period',
    showSparkline: false,
    showTrend: true,
    colors: {
      primary: '#E6B800',
      secondary: '#4A5568',
      success: '#68D391',
      warning: '#F6AD55',
      danger: '#FC8181'
    },
    showLegend: true,
    legendPosition: 'bottom',
    showGrid: true,
    showAxes: true,
    axisLabels: { x: '', y: '' },
    showTooltip: true,
    enableAnimation: true,
    animationDuration: 1000,
    
    // Advanced settings
    thresholds: [],
    alerts: [],
    drillDownEnabled: false,
    drillDownTarget: null,
    customQuery: '',
    queryVariables: {},
    refreshInterval: null,
    cacheTimeout: 300,
    exportEnabled: true,
    exportFormats: ['csv', 'excel', 'pdf'],
    
    ...existingConfig
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorKey, setActiveColorKey] = useState('primary');
  const [customQueryError, setCustomQueryError] = useState('');

  useEffect(() => {
    if (existingConfig) {
      setConfig(prev => ({ ...prev, ...existingConfig }));
    }
  }, [existingConfig]);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = (parent, key, value) => {
    setConfig(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: 'equals',
      value: ''
    };
    updateConfig('filters', [...config.filters, newFilter]);
  };

  const removeFilter = (filterId) => {
    updateConfig('filters', config.filters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId, key, value) => {
    updateConfig('filters', config.filters.map(f => 
      f.id === filterId ? { ...f, [key]: value } : f
    ));
  };

  const addThreshold = () => {
    const newThreshold = {
      id: Date.now(),
      name: '',
      value: 0,
      color: '#FC8181',
      operator: 'greater_than'
    };
    updateConfig('thresholds', [...config.thresholds, newThreshold]);
  };

  const removeThreshold = (thresholdId) => {
    updateConfig('thresholds', config.thresholds.filter(t => t.id !== thresholdId));
  };

  const validateCustomQuery = (query) => {
    // Basic SQL validation
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'UPDATE', 'INSERT'];
    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        setCustomQueryError(`Query contains dangerous keyword: ${keyword}`);
        return false;
      }
    }
    
    setCustomQueryError('');
    return true;
  };

  const handleSave = () => {
    // Validate configuration
    if (!config.title) {
      alert('Please enter a widget title');
      return;
    }

    if (config.dataSource === 'custom' && !validateCustomQuery(config.customQuery)) {
      return;
    }

    // Save configuration
    onSave(config);
    onClose();
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="widget-title">Widget Title *</Label>
        <Input
          id="widget-title"
          value={config.title}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Enter widget title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="widget-subtitle">Subtitle</Label>
        <Input
          id="widget-subtitle"
          value={config.subtitle}
          onChange={(e) => updateConfig('subtitle', e.target.value)}
          placeholder="Optional subtitle"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="widget-description">Description</Label>
        <Textarea
          id="widget-description"
          value={config.description}
          onChange={(e) => updateConfig('description', e.target.value)}
          placeholder="Add a description for this widget"
          rows={3}
        />
      </div>

      {widget?.type === 'chart' && (
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <RadioGroup
            value={config.chartType}
            onValueChange={(value) => updateConfig('chartType', value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CHART_TYPES).map(([key, chart]) => (
                <Card
                  key={key}
                  className={cn(
                    "cursor-pointer",
                    config.chartType === key && "ring-2 ring-primary"
                  )}
                  onClick={() => updateConfig('chartType', key)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={key} />
                      <chart.icon className="h-4 w-4" />
                      <span className="text-sm">{chart.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label>Widget Size</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Width (columns)</Label>
            <Slider
              value={[config.width || 4]}
              onValueChange={([value]) => updateConfig('width', value)}
              min={2}
              max={12}
              step={1}
              className="mt-2"
            />
            <span className="text-xs text-muted-foreground">{config.width || 4} columns</span>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Height (rows)</Label>
            <Slider
              value={[config.height || 3]}
              onValueChange={([value]) => updateConfig('height', value)}
              min={2}
              max={8}
              step={1}
              className="mt-2"
            />
            <span className="text-xs text-muted-foreground">{config.height || 3} rows</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Data Source</Label>
        <Select
          value={config.dataSource}
          onValueChange={(value) => {
            updateConfig('dataSource', value);
            updateConfig('metric', ''); // Reset metric when source changes
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_SOURCES.map(source => (
              <SelectItem key={source.value} value={source.value}>
                <div className="flex items-center gap-2">
                  <source.icon className="h-4 w-4" />
                  {source.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.dataSource !== 'custom' && (
        <>
          <div className="space-y-2">
            <Label>Metric</Label>
            <Select
              value={config.metric}
              onValueChange={(value) => updateConfig('metric', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS_BY_SOURCE[config.dataSource]?.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aggregation</Label>
            <Select
              value={config.aggregation}
              onValueChange={(value) => updateConfig('aggregation', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="distinct">Count Distinct</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Time Range</Label>
        <Select
          value={config.timeRange}
          onValueChange={(value) => updateConfig('timeRange', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {range.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.timeRange === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={config.customDateRange.start}
              onChange={(e) => updateNestedConfig('customDateRange', 'start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={config.customDateRange.end}
              onChange={(e) => updateNestedConfig('customDateRange', 'end', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Filters</Label>
          <Button size="sm" variant="outline" onClick={addFilter}>
            <Plus className="h-4 w-4 mr-1" />
            Add Filter
          </Button>
        </div>
        
        {config.filters.map(filter => (
          <Card key={filter.id}>
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(filter.id, 'field', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    className="h-8"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeFilter(filter.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {config.dataSource === 'custom' && (
        <div className="space-y-2">
          <Label>Custom SQL Query</Label>
          <Textarea
            value={config.customQuery}
            onChange={(e) => {
              updateConfig('customQuery', e.target.value);
              validateCustomQuery(e.target.value);
            }}
            placeholder="SELECT * FROM table WHERE ..."
            rows={6}
            className="font-mono text-sm"
          />
          {customQueryError && (
            <Alert variant="destructive">
              <AlertDescription>{customQueryError}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Use {{variable}} syntax for dynamic variables
          </p>
        </div>
      )}
    </div>
  );

  const renderDisplayTab = () => (
    <div className="space-y-6">
      {widget?.type === 'kpi' && (
        <>
          <div className="space-y-2">
            <Label>Value Format</Label>
            <Select
              value={config.format}
              onValueChange={(value) => updateConfig('format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                value={config.prefix}
                onChange={(e) => updateConfig('prefix', e.target.value)}
                placeholder="e.g., $, SAR"
              />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                value={config.suffix}
                onChange={(e) => updateConfig('suffix', e.target.value)}
                placeholder="e.g., %, /month"
              />
            </div>
          </div>

          {config.format === 'decimal' && (
            <div className="space-y-2">
              <Label>Decimal Places</Label>
              <Slider
                value={[config.decimals]}
                onValueChange={([value]) => updateConfig('decimals', value)}
                min={0}
                max={4}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{config.decimals} decimal places</span>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Comparison</Label>
                <p className="text-sm text-muted-foreground">
                  Display change vs previous period
                </p>
              </div>
              <Switch
                checked={config.showComparison}
                onCheckedChange={(checked) => updateConfig('showComparison', checked)}
              />
            </div>

            {config.showComparison && (
              <div className="space-y-2">
                <Label>Comparison Type</Label>
                <Select
                  value={config.comparisonType}
                  onValueChange={(value) => updateConfig('comparisonType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARISON_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Sparkline</Label>
                <p className="text-sm text-muted-foreground">
                  Display mini trend chart
                </p>
              </div>
              <Switch
                checked={config.showSparkline}
                onCheckedChange={(checked) => updateConfig('showSparkline', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Trend Indicator</Label>
                <p className="text-sm text-muted-foreground">
                  Display up/down arrow
                </p>
              </div>
              <Switch
                checked={config.showTrend}
                onCheckedChange={(checked) => updateConfig('showTrend', checked)}
              />
            </div>
          </div>
        </>
      )}

      {widget?.type === 'chart' && (
        <>
          <div className="space-y-4">
            <Label>Color Scheme</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.colors).map(([key, color]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs capitalize">{key} Color</Label>
                  <div
                    className="h-10 rounded border cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setActiveColorKey(key);
                      setShowColorPicker(true);
                    }}
                  >
                    <span className="text-xs font-mono text-white drop-shadow">
                      {color}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Legend</Label>
              <Switch
                checked={config.showLegend}
                onCheckedChange={(checked) => updateConfig('showLegend', checked)}
              />
            </div>

            {config.showLegend && (
              <div className="space-y-2">
                <Label>Legend Position</Label>
                <Select
                  value={config.legendPosition}
                  onValueChange={(value) => updateConfig('legendPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Show Grid Lines</Label>
              <Switch
                checked={config.showGrid}
                onCheckedChange={(checked) => updateConfig('showGrid', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show Axes</Label>
              <Switch
                checked={config.showAxes}
                onCheckedChange={(checked) => updateConfig('showAxes', checked)}
              />
            </div>

            {config.showAxes && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">X-Axis Label</Label>
                  <Input
                    value={config.axisLabels.x}
                    onChange={(e) => updateNestedConfig('axisLabels', 'x', e.target.value)}
                    placeholder="X-axis label"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Y-Axis Label</Label>
                  <Input
                    value={config.axisLabels.y}
                    onChange={(e) => updateNestedConfig('axisLabels', 'y', e.target.value)}
                    placeholder="Y-axis label"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Show Tooltip</Label>
              <Switch
                checked={config.showTooltip}
                onCheckedChange={(checked) => updateConfig('showTooltip', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Animation</Label>
              <Switch
                checked={config.enableAnimation}
                onCheckedChange={(checked) => updateConfig('enableAnimation', checked)}
              />
            </div>

            {config.enableAnimation && (
              <div className="space-y-2">
                <Label>Animation Duration (ms)</Label>
                <Slider
                  value={[config.animationDuration]}
                  onValueChange={([value]) => updateConfig('animationDuration', value)}
                  min={0}
                  max={3000}
                  step={100}
                />
                <span className="text-xs text-muted-foreground">
                  {config.animationDuration}ms
                </span>
              </div>
            )}
          </div>

          {/* Chart-specific options */}
          {CHART_TYPES[config.chartType]?.options && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label>Chart Options</Label>
                {CHART_TYPES[config.chartType].options.map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={config.chartOptions[option] || false}
                      onCheckedChange={(checked) => 
                        updateNestedConfig('chartOptions', option, checked)
                      }
                    />
                    <Label 
                      htmlFor={option} 
                      className="text-sm font-normal capitalize cursor-pointer"
                    >
                      {option.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Thresholds</Label>
          <Button size="sm" variant="outline" onClick={addThreshold}>
            <Plus className="h-4 w-4 mr-1" />
            Add Threshold
          </Button>
        </div>
        
        {config.thresholds.map(threshold => (
          <Card key={threshold.id}>
            <CardContent className="p-3">
              <div className="grid grid-cols-5 gap-2 items-end">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    className="h-8"
                    value={threshold.name}
                    onChange={(e) => {
                      updateConfig('thresholds', config.thresholds.map(t =>
                        t.id === threshold.id ? { ...t, name: e.target.value } : t
                      ));
                    }}
                    placeholder="Warning"
                  />
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={threshold.operator}
                    onValueChange={(value) => {
                      updateConfig('thresholds', config.thresholds.map(t =>
                        t.id === threshold.id ? { ...t, operator: value } : t
                      ));
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">{'>'}</SelectItem>
                      <SelectItem value="less_than">{'<'}</SelectItem>
                      <SelectItem value="equals">{'='}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    className="h-8"
                    type="number"
                    value={threshold.value}
                    onChange={(e) => {
                      updateConfig('thresholds', config.thresholds.map(t =>
                        t.id === threshold.id ? { ...t, value: parseFloat(e.target.value) } : t
                      ));
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <div
                    className="h-8 rounded border cursor-pointer"
                    style={{ backgroundColor: threshold.color }}
                    onClick={() => {
                      // Would open color picker for threshold
                    }}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeThreshold(threshold.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Drill-Down</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to click for more details
            </p>
          </div>
          <Switch
            checked={config.drillDownEnabled}
            onCheckedChange={(checked) => updateConfig('drillDownEnabled', checked)}
          />
        </div>

        {config.drillDownEnabled && (
          <div className="space-y-2">
            <Label>Drill-Down Target</Label>
            <Select
              value={config.drillDownTarget}
              onValueChange={(value) => updateConfig('drillDownTarget', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="details">Details Page</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="custom">Custom URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Performance</Label>
        
        <div className="space-y-2">
          <Label className="text-sm">Refresh Interval</Label>
          <Select
            value={config.refreshInterval || 'none'}
            onValueChange={(value) => updateConfig('refreshInterval', value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Auto-refresh</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Cache Timeout (seconds)</Label>
          <Input
            type="number"
            value={config.cacheTimeout}
            onChange={(e) => updateConfig('cacheTimeout', parseInt(e.target.value))}
            min={0}
            max={3600}
          />
          <p className="text-xs text-muted-foreground">
            How long to cache data before refreshing
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Export</Label>
          <Switch
            checked={config.exportEnabled}
            onCheckedChange={(checked) => updateConfig('exportEnabled', checked)}
          />
        </div>

        {config.exportEnabled && (
          <div className="space-y-2">
            <Label>Export Formats</Label>
            <div className="space-y-2">
              {['csv', 'excel', 'pdf', 'png'].map(format => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${format}`}
                    checked={config.exportFormats.includes(format)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateConfig('exportFormats', [...config.exportFormats, format]);
                      } else {
                        updateConfig('exportFormats', config.exportFormats.filter(f => f !== format));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`export-${format}`} 
                    className="text-sm font-normal uppercase cursor-pointer"
                  >
                    {format}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Widget
            </DialogTitle>
            <DialogDescription>
              Customize every aspect of your widget
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data Source</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="general" className="pr-4">
                {renderGeneralTab()}
              </TabsContent>
              
              <TabsContent value="data" className="pr-4">
                {renderDataTab()}
              </TabsContent>
              
              <TabsContent value="display" className="pr-4">
                {renderDisplayTab()}
              </TabsContent>
              
              <TabsContent value="advanced" className="pr-4">
                {renderAdvancedTab()}
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose Color</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <HexColorPicker
              color={config.colors[activeColorKey]}
              onChange={(color) => updateNestedConfig('colors', activeColorKey, color)}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowColorPicker(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}