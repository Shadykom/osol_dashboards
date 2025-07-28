import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutGrid, Save, RefreshCw, Settings, Plus, X, Eye, Filter,
  TrendingUp, Users, DollarSign, CreditCard, PiggyBank, Activity,
  BarChart3, PieChart, LineChart, Calendar, Clock, AlertCircle,
  CheckCircle, Shield, Building2, Download, Upload, RotateCcw,
  Lock, Unlock, Share2, Trash2, Copy, MoreVertical, ArrowUpDown,
  Banknote, Wallet, TrendingDown, AlertTriangle, FileText, Sparkles,
  Layers, Target, Brain, Zap, ChevronRight, Globe, Maximize2,
  Home, UserCheck, BanknoteIcon, Package, FileCheck, Briefcase,
  GitBranch, Percent, Timer, Phone, MessageSquare, UserX, Scale,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DataSeeder } from '@/components/dashboard/DataSeeder';
import { DatabaseIcon } from '@/utils/icons';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
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
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Sankey
} from 'recharts';
import { supabaseBanking, supabaseCollection, TABLES } from '@/lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatCurrency, formatNumber } from '@/utils/formatters';

// Import existing widgets
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { EnhancedKPIWidget } from '@/components/widgets/EnhancedKPIWidget';
import { EnhancedChartWidget } from '@/components/widgets/EnhancedChartWidget';

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Enhanced Dashboard Sections
const DASHBOARD_SECTIONS = {
  overview: {
    id: 'overview',
    name: 'نظرة عامة',
    nameEn: 'Overview',
    icon: Home,
    color: 'bg-blue-500',
    description: 'ملخص شامل للأداء',
    descriptionEn: 'Comprehensive performance summary',
    gradient: 'from-blue-500 to-blue-600'
  },
  banking: {
    id: 'banking',
    name: 'الخدمات المصرفية',
    nameEn: 'Banking Services',
    icon: Building2,
    color: 'bg-green-500',
    description: 'الحسابات والمعاملات',
    descriptionEn: 'Accounts and transactions',
    gradient: 'from-green-500 to-green-600'
  },
  lending: {
    id: 'lending',
    name: 'القروض والتمويل',
    nameEn: 'Loans & Financing',
    icon: Banknote,
    color: 'bg-purple-500',
    description: 'محفظة القروض والتمويل',
    descriptionEn: 'Loan portfolio and financing',
    gradient: 'from-purple-500 to-purple-600'
  },
  collections: {
    id: 'collections',
    name: 'التحصيل',
    nameEn: 'Collections',
    icon: Scale,
    color: 'bg-red-500',
    description: 'إدارة التحصيل والمتابعة',
    descriptionEn: 'Collection management and follow-up',
    gradient: 'from-red-500 to-red-600'
  },
  customers: {
    id: 'customers',
    name: 'العملاء',
    nameEn: 'Customers',
    icon: Users,
    color: 'bg-indigo-500',
    description: 'تحليلات العملاء',
    descriptionEn: 'Customer analytics',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  risk: {
    id: 'risk',
    name: 'المخاطر والامتثال',
    nameEn: 'Risk & Compliance',
    icon: Shield,
    color: 'bg-orange-500',
    description: 'إدارة المخاطر',
    descriptionEn: 'Risk management',
    gradient: 'from-orange-500 to-orange-600'
  }
};

// Enhanced Widget Catalog with Database Integration
const WIDGET_CATALOG = {
  // Overview Widgets
  overview: {
    total_assets: {
      name: 'إجمالي الأصول',
      nameEn: 'Total Assets',
      icon: DollarSign,
      type: 'kpi',
      query: async () => {
        const { data: accounts } = await supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('current_balance')
          .eq('account_status', 'ACTIVE');
        
        const { data: loans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('outstanding_balance')
          .eq('loan_status', 'ACTIVE');
        
        const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
        const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
        
        return {
          value: totalDeposits + totalLoans,
          change: 12.5,
          trend: 'up'
        };
      }
    },
    performance_radar: {
      name: 'مؤشرات الأداء',
      nameEn: 'Performance Indicators',
      icon: Target,
      type: 'chart',
      chartType: 'radar',
      query: async () => {
        return [
          { metric: 'Revenue', A: 120, B: 110, fullMark: 150 },
          { metric: 'Customers', A: 98, B: 130, fullMark: 150 },
          { metric: 'Efficiency', A: 86, B: 130, fullMark: 150 },
          { metric: 'Risk', A: 99, B: 100, fullMark: 150 },
          { metric: 'Compliance', A: 85, B: 90, fullMark: 150 },
          { metric: 'Innovation', A: 65, B: 85, fullMark: 150 }
        ];
      }
    }
  },
  
  // Banking Widgets
  banking: {
    active_accounts: {
      name: 'الحسابات النشطة',
      nameEn: 'Active Accounts',
      icon: CreditCard,
      type: 'kpi',
      query: async () => {
        const { count } = await supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'ACTIVE');
        
        return {
          value: count || 0,
          change: 8.2,
          trend: 'up'
        };
      }
    },
    daily_transactions: {
      name: 'المعاملات اليومية',
      nameEn: 'Daily Transactions',
      icon: Activity,
      type: 'kpi',
      query: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('*', { count: 'exact', head: true })
          .gte('transaction_date', today.toISOString());
        
        return {
          value: count || 0,
          change: -2.4,
          trend: 'down'
        };
      }
    },
    account_types_distribution: {
      name: 'توزيع أنواع الحسابات',
      nameEn: 'Account Types Distribution',
      icon: PieChart,
      type: 'chart',
      chartType: 'pie',
      query: async () => {
        const { data } = await supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('account_type')
          .eq('account_status', 'ACTIVE');
        
        const distribution = data?.reduce((acc, item) => {
          const type = item.account_type || 'Other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        return Object.entries(distribution || {}).map(([name, value]) => ({
          name: name.replace(/_/g, ' '),
          value
        }));
      }
    },
    transaction_trends: {
      name: 'اتجاهات المعاملات',
      nameEn: 'Transaction Trends',
      icon: LineChart,
      type: 'chart',
      chartType: 'area',
      query: async () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        const promises = last7Days.map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const { data } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('transaction_amount')
            .gte('transaction_date', startOfDay.toISOString())
            .lte('transaction_date', endOfDay.toISOString());

          return {
            date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
            amount: data?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0,
            count: data?.length || 0
          };
        });

        return await Promise.all(promises);
      }
    }
  },
  
  // Lending Widgets
  lending: {
    loan_portfolio: {
      name: 'محفظة القروض',
      nameEn: 'Loan Portfolio',
      icon: Banknote,
      type: 'kpi',
      query: async () => {
        const { data } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('outstanding_balance')
          .eq('loan_status', 'ACTIVE');
        
        const total = data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
        
        return {
          value: total,
          change: 22.1,
          trend: 'up'
        };
      }
    },
    npl_ratio: {
      name: 'نسبة القروض المتعثرة',
      nameEn: 'NPL Ratio',
      icon: AlertTriangle,
      type: 'kpi',
      query: async () => {
        const { data: totalLoans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount');
        
        const { data: nplLoans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount')
          .gt('overdue_days', 90);
        
        const total = totalLoans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 1;
        const npl = nplLoans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;
        
        return {
          value: ((npl / total) * 100).toFixed(2),
          change: -0.3,
          trend: 'down',
          suffix: '%'
        };
      }
    },
    loan_by_product: {
      name: 'القروض حسب المنتج',
      nameEn: 'Loans by Product',
      icon: Package,
      type: 'chart',
      chartType: 'bar',
      query: async () => {
        const { data } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select(`
            product_id,
            outstanding_balance,
            products!inner(product_name)
          `)
          .eq('loan_status', 'ACTIVE');
        
        const grouped = data?.reduce((acc, loan) => {
          const product = loan.products?.product_name || 'Other';
          if (!acc[product]) {
            acc[product] = { name: product, amount: 0, count: 0 };
          }
          acc[product].amount += loan.outstanding_balance || 0;
          acc[product].count += 1;
          return acc;
        }, {});
        
        return Object.values(grouped || {});
      }
    }
  },
  
  // Collections Widgets
  collections: {
    active_cases: {
      name: 'الحالات النشطة',
      nameEn: 'Active Cases',
      icon: Scale,
      type: 'kpi',
      query: async () => {
        const { count } = await supabaseBanking
          .from(TABLES.COLLECTION_CASES)
          .select('*', { count: 'exact', head: true })
          .eq('case_status', 'ACTIVE');
        
        return {
          value: count || 0,
          change: 15.2,
          trend: 'up'
        };
      }
    },
    collection_rate: {
      name: 'معدل التحصيل',
      nameEn: 'Collection Rate',
      icon: Percent,
      type: 'kpi',
      query: async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data: summary } = await supabaseCollection
          .from('daily_collection_summary')
          .select('collection_rate')
          .gte('summary_date', startOfMonth.toISOString())
          .order('summary_date', { ascending: false })
          .limit(1)
          .single();
        
        return {
          value: summary?.collection_rate || 0,
          change: 3.5,
          trend: 'up',
          suffix: '%'
        };
      }
    },
    dpd_distribution: {
      name: 'توزيع أيام التأخير',
      nameEn: 'DPD Distribution',
      icon: Timer,
      type: 'chart',
      chartType: 'pie',
      query: async () => {
        const { data } = await supabaseBanking
          .from(TABLES.COLLECTION_CASES)
          .select('dpd, total_outstanding')
          .eq('case_status', 'ACTIVE');
        
        const buckets = {
          '0-30': { value: 0, color: '#22c55e' },
          '31-60': { value: 0, color: '#eab308' },
          '61-90': { value: 0, color: '#f97316' },
          '90+': { value: 0, color: '#ef4444' }
        };
        
        data?.forEach(item => {
          const dpd = item.dpd || 0;
          const amount = item.total_outstanding || 0;
          
          if (dpd <= 30) buckets['0-30'].value += amount;
          else if (dpd <= 60) buckets['31-60'].value += amount;
          else if (dpd <= 90) buckets['61-90'].value += amount;
          else buckets['90+'].value += amount;
        });
        
        return Object.entries(buckets).map(([name, data]) => ({
          name,
          value: data.value,
          fill: data.color
        }));
      }
    }
  },
  
  // Customer Widgets
  customers: {
    total_customers: {
      name: 'إجمالي العملاء',
      nameEn: 'Total Customers',
      icon: Users,
      type: 'kpi',
      query: async () => {
        const { count } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact', head: true })
          .eq('customer_status', 'ACTIVE');
        
        return {
          value: count || 0,
          change: 12.5,
          trend: 'up'
        };
      }
    },
    customer_segments: {
      name: 'شرائح العملاء',
      nameEn: 'Customer Segments',
      icon: UserCheck,
      type: 'chart',
      chartType: 'treemap',
      query: async () => {
        const { data } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('customer_type, credit_rating')
          .eq('customer_status', 'ACTIVE');
        
        const segments = data?.reduce((acc, customer) => {
          const type = customer.customer_type || 'Other';
          const rating = customer.credit_rating || 'N/A';
          const key = `${type}-${rating}`;
          
          if (!acc[key]) {
            acc[key] = { name: key, value: 0, type, rating };
          }
          acc[key].value += 1;
          return acc;
        }, {});
        
        return Object.values(segments || {});
      }
    }
  },
  
  // Risk & Compliance Widgets
  risk: {
    risk_score: {
      name: 'مؤشر المخاطر',
      nameEn: 'Risk Score',
      icon: Shield,
      type: 'kpi',
      query: async () => {
        // Calculate overall risk score based on various factors
        const { data: nplLoans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount')
          .gt('overdue_days', 90);
        
        const { data: totalLoans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount');
        
        const nplRatio = nplLoans?.length / (totalLoans?.length || 1);
        const riskScore = Math.max(0, Math.min(100, 100 - (nplRatio * 500)));
        
        return {
          value: riskScore.toFixed(0),
          change: 2.1,
          trend: 'up',
          suffix: '/100'
        };
      }
    },
    compliance_status: {
      name: 'حالة الامتثال',
      nameEn: 'Compliance Status',
      icon: CheckCircle,
      type: 'chart',
      chartType: 'radialbar',
      query: async () => {
        return [
          { name: 'KYC Compliance', value: 95, fill: '#22c55e' },
          { name: 'AML Checks', value: 88, fill: '#3b82f6' },
          { name: 'Risk Assessment', value: 92, fill: '#f59e0b' },
          { name: 'Regulatory Reports', value: 100, fill: '#8b5cf6' }
        ];
      }
    }
  }
};

// Dashboard Templates
const DASHBOARD_TEMPLATES = {
  executive: {
    id: 'executive',
    name: 'لوحة المدير التنفيذي',
    nameEn: 'Executive Dashboard',
    sections: ['overview', 'banking', 'lending', 'customers'],
    widgets: [
      { widget: 'total_assets', section: 'overview', size: 'large' },
      { widget: 'performance_radar', section: 'overview', size: 'large' },
      { widget: 'active_accounts', section: 'banking', size: 'medium' },
      { widget: 'loan_portfolio', section: 'lending', size: 'medium' },
      { widget: 'total_customers', section: 'customers', size: 'medium' },
      { widget: 'monthly_comparison', section: 'overview', size: 'full' }
    ]
  },
  operations: {
    id: 'operations',
    name: 'لوحة العمليات',
    nameEn: 'Operations Dashboard',
    sections: ['banking', 'collections'],
    widgets: [
      { widget: 'daily_transactions', section: 'banking', size: 'medium' },
      { widget: 'transaction_trends', section: 'banking', size: 'large' },
      { widget: 'active_cases', section: 'collections', size: 'medium' },
      { widget: 'collection_rate', section: 'collections', size: 'medium' }
    ]
  },
  risk: {
    id: 'risk',
    name: 'لوحة المخاطر',
    nameEn: 'Risk Dashboard',
    sections: ['risk', 'lending', 'collections'],
    widgets: [
      { widget: 'risk_score', section: 'risk', size: 'medium' },
      { widget: 'npl_ratio', section: 'lending', size: 'medium' },
      { widget: 'compliance_status', section: 'risk', size: 'large' },
      { widget: 'dpd_distribution', section: 'collections', size: 'large' }
    ]
  }
};

// Main Dashboard Component
export default function EnhancedDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [widgets, setWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [selectedSection, setSelectedSection] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDataSeeder, setShowDataSeeder] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    branch: 'all',
    productType: 'all',
    customerSegment: 'all'
  });
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = useRef(null);

  // Load dashboard configuration
  useEffect(() => {
    loadDashboardConfig();
    fetchDashboardData();
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchDashboardData();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Load saved dashboard configuration
  const loadDashboardConfig = () => {
    const savedConfig = localStorage.getItem('kastle_dashboard_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setWidgets(config.widgets || []);
      setSelectedTemplate(config.template);
    } else {
      // Load default template
      loadTemplate('executive');
    }
  };

  // Save dashboard configuration
  const saveDashboardConfig = () => {
    const config = {
      widgets,
      template: selectedTemplate,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('kastle_dashboard_config', JSON.stringify(config));
    toast.success(t('dashboard.saved'));
  };

  // Load template
  const loadTemplate = (templateId) => {
    const template = DASHBOARD_TEMPLATES[templateId];
    if (!template) return;
    
    setWidgets(template.widgets);
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    
    toast.success(isRTL ? `تم تحميل ${template.name}` : `${template.nameEn} loaded`);
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = {};
      const errors = [];
      
      // Fetch data for all widgets in parallel
      const widgetPromises = widgets.map(async (widget) => {
        const widgetDef = WIDGET_CATALOG[widget.section]?.[widget.widget];
        if (widgetDef?.query) {
          try {
            const result = await widgetDef.query(filters);
            data[`${widget.section}_${widget.widget}`] = result;
          } catch (error) {
            console.error(`Error fetching ${widget.widget}:`, error);
            errors.push({ widget: widget.widget, error: error.message });
            data[`${widget.section}_${widget.widget}`] = null;
          }
        }
      });
      
      // Fetch comparison data in parallel
      const comparisonPromise = fetchMonthlyComparison().then(result => {
        data.monthlyComparison = result;
      }).catch(error => {
        console.error('Error fetching comparison data:', error);
        errors.push({ widget: 'monthlyComparison', error: error.message });
      });
      
      // Wait for all promises to complete
      await Promise.all([...widgetPromises, comparisonPromise]);
      
      setWidgetData(data);
      
      // Show error summary if any widgets failed
      if (errors.length > 0) {
        const errorCount = errors.length;
        const message = isRTL 
          ? `فشل تحميل ${errorCount} من الويدجات` 
          : `Failed to load ${errorCount} widget${errorCount > 1 ? 's' : ''}`;
        toast.warning(message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch monthly comparison data
  const fetchMonthlyComparison = async () => {
    try {
      const currentMonth = new Date();
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      // Fetch current month data
      const { data: currentAccounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');
      
      const { data: currentLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance')
        .eq('loan_status', 'ACTIVE');
      
      const currentDeposits = currentAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const currentLoanAmount = currentLoans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      
      return {
        current_month: {
          revenue: 45200000,
          customers: 12847,
          deposits: currentDeposits,
          loans: currentLoanAmount,
          transactions: 234567
        },
        previous_month: {
          revenue: 41000000,
          customers: 12250,
          deposits: currentDeposits * 0.92,
          loans: currentLoanAmount * 0.88,
          transactions: 215000
        },
        trends: [
          { month: 'Jan', revenue: 38000000 },
          { month: 'Feb', revenue: 41000000 },
          { month: 'Mar', revenue: 43500000 },
          { month: 'Apr', revenue: 42000000 },
          { month: 'May', revenue: 44000000 },
          { month: 'Jun', revenue: 45200000 }
        ]
      };
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      return null;
    }
  };

  // Add widget
  const addWidget = (widgetId, section, size = 'medium') => {
    const newWidget = {
      id: `${section}_${widgetId}_${Date.now()}`,
      widget: widgetId,
      section,
      size
    };
    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  // Handle widget click for navigation
  const handleWidgetClick = (widget) => {
    if (isEditMode) return;
    
    // Navigate to detail page based on widget type
    const navigationMap = {
      banking: '/accounts',
      lending: '/loans',
      collections: '/collection/dashboard',
      customers: '/customers',
      risk: '/analytics'
    };
    
    const path = navigationMap[widget.section];
    if (path) {
      navigate(path);
    }
  };

  // Handle drag end for widget reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgets(items);
  };

  // Export dashboard
  const exportDashboard = async (format) => {
    try {
      if (format === 'pdf') {
        // For PDF export, we'll use the browser's print functionality
        // with a print-specific CSS
        window.print();
        toast.success(isRTL ? 'جاري إعداد الطباعة...' : 'Preparing print...');
      } else if (format === 'excel') {
        // Export data to Excel
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        
        // Create sheets for each section
        Object.entries(widgetData).forEach(([key, data]) => {
          if (data && Array.isArray(data)) {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const sheetName = key.replace(/[^\w\s]/gi, '').substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          }
        });
        
        // Generate filename with timestamp
        const filename = `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        toast.success(isRTL ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRTL ? 'فشل التصدير' : 'Export failed');
    }
  };

  // Render widget
  const renderWidget = (widget) => {
    const widgetDef = WIDGET_CATALOG[widget.section]?.[widget.widget];
    if (!widgetDef) return null;
    
    const data = widgetData[`${widget.section}_${widget.widget}`];
    const widgetName = isRTL ? widgetDef.name : widgetDef.nameEn;
    
    // Size classes
    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-1 lg:col-span-2',
      large: 'col-span-1 lg:col-span-3',
      full: 'col-span-full'
    };
    
    return (
      <motion.div
        key={widget.id}
        className={cn(sizeClasses[widget.size] || sizeClasses.medium)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={!isEditMode ? { scale: 1.02 } : {}}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={cn(
            "h-full cursor-pointer transition-all hover:shadow-lg relative group",
            loading && "opacity-50"
          )}
          onClick={() => handleWidgetClick(widget)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <widgetDef.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{widgetName}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {!isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(handleWidgetClick(widget));
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWidget(widget.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <>
                {widgetDef.type === 'kpi' && (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {typeof data.value === 'number' && data.value >= 1000000 
                        ? formatCurrency(data.value)
                        : formatNumber(data.value)
                      }
                      {data.suffix}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {data.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={data.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                        {data.change > 0 ? '+' : ''}{data.change}%
                      </span>
                      <span className="text-muted-foreground">
                        {t('dashboard.vsLastPeriod')}
                      </span>
                    </div>
                  </div>
                )}
                
                {widgetDef.type === 'chart' && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {widgetDef.chartType === 'line' && (
                        <RechartsLineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={Object.keys(data[0] || {})[0]} />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey={Object.keys(data[0] || {})[1]} 
                            stroke="#E6B800" 
                            strokeWidth={2}
                          />
                        </RechartsLineChart>
                      )}
                      
                      {widgetDef.chartType === 'area' && (
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={Object.keys(data[0] || {})[0]} />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey={Object.keys(data[0] || {})[1]} 
                            stroke="#E6B800" 
                            fill="#E6B800"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      )}
                      
                      {widgetDef.chartType === 'bar' && (
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="amount" fill="#E6B800" />
                          <Bar dataKey="count" fill="#4A5568" />
                        </BarChart>
                      )}
                      
                      {widgetDef.chartType === 'pie' && (
                        <RechartsPieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      )}
                      
                      {widgetDef.chartType === 'radar' && (
                        <RadarChart data={data}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis />
                          <Radar name="Current" dataKey="A" stroke="#E6B800" fill="#E6B800" fillOpacity={0.6} />
                          <Radar name="Target" dataKey="B" stroke="#4A5568" fill="#4A5568" fillOpacity={0.3} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      )}
                      
                      {widgetDef.chartType === 'radialbar' && (
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="10%" 
                          outerRadius="80%" 
                          data={data}
                        >
                          <RadialBar dataKey="value" />
                          <Legend />
                          <Tooltip />
                        </RadialBarChart>
                      )}
                      
                      {widgetDef.chartType === 'treemap' && (
                        <Treemap
                          data={data}
                          dataKey="value"
                          aspectRatio={4/3}
                          stroke="#fff"
                          fill="#8884d8"
                        >
                          <Tooltip />
                        </Treemap>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                {t('dashboard.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", isRTL && "rtl")}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {isRTL ? 'لوحة المعلومات الشاملة' : 'Comprehensive Dashboard'}
              </h1>
              {selectedTemplate && (
                <Badge variant="outline">
                  <Layers className="w-3 h-3 mr-1" />
                  {isRTL 
                    ? DASHBOARD_TEMPLATES[selectedTemplate].name 
                    : DASHBOARD_TEMPLATES[selectedTemplate].nameEn
                  }
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {isRTL ? 'الفلاتر' : 'Filters'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRefreshing(true);
                  fetchDashboardData();
                }}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {isRTL ? 'تحديث' : 'Refresh'}
              </Button>
              
              <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                  {isRTL ? 'تحديث تلقائي' : 'Auto-refresh'}
                </Label>
              </div>
              
              <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                  id="edit-mode"
                />
                <Label htmlFor="edit-mode" className="text-sm cursor-pointer flex items-center gap-1">
                  {isEditMode ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isRTL ? 'وضع التحرير' : 'Edit Mode'}
                </Label>
              </div>
              
              {isEditMode && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    {isRTL ? 'القوالب' : 'Templates'}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={saveDashboardConfig}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isRTL ? 'حفظ' : 'Save'}
                  </Button>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportDashboard('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {isRTL ? 'تصدير كـ PDF' : 'Export as PDF'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDashboard('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isRTL ? 'تصدير كـ Excel' : 'Export as Excel'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDataSeeder(true)}>
                    <DatabaseIcon className="h-4 w-4 mr-2" />
                    {isRTL ? 'بيانات تجريبية' : 'Seed Sample Data'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.print()}>
                    <FileText className="h-4 w-4 mr-2" />
                    {isRTL ? 'طباعة' : 'Print'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b shadow-sm"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">{isRTL ? 'الفترة الزمنية' : 'Date Range'}</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">{isRTL ? 'اليوم' : 'Today'}</SelectItem>
                      <SelectItem value="last_7_days">{isRTL ? 'آخر 7 أيام' : 'Last 7 Days'}</SelectItem>
                      <SelectItem value="last_30_days">{isRTL ? 'آخر 30 يوم' : 'Last 30 Days'}</SelectItem>
                      <SelectItem value="last_quarter">{isRTL ? 'الربع الأخير' : 'Last Quarter'}</SelectItem>
                      <SelectItem value="last_year">{isRTL ? 'السنة الماضية' : 'Last Year'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">{isRTL ? 'الفرع' : 'Branch'}</Label>
                  <Select value={filters.branch} onValueChange={(value) => setFilters({...filters, branch: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRTL ? 'جميع الفروع' : 'All Branches'}</SelectItem>
                      <SelectItem value="riyadh">{isRTL ? 'الرياض' : 'Riyadh'}</SelectItem>
                      <SelectItem value="jeddah">{isRTL ? 'جدة' : 'Jeddah'}</SelectItem>
                      <SelectItem value="dammam">{isRTL ? 'الدمام' : 'Dammam'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">{isRTL ? 'نوع المنتج' : 'Product Type'}</Label>
                  <Select value={filters.productType} onValueChange={(value) => setFilters({...filters, productType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRTL ? 'جميع المنتجات' : 'All Products'}</SelectItem>
                      <SelectItem value="savings">{isRTL ? 'حساب التوفير' : 'Savings Account'}</SelectItem>
                      <SelectItem value="current">{isRTL ? 'حساب جاري' : 'Current Account'}</SelectItem>
                      <SelectItem value="loan">{isRTL ? 'قرض' : 'Loan'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">{isRTL ? 'شريحة العملاء' : 'Customer Segment'}</Label>
                  <Select value={filters.customerSegment} onValueChange={(value) => setFilters({...filters, customerSegment: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRTL ? 'جميع الشرائح' : 'All Segments'}</SelectItem>
                      <SelectItem value="vip">{isRTL ? 'VIP' : 'VIP'}</SelectItem>
                      <SelectItem value="premium">{isRTL ? 'مميز' : 'Premium'}</SelectItem>
                      <SelectItem value="standard">{isRTL ? 'عادي' : 'Standard'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      dateRange: 'last_30_days',
                      branch: 'all',
                      productType: 'all',
                      customerSegment: 'all'
                    });
                  }}
                >
                  {isRTL ? 'إعادة تعيين' : 'Reset'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    fetchDashboardData();
                    setShowFilters(false);
                  }}
                >
                  {isRTL ? 'تطبيق الفلاتر' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 py-2">
              {Object.entries(DASHBOARD_SECTIONS).map(([key, section]) => (
                <Button
                  key={key}
                  variant={selectedSection === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedSection(key)}
                  className="whitespace-nowrap"
                >
                  <section.icon className="h-4 w-4 mr-2" />
                  {isRTL ? section.name : section.nameEn}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", DASHBOARD_SECTIONS[selectedSection].color)}>
                  {React.createElement(DASHBOARD_SECTIONS[selectedSection].icon, { className: "h-5 w-5 text-white" })}
                </div>
                {isRTL 
                  ? DASHBOARD_SECTIONS[selectedSection].name 
                  : DASHBOARD_SECTIONS[selectedSection].nameEn
                }
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isRTL 
                  ? DASHBOARD_SECTIONS[selectedSection].description 
                  : DASHBOARD_SECTIONS[selectedSection].descriptionEn
                }
              </p>
            </div>
            
            {isEditMode && (
              <Button
                size="sm"
                onClick={() => setShowAddWidget(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isRTL ? 'إضافة ويدجت' : 'Add Widget'}
              </Button>
            )}
          </div>
        </div>

        {/* Widgets Grid */}
        {loading && widgets.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Monthly Comparison Widget - Always show at top */}
            {selectedSection === 'overview' && widgetData.monthlyComparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <ComparisonWidget
                  title={isRTL ? "مقارنة الأداء الشهري" : "Monthly Performance Comparison"}
                  data={{ monthlyComparison: widgetData.monthlyComparison }}
                  comparisonType="month"
                />
              </motion.div>
            )}
            
            {/* Regular Widgets */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widgets" isDropDisabled={!isEditMode}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                  >
                    {widgets
                      .filter(w => w.section === selectedSection)
                      .map((widget, index) => (
                        <Draggable
                          key={widget.id}
                          draggableId={widget.id}
                          index={index}
                          isDragDisabled={!isEditMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                snapshot.isDragging && "opacity-50"
                              )}
                            >
                              {renderWidget(widget)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {widgets.filter(w => w.section === selectedSection).length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا توجد ويدجات في هذا القسم' : 'No widgets in this section'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isRTL 
                      ? 'أضف ويدجات لعرض البيانات هنا' 
                      : 'Add widgets to display data here'
                    }
                  </p>
                  {isEditMode && (
                    <Button onClick={() => setShowAddWidget(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {isRTL ? 'إضافة ويدجت' : 'Add Widget'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'إضافة ويدجت' : 'Add Widget'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? `اختر ويدجت لإضافتها إلى قسم ${DASHBOARD_SECTIONS[selectedSection].name}`
                : `Choose a widget to add to ${DASHBOARD_SECTIONS[selectedSection].nameEn} section`
              }
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(WIDGET_CATALOG[selectedSection] || {}).map(([widgetKey, widget]) => (
                <Card
                  key={widgetKey}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addWidget(widgetKey, selectedSection)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <widget.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{isRTL ? widget.name : widget.nameEn}</h4>
                        <p className="text-sm text-muted-foreground">
                          {widget.type === 'kpi' ? 'مؤشر أداء' : 'رسم بياني'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'قوالب لوحة المعلومات' : 'Dashboard Templates'}</DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'اختر قالبًا جاهزًا للبدء بسرعة' 
                : 'Choose a pre-built template to get started quickly'
              }
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DASHBOARD_TEMPLATES).map(([key, template]) => (
                <Card 
                  key={key} 
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    selectedTemplate === key && "ring-2 ring-primary"
                  )}
                  onClick={() => loadTemplate(key)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {isRTL ? template.name : template.nameEn}
                        </CardTitle>
                      </div>
                      {selectedTemplate === key && (
                        <Badge className="bg-green-500">
                          {isRTL ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section) => (
                        <Badge key={section} variant="outline">
                          {isRTL 
                            ? DASHBOARD_SECTIONS[section].name 
                            : DASHBOARD_SECTIONS[section].nameEn
                          }
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {template.widgets.length} {isRTL ? 'ويدجت' : 'widgets'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Seeder Dialog */}
      <Dialog open={showDataSeeder} onOpenChange={setShowDataSeeder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'مولد البيانات التجريبية' : 'Sample Data Generator'}</DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'قم بملء قاعدة البيانات ببيانات تجريبية لجميع مكونات لوحة المعلومات' 
                : 'Populate the database with sample data for all dashboard components'
              }
            </DialogDescription>
          </DialogHeader>
          
          <DataSeeder />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataSeeder(false)}>
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}