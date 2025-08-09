import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import FinancialReportService from '@/services/reports/financialReportService';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import RawDataPanel from '@/components/RawDataPanel';

export default function ProfitMarginDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);

  const load = async () => {
    const svc = new FinancialReportService();
    const now = new Date();
    const months = [];
    const line = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).toISOString();
      const res = await svc.getIncomeStatement(start, end, {});
      months.push(res.period);
      line.push({ month: new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), netMargin: Number(res.metrics.netMargin.toFixed(2)), operatingMargin: Number(res.metrics.operatingMargin.toFixed(2)) });
      if (i === 0) setSummary(res.metrics);
    }
    setSeries(line);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.profitMargin','Profit Margin')}</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>12-Month Margins</CardTitle></CardHeader>
            <CardContent>
              <ChartWidget chartType="line" data={series} xAxisKey="month" yAxisKey="netMargin" height={320} multiLine={{ operatingMargin: { color: '#60A5FA' } }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary">
          <RawDataPanel title="Current Metrics" data={summary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}