/**
 * Ingestion Runs Page
 * EPIC 5 - View and manage data ingestion runs
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  PlayCircle, CheckCircle, XCircle, AlertCircle, Clock,
  FileText, Database, RefreshCw, Filter, ChevronRight, Search
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const IngestionRuns = () => {
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dataset: '__all__',
    status: '__all__',
    source_system: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });

  const loadRuns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dataset && filters.dataset !== '__all__') params.append('dataset', filters.dataset);
      if (filters.status && filters.status !== '__all__') params.append('status', filters.status);
      if (filters.source_system) params.append('source_system', filters.source_system);
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);

      const res = await fetch(`${API_BASE}/integration/runs?${params}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setRuns(data.data || []);
        setPagination(prev => ({ ...prev, total: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error('Error loading runs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.offset]);

  const getStatusBadge = (status) => {
    const variants = {
      success: { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      partial: { variant: 'secondary', icon: AlertCircle, color: 'text-yellow-500' },
      failed: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      running: { variant: 'outline', icon: Clock, color: 'text-blue-500' },
    };
    const config = variants[status] || variants.running;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!endedAt) return 'In progress';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diff = end - start;
    
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    return `${Math.round(diff / 60000)}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ingestion Runs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and monitor data ingestion history
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadRuns} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/integration/ingest')}>
            <PlayCircle className="w-4 h-4 mr-2" />
            New Ingestion
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filters:</span>
            </div>
            <Select
              value={filters.dataset}
              onValueChange={(v) => setFilters(prev => ({ ...prev, dataset: v }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Datasets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Datasets</SelectItem>
                <SelectItem value="PARTY">Party</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="CHARGE">Charge</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
            {(filters.dataset !== '__all__' || filters.status !== '__all__') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ dataset: '__all__', status: '__all__', source_system: '' })}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map(run => (
                    <TableRow 
                      key={run.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => navigate(`/admin/integration/runs/${run.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {run.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{run.dataset}</Badge>
                      </TableCell>
                      <TableCell>{run.source_system_code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {run.mode === 'FILE' && <FileText className="w-4 h-4" />}
                          {run.mode === 'API' && <Database className="w-4 h-4" />}
                          {run.mode}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">
                            ✓ {run.stats_json?.total_inserted || 0} inserted
                          </div>
                          <div className="text-blue-600">
                            ↻ {run.stats_json?.total_updated || 0} updated
                          </div>
                          {run.stats_json?.total_failed > 0 && (
                            <div className="text-red-600">
                              ✗ {run.stats_json?.total_failed} failed
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDuration(run.started_at, run.ended_at)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(run.started_at)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {runs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No ingestion runs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset === 0}
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset - prev.limit }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
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

export default IngestionRuns;
