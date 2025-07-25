import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  DollarSign,
  Users,
  Activity,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function Accounts() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    totalBalance: 0,
    blockedAccounts: 0,
    dormantAccounts: 0,
    newAccountsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountTrends, setAccountTrends] = useState([]);
  const [accountTypeDistribution, setAccountTypeDistribution] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchAccountStats();
    fetchAccountTrends();
  }, [filterStatus, filterType]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          kastle_banking.customers (
            customer_id,
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('account_status', filterStatus.toUpperCase());
      }
      
      if (filterType !== 'all') {
        query = query.eq('account_type', filterType.toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountStats = async () => {
    try {
      // Get total accounts count
      const { count: totalAccounts } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      // Get active accounts
      const { count: activeAccounts } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'ACTIVE');

      // Get blocked accounts
      const { count: blockedAccounts } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'BLOCKED');

      // Get dormant accounts
      const { count: dormantAccounts } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'DORMANT');

      // Get total balance
      const { data: balanceData } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');

      const totalBalance = balanceData?.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0) || 0;

      // Get new accounts this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newAccountsThisMonth } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get account type distribution
      const { data: typeData } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('account_type')
        .eq('account_status', 'ACTIVE');

      const typeCounts = typeData?.reduce((acc, curr) => {
        acc[curr.account_type] = (acc[curr.account_type] || 0) + 1;
        return acc;
      }, {});

      const distribution = Object.entries(typeCounts || {}).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value
      }));

      setAccountTypeDistribution(distribution);

      setStats({
        totalAccounts: totalAccounts || 0,
        activeAccounts: activeAccounts || 0,
        totalBalance,
        blockedAccounts: blockedAccounts || 0,
        dormantAccounts: dormantAccounts || 0,
        newAccountsThisMonth: newAccountsThisMonth || 0
      });
    } catch (error) {
      console.error('Error fetching account stats:', error);
      toast.error('Failed to load account statistics');
    }
  };

  const fetchAccountTrends = async () => {
    try {
      // Get account creation trends for the last 6 months
      const trends = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        const { count } = await supabase
          .from(TABLES.ACCOUNTS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        trends.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          accounts: count || 0
        });
      }

      setAccountTrends(trends);
    } catch (error) {
      console.error('Error fetching account trends:', error);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const customer = account.customers;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      account.account_number?.toLowerCase().includes(searchLower) ||
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

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
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
          <h1 className="text-3xl font-bold tracking-tight">Accounts Management</h1>
          <p className="text-muted-foreground">Manage and monitor all bank accounts</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('New account functionality coming soon')}>
          <Plus className="h-4 w-4" />
          Open New Account
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={stats.totalAccounts.toLocaleString()}
          icon={CreditCard}
          color="text-blue-500"
          trend={12}
        />
        <StatCard
          title="Active Accounts"
          value={stats.activeAccounts.toLocaleString()}
          icon={Activity}
          color="text-green-500"
          trend={8}
        />
        <StatCard
          title="Total Balance"
          value={`SAR ${(stats.totalBalance / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="text-purple-500"
          trend={15}
        />
        <StatCard
          title="Blocked Accounts"
          value={stats.blockedAccounts.toLocaleString()}
          icon={Lock}
          color="text-red-500"
          trend={-5}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Account Growth Trend</CardTitle>
              <CardDescription>New accounts opened over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accountTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="accounts" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Account Type Distribution</CardTitle>
              <CardDescription>Distribution of active accounts by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accountTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accountTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison Widget */}
      <motion.div variants={itemVariants}>
        <ComparisonWidget
          title="Monthly Account Comparison"
          data={{ monthlyComparison: { current_month: stats, previous_month: stats } }}
          comparisonType="month"
        />
      </motion.div>

      {/* Accounts Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Accounts</CardTitle>
                <CardDescription>Complete list of bank accounts</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info('Export functionality coming soon')}>
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
                    placeholder="Search by account number, name, or email..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading accounts...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.account_id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{account.account_number}</TableCell>
                        <TableCell>
                          {account.customers ? 
                            `${account.customers.first_name} ${account.customers.last_name}` : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {account.account_type?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>SAR {parseFloat(account.current_balance).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              account.account_status === 'ACTIVE' ? 'success' :
                              account.account_status === 'BLOCKED' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {account.account_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(account.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            {t('customers.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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