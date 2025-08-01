import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowUpDown,
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ComparisonWidget } from '@/components/widgets/ComparisonWidget';
import { toast } from 'sonner';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useIsMobile, responsiveClasses } from '@/utils/responsive';
import { useRTLClasses } from '@/components/ui/rtl-wrapper';
import { cn } from '@/lib/utils';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TRANSACTION_TYPES = {
  DEPOSIT: { label: 'Deposit', icon: ArrowDownLeft, color: 'text-green-500' },
  WITHDRAWAL: { label: 'Withdrawal', icon: ArrowUpRight, color: 'text-red-500' },
  TRANSFER: { label: 'Transfer', icon: ArrowUpDown, color: 'text-blue-500' },
  PAYMENT: { label: 'Payment', icon: ArrowUpRight, color: 'text-orange-500' }
};

const TRANSACTION_STATUS = {
  COMPLETED: { label: 'Completed', icon: CheckCircle, color: 'text-green-500', variant: 'success' },
  PENDING: { label: 'Pending', icon: Clock, color: 'text-yellow-500', variant: 'warning' },
  FAILED: { label: 'Failed', icon: XCircle, color: 'text-red-500', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-gray-500', variant: 'secondary' }
};

export function Transactions() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const rtl = useRTLClasses();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    successRate: 0,
    pendingTransactions: 0,
    dailyAverage: 0,
    peakHour: ''
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [transactionTrends, setTransactionTrends] = useState([]);
  const [hourlyDistribution, setHourlyDistribution] = useState([]);
  const [typeDistribution, setTypeDistribution] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchTransactionStats();
    fetchTransactionTrends();
    
    // Set up real-time subscription
    const subscription = supabaseBanking
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'kastle_banking',
        table: 'transactions'
      }, handleRealtimeUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filterStatus, filterType, dateRange]);

  const handleRealtimeUpdate = (payload) => {
    console.log('Real-time update:', payload);
    
    if (payload.eventType === 'INSERT') {
      setTransactions(prev => [payload.new, ...prev]);
      toast.success('New transaction received', {
        description: `Transaction ${payload.new.transaction_reference} added`
      });
    } else if (payload.eventType === 'UPDATE') {
      setTransactions(prev => 
        prev.map(t => t.transaction_id === payload.new.transaction_id ? payload.new : t)
      );
    }
    
    // Refresh stats
    fetchTransactionStats();
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          kastle_banking.accounts!account_number (
            account_number,
            kastle_banking.customers!customer_id (
              first_name,
              last_name
            )
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (filterStatus !== 'all') {
        query = query.eq('transaction_status', filterStatus.toUpperCase());
      }
      
      if (filterType !== 'all') {
        query = query.eq('transaction_type', filterType.toUpperCase());
      }

      if (dateRange.from && dateRange.to) {
        query = query
          .gte('transaction_date', dateRange.from.toISOString())
          .lte('transaction_date', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      // Get total transactions count
      const { count: totalTransactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true });

      // Get completed transactions for success rate
      const { count: completedTransactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .eq('transaction_status', 'COMPLETED');

      // Get pending transactions
      const { count: pendingTransactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .eq('transaction_status', 'PENDING');

      // Get total volume
      const { data: volumeData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .eq('transaction_status', 'COMPLETED');

      const totalVolume = volumeData?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;

      // Calculate success rate
      const successRate = totalTransactions > 0 
        ? ((completedTransactions / totalTransactions) * 100).toFixed(1)
        : 0;

      // Get hourly distribution for peak hour
      const { data: hourlyData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_date')
        .eq('transaction_status', 'COMPLETED')
        .gte('transaction_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const hourCounts = {};
      hourlyData?.forEach(t => {
        const hour = new Date(t.transaction_date).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHour = Object.entries(hourCounts).reduce((a, b) => 
        b[1] > a[1] ? b : a, ['0', 0]
      )[0];

      // Calculate daily average
      const dailyAverage = Math.round(totalTransactions / 30);

      // Get type distribution
      const { data: typeData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_type_id, transaction_types!inner(type_name)')
        .eq('transaction_status', 'COMPLETED');

      const typeCounts = typeData?.reduce((acc, curr) => {
        const type = curr.transaction_types?.type_name || 'OTHER';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const distribution = Object.entries(typeCounts || {}).map(([name, value]) => ({
        name: TRANSACTION_TYPES[name]?.label || name,
        value,
        color: TRANSACTION_TYPES[name]?.color || 'text-gray-500'
      }));

      setTypeDistribution(distribution);

      // Set hourly distribution for chart
      const hourlyChartData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        transactions: hourCounts[i] || 0
      }));
      setHourlyDistribution(hourlyChartData);

      setStats({
        totalTransactions: totalTransactions || 0,
        totalVolume,
        successRate,
        pendingTransactions: pendingTransactions || 0,
        dailyAverage,
        peakHour: `${peakHour}:00`
      });
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      toast.error('Failed to load transaction statistics');
    }
  };

  const fetchTransactionTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const { count, data: volumeData } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('amount', { count: 'exact' })
          .gte('transaction_date', date.toISOString())
          .lt('transaction_date', nextDate.toISOString())
          .eq('transaction_status', 'COMPLETED');

        const volume = volumeData?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;

        trends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          transactions: count || 0,
          volume: volume / 1000 // Convert to thousands
        });
      }

      setTransactionTrends(trends);
    } catch (error) {
      console.error('Error fetching transaction trends:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchTransactionStats(),
      fetchTransactionTrends()
    ]);
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const account = transaction.accounts;
    const customer = account?.customers;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      transaction.transaction_reference?.toLowerCase().includes(searchLower) ||
      account?.account_number?.toLowerCase().includes(searchLower) ||
      customer?.first_name?.toLowerCase().includes(searchLower) ||
      customer?.last_name?.toLowerCase().includes(searchLower) ||
      transaction.description?.toLowerCase().includes(searchLower)
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
    <motion.div variants={itemVariants} whileHover={{ scale: isMobile ? 1 : 1.02 }}>
      <Card className="relative overflow-hidden">
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "pb-2 p-3" : "pb-2"
        )}>
          <CardTitle className={cn(
            "font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>{title}</CardTitle>
          <Icon className={cn(`${color}`, isMobile ? "h-3 w-3" : "h-4 w-4")} />
        </CardHeader>
        <CardContent className={isMobile ? "p-3 pt-0" : ""}>
          <div className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
                {trend > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
              {" "}from yesterday
            </p>
          )}
        </CardContent>
        <motion.div 
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "space-y-4 sm:space-y-6",
        isMobile ? "p-3" : "p-4 sm:p-6"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex justify-between",
        isMobile ? "flex-col gap-3" : "items-center"
      )}>
        <div>
          <h1 className={cn(
            "font-bold tracking-tight",
            isMobile ? "text-xl" : "text-3xl"
          )}>
            {t('transactions.title', 'Transaction Management')}
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground">
              {t('transactions.subtitle', 'Monitor and manage all banking transactions')}
            </p>
          )}
        </div>
        <div className={cn("flex gap-2", rtl.flexRow)}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => toast.info('Export functionality coming soon')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4"
      )}>
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={ArrowUpDown}
          color="text-blue-500"
          trend={8}
          subtitle={`~${stats.dailyAverage} daily avg`}
        />
        <StatCard
          title="Transaction Volume"
          value={`SAR ${(stats.totalVolume / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="text-green-500"
          trend={15}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={CheckCircle}
          color="text-emerald-500"
          subtitle="Completed transactions"
        />
        <StatCard
          title={t('common.pending')}
          value={stats.pendingTransactions.toLocaleString()}
          icon={Clock}
          color="text-yellow-500"
          subtitle={`Peak hour: ${stats.peakHour}`}
        />
      </div>

      {/* Charts Section */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "md:grid-cols-2"
      )}>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Transaction Trends</CardTitle>
              <CardDescription>Daily transaction volume and count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={transactionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="transactions"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Count"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="volume"
                    stroke="#82ca9d"
                    name="Volume (K SAR)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Hourly Distribution</CardTitle>
              <CardDescription>Transaction activity by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison Widget */}
      <motion.div variants={itemVariants}>
        <ComparisonWidget
          title="Transaction Performance Comparison"
          data={{ 
            monthlyComparison: { 
              current_month: { 
                revenue: stats.totalVolume,
                transactions: stats.totalTransactions,
                customers: Math.round(stats.totalTransactions / 3)
              }, 
              previous_month: { 
                revenue: stats.totalVolume * 0.85,
                transactions: Math.round(stats.totalTransactions * 0.85),
                customers: Math.round(stats.totalTransactions / 3 * 0.85)
              } 
            } 
          }}
          comparisonType="month"
        />
      </motion.div>

      {/* Transaction Type Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Types</TabsTrigger>
            {Object.entries(TRANSACTION_TYPES).map(([key, type]) => (
              <TabsTrigger key={key} value={key.toLowerCase()}>
                <type.icon className="h-4 w-4 mr-2" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Real-time transaction monitoring</CardDescription>
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
                        placeholder="Search by reference, account, or description..."
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
                      {Object.entries(TRANSACTION_STATUS).map(([key, status]) => (
                        <SelectItem key={key} value={key.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <status.icon className={`h-4 w-4 ${status.color}`} />
                            {status.label}
                          </div>
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
                      {Object.entries(TRANSACTION_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <type.icon className={`h-4 w-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>

                {/* Transactions Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Loading transactions...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((transaction) => {
                            const type = TRANSACTION_TYPES[transaction.transaction_type];
                            const status = TRANSACTION_STATUS[transaction.transaction_status];
                            
                            return (
                              <motion.tr
                                key={transaction.transaction_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="cursor-pointer hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  {transaction.transaction_reference}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {type && <type.icon className={`h-4 w-4 ${type.color}`} />}
                                    <span>{type?.label || transaction.transaction_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{transaction.accounts?.account_number}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {transaction.accounts?.customers?.first_name} {transaction.accounts?.customers?.last_name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={transaction.transaction_type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}>
                                    {transaction.transaction_type === 'DEPOSIT' ? '+' : '-'}
                                    SAR {parseFloat(transaction.amount).toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status?.variant || 'default'}>
                                    {status && <status.icon className="h-3 w-3 mr-1" />}
                                    {status?.label || transaction.transaction_status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div>{new Date(transaction.transaction_date).toLocaleDateString()}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {new Date(transaction.transaction_date).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    {t('customers.viewDetails')}
                                  </Button>
                                </TableCell>
                              </motion.tr>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}