import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ChartWidget } from '@/components/widgets/ChartWidget';

export default function TransactionVolumeDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [daily, setDaily] = useState([]);
  const [byType, setByType] = useState([]);

  const branch = searchParams.get('branch');

  const load = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 30);
    let tx = supabaseBanking
      .from(TABLES.TRANSACTIONS)
      .select('transaction_amount, transaction_date, transaction_type_id, branch_id, transaction_types!inner(type_name)')
      .gte('transaction_date', daysAgo.toISOString());
    if (branch && branch !== 'all') tx = tx.eq('branch_id', branch);
    const { data } = await tx;
    const byDay = {};
    const types = {};
    (data || []).forEach(r => {
      const d = new Date(r.transaction_date);
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      if (!byDay[key]) byDay[key] = { day: d.toLocaleDateString(), volume: 0, count: 0 };
      byDay[key].volume += Number(r.transaction_amount || 0);
      byDay[key].count += 1;
      const tname = r.transaction_types?.type_name || String(r.transaction_type_id);
      types[tname] = (types[tname] || 0) + 1;
    });
    setDaily(Object.values(byDay));
    setByType(Object.entries(types).map(([name,value]) => ({ name, value })).sort((a,b)=>b.value-a.value));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.transactionVolume','Transaction Volume')}</h1>
          <p className="text-muted-foreground">{t('dashboard.transactionVolumeSubtitle','Counts and volumes by day and type')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Last 30 Days</TabsTrigger>
          <TabsTrigger value="types">By Type</TabsTrigger>
        </TabsList>
        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>Daily Volume</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="line" data={daily} xAxisKey="day" yAxisKey="volume" height={320} multiLine={{ count: { color: '#64748B' } }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types">
          <Card>
            <CardHeader><CardTitle>Transactions by Type</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={byType} xAxisKey="name" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}