import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  Label,
  LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  LineChartIcon,
  AreaChartIcon,
  TrendingUp,
  TrendingDown,
  Download,
  Maximize2,
  MoreVertical,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

const CHART_COLORS = {
  current: '#6366F1',
  previous: '#8B5CF6',
  target: '#F59E0B',
  average: '#10B981',
  forecast: '#EC4899'
};

const ComparisonChart = ({ 
  data, 
  title, 
  description, 
  comparisonType,
  metrics,
  onExport,
  className 
}) => {
  const [chartType, setChartType] = useState('line');
  const [showTarget, setShowTarget] = useState(true);
  const [showAverage, setShowAverage] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(metrics?.[0] || 'revenue');

  // Calculate insights
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;

    const currentValues = data.map(d => d.current || 0);
    const previousValues = data.map(d => d.previous || 0);
    
    const currentTotal = currentValues.reduce((sum, val) => sum + val, 0);
    const previousTotal = previousValues.reduce((sum, val) => sum + val, 0);
    const growthRate = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;
    
    const avgCurrent = currentTotal / currentValues.length;
    const avgPrevious = previousTotal / previousValues.length;
    
    const maxGrowthPoint = data.reduce((max, point) => {
      const growth = point.previous > 0 ? ((point.current - point.previous) / point.previous * 100) : 0;
      return growth > max.growth ? { period: point.period, growth } : max;
    }, { period: '', growth: -Infinity });

    return {
      totalGrowth: growthRate,
      avgCurrent: avgCurrent.toFixed(0),
      avgPrevious: avgPrevious.toFixed(0),
      trend: growthRate > 0 ? 'up' : 'down',
      bestPeriod: maxGrowthPoint
    };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-medium">{entry.value.toLocaleString()}</span>
            </div>
          ))}
          {payload[0]?.payload?.growth && (
            <div className="mt-2 pt-2 border-t text-sm">
              <span className="text-muted-foreground">Growth: </span>
              <span className={cn(
                "font-medium",
                payload[0].payload.growth > 0 ? "text-green-600" : "text-red-600"
              )}>
                {payload[0].payload.growth > 0 ? '+' : ''}{payload[0].payload.growth}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartProps = {
      data: data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      stroke: '#888',
      fontSize: 12
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.current} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.current} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.previous} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.previous} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="current" 
              stroke={CHART_COLORS.current} 
              fillOpacity={1} 
              fill="url(#colorCurrent)"
              strokeWidth={2}
              name="Current Period"
            />
            <Area 
              type="monotone" 
              dataKey="previous" 
              stroke={CHART_COLORS.previous} 
              fillOpacity={1} 
              fill="url(#colorPrevious)"
              strokeWidth={2}
              name="Previous Period"
            />
            {showTarget && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={CHART_COLORS.target}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target"
                dot={false}
              />
            )}
            {showAverage && insights && (
              <ReferenceLine 
                y={insights.avgCurrent} 
                stroke={CHART_COLORS.average}
                strokeDasharray="3 3"
                label="Average"
              />
            )}
            <Brush dataKey="period" height={30} stroke={CHART_COLORS.current} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="current" 
              fill={CHART_COLORS.current}
              name="Current Period"
              radius={[8, 8, 0, 0]}
            >
              <LabelList dataKey="current" position="top" />
            </Bar>
            <Bar 
              dataKey="previous" 
              fill={CHART_COLORS.previous}
              name="Previous Period"
              radius={[8, 8, 0, 0]}
            />
            {showTarget && (
              <Bar 
                dataKey="target" 
                fill={CHART_COLORS.target}
                name="Target"
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis yAxisId="left" {...commonAxisProps} />
            <YAxis yAxisId="right" orientation="right" {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="current" 
              fill={CHART_COLORS.current}
              name="Current Period"
              radius={[8, 8, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="growth" 
              stroke={CHART_COLORS.target}
              strokeWidth={3}
              name="Growth %"
              dot={{ fill: CHART_COLORS.target, r: 6 }}
            />
          </ComposedChart>
        );

      default: // line chart
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke={CHART_COLORS.current}
              strokeWidth={3}
              name="Current Period"
              dot={{ fill: CHART_COLORS.current, r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke={CHART_COLORS.previous}
              strokeWidth={3}
              name="Previous Period"
              strokeDasharray="5 5"
              dot={{ fill: CHART_COLORS.previous, r: 6 }}
            />
            {showTarget && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={CHART_COLORS.target}
                strokeWidth={2}
                strokeDasharray="10 5"
                name="Target"
                dot={false}
              />
            )}
            {showForecast && (
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke={CHART_COLORS.forecast}
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Forecast"
                dot={{ fill: CHART_COLORS.forecast, r: 4 }}
              />
            )}
            {showAverage && insights && (
              <>
                <ReferenceLine 
                  y={insights.avgCurrent} 
                  stroke={CHART_COLORS.average}
                  strokeDasharray="3 3"
                >
                  <Label value="Current Avg" position="right" />
                </ReferenceLine>
                <ReferenceLine 
                  y={insights.avgPrevious} 
                  stroke={CHART_COLORS.previous}
                  strokeDasharray="3 3"
                >
                  <Label value="Previous Avg" position="right" />
                </ReferenceLine>
              </>
            )}
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Chart Type Selector */}
              <Tabs value={chartType} onValueChange={setChartType}>
                <TabsList className="grid grid-cols-4 h-9">
                  <TabsTrigger value="line" className="px-2">
                    <LineChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="area" className="px-2">
                    <AreaChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="px-2">
                    <BarChart3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="composed" className="px-2">
                    <TrendingUp className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowTarget(!showTarget)}>
                    {showTarget ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showTarget ? 'Hide' : 'Show'} Target Line
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAverage(!showAverage)}>
                    {showAverage ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showAverage ? 'Hide' : 'Show'} Average
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowForecast(!showForecast)}>
                    {showForecast ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showForecast ? 'Hide' : 'Show'} Forecast
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Chart
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Insights Summary */}
          {insights && (
            <div className="flex items-center gap-4 mt-4">
              <Badge variant={insights.trend === 'up' ? 'success' : 'destructive'} className="gap-1">
                {insights.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {insights.totalGrowth}% Overall
              </Badge>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Info className="h-3 w-3 mr-1" />
                    View Insights
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Period Comparison Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average (Current):</span>
                        <span className="font-medium">{insights.avgCurrent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average (Previous):</span>
                        <span className="font-medium">{insights.avgPrevious}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Best Performing:</span>
                        <span className="font-medium">
                          {insights.bestPeriod.period} (+{insights.bestPeriod.growth.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              {metrics && metrics.length > 1 && (
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[150px] h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map(metric => (
                      <SelectItem key={metric} value={metric}>
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ComparisonChart;