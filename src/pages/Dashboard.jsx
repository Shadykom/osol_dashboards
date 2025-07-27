import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useTranslation } from 'react-i18next';
import { formatCurrency as formatCurrencyUtil } from '@/utils/formatters';

// Mock data as fallback
const mockKpis = {
  total_customers: 12847,
  total_accounts: 18293,
  total_deposits: 2400000000, // SAR 2.4B
  total_loans: 1800000000, // SAR 1.8B
  daily_transactions: 8547,
  monthly_revenue: 45200000 // SAR 45.2M
};

const mockRecentTransactions = [
  {
    id: 'TRN20250124_001',
    customer: 'Ahmed Al-Rashid',
    account: '1234567890',
    amount: 'SAR 15,000',
    type: 'Transfer',
    status: 'Completed',
    time: '2 minutes ago'
  },
  {
    id: 'TRN20250124_002',
    customer: 'Fatima Al-Zahra',
    account: '1234567891',
    amount: 'SAR 5,500',
    type: 'Deposit',
    status: 'Pending',
    time: '5 minutes ago'
  },
  {
    id: 'TRN20250124_003',
    customer: 'Mohammed Al-Saud',
    account: '1234567892',
    amount: 'SAR 25,000',
    type: 'Withdrawal',
    status: 'Completed',
    time: '8 minutes ago'
  },
  {
    id: 'TRN20250124_004',
    customer: 'Aisha Al-Mansouri',
    account: '1234567893',
    amount: 'SAR 3,200',
    type: 'Transfer',
    status: 'Failed',
    time: '12 minutes ago'
  }
];

function formatCurrency(amount, currency = 'SAR') {
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

function KPICard({ title, value, change, trend, icon: Icon, description, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold animate-pulse bg-muted h-8 w-24 rounded"></div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
            <span>{description}</span>
            <div className="animate-pulse bg-muted h-4 w-12 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          <div className="flex items-center">
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status, t) {
  const variants = {
    'Completed': 'default',
    'COMPLETED': 'default',
    'Pending': 'secondary',
    'PENDING': 'secondary',
    'Failed': 'destructive',
    'FAILED': 'destructive'
  };
  
  const statusKey = status.toLowerCase();
  return <Badge variant={variants[status] || 'default'}>{t(`common.${statusKey}`)}</Badge>;
}

export function Dashboard() {
  const { t } = useTranslation();
  const { kpis, recentTransactions, loading, error, refreshData } = useDashboard();

  // Use real data if available, otherwise fall back to mock data
  const displayKpis = kpis || mockKpis;
  const displayTransactions = recentTransactions?.length > 0 ? recentTransactions : mockRecentTransactions;

  const kpiData = [
    {
      title: t('dashboard.totalCustomers'),
      value: displayKpis.totalCustomers?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      description: t('customers.activeCustomers')
    },
    {
      title: t('dashboard.activeAccounts'),
      value: displayKpis.totalAccounts?.toLocaleString() || '0',
      change: '+8.2%',
      trend: 'up',
      icon: CreditCard,
      description: t('accounts.totalAccounts')
    },
    {
      title: t('dashboard.totalDeposits'),
      value: formatCurrency(displayKpis.totalDeposits || 0),
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      description: t('dashboard.totalDeposits')
    },
    {
      title: t('dashboard.totalLoans'),
      value: formatCurrency(displayKpis.totalLoans || 0),
      change: '+22.1%',
      trend: 'up',
      icon: TrendingUp,
      description: t('loans.totalLoans')
    },
    {
      title: 'Daily Transactions',
      value: displayKpis.dailyTransactions?.toLocaleString() || '0',
      change: '-2.4%',
      trend: 'down',
      icon: Activity,
      description: 'Today\'s transactions'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(displayKpis.monthlyRevenue || 0),
      change: '+18.7%',
      trend: 'up',
      icon: DollarSign,
      description: 'This month\'s revenue'
    }
  ];

  return (
    <div className="h-full flex flex-col w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('navigation.mainDashboard')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcomeBack')}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <span className="text-sm">⚠️ Database connection error. Showing demo data.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Scrollable Area */}
      <div className="flex-1 overflow-auto w-full">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 mb-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} isLoading={loading} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2 xl:col-span-3 2xl:col-span-4">
            <CardHeader>
              <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
              <CardDescription>
                {t('transactions.transactionHistory')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="animate-pulse bg-muted h-4 w-32 rounded"></div>
                        <div className="animate-pulse bg-muted h-3 w-48 rounded"></div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
                        <div className="animate-pulse bg-muted h-3 w-16 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {transaction.customer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.account} • {transaction.type}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{transaction.amount}</p>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(transaction.status, t)}
                          <span className="text-xs text-muted-foreground">
                            {transaction.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent w-full">
                <div className="space-y-1">
                  <p className="font-medium">Add New Customer</p>
                  <p className="text-xs text-muted-foreground">Register a new customer</p>
                </div>
                <Users className="h-4 w-4" />
              </button>
              
              <button className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent w-full">
                <div className="space-y-1">
                  <p className="font-medium">Open Account</p>
                  <p className="text-xs text-muted-foreground">Create new account</p>
                </div>
                <CreditCard className="h-4 w-4" />
              </button>
              
              <button className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent w-full">
                <div className="space-y-1">
                  <p className="font-medium">Process Transaction</p>
                  <p className="text-xs text-muted-foreground">Manual transaction entry</p>
                </div>
                <Activity className="h-4 w-4" />
              </button>
              
              <button className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent w-full">
                <div className="space-y-1">
                  <p className="font-medium">Generate Report</p>
                  <p className="text-xs text-muted-foreground">Create custom report</p>
                </div>
                <TrendingUp className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

