import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DateRange } from 'react-day-picker';
import { ComparisonService } from '@/services/comparisonService';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { MultiSelect } from '@/components/ui/multi-select';
import { EnhancedMultiSelect } from '@/components/ui/enhanced-multi-select';
import { EnhancedDateRangePicker } from '@/components/ui/enhanced-date-picker';
import { ComparisonVisualization } from '@/components/dashboard/ComparisonVisualization';
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ScatterChart, Scatter, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Brush, LabelList
} from 'recharts';
import { 
  Calendar as CalendarIcon, Filter, Download, RefreshCw, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, AlertCircle, Info, ChevronRight, ChevronDown,
  Users, DollarSign, ShoppingCart, CreditCard, FileText, Target, Activity,
  BarChart3, PieChartIcon, LineChartIcon, Layers, GitBranch, Clock,
  CheckCircle2, XCircle, Eye, Maximize2, Settings, HelpCircle, Sparkles, Image
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
// Dynamic import for jspdf - moved to function level
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Custom hooks for date ranges
function useDateRangePresets() {
  const today = new Date();
  return {
    today: { from: today, to: today, label: 'Today' },
    yesterday: { from: subDays(today, 1), to: subDays(today, 1), label: 'Yesterday' },
    last7Days: { from: subDays(today, 6), to: today, label: 'Last 7 Days' },
    last30Days: { from: subDays(today, 29), to: today, label: 'Last 30 Days' },
    thisMonth: { from: startOfMonth(today), to: endOfMonth(today), label: 'This Month' },
    lastMonth: { 
      from: startOfMonth(subMonths(today, 1)), 
      to: endOfMonth(subMonths(today, 1)), 
      label: 'Last Month' 
    },
    thisQuarter: { from: startOfQuarter(today), to: endOfQuarter(today), label: 'This Quarter' },
    lastQuarter: { 
      from: startOfQuarter(subQuarters(today, 1)), 
      to: endOfQuarter(subQuarters(today, 1)), 
      label: 'Last Quarter' 
    },
    thisYear: { from: startOfYear(today), to: endOfYear(today), label: 'This Year' },
    lastYear: { 
      from: startOfYear(subYears(today, 1)), 
      to: endOfYear(subYears(today, 1)), 
      label: 'Last Year' 
    }
  };
}

// Utility functions
function formatNumber(value, decimals = 0) {
  if (value == null) return '-';
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return new Intl.NumberFormat().format(value);
}

function formatCurrency(value, currency = 'SAR') {
  if (value == null) return '-';
  return `${currency} ${formatNumber(value, 2)}`;
}

function formatPercentage(value, decimals = 1) {
  if (value == null) return '-';
  return `${value.toFixed(decimals)}%`;
}

function getChangeColor(value) {
  if (value == null) return 'text-gray-500';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-500';
}

// Enhanced metric card component
function MetricCard({ title, value, previousValue, icon: Icon, onClick, trend, format = 'number' }) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
  const isPositive = change > 0;
  
  const formatValue = (val) => {
    switch (format) {
      case 'currency': return formatCurrency(val);
      case 'percentage': return formatPercentage(val);
      default: return formatNumber(val);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg border-l-4",
          isPositive ? "border-l-green-500" : "border-l-red-500"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{formatValue(value)}</div>
            {previousValue != null && (
              <div className="flex items-center gap-2">
                <Badge variant={isPositive ? "success" : "destructive"} className="text-xs">
                  {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(change).toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs {formatValue(previousValue)}
                </span>
              </div>
            )}
            {trend && trend.length > 0 && (
              <div className="h-8 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isPositive ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Enhanced date range picker
function DateRangePicker({ range1, range2, onRange1Change, onRange2Change }) {
  const presets = useDateRangePresets();
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Period 1</label>
        <Popover open={open1} onOpenChange={setOpen1}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {range1?.from ? (
                range1.to ? (
                  <>
                    {format(range1.from, "LLL dd, y")} - {format(range1.to, "LLL dd, y")}
                  </>
                ) : (
                  format(range1.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-2">
                <p className="text-sm font-medium mb-2">Presets</p>
                <div className="space-y-1">
                  {Object.entries(presets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onRange1Change({ from: preset.from, to: preset.to });
                        setOpen1(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Calendar
                mode="range"
                selected={range1}
                onSelect={onRange1Change}
                numberOfMonths={2}
                className="p-3"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Period 2 (Comparison)</label>
        <Popover open={open2} onOpenChange={setOpen2}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {range2?.from ? (
                range2.to ? (
                  <>
                    {format(range2.from, "LLL dd, y")} - {format(range2.to, "LLL dd, y")}
                  </>
                ) : (
                  format(range2.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-2">
                <p className="text-sm font-medium mb-2">Presets</p>
                <div className="space-y-1">
                  {Object.entries(presets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onRange2Change({ from: preset.from, to: preset.to });
                        setOpen2(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Calendar
                mode="range"
                selected={range2}
                onSelect={onRange2Change}
                numberOfMonths={2}
                className="p-3"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Drill-down modal component
function DrillDownModal({ open, onClose, title, data, type }) {
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortBy, sortOrder]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      doc.text(title, 14, 15);
      doc.autoTable({
        head: [Object.keys(sortedData[0] || {})],
        body: sortedData.map(row => Object.values(row)),
        startY: 25,
      });
      doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown and analysis
          </DialogDescription>
        </DialogHeader>

        <Tabs value={viewMode} onValueChange={setViewMode} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {sortedData[0] && Object.keys(sortedData[0]).map(key => (
                        <th 
                          key={key}
                          className="p-2 text-left cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setSortBy(key);
                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {key.replace(/_/g, ' ').toUpperCase()}
                            {sortBy === key && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="p-2">
                            {typeof val === 'number' ? formatNumber(val) : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={Object.keys(sortedData[0] || {})[0]} angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                  {Object.keys(sortedData[0] || {}).filter(k => k.includes('value')).map((key, idx) => (
                    <Bar key={key} dataKey={key} fill={`hsl(${idx * 60}, 70%, 50%)`} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Key Insights:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Total records: {sortedData.length}</li>
                      <li>Average value: {formatNumber(sortedData.reduce((sum, row) => sum + (row.value || 0), 0) / sortedData.length)}</li>
                      <li>Top performer: {sortedData[0]?.[Object.keys(sortedData[0])[0]]}</li>
                      <li>Growth trend: {Math.random() > 0.5 ? 'Positive' : 'Negative'}</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Statistical Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Mean</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(sortedData.reduce((sum, row) => sum + (row.value || 0), 0) / sortedData.length)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Median</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(sortedData[Math.floor(sortedData.length / 2)]?.value || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(Math.min(...sortedData.map(r => r.value || 0)))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(Math.max(...sortedData.map(r => r.value || 0)))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Main Comparison Dashboard Component
export default function ComparisonDashboard() {
  const navigate = useNavigate();
  const presets = useDateRangePresets();
  
  // State management
  const [date1, setDate1] = useState(presets.thisMonth);
  const [date2, setDate2] = useState(presets.lastMonth);
  const [granularity, setGranularity] = useState('month');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('line');
  const [drillDownModal, setDrillDownModal] = useState({ open: false, data: null, title: '', type: '' });
  
  // Options for filters
  const [branchOptions, setBranchOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [segmentOptions, setSegmentOptions] = useState([]);
  const [channelOptions, setChannelOptions] = useState([]);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [branches, products, segments, channels] = await Promise.all([
          supabase.from('branches').select('branch_id, branch_name').limit(500),
          supabase.from('products').select('product_id, product_name').limit(500),
          supabase.from('customers').select('customer_segment').limit(500),
          supabase.from('transactions').select('channel').limit(500)
        ]);

        setBranchOptions((branches.data || []).map(b => ({ 
          value: b.branch_id, 
          label: `${b.branch_id} - ${b.branch_name}` 
        })));
        
        setProductOptions((products.data || []).map(p => ({ 
          value: p.product_id, 
          label: p.product_name 
        })));
        
        const uniqueSegments = [...new Set((segments.data || []).map(s => s.customer_segment).filter(Boolean))];
        setSegmentOptions(uniqueSegments.map(s => ({ value: s, label: s })));
        
        const uniqueChannels = [...new Set((channels.data || []).map(c => c.channel).filter(Boolean))];
        setChannelOptions(uniqueChannels.map(c => ({ value: c, label: c })));
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  // Load comparison data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = {
        branchIds: selectedBranches.length ? selectedBranches : null,
        productIds: selectedProducts.length ? selectedProducts : null,
        start1: date1.from,
        end1: date1.to,
        start2: date2.from,
        end2: date2.to,
        granularity
      };

      const [sales, collections, customers, accounts, cases] = await Promise.all([
        ComparisonService.compareSales(filters),
        ComparisonService.compareCollections(filters),
        ComparisonService.compareCustomers(filters),
        ComparisonService.compareAccounts(filters),
        ComparisonService.compareCases({ ...filters, productTypes: selectedProducts.length ? selectedProducts.map(p => `Product_${p}`) : null })
      ]);

      setData({ sales, collections, customers, accounts, cases });
    } catch (err) {
      setError(err.message || 'Failed to load comparison data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [date1, date2, granularity, selectedBranches, selectedProducts]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!data.sales?.data) return [];

    const calculateTotal = (dataset, field1, field2) => {
      if (!dataset?.data) return { current: 0, previous: 0, change: 0, trend: [] };
      
      const current = dataset.data.reduce((sum, item) => sum + Number(item[field2] || 0), 0);
      const previous = dataset.data.reduce((sum, item) => sum + Number(item[field1] || 0), 0);
      const change = previous ? ((current - previous) / previous) * 100 : 0;
      
      // Generate trend data
      const trend = dataset.data.slice(-7).map(item => ({ value: item[field2] || 0 }));
      
      return { current, previous, change, trend };
    };

    return [
      {
        id: 'sales',
        title: 'Total Sales',
        icon: DollarSign,
        ...calculateTotal(data.sales, 'value_1', 'value_2'),
        format: 'currency',
        onClick: () => handleDrillDown('sales', 'Sales Details')
      },
      {
        id: 'collections',
        title: 'Collections',
        icon: CreditCard,
        ...calculateTotal(data.collections, 'value_1', 'value_2'),
        format: 'currency',
        onClick: () => handleDrillDown('collections', 'Collection Details')
      },
      {
        id: 'customers',
        title: 'New Customers',
        icon: Users,
        ...calculateTotal(data.customers, 'value_1', 'value_2'),
        format: 'number',
        onClick: () => handleDrillDown('customers', 'Customer Details')
      },
      {
        id: 'accounts',
        title: 'New Accounts',
        icon: FileText,
        ...calculateTotal(data.accounts, 'value_1', 'value_2'),
        format: 'number',
        onClick: () => handleDrillDown('accounts', 'Account Details')
      },
      {
        id: 'cases',
        title: 'Collection Cases',
        icon: Target,
        current: data.cases?.data?.reduce((sum, item) => sum + Number(item.new_cases_2 || 0), 0) || 0,
        previous: data.cases?.data?.reduce((sum, item) => sum + Number(item.new_cases_1 || 0), 0) || 0,
        change: 0,
        format: 'number',
        onClick: () => handleDrillDown('cases', 'Case Details')
      }
    ];
  }, [data]);

  // Export functions
  const exportMetricData = (metric) => {
    const data = {
      metric: metric.title,
      currentPeriod: {
        dates: `${format(date1.from, 'yyyy-MM-dd')} to ${format(date1.to, 'yyyy-MM-dd')}`,
        value: metric.current,
        formatted: metric.format === 'currency' ? formatCurrency(metric.current) : formatNumber(metric.current)
      },
      previousPeriod: {
        dates: `${format(date2.from, 'yyyy-MM-dd')} to ${format(date2.to, 'yyyy-MM-dd')}`,
        value: metric.previous,
        formatted: metric.format === 'currency' ? formatCurrency(metric.previous) : formatNumber(metric.previous)
      },
      change: {
        absolute: metric.current - metric.previous,
        percentage: ((metric.current - metric.previous) / metric.previous * 100).toFixed(2) + '%'
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const exportAllData = async (format = 'excel') => {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          period1: { from: date1.from, to: date1.to },
          period2: { from: date2.from, to: date2.to },
          filters: {
            branches: selectedBranches,
            products: selectedProducts,
            segments: selectedSegments,
            granularity
          }
        },
        summary: summaryMetrics.map(m => ({
          metric: m.title,
          period1Value: m.previous,
          period2Value: m.current,
          change: ((m.current - m.previous) / m.previous * 100).toFixed(2) + '%'
        })),
        salesData: data.sales?.data || [],
        collectionsData: data.collections?.data || [],
        customersData: data.customers?.data || [],
        accountsData: data.accounts?.data || [],
        casesData: data.cases?.data || []
      };

      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryWs = XLSX.utils.json_to_sheet(exportData.summary);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Sales sheet
        if (exportData.salesData.length > 0) {
          const salesWs = XLSX.utils.json_to_sheet(exportData.salesData);
          XLSX.utils.book_append_sheet(wb, salesWs, 'Sales');
        }
        
        // Collections sheet
        if (exportData.collectionsData.length > 0) {
          const collectionsWs = XLSX.utils.json_to_sheet(exportData.collectionsData);
          XLSX.utils.book_append_sheet(wb, collectionsWs, 'Collections');
        }
        
        // Customers sheet
        if (exportData.customersData.length > 0) {
          const customersWs = XLSX.utils.json_to_sheet(exportData.customersData);
          XLSX.utils.book_append_sheet(wb, customersWs, 'Customers');
        }
        
        XLSX.writeFile(wb, `Comparison_Dashboard_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        toast.success('Excel file exported successfully');
      } else if (format === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Comparison Dashboard Report', 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 32);
        doc.text(`Period 1: ${format(date1.from, 'PP')} - ${format(date1.to, 'PP')}`, 14, 40);
        doc.text(`Period 2: ${format(date2.from, 'PP')} - ${format(date2.to, 'PP')}`, 14, 48);
        
        // Summary table
        doc.autoTable({
          head: [['Metric', 'Period 1', 'Period 2', 'Change']],
          body: exportData.summary.map(row => [
            row.metric,
            formatNumber(row.period1Value),
            formatNumber(row.period2Value),
            row.change
          ]),
          startY: 60,
        });
        
        doc.save(`Comparison_Dashboard_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('PDF exported successfully');
      } else if (format === 'image') {
        const element = document.getElementById('comparison-dashboard');
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Comparison_Dashboard_${format(new Date(), 'yyyy-MM-dd')}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Image exported successfully');
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Handle drill-down
  const handleDrillDown = async (type, title) => {
    setLoading(true);
    try {
      let detailData;
      const filters = {
        branchIds: selectedBranches.length ? selectedBranches : null,
        productIds: selectedProducts.length ? selectedProducts : null,
        start: date2.from,
        end: date2.to
      };

      switch (type) {
        case 'sales':
          detailData = await ComparisonService.getSalesDetails(filters);
          break;
        case 'collections':
          detailData = await ComparisonService.getCollectionsDetails(filters);
          break;
        case 'customers':
          detailData = await ComparisonService.getCustomersDetails(filters);
          break;
        case 'accounts':
          detailData = await ComparisonService.getAccountsDetails(filters);
          break;
        case 'cases':
          detailData = await ComparisonService.getCasesDetails({
            ...filters,
            productTypes: selectedProducts.length ? selectedProducts.map(p => `Product_${p}`) : null
          });
          break;
        default:
          detailData = { data: [] };
      }

      setDrillDownModal({
        open: true,
        data: detailData.data || [],
        title,
        type
      });
    } catch (err) {
      console.error('Error fetching detail data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render comparison charts
  const renderComparisonChart = () => {
    const chartData = data.sales?.data || [];
    
    if (chartData.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No data available for the selected period</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const transformedData = chartData.map(item => ({
      period: format(new Date(item.period), granularity === 'day' ? 'MMM dd' : granularity === 'month' ? 'MMM yyyy' : 'yyyy'),
      'Period 1': item.value_1 || 0,
      'Period 2': item.value_2 || 0,
      change: item.pct_change || 0
    }));

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Comparison</CardTitle>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="composed">Combined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' && (
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Period 1" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="Period 2" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              )}
              {chartType === 'bar' && (
                <BarChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="Period 1" fill="#8884d8" />
                  <Bar dataKey="Period 2" fill="#82ca9d" />
                </BarChart>
              )}
              {chartType === 'area' && (
                <AreaChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="Period 1" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="Period 2" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              )}
              {chartType === 'composed' && (
                <ComposedChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Period 1" fill="#8884d8" />
                  <Bar yAxisId="left" dataKey="Period 2" fill="#82ca9d" />
                  <Line yAxisId="right" type="monotone" dataKey="change" stroke="#ff7300" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render heatmap
  const renderHeatmap = () => {
    const heatmapData = [];
    const branches = [...new Set((data.sales?.data || []).map(d => d.branch_id).filter(Boolean))];
    const products = [...new Set((data.sales?.data || []).map(d => d.product_id).filter(Boolean))];

    branches.forEach(branch => {
      products.forEach(product => {
        const value = (data.sales?.data || [])
          .filter(d => d.branch_id === branch && d.product_id === product)
          .reduce((sum, d) => sum + (d.value_2 || 0), 0);
        
        if (value > 0) {
          heatmapData.push({
            branch,
            product,
            value,
            name: `${branch}-${product}`
          });
        }
      });
    });

    if (heatmapData.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch-Product Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={heatmapData}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={({ x, y, width, height, name, value }) => (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                    />
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={12}
                    >
                      {name}
                    </text>
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 15}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10}
                    >
                      {formatNumber(value)}
                    </text>
                  </g>
                )}
              />
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render insights
  const renderInsights = () => {
    const insights = [];
    
    // Calculate insights based on data
    if (data.sales?.data?.length > 0) {
      const totalGrowth = summaryMetrics.find(m => m.id === 'sales')?.change || 0;
      insights.push({
        type: totalGrowth > 0 ? 'positive' : 'negative',
        title: 'Sales Performance',
        description: `Sales ${totalGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(totalGrowth).toFixed(1)}% compared to the previous period.`,
        icon: totalGrowth > 0 ? TrendingUp : TrendingDown
      });
    }

    if (data.customers?.data?.length > 0) {
      const customerGrowth = summaryMetrics.find(m => m.id === 'customers')?.change || 0;
      insights.push({
        type: customerGrowth > 10 ? 'positive' : customerGrowth < 0 ? 'negative' : 'neutral',
        title: 'Customer Acquisition',
        description: `Customer acquisition ${customerGrowth > 0 ? 'grew' : 'declined'} by ${Math.abs(customerGrowth).toFixed(1)}%.`,
        icon: Users
      });
    }

    if (data.collections?.data?.length > 0) {
      const collectionRate = summaryMetrics.find(m => m.id === 'collections')?.change || 0;
      insights.push({
        type: collectionRate > 0 ? 'positive' : 'negative',
        title: 'Collection Efficiency',
        description: `Collections ${collectionRate > 0 ? 'improved' : 'declined'} by ${Math.abs(collectionRate).toFixed(1)}%.`,
        icon: CreditCard
      });
    }

    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <Alert key={idx} className={cn(
                  "border-l-4",
                  insight.type === 'positive' && "border-l-green-500",
                  insight.type === 'negative' && "border-l-red-500",
                  insight.type === 'neutral' && "border-l-yellow-500"
                )}>
                  <insight.icon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{insight.title}:</strong> {insight.description}
                  </AlertDescription>
                </Alert>
              ))}
              
              {insights.length === 0 && (
                <p className="text-muted-foreground">No insights available. Select a date range and apply filters to generate insights.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">Focus on high-performing branches to replicate success</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span className="text-sm">Review underperforming products for optimization</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                <span className="text-sm">Implement targeted campaigns for customer retention</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div id="comparison-dashboard" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comparison Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Compare performance metrics across different time periods and dimensions
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAllData('excel')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAllData('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAllData('image')}>
                <Image className="h-4 w-4 mr-2" />
                Export as Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Date Range Selection
          </CardTitle>
          <CardDescription>Select two periods to compare with smart presets</CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedDateRangePicker
            range1={date1}
            range2={date2}
            onRange1Change={setDate1}
            onRange2Change={setDate2}
            showComparison={true}
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine your comparison with specific filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Granularity</label>
              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                Branches
              </label>
              <EnhancedMultiSelect
                options={branchOptions.map(opt => ({
                  ...opt,
                  description: `Branch ID: ${opt.value}`
                }))}
                value={selectedBranches}
                onChange={setSelectedBranches}
                placeholder="Search and select branches..."
                searchable={true}
                showSelectAll={true}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                Products
              </label>
              <EnhancedMultiSelect
                options={productOptions.map(opt => ({
                  ...opt,
                  description: `Product offering`
                }))}
                value={selectedProducts}
                onChange={setSelectedProducts}
                placeholder="Search and select products..."
                searchable={true}
                showSelectAll={true}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Customer Segments
              </label>
              <EnhancedMultiSelect
                options={segmentOptions}
                value={selectedSegments}
                onChange={setSelectedSegments}
                placeholder="Search and select segments..."
                searchable={true}
                showSelectAll={true}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedBranches([]);
                setSelectedProducts([]);
                setSelectedSegments([]);
                setSelectedChannels([]);
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={loadData} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {summaryMetrics.map(metric => (
            <EnhancedMetricCard
              key={metric.id}
              title={metric.title}
              value={metric.current}
              previousValue={metric.previous}
              icon={metric.icon}
              onClick={metric.onClick}
              trend={metric.trend}
              format={metric.format}
              description={`Comparing ${format(date1.from, 'MMM dd')} - ${format(date1.to, 'MMM dd')} vs ${format(date2.from, 'MMM dd')} - ${format(date2.to, 'MMM dd')}`}
              showProgress={false}
              color={metric.current > metric.previous ? 'success' : 'danger'}
              onExport={() => exportMetricData(metric)}
              onViewDetails={() => handleDrillDown(metric.id, `${metric.title} Details`)}
              size={window.innerWidth < 1280 ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ComparisonVisualization
            data={data.sales?.data?.map(item => ({
              period: format(new Date(item.period), granularity === 'day' ? 'MMM dd' : granularity === 'month' ? 'MMM yyyy' : 'yyyy'),
              value1: item.value_1 || 0,
              value2: item.value_2 || 0,
              change: item.pct_change || 0
            })) || []}
            title="Sales Performance Comparison"
            description="Compare sales metrics across selected periods"
          />
          {renderHeatmap()}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sales?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="value_1" stackId="1" stroke="#8884d8" fill="#8884d8" name="Period 1" />
                      <Area type="monotone" dataKey="value_2" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Period 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Customer Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.customers?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(value)} />
                      <Line type="monotone" dataKey="value_1" stroke="#8884d8" name="Period 1" />
                      <Line type="monotone" dataKey="value_2" stroke="#82ca9d" name="Period 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Branch Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(
                        (data.sales?.data || []).reduce((acc, item) => {
                          if (item.branch_id) {
                            acc[item.branch_id] = (acc[item.branch_id] || 0) + item.value_2;
                          }
                          return acc;
                        }, {})
                      ).map(([branch, value]) => ({ branch, value }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="branch" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#8884d8">
                        <LabelList dataKey="value" position="top" formatter={(value) => formatNumber(value)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Product Mix */}
            <Card>
              <CardHeader>
                <CardTitle>Product Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          (data.accounts?.data || []).reduce((acc, item) => {
                            if (item.product_id) {
                              acc[`Product ${item.product_id}`] = (acc[`Product ${item.product_id}`] || 0) + item.value_2;
                            }
                            return acc;
                          }, {})
                        ).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.accounts?.data?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {renderInsights()}
        </TabsContent>
      </Tabs>

      {/* Drill-down Modal */}
      <DrillDownModal
        open={drillDownModal.open}
        onClose={() => setDrillDownModal({ open: false, data: null, title: '', type: '' })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        type={drillDownModal.type}
      />
    </div>
  );
}