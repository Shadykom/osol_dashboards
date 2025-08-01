import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { useFilters } from '@/contexts/FilterContext';
import { 
  LayoutGrid, Save, RefreshCw, Settings, Plus, X, Eye, Filter,
  TrendingUp, Users, DollarSign, CreditCard, PiggyBank, Activity,
  BarChart3, PieChart, LineChart, Calendar, Clock, AlertCircle,
  CheckCircle, Shield, Building2, Download, Upload, RotateCcw,
  Lock, Unlock, Share2, Trash2, Copy, MoreVertical, ArrowUpDown,
  Banknote, Wallet, TrendingDown, AlertTriangle, FileText, Sparkles,
  Layers, Target, Brain, Zap, ChevronRight, Globe, Maximize2,
  Home, UserCheck, Package, FileCheck, Briefcase,
  GitBranch, Percent, Timer, Phone, MessageSquare, UserX, Scale,
  FileSpreadsheet, Database, Info
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
import { fixDashboard } from '@/utils/fixDashboardAuth';
import { initializeDatabase } from '@/utils/databaseInit';
import { autoLogin, handle401Error, authenticatedQuery } from '@/utils/authHelper';
import { useDashboard } from '@/hooks/useDashboard';
import { testDatabaseSchema } from '@/utils/testDatabaseSchema';
import { DataSeeder } from '@/components/dashboard/DataSeeder';
import { supabaseBanking, supabaseCollection, TABLES } from '@/lib/supabase';
import { BranchReportService } from '@/services/branchReportService';
import { ProductReportService } from '@/services/productReportService';
import { CustomerSegmentService } from '@/services/customerSegmentService';
import { fixDashboardData, checkDatabaseStatus } from '@/utils/fixDashboardData';

// Removed mock Supabase clients - using real database connections only

// Import with fallback - using regular imports
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatCurrency, formatNumber } from '@/utils/formatters';

const COLORS = ['#E6B800', '#4A5568', '#68D391', '#63B3ED', '#F687B3', '#9F7AEA', '#FC8181', '#F6AD55'];

// Mock data generators for fallback
const getMockKPIData = () => ({
  value: Math.floor(Math.random() * 100000) + 50000,
  change: (Math.random() * 20 - 10).toFixed(1),
  trend: Math.random() > 0.5 ? 'up' : 'down'
});

const getMockChartData = (type) => {
  switch (type) {
    case 'pie':
      return [
        { name: 'Category A', value: 400 },
        { name: 'Category B', value: 300 },
        { name: 'Category C', value: 300 },
        { name: 'Category D', value: 200 }
      ];
    case 'area':
    case 'line':
      return Array.from({ length: 7 }, (_, i) => ({
        date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        amount: Math.floor(Math.random() * 1000000) + 500000,
        count: Math.floor(Math.random() * 1000) + 500
      }));
    case 'bar':
      return [
        { name: 'Product A', amount: 4500000, count: 120 },
        { name: 'Product B', amount: 3200000, count: 98 },
        { name: 'Product C', amount: 2800000, count: 86 },
        { name: 'Product D', amount: 2100000, count: 72 }
      ];
    case 'radar':
      return [
        { metric: 'Revenue', A: 120, B: 110, fullMark: 150 },
        { metric: 'Customers', A: 98, B: 130, fullMark: 150 },
        { metric: 'Efficiency', A: 86, B: 130, fullMark: 150 },
        { metric: 'Risk', A: 99, B: 100, fullMark: 150 },
        { metric: 'Compliance', A: 85, B: 90, fullMark: 150 },
        { metric: 'Innovation', A: 65, B: 85, fullMark: 150 }
      ];
    case 'radialbar':
      return [
        { name: 'KYC Compliance', value: 95, fill: '#22c55e' },
        { name: 'AML Checks', value: 88, fill: '#3b82f6' },
        { name: 'Risk Assessment', value: 92, fill: '#f59e0b' },
        { name: 'Regulatory Reports', value: 100, fill: '#8b5cf6' }
      ];
    default:
      return [];
  }
};

// Dashboard sections remain the same
const DASHBOARD_SECTIONS = {
  overview: {
    id: 'overview',
    nameEn: 'Overview',
    descriptionEn: 'Key metrics and performance indicators',
    icon: Home,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  },
  banking: {
    id: 'banking',
    nameEn: 'Banking',
    descriptionEn: 'Accounts, deposits, and transactions',
    icon: Building2,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-green-600'
  },
  lending: {
    id: 'lending',
    nameEn: 'Lending',
    descriptionEn: 'Loan portfolio and performance',
    icon: Banknote,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600'
  },
  collections: {
    id: 'collections',
    nameEn: 'Collections',
    descriptionEn: 'Collection performance and recovery',
    icon: Scale,
    color: 'bg-red-500',
    gradient: 'from-red-500 to-red-600'
  },
  customers: {
    id: 'customers',
    nameEn: 'Customers',
    descriptionEn: 'Customer analytics and insights',
    icon: Users,
    color: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  risk: {
    id: 'risk',
    nameEn: 'Risk',
    descriptionEn: 'Risk assessment and monitoring',
    icon: Shield,
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600'
  }
};

// Enhanced Widget Catalog with fallback data
export const WIDGET_CATALOG = {
  overview: {
    total_assets: {
      name: 'إجمالي الأصول',
      nameEn: 'Total Assets',
      widgetKey: 'totalAssets',
      icon: DollarSign,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Build query with filters
          let accountsQuery = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('current_balance, branch_id')
            .eq('account_status', 'ACTIVE');
          
          let loansQuery = supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select(`
              outstanding_balance,
              loan_applications!inner(branch_id)
            `)
            .eq('loan_status', 'ACTIVE');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            accountsQuery = accountsQuery.eq('branch_id', filters.branch);
            loansQuery = loansQuery.eq('loan_applications.branch_id', filters.branch);
          }
          
          const accounts = await authenticatedQuery(
            () => accountsQuery,
            []
          );
          
          const loans = await authenticatedQuery(
            () => loansQuery,
            []
          );
          
          const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
          const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
          
          // Calculate change based on period
          let change = 12.5;
          if (filters?.dateRange === 'today') change = 2.3;
          else if (filters?.dateRange === 'last_7_days') change = 5.8;
          else if (filters?.dateRange === 'last_30_days') change = 12.5;
          else if (filters?.dateRange === 'last_quarter') change = 18.2;
          else if (filters?.dateRange === 'last_year') change = 24.7;
          
          return {
            value: totalDeposits + totalLoans || 0,
            change: change,
            trend: 'up'
          };
        } catch (error) {
          console.error('Error fetching total assets:', error);
          return {
            value: 0,
            change: 0,
            trend: 'up'
          };
        }
      }
    },
    performance_radar: {
      name: 'مؤشرات الأداء',
      nameEn: 'Performance Indicators',
      widgetKey: 'performanceIndicators',
      icon: Target,
      type: 'chart',
      chartType: 'radar',
      query: async () => {
        try {
          // Fetch real performance metrics from database
          const [revenueResult, customerResult, loanResult, transactionResult] = await Promise.all([
            // Revenue performance
            supabaseBanking.from(TABLES.ACCOUNTS).select('current_balance').eq('account_status', 'ACTIVE'),
            // Customer growth
            supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }).eq('is_active', true),
            // Loan portfolio
            supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('outstanding_balance').eq('loan_status', 'ACTIVE'),
            // Transaction volume
            supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true })
          ]);

          const totalRevenue = revenueResult.data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
          const customerCount = customerResult.count || 0;
          const totalLoans = loanResult.data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
          const transactionCount = transactionResult.count || 0;

          // Calculate performance scores (normalized to 0-150 scale)
          const maxRevenue = 10000000000; // 10B
          const maxCustomers = 50000;
          const maxLoans = 5000000000; // 5B
          const maxTransactions = 100000;

          return [
            { metric: 'Revenue', A: Math.min((totalRevenue / maxRevenue) * 150, 150), B: 110, fullMark: 150 },
            { metric: 'Customers', A: Math.min((customerCount / maxCustomers) * 150, 150), B: 130, fullMark: 150 },
            { metric: 'Efficiency', A: Math.min((transactionCount / maxTransactions) * 150, 150), B: 130, fullMark: 150 },
            { metric: 'Risk', A: 99, B: 100, fullMark: 150 }, // This would need risk calculation
            { metric: 'Compliance', A: 95, B: 90, fullMark: 150 }, // This would need compliance data
            { metric: 'Innovation', A: 85, B: 85, fullMark: 150 } // This would need innovation metrics
          ];
        } catch (error) {
          console.error('Error fetching performance radar data:', error);
          // Return empty data instead of mock
          return [
            { metric: 'Revenue', A: 0, B: 0, fullMark: 150 },
            { metric: 'Customers', A: 0, B: 0, fullMark: 150 },
            { metric: 'Efficiency', A: 0, B: 0, fullMark: 150 },
            { metric: 'Risk', A: 0, B: 0, fullMark: 150 },
            { metric: 'Compliance', A: 0, B: 0, fullMark: 150 },
            { metric: 'Innovation', A: 0, B: 0, fullMark: 150 }
          ];
        }
      }
    },
    monthly_revenue: {
      name: 'الإيرادات الشهرية',
      nameEn: 'Monthly Revenue',
      widgetKey: 'monthlyRevenue',
      icon: TrendingUp,
      type: 'chart',
      chartType: 'area',
      query: async () => {
        try {
          // Get last 6 months of data
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          // Fetch monthly transaction volumes
          const { data: transactions, error } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('transaction_amount, transaction_date')
            .gte('transaction_date', sixMonthsAgo.toISOString())
            .order('transaction_date', { ascending: true });

          if (error) throw error;

          // Group by month
          const monthlyData = {};
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          transactions?.forEach(tx => {
            const date = new Date(tx.transaction_date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthName = monthNames[date.getMonth()];
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { month: monthName, revenue: 0, profit: 0 };
            }
            
            monthlyData[monthKey].revenue += parseFloat(tx.transaction_amount) || 0;
            // Estimate profit as 30% of revenue
            monthlyData[monthKey].profit = monthlyData[monthKey].revenue * 0.3;
          });

          // Convert to array and get last 6 months
          const result = Object.values(monthlyData).slice(-6);
          
          return result.length > 0 ? result : [
            { month: 'No Data', revenue: 0, profit: 0 }
          ];
        } catch (error) {
          console.error('Error fetching monthly revenue:', error);
          return [
            { month: 'No Data', revenue: 0, profit: 0 }
          ];
        }
      }
    },
    customer_growth: {
      name: 'نمو العملاء',
      nameEn: 'Customer Growth',
      widgetKey: 'customerGrowth',
      icon: Users,
      type: 'kpi',
      query: async (filters) => {
        try {
          let query = supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('*', { count: 'exact', head: true });
          
          // Apply customer segment filter
          if (filters?.customerSegment && filters.customerSegment !== 'all') {
            query = query.eq('customer_segment', filters.customerSegment);
          }
          
          const { count, error } = await query;
          
          if (error) throw error;
          
          // Calculate change based on period
          let change = 18.3;
          if (filters?.dateRange === 'today') change = 1.2;
          else if (filters?.dateRange === 'last_7_days') change = 4.5;
          else if (filters?.dateRange === 'last_30_days') change = 18.3;
          else if (filters?.dateRange === 'last_quarter') change = 22.1;
          else if (filters?.dateRange === 'last_year') change = 35.6;
          
          return {
            value: count || 0,
            change: change,
            trend: 'up'
          };
        } catch (error) {
          console.error('Error fetching customer count:', error);
          return {
            value: 0,
            change: 0,
            trend: 'stable'
          };
        }
      }
    },
    transaction_volume: {
      name: 'حجم المعاملات',
      nameEn: 'Transaction Volume',
      icon: Activity,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Calculate date range
          const endDate = new Date();
          let startDate = new Date();
          
          if (filters?.dateRange === 'today') {
            startDate.setHours(0, 0, 0, 0);
          } else if (filters?.dateRange === 'last_7_days') {
            startDate.setDate(startDate.getDate() - 7);
          } else if (filters?.dateRange === 'last_30_days') {
            startDate.setDate(startDate.getDate() - 30);
          } else if (filters?.dateRange === 'last_quarter') {
            startDate.setMonth(startDate.getMonth() - 3);
          } else if (filters?.dateRange === 'last_year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
          } else {
            // Default to last 30 days
            startDate.setDate(startDate.getDate() - 30);
          }
          
          let query = supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('transaction_amount, branch_id')
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString());
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const total = data?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;
          
          // Calculate change based on period
          let change = 25.4;
          if (filters?.dateRange === 'today') change = 3.2;
          else if (filters?.dateRange === 'last_7_days') change = 8.7;
          else if (filters?.dateRange === 'last_30_days') change = 25.4;
          else if (filters?.dateRange === 'last_quarter') change = 32.1;
          else if (filters?.dateRange === 'last_year') change = 45.8;
          
          return {
            value: total || 850000000,
            change: change,
            trend: 'up'
          };
        } catch (error) {
          return {
            value: 850000000,
            change: 25.4,
            trend: 'up'
          };
        }
      }
    },
    profit_margin: {
      name: 'هامش الربح',
      nameEn: 'Profit Margin',
      icon: Percent,
      type: 'kpi',
      query: async () => {
        return {
          value: 34.8,
          change: 2.3,
          trend: 'up',
          suffix: '%'
        };
      }
    },
    branch_performance: {
      name: 'أداء الفروع',
      nameEn: 'Branch Performance',
      icon: Building2,
      type: 'chart',
      chartType: 'bar',
      query: async () => {
        return [
          { branch: 'Riyadh Main', revenue: 1850000, customers: 4250 },
          { branch: 'Jeddah Central', revenue: 1620000, customers: 3800 },
          { branch: 'Dammam Plaza', revenue: 1450000, customers: 3200 },
          { branch: 'Makkah Branch', revenue: 980000, customers: 2100 },
          { branch: 'Madinah Office', revenue: 620000, customers: 1497 }
        ];
      }
    },
    product_distribution: {
      name: 'توزيع المنتجات',
      nameEn: 'Product Distribution',
      icon: Package,
      type: 'chart',
      chartType: 'pie',
      query: async () => {
        return [
          { name: 'Personal Loans', value: 3500000, fill: '#E6B800' },
          { name: 'Home Finance', value: 4200000, fill: '#4A5568' },
          { name: 'Auto Finance', value: 2100000, fill: '#68D391' },
          { name: 'Credit Cards', value: 1800000, fill: '#63B3ED' },
          { name: 'Business Loans', value: 2900000, fill: '#F687B3' }
        ];
      }
    },
    risk_metrics: {
      name: 'مؤشرات المخاطر',
      nameEn: 'Risk Metrics',
      icon: AlertTriangle,
      type: 'chart',
      chartType: 'radialbar',
      query: async () => {
        return [
          { name: 'Credit Risk', value: 15, fill: '#22c55e' },
          { name: 'Market Risk', value: 22, fill: '#3b82f6' },
          { name: 'Operational Risk', value: 8, fill: '#f59e0b' },
          { name: 'Liquidity Risk', value: 12, fill: '#8b5cf6' }
        ];
      }
    },
    digital_adoption: {
      name: 'التحول الرقمي',
      nameEn: 'Digital Adoption',
      icon: Zap,
      type: 'kpi',
      query: async () => {
        return {
          value: 78.5,
          change: 15.2,
          trend: 'up',
          suffix: '%'
        };
      }
    },
    total_accounts: {
      name: 'إجمالي الحسابات',
      nameEn: 'Total Accounts',
      icon: CreditCard,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Get total count of all accounts
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('*', { count: 'exact', head: true });
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { count: totalCount, error: totalError } = await query;
          
          console.log('Total accounts query result:', { totalCount, totalError });
          
          if (totalError) {
            console.error('Error fetching total accounts:', totalError);
            throw totalError;
          }
          
          // Get active accounts for percentage calculation
          const { count: activeCount } = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('*', { count: 'exact', head: true })
            .eq('account_status', 'ACTIVE');
          
          const activePercentage = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : 0;
          
          return {
            value: totalCount || 0,
            change: parseFloat(activePercentage),
            trend: activePercentage > 50 ? 'up' : 'down',
            suffix: '% active'
          };
        } catch (error) {
          console.error('Error in total_accounts query:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    total_deposits: {
      name: 'إجمالي الودائع',
      nameEn: 'Total Deposits',
      icon: DollarSign,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Get all accounts with their balances
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('current_balance, account_status, branch_id');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data: accounts, error } = await query;
          
          console.log('Deposits query result:', { accountsCount: accounts?.length, error });
          
          if (error) {
            console.error('Error fetching deposits:', error);
            throw error;
          }
          
          // Calculate total deposits from all accounts
          const totalDeposits = accounts?.reduce((sum, account) => {
            return sum + (parseFloat(account.current_balance) || 0);
          }, 0) || 0;
          
          // Calculate active deposits for growth indicator
          const activeDeposits = accounts?.reduce((sum, account) => {
            if (account.account_status === 'ACTIVE') {
              return sum + (parseFloat(account.current_balance) || 0);
            }
            return sum;
          }, 0) || 0;
          
          // Mock growth rate (in real app, compare with previous period)
          const growthRate = totalDeposits > 0 ? 15.3 : 0;
          
          return {
            value: totalDeposits,
            change: growthRate,
            trend: growthRate > 0 ? 'up' : 'neutral'
          };
        } catch (error) {
          console.error('Error in total_deposits query:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    active_accounts: {
      name: 'الحسابات النشطة',
      nameEn: 'Active Accounts',
      icon: Activity,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Count only active accounts
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('*', { count: 'exact', head: true })
            .eq('account_status', 'ACTIVE');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { count, error } = await query;
          
          console.log('Active accounts query result:', { count, error });
          
          if (error) {
            console.error('Error fetching active accounts:', error);
            throw error;
          }
          
          return {
            value: count || 0,
            change: 8.2,
            trend: 'up'
          };
        } catch (error) {
          console.error('Error in active_accounts query:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    daily_transactions: {
      name: 'المعاملات اليومية',
      nameEn: 'Daily Transactions',
      icon: Activity,
      type: 'kpi',
      query: async () => {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const { count, error } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('*', { count: 'exact', head: true })
            .gte('transaction_date', today.toISOString())
            .lt('transaction_date', tomorrow.toISOString());
          
          console.log('Daily transactions query result:', { count, error, date: today.toISOString() });
          
          if (error) {
            console.error('Error fetching daily transactions:', error);
            throw error;
          }
          
          // Get yesterday's count for comparison
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const { count: yesterdayCount } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('*', { count: 'exact', head: true })
            .gte('transaction_date', yesterday.toISOString())
            .lt('transaction_date', today.toISOString());
          
          // Calculate change percentage
          let change = 0;
          if (yesterdayCount && yesterdayCount > 0) {
            change = ((count - yesterdayCount) / yesterdayCount * 100).toFixed(1);
          }
          
          return {
            value: count || 0,
            change: parseFloat(change),
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
          };
        } catch (error) {
          console.error('Error in daily_transactions query:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    account_types_distribution: {
      name: 'توزيع أنواع الحسابات',
      nameEn: 'Account Types Distribution',
      icon: PieChart,
      type: 'chart',
      chartType: 'pie',
      query: async (filters) => {
        try {
          // Get all accounts with their types
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_type_id, branch_id');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data: accounts, error } = await query;
          
          console.log('Account types distribution query result:', { accountsCount: accounts?.length, error });
          
          if (error) {
            console.error('Error fetching account types:', error);
            throw error;
          }
          
          // If no accounts, return empty array
          if (!accounts || accounts.length === 0) {
            return [];
          }
          
          // Try to get account type names if available
          const { data: accountTypes } = await supabaseBanking
            .from('account_types')
            .select('type_id, type_name, account_category');
          
          // Create a map of type_id to type details
          const typeMap = {};
          if (accountTypes) {
            accountTypes.forEach(type => {
              typeMap[type.type_id] = {
                name: type.type_name,
                category: type.account_category
              };
            });
          }
          
          // Count accounts by type
          const distribution = accounts.reduce((acc, account) => {
            let typeName = 'Other';
            
            // Try to get type name from map
            if (account.account_type_id && typeMap[account.account_type_id]) {
              typeName = typeMap[account.account_type_id].category || typeMap[account.account_type_id].name;
            } else if (account.account_type_id) {
              // Fallback to generic naming based on ID
              typeName = `Account Type ${account.account_type_id}`;
            }
            
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
          }, {});
          
          console.log('Account types distribution:', distribution);
          
          // Validate that total matches
          const distributionTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
          console.log(`Account types total: ${distributionTotal}, Accounts count: ${accounts.length}`);
          
          const colorMap = {
            'SAVINGS': '#E6B800',
            'CURRENT': '#4A5568',
            'DEPOSIT': '#68D391',
            'LOAN': '#63B3ED',
            'Other': '#F687B3'
          };
          
          const result = Object.entries(distribution).map(([name, value]) => ({
            name: name,
            value,
            fill: colorMap[name] || '#9F7AEA'
          }));
          
          return result.length > 0 ? result : [];
        } catch (error) {
          console.error('Error in account_types_distribution query:', error);
          return [];
        }
      }
    },
    transaction_trends: {
      name: 'اتجاهات المعاملات',
      nameEn: 'Transaction Trends',
      icon: LineChart,
      type: 'chart',
      chartType: 'area',
      query: async (filters) => {
        try {
          // Determine date range based on filter
          let days = 7;
          if (filters?.dateRange === 'today') days = 1;
          else if (filters?.dateRange === 'last_7_days') days = 7;
          else if (filters?.dateRange === 'last_30_days') days = 30;
          else if (filters?.dateRange === 'last_quarter') days = 90;
          else if (filters?.dateRange === 'last_year') days = 365;

          const dateArray = Array.from({ length: Math.min(days, 30) }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
            return date;
          });

          const promises = dateArray.map(async (date) => {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            let query = supabaseBanking
              .from(TABLES.TRANSACTIONS)
              .select('transaction_amount, branch_id')
              .gte('transaction_date', startOfDay.toISOString())
              .lte('transaction_date', endOfDay.toISOString());

            // Apply branch filter
            if (filters?.branch && filters.branch !== 'all') {
              query = query.eq('branch_id', filters.branch);
            }

            const { data, error } = await query;

            if (error) throw error;

            return {
              date: date.toLocaleDateString('en-US', { weekday: 'short' }),
              amount: data?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0,
              count: data?.length || 0
            };
          });

          const result = await Promise.all(promises);
          return result;
        } catch (error) {
          console.error('Error fetching transaction trends:', error);
          return []; // Return empty array instead of mock data
        }
      }
    }
  },
  
  lending: {
    loan_portfolio: {
      name: 'محفظة القروض',
      nameEn: 'Loan Portfolio',
      icon: Banknote,
      type: 'kpi',
      query: async () => {
        try {
          const { data, error } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('outstanding_balance')
            .eq('loan_status', 'ACTIVE');
          
          if (error) throw error;
          
          const total = data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
          
          return {
            value: total || 0,
            change: 22.1,
            trend: 'up'
          };
        } catch (error) {
          console.error('Error fetching loan portfolio:', error);
          return {
            value: 0,
            change: 0,
            trend: 'up'
          };
        }
      }
    },
    npl_ratio: {
      name: 'نسبة القروض المتعثرة',
      nameEn: 'NPL Ratio',
      icon: AlertTriangle,
      type: 'kpi',
      query: async () => {
        try {
          const { data: totalLoans, error: totalError } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_amount');
          
          if (totalError) throw totalError;
          
          const { data: nplLoans, error: nplError } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_amount')
            .gt('overdue_days', 90);
          
          if (nplError) throw nplError;
          
          const total = totalLoans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 1;
          const npl = nplLoans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;
          
          return {
            value: total > 0 ? ((npl / total) * 100).toFixed(2) : '0.00',
            change: -0.3,
            trend: 'down',
            suffix: '%'
          };
        } catch (error) {
          console.error('Error fetching NPL ratio:', error);
          return {
            value: 0,
            change: 0,
            trend: 'down',
            suffix: '%'
          };
        }
      }
    },
    loan_by_product: {
      name: 'القروض حسب المنتج',
      nameEn: 'Loans by Product',
      icon: Package,
      type: 'chart',
      chartType: 'bar',
      query: async () => {
        try {
          const { data, error } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select(`
              product_id,
              outstanding_balance,
              products!inner(product_name)
            `)
            .eq('loan_status', 'ACTIVE');
          
          if (error) throw error;
          
          const grouped = data?.reduce((acc, loan) => {
            const product = loan.products?.product_name || 'Other';
            if (!acc[product]) {
              acc[product] = { name: product, amount: 0, count: 0 };
            }
            acc[product].amount += loan.outstanding_balance || 0;
            acc[product].count += 1;
            return acc;
          }, {});
          
          const result = Object.values(grouped || {});
          return result.length > 0 ? result : [];
        } catch (error) {
          console.error('Error fetching loan by product data:', error);
          return []; // Return empty array instead of mock data
        }
      }
    }
  },
  
  collections: {
    active_cases: {
      name: 'الحالات النشطة',
      nameEn: 'Active Cases',
      icon: Scale,
      type: 'kpi',
      query: async () => {
        try {
          const { count, error } = await supabaseBanking
            .from(TABLES.COLLECTION_CASES)
            .select('*', { count: 'exact', head: true })
            .eq('case_status', 'ACTIVE');
          
          if (error) throw error;
          
          return {
            value: count || 0,
            change: count > 0 ? 15.2 : 0,
            trend: count > 0 ? 'up' : 'neutral'
          };
        } catch (error) {
          console.log('Error in active_cases:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    collection_rate: {
      name: 'معدل التحصيل',
      nameEn: 'Collection Rate',
      icon: Percent,
      type: 'kpi',
      query: async () => {
        try {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const { data: summary, error } = await supabaseCollection
            .from(TABLES.DAILY_COLLECTION_SUMMARY)
            .select('collection_rate')
            .gte('summary_date', startOfMonth.toISOString())
            .order('summary_date', { ascending: false })
            .limit(1)
            .single();
          
          if (error) throw error;
          
          return {
            value: summary?.collection_rate || 0,
            change: 3.5,
            trend: 'up',
            suffix: '%'
          };
        } catch (error) {
          console.error('Error fetching collection rate:', error);
          return {
            value: 0,
            change: 0,
            trend: 'up',
            suffix: '%'
          };
        }
      }
    },
    dpd_distribution: {
      name: 'توزيع أيام التأخير',
      nameEn: 'DPD Distribution',
      icon: Timer,
      type: 'chart',
      chartType: 'pie',
      query: async () => {
        try {
          const { data, error } = await supabaseBanking
            .from(TABLES.COLLECTION_CASES)
            .select('dpd, total_outstanding')
            .eq('case_status', 'ACTIVE');
          
          if (error) throw error;
          
          const buckets = {
            '0-30': { value: 0, color: '#22c55e' },
            '31-60': { value: 0, color: '#eab308' },
            '61-90': { value: 0, color: '#f97316' },
            '90+': { value: 0, color: '#ef4444' }
          };
          
          data?.forEach(item => {
            const dpd = item.dpd || item.days_past_due || 0;
            const amount = item.total_outstanding || 0;
            
            if (dpd <= 30) buckets['0-30'].value += amount;
            else if (dpd <= 60) buckets['31-60'].value += amount;
            else if (dpd <= 90) buckets['61-90'].value += amount;
            else buckets['90+'].value += amount;
          });
          
          const result = Object.entries(buckets).map(([name, data]) => ({
            name,
            value: data.value || 0,
            fill: data.color
          }));
          
          return result;
        } catch (error) {
          console.error('Error fetching DPD distribution:', error);
          return []; // Return empty array instead of mock data
        }
      }
    }
  },
  
  customers: {
    total_customers: {
      name: 'إجمالي العملاء',
      nameEn: 'Total Customers',
      icon: Users,
      type: 'kpi',
      query: async () => {
        try {
          // Get total count of all customers
          const { data: allCustomers, error: totalError } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_id');
          
          const totalCount = allCustomers?.length || 0;
          console.log('Total customers query result:', { totalCount, totalError });
          
          if (totalError) {
            console.error('Error fetching total customers:', totalError);
            throw totalError;
          }
          
          // Calculate growth rate (mock for now, could be calculated from historical data)
          const growthRate = totalCount > 0 ? 12.5 : 0;
          
          return {
            value: totalCount || 0,
            change: growthRate,
            trend: growthRate > 0 ? 'up' : 'neutral'
          };
        } catch (error) {
          console.error('Error in total_customers query:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    customer_segments: {
      name: 'شرائح العملاء',
      nameEn: 'Customer Segments',
      icon: UserCheck,
      type: 'chart',
      chartType: 'pie',
      query: async () => {
        try {
          // Get all customers with their segments
          const { data: customers, error } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_type, customer_segment, customer_type_id');
          
          console.log('Customer segments query result:', { customers: customers?.length, error });
          
          if (error) {
            console.error('Error fetching customer segments:', error);
            throw error;
          }
          
          // If no customers, return empty array
          if (!customers || customers.length === 0) {
            return [];
          }
          
          // Count customers by segment
          const segments = customers.reduce((acc, customer) => {
            // Try customer_segment first, then customer_type, then customer_type_id
            const segment = customer.customer_segment || 
                          customer.customer_type || 
                          (customer.customer_type_id ? `Type ${customer.customer_type_id}` : 'Standard');
            acc[segment] = (acc[segment] || 0) + 1;
            return acc;
          }, {});
          
          console.log('Processed segments:', segments);
          
          // Convert to chart format with colors
          const colors = ['#E6B800', '#4A5568', '#22c55e', '#3b82f6', '#ef4444', '#f97316'];
          const result = Object.entries(segments).map(([name, value], index) => ({
            name,
            value,
            fill: colors[index % colors.length]
          }));
          
          console.log('Final segments data for chart:', result);
          
          return result.length > 0 ? result : [];
        } catch (error) {
          console.error('Error in customer_segments query:', error);
          return [];
        }
      }
    }
  },
  
  risk: {
    risk_score: {
      name: 'مؤشر المخاطر',
      nameEn: 'Risk Score',
      icon: Shield,
      type: 'kpi',
      query: async () => {
        try {
          const { data: nplLoans, error: nplError } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_amount')
            .gt('overdue_days', 90);
          
          if (nplError) throw nplError;
          
          const { data: totalLoans, error: totalError } = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_amount');
          
          if (totalError) throw totalError;
          
          const nplRatio = (nplLoans?.length || 0) / (totalLoans?.length || 1);
          const riskScore = Math.max(0, Math.min(100, 100 - (nplRatio * 500)));
          
          return {
            value: riskScore.toFixed(0) || 0,
            change: 2.1,
            trend: 'up',
            suffix: '/100'
          };
        } catch (error) {
          console.error('Error fetching risk score:', error);
          return {
            value: 0,
            change: 0,
            trend: 'up',
            suffix: '/100'
          };
        }
      }
    },
    compliance_status: {
      name: 'حالة الامتثال',
      nameEn: 'Compliance Status',
      icon: CheckCircle,
      type: 'chart',
      chartType: 'radialbar',
      query: async () => {
        try {
          // In a real implementation, this would fetch from compliance tables
          // For now, return static compliance metrics
          return [
            { name: 'KYC Compliance', value: 95, fill: '#22c55e' },
            { name: 'AML Checks', value: 88, fill: '#3b82f6' },
            { name: 'Risk Assessment', value: 92, fill: '#f59e0b' },
            { name: 'Regulatory Reports', value: 100, fill: '#8b5cf6' }
          ];
        } catch (error) {
          console.error('Error fetching compliance status:', error);
          return []; // Return empty array instead of mock data
        }
      }
    }
  },
  
  banking: {
    account_summary: {
      name: 'ملخص الحسابات',
      nameEn: 'Account Summary',
      icon: Wallet,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Get account statistics
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_status, account_type_id, current_balance, branch_id');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data: accounts, error } = await query;
          
          if (error) throw error;
          
          // Calculate statistics
          const stats = accounts?.reduce((acc, account) => {
            acc.total++;
            if (account.account_status === 'ACTIVE') acc.active++;
            if (account.account_status === 'DORMANT') acc.dormant++;
            if (account.account_status === 'CLOSED') acc.closed++;
            acc.totalBalance += parseFloat(account.current_balance) || 0;
            return acc;
          }, { total: 0, active: 0, dormant: 0, closed: 0, totalBalance: 0 }) || { total: 0, active: 0, dormant: 0, closed: 0, totalBalance: 0 };
          
          return {
            value: stats.active,
            change: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0,
            trend: stats.active > stats.dormant ? 'up' : 'down',
            suffix: `/${stats.total} total`
          };
        } catch (error) {
          console.error('Error fetching account summary:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral',
            suffix: '/0 total'
          };
        }
      }
    },
    
    transaction_volume: {
      name: 'حجم المعاملات',
      nameEn: 'Transaction Volume',
      icon: Activity,
      type: 'chart',
      chartType: 'line',
      query: async (filters) => {
        try {
          // Get transaction volume for the last 7 days
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          
          const { data: transactions, error } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('transaction_date, transaction_amount, transaction_type_id, transaction_types!inner(type_code)')
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString())
            .order('transaction_date', { ascending: true });
          
          if (error) throw error;
          
          // Group by date and type
          const volumeByDate = {};
          const dates = [];
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dates.push(dateStr);
            volumeByDate[dateStr] = { date: dateStr, deposits: 0, withdrawals: 0, transfers: 0 };
          }
          
          transactions?.forEach(tx => {
            const date = tx.transaction_date.split('T')[0];
            if (volumeByDate[date]) {
              const amount = parseFloat(tx.transaction_amount) || 0;
              const transactionType = tx.transaction_types?.type_code || 'OTHER';
              if (transactionType === 'DEPOSIT' || transactionType === 'CREDIT') {
                volumeByDate[date].deposits += amount;
              } else if (transactionType === 'WITHDRAWAL' || transactionType === 'DEBIT') {
                volumeByDate[date].withdrawals += amount;
              } else if (transactionType === 'TRANSFER') {
                volumeByDate[date].transfers += amount;
              }
            }
          });
          
          return Object.values(volumeByDate);
        } catch (error) {
          console.error('Error fetching transaction volume:', error);
          return [];
        }
      }
    },
    
    balance_trends: {
      name: 'اتجاهات الأرصدة',
      nameEn: 'Balance Trends',
      icon: TrendingUp,
      type: 'chart',
      chartType: 'area',
      query: async (filters) => {
        try {
          // Get account balances grouped by type
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_type_id, current_balance, branch_id, account_types!inner(type_name)')
            .eq('account_status', 'ACTIVE');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data: accounts, error } = await query;
          
          if (error) throw error;
          
          // Group by account type
          const balanceByType = accounts?.reduce((acc, account) => {
            const type = account.account_types?.type_name || 'OTHER';
            if (!acc[type]) {
              acc[type] = { type, balance: 0, count: 0 };
            }
            acc[type].balance += parseFloat(account.current_balance) || 0;
            acc[type].count++;
            return acc;
          }, {}) || {};
          
          // Convert to array and sort by balance
          const result = Object.values(balanceByType)
            .sort((a, b) => b.balance - a.balance)
            .map(item => ({
              name: item.type.replace(/_/g, ' '),
              balance: item.balance,
              accounts: item.count
            }));
          
          return result;
        } catch (error) {
          console.error('Error fetching balance trends:', error);
          return [];
        }
      }
    },
    
    branch_deposits: {
      name: 'الودائع حسب الفرع',
      nameEn: 'Deposits by Branch',
      icon: Building2,
      type: 'chart',
      chartType: 'bar',
      query: async () => {
        try {
          // Get deposits grouped by branch
          const { data: accounts, error: accountsError } = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select(`
              current_balance,
              branch_id,
              branches!inner(branch_name)
            `)
            .eq('account_status', 'ACTIVE');
          
          if (accountsError) throw accountsError;
          
          // Group by branch
          const depositsByBranch = accounts?.reduce((acc, account) => {
            const branchName = account.branches?.branch_name || 'Unknown Branch';
            if (!acc[branchName]) {
              acc[branchName] = { branch: branchName, deposits: 0, accounts: 0 };
            }
            acc[branchName].deposits += parseFloat(account.current_balance) || 0;
            acc[branchName].accounts++;
            return acc;
          }, {}) || {};
          
          // Convert to array and sort by deposits
          const result = Object.values(depositsByBranch)
            .sort((a, b) => b.deposits - a.deposits)
            .slice(0, 10); // Top 10 branches
          
          return result;
        } catch (error) {
          console.error('Error fetching branch deposits:', error);
          return [];
        }
      }
    },
    
    account_growth: {
      name: 'نمو الحسابات',
      nameEn: 'Account Growth',
      icon: Users,
      type: 'chart',
      chartType: 'composed',
      query: async () => {
        try {
          // Get account creation dates for the last 30 days
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          
          const { data: accounts, error } = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('created_at, account_type_id')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });
          
          if (error) throw error;
          
          // Group by date
          const growthByDate = {};
          let cumulativeTotal = 0;
          
          // Initialize all dates
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            growthByDate[dateStr] = { date: dateStr, new: 0, cumulative: 0 };
          }
          
          // Count new accounts per day
          accounts?.forEach(account => {
            const date = account.created_at.split('T')[0];
            if (growthByDate[date]) {
              growthByDate[date].new++;
            }
          });
          
          // Calculate cumulative total
          Object.keys(growthByDate).sort().forEach(date => {
            cumulativeTotal += growthByDate[date].new;
            growthByDate[date].cumulative = cumulativeTotal;
          });
          
          return Object.values(growthByDate);
        } catch (error) {
          console.error('Error fetching account growth:', error);
          return [];
        }
      }
    },
    
    transaction_types: {
      name: 'أنواع المعاملات',
      nameEn: 'Transaction Types',
      icon: PieChart,
      type: 'chart',
      chartType: 'pie',
      query: async (filters) => {
        try {
          // Get transaction types for the selected period
          let days = 30;
          if (filters?.dateRange === 'today') days = 1;
          else if (filters?.dateRange === 'last_7_days') days = 7;
          else if (filters?.dateRange === 'last_30_days') days = 30;
          else if (filters?.dateRange === 'last_quarter') days = 90;
          else if (filters?.dateRange === 'last_year') days = 365;
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          
          const { data: transactions, error } = await supabaseBanking
            .from(TABLES.TRANSACTIONS)
            .select('transaction_type_id, transaction_amount, transaction_types!inner(type_code, type_name)')
            .gte('transaction_date', startDate.toISOString());
          
          if (error) throw error;
          
          // Group by transaction type
          const typeDistribution = transactions?.reduce((acc, tx) => {
            const type = tx.transaction_types?.type_name || 'OTHER';
            if (!acc[type]) {
              acc[type] = { name: type, value: 0, count: 0 };
            }
            acc[type].value += parseFloat(tx.transaction_amount) || 0;
            acc[type].count++;
            return acc;
          }, {}) || {};
          
          // Define colors for each type
          const colorMap = {
            'DEPOSIT': '#22c55e',
            'WITHDRAWAL': '#ef4444',
            'TRANSFER': '#3b82f6',
            'PAYMENT': '#f59e0b',
            'OTHER': '#8b5cf6'
          };
          
          // Convert to array format for pie chart
          const result = Object.values(typeDistribution).map(item => ({
            name: item.name.replace(/_/g, ' '),
            value: Math.round(item.value),
            fill: colorMap[item.name] || '#6b7280'
          }));
          
          return result;
        } catch (error) {
          console.error('Error fetching transaction types:', error);
          return [];
        }
      }
    },
    
    average_balance: {
      name: 'متوسط الرصيد',
      nameEn: 'Average Balance',
      icon: DollarSign,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Get average balance by account type
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('current_balance, account_type_id, branch_id')
            .eq('account_status', 'ACTIVE');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { data: accounts, error } = await query;
          
          if (error) throw error;
          
          // Calculate average
          const stats = accounts?.reduce((acc, account) => {
            const balance = parseFloat(account.current_balance) || 0;
            acc.total += balance;
            acc.count++;
            return acc;
          }, { total: 0, count: 0 }) || { total: 0, count: 0 };
          
          const average = stats.count > 0 ? stats.total / stats.count : 0;
          
          return {
            value: average,
            change: 5.2, // Mock change
            trend: 'up'
          };
        } catch (error) {
          console.error('Error fetching average balance:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral'
          };
        }
      }
    },
    
    dormant_accounts: {
      name: 'الحسابات الخاملة',
      nameEn: 'Dormant Accounts',
      icon: AlertCircle,
      type: 'kpi',
      query: async (filters) => {
        try {
          // Get dormant accounts count
          let query = supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('*', { count: 'exact', head: true })
            .eq('account_status', 'DORMANT');
          
          // Apply branch filter
          if (filters?.branch && filters.branch !== 'all') {
            query = query.eq('branch_id', filters.branch);
          }
          
          const { count, error } = await query;
          
          if (error) throw error;
          
          // Get total accounts for percentage
          const { count: totalCount } = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('*', { count: 'exact', head: true });
          
          const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
          
          return {
            value: count || 0,
            change: parseFloat(percentage),
            trend: 'down',
            suffix: `% of total`
          };
        } catch (error) {
          console.error('Error fetching dormant accounts:', error);
          return {
            value: 0,
            change: 0,
            trend: 'neutral',
            suffix: '% of total'
          };
        }
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
      { id: 'overview_total_assets_1', widget: 'total_assets', section: 'overview', size: 'large' },
      { id: 'overview_performance_radar_1', widget: 'performance_radar', section: 'overview', size: 'large' },
      { id: 'overview_monthly_revenue_1', widget: 'monthly_revenue', section: 'overview', size: 'medium' },
      { id: 'overview_customer_growth_1', widget: 'customer_growth', section: 'overview', size: 'medium' },
      { id: 'overview_transaction_volume_1', widget: 'transaction_volume', section: 'overview', size: 'medium' },
      { id: 'overview_profit_margin_1', widget: 'profit_margin', section: 'overview', size: 'medium' },
      { id: 'overview_branch_performance_1', widget: 'branch_performance', section: 'overview', size: 'large' },
      { id: 'overview_product_distribution_1', widget: 'product_distribution', section: 'overview', size: 'large' },
      { id: 'overview_risk_metrics_1', widget: 'risk_metrics', section: 'overview', size: 'medium' },
      { id: 'overview_digital_adoption_1', widget: 'digital_adoption', section: 'overview', size: 'medium' },
      { id: 'banking_account_summary_1', widget: 'account_summary', section: 'banking', size: 'medium' },
      { id: 'banking_average_balance_1', widget: 'average_balance', section: 'banking', size: 'medium' },
      { id: 'banking_dormant_accounts_1', widget: 'dormant_accounts', section: 'banking', size: 'medium' },
      { id: 'banking_transaction_volume_1', widget: 'transaction_volume', section: 'banking', size: 'large' },
      { id: 'banking_balance_trends_1', widget: 'balance_trends', section: 'banking', size: 'large' },
      { id: 'banking_branch_deposits_1', widget: 'branch_deposits', section: 'banking', size: 'large' },
      { id: 'banking_account_growth_1', widget: 'account_growth', section: 'banking', size: 'large' },
      { id: 'banking_transaction_types_1', widget: 'transaction_types', section: 'banking', size: 'medium' },
      { id: 'lending_loan_portfolio_1', widget: 'loan_portfolio', section: 'lending', size: 'medium' },
      { id: 'lending_npl_ratio_1', widget: 'npl_ratio', section: 'lending', size: 'medium' },
      { id: 'lending_loan_by_product_1', widget: 'loan_by_product', section: 'lending', size: 'large' },
      { id: 'customers_total_customers_1', widget: 'total_customers', section: 'customers', size: 'medium' },
      { id: 'customers_customer_segments_1', widget: 'customer_segments', section: 'customers', size: 'large' }
    ]
  },
  operations: {
    id: 'operations',
    name: 'لوحة العمليات',
    nameEn: 'Operations Dashboard',
    sections: ['banking', 'collections'],
    widgets: [
      { id: 'banking_account_summary_2', widget: 'account_summary', section: 'banking', size: 'medium' },
      { id: 'banking_transaction_volume_2', widget: 'transaction_volume', section: 'banking', size: 'large' },
      { id: 'banking_transaction_types_2', widget: 'transaction_types', section: 'banking', size: 'medium' },
      { id: 'banking_branch_deposits_2', widget: 'branch_deposits', section: 'banking', size: 'large' },
      { id: 'collections_active_cases_1', widget: 'active_cases', section: 'collections', size: 'medium' },
      { id: 'collections_collection_rate_1', widget: 'collection_rate', section: 'collections', size: 'medium' },
      { id: 'collections_dpd_distribution_1', widget: 'dpd_distribution', section: 'collections', size: 'large' }
    ]
  },
  risk: {
    id: 'risk',
    name: 'لوحة المخاطر',
    nameEn: 'Risk Dashboard',
    sections: ['risk', 'lending', 'collections'],
    widgets: [
      { id: 'risk_risk_score_1', widget: 'risk_score', section: 'risk', size: 'medium' },
      { id: 'risk_compliance_status_1', widget: 'compliance_status', section: 'risk', size: 'large' },
      { id: 'lending_npl_ratio_2', widget: 'npl_ratio', section: 'lending', size: 'medium' },
      { id: 'collections_dpd_distribution_2', widget: 'dpd_distribution', section: 'collections', size: 'large' }
    ]
  }
};

// Utility functions are now imported directly from @/utils/formatters

// Main Dashboard Component
export default function EnhancedDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const hasInitialized = useRef(false);
  
  // Use FilterContext instead of local state
  const { filters, filterOptions, updateFilter, updateFilters, resetFilters, loadFilterOptions } = useFilters();
  
  // State Management - Initialize with default widgets immediately
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [widgets, setWidgets] = useState(() => {
    // Try to load from localStorage first, otherwise use default template
    const savedConfig = localStorage.getItem('kastle_dashboard_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.widgets && config.widgets.length > 0) {
          return config.widgets;
        }
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
    // Return default executive template widgets
    return DASHBOARD_TEMPLATES.executive.widgets;
  });
  const [widgetData, setWidgetData] = useState({});
  const [widgetLoadingStates, setWidgetLoadingStates] = useState({}); // Track individual widget loading
  const [widgetErrorStates, setWidgetErrorStates] = useState([]); // Track widgets with errors
  const [selectedSection, setSelectedSection] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    // Initialize template from saved config
    const savedConfig = localStorage.getItem('kastle_dashboard_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return config.template || 'executive';
      } catch (error) {
        return 'executive';
      }
    }
    return 'executive';
  });
  const [showDataSeeder, setShowDataSeeder] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [isFixingData, setIsFixingData] = useState(false);
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef(null);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        fetchDashboardData();
      }, 30000); // Refresh every 30 seconds
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }
    
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Fetch filter options from database
  const fetchFilterOptions = async () => {
    try {
      const [branchesResult, productsResult, segmentsResult] = await Promise.all([
        BranchReportService.getBranches(),
        ProductReportService.getProducts(),
        CustomerSegmentService.getCustomerSegments()
      ]);

      loadFilterOptions({
        branches: branchesResult.data || [],
        products: productsResult.data || [],
        customerSegments: segmentsResult.data || []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      // Set refreshing state if manual refresh
      if (isManualRefresh) {
        setRefreshing(true);
      }
      
      // Don't set global loading anymore
      const data = {};
      const errors = [];
      const loadingStates = {};
      
      console.log('🔍 Starting dashboard data fetch...');
      console.log('📦 Active widgets:', widgets.length);
      console.log('🔧 Current filters:', filters);
      
      // If no widgets, don't fetch data
      if (!widgets || widgets.length === 0) {
        console.log('No widgets to fetch data for');
        return;
      }
      
      // Set all widgets to loading state and clear errors
      widgets.forEach(widget => {
        const key = `${widget.section}_${widget.widget}`;
        loadingStates[key] = true;
      });
      setWidgetLoadingStates(loadingStates);
      setWidgetErrorStates([]); // Clear all error states when starting fresh
      
      // Fetch data for all widgets in parallel
      const widgetPromises = widgets.map(async (widget) => {
        const widgetDef = WIDGET_CATALOG[widget.section]?.[widget.widget];
        const key = `${widget.section}_${widget.widget}`;
        
        if (widgetDef?.query) {
          try {
            console.log(`🔄 Fetching data for widget: ${key}`);
            const result = await widgetDef.query(filters);
            console.log(`✅ Data received for ${key}:`, result);
            
            // Validate the result
            if (!result && result !== 0) {
              console.warn(`⚠️ Widget ${key} returned empty data`);
            }
            
            // Update data and loading state for this specific widget
            setWidgetData(prev => ({ ...prev, [key]: result }));
            setWidgetLoadingStates(prev => ({ ...prev, [key]: false }));
            setWidgetErrorStates(prev => prev.filter(id => id !== widget.id));
            
            data[key] = result;
          } catch (error) {
            console.error(`❌ Error fetching ${widget.widget}:`, error);
            console.error(`   Widget section: ${widget.section}`);
            console.error(`   Widget ID: ${widget.id}`);
            console.error(`   Error details:`, error.message || error);
            errors.push({ widget: widget.widget, error: error.message });
            
            // Set error state for this widget
            setWidgetData(prev => ({ ...prev, [key]: null }));
            setWidgetLoadingStates(prev => ({ ...prev, [key]: false }));
            setWidgetErrorStates(prev => [...prev, widget.id]);
            
            data[key] = null;
          }
        } else {
          // No query function, mark as not loading
          setWidgetLoadingStates(prev => ({ ...prev, [key]: false }));
        }
      });
      
      // Wait for all promises to complete
      await Promise.all(widgetPromises);
      
      console.log('All widgets data fetched');
      
      // Show error summary if any widgets failed
      if (errors.length > 0) {
        toast.warning(`${errors.length} widget(s) failed to load data`);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
      
      // Clear all loading states on error
      const clearedStates = {};
      widgets.forEach(widget => {
        const key = `${widget.section}_${widget.widget}`;
        clearedStates[key] = false;
      });
      setWidgetLoadingStates(clearedStates);
    } finally {
      // Clear refreshing state
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Initialize dashboard with default data
  useEffect(() => {
    const initializeDashboard = async () => {
      // Prevent multiple initializations
      if (hasInitialized.current) {
        console.log('Dashboard already initialized, skipping...');
        return;
      }
      hasInitialized.current = true;
      
      // Start fetching data immediately
      fetchDashboardData();
      
      // Run other initialization tasks in parallel
      Promise.all([
        // Auto-login for demo purposes
        autoLogin().catch(error => console.error('Error with auto-login:', error)),
        
        // Check database status
        checkDatabaseStatus().then(status => {
          setDatabaseStatus(status);
          console.log('Database status:', status);
        }),
        
        // Initialize database with proper reference data
        initializeDatabase().catch(error => {
          console.error('Error initializing database:', error);
          // Fallback to old fix method
          return fixDashboard({ skipSeeding: true }).catch(retryError => {
            console.error('Error fixing dashboard (retry):', retryError);
          });
        }),
        
        // Fetch filter options from database
        fetchFilterOptions()
      ]);
    };
    
    initializeDashboard();
  }, []);

  // Fetch data when widgets or filters change
  useEffect(() => {
    if (widgets.length > 0) {
      fetchDashboardData();
    }
  }, [widgets, filters]);

  // Save dashboard configuration
  const saveDashboardConfig = () => {
    const config = {
      widgets,
      template: selectedTemplate,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('kastle_dashboard_config', JSON.stringify(config));
    toast.success('Dashboard saved successfully');
  };

  // Load template
  const loadTemplate = async (templateId) => {
    const template = DASHBOARD_TEMPLATES[templateId];
    if (!template) return;
    
    // Ensure widgets are properly set
    const newWidgets = [...template.widgets];
    setWidgets(newWidgets);
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    
    // Save the configuration immediately
    const config = {
      widgets: newWidgets,
      template: templateId,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('kastle_dashboard_config', JSON.stringify(config));
    
    toast.success(`${template.nameEn} loaded`);
  };

  // Fetch monthly comparison data
  const fetchMonthlyComparison = async () => {
    try {
      const currentMonth = new Date();
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      // Fetch current month data
      const { data: currentAccounts, error: accountsError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');
      
      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
        // Try to fix authentication if we get a 401
        if (accountsError.code === '401' || accountsError.message?.includes('JWT')) {
          await fixDashboard({ skipSeeding: true });
          // Retry the query
          const { data: retryAccounts } = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('current_balance')
            .eq('account_status', 'ACTIVE');
          return retryAccounts;
        }
      }
      
      const { data: currentLoans, error: loansError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance')
        .eq('loan_status', 'ACTIVE');
      
      if (loansError) {
        console.error('Error fetching loans:', loansError);
      }
      
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
    
    // Fetch data for new widget
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  // Handle widget click for navigation
  const handleWidgetClick = (widget) => {
    if (isEditMode) return;
    
    console.log('🖱️ Widget clicked:', {
      section: widget.section,
      widget: widget.widget,
      id: widget.id
    });
    
    // Navigate to enhanced detail page with widget information
    const detailPath = `/dashboard/detail-new/${widget.section}/${widget.widget}`;
    console.log('🔗 Navigating to:', detailPath);
    navigate(detailPath);
  };

  // Export dashboard
  const exportDashboard = async (format) => {
    try {
      if (format === 'pdf') {
        window.print();
        toast.success('Preparing print...');
      } else if (format === 'excel') {
        toast.info('Excel export coming soon!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };
  
  // Handle fixing dashboard data
  const handleFixData = async () => {
    setIsFixingData(true);
    try {
      const result = await fixDashboardData();
      if (result.success) {
        if (result.dataSeeded) {
          // Data was seeded, page will reload
          return;
        }
        // Check status again
        const newStatus = await checkDatabaseStatus();
        setDatabaseStatus(newStatus);
        // Refresh dashboard data
        await refresh();
      }
    } catch (error) {
      console.error('Error fixing data:', error);
      toast.error('Failed to fix dashboard data');
    } finally {
      setIsFixingData(false);
    }
  };

  // Render widget
  const renderWidget = (widget) => {
    const widgetDef = WIDGET_CATALOG[widget.section]?.[widget.widget];
    if (!widgetDef) return null;
    
    const dataKey = `${widget.section}_${widget.widget}`;
    const currentWidgetData = widgetData[dataKey] || {};
    const isLoading = widgetLoadingStates[dataKey];
    const hasError = widgetErrorStates.includes(widget.id);
    
    // Get widget name from translations
    const widgetName = widgetDef.widgetKey ? t(`dashboard.widgets.${widgetDef.widgetKey}`) : 
                      (i18n.language === 'ar' ? widgetDef.name : widgetDef.nameEn);
    
    // Determine grid size classes
    const sizeClasses = {
      small: 'col-span-12 sm:col-span-6 lg:col-span-3',
      medium: 'col-span-12 sm:col-span-6 lg:col-span-4',
      large: 'col-span-12 sm:col-span-12 lg:col-span-6',
      xlarge: 'col-span-12'
    };
    
    return (
      <motion.div
        key={widget.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={sizeClasses[widget.size || 'medium']}
      >
        <Card 
          className={cn(
            "h-full hover:shadow-lg transition-shadow duration-200",
            !isEditMode && "cursor-pointer"
          )}
          onClick={() => !isEditMode && handleWidgetClick(widget)}
        >
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <widgetDef.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base">
                  {widgetName || 'Widget'}
                </CardTitle>
              </div>
              {isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(widget.id);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-4">
            {isLoading ? (
              // Show loading state for individual widget
              <div className="h-32 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : hasError ? (
              <div className="h-32 flex items-center justify-center text-red-500">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm">Error loading data</p>
                </div>
              </div>
            ) : (
              <>
                {widgetDef.type === 'kpi' && (
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {typeof currentWidgetData.value === 'number' && currentWidgetData.value >= 1000000 
                        ? formatCurrency(currentWidgetData.value)
                        : formatNumber(currentWidgetData.value || 0)
                      }
                      {currentWidgetData.suffix}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      {currentWidgetData.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : currentWidgetData.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={
                        currentWidgetData.trend === 'up' ? 'text-green-500' : 
                        currentWidgetData.trend === 'down' ? 'text-red-500' : 
                        'text-gray-500'
                      }>
                        {currentWidgetData.change > 0 ? '+' : ''}{currentWidgetData.change || 0}%
                      </span>
                      <span className="text-muted-foreground">
                        vs last period
                      </span>
                    </div>
                  </div>
                )}
                
                {widgetDef.type === 'chart' && Array.isArray(currentWidgetData) && currentWidgetData.length > 0 && (
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {widgetDef.chartType === 'line' && (
                        <RechartsLineChart data={currentWidgetData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={Object.keys(currentWidgetData[0] || {})[0]} />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey={Object.keys(currentWidgetData[0] || {})[1]} 
                            stroke="#E6B800" 
                            strokeWidth={2}
                          />
                        </RechartsLineChart>
                      )}
                      
                      {widgetDef.chartType === 'area' && (
                        <AreaChart data={currentWidgetData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey={Object.keys(currentWidgetData[0] || {})[0]} 
                            tick={{ fontSize: 12 }}
                            interval={'preserveStartEnd'}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ fontSize: '12px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={Object.keys(currentWidgetData[0] || {})[1]} 
                            stroke="#E6B800" 
                            fill="#E6B800"
                            fillOpacity={0.3}
                            name="Revenue"
                          />
                          {Object.keys(currentWidgetData[0] || {}).length > 2 && (
                            <Area 
                              type="monotone" 
                              dataKey={Object.keys(currentWidgetData[0] || {})[2]} 
                              stroke="#4A5568" 
                              fill="#4A5568"
                              fillOpacity={0.3}
                              name="Profit"
                            />
                          )}
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </AreaChart>
                      )}
                      
                      {widgetDef.chartType === 'bar' && (
                        <BarChart data={currentWidgetData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey={currentWidgetData[0]?.branch ? "branch" : "name"} 
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'revenue' || name === 'amount') return formatCurrency(value);
                              return formatNumber(value);
                            }}
                            contentStyle={{ fontSize: '12px' }}
                          />
                          <Bar dataKey={currentWidgetData[0]?.revenue ? "revenue" : "amount"} fill="#E6B800" name="Revenue" />
                          {(currentWidgetData[0]?.customers !== undefined || currentWidgetData[0]?.count !== undefined) && (
                            <Bar dataKey={currentWidgetData[0]?.customers ? "customers" : "count"} fill="#4A5568" name="Customers" />
                          )}
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </BarChart>
                      )}
                      
                      {widgetDef.chartType === 'pie' && (
                        <RechartsPieChart>
                          <Pie
                            data={currentWidgetData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius="70%"
                            dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {currentWidgetData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatNumber(value)}
                            contentStyle={{ fontSize: '12px' }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px' }}
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                          />
                        </RechartsPieChart>
                      )}
                      
                      {widgetDef.chartType === 'radar' && (
                        <RadarChart data={widgetData}>
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
                          data={widgetData}
                        >
                          <RadialBar dataKey="value" />
                          <Legend />
                          <Tooltip />
                        </RadialBarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Add schema test function
  const handleSchemaTest = async () => {
    console.log('Running schema test...');
    await testDatabaseSchema();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Database Status Alert */}
      {databaseStatus && !databaseStatus.isConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Database connection failed. Dashboard is showing empty data.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFixData}
              disabled={isFixingData}
              className="ml-4"
            >
              {isFixingData ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Fix Data
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* No Data Alert */}
      {databaseStatus && databaseStatus.isConnected && !databaseStatus.hasData && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No data found in database. Click to seed sample data.</span>
            <Button
              size="sm"
              onClick={() => setShowDataSeeder(true)}
              className="ml-4"
            >
              <Database className="h-4 w-4 mr-2" />
              Seed Data
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="space-y-4">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">
              Comprehensive Dashboard
            </h1>
            {selectedTemplate && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                <Layers className="w-3 h-3 mr-1" />
                {DASHBOARD_TEMPLATES[selectedTemplate].nameEn}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs sm:text-sm"
            >
              <Filter className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchDashboardData(true); // Pass true for manual refresh
              }}
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-1 sm:mr-2", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <div className="hidden sm:flex items-center gap-2 border-l pl-2 ml-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh"
              />
              <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                Auto-refresh
              </Label>
            </div>
            
            <div className="hidden md:flex items-center gap-2 border-l pl-2 ml-2">
              <Switch
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
                id="edit-mode"
              />
              <Label htmlFor="edit-mode" className="text-sm cursor-pointer flex items-center gap-1">
                {isEditMode ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Edit Mode
              </Label>
            </div>
            
            {isEditMode && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                
                <Button
                  size="sm"
                  onClick={saveDashboardConfig}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="md:hidden">
                  <DropdownMenuItem onClick={() => setAutoRefresh(!autoRefresh)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditMode(!isEditMode)}>
                    {isEditMode ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                    {isEditMode ? 'Lock' : 'Edit'} Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={() => exportDashboard('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDashboard('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDataSeeder(true)}>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Sample Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_quarter">Last Quarter</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Branch</Label>
                  <Select value={filters.branch} onValueChange={(value) => updateFilter('branch', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {filterOptions.branches.map((branch) => (
                        <SelectItem key={branch.branch_id} value={branch.branch_id}>
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Product Type</Label>
                  <Select value={filters.productType} onValueChange={(value) => setFilters({...filters, productType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {filterOptions.products.map((product) => (
                        <SelectItem key={product.product_id} value={product.product_id}>
                          {product.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Customer Segment</Label>
                  <Select value={filters.customerSegment} onValueChange={(value) => setFilters({...filters, customerSegment: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="HNI">HNI</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                      <SelectItem value="SME">SME</SelectItem>
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
                    fetchDashboardData(true); // Use the refresh function from useDataRefresh
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    fetchDashboardData(true); // Use the refresh function from useDataRefresh
                    setShowFilters(false);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Tabs */}
        <ScrollArea className="w-full -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex gap-1 sm:gap-2 pb-2">
            {Object.entries(DASHBOARD_SECTIONS).map(([key, section]) => (
              <Button
                key={key}
                variant={selectedSection === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedSection(key)}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
              >
                <section.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{section.nameEn || key}</span>
                <span className="xs:hidden">{section.nameEn?.split(' ')[0] || key}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", DASHBOARD_SECTIONS[selectedSection].color)}>
                {React.createElement(DASHBOARD_SECTIONS[selectedSection].icon, { className: "h-5 w-5 text-white" })}
              </div>
              {DASHBOARD_SECTIONS[selectedSection]?.nameEn || selectedSection}
            </h2>
                          <p className="text-muted-foreground text-sm mt-1">
                {DASHBOARD_SECTIONS[selectedSection]?.descriptionEn || ''}
            </p>
          </div>
          
          {isEditMode && (
            <Button
              size="sm"
              onClick={() => setShowAddWidget(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-3 sm:gap-4 px-2 sm:px-0">
          {widgets
            .filter(w => w.section === selectedSection)
            .map((widget) => renderWidget(widget))}
        </div>
        
        {widgets.filter(w => w.section === selectedSection).length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No widgets in this section
              </h3>
              <p className="text-muted-foreground mb-4">
                Add widgets to customize your dashboard
              </p>
              {isEditMode && (
                <Button onClick={() => setShowAddWidget(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Add Widget
            </DialogTitle>
            <DialogDescription>
              Choose a widget to add to {DASHBOARD_SECTIONS[selectedSection]?.nameEn || selectedSection} section
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] sm:h-[500px] pr-2 sm:pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <h4 className="font-medium">{widget.nameEn}</h4>
                        <p className="text-sm text-muted-foreground">
                          {widget.type === 'kpi' ? 'Performance Indicator' : 'Chart'}
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
            <DialogTitle>Dashboard Templates</DialogTitle>
            <DialogDescription>
              Choose a pre-built template to get started quickly
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
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            {template.name}
                          </span>
                          {selectedTemplate === key && (
                            <Badge className="bg-green-500">
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      {selectedTemplate === key && (
                        <Badge className="bg-green-500">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section) => (
                        <Badge key={section} variant="outline">
                          {DASHBOARD_SECTIONS[section]?.nameEn || section}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {template.widgets.length} widgets
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Seeder Dialog */}
      <Dialog open={showDataSeeder} onOpenChange={setShowDataSeeder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seed Dashboard Data</DialogTitle>
            <DialogDescription>
              Your database is empty. Seed it with sample data to see the dashboard in action.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DataSeeder />
          </div>
        </DialogContent>
      </Dialog>

      {/* Schema Test Button - Add this for debugging */}
      <div className="mb-6 flex gap-2">
        <Button 
          onClick={handleSchemaTest}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          Test Database Schema
        </Button>

        <Button 
          onClick={() => {
            console.log('Manually refreshing dashboard data...');
            fetchDashboardData(true);
          }}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}