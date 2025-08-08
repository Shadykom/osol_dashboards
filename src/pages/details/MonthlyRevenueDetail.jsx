import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ChartWidget } from '@/components/widgets/ChartWidget';

export default function MonthlyRevenueDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [series, setSeries] = useState([]);
  const [byBranch, setByBranch] = useState([]);

  const branch = searchParams.get('branch');

  const load = async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    let tx = supabaseBanking
      .from(TABLES.TRANSACTIONS)
      .select('transaction_amount, transaction_date, branch_id')
      .gte('transaction_date', twelveMonthsAgo.toISOString());
    if (branch && branch !== 'all') tx = tx.eq('branch_id', branch);
    const { data } = await tx;
    const monthMap = {};
    const branchMap = {};
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    (data || []).forEach(r => {
      const d = new Date(r.transaction_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[key]) monthMap[key] = { month: `${names[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, profit: 0 };
      monthMap[key].revenue += Number(r.transaction_amount || 0);
      monthMap[key].profit = monthMap[key].revenue * 0.3;
      const b = r.branch_id || 'Unknown';
      branchMap[b] = (branchMap[b] || 0) + Number(r.transaction_amount || 0);
    });
    setSeries(Object.values(monthMap));
    setByBranch(Object.entries(branchMap).map(([branch, value]) => ({ branch: String(branch), value })).sort((a,b) => b.value - a.value).slice(0,10));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.monthlyRevenue','Monthly Revenue')}</h1>
          <p className="text-muted-foreground">{t('dashboard.monthlyRevenueSubtitle','Revenue and estimated profit by month')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWidget chartType="area" data={series} xAxisKey="month" yAxisKey="revenue" height={320} multiLine={{ profit: { color: '#10B981' } }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Top Branches by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={byBranch} xAxisKey="branch" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}