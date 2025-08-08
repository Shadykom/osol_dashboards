import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';

function Stat({ title, value, change, trend, description }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {typeof change !== 'undefined' && (
            <Badge variant={trend === 'down' ? 'destructive' : 'default'} className="flex items-center gap-1">
              {trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {change}%
            </Badge>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function TotalAssetsDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState({ total: 0, deposits: 0, loans: 0, change: 0, trend: 'stable' });
  const [breakdownByType, setBreakdownByType] = useState({});
  const [breakdownByBranch, setBreakdownByBranch] = useState({});
  const [trendSeries, setTrendSeries] = useState([]);

  const branchFilter = searchParams.get('branch') || null;

  const formatCurrency = (v) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(Number(v || 0));

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Accounts and loans current balances
      let accountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance, account_status, branch_id, account_types!inner(type_name, account_category)')
        .eq('account_status', 'ACTIVE');
      let loansQuery = supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance, loan_status, branch_id, loan_types!inner(type_name)')
        .in('loan_status', ['ACTIVE','DISBURSED']);
      if (branchFilter && branchFilter !== 'all') {
        accountsQuery = accountsQuery.eq('branch_id', branchFilter);
        loansQuery = loansQuery.eq('branch_id', branchFilter);
      }
      const [{ data: accounts }, { data: loans }] = await Promise.all([accountsQuery, loansQuery]);

      const totalDeposits = (accounts || []).reduce((s, a) => s + Number(a.current_balance || 0), 0);
      const totalLoans = (loans || []).reduce((s, l) => s + Number(l.outstanding_balance || 0), 0);
      const total = totalDeposits + totalLoans;

      // Previous period approximation: 30 days ago snapshot
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let prevAccQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance, branch_id, account_status')
        .lte('created_at', thirtyDaysAgo.toISOString())
        .eq('account_status', 'ACTIVE');
      let prevLoanQuery = supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance, branch_id, loan_status')
        .lte('disbursement_date', thirtyDaysAgo.toISOString())
        .in('loan_status', ['ACTIVE','DISBURSED']);
      if (branchFilter && branchFilter !== 'all') {
        prevAccQuery = prevAccQuery.eq('branch_id', branchFilter);
        prevLoanQuery = prevLoanQuery.eq('branch_id', branchFilter);
      }
      const [{ data: prevAcc }, { data: prevLoans }] = await Promise.all([prevAccQuery, prevLoanQuery]);
      const prevTotal = (prevAcc || []).reduce((s, a) => s + Number(a.current_balance || 0), 0) + (prevLoans || []).reduce((s, l) => s + Number(l.outstanding_balance || 0), 0);
      const change = prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : 0;
      const trend = Number(change) > 0 ? 'up' : Number(change) < 0 ? 'down' : 'stable';

      // Breakdown by account and loan types
      const byType = {};
      (accounts || []).forEach(a => {
        const key = a.account_types?.type_name || 'Other';
        byType[key] = (byType[key] || 0) + Number(a.current_balance || 0);
      });
      (loans || []).forEach(l => {
        const key = l.loan_types?.type_name || 'Loan';
        byType[key] = (byType[key] || 0) + Number(l.outstanding_balance || 0);
      });

      // Breakdown by branch
      const byBranch = {};
      (accounts || []).forEach(a => {
        const key = a.branch_id || 'Unknown';
        byBranch[key] = (byBranch[key] || 0) + Number(a.current_balance || 0);
      });
      (loans || []).forEach(l => {
        const key = l.branch_id || 'Unknown';
        byBranch[key] = (byBranch[key] || 0) + Number(l.outstanding_balance || 0);
      });

      // Trend series: last 6 months estimated from transactions sums (fallback)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      let txQuery = supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount, transaction_date, branch_id')
        .gte('transaction_date', sixMonthsAgo.toISOString());
      if (branchFilter && branchFilter !== 'all') txQuery = txQuery.eq('branch_id', branchFilter);
      const { data: tx } = await txQuery;
      const monthly = {};
      (tx || []).forEach(t => {
        const d = new Date(t.transaction_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthly[key]) monthly[key] = { month: `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`, assets: 0 };
        monthly[key].assets += Number(t.transaction_amount || 0);
      });
      const trendArr = Object.values(monthly).slice(-6);

      setOverview({ total, deposits: totalDeposits, loans: totalLoans, change, trend });
      setBreakdownByType(byType);
      setBreakdownByBranch(byBranch);
      setTrendSeries(trendArr);
    } catch (e) {
      console.error('TotalAssetsDetail load error', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.totalAssets', 'Total Assets')}</h1>
          <p className="text-muted-foreground">{t('dashboard.totalAssetsSubtitle', 'Detailed breakdown of deposits and loans')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat title={t('dashboard.total', 'Total')} value={formatCurrency(overview.total)} change={overview.change} trend={overview.trend} />
            <Stat title={t('dashboard.deposits', 'Deposits')} value={formatCurrency(overview.deposits)} />
            <Stat title={t('dashboard.loans', 'Loans')} value={formatCurrency(overview.loans)} />
            <Stat title={t('dashboard.accounts', 'Accounts')} value={(overview.deposits && overview.loans) ? '—' : '—'} description={t('dashboard.accountsNote','Balances include active accounts and loans')}/>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="h-4 w-4" /> {t('dashboard.byType','By Type')}</CardTitle>
                <CardDescription>{t('dashboard.productsAndAccounts','Account and loan types')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  chartType="pie"
                  data={Object.entries(breakdownByType).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> {t('dashboard.byBranch','By Branch')}</CardTitle>
                <CardDescription>{t('dashboard.topBranches','Top branches by assets')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  chartType="bar"
                  data={Object.entries(breakdownByBranch).map(([name, value]) => ({ name: String(name), value }))}
                  xAxisKey="name"
                  yAxisKey="value"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.assetTrend','Asset Trend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWidget chartType="area" data={trendSeries} xAxisKey="month" yAxisKey="assets" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}