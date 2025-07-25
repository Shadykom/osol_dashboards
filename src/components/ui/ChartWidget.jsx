// src/components/widgets/ChartWidget.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import { 
  X,
  Settings,
  MoreVertical,
  RefreshCw,
  Download,
  Maximize2,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';

// Default color palette
const DEFAULT_COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Chart type configurations
export const CHART_CONFIGS = {
  line: {
    name: 'Line Chart',
    description: 'Best for trends over time',
    component: LineChart,
    dataComponent: Line,
    defaultProps: {
      strokeWidth: 2,
      dot: { fill: '#E6B800', strokeWidth: 2 },
      activeDot: { r: 6 }
    }
  },
  area: {
    name: 'Area Chart',
    description: 'Shows trends with volume',
    component: AreaChart,
    dataComponent: Area,
    defaultProps: {
      fillOpacity: 0.3,
      strokeWidth: 2
    }
  },
  bar: {
    name: 'Bar Chart',
    description: 'Compare categories',
    component: BarChart,
    dataComponent: Bar,
    defaultProps: {
      radius: [4, 4, 0, 0]
    }
  },
  pie: {
    name: 'Pie Chart',
    description: 'Show proportions',
    component: PieChart,
    dataComponent: Pie,
    defaultProps: {
      cx: "50%",
      cy: "50%",
      outerRadius: 80,
      labelLine: false
    }
  },
  radial: {
    name: 'Radial Bar',
    description: 'Progress indicators',
    component: RadialBarChart,
    dataComponent: RadialBar,
    defaultProps: {
      cx: "50%",
      cy: "50%",
      innerRadius: "30%",
      outerRadius: "90%",
      cornerRadius: 10
    }
  }
};

export function ChartWidget({
  id,
  title,
  description,
  data = [],
  chartType = 'line',
  xAxisKey = 'name',
  yAxisKey = 'value',
  dataKeys = [],
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  isLoading = false,
  onRemove,
  onConfigure,
  onRefresh,
  onExport,
  onMaximize,
  className,
  animate = true,
  showActions = true,
  customTooltip,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  ...chartProps
}) {
  const chartConfig = CHART_CONFIGS[chartType] || CHART_CONFIGS.line;
  const ChartComponent = chartConfig.component;
  const DataComponent = chartConfig.dataComponent;

  // Default formatters
  const defaultFormatters = {
    currency: (value) => `SAR ${(value / 1000000).toFixed(1)}M`,
    percentage: (value) => `${value}%`,
          number: (value) => formatNumber(value)
  };

  const formatValue = formatTooltip || defaultFormatters.number;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Info className="h-12 w-12 mb-2" />
          <p>No data available</p>
        </div>
      );
    }

    const renderChartContent = () => {
      if (chartType === 'pie') {
        return (
          <ChartComponent>
            <DataComponent
              data={data}
              dataKey={yAxisKey}
              {...chartConfig.defaultProps}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </DataComponent>
            {showTooltip && <RechartsTooltip content={customTooltip || <CustomTooltip />} />}
            {showLegend && <Legend />}
          </ChartComponent>
        );
      }

      if (chartType === 'radial') {
        return (
          <ChartComponent data={data} {...chartConfig.defaultProps}>
            <DataComponent dataKey={yAxisKey} fill="#8884d8" />
            {showTooltip && <RechartsTooltip content={customTooltip || <CustomTooltip />} />}
          </ChartComponent>
        );
      }

      // For line, area, and bar charts
      const dataKeysToRender = dataKeys.length > 0 ? dataKeys : [yAxisKey];

      return (
        <ChartComponent data={data} {...chartProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
          {showXAxis && (
            <XAxis 
              dataKey={xAxisKey} 
              tickFormatter={formatXAxis}
              className="text-xs"
            />
          )}
          {showYAxis && (
            <YAxis 
              tickFormatter={formatYAxis}
              className="text-xs"
            />
          )}
          {showTooltip && <RechartsTooltip content={customTooltip || <CustomTooltip />} />}
          {showLegend && <Legend />}
          
          {dataKeysToRender.map((key, index) => {
            const color = colors[index % colors.length];
            return (
              <DataComponent
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                fill={color}
                {...chartConfig.defaultProps}
              />
            );
          })}
        </ChartComponent>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={height}>
        {renderChartContent()}
      </ResponsiveContainer>
    );
  };

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {showActions && (onRemove || onConfigure || onRefresh || onExport || onMaximize) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Chart Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onMaximize && (
                <DropdownMenuItem onClick={onMaximize}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Fullscreen
                </DropdownMenuItem>
              )}
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
              )}
              {onConfigure && (
                <DropdownMenuItem onClick={onConfigure}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </DropdownMenuItem>
              )}
              {onRemove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {renderChart()}
      </CardContent>
    </>
  );

  return (
    <Card className={cn(
      "relative overflow-hidden group transition-all duration-200 hover:shadow-md",
      className
    )}>
      {animate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {cardContent}
        </motion.div>
      ) : (
        cardContent
      )}
    </Card>
  );
}

// Preset chart configurations for common use cases
export const CHART_PRESETS = {
  revenue: {
    chartType: 'area',
    formatTooltip: (value) => `SAR ${(value / 1000000).toFixed(1)}M`,
    colors: ['#E6B800'],
    showGrid: true
  },
  transactions: {
    chartType: 'line',
          formatTooltip: (value) => formatNumber(value),
    colors: ['#4A5568'],
    showGrid: true
  },
  distribution: {
    chartType: 'pie',
    showGrid: false,
    showXAxis: false,
    showYAxis: false
  },
  comparison: {
    chartType: 'bar',
    showGrid: true,
    colors: ['#68D391', '#F687B3']
  },
  progress: {
    chartType: 'radial',
    showGrid: false,
    showXAxis: false,
    showYAxis: false,
    showLegend: false
  }
};

// Export a helper function to create chart widgets with presets
export function createChartWidget(preset, props) {
  const presetConfig = CHART_PRESETS[preset] || {};
  return <ChartWidget {...presetConfig} {...props} />;
}