import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Printer,
  Share2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  Hash,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, formatter, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format number based on locale
const formatNumber = (value, locale = 'en', options = {}) => {
  if (value == null) return '-';
  
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 2,
    ...options
  });
  
  return formatter.format(value);
};

// Format currency based on locale
const formatCurrency = (value, locale = 'en', currency = 'SAR') => {
  if (value == null) return '-';
  
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(value);
};

// Format percentage
const formatPercentage = (value, locale = 'en', decimals = 1) => {
  if (value == null) return '-';
  
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value / 100);
};

// Format date based on locale
const formatDate = (date, locale = 'en', options = {}) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
  
  return formatter.format(dateObj);
};

// Get status color
const getStatusColor = (status) => {
  const statusColors = {
    'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'INACTIVE': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'COMPLETED': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'FAILED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'CREDIT': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'DEBIT': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

// Get risk color
const getRiskColor = (risk) => {
  const riskColors = {
    'LOW': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'HIGH': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  return riskColors[risk] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

// Enhanced Detail Modal Component
export const DetailModal = ({
  isOpen,
  onClose,
  title,
  description,
  data,
  type,
  loading = false,
  error = null,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter and sort data
  const processedData = React.useMemo(() => {
    if (!data || !data.tableData) return [];
    
    let filtered = [...data.tableData];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortBy, sortOrder]);

  // Pagination
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return processedData.slice(start, end);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(processedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title || 'Data');
      XLSX.writeFile(wb, `${title || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export to Excel failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('detail-modal-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 280;
      const pageHeight = 200;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${title || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export to PDF failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Render table view
  const renderTableView = () => {
    if (!data || !data.tableData || data.tableData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Info className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      );
    }

    const columns = data.columns || Object.keys(data.tableData[0]);

    return (
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className={cn(
              "absolute top-3 h-4 w-4 text-gray-400",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("pl-10", isRTL && "pl-3 pr-10")}
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('detailModal.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col} value={col}>
                  {t(`detailModal.columns.${col}`, col)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                {columns.map(col => (
                  <TableHead
                    key={col}
                    className={cn(
                      "font-semibold",
                      isRTL && "text-right"
                    )}
                  >
                    {t(`detailModal.columns.${col}`, col)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map(col => (
                    <TableCell key={col} className={isRTL ? "text-right" : ""}>
                      {renderCellContent(row[col], col, type)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('detailModal.itemsPerPage')}:
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('detailModal.pageInfo', {
                current: currentPage,
                total: totalPages,
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, processedData.length),
                totalItems: processedData.length
              })}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render cell content based on type
  const renderCellContent = (value, column, type) => {
    // Handle status columns
    if (column.toLowerCase().includes('status')) {
      return (
        <Badge className={cn("font-medium", getStatusColor(value))}>
          {t(`status.${value}`, value)}
        </Badge>
      );
    }
    
    // Handle risk columns
    if (column.toLowerCase().includes('risk')) {
      return (
        <Badge className={cn("font-medium", getRiskColor(value))}>
          {t(`risk.${value}`, value)}
        </Badge>
      );
    }
    
    // Handle amount/balance columns
    if (column.toLowerCase().includes('amount') || 
        column.toLowerCase().includes('balance') ||
        column.toLowerCase().includes('volume')) {
      return (
        <span className="font-medium">
          {formatCurrency(value, i18n.language)}
        </span>
      );
    }
    
    // Handle percentage columns
    if (column.toLowerCase().includes('rate') || 
        column.toLowerCase().includes('ratio') ||
        column.toLowerCase().includes('percent')) {
      const isPositive = value >= 0;
      return (
        <span className={cn(
          "font-medium flex items-center gap-1",
          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {formatPercentage(Math.abs(value), i18n.language)}
        </span>
      );
    }
    
    // Handle date columns
    if (column.toLowerCase().includes('date') || 
        column.toLowerCase().includes('time') ||
        column.toLowerCase().includes('created') ||
        column.toLowerCase().includes('updated')) {
      return formatDate(value, i18n.language);
    }
    
    // Handle number columns
    if (typeof value === 'number') {
      return formatNumber(value, i18n.language);
    }
    
    // Default
    return value || '-';
  };

  // Render chart view
  const renderChartView = () => {
    if (!data || !data.chartData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('detailModal.noChartData')}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        {data.chartData.trend && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailModal.trendAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.chartData.trend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatDate(value, i18n.language, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatNumber(value, i18n.language, { notation: 'compact' })}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(v) => formatCurrency(v, i18n.language)} t={t} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart */}
        {data.chartData.distribution && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailModal.distribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData.distribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatNumber(value, i18n.language, { notation: 'compact' })}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(v) => formatNumber(v, i18n.language)} t={t} />}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {data.chartData.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pie Chart */}
        {data.chartData.breakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailModal.breakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={data.chartData.breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100, i18n.language)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.chartData.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip formatter={(v) => formatNumber(v, i18n.language)} t={t} />}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Radar Chart for Performance */}
        {data.chartData.performance && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailModal.performanceMetrics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.chartData.performance}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Radar name="Target" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render insights view
  const renderInsightsView = () => {
    if (!data || !data.insights) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Info className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('detailModal.noInsights')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        {data.insights.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.insights.metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        metric.trend === 'up' ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                      )}>
                        {getMetricIcon(metric.icon)}
                      </div>
                      <Badge variant={metric.trend === 'up' ? 'success' : 'destructive'}>
                        {metric.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatPercentage(metric.change, i18n.language)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold mb-1">
                      {formatMetricValue(metric.value, metric.type, i18n.language)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(`detailModal.metrics.${metric.label}`, metric.label)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Insights Cards */}
        {data.insights.cards && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.insights.cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {getInsightIcon(card.type)}
                      {t(`detailModal.insights.${card.title}`, card.title)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t(`detailModal.insights.${card.description}`, card.description)}
                    </p>
                    {card.items && (
                      <ul className="space-y-2">
                        {card.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{t(`detailModal.insights.${item}`, item)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.progress && (
                      <div className="mt-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">{t('detailModal.progress')}</span>
                          <span className="text-sm font-medium">{formatPercentage(card.progress, i18n.language)}</span>
                        </div>
                        <Progress value={card.progress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {data.insights.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                {t('detailModal.recommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.insights.recommendations.map((rec, index) => (
                  <Alert key={index} className="border-l-4 border-l-amber-500">
                    <AlertDescription>
                      {t(`detailModal.recommendations.${rec}`, rec)}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Get metric icon
  const getMetricIcon = (iconName) => {
    const icons = {
      users: <Users className="h-4 w-4" />,
      dollar: <DollarSign className="h-4 w-4" />,
      card: <CreditCard className="h-4 w-4" />,
      activity: <Activity className="h-4 w-4" />,
      chart: <BarChart3 className="h-4 w-4" />,
      calendar: <Calendar className="h-4 w-4" />,
      clock: <Clock className="h-4 w-4" />,
      globe: <Globe className="h-4 w-4" />,
    };
    
    return icons[iconName] || <Info className="h-4 w-4" />;
  };

  // Get insight icon
  const getInsightIcon = (type) => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
    };
    
    return icons[type] || <Info className="h-5 w-5 text-gray-500" />;
  };

  // Format metric value based on type
  const formatMetricValue = (value, type, locale) => {
    switch (type) {
      case 'currency':
        return formatCurrency(value, locale);
      case 'percentage':
        return formatPercentage(value, locale);
      case 'number':
        return formatNumber(value, locale);
      default:
        return value;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-6xl max-h-[90vh] overflow-hidden",
          isFullscreen && "fixed inset-4 max-w-none max-h-none w-auto h-auto",
          isRTL && "rtl"
        )}
      >
        <DialogHeader className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                {title || t('detailModal.title')}
              </DialogTitle>
              {data && data.badge && (
                <Badge variant="secondary">{data.badge}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isExporting}>
                    <Download className={cn("h-4 w-4", isExporting && "animate-pulse")} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {t('detailModal.exportExcel')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t('detailModal.exportPDF')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('detailModal.print')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {description && (
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div id="detail-modal-content" className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 rounded-none h-12 p-0 bg-transparent">
                <TabsTrigger
                  value="table"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6"
                >
                  <Table className="mr-2 h-4 w-4" />
                  {t('detailModal.tableView')}
                </TabsTrigger>
                <TabsTrigger
                  value="chart"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('detailModal.chartView')}
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6"
                >
                  <Info className="mr-2 h-4 w-4" />
                  {t('detailModal.insights')}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(100%-3rem)] w-full">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TabsContent value="table" className="mt-0">
                        {renderTableView()}
                      </TabsContent>
                      
                      <TabsContent value="chart" className="mt-0">
                        {renderChartView()}
                      </TabsContent>
                      
                      <TabsContent value="insights" className="mt-0">
                        {renderInsightsView()}
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailModal;