import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Filter, RefreshCw, TrendingUp, TrendingDown,
  AlertCircle, DollarSign, Calendar, Building2, FileText, ChevronRight,
  Clock, AlertTriangle, CheckCircle, Info, BarChart3, PieChart
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
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { toast } from 'sonner';

const COLORS = ['#E6B800', '#D4A600', '#C29400', '#B08200', '#9E7000', '#8C5E00'];

export default function DueAmountDetail() {
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
    distribution: [],
    aging: []
  });
  const [filters, setFilters] = useState({
    branch: searchParams.get('branch') || 'all',
    loanType: 'all',
    daysOverdue: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'overdue_amount', direction: 'desc' });
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Build base query
      let query = supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          *,
          customers (
            customer_id,
            first_name,
            last_name,
            mobile_number,
            email
          )
        `)
        .in('loan_status', ['ACTIVE', 'NPA', 'RESTRUCTURED']);

      // Apply filters
      if (filters.branch && filters.branch !== 'all') {
        query = query.eq('branch_id', filters.branch);
      }
      if (filters.loanType && filters.loanType !== 'all') {
        query = query.eq('loan_type_id', filters.loanType);
      }
      if (filters.daysOverdue !== 'all') {
        if (filters.daysOverdue === '0-30') {
          query = query.gte('overdue_days', 0).lte('overdue_days', 30);
        } else if (filters.daysOverdue === '31-60') {
          query = query.gte('overdue_days', 31).lte('overdue_days', 60);
        } else if (filters.daysOverdue === '61-90') {
          query = query.gte('overdue_days', 61).lte('overdue_days', 90);
        } else if (filters.daysOverdue === '90+') {
          query = query.gt('overdue_days', 90);
        }
      }

      const { data: loansRaw, error } = await query;
      if (error) throw error;

      // Enrich with loan type names via a separate lookup
      const { data: loanTypes } = await supabaseBanking
        .from('loan_types')
        .select('loan_type_id, type_name, type_code');
      const typeById = (loanTypes || []).reduce((m, t) => { m[t.loan_type_id] = t; return m; }, {});

      const loans = (loansRaw || []).map(l => ({
        ...l,
        loan_types: typeById[l.loan_type_id] || null,
      }));

      // Calculate summary statistics
      const summary = {
        totalDue: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        totalOverdue: 0,
        loanCount: loans?.length || 0,
        avgDaysOverdue: 0,
        criticalLoans: 0,
        warningLoans: 0
      };

      // Calculate distribution by loan type
      const distributionMap = {};
      
      // Calculate aging buckets
      const agingBuckets = {
        current: { count: 0, amount: 0 },
        '1-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '61-90': { count: 0, amount: 0 },
        '90+': { count: 0, amount: 0 }
      };

      loans?.forEach(loan => {
        const principal = parseFloat(loan.outstanding_principal) || 0;
        const interest = parseFloat(loan.outstanding_interest) || 0;
        const overdue = parseFloat(loan.overdue_amount) || 0;
        const totalDue = principal + interest + overdue;
        
        summary.totalDue += totalDue;
        summary.totalPrincipal += principal;
        summary.totalInterest += interest;
        summary.totalOverdue += overdue;
        
        if (loan.overdue_days > 0) {
          summary.avgDaysOverdue += loan.overdue_days;
        }
        
        if (loan.overdue_days > 90) {
          summary.criticalLoans++;
        } else if (loan.overdue_days > 30) {
          summary.warningLoans++;
        }
        
        // Distribution by loan type
        const loanType = loan.loan_types?.type_name || 'Other';
        if (!distributionMap[loanType]) {
          distributionMap[loanType] = { name: loanType, value: 0, count: 0 };
        }
        distributionMap[loanType].value += totalDue;
        distributionMap[loanType].count++;
        
        // Aging buckets
        if (loan.overdue_days === 0) {
          agingBuckets.current.count++;
          agingBuckets.current.amount += totalDue;
        } else if (loan.overdue_days <= 30) {
          agingBuckets['1-30'].count++;
          agingBuckets['1-30'].amount += totalDue;
        } else if (loan.overdue_days <= 60) {
          agingBuckets['31-60'].count++;
          agingBuckets['31-60'].amount += totalDue;
        } else if (loan.overdue_days <= 90) {
          agingBuckets['61-90'].count++;
          agingBuckets['61-90'].amount += totalDue;
        } else {
          agingBuckets['90+'].count++;
          agingBuckets['90+'].amount += totalDue;
        }
      });

      if (loans?.length > 0) {
        summary.avgDaysOverdue = Math.round(summary.avgDaysOverdue / loans.length);
      }

      // Convert distribution map to array
      const distribution = Object.values(distributionMap).sort((a, b) => b.value - a.value);
      
      // Convert aging buckets to array
      const aging = Object.entries(agingBuckets).map(([bucket, data]) => ({
        bucket,
        ...data,
        percentage: summary.totalDue > 0 ? (data.amount / summary.totalDue * 100).toFixed(1) : 0
      }));

      // Generate mock trend data
      const trends = generateTrendData();

      setData({
        summary,
        loans: loans || [],
        trends,
        distribution,
        aging
      });
    } catch (error) {
      console.error('Error fetching due amount data:', error);
      toast.error('Failed to load due amount data');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock trend data
  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      totalDue: 2500000 + (index * 150000) + (Math.random() * 200000),
      overdue: 500000 + (index * 50000) + (Math.random() * 100000),
      nonDue: 2000000 + (index * 100000) + (Math.random() * 150000)
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
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'customer_name') {
        aVal = `${a.customers?.first_name} ${a.customers?.last_name}`;
        bVal = `${b.customers?.first_name} ${b.customers?.last_name}`;
      } else if (sortConfig.key === 'total_due') {
        aVal = (parseFloat(a.outstanding_principal) || 0) + 
               (parseFloat(a.outstanding_interest) || 0) + 
               (parseFloat(a.overdue_amount) || 0);
        bVal = (parseFloat(b.outstanding_principal) || 0) + 
               (parseFloat(b.outstanding_interest) || 0) + 
               (parseFloat(b.overdue_amount) || 0);
      }
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    return filtered;
  }, [data.loans, filters.search, sortConfig]);

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

  // Get status badge
  const getStatusBadge = (overdueDays) => {
    if (overdueDays === 0) {
      return <Badge variant="success">Current</Badge>;
    } else if (overdueDays <= 30) {
      return <Badge variant="warning">1-30 Days</Badge>;
    } else if (overdueDays <= 60) {
      return <Badge variant="warning">31-60 Days</Badge>;
    } else if (overdueDays <= 90) {
      return <Badge variant="destructive">61-90 Days</Badge>;
    }
    return <Badge variant="destructive">90+ Days</Badge>;
  };

  // Export data
  const handleExport = () => {
    // Implementation for export functionality
    toast.success('Export feature coming soon!');
  };

  useEffect(() => {
    fetchData();
  }, [filters.branch, filters.loanType, filters.daysOverdue]);

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
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              {t('details.totalDueAmountTitle', 'Total Due Amount Details')}
            </h1>
            <p className="text-muted-foreground">
              {t('details.totalDueAmountSubtitle', 'Comprehensive view of all due amounts')}
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
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('common.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Due Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(data.summary?.totalDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(data.summary?.loanCount)} loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary?.totalPrincipal)}
            </div>
            <Progress 
              value={(data.summary?.totalPrincipal / data.summary?.totalDue) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary?.totalInterest)}
            </div>
            <Progress 
              value={(data.summary?.totalInterest / data.summary?.totalDue) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary?.totalOverdue)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                {data.summary?.criticalLoans} critical
              </Badge>
              <Badge variant="warning" className="text-xs">
                {data.summary?.warningLoans} warning
              </Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label>Days Overdue</Label>
              <Select value={filters.daysOverdue} onValueChange={(value) => setFilters(prev => ({ ...prev, daysOverdue: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0-30">0-30 Days</SelectItem>
                  <SelectItem value="31-60">31-60 Days</SelectItem>
                  <SelectItem value="61-90">61-90 Days</SelectItem>
                  <SelectItem value="90+">90+ Days</SelectItem>
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
                <CardDescription>Due amount distribution by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.aging.map((bucket) => (
                    <div key={bucket.bucket} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{bucket.bucket} days</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(bucket.amount)} ({bucket.percentage}%)
                        </span>
                      </div>
                      <Progress value={parseFloat(bucket.percentage)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {bucket.count} loans
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribution by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Loan Type</CardTitle>
                <CardDescription>Due amounts across loan products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Due Amount Trends</CardTitle>
              <CardDescription>Monthly progression of due amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="totalDue" 
                    stackId="1"
                    stroke="#E6B800" 
                    fill="#E6B800" 
                    name="Total Due"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="overdue" 
                    stackId="2"
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    name="Overdue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="nonDue" 
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    name="Non-Due"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
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
                        onClick={() => handleSort('outstanding_principal')}
                      >
                        Principal
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('outstanding_interest')}
                      >
                        Interest
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('overdue_amount')}
                      >
                        Overdue
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('total_due')}
                      >
                        Total Due
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('overdue_days')}
                      >
                        Status
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedLoans.map((loan) => {
                      const totalDue = (parseFloat(loan.outstanding_principal) || 0) + 
                                     (parseFloat(loan.outstanding_interest) || 0) + 
                                     (parseFloat(loan.overdue_amount) || 0);
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
                          <TableCell className="text-right">
                            {formatCurrency(loan.outstanding_principal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(loan.outstanding_interest)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(loan.overdue_amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(totalDue)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(loan.overdue_days)}
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
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Loans categorized by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="10%" 
                    outerRadius="80%" 
                    data={[
                      { name: 'Low Risk', value: 35, fill: '#10B981' },
                      { name: 'Medium Risk', value: 45, fill: '#F59E0B' },
                      { name: 'High Risk', value: 20, fill: '#EF4444' }
                    ]}
                  >
                    <RadialBar dataKey="value" />
                    <Legend />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Branch Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
                <CardDescription>Due amounts by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { branch: 'Main', amount: 2500000 },
                    { branch: 'North', amount: 1800000 },
                    { branch: 'South', amount: 1200000 },
                    { branch: 'East', amount: 900000 },
                    { branch: 'West', amount: 600000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#E6B800" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}