import { BaseWidget } from './BaseWidget';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CHART_COLORS = [
  '#E6B800', // Osol primary gold
  '#4A5568', // Osol secondary dark
  '#68D391', // Green
  '#63B3ED', // Blue
  '#F687B3', // Pink
  '#FBB6CE', // Light pink
  '#9F7AEA', // Purple
  '#F6AD55', // Orange
];

export function ChartWidget({
  id,
  title,
  description,
  data = [],
  chartType = 'line',
  xAxisKey = 'name',
  yAxisKey = 'value',
  isLoading = false,
  error = null,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  clickable = true,
  multiLine = null,
  colors = null,
  ...props
}) {
  const navigate = useNavigate();
  
  // Use custom colors if provided, otherwise use default colors
  const chartColors = colors || CHART_COLORS;
  
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={chartColors[0]}
              fill={chartColors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={chartColors[0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {multiLine && multiLine.length > 0 ? (
              multiLine.map((lineKey, index) => (
                <Line
                  key={lineKey}
                  type="monotone"
                  dataKey={lineKey}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                  dot={{ fill: chartColors[index % chartColors.length] }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ fill: chartColors[0] }}
              />
            )}
          </LineChart>
        );
    }
  };

  const handleClick = () => {
    if (clickable && id) {
      // Extract the type from the widget ID
      const widgetType = id.split('_')[0];
      navigate(`/dashboard/detail/${widgetType}/${id}`);
    }
  };

  return (
    <BaseWidget
      id={id}
      title={title}
      description={description}
      isLoading={isLoading}
      error={error}
      className={clickable ? "min-h-[400px] cursor-pointer hover:shadow-lg transition-shadow" : "min-h-[400px]"}
      onClick={handleClick}
      {...props}
    >
      <div style={{ height: height }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No data available</p>
              <p className="text-xs text-muted-foreground">
                Data will appear here when available
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

// Predefined chart configurations for common use cases
export const CHART_CONFIGS = {
  transactionTrend: {
    chartType: 'line',
    title: 'Transaction Trend',
    description: 'Daily transaction volume over time',
    xAxisKey: 'date',
    yAxisKey: 'count',
    showGrid: true,
    showTooltip: true
  },
  
  accountBalance: {
    chartType: 'area',
    title: 'Account Balance Trend',
    description: 'Total account balances over time',
    xAxisKey: 'date',
    yAxisKey: 'balance',
    showGrid: true,
    showTooltip: true
  },
  
  customerSegments: {
    chartType: 'pie',
    title: 'Customer Segments',
    description: 'Distribution of customers by segment',
    xAxisKey: 'segment',
    yAxisKey: 'count',
    showTooltip: true,
    showLegend: true
  },
  
  monthlyRevenue: {
    chartType: 'bar',
    title: 'Monthly Revenue',
    description: 'Revenue by month',
    xAxisKey: 'month',
    yAxisKey: 'revenue',
    showGrid: true,
    showTooltip: true
  }
};

