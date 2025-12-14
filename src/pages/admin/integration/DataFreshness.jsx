/**
 * Data Freshness Page
 * EPIC 5 - Monitor data freshness across datasets
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock,
  Database, Activity, TrendingUp
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const DataFreshness = () => {
  const { t } = useTranslation();
  const [freshness, setFreshness] = useState([]);
  const [summary, setSummary] = useState(null);
  const [overallHealth, setOverallHealth] = useState('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreshness();
    // Refresh every 30 seconds
    const interval = setInterval(loadFreshness, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFreshness = async () => {
    try {
      const res = await fetch(`${API_BASE}/integration/freshness`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setFreshness(data.data || []);
        setSummary(data.meta?.summary || {});
        setOverallHealth(data.meta?.overallHealth || 'unknown');
      }
    } catch (error) {
      console.error('Error loading freshness:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthBg = (health) => {
    switch (health) {
      case 'healthy': return 'bg-green-50 dark:bg-green-900/20';
      case 'degraded': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'degraded': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'critical': return <XCircle className="w-8 h-8 text-red-500" />;
      default: return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getFreshnessStatus = (status) => {
    const configs = {
      fresh: { color: 'text-green-600', bg: 'bg-green-100', label: 'Fresh' },
      aging: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Aging' },
      stale: { color: 'text-red-600', bg: 'bg-red-100', label: 'Stale' },
      never: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Never Synced' },
    };
    return configs[status] || configs.never;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Never';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Freshness</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor data synchronization status across all datasets
          </p>
        </div>
        <Button onClick={loadFreshness} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Health */}
      <Card className={getHealthBg(overallHealth)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {getHealthIcon(overallHealth)}
            <div>
              <h2 className={`text-2xl font-bold capitalize ${getHealthColor(overallHealth)}`}>
                {overallHealth === 'unknown' ? 'No Data' : overallHealth}
              </h2>
              <p className="text-gray-600">Overall system health</p>
            </div>
            <div className="ml-auto grid grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{summary?.fresh || 0}</p>
                <p className="text-sm text-gray-500">Fresh</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{summary?.aging || 0}</p>
                <p className="text-sm text-gray-500">Aging</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{summary?.stale || 0}</p>
                <p className="text-sm text-gray-500">Stale</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-600">{summary?.never || 0}</p>
                <p className="text-sm text-gray-500">Never Synced</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['PARTY', 'CONTRACT', 'CHARGE'].map(dataset => {
          const datasetItems = freshness.filter(f => f.dataset === dataset);
          const latestItem = datasetItems.sort((a, b) => 
            new Date(b.last_success_at || 0) - new Date(a.last_success_at || 0)
          )[0];
          
          const status = latestItem?.freshness_status || 'never';
          const statusConfig = getFreshnessStatus(status);
          
          return (
            <Card key={dataset} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {dataset}
                  </CardTitle>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Success:</span>
                    <span className="font-medium">
                      {formatDuration(latestItem?.seconds_since_success)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Record Count:</span>
                    <span className="font-medium">
                      {latestItem?.record_count?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Duration:</span>
                    <span className="font-medium">
                      {latestItem?.average_run_duration_ms 
                        ? `${(latestItem.average_run_duration_ms / 1000).toFixed(1)}s`
                        : '-'}
                    </span>
                  </div>
                  {datasetItems.length > 1 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {datasetItems.length} source systems
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Detailed Status
          </CardTitle>
          <CardDescription>
            Freshness status by dataset and source system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                <TableHead>Source System</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Success</TableHead>
                <TableHead>Last Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freshness.map(item => {
                const statusConfig = getFreshnessStatus(item.freshness_status);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.dataset}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.source_system_name}</p>
                        <p className="text-xs text-gray-500">{item.source_system_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDuration(item.seconds_since_success)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.last_success_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.last_status && (
                        <Badge variant={
                          item.last_status === 'success' ? 'default' :
                          item.last_status === 'partial' ? 'secondary' :
                          'destructive'
                        }>
                          {item.last_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.record_count?.toLocaleString() || '-'}
                    </TableCell>
                    <TableCell>
                      {item.average_run_duration_ms 
                        ? `${(item.average_run_duration_ms / 1000).toFixed(1)}s`
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {freshness.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No freshness data available. Run an ingestion to populate this data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataFreshness;
