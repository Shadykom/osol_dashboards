// Detailed widget page
//
// Displays a breakdown, trends and raw data view for an individual widget.  In
// this skeleton we provide a structure matching the documented interface but
// omit the real data fetching.  You can fill in your own fetch logic using
// the enhancedDashboardDetailsService and pass it into the useCachedData
// hook.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download, RefreshCw, Printer } from '../lucide-react.js';

const DashboardDetail = () => {
  const { section, widgetId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailData, setDetailData] = useState({
    overview: null,
    breakdown: null,
    trends: null,
    raw: null,
    metadata: { title: 'Detail' }
  });
  const [loading, setLoading] = useState(true);

  // Fetch dummy data on mount.  Replace with real service call.
  useEffect(() => {
    setTimeout(() => {
      setDetailData({
        overview: { totalAssets: 10000000, totalDeposits: 6000000 },
        breakdown: { byBranch: { 'Main': 7000000, 'East': 3000000 } },
        trends: [
          { date: '2025-07-25', value: 9000000 },
          { date: '2025-07-26', value: 9500000 },
          { date: '2025-07-27', value: 10000000 }
        ],
        raw: [],
        metadata: { title: `${section} – ${widgetId}`, filters: {} }
      });
      setLoading(false);
    }, 1000);
  }, [section, widgetId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{detailData?.metadata?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Detailed analytics and insights
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={() => setLoading(true)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <pre>{JSON.stringify(detailData.overview, null, 2)}</pre>
        </TabsContent>
        <TabsContent value="breakdown">
          <pre>{JSON.stringify(detailData.breakdown, null, 2)}</pre>
        </TabsContent>
          <TabsContent value="trends">
          <pre>{JSON.stringify(detailData.trends, null, 2)}</pre>
        </TabsContent>
        <TabsContent value="data">
          <pre>{JSON.stringify(detailData.raw, null, 2)}</pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardDetail;