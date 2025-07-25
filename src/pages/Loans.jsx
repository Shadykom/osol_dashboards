import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatCurrency as formatCurrencyUtil, formatDate } from '@/utils/formatters';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { 
  PiggyBank,
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  Plus,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calculator,
  Calendar,
  Percent
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase, TABLES } from '@/lib/supabase';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  RadialBarChart,
  RadialBar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const LOAN_STATUS = {
  PENDING: { label: 'Pending', color: 'text-yellow-500', variant: 'warning' },
  APPROVED: { label: 'Approved', color: 'text-blue-500', variant: 'default' },
  DISBURSED: { label: 'Disbursed', color: 'text-green-500', variant: 'success' },
  ACTIVE: { label: 'Active', color: 'text-emerald-500', variant: 'success' },
  OVERDUE: { label: 'Overdue', color: 'text-red-500', variant: 'destructive' },
  CLOSED: { label: 'Closed', color: 'text-gray-500', variant: 'secondary' },
  DEFAULTED: { label: 'Defaulted', color: 'text-red-700', variant: 'destructive' }
};

const LOAN_TYPES = {
  PERSONAL: { label: 'Personal Loan', icon: Users },
  MORTGAGE: { label: 'Mortgage', icon: FileText },
  AUTO: { label: 'Auto Loan', icon: FileText },
  BUSINESS: { label: 'Business Loan', icon: FileText },
  EDUCATION: { label: 'Education Loan', icon: FileText }
};

export function Loans() {
  const { t } = useTranslation();
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalPortfolio: 0,
    overdueLoans: 0,
    disbursedThisMonth: 0,
    averageInterestRate: 0,
    collectionRate: 0,
    nplRatio: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loanTrends, setLoanTrends] = useState([]);
  const [loanTypeDistribution, setLoanTypeDistribution] = useState([]);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [portfolioHealth, setPortfolioHealth] = useState([]);

  useEffect(() => {
    fetchLoans();
    fetchLoanStats();
    fetchLoanTrends();
    fetchPortfolioHealth();
  }, [filterStatus, filterType]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          *,
          customers (
            customer_id,
            first_name,
            last_name,
            email,
            phone_number,
            credit_score
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('loan_status', filterStatus.toUpperCase());
      }
      
      if (filterType !== 'all') {
        query = query.eq('loan_type', filterType.toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanStats = async () => {
    try {
      // Get total loans count
      const { count: totalLoans } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      // Get active loans
      const { count: activeLoans } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      // Get overdue loans
      const { count: overdueLoans } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('loan_status', 'OVERDUE');

      // Get total portfolio value
      const { data: portfolioData } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance')
        .in('loan_status', ['ACTIVE', 'DISBURSED', 'OVERDUE']);

      const totalPortfolio = portfolioData?.reduce((sum, loan) => 
        sum + parseFloat(loan.outstanding_balance || 0), 0) || 0;

      // Get disbursed this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: disbursedData } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('loan_amount')
        .eq('loan_status', 'DISBURSED')
        .gte('disbursement_date', startOfMonth.toISOString());

      const disbursedThisMonth = disbursedData?.reduce((sum, loan) => 
        sum + parseFloat(loan.loan_amount || 0), 0) || 0;

      // Calculate average interest rate
      const { data: interestData } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('interest_rate')
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      const averageInterestRate = interestData?.length > 0
        ? interestData.reduce((sum, loan) => sum + parseFloat(loan.interest_rate || 0), 0) / interestData.length
        : 0;

      // Calculate NPL ratio (Non-Performing Loans)
      const { count: defaultedLoans } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .in('loan_status', ['OVERDUE', 'DEFAULTED']);

      const nplRatio = activeLoans > 0 
        ? ((defaultedLoans / activeLoans) * 100).toFixed(2)
        : 0;

      // Calculate collection rate (mock calculation)
      const collectionRate = 85 + Math.random() * 10; // Mock 85-95%

      // Get loan type distribution
      const { data: typeData } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('loan_type, outstanding_balance')
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      const typeCounts = typeData?.reduce((acc, curr) => {
        if (!acc[curr.loan_type]) {
          acc[curr.loan_type] = { count: 0, value: 0 };
        }
        acc[curr.loan_type].count += 1;
        acc[curr.loan_type].value += parseFloat(curr.outstanding_balance || 0);
        return acc;
      }, {});

      const distribution = Object.entries(typeCounts || {}).map(([name, data]) => ({
        name: LOAN_TYPES[name]?.label || name,
        value: data.value,
        count: data.count
      }));

      setLoanTypeDistribution(distribution);

      setStats({
        totalLoans: totalLoans || 0,
        activeLoans: activeLoans || 0,
        totalPortfolio,
        overdueLoans: overdueLoans || 0,
        disbursedThisMonth,
        averageInterestRate: averageInterestRate.toFixed(2),
        collectionRate: collectionRate.toFixed(1),
        nplRatio
      });
    } catch (error) {
      console.error('Error fetching loan stats:', error);
      toast.error('Failed to load loan statistics');
    }
  };

  const fetchLoanTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        const { data: disbursedData } = await supabase
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount')
          .gte('disbursement_date', date.toISOString())
          .lt('disbursement_date', nextMonth.toISOString());

        const disbursed = disbursedData?.reduce((sum, loan) => 
          sum + parseFloat(loan.loan_amount || 0), 0) || 0;

        const { count: applications } = await supabase
          .from(TABLES.LOAN_ACCOUNTS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        trends.push({
          month: formatDate(date, { month: 'short' }),
          disbursed: disbursed / 1000000, // Convert to millions
          applications: applications || 0
        });
      }

      setLoanTrends(trends);
    } catch (error) {
      console.error('Error fetching loan trends:', error);
    }
  };

  const fetchPortfolioHealth = async () => {
    try {
      // Mock portfolio health data
      const healthData = [
        { name: 'Performing', value: 85, fill: '#00C49F' },
        { name: 'Watch List', value: 10, fill: '#FFBB28' },
        { name: 'Non-Performing', value: 5, fill: '#FF8042' }
      ];
      
      setPortfolioHealth(healthData);
    } catch (error) {
      console.error('Error fetching portfolio health:', error);
    }
  };

  const filteredLoans = loans.filter(loan => {
    const customer = loan.customers;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      loan.loan_account_number?.toLowerCase().includes(searchLower) ||
      customer?.first_name?.toLowerCase().includes(searchLower) ||
      customer?.last_name?.toLowerCase().includes(searchLower) ||
      customer?.email?.toLowerCase().includes(searchLower)
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
                {trend > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
              {" "}from last month
            </p>
          )}
        </CardContent>
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`} />
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground">Monitor loan portfolio and applications</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Loan Application
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio"
          value={`SAR ${(stats.totalPortfolio / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="text-blue-500"
          trend={12}
        />
        <StatCard
          title="Active Loans"
                      value={formatNumber(stats.activeLoans)}
          icon={PiggyBank}
          color="text-green-500"
          subtitle={`${stats.totalLoans} total loans`}
          trend={8}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={CheckCircle}
          color="text-emerald-500"
          subtitle="This month"
        />
        <StatCard
          title="NPL Ratio"
          value={`${stats.nplRatio}%`}
          icon={AlertCircle}
          color="text-red-500"
          subtitle={`${stats.overdueLoans} overdue`}
          trend={-2}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disbursed This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                SAR {(stats.disbursedThisMonth / 1000000).toFixed(2)}M
              </div>
              <Progress value={75} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">75% of monthly target</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Interest Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageInterestRate}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Across all loan types</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={80}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={portfolioHealth}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#00C49F" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Loan Disbursement Trends</CardTitle>
              <CardDescription>Monthly disbursements and applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={loanTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="disbursed"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Disbursed (SAR M)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="applications"
                    stroke="#82ca9d"
                    name="Applications"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Loan Type Distribution</CardTitle>
              <CardDescription>Portfolio breakdown by loan type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `SAR ${(value / 1000000).toFixed(1)}M`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison Widget */}
      <motion.div variants={itemVariants}>
        <ComparisonWidget
          title="Loan Portfolio Comparison"
          data={{ 
            monthlyComparison: { 
              current_month: { 
                revenue: stats.totalPortfolio,
                transactions: stats.activeLoans,
                customers: stats.activeLoans,
                deposits: stats.disbursedThisMonth
              }, 
              previous_month: { 
                revenue: stats.totalPortfolio * 0.9,
                transactions: Math.round(stats.activeLoans * 0.92),
                customers: Math.round(stats.activeLoans * 0.92),
                deposits: stats.disbursedThisMonth * 0.85
              } 
            } 
          }}
          comparisonType="month"
        />
      </motion.div>

      {/* Loans Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Loan Applications</CardTitle>
                <CardDescription>Recent loan applications and active loans</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by loan number, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(LOAN_STATUS).map(([key, status]) => (
                    <SelectItem key={key} value={key.toLowerCase()}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(LOAN_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key.toLowerCase()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading loans...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No loans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => {
                      const status = LOAN_STATUS[loan.loan_status];
                      const nextPayment = loan.next_payment_date 
                        ? new Date(loan.next_payment_date)
                        : null;
                      const isOverdue = nextPayment && nextPayment < new Date();
                      
                      return (
                        <TableRow key={loan.loan_account_id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{loan.loan_account_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {loan.customers ? 
                                  `${loan.customers.first_name} ${loan.customers.last_name}` : 
                                  'N/A'
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Score: {loan.customers?.credit_score || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {LOAN_TYPES[loan.loan_type]?.label || loan.loan_type}
                            </Badge>
                          </TableCell>
                                                        <TableCell>SAR {formatNumber(parseFloat(loan.loan_amount))}</TableCell>
                          <TableCell>
                            <div>
                                                              <div>SAR {formatNumber(parseFloat(loan.outstanding_balance))}</div>
                              <Progress 
                                value={((loan.loan_amount - loan.outstanding_balance) / loan.loan_amount) * 100} 
                                className="w-20 h-2 mt-1"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{loan.interest_rate}%</TableCell>
                          <TableCell>
                            <Badge variant={status?.variant || 'default'}>
                              {status?.label || loan.loan_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {nextPayment ? (
                              <div className={isOverdue ? 'text-red-500' : ''}>
                                                                  <div><ClientOnly fallback="--/--/----">{formatDate(nextPayment)}</ClientOnly></div>
                                <div className="text-sm">
                                  SAR {formatNumber(parseFloat(loan.monthly_payment || 0))}
                                </div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              {t('customers.viewDetails')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}