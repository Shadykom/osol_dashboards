// Detailed widget page
//
// Displays a breakdown, trends and raw data view for an individual widget.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download, RefreshCw, Printer, DollarSign, CreditCard, TrendingUp, TrendingDown, Activity, Users, BarChart3, PieChart } from 'lucide-react';
import { enhancedDashboardDetailsService } from '../services/enhancedDashboardDetailsService';
import { useFilters } from '../contexts/FilterContext';
import { ChartWidget } from '../components/widgets/ChartWidget';
import { cn } from '../lib/utils';

// Stat Card Component
const StatCard = ({ title, value, change, trend, description, icon: Icon }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : null}
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
            )}>
              {change}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Breakdown Card Component
const BreakdownCard = ({ title, data, type = 'pie' }) => {
  const total = Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  
  // Transform data for charts
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value: typeof value === 'number' ? value : 0,
    percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'pie' ? (
          <ChartWidget
            data={chartData}
            chartType="pie"
            dataKey="value"
            height={250}
            showLegend={true}
          />
        ) : type === 'bar' ? (
          <ChartWidget
            data={chartData}
            chartType="bar"
            xAxisKey="name"
            yAxisKey="value"
            height={250}
            showLegend={false}
          />
        ) : (
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    SAR {(item.value / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Data Table Component for Raw Data
const DataTable = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((col, index) => (
              <th key={index} className="text-left p-2 font-medium text-sm">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-muted/50">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="p-2 text-sm">
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DashboardDetailNew = () => {
  const { section, widgetId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailData, setDetailData] = useState({
    overview: null,
    breakdown: null,
    trends: null,
    raw: null,
    metadata: { title: 'total_assets' }
  });
  const [loading, setLoading] = useState(true);

  // Fetch data on mount or when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await enhancedDashboardDetailsService.getWidgetDetails(
          section,
          widgetId,
          filters
        );
        if (result.success) {
          setDetailData(result.data);
        }
      } catch (error) {
        console.error('Error fetching widget details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [section, widgetId, filters]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format = 'csv') => {
    const result = await enhancedDashboardDetailsService.exportWidgetData(
      section,
      widgetId,
      format,
      filters
    );
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await enhancedDashboardDetailsService.getWidgetDetails(
        section,
        widgetId,
        filters
      );
      if (result.success) {
        setDetailData(result.data);
      }
    } catch (error) {
      console.error('Error fetching widget details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `SAR ${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `SAR ${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `SAR ${(value / 1000).toFixed(0)}K`;
    }
    return `SAR ${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{detailData.metadata?.title || widgetId}</h1>
            <p className="text-sm text-muted-foreground">
              Detailed analytics and insights for {section} section
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.overview ? (
            <>
              {/* Dynamic Overview based on widget type */}
              {detailData.overview.widgetType === 'kpi' ? (
                // KPI Widget Overview
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <StatCard
                    title={detailData.metadata?.title || widgetId}
                    value={
                      typeof detailData.overview.value === 'number' && detailData.overview.value >= 1000000
                        ? formatCurrency(detailData.overview.value)
                        : (detailData.overview.value || 0).toLocaleString() + (detailData.overview.suffix || '')
                    }
                    change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${detailData.overview.change.toFixed(1)}%` : null}
                    trend={detailData.overview.trend}
                    description={`${section} metrics`}
                    icon={DollarSign}
                  />
                  {/* Additional context cards if available */}
                  {detailData.overview.totalAssets && (
                    <>
                      <StatCard
                        title="Total Deposits"
                        value={formatCurrency(detailData.overview.totalDeposits || 0)}
                        description={`${detailData.overview.depositRatio || 0}% of total assets`}
                        icon={CreditCard}
                      />
                      <StatCard
                        title="Total Loans"
                        value={formatCurrency(detailData.overview.totalLoans || 0)}
                        description={`${detailData.overview.loanRatio || 0}% of total assets`}
                        icon={TrendingUp}
                      />
                    </>
                  )}
                </div>
              ) : detailData.overview.widgetType === 'chart' ? (
                // Chart Widget Overview
                <Card>
                  <CardHeader>
                    <CardTitle>{detailData.metadata?.title || widgetId}</CardTitle>
                    <CardDescription>Chart visualization and metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {detailData.overview.data ? (
                      <ChartWidget
                        data={detailData.overview.data}
                        chartType={detailData.overview.chartType || 'line'}
                        height={300}
                        showLegend={true}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No chart data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Fallback for specific widgets (like total_assets)
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Total Assets"
                      value={formatCurrency(detailData.overview.totalAssets || 0)}
                      change={detailData.overview.change ? `${detailData.overview.change > 0 ? '+' : ''}${detailData.overview.change.toFixed(1)}%` : null}
                      trend={detailData.overview.trend}
                      description="Combined deposits and loans"
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Total Deposits"
                      value={formatCurrency(detailData.overview.totalDeposits || 0)}
                      description={`${detailData.overview.depositRatio || 0}% of total assets`}
                      icon={CreditCard}
                    />
                    <StatCard
                      title="Total Loans"
                      value={formatCurrency(detailData.overview.totalLoans || 0)}
                      description={`${detailData.overview.loanRatio || 0}% of total assets`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Account Count"
                      value={(detailData.overview.accountCount || 0).toLocaleString()}
                      description="Total number of accounts"
                      icon={Users}
                    />
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Loan Count"
                      value={(detailData.overview.loanCount || 0).toLocaleString()}
                      description="Total number of loans"
                      icon={Activity}
                    />
                    <StatCard
                      title="Average Account Balance"
                      value={formatCurrency(detailData.overview.avgAccountBalance || 0)}
                      description="Per account average"
                      icon={BarChart3}
                    />
                    <StatCard
                      title="Average Loan Balance"
                      value={formatCurrency(detailData.overview.avgLoanBalance || 0)}
                      description="Per loan average"
                      icon={PieChart}
                    />
                  </div>
                </>
              )}

              {/* Asset Composition Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Composition</CardTitle>
                  <CardDescription>Breakdown of total assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartWidget
                    data={[
                      { name: 'Deposits', value: detailData.overview.totalDeposits || 0 },
                      { name: 'Loans', value: detailData.overview.totalLoans || 0 }
                    ]}
                    chartType="pie"
                    yAxisKey="value"
                    height={300}
                    showLegend={true}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No overview data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.breakdown ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {detailData.breakdown.byCategory && (
                      <BreakdownCard 
                        title="By Category" 
                        data={detailData.breakdown.byCategory} 
                        type="pie"
                      />
                    )}
                    {detailData.breakdown.byProductType && (
                      <BreakdownCard 
                        title="By Product Type" 
                        data={detailData.breakdown.byProductType} 
                        type="bar"
                      />
                    )}
                    {detailData.breakdown.byBranch && (
                      <BreakdownCard 
                        title="By Branch" 
                        data={detailData.breakdown.byBranch} 
                        type="list"
                      />
                    )}
                    {detailData.breakdown.byAccountType && (
                      <BreakdownCard 
                        title="By Account Type" 
                        data={detailData.breakdown.byAccountType} 
                        type="pie"
                      />
                    )}
                    {detailData.breakdown.byCurrency && (
                      <BreakdownCard 
                        title="By Currency" 
                        data={detailData.breakdown.byCurrency} 
                        type="bar"
                      />
                    )}
                    {detailData.breakdown.byStatus && (
                      <BreakdownCard 
                        title="By Status" 
                        data={detailData.breakdown.byStatus} 
                        type="pie"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No breakdown data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.trends ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Historical Trends</CardTitle>
                  <CardDescription>Asset growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {detailData.trends.dates && detailData.trends.totalAssets ? (
                    <ChartWidget
                      data={detailData.trends.dates.map((date, index) => ({
                        date: date,
                        'Total Assets': detailData.trends.totalAssets[index] || 0,
                        'Deposits': detailData.trends.deposits[index] || 0,
                        'Loans': detailData.trends.loans[index] || 0
                      }))}
                      chartType="line"
                      xAxisKey="date"
                      yAxisKey="Total Assets"
                      height={400}
                      showLegend={true}
                      multiLine={['Total Assets', 'Deposits', 'Loans']}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No trend data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Growth Rate Chart */}
              {detailData.trends.growthRates && (
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Rate Trends</CardTitle>
                    <CardDescription>Month-over-month growth percentages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartWidget
                      data={detailData.trends.dates.map((date, index) => ({
                        date: date,
                        'Growth Rate': detailData.trends.growthRates[index] || 0
                      }))}
                      chartType="bar"
                      xAxisKey="date"
                      yAxisKey="Growth Rate"
                      height={300}
                      showLegend={false}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No trends data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData.raw ? (
            <Card>
              <CardHeader>
                <CardTitle>Raw Data</CardTitle>
                <CardDescription>Detailed asset information</CardDescription>
              </CardHeader>
              <CardContent>
                {detailData.raw.accounts && detailData.raw.accounts.length > 0 ? (
                  <>
                    <h3 className="font-medium mb-2">Top Accounts</h3>
                    <DataTable
                      data={detailData.raw.accounts.slice(0, 10)}
                      columns={[
                        { header: 'Account Number', accessor: (row) => row.account_number },
                        { header: 'Type', accessor: (row) => row.account_type },
                        { header: 'Balance', accessor: (row) => formatCurrency(row.current_balance || 0) },
                        { header: 'Status', accessor: (row) => row.status },
                        { header: 'Created', accessor: (row) => new Date(row.created_at).toLocaleDateString() }
                      ]}
                    />
                  </>
                ) : null}

                {detailData.raw.loans && detailData.raw.loans.length > 0 ? (
                  <>
                    <h3 className="font-medium mb-2 mt-6">Top Loans</h3>
                    <DataTable
                      data={detailData.raw.loans.slice(0, 10)}
                      columns={[
                        { header: 'Loan ID', accessor: (row) => row.loan_id },
                        { header: 'Type', accessor: (row) => row.loan_type },
                        { header: 'Outstanding', accessor: (row) => formatCurrency(row.outstanding_balance || 0) },
                        { header: 'Status', accessor: (row) => row.status },
                        { header: 'Created', accessor: (row) => new Date(row.created_at).toLocaleDateString() }
                      ]}
                    />
                  </>
                ) : null}

                {/* Summary Statistics */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Summary</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify({
                      totalAccounts: detailData.raw.totalAccounts,
                      totalLoans: detailData.raw.totalLoans,
                      lastUpdated: detailData.raw.lastUpdated
                    }, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No raw data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardDetailNew;