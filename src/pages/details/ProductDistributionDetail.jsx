import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ChartWidget } from '@/components/widgets/ChartWidget';

export default function ProductDistributionDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);

  const branch = searchParams.get('branch');

  const load = async () => {
    let q = supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('product_type, outstanding_balance, branch_id').eq('loan_status','ACTIVE');
    if (branch && branch !== 'all') q = q.eq('branch_id', branch);
    const { data: loans } = await q;
    const map = {};
    (loans || []).forEach(l => {
      const key = l.product_type || 'Other';
      map[key] = (map[key] || 0) + Number(l.outstanding_balance || 0);
    });
    setData(Object.entries(map).map(([name, value]) => ({ name, value }))); 
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.productDistribution','Product Distribution')}</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>
      <Tabs defaultValue="pie">
        <TabsList>
          <TabsTrigger value="pie">Pie</TabsTrigger>
          <TabsTrigger value="bar">Bar</TabsTrigger>
        </TabsList>
        <TabsContent value="pie">
          <Card>
            <CardHeader><CardTitle>Share by Product</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="pie" data={data} dataKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bar">
          <Card>
            <CardHeader><CardTitle>Amounts by Product</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={data} xAxisKey="name" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}