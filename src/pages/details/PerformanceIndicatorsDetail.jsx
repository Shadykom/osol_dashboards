import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip } from 'recharts';

export default function PerformanceIndicatorsDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState(null);

  const branch = searchParams.get('branch');

  const load = async () => {
    // Fetch totals similar to dashboard widget
    let revenueQuery = supabaseBanking.from(TABLES.ACCOUNTS).select('current_balance').eq('account_status','ACTIVE');
    let customerQuery = supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }).eq('is_active', true);
    let loanQuery = supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('outstanding_balance').eq('loan_status','ACTIVE');
    let txQuery = supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true });
    let accountsCount = supabaseBanking.from(TABLES.ACCOUNTS).select('*', { count: 'exact', head: true }).eq('account_status','ACTIVE');
    if (branch && branch !== 'all') {
      revenueQuery = revenueQuery.eq('branch_id', branch);
      customerQuery = customerQuery.eq('branch_id', branch);
      loanQuery = loanQuery.eq('branch_id', branch);
      txQuery = txQuery.eq('branch_id', branch);
      accountsCount = accountsCount.eq('branch_id', branch);
    }
    const [rev, cust, loan, tx, acc] = await Promise.all([revenueQuery, customerQuery, loanQuery, txQuery, accountsCount]);
    const revenue = (rev.data || []).reduce((s, a) => s + Number(a.current_balance || 0), 0);
    const customers = cust.count || 0;
    const loans = (loan.data || []).reduce((s, l) => s + Number(l.outstanding_balance || 0), 0);
    const transactions = tx.count || 0;
    const accounts = acc.count || 0;

    const max = { revenue: 50000000, customers: 1000, loans: 10000000, transactions: 10000, accounts: 1000 };
    const chart = [
      { metric: 'Revenue', score: Math.min((revenue / max.revenue) * 150, 150) },
      { metric: 'Customers', score: Math.min((customers / max.customers) * 150, 150) },
      { metric: 'Transactions', score: Math.min((transactions / max.transactions) * 150, 150) },
      { metric: 'Loans', score: Math.min((loans / max.loans) * 150, 150) },
      { metric: 'Accounts', score: Math.min((accounts / max.accounts) * 150, 150) },
    ];
    setMetrics({ revenue, customers, loans, transactions, accounts, chart });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.performanceIndicators','Performance Indicators')}</h1>
          <p className="text-muted-foreground">{t('dashboard.performanceIndicatorsSubtitle','Radar of core KPIs with context')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Radar</CardTitle>
              <CardDescription>Scaled to 0-150</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={metrics?.chart || []}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0,150]} />
                    <Radar dataKey="score" stroke="#E6B800" fill="#E6B800" fillOpacity={0.5} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw">
          <Card>
            <CardHeader><CardTitle>Raw Metrics</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">{JSON.stringify(metrics, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}