import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DashboardService } from '@/services/dashboardService';
import { DashboardButtonService } from '@/services/dashboardButtonService';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const COLORS = {
  primary: ['#E6B800', '#FFD700'],
  secondary: ['#8B7500', '#B8A200'],
  success: ['#10B981', '#34D399'],
  danger: ['#EF4444', '#F87171'],
  info: ['#3B82F6', '#60A5FA'],
  warning: ['#F59E0B', '#FBBF24']
};

export default function ExecutiveDashboardDetail() {
  const { kpiType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [filters, setFilters] = useState(location.state?.filters || {
    dateRange: { from: null, to: null },
    branch: 'all',
    comparison: { type: 'previous_period', period: 'month' }
  });
  
  // KPI configurations
  const kpiConfigs = {
    revenue: {
      title: t('executiveDashboard.totalRevenue'),
      icon: DollarSign,
      color: 'success',
      format: 'currency',
      metrics: ['daily_revenue', 'revenue_by_branch', 'revenue_by_product', 'revenue_trend']
    },
    activeLoans: {
      title: t('executiveDashboard.activeLoans'),
      icon: CreditCard,
      color: 'primary',
      format: 'number',
      metrics: ['loan_portfolio', 'loan_by_status', 'loan_by_branch', 'loan_disbursement_trend']
    },
    totalDeposits: {
      title: t('executiveDashboard.totalDeposits'),
      icon: PiggyBank,
      color: 'info',
      format: 'currency',
      metrics: ['deposit_accounts', 'deposit_by_type', 'deposit_by_branch', 'deposit_growth_trend']
    },
    nplRatio: {
      title: t('executiveDashboard.nplRatio'),
      icon: AlertTriangle,
      color: 'warning',
      format: 'percentage',
      metrics: ['npl_breakdown', 'npl_by_branch', 'npl_by_product', 'npl_trend']
    }
  };
  
  const currentKPI = kpiConfigs[kpiType] || kpiConfigs.revenue;
  
  // Fetch detailed data
  useEffect(() => {
    fetchDetailData();
  }, [kpiType, filters]);
  
  const fetchDetailData = async () => {
    try {
      setLoading(true);
      
      // Call appropriate service method based on KPI type
      let data;
      switch (kpiType) {
        case 'revenue':
          data = await DashboardService.getRevenueDetails(filters);
          break;
        case 'activeLoans':
          data = await DashboardService.getLoanDetails(filters);
          break;
        case 'totalDeposits':
          data = await DashboardService.getDepositDetails(filters);
          break;
        case 'nplRatio':
          data = await DashboardService.getNPLDetails(filters);
          break;
        default:
          data = await DashboardService.getRevenueDetails(filters);
      }
      
      if (data.success) {
        setDetailData(data.data);
      } else {
        toast.error('Failed to load detail data');
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
      toast.error('Failed to load detail data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (format) => {
    try {
      const result = await DashboardButtonService.exportDashboard(
        { [kpiType]: detailData },
        format,
        { title: `${currentKPI.title} Details` }
      );
      
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error('Failed to export data');
    }
  };
  
  const renderMetricCard = (metric, data) => {
    return (
      <Card key={metric} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{t(`executiveDashboard.${metric}`)}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render appropriate chart based on metric type */}
          {metric.includes('trend') && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={COLORS[currentKPI.color][0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {metric.includes('by_branch') && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[currentKPI.color][0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {metric.includes('by_type') || metric.includes('by_product') && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[currentKPI.color][index % COLORS[currentKPI.color].length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/executive-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <currentKPI.icon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{currentKPI.title} Details</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDetailData()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </motion.div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(newDateRange) => setFilters({ ...filters, dateRange: newDateRange })}
            className="w-full sm:w-auto"
          />
          <Select 
            value={filters.branch} 
            onValueChange={(value) => setFilters({ ...filters, branch: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="riyadh">Riyadh</SelectItem>
              <SelectItem value="jeddah">Jeddah</SelectItem>
              <SelectItem value="dammam">Dammam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      
      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentKPI.metrics.map(metric => (
            renderMetricCard(metric, detailData?.[metric])
          ))}
        </div>
      )}
    </div>
  );
}