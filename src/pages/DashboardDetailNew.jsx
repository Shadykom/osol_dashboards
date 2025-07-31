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
import { ArrowLeft, Download, RefreshCw, Printer } from 'lucide-react';
import { enhancedDashboardDetailsService } from '../services/enhancedDashboardDetailsService';
import { useFilters } from '../contexts/FilterContext';

const DashboardDetailNew = () => {
  const { section, widgetId } = useParams();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailData, setDetailData] = useState({
    overview: null,
    breakdown: null,
    trends: null,
    raw: null,
    metadata: { title: 'Detail' }
  });
  const [loading, setLoading] = useState(true);

  // Fetch data on mount or when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await enhancedDashboardDetailsService.getWidgetDetails(
          section,
          widgetId,
          filters
        );
        if (result.success) {
          setDetailData(result.data);
        }
      } catch (error) {
        console.error('Error fetching widget details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [section, widgetId, filters]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format = 'csv') => {
    const result = await enhancedDashboardDetailsService.exportWidgetData(
      section,
      widgetId,
      filters,
      format
    );
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // Re-fetch data
    const fetchData = async () => {
      try {
        const result = await enhancedDashboardDetailsService.getWidgetDetails(
          section,
          widgetId,
          filters
        );
        if (result.success) {
          setDetailData(result.data);
        }
      } catch (error) {
        console.error('Error fetching widget details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
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
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(detailData.overview, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(detailData.breakdown, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(detailData.trends, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(detailData.raw, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardDetailNew;