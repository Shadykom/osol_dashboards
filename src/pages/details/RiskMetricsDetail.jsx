import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { ChartWidget } from '@/components/widgets/ChartWidget';

export default function RiskMetricsDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [npl, setNpl] = useState(0);
  const [buckets, setBuckets] = useState([]);

  const load = async () => {
    const { data: loans } = await supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('loan_status, outstanding_balance');
    const total = (loans || []).reduce((s, l) => s + Number(l.outstanding_balance || 0), 0);
    const defaulted = (loans || []).filter(l => String(l.loan_status).toUpperCase().includes('DEFAULT')).reduce((s, l) => s + Number(l.outstanding_balance || 0), 0);
    setNpl(total > 0 ? Number(((defaulted / total) * 100).toFixed(2)) : 0);

    const { data: delq } = await supabaseBanking.from(TABLES.DELINQUENCIES).select('bucket');
    const map = {};
    (delq || []).forEach(d => {
      const b = d.bucket || 'Unknown';
      map[b] = (map[b] || 0) + 1;
    });
    setBuckets(Object.entries(map).map(([name, value]) => ({ name, value })));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.riskMetrics','Risk Metrics')}</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>NPL Ratio</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{npl}%</div>
              <p className="text-muted-foreground mt-2">Non-Performing Loans as percentage of outstanding balance</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buckets">
          <Card>
            <CardHeader><CardTitle>Delinquency Buckets</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="bar" data={buckets} xAxisKey="name" yAxisKey="value" height={320} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}