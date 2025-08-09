import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Filter, RefreshCw, TrendingUp, TrendingDown,
  AlertTriangle, DollarSign, Calendar, Building2, FileText, ChevronRight,
  Clock, Phone, Mail, MessageSquare, UserX, Scale, ExternalLink,
  AlertCircle, BarChart3, PieChart, Activity, Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
  ComposedChart, Scatter, Funnel, FunnelChart, LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabaseBanking, supabaseCollection, TABLES } from '@/lib/supabase';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { toast } from 'sonner';

const COLORS = ['#EF4444', '#F87171', '#FCA5A5', '#FBBF24', '#FCD34D', '#FDE68A'];

export default function OverdueAmountDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: null,
    loans: [],
    trends: [],
    agingBuckets: [],
    collectionPriority: [],
    branchPerformance: []
  });
  const [filters, setFilters] = useState({
    branch: searchParams.get('branch') || 'all',
    loanType: 'all',
    agingBucket: 'all',
    priority: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'overdue_amount', direction: 'desc' });
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Build base query for overdue loans
      let query = supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          *,
          customers (
            customer_id,
            first_name,
            last_name,
            phone,
            email,
            credit_score
          )
        `)
        .gt('overdue_days', 0)
        .in('loan_status', ['ACTIVE', 'NPA', 'RESTRUCTURED']);

      // Apply filters
      if (filters.branch && filters.branch !== 'all') {
        query = query.eq('branch_id', filters.branch);
      }
      if (filters.loanType && filters.loanType !== 'all') {
        query = query.eq('loan_type_id', filters.loanType);
      }
      if (filters.agingBucket !== 'all') {
        switch (filters.agingBucket) {
          case '1-30':
            query = query.gte('overdue_days', 1).lte('overdue_days', 30);
            break;
          case '31-60':
            query = query.gte('overdue_days', 31).lte('overdue_days', 60);
            break;
          case '61-90':
            query = query.gte('overdue_days', 61).lte('overdue_days', 90);
            break;
          case '91-180':
            query = query.gte('overdue_days', 91).lte('overdue_days', 180);
            break;
          case '180+':
            query = query.gt('overdue_days', 180);
            break;
        }
      }

      const { data: loansRaw, error } = await query;
      if (error) throw error;

      // Enrich with loan type names
      const { data: loanTypes } = await supabaseBanking
        .from('loan_types')
        .select('loan_type_id, type_name, type_code');
      const typeById = (loanTypes || []).reduce((m, t) => { m[t.loan_type_id] = t; return m; }, {});
      const loans = (loansRaw || []).map(l => ({ ...l, loan_types: typeById[l.loan_type_id] || null }));

      // Fetch collection cases for these loans
      const loanNumbers = loans?.map(l => l.loan_account_number) || [];
      let collectionQuery = supabaseCollection
        .from('collection_cases')
        .select('*')
        .in('account_number', loanNumbers);
      
      const { data: collectionCases } = await collectionQuery;

      // Calculate summary statistics
      const summary = {
        totalOverdue: 0,
        totalAccounts: loans?.length || 0,
        avgOverdueDays: 0,
        maxOverdueDays: 0,
        criticalAccounts: 0,
        highRiskAccounts: 0,
        mediumRiskAccounts: 0,
        collectionRate: 0,
        totalCollected: 0
      };

      // Calculate aging buckets
      const agingMap = {
        '1-30 Days': { count: 0, amount: 0, percentage: 0 },
        '31-60 Days': { count: 0, amount: 0, percentage: 0 },
        '61-90 Days': { count: 0, amount: 0, percentage: 0 },
        '91-180 Days': { count: 0, amount: 0, percentage: 0 },
        '180+ Days': { count: 0, amount: 0, percentage: 0 }
      };

      // Branch performance map
      const branchMap = {};

      // Collection priority calculation
      const priorityList = [];

      loans?.forEach(loan => {
        const overdueAmount = parseFloat(loan.overdue_amount) || 0;
        const overdueDays = loan.overdue_days || 0;
        
        summary.totalOverdue += overdueAmount;
        summary.avgOverdueDays += overdueDays;
        summary.maxOverdueDays = Math.max(summary.maxOverdueDays, overdueDays);
        
        // Risk categorization
        if (overdueDays > 180) {
          summary.criticalAccounts++;
        } else if (overdueDays > 90) {
          summary.highRiskAccounts++;
        } else if (overdueDays > 30) {
          summary.mediumRiskAccounts++;
        }
        
        // Aging buckets
        if (overdueDays <= 30) {
          agingMap['1-30 Days'].count++;
          agingMap['1-30 Days'].amount += overdueAmount;
        } else if (overdueDays <= 60) {
          agingMap['31-60 Days'].count++;
          agingMap['31-60 Days'].amount += overdueAmount;
        } else if (overdueDays <= 90) {
          agingMap['61-90 Days'].count++;
          agingMap['61-90 Days'].amount += overdueAmount;
        } else if (overdueDays <= 180) {
          agingMap['91-180 Days'].count++;
          agingMap['91-180 Days'].amount += overdueAmount;
        } else {
          agingMap['180+ Days'].count++;
          agingMap['180+ Days'].amount += overdueAmount;
        }
        
        // Branch performance
        const branchId = loan.branch_id || 'Unknown';
        if (!branchMap[branchId]) {
          branchMap[branchId] = { 
            branch: branchId, 
            overdueAmount: 0, 
            accounts: 0,
            avgDays: 0,
            collected: 0
          };
        }
        branchMap[branchId].overdueAmount += overdueAmount;
        branchMap[branchId].accounts++;
        branchMap[branchId].avgDays += overdueDays;
        
        // Collection priority
        const collectionCase = collectionCases?.find(c => c.account_number === loan.loan_account_number);
        const priority = calculatePriority(loan, collectionCase);
        
        priorityList.push({
          ...loan,
          collectionCase,
          priorityScore: priority.score,
          priorityLevel: priority.level,
          priorityReasons: priority.reasons
        });
      });

      // Calculate averages and percentages
      if (loans?.length > 0) {
        summary.avgOverdueDays = Math.round(summary.avgOverdueDays / loans.length);
      }

      // Calculate aging percentages
      Object.keys(agingMap).forEach(key => {
        agingMap[key].percentage = summary.totalOverdue > 0 
          ? ((agingMap[key].amount / summary.totalOverdue) * 100).toFixed(1)
          : 0;
      });

      // Convert aging map to array
      const agingBuckets = Object.entries(agingMap).map(([bucket, data]) => ({
        bucket,
        ...data
      }));

      // Calculate branch averages
      const branchPerformance = Object.values(branchMap).map(branch => ({
        ...branch,
        avgDays: branch.accounts > 0 ? Math.round(branch.avgDays / branch.accounts) : 0,
        collectionRate: branch.overdueAmount > 0 ? ((branch.collected / branch.overdueAmount) * 100).toFixed(1) : 0
      })).sort((a, b) => b.overdueAmount - a.overdueAmount);

      // Sort priority list
      const collectionPriority = priorityList
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 20); // Top 20 priority cases

      // Generate mock trend data
      const trends = generateTrendData();

      // Mock collection rate
      summary.collectionRate = 23.5;
      summary.totalCollected = summary.totalOverdue * 0.235;

      setData({
        summary,
        loans: loans || [],
        trends,
        agingBuckets,
        collectionPriority,
        branchPerformance
      });
    } catch (error) {
      console.error('Error fetching overdue amount data:', error);
      toast.error('Failed to load overdue amount data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate collection priority
  const calculatePriority = (loan, collectionCase) => {
    let score = 0;
    const reasons = [];
    
    // Amount factor (40% weight)
    const overdueAmount = parseFloat(loan.overdue_amount) || 0;
    if (overdueAmount > 100000) {
      score += 40;
      reasons.push('High amount');
    } else if (overdueAmount > 50000) {
      score += 30;
      reasons.push('Medium amount');
    } else {
      score += 20;
    }
    
    // Days overdue factor (30% weight)
    if (loan.overdue_days > 90) {
      score += 30;
      reasons.push('Critical aging');
    } else if (loan.overdue_days > 60) {
      score += 25;
      reasons.push('High aging');
    } else if (loan.overdue_days > 30) {
      score += 20;
      reasons.push('Medium aging');
    } else {
      score += 15;
    }
    
    // Customer response factor (20% weight)
    if (!collectionCase || !collectionCase.last_contact_date) {
      score += 20;
      reasons.push('No recent contact');
    } else {
      const daysSinceContact = Math.floor(
        (new Date() - new Date(collectionCase.last_contact_date)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact > 7) {
        score += 15;
        reasons.push('Contact overdue');
      } else {
        score += 10;
      }
    }
    
    // Loan type factor (10% weight)
    if (loan.loan_types?.type_name?.includes('Business')) {
      score += 10;
      reasons.push('Business loan');
    } else if (loan.loan_types?.type_name?.includes('Home')) {
      score += 8;
    } else {
      score += 5;
    }
    
    // Determine priority level
    let level = 'low';
    if (score >= 80) level = 'critical';
    else if (score >= 65) level = 'high';
    else if (score >= 50) level = 'medium';
    
    return { score, level, reasons };
  };

  // Generate mock trend data
  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      overdue: 1500000 + (index * 100000) + (Math.random() * 200000),
      collected: 300000 + (index * 20000) + (Math.random() * 50000),
      newOverdue: 200000 + (Math.random() * 100000)
    }));
  };

  // Sort and filter loans
  const processedLoans = useMemo(() => {
    let filtered = [...data.loans];
    
    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(loan => 
        loan.loan_account_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        loan.customers?.first_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        loan.customers?.last_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        loan.customers?.customer_id?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = data.collectionPriority
        .filter(item => item.priorityLevel === filters.priority)
        .map(item => filtered.find(loan => loan.loan_account_id === item.loan_account_id))
        .filter(Boolean);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'customer_name') {
        aVal = `${a.customers?.first_name} ${a.customers?.last_name}`;
        bVal = `${b.customers?.first_name} ${b.customers?.last_name}`;
      }
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    return filtered;
  }, [data.loans, data.collectionPriority, filters.search, filters.priority, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-SA').format(num || 0);
  };

  // Get priority badge
  const getPriorityBadge = (level) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  // Get aging badge
  const getAgingBadge = (days) => {
    if (days > 180) return <Badge variant="destructive">180+ Days</Badge>;
    if (days > 90) return <Badge variant="destructive">91-180 Days</Badge>;
    if (days > 60) return <Badge className="bg-orange-500">61-90 Days</Badge>;
    if (days > 30) return <Badge className="bg-yellow-500">31-60 Days</Badge>;
    return <Badge variant="secondary">1-30 Days</Badge>;
  };

  // Export data
  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  useEffect(() => {
    fetchData();
  }, [filters.branch, filters.loanType, filters.agingBucket]);

  const { refreshing, handleRefresh } = useDataRefresh(fetchData);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              {t('Overdue Amount Details', 'Overdue Amount Details')}
            </h1>
            <p className="text-muted-foreground">
              {t('Analysis of delinquent loans and collection priorities', 'Analysis of delinquent loans and collection priorities')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin", isRTL ? "ml-2" : "mr-2")} />
            {t('Refresh', 'Refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('Export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Alert for critical accounts */}
      {data.summary?.criticalAccounts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{data.summary.criticalAccounts} critical accounts</strong> require immediate attention 
            with overdue period exceeding 180 days. Total exposure: {formatCurrency(data.summary.totalOverdue * 0.4)}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary?.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(data.summary?.totalAccounts)} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Overdue Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary?.avgOverdueDays} days
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-500">Max: {data.summary?.maxOverdueDays} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary?.collectionRate}%
            </div>
            <Progress 
              value={data.summary?.collectionRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Critical</span>
                <span className="font-medium">{data.summary?.criticalAccounts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-600">High</span>
                <span className="font-medium">{data.summary?.highRiskAccounts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600">Medium</span>
                <span className="font-medium">{data.summary?.mediumRiskAccounts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Branch</Label>
              <Select value={filters.branch} onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="BR001">Main Branch</SelectItem>
                  <SelectItem value="BR002">North Branch</SelectItem>
                  <SelectItem value="BR003">South Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Loan Type</Label>
              <Select value={filters.loanType} onValueChange={(value) => setFilters(prev => ({ ...prev, loanType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="1">Personal Loan</SelectItem>
                  <SelectItem value="2">Home Loan</SelectItem>
                  <SelectItem value="3">Auto Loan</SelectItem>
                  <SelectItem value="4">Business Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Aging Bucket</Label>
              <Select value={filters.agingBucket} onValueChange={(value) => setFilters(prev => ({ ...prev, agingBucket: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buckets</SelectItem>
                  <SelectItem value="1-30">1-30 Days</SelectItem>
                  <SelectItem value="31-60">31-60 Days</SelectItem>
                  <SelectItem value="61-90">61-90 Days</SelectItem>
                  <SelectItem value="91-180">91-180 Days</SelectItem>
                  <SelectItem value="180+">180+ Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by loan # or customer..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="priority">Collection Priority</TabsTrigger>
          <TabsTrigger value="loans">Loan Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aging Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Aging Analysis</CardTitle>
                <CardDescription>Overdue distribution by age</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.agingBuckets} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="bucket" />
                    <YAxis type="number" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#EF4444">
                      <LabelList dataKey="percentage" position="top" formatter={(value) => `${value}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Collection Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Funnel</CardTitle>
                <CardDescription>Collection process effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={[
                        { name: 'Total Overdue', value: 100, fill: '#EF4444' },
                        { name: 'Contacted', value: 75, fill: '#F87171' },
                        { name: 'Promise to Pay', value: 45, fill: '#FCA5A5' },
                        { name: 'Partial Payment', value: 30, fill: '#FBBF24' },
                        { name: 'Full Recovery', value: 15, fill: '#10B981' }
                      ]}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Overdue Trends</CardTitle>
              <CardDescription>Monthly overdue amount movement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="overdue" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.3}
                    name="Total Overdue"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="collected" 
                    fill="#10B981" 
                    name="Collected"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="newOverdue" 
                    stroke="#F59E0B" 
                    name="New Overdue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collection Priority Tab */}
        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Collection Priority List</CardTitle>
              <CardDescription>
                Top {data.collectionPriority.length} accounts requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Loan Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Overdue Amount</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.collectionPriority.map((item, index) => (
                      <TableRow key={item.loan_account_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">#{index + 1}</span>
                            {getPriorityBadge(item.priorityLevel)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {item.priorityScore}
                          </p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.loan_account_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {item.customers?.first_name} {item.customers?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.customers?.customer_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {item.customers?.phone && (
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            )}
                            {item.customers?.email && (
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(item.overdue_amount)}
                        </TableCell>
                        <TableCell>
                          {getAgingBadge(item.overdue_days)}
                        </TableCell>
                        <TableCell>
                          {item.collectionCase?.last_contact_date 
                            ? new Date(item.collectionCase.last_contact_date).toLocaleDateString()
                            : <span className="text-muted-foreground">Never</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/collection/cases/${item.loan_account_number}`)}
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Action
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Loan Details</CardTitle>
              <CardDescription>
                Showing {processedLoans.length} of {data.loans.length} loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('loan_account_number')}
                      >
                        Loan Number
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('customer_name')}
                      >
                        Customer
                      </TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('overdue_amount')}
                      >
                        Overdue Amount
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('overdue_days')}
                      >
                        Days Overdue
                      </TableHead>
                      <TableHead className="text-right">Total Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedLoans.map((loan) => {
                      const totalOutstanding = (parseFloat(loan.outstanding_principal) || 0) + 
                                             (parseFloat(loan.outstanding_interest) || 0);
                      return (
                        <TableRow key={loan.loan_account_id}>
                          <TableCell className="font-medium">
                            {loan.loan_account_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {loan.customers?.first_name} {loan.customers?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {loan.customers?.customer_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{loan.loan_types?.type_name}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(loan.overdue_amount)}
                          </TableCell>
                          <TableCell>
                            {getAgingBadge(loan.overdue_days)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalOutstanding)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={loan.loan_status === 'NPA' ? 'destructive' : 'default'}>
                              {loan.loan_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/collection/cases/${loan.loan_account_number}`)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
                <CardDescription>Overdue amounts by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.branchPerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="overdueAmount" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Heat Map */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Heat Map</CardTitle>
                <CardDescription>Risk concentration by amount and aging</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="days" name="Days Overdue" />
                    <YAxis dataKey="amount" name="Amount" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Loans"
                      data={data.loans.slice(0, 50).map(loan => ({
                        days: loan.overdue_days,
                        amount: parseFloat(loan.overdue_amount),
                        name: loan.loan_account_number
                      }))}
                      fill="#EF4444"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Collection Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Effectiveness by Product</CardTitle>
              <CardDescription>Recovery rates across loan products</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { product: 'Personal', overdue: 2500000, collected: 600000, rate: 24 },
                  { product: 'Home', overdue: 1800000, collected: 500000, rate: 28 },
                  { product: 'Auto', overdue: 1200000, collected: 250000, rate: 21 },
                  { product: 'Business', overdue: 900000, collected: 150000, rate: 17 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="overdue" fill="#EF4444" name="Overdue" />
                  <Bar yAxisId="left" dataKey="collected" fill="#10B981" name="Collected" />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#F59E0B" name="Recovery %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}