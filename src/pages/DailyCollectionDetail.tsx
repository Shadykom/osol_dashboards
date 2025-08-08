import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, RefreshCw, ArrowLeft, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { supabaseBanking, supabaseCollection } from '@/lib/supabase';
import { CollectionService } from '@/services/collectionService';

// Helper to map filter object into API-ready params
function mapFiltersForApi(filters: any) {
  const dateFrom = filters?.dateRange?.from ? new Date(filters.dateRange.from).toISOString().split('T')[0] : null;
  const dateTo = filters?.dateRange?.to ? new Date(filters.dateRange.to).toISOString().split('T')[0] : null;
  const mapped: any = {};
  if (filters?.branch && filters.branch !== 'all') mapped.branch = filters.branch;
  if (filters?.team && filters.team !== 'all') mapped.team = filters.team;
  if (filters?.status && filters.status !== 'all') mapped.status = filters.status;
  if (filters?.bucket && filters.bucket !== 'all') mapped.bucket = filters.bucket;
  if (dateFrom) mapped.dateFrom = dateFrom;
  if (dateTo) mapped.dateTo = dateTo;
  return mapped;
}

const DailyCollectionDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { metric } = useParams();
  const location = useLocation() as any;

  const [filters, setFilters] = useState<any>(() => {
    return location?.state?.filters || {
      dateRange: { from: new Date(), to: new Date() },
      branch: 'all',
      team: 'all',
      status: 'all',
      bucket: 'all'
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  const apiFilters = useMemo(() => mapFiltersForApi(filters), [filters]);

  const title = useMemo(() => {
    switch (metric) {
      case 'payments':
        return 'Daily Collections';
      case 'collectors':
        return 'Collector Performance';
      case 'cases':
        return 'Cases';
      default:
        return 'Details';
    }
  }, [metric]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (metric === 'payments') {
          const { data, error } = await supabaseCollection
            .from('daily_collection_summary')
            .select('*')
            .gte('summary_date', apiFilters.dateFrom || new Date().toISOString().split('T')[0])
            .lte('summary_date', apiFilters.dateTo || new Date().toISOString().split('T')[0])
            .order('summary_date', { ascending: true });
          if (error) throw error;
          setRows(data || []);
          setTrend(
            (data || []).map((d: any) => ({
              date: d.summary_date,
              collected: d.total_collected || 0,
              calls: d.calls_made || 0,
              ptps: d.ptps_kept || 0
            }))
          );
        } else if (metric === 'collectors') {
          // Use service to get top officers + fetch raw rows for table
          const perf = await CollectionService.getCollectionPerformance('daily', apiFilters);
          const top = perf?.data?.topOfficers || [];
          setTrend(
            (perf?.data?.dailyTrends || []).map((d: any) => ({ date: d.date, collected: d.totalCollected }))
          );
          // Raw officer rows
          const { data, error } = await supabaseCollection
            .from('officer_performance_summary')
            .select('*')
            .lte('summary_date', apiFilters.dateTo || new Date().toISOString().split('T')[0])
            .order('summary_date', { ascending: false })
            .limit(500);
          if (error) throw error;
          // Enrich with officer names
          const officerIds = Array.from(new Set((data || []).map((r: any) => r.officer_id))).filter(Boolean);
          let officerMap: Record<string, any> = {};
          if (officerIds.length > 0) {
            const { data: officers } = await supabaseCollection
              .from('collection_officers')
              .select('officer_id, officer_name')
              .in('officer_id', officerIds);
            (officers || []).forEach((o: any) => (officerMap[o.officer_id] = o));
          }
          setRows(
            (data || []).map((r: any) => ({
              ...r,
              officer_name: officerMap[r.officer_id]?.officer_name || 'Unknown'
            }))
          );
        } else if (metric === 'cases') {
          const resp = await CollectionService.getCollectionCases({ page: 1, limit: 200, ...apiFilters });
          if (!resp.success) throw new Error(resp?.error?.message || 'Failed to load cases');
          setRows(resp.data || []);
          setTrend([]);
        } else {
          setRows([]);
          setTrend([]);
        }
      } catch (e: any) {
        console.error('DailyCollectionDetail load error:', e);
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [metric, apiFilters.dateFrom, apiFilters.dateTo, apiFilters.branch, apiFilters.team, apiFilters.status, apiFilters.bucket]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/collection/daily')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={filters.dateRange}
            onChange={(range: any) => setFilters((f: any) => ({ ...f, dateRange: range }))}
          />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="collected" stroke="#22c55e" />
                </LineChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rows</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading…</div>
          ) : (
            <div className="overflow-auto">
              {metric === 'payments' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Collected</TableHead>
                      <TableHead>Collection Rate</TableHead>
                      <TableHead>Calls</TableHead>
                      <TableHead>PTP Created</TableHead>
                      <TableHead>PTP Kept</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any) => (
                      <TableRow key={r.summary_id || r.summary_date}>
                        <TableCell>{r.summary_date}</TableCell>
                        <TableCell>{(r.total_collected || 0).toLocaleString()}</TableCell>
                        <TableCell>{(r.collection_rate || 0).toFixed?.(2) || r.collection_rate}%</TableCell>
                        <TableCell>{r.calls_made || 0}</TableCell>
                        <TableCell>{r.ptps_created || 0}</TableCell>
                        <TableCell>{r.ptps_kept || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {metric === 'collectors' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Total Collected</TableHead>
                      <TableHead>Total Cases</TableHead>
                      <TableHead>Total Calls</TableHead>
                      <TableHead>Contact Rate</TableHead>
                      <TableHead>PTP Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any, idx: number) => (
                      <TableRow key={`${r.officer_id}-${idx}-${r.summary_date}`}> 
                        <TableCell>{r.summary_date}</TableCell>
                        <TableCell>{r.officer_name || r.officer_id}</TableCell>
                        <TableCell>{(r.total_collected || 0).toLocaleString()}</TableCell>
                        <TableCell>{r.total_cases || 0}</TableCell>
                        <TableCell>{r.total_calls || 0}</TableCell>
                        <TableCell>{r.contact_rate ? `${r.contact_rate.toFixed?.(1) || r.contact_rate}%` : '0%'}</TableCell>
                        <TableCell>{r.ptp_rate ? `${r.ptp_rate.toFixed?.(1) || r.ptp_rate}%` : '0%'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {metric === 'cases' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>DPD</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any) => (
                      <TableRow key={r.caseId}>
                        <TableCell>{r.caseNumber}</TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell>{(r.totalOutstanding || 0).toLocaleString()}</TableCell>
                        <TableCell>{r.daysPastDue || 0}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{r.priority}</TableCell>
                        <TableCell>{r.delinquencyBucket}</TableCell>
                        <TableCell>{r.assignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCollectionDetail;