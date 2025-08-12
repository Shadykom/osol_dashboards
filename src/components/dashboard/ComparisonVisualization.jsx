import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ScatterChart, Scatter, Treemap, Sankey,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Brush, LabelList, RadialBarChart, RadialBar
} from 'recharts';
import { 
  BarChart3, 
  LineChartIcon, 
  PieChartIcon, 
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  GitBranch,
  Sparkles,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  Share2,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

const formatNumber = (value, decimals = 0) => {
  if (value == null) return '-';
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return new Intl.NumberFormat().format(value);
};

const formatPercentage = (value, decimals = 1) => {
  if (value == null) return '-';
  return `${value.toFixed(decimals)}%`;
};

export function ComparisonVisualization({ 
  data, 
  type = 'comparison',
  title,
  description,
  className 
}) {
  const [selectedView, setSelectedView] = useState('trend');
  const [chartType, setChartType] = useState('line');
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const viewOptions = [
    { id: 'trend', label: 'Trend Analysis', icon: LineChartIcon },
    { id: 'comparison', label: 'Side by Side', icon: BarChart3 },
    { id: 'distribution', label: 'Distribution', icon: PieChartIcon },
    { id: 'correlation', label: 'Correlation', icon: GitBranch },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'heatmap', label: 'Heat Map', icon: Layers }
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-medium">
              {typeof entry.value === 'number' ? formatNumber(entry.value, 1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render trend view
  const renderTrendView = () => {
    if (!data || data.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="composed">Combined</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDataLabels(!showDataLabels)}
            >
              {showDataLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Labels
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Layers className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
            >
              <Settings2 className="h-4 w-4" />
              Legend
            </Button>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' && (
              <LineChart data={data}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Line 
                  type="monotone" 
                  dataKey="value1" 
                  stroke={CHART_COLORS[0]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 1"
                >
                  {showDataLabels && <LabelList position="top" formatter={formatNumber} />}
                </Line>
                <Line 
                  type="monotone" 
                  dataKey="value2" 
                  stroke={CHART_COLORS[1]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 2"
                >
                  {showDataLabels && <LabelList position="top" formatter={formatNumber} />}
                </Line>
              </LineChart>
            )}

            {chartType === 'area' && (
              <AreaChart data={data}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Area 
                  type="monotone" 
                  dataKey="value1" 
                  stackId="1"
                  stroke={CHART_COLORS[0]} 
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.6}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 1"
                />
                <Area 
                  type="monotone" 
                  dataKey="value2" 
                  stackId="2"
                  stroke={CHART_COLORS[1]} 
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.6}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 2"
                />
              </AreaChart>
            )}

            {chartType === 'bar' && (
              <BarChart data={data}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Bar 
                  dataKey="value1" 
                  fill={CHART_COLORS[0]}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 1"
                  radius={[4, 4, 0, 0]}
                >
                  {showDataLabels && <LabelList position="top" formatter={formatNumber} />}
                </Bar>
                <Bar 
                  dataKey="value2" 
                  fill={CHART_COLORS[1]}
                  animationDuration={animationEnabled ? 1000 : 0}
                  name="Period 2"
                  radius={[4, 4, 0, 0]}
                >
                  {showDataLabels && <LabelList position="top" formatter={formatNumber} />}
                </Bar>
              </BarChart>
            )}

            {chartType === 'composed' && (
              <ComposedChart data={data}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                <Bar 
                  yAxisId="left"
                  dataKey="value1" 
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.8}
                  name="Period 1"
                />
                <Bar 
                  yAxisId="left"
                  dataKey="value2" 
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.8}
                  name="Period 2"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="change" 
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  name="Change %"
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render distribution view
  const renderDistributionView = () => {
    if (!data || data.length === 0) return null;

    const pieData = data.slice(0, 8).map((item, index) => ({
      name: item.category || item.period,
      value: item.value2 || item.value1 || 0,
      percentage: ((item.value2 || item.value1 || 0) / data.reduce((sum, d) => sum + (d.value2 || d.value1 || 0), 0)) * 100
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationDuration={animationEnabled ? 1000 : 0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={pieData}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
                animationDuration={animationEnabled ? 1000 : 0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </RadialBar>
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render performance view
  const renderPerformanceView = () => {
    if (!data || data.length === 0) return null;

    const performanceData = data.map(item => ({
      ...item,
      performance: ((item.value2 - item.value1) / item.value1) * 100,
      isPositive: item.value2 > item.value1
    }));

    return (
      <div className="space-y-6">
        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Growth</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(
                      performanceData.reduce((sum, d) => sum + d.performance, 0) / performanceData.length
                    )}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Performance</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(Math.max(...performanceData.map(d => d.performance)))}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Worst Performance</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(Math.min(...performanceData.map(d => d.performance)))}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Positive Periods</p>
                  <p className="text-2xl font-bold">
                    {performanceData.filter(d => d.isPositive).length} / {performanceData.length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" />
              <Bar dataKey="performance" name="Performance %">
                {performanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isPositive ? CHART_COLORS[1] : CHART_COLORS[3]} 
                  />
                ))}
                {showDataLabels && (
                  <LabelList 
                    position="top" 
                    formatter={(value) => `${value.toFixed(1)}%`} 
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render heatmap view
  const renderHeatmapView = () => {
    if (!data || data.length === 0) return null;

    const heatmapData = data.map(item => ({
      ...item,
      intensity: ((item.value2 || 0) / Math.max(...data.map(d => d.value2 || 0))) * 100
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {heatmapData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-lg border"
              style={{
                background: `linear-gradient(to right, transparent, ${CHART_COLORS[0]}${Math.round(item.intensity * 2.55).toString(16).padStart(2, '0')})`
              }}
            >
              <span className="text-sm font-medium w-32">{item.period}</span>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 h-8 bg-muted rounded-md relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.intensity}%` }}
                    transition={{ duration: 1, delay: index * 0.05 }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {formatNumber(item.value2 || 0)}
                </span>
                <Badge variant={item.value2 > item.value1 ? "success" : "destructive"}>
                  {item.value2 > item.value1 ? '+' : ''}{formatPercentage(((item.value2 - item.value1) / item.value1) * 100)}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid grid-cols-6 mb-6">
            {viewOptions.map(option => {
              const Icon = option.icon;
              return (
                <TabsTrigger key={option.id} value={option.id} className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{option.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="trend">
            {renderTrendView()}
          </TabsContent>

          <TabsContent value="comparison">
            {renderTrendView()}
          </TabsContent>

          <TabsContent value="distribution">
            {renderDistributionView()}
          </TabsContent>

          <TabsContent value="correlation">
            {renderTrendView()}
          </TabsContent>

          <TabsContent value="performance">
            {renderPerformanceView()}
          </TabsContent>

          <TabsContent value="heatmap">
            {renderHeatmapView()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}