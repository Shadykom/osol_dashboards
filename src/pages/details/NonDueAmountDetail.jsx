import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Filter, RefreshCw, TrendingUp, TrendingDown,
  CheckCircle, DollarSign, Calendar, Building2, FileText, ChevronRight,
  Clock, Shield, Award, Info, BarChart3, PieChart, Activity
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
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
  ComposedChart, Scatter
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { toast } from 'sonner';

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'];

export default function NonDueAmountDetail() {
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
    maturityProfile: [],
    performanceMetrics: []
  });
  const [filters, setFilters] = useState({
    branch: searchParams.get('branch') || 'all',
    loanType: 'all',
    maturityRange: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'outstanding_balance', direction: 'desc' });
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Build base query for non-due loans
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
        .eq('loan_status', 'ACTIVE')
        .or('overdue_days.eq.0,overdue_days.is.null');

      // Apply filters
      if (filters.branch && filters.branch !== 'all') {
        query = query.eq('branch_id', filters.branch);
      }
      if (filters.loanType && filters.loanType !== 'all') {
        query = query.eq('loan_type_id', filters.loanType);
      }

      const { data: loansRaw, error } = await query;
      if (error) throw error;

      // Enrich with loan type names via separate query
      const { data: loanTypes } = await supabaseBanking
        .from('loan_types')
        .select('loan_type_id, type_name, type_code');
      const typeById = (loanTypes || []).reduce((m, t) => { m[t.loan_type_id] = t; return m; }, {});

      const loans = (loansRaw || []).map(l => ({ ...l, loan_types: typeById[l.loan_type_id] || null }));

      // Calculate summary statistics
      const summary = {
        totalNonDue: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        loanCount: loans?.length || 0,
        avgInterestRate: 0,
        avgCreditScore: 0,
        healthyLoans: 0,
        onTimePayments: 0,
        avgRemainingTenure: 0
      };

      // Calculate distribution by loan type
      const distributionMap = {};
      
      // Calculate maturity profile
      const maturityBuckets = {
        '0-6': { count: 0, amount: 0 },
        '6-12': { count: 0, amount: 0 },
        '12-24': { count: 0, amount: 0 },
        '24-36': { count: 0, amount: 0 },
        '36+': { count: 0, amount: 0 }
      };

      // Performance metrics
      const performanceMetrics = {
        excellent: 0,
        good: 0,
        average: 0,
        belowAverage: 0
      };

      loans?.forEach(loan => {
        const principal = parseFloat(loan.outstanding_principal) || 0;
        const interest = parseFloat(loan.outstanding_interest) || 0;
        const totalOutstanding = principal + interest;
        
        summary.totalNonDue += totalOutstanding;
        summary.totalPrincipal += principal;
        summary.totalInterest += interest;
        summary.avgInterestRate += parseFloat(loan.interest_rate) || 0;
        
        if (loan.customers?.credit_score) {
          summary.avgCreditScore += loan.customers.credit_score;
        }
        
        // Count healthy loans (no overdue history)
        if (!loan.overdue_days || loan.overdue_days === 0) {
          summary.healthyLoans++;
        }
        
        // Calculate remaining tenure
        if (loan.maturity_date && loan.disbursement_date) {
          const maturityDate = new Date(loan.maturity_date);
          const today = new Date();
          const monthsRemaining = Math.max(0, 
            (maturityDate.getFullYear() - today.getFullYear()) * 12 + 
            (maturityDate.getMonth() - today.getMonth())
          );
          
          summary.avgRemainingTenure += monthsRemaining;
          
          // Maturity buckets
          if (monthsRemaining <= 6) {
            maturityBuckets['0-6'].count++;
            maturityBuckets['0-6'].amount += totalOutstanding;
          } else if (monthsRemaining <= 12) {
            maturityBuckets['6-12'].count++;
            maturityBuckets['6-12'].amount += totalOutstanding;
          } else if (monthsRemaining <= 24) {
            maturityBuckets['12-24'].count++;
            maturityBuckets['12-24'].amount += totalOutstanding;
          } else if (monthsRemaining <= 36) {
            maturityBuckets['24-36'].count++;
            maturityBuckets['24-36'].amount += totalOutstanding;
          } else {
            maturityBuckets['36+'].count++;
            maturityBuckets['36+'].amount += totalOutstanding;
          }
        }
        
        // Distribution by loan type
        const loanType = loan.loan_types?.type_name || 'Other';
        if (!distributionMap[loanType]) {
          distributionMap[loanType] = { name: loanType, value: 0, count: 0 };
        }
        distributionMap[loanType].value += totalOutstanding;
        distributionMap[loanType].count++;
        
        // Performance categorization based on credit score
        const creditScore = loan.customers?.credit_score || 0;
        if (creditScore >= 750) {
          performanceMetrics.excellent++;
        } else if (creditScore >= 650) {
          performanceMetrics.good++;
        } else if (creditScore >= 550) {
          performanceMetrics.average++;
        } else {
          performanceMetrics.belowAverage++;
        }
      });

      // Calculate averages
      if (loans?.length > 0) {
        summary.avgInterestRate = (summary.avgInterestRate / loans.length).toFixed(2);
        summary.avgCreditScore = Math.round(summary.avgCreditScore / loans.length);
        summary.avgRemainingTenure = Math.round(summary.avgRemainingTenure / loans.length);
        summary.onTimePayments = Math.round((summary.healthyLoans / loans.length) * 100);
      }

      // Convert distribution map to array
      const distribution = Object.values(distributionMap).sort((a, b) => b.value - a.value);
      
      // Convert maturity buckets to array
      const maturityProfile = Object.entries(maturityBuckets).map(([range, data]) => ({
        range: range + ' months',
        ...data,
        percentage: summary.totalNonDue > 0 ? (data.amount / summary.totalNonDue * 100).toFixed(1) : 0
      }));

      // Convert performance metrics to array
      const performanceData = [
        { category: 'Excellent (750+)', count: performanceMetrics.excellent, fill: '#10B981' },
        { category: 'Good (650-749)', count: performanceMetrics.good, fill: '#34D399' },
        { category: 'Average (550-649)', count: performanceMetrics.average, fill: '#FCD34D' },
        { category: 'Below Average (<550)', count: performanceMetrics.belowAverage, fill: '#F87171' }
      ];

      // Generate mock trend data
      const trends = generateTrendData();

      setData({
        summary,
        loans: loans || [],
        trends,
        distribution,
        maturityProfile,
        performanceMetrics: performanceData
      });
    } catch (error) {
      console.error('Error fetching non-due amount data:', error);
      toast.error('Failed to load non-due amount data');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock trend data
  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      nonDue: 5000000 + (index * 200000) + (Math.random() * 300000),
      newLoans: 800000 + (Math.random() * 200000),
      repayments: 600000 + (Math.random() * 150000)
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
    
    // Apply maturity range filter
    if (filters.maturityRange !== 'all') {
      filtered = filtered.filter(loan => {
        if (!loan.maturity_date) return false;
        const maturityDate = new Date(loan.maturity_date);
        const today = new Date();
        const monthsRemaining = Math.max(0, 
          (maturityDate.getFullYear() - today.getFullYear()) * 12 + 
          (maturityDate.getMonth() - today.getMonth())
        );
        
        switch (filters.maturityRange) {
          case '0-6': return monthsRemaining <= 6;
          case '6-12': return monthsRemaining > 6 && monthsRemaining <= 12;
          case '12-24': return monthsRemaining > 12 && monthsRemaining <= 24;
          case '24+': return monthsRemaining > 24;
          default: return true;
        }
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'customer_name') {
        aVal = `${a.customers?.first_name} ${a.customers?.last_name}`;
        bVal = `${b.customers?.first_name} ${b.customers?.last_name}`;
      } else if (sortConfig.key === 'outstanding_balance') {
        aVal = (parseFloat(a.outstanding_principal) || 0) + (parseFloat(a.outstanding_interest) || 0);
        bVal = (parseFloat(b.outstanding_principal) || 0) + (parseFloat(b.outstanding_interest) || 0);
      } else if (sortConfig.key === 'credit_score') {
        aVal = a.customers?.credit_score || 0;
        bVal = b.customers?.credit_score || 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    return filtered;
  }, [data.loans, filters.search, filters.maturityRange, sortConfig]);

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

  // Get credit score badge
  const getCreditScoreBadge = (score) => {
    if (!score) return <Badge variant="outline">N/A</Badge>;
    if (score >= 750) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 650) return <Badge className="bg-blue-500">Good</Badge>;
    if (score >= 550) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="destructive">Below Average</Badge>;
  };

  // Export data
  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  useEffect(() => {
    fetchData();
  }, [filters.branch, filters.loanType, filters.maturityRange]);

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
              <CheckCircle className="h-6 w-6 text-green-600" />
              {t('Non-Due Amount Details', 'Non-Due Amount Details')}
            </h1>
            <p className="text-muted-foreground">
              {t('Analysis of performing loans with no overdue', 'Analysis of performing loans with no overdue')}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Non-Due Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary?.totalNonDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(data.summary?.loanCount)} performing loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary?.avgInterestRate}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">Competitive rates</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Credit Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary?.avgCreditScore}
            </div>
            <Progress 
              value={(data.summary?.avgCreditScore / 850) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-Time Payment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary?.onTimePayments}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Award className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">Excellent performance</span>
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
              <Label>Maturity Range</Label>
              <Select value={filters.maturityRange} onValueChange={(value) => setFilters(prev => ({ ...prev, maturityRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranges</SelectItem>
                  <SelectItem value="0-6">0-6 Months</SelectItem>
                  <SelectItem value="6-12">6-12 Months</SelectItem>
                  <SelectItem value="12-24">12-24 Months</SelectItem>
                  <SelectItem value="24+">24+ Months</SelectItem>
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
            {/* Maturity Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Maturity Profile</CardTitle>
                <CardDescription>Outstanding amounts by maturity period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.maturityProfile.map((bucket) => (
                    <div key={bucket.range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{bucket.range}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(bucket.amount)} ({bucket.percentage}%)
                        </span>
                      </div>
                      <Progress value={parseFloat(bucket.percentage)} className="h-2 bg-green-100" />
                      <p className="text-xs text-muted-foreground">
                        {bucket.count} loans
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Score Distribution</CardTitle>
                <CardDescription>Loan portfolio quality assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.performanceMetrics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.performanceMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Trends</CardTitle>
              <CardDescription>Monthly non-due portfolio movement</CardDescription>
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
                    dataKey="nonDue" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    name="Non-Due Amount"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="newLoans" 
                    stroke="#3B82F6" 
                    name="New Loans"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="repayments" 
                    stroke="#F59E0B" 
                    name="Repayments"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Performing Loan Details</CardTitle>
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
                        onClick={() => handleSort('outstanding_balance')}
                      >
                        Outstanding
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('interest_rate')}
                      >
                        Rate
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('emi_amount')}
                      >
                        EMI
                      </TableHead>
                      <TableHead>Maturity</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('credit_score')}
                      >
                        Credit Score
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedLoans.map((loan) => {
                      const outstanding = (parseFloat(loan.outstanding_principal) || 0) + 
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
                          <TableCell className="text-right">
                            {formatCurrency(outstanding)}
                          </TableCell>
                          <TableCell className="text-right">
                            {loan.interest_rate}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(loan.emi_amount)}
                          </TableCell>
                          <TableCell>
                            {loan.maturity_date ? new Date(loan.maturity_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getCreditScoreBadge(loan.customers?.credit_score)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.loan_account_number}`)}
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
            {/* Loan Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Loan Type</CardTitle>
                <CardDescription>Non-due amounts by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.distribution.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Interest Rate Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Interest Rate Analysis</CardTitle>
                <CardDescription>Rate distribution across portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { rate: '0-5%', count: 15, amount: 2000000 },
                    { rate: '5-7%', count: 45, amount: 5500000 },
                    { rate: '7-9%', count: 30, amount: 3500000 },
                    { rate: '9-12%', count: 10, amount: 1000000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rate" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Branch Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Portfolio Quality</CardTitle>
              <CardDescription>Non-due portfolio performance by branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { branch: 'Main', nonDue: 4500000, avgScore: 720 },
                  { branch: 'North', nonDue: 3200000, avgScore: 695 },
                  { branch: 'South', nonDue: 2800000, avgScore: 710 },
                  { branch: 'East', nonDue: 2000000, avgScore: 680 },
                  { branch: 'West', nonDue: 1500000, avgScore: 690 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="nonDue" fill="#10B981" name="Non-Due Amount" />
                  <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#F59E0B" name="Avg Credit Score" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}