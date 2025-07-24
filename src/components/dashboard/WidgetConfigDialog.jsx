// src/components/dashboard/WidgetConfigDialog.jsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Palette,
  RefreshCw,
  Eye,
  BarChart3,
  Settings2,
  Zap,
  Database,
  Clock,
  Filter,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHART_CONFIGS } from '@/components/widgets/ChartWidget';

// Widget-specific configuration options
const WIDGET_CONFIG_OPTIONS = {
  kpis: {
    general: {
      title: 'General Settings',
      icon: Settings2,
      fields: [
        { key: 'title', label: 'Widget Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'icon', label: 'Icon', type: 'select', options: ['default', 'custom'] },
      ]
    },
    display: {
      title: 'Display Options',
      icon: Eye,
      fields: [
        { key: 'showTrend', label: 'Show Trend', type: 'switch', default: true },
        { key: 'showChange', label: 'Show Change %', type: 'switch', default: true },
        { key: 'animate', label: 'Animate Values', type: 'switch', default: true },
        { key: 'variant', label: 'Style Variant', type: 'select', 
          options: [
            { value: 'default', label: 'Default' },
            { value: 'success', label: 'Success (Green)' },
            { value: 'warning', label: 'Warning (Yellow)' },
            { value: 'danger', label: 'Danger (Red)' }
          ]
        },
        { key: 'format', label: 'Value Format', type: 'select',
          options: [
            { value: 'number', label: 'Number' },
            { value: 'currency', label: 'Currency (SAR)' },
            { value: 'percentage', label: 'Percentage' },
            { value: 'compact', label: 'Compact (1.2K)' }
          ]
        }
      ]
    },
    data: {
      title: 'Data Settings',
      icon: Database,
      fields: [
        { key: 'refreshInterval', label: 'Refresh Interval', type: 'select',
          options: [
            { value: '0', label: 'No auto-refresh' },
            { value: '30000', label: '30 seconds' },
            { value: '60000', label: '1 minute' },
            { value: '300000', label: '5 minutes' },
            { value: '900000', label: '15 minutes' }
          ]
        },
        { key: 'dataSource', label: 'Data Source', type: 'select',
          options: [
            { value: 'auto', label: 'Automatic' },
            { value: 'realtime', label: 'Real-time' },
            { value: 'cached', label: 'Cached' }
          ]
        },
        { key: 'threshold', label: 'Alert Threshold', type: 'number', placeholder: 'e.g., 1000' },
        { key: 'comparison', label: 'Comparison Period', type: 'select',
          options: [
            { value: 'day', label: 'Previous Day' },
            { value: 'week', label: 'Previous Week' },
            { value: 'month', label: 'Previous Month' },
            { value: 'year', label: 'Previous Year' }
          ]
        }
      ]
    }
  },
  charts: {
    general: {
      title: 'General Settings',
      icon: Settings2,
      fields: [
        { key: 'title', label: 'Chart Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'height', label: 'Chart Height (px)', type: 'slider', min: 200, max: 600, default: 300 }
      ]
    },
    chart: {
      title: 'Chart Options',
      icon: BarChart3,
      fields: [
        { key: 'chartType', label: 'Chart Type', type: 'select',
          options: Object.entries(CHART_CONFIGS).map(([key, config]) => ({
            value: key,
            label: config.name
          }))
        },
        { key: 'showLegend', label: 'Show Legend', type: 'switch', default: true },
        { key: 'showGrid', label: 'Show Grid', type: 'switch', default: true },
        { key: 'showTooltip', label: 'Show Tooltip', type: 'switch', default: true },
        { key: 'showXAxis', label: 'Show X Axis', type: 'switch', default: true },
        { key: 'showYAxis', label: 'Show Y Axis', type: 'switch', default: true },
        { key: 'animate', label: 'Animate Chart', type: 'switch', default: true },
        { key: 'curved', label: 'Curved Lines', type: 'switch', default: false },
        { key: 'stacked', label: 'Stacked Data', type: 'switch', default: false }
      ]
    },
    style: {
      title: 'Style & Colors',
      icon: Palette,
      fields: [
        { key: 'colorScheme', label: 'Color Scheme', type: 'select',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'blue', label: 'Blue Theme' },
            { value: 'green', label: 'Green Theme' },
            { value: 'purple', label: 'Purple Theme' },
            { value: 'gradient', label: 'Gradient' }
          ]
        },
        { key: 'opacity', label: 'Fill Opacity', type: 'slider', min: 0, max: 100, default: 30 },
        { key: 'strokeWidth', label: 'Line Width', type: 'slider', min: 1, max: 5, default: 2 }
      ]
    },
    data: {
      title: 'Data Settings',
      icon: Database,
      fields: [
        { key: 'refreshInterval', label: 'Refresh Interval', type: 'select',
          options: [
            { value: '0', label: 'No auto-refresh' },
            { value: '30000', label: '30 seconds' },
            { value: '60000', label: '1 minute' },
            { value: '300000', label: '5 minutes' }
          ]
        },
        { key: 'dataPoints', label: 'Max Data Points', type: 'number', placeholder: '50' },
        { key: 'aggregation', label: 'Data Aggregation', type: 'select',
          options: [
            { value: 'none', label: 'None' },
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' }
          ]
        },
        { key: 'filter', label: 'Data Filter', type: 'select',
          options: [
            { value: 'all', label: 'All Data' },
            { value: 'positive', label: 'Positive Values Only' },
            { value: 'negative', label: 'Negative Values Only' },
            { value: 'top10', label: 'Top 10' },
            { value: 'bottom10', label: 'Bottom 10' }
          ]
        }
      ]
    }
  },
  comparisons: {
    general: {
      title: 'General Settings',
      icon: Settings2,
      fields: [
        { key: 'title', label: 'Widget Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' }
      ]
    },
    comparison: {
      title: 'Comparison Options',
      icon: BarChart3,
      fields: [
        { key: 'comparisonType', label: 'Comparison Type', type: 'select',
          options: [
            { value: 'month', label: 'Month over Month' },
            { value: 'quarter', label: 'Quarter over Quarter' },
            { value: 'year', label: 'Year over Year' },
            { value: 'branch', label: 'Branch Comparison' },
            { value: 'product', label: 'Product Comparison' },
            { value: 'custom', label: 'Custom Period' }
          ]
        },
        { key: 'metrics', label: 'Metrics to Compare', type: 'multiselect',
          options: [
            { value: 'revenue', label: 'Revenue' },
            { value: 'transactions', label: 'Transactions' },
            { value: 'customers', label: 'Customers' },
            { value: 'deposits', label: 'Deposits' },
            { value: 'loans', label: 'Loans' }
          ]
        },
        { key: 'showPercentage', label: 'Show Percentage Change', type: 'switch', default: true },
        { key: 'showTrend', label: 'Show Trend Arrows', type: 'switch', default: true },
        { key: 'highlightBest', label: 'Highlight Best Performer', type: 'switch', default: true }
      ]
    }
  },
  status: {
    general: {
      title: 'General Settings',
      icon: Settings2,
      fields: [
        { key: 'title', label: 'Widget Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'maxItems', label: 'Max Items to Show', type: 'number', placeholder: '5' }
      ]
    },
    display: {
      title: 'Display Options',
      icon: Eye,
      fields: [
        { key: 'showTimestamp', label: 'Show Timestamps', type: 'switch', default: true },
        { key: 'showSeverity', label: 'Show Severity', type: 'switch', default: true },
        { key: 'compactMode', label: 'Compact Mode', type: 'switch', default: false },
        { key: 'sortOrder', label: 'Sort Order', type: 'select',
          options: [
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'severity', label: 'By Severity' }
          ]
        }
      ]
    },
    filters: {
      title: 'Filters',
      icon: Filter,
      fields: [
        { key: 'severityFilter', label: 'Severity Filter', type: 'multiselect',
          options: [
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
            { value: 'info', label: 'Info' }
          ]
        },
        { key: 'typeFilter', label: 'Type Filter', type: 'multiselect',
          options: [
            { value: 'error', label: 'Errors' },
            { value: 'warning', label: 'Warnings' },
            { value: 'info', label: 'Information' },
            { value: 'success', label: 'Success' }
          ]
        }
      ]
    }
  }
};

export function WidgetConfigDialog({ widget, isOpen, onClose, onSave }) {
  const [config, setConfig] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (widget) {
      setConfig(widget.config || {});
    }
  }, [widget]);

  if (!widget) return null;

  const configOptions = WIDGET_CONFIG_OPTIONS[widget.category] || WIDGET_CONFIG_OPTIONS.kpis;

  const handleFieldChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(widget.id, config);
    onClose();
  };

  const renderField = (field) => {
    const value = config[field.key] ?? field.default;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Textarea
              id={field.key}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select value={value || ''} onValueChange={(v) => handleFieldChange(field.key, v)}>
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem 
                    key={typeof option === 'string' ? option : option.value} 
                    value={typeof option === 'string' ? option : option.value}
                  >
                    {typeof option === 'string' ? option : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="space-y-2">
              {field.options.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isSelected = selectedValues.includes(optionValue);
                
                return (
                  <label
                    key={optionValue}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFieldChange(field.key, [...selectedValues, optionValue]);
                        } else {
                          handleFieldChange(field.key, selectedValues.filter(v => v !== optionValue));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{optionLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'switch':
        return (
          <div key={field.key} className="flex items-center justify-between space-x-2">
            <Label htmlFor={field.key} className="flex-1">{field.label}</Label>
            <Switch
              id={field.key}
              checked={value ?? field.default}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            />
          </div>
        );

      case 'slider':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key}>{field.label}</Label>
              <span className="text-sm text-muted-foreground">{value || field.default}</span>
            </div>
            <Slider
              id={field.key}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              value={[value || field.default]}
              onValueChange={([v]) => handleFieldChange(field.key, v)}
              className="w-full"
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <RadioGroup
              value={value || field.default}
              onValueChange={(v) => handleFieldChange(field.key, v)}
            >
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configure Widget
          </DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of your widget
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(configOptions).length}, 1fr)` }}>
            {Object.entries(configOptions).map(([key, section]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="overflow-y-auto max-h-[50vh] mt-4">
            {Object.entries(configOptions).map(([key, section]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="space-y-4">
                  {section.fields.map(renderField)}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Sparkles className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Additional UI components that might be needed

// Slider component
export function Slider({ className, ...props }) {
  return (
    <input
      type="range"
      className={cn(
        "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

// RadioGroup components
export function RadioGroup({ children, ...props }) {
  return <div role="radiogroup" {...props}>{children}</div>;
}

export function RadioGroupItem({ value, id, ...props }) {
  return (
    <input
      type="radio"
      value={value}
      id={id}
      className="h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}

// Textarea component
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}