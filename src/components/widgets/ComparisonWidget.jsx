// src/components/widgets/ComparisonWidget.jsx
import { BaseWidget } from './BaseWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Calendar, GitBranch, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';

export function ComparisonWidget({
  id,
  title,
  description,
  comparisonType = 'month',
  data = {},
  isLoading = false,
  error = null,
  onRefresh,
  onConfigure,
  onRemove,
  ...props
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!data || !data.monthlyComparison) return null;

    const current = data.monthlyComparison.current_month;
    const previous = data.monthlyComparison.previous_month;

    // Add null checks for current and previous
    if (!current || !previous) return null;

    return {
      revenue: {
        current: current.revenue || 0,
        previous: previous.revenue || 0,
        change: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1) : '0',
        trend: current.revenue > previous.revenue ? 'up' : 'down'
      },
      customers: {
        current: current.customers || 0,
        previous: previous.customers || 0,
        change: previous.customers ? ((current.customers - previous.customers) / previous.customers * 100).toFixed(1) : '0',
        trend: current.customers > previous.customers ? 'up' : 'down'
      },
      transactions: {
        current: current.transactions || 0,
        previous: previous.transactions || 0,
        change: previous.transactions ? ((current.transactions - previous.transactions) / previous.transactions * 100).toFixed(1) : '0',
        trend: current.transactions > previous.transactions ? 'up' : 'down'
      },
      deposits: {
        current: current.deposits || 0,
        previous: previous.deposits || 0,
        change: previous.deposits ? ((current.deposits - previous.deposits) / previous.deposits * 100).toFixed(1) : '0',
        trend: current.deposits > previous.deposits ? 'up' : 'down'
      }
    };
  }, [data]);

  const renderMonthComparison = () => {
    if (!comparisonMetrics) return <p className="text-muted-foreground">No data available</p>;

    const trendData = data.monthlyComparison?.trends || [];

    return (
      <div className="space-y-4">
        {/* Metric Selector */}
        <div className="flex items-center justify-between">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
              <SelectItem value="deposits">Deposits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Month</p>
                <p className="text-2xl font-bold">
                  {selectedMetric === 'revenue' && `SAR ${(comparisonMetrics.revenue.current / 1000000).toFixed(1)}M`}
                  {selectedMetric === 'customers' && comparisonMetrics.customers.current.toLocaleString()}
                  {selectedMetric === 'transactions' && comparisonMetrics.transactions.current.toLocaleString()}
                  {selectedMetric === 'deposits' && `SAR ${(comparisonMetrics.deposits.current / 1000000000).toFixed(1)}B`}
                </p>
                <div className="flex items-center gap-2">
                  {comparisonMetrics[selectedMetric].trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={comparisonMetrics[selectedMetric].trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {comparisonMetrics[selectedMetric].change}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Previous Month</p>
                <p className="text-2xl font-bold">
                  {selectedMetric === 'revenue' && `SAR ${(comparisonMetrics.revenue.previous / 1000000).toFixed(1)}M`}
                  {selectedMetric === 'customers' && comparisonMetrics.customers.previous.toLocaleString()}
                  {selectedMetric === 'transactions' && comparisonMetrics.transactions.previous.toLocaleString()}
                  {selectedMetric === 'deposits' && `SAR ${(comparisonMetrics.deposits.previous / 1000000000).toFixed(1)}B`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#E6B800" 
                strokeWidth={2}
                dot={{ fill: '#E6B800' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBranchComparison = () => {
    const branches = data.branchComparison?.branches || [];

    return (
      <div className="space-y-4">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#E6B800" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Top Performers */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Top Performers</p>
              {branches.slice(0, 3).map((branch, index) => (
                <div key={branch.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm">{branch.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    SAR {((branch.revenue || 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#4A5568" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={branches}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Efficiency" 
                    dataKey="efficiency" 
                    stroke="#68D391" 
                    fill="#68D391" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderYearComparison = () => {
    // Mock year-over-year data
    const yearData = [
      { metric: 'Revenue', current: 542.4, previous: 456.8, change: 18.7 },
      { metric: 'Customers', current: 12847, previous: 10250, change: 25.3 },
      { metric: 'Accounts', current: 18293, previous: 15600, change: 17.3 },
      { metric: 'Loans', current: 1800, previous: 1420, change: 26.8 },
      { metric: 'Deposits', current: 2400, previous: 1980, change: 21.2 }
    ];

    return (
      <div className="space-y-4">
        <div className="grid gap-3">
          {yearData.map((item) => (
            <div key={item.metric} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{item.metric}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    2024: {item.metric === 'Revenue' ? `SAR ${item.previous}M` : item.previous.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium">
                    2025: {item.metric === 'Revenue' ? `SAR ${item.current}M` : item.current.toLocaleString()}
                  </span>
                </div>
              </div>
              <Badge variant={item.change > 0 ? "default" : "destructive"}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {item.change > 0 ? '+' : ''}{item.change}%
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      id={id}
      title={title}
      description={description}
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      onRemove={onRemove}
      {...props}
    >
      <div className="w-full">
        {comparisonType === 'month' && renderMonthComparison()}
        {comparisonType === 'branch' && renderBranchComparison()}
        {comparisonType === 'year' && renderYearComparison()}
      </div>
    </BaseWidget>
  );
}
