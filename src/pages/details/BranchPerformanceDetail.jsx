import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ChartWidget } from '@/components/widgets/ChartWidget';

export default function BranchPerformanceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);

  const branchFilter = searchParams.get('branch');

  const load = async () => {
    const { data: branches } = await supabaseBanking.from(TABLES.BRANCHES).select('branch_id, branch_name');
    const rows = [];
    for (const b of branches || []) {
      let accounts = supabaseBanking.from(TABLES.ACCOUNTS).select('current_balance').eq('branch_id', b.branch_id).eq('account_status', 'ACTIVE');
      let customers = supabaseBanking.from(TABLES.CUSTOMERS).select('customer_id').eq('branch_id', b.branch_id).eq('is_active', true);
      const [a, c] = await Promise.all([accounts, customers]);
      const revenue = (a.data || []).reduce((s, x) => s + Number(x.current_balance || 0), 0);
      const count = (c.data || []).length || 0;
      rows.push({ branch: b.branch_name || String(b.branch_id), revenue, customers: count });
    }
    setData(rows.sort((x,y) => y.revenue - x.revenue));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.branchPerformance','Branch Performance')}</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle>Top Branches</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={data.map(x => ({ name: x.branch, value: x.revenue }))} xAxisKey="name" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers">
          <Card>
            <CardHeader><CardTitle>Customers by Branch</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={data.map(x => ({ name: x.branch, value: x.customers }))} xAxisKey="name" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}