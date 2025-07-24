// components/widgets/EnhancedChartWidget.jsx
import { useState, useEffect, useMemo } from 'react';
import { useWidgetData } from '@/hooks/useWidgetData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw, Download, Maximize2, Filter, MoreVertical,
  FileText, FileSpreadsheet, Image, AlertCircle, Settings,
  TrendingUp, Calendar, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush, ComposedChart
} from 'recharts';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Chart components mapping
const CHART_COMPONENTS = {
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
  pie: PieChart,
  scatter: ScatterChart,
  radar: RadarChart,
  composed: ComposedChart
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, format, prefix, suffix }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {prefix}{formatValue(entry.value, format)}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// Format value based on configuration
const formatValue = (value, format) => {
  if (value == null) return 'N/A';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    default:
      return value.toLocaleString();
  }
};

// Custom legend component
const CustomLegend = ({ payload, onClick }) => {
  const [hiddenItems, setHiddenItems] = useState(new Set());

  const handleClick = (dataKey) => {
    const newHidden = new Set(hiddenItems);
    if (newHidden.has(dataKey)) {
      newHidden.delete(dataKey);
    } else {
      newHidden.add(dataKey);
    }
    setHiddenItems(newHidden);
    onClick?.(dataKey, !hiddenItems.has(dataKey));
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload.map((entry, index) => (
        <button
          key={index}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-opacity",
            hiddenItems.has(entry.dataKey) && "opacity-50"
          )}
          onClick={() => handleClick(entry.dataKey)}
        >
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </button>
      ))}
    </div>
  );
};

export function EnhancedChartWidget({ 
  widgetId, 
  config, 
  onConfigure,
  onFullscreen,
  className 
}) {
  const { data, loading, error, lastUpdated, refetch } = useWidgetData(widgetId, config);
  const [hiddenDataKeys, setHiddenDataKeys] = useState(new Set());
  const [selectedTimeRange, setSelectedTimeRange] = useState(config.timeRange);
  const [activeFilters, setActiveFilters] = useState(config.filters || []);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef(null);

  // Process data based on hidden keys
  const processedData = useMemo(() => {
    if (!data) return [];
    
    if (hiddenDataKeys.size === 0) return data;
    
    return data.map(item => {
      const newItem = { ...item };
      hiddenDataKeys.forEach(key => {
        delete newItem[key];
      });
      return newItem;
    });
  }, [data, hiddenDataKeys]);

  // Get data keys for the chart
  const dataKeys = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstItem = data[0];
    return Object.keys(firstItem).filter(key => 
      key !== 'name' && 
      key !== 'category' && 
      key !== 'date' &&
      typeof firstItem[key] === 'number'
    );
  }, [data]);

  // Handle legend item click
  const handleLegendClick = (dataKey, isHidden) => {
    const newHidden = new Set(hiddenDataKeys);
    if (isHidden) {
      newHidden.delete(dataKey);
    } else {
      newHidden.add(dataKey);
    }
    setHiddenDataKeys(newHidden);
  };

  // Export functions
  const exportAsCSV = () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${config.title || 'chart'}-${Date.now()}.csv`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsExcel = () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.title || 'Data');
      XLSX.writeFile(wb, `${config.title || 'chart'}-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    if (!chartRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current);
      canvas.toBlob(blob => {
        saveAs(blob, `${config.title || 'chart'}-${Date.now()}.png`);
      });
    } catch (error) {
      console.error('Error exporting image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Render chart based on type
  const renderChart = () => {
    const ChartComponent = CHART_COMPONENTS[config.chartType] || LineChart;
    const colors = config.colors || {
      primary: '#E6B800',
      secondary: '#4A5568',
      success: '#68D391',
      warning: '#F6AD55',
      danger: '#FC8181'
    };
    const colorArray = Object.values(colors);

    // Common chart props
    const commonProps = {
      data: processedData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    // Render different chart types
    switch (config.chartType) {
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              dataKey={dataKeys[0] || 'value'}
              cx="50%"
              cy="50%"
              innerRadius={config.chartOptions?.donut ? '40%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              label={config.chartOptions?.labels ? ({value, percent}) => 
                `${(percent * 100).toFixed(0)}%` : false
              }
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
              ))}
            </Pie>
            {config.showTooltip && (
              <Tooltip content={<CustomTooltip format={config.format} />} />
            )}
            {config.showLegend && (
              <Legend content={<CustomLegend onClick={handleLegendClick} />} />
            )}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart {...commonProps}>
            <PolarGrid strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
            {dataKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={colorArray[index % colorArray.length]}
                fill={colorArray[index % colorArray.length]}
                fillOpacity={0.3}
                hide={hiddenDataKeys.has(key)}
              />
            ))}
            {config.showTooltip && (
              <Tooltip content={<CustomTooltip format={config.format} />} />
            )}
            {config.showLegend && (
              <Legend content={<CustomLegend onClick={handleLegendClick} />} />
            )}
          </RadarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={config.dimensions?.[0] || 'x'} 
              name={config.axisLabels?.x || 'X Axis'}
            />
            <YAxis 
              dataKey={config.dimensions?.[1] || 'y'} 
              name={config.axisLabels?.y || 'Y Axis'}
            />
            <Scatter
              name={config.title}
              data={processedData}
              fill={colors.primary}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
              ))}
            </Scatter>
            {config.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {config.chartOptions?.regression && (
              <ReferenceLine 
                stroke={colors.secondary} 
                strokeDasharray="5 5"
                label="Trend" 
              />
            )}
          </ScatterChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            {config.chartOptions?.multiAxis && (
              <YAxis yAxisId="right" orientation="right" />
            )}
            {dataKeys.map((key, index) => {
              if (index === 0) {
                return (
                  <Bar
                    key={key}
                    yAxisId="left"
                    dataKey={key}
                    fill={colorArray[index]}
                    hide={hiddenDataKeys.has(key)}
                  />
                );
              } else {
                return (
                  <Line
                    key={key}
                    yAxisId={config.chartOptions?.multiAxis ? 'right' : 'left'}
                    type="monotone"
                    dataKey={key}
                    stroke={colorArray[index % colorArray.length]}
                    strokeWidth={2}
                    hide={hiddenDataKeys.has(key)}
                  />
                );
              }
            })}
            {config.showTooltip && (
              <Tooltip content={<CustomTooltip format={config.format} />} />
            )}
            {config.showLegend && (
              <Legend content={<CustomLegend onClick={handleLegendClick} />} />
            )}
            {data.length > 20 && <Brush dataKey="name" height={30} />}
          </ComposedChart>
        );

      default:
        // Line, Area, Bar charts
        const isArea = config.chartType === 'area';
        const isBar = config.chartType === 'bar';
        
        return (
          <ChartComponent {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="name" 
              angle={isBar && data.length > 10 ? -45 : 0}
              textAnchor={isBar && data.length > 10 ? "end" : "middle"}
              height={isBar && data.length > 10 ? 80 : 60}
            />
            <YAxis />
            {dataKeys.map((key, index) => {
              const props = {
                key: key,
                dataKey: key,
                name: key,
                hide: hiddenDataKeys.has(key)
              };

              if (isArea) {
                return (
                  <Area
                    {...props}
                    type={config.chartOptions?.smooth ? 'monotone' : 'linear'}
                    stroke={colorArray[index % colorArray.length]}
                    fill={colorArray[index % colorArray.length]}
                    fillOpacity={0.3}
                    stackId={config.chartOptions?.stacked ? 'stack' : undefined}
                  />
                );
              } else if (isBar) {
                return (
                  <Bar
                    {...props}
                    fill={colorArray[index % colorArray.length]}
                    stackId={config.chartOptions?.stacked ? 'stack' : undefined}
                    radius={config.chartOptions?.rounded ? [8, 8, 0, 0] : 0}
                  />
                );
              } else {
                return (
                  <Line
                    {...props}
                    type={config.chartOptions?.smooth ? 'monotone' : 'linear'}
                    stroke={colorArray[index % colorArray.length]}
                    strokeWidth={2}
                    dot={config.chartOptions?.points}
                    activeDot={{ r: 6 }}
                  />
                );
              }
            })}
            {config.showTooltip && (
              <Tooltip 
                content={
                  <CustomTooltip 
                    format={config.format}
                    prefix={config.prefix}
                    suffix={config.suffix}
                  />
                } 
              />
            )}
            {config.showLegend && (
              <Legend 
                content={<CustomLegend onClick={handleLegendClick} />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}
            {/* Add reference lines for thresholds */}
            {config.thresholds?.map((threshold, index) => (
              <ReferenceLine
                key={index}
                y={threshold.value}
                stroke={threshold.color}
                strokeDasharray="5 5"
                label={{
                  value: threshold.name,
                  position: "right",
                  fill: threshold.color
                }}
              />
            ))}
            {/* Add brush for large datasets */}
            {data.length > 20 && (
              <Brush 
                dataKey="name" 
                height={30} 
                stroke={colors.primary}
              />
            )}
          </ChartComponent>
        );
    }
  };

  if (loading && !data) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={refetch}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)} ref={chartRef}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {config.title}
              {loading && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            {config.subtitle && (
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Time range selector */}
            {config.timeRange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="text-xs">{selectedTimeRange}</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56">
                  <div className="space-y-1">
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(range => (
                      <Button
                        key={range}
                        variant={selectedTimeRange === range ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedTimeRange(range)}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Filter indicator */}
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                {activeFilters.length} filters
              </Badge>
            )}

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                
                {onConfigure && (
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                )}
                
                {onFullscreen && (
                  <DropdownMenuItem onClick={onFullscreen}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {config.exportEnabled && (
                  <>
                    <DropdownMenuItem onClick={exportAsCSV} disabled={isExporting}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsExcel} disabled={isExporting}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsImage} disabled={isExporting}>
                      <Image className="h-4 w-4 mr-2" />
                      Export as Image
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Additional info */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
            )}
            {data && (
              <span>{data.length} data points</span>
            )}
          </div>
          
          {/* Data summary */}
          {dataKeys.length > 0 && config.showSummary && (
            <div className="flex items-center gap-3">
              {dataKeys.slice(0, 2).map(key => {
                const values = data.map(d => d[key]).filter(v => v != null);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                return (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-muted-foreground">Avg {key}:</span>
                    <span className="font-medium">
                      {formatValue(avg, config.format)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}