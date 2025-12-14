/**
 * Run Detail Page
 * EPIC 5 - View details of a specific ingestion run
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft, Download, CheckCircle, XCircle, AlertCircle, 
  Clock, FileText, RefreshCw, SkipForward, Edit
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const RunDetail = () => {
  const { id } = useParams();
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [_reconciliation, setReconciliation] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [itemsPagination, setItemsPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const loadRunDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/integration/runs/${id}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setRun(data.data?.run);
        setReconciliation(data.data?.reconciliation);
      }
    } catch (error) {
      console.error('Error loading run details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const params = new URLSearchParams();
      if (outcomeFilter) params.append('outcome', outcomeFilter);
      params.append('limit', itemsPagination.limit);
      params.append('offset', itemsPagination.offset);

      const res = await fetch(`${API_BASE}/integration/runs/${id}/items?${params}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
        setItemsPagination(prev => ({ ...prev, total: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadRunDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, outcomeFilter, itemsPagination.offset]);

  const downloadErrorsCsv = async () => {
    try {
      const res = await fetch(`${API_BASE}/integration/runs/${id}/errors/csv`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `errors-${id}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      success: { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle },
      partial: { color: 'text-yellow-500', bg: 'bg-yellow-50', icon: AlertCircle },
      failed: { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
      running: { color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock },
    };
    return configs[status] || configs.running;
  };

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'INSERTED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'UPDATED': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'SKIPPED': return <SkipForward className="w-4 h-4 text-gray-400" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/admin/integration/runs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Runs
        </Button>
        <div className="text-center mt-8">
          <h2 className="text-xl font-semibold">Run not found</h2>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(run.status);
  const StatusIcon = statusConfig.icon;
  const stats = run.stats_json || {};
  const totalProcessed = (stats.total_inserted || 0) + (stats.total_updated || 0) + 
                         (stats.total_skipped || 0) + (stats.total_failed || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/integration/runs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ingestion Run Details
            </h1>
            <p className="text-sm text-gray-500 font-mono">{run.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRunDetails}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {(stats.total_failed || 0) > 0 && (
            <Button variant="outline" onClick={downloadErrorsCsv}>
              <Download className="w-4 h-4 mr-2" />
              Download Errors CSV
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={statusConfig.bg}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${statusConfig.bg}`}>
              <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold capitalize">{run.status}</h2>
              <p className="text-gray-500">
                {run.dataset} • {run.source_system_code} • {run.mode}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium">{formatDate(run.started_at)}</p>
              {run.ended_at && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Ended</p>
                  <p className="font-medium">{formatDate(run.ended_at)}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Received</p>
            <p className="text-2xl font-bold">{stats.total_received || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">Inserted</p>
            <p className="text-2xl font-bold text-green-700">{stats.total_inserted || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-600">Updated</p>
            <p className="text-2xl font-bold text-blue-700">{stats.total_updated || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Skipped</p>
            <p className="text-2xl font-bold text-gray-600">{stats.total_skipped || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">Failed</p>
            <p className="text-2xl font-bold text-red-700">{stats.total_failed || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      {totalProcessed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm">Inserted</span>
                <div className="flex-1">
                  <Progress 
                    value={(stats.total_inserted / totalProcessed) * 100} 
                    className="h-2 bg-green-100"
                  />
                </div>
                <span className="w-16 text-right text-sm">
                  {((stats.total_inserted / totalProcessed) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm">Updated</span>
                <div className="flex-1">
                  <Progress 
                    value={(stats.total_updated / totalProcessed) * 100} 
                    className="h-2 bg-blue-100"
                  />
                </div>
                <span className="w-16 text-right text-sm">
                  {((stats.total_updated / totalProcessed) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm">Skipped</span>
                <div className="flex-1">
                  <Progress 
                    value={(stats.total_skipped / totalProcessed) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
                <span className="w-16 text-right text-sm">
                  {((stats.total_skipped / totalProcessed) * 100).toFixed(1)}%
                </span>
              </div>
              {(stats.total_failed || 0) > 0 && (
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm">Failed</span>
                  <div className="flex-1">
                    <Progress 
                      value={(stats.total_failed / totalProcessed) * 100} 
                      className="h-2 bg-red-100"
                    />
                  </div>
                  <span className="w-16 text-right text-sm">
                    {((stats.total_failed / totalProcessed) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ingestion Items</CardTitle>
            <div className="flex gap-2">
              {['', 'INSERTED', 'UPDATED', 'SKIPPED', 'FAILED'].map(outcome => (
                <Button
                  key={outcome}
                  variant={outcomeFilter === outcome ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setOutcomeFilter(outcome);
                    setItemsPagination(prev => ({ ...prev, offset: 0 }));
                  }}
                >
                  {outcome || 'All'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>External Ref</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>DQ Issues</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.external_ref}</TableCell>
                      <TableCell>{item.entity_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getOutcomeIcon(item.outcome)}
                          <span>{item.outcome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.dq_issues_json?.length > 0 && (
                          <Badge variant="secondary">
                            {item.dq_issues_json.length} issues
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-red-600">
                        {item.error_message}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(item.processed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {itemsPagination.total > itemsPagination.limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {itemsPagination.offset + 1} - {Math.min(itemsPagination.offset + itemsPagination.limit, itemsPagination.total)} of {itemsPagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={itemsPagination.offset === 0}
                      onClick={() => setItemsPagination(prev => ({ ...prev, offset: prev.offset - prev.limit }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={itemsPagination.offset + itemsPagination.limit >= itemsPagination.total}
                      onClick={() => setItemsPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RunDetail;
