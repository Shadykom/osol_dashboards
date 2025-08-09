import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { Users, Activity, Calendar, TrendingUp, Search } from 'lucide-react';
import { customerDetailsService } from '@/services/dashboardDetailsService';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilters } from '@/contexts/FilterContext';
import { enhancedDashboardDetailsService } from '@/services/enhancedDashboardDetailsService';
import { format } from 'date-fns';
import RawDataPanel from '@/components/RawDataPanel';

function StatCard({ title, value, description, icon: Icon, change, trend }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-[#4A5568]">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-[#E6B800]" />}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <Badge variant={trend === 'down' ? 'destructive' : 'default'}>{change}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerGrowthDetail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { filters, updateFilter, filterOptions, loadFilterOptions } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [trends, setTrends] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [comparisonMode, setComparisonMode] = useState('none'); // none | branches | months
  const [comparisonData, setComparisonData] = useState(null);

  // Add sorting and per-column filters for Recent Customers table
  const [sortBy, setSortBy] = useState({ key: 'created_at', dir: 'desc' });
  const [columnFilters, setColumnFilters] = useState({
    customer_id: '',
    name: '',
    segment: '',
    branch_id: '',
    status: '',
    accounts_count_min: '',
    accounts_count_max: '',
    accounts_active_min: '',
    accounts_active_max: '',
    balance_min: '',
    balance_max: '',
    loans_count_min: '',
    loans_count_max: '',
    outstanding_min: '',
    outstanding_max: '',
    created_from: '',
    created_to: ''
  });

  const updateColumnFilter = (key, value) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    setSortBy(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const fetchPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use enhanced service to ensure same logic as main dashboard filters
      const [ovr, brk, tr] = await Promise.all([
        enhancedDashboardDetailsService.getCustomersOverview({ ...filters, applyDateFilter: false }),
        enhancedDashboardDetailsService.getCustomersBreakdown('total_customers', { ...filters, applyDateFilter: false }),
        enhancedDashboardDetailsService.getCustomersTrendsData({ ...filters, applyDateFilter: false })
      ]);

      setOverview(ovr || null);
      setBreakdown(brk || null);
      setTrends(tr || null);

      // Recent customers with enriched metrics
      const { data: custList } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, full_name, first_name, last_name, customer_segment, customer_type, branch_id, created_at, risk_category, gender, date_of_birth, email, mobile_number, customer_status')
        .order('created_at', { ascending: false })
        .limit(50);

      const customerIds = (custList || []).map(c => c.customer_id);

      let accountsByCustomer = {};
      let loansByCustomer = {};

      if (customerIds.length > 0) {
        const [{ data: accountsData }, { data: loansData }] = await Promise.all([
          supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_id, customer_id, current_balance, account_status')
            .in('customer_id', customerIds),
          supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_account_id, customer_id, outstanding_principal, loan_status')
            .in('customer_id', customerIds)
        ]);

        accountsByCustomer = (accountsData || []).reduce((acc, a) => {
          const obj = acc[a.customer_id] || { count: 0, active: 0, balance: 0 };
          obj.count += 1;
          if (a.account_status === 'ACTIVE') obj.active += 1;
          obj.balance += Number(a.current_balance || 0);
          acc[a.customer_id] = obj;
          return acc;
        }, {});

        loansByCustomer = (loansData || []).reduce((acc, l) => {
          const obj = acc[l.customer_id] || { count: 0, active: 0, outstanding: 0 };
          obj.count += 1;
          if (l.loan_status === 'ACTIVE') obj.active += 1;
          obj.outstanding += Number(l.outstanding_principal || 0);
          acc[l.customer_id] = obj;
          return acc;
        }, {});
      }

      const enriched = (custList || []).map(c => ({
        ...c,
        accounts: accountsByCustomer[c.customer_id] || { count: 0, active: 0, balance: 0 },
        loans: loansByCustomer[c.customer_id] || { count: 0, active: 0, outstanding: 0 }
      }));

      setCustomers(enriched);

      // Build comparison data if enabled
      await buildComparison();
    } catch (e) {
      console.error('Failed to load customer details:', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ensure filter options are loaded for branches etc.
    if (!filterOptions?.branches?.length) {
      // dashboard loads options elsewhere; here we just noop if not present
    }
    fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-fetch when filters or comparison change
    fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.branch, filters.dateRange, comparisonMode]);

  const buildComparison = async () => {
    try {
      if (comparisonMode === 'branches') {
        const branchIds = (filterOptions.branches || []).map(b => b.branch_id).slice(0, 5);
        const results = await Promise.all(
          branchIds.map(async (bid) => {
            const o = await enhancedDashboardDetailsService.getCustomersOverview({ ...filters, branch: bid, applyDateFilter: false });
            return { name: bid, value: o?.totalCustomers || 0 };
          })
        );
        setComparisonData({ type: 'bar', series: results });
      } else if (comparisonMode === 'months') {
        const tr = await enhancedDashboardDetailsService.getCustomersTrendsData({ ...filters, applyDateFilter: false });
        const months = tr?.dates?.slice(-6) || [];
        const totals = tr?.totalCustomers?.slice(-6) || [];
        setComparisonData({ type: 'line', series: months.map((m, i) => ({ month: m, total: totals[i] || 0 })) });
      } else {
        setComparisonData(null);
      }
    } catch (e) {
      console.warn('Comparison build failed:', e);
      setComparisonData(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = (query || '').toLowerCase();
    return customers.filter(c => {
      // Global text search
      const name = (c.full_name || `${c.first_name || ''} ${c.last_name || ''}` || '').toLowerCase();
      const segment = (c.customer_segment || c.customer_type || '').toLowerCase();
      const matchesQuery = !q || name.includes(q) || (c.customer_id || '').toLowerCase().includes(q) || segment.includes(q);

      // Column filters
      const cf = columnFilters;
      const idOk = !cf.customer_id || (c.customer_id || '').toLowerCase().includes(cf.customer_id.toLowerCase());
      const nameOk = !cf.name || name.includes(cf.name.toLowerCase());
      const segOk = !cf.segment || segment.includes(cf.segment.toLowerCase());
      const branchOk = !cf.branch_id || (c.branch_id || '').toLowerCase().includes(cf.branch_id.toLowerCase());
      const statusOk = !cf.status || (c.customer_status || 'ACTIVE').toLowerCase().includes(cf.status.toLowerCase());

      const accountsCount = Number(c.accounts?.count || 0);
      const accountsActive = Number(c.accounts?.active || 0);
      const balance = Number(c.accounts?.balance || 0);
      const loansCount = Number(c.loans?.count || 0);
      const outstanding = Number(c.loans?.outstanding || 0);
      const createdAt = c.created_at ? new Date(c.created_at) : null;

      const numInRange = (val, min, max) => {
        const minOk = min === '' || (Number.isFinite(Number(min)) && val >= Number(min));
        const maxOk = max === '' || (Number.isFinite(Number(max)) && val <= Number(max));
        return minOk && maxOk;
      };

      const accCountOk = numInRange(accountsCount, cf.accounts_count_min, cf.accounts_count_max);
      const accActiveOk = numInRange(accountsActive, cf.accounts_active_min, cf.accounts_active_max);
      const balOk = numInRange(balance, cf.balance_min, cf.balance_max);
      const loansCountOk = numInRange(loansCount, cf.loans_count_min, cf.loans_count_max);
      const outstandingOk = numInRange(outstanding, cf.outstanding_min, cf.outstanding_max);
      const createdFromOk = !cf.created_from || (createdAt && createdAt >= new Date(cf.created_from));
      const createdToOk = !cf.created_to || (createdAt && createdAt <= new Date(cf.created_to));

      return (
        matchesQuery && idOk && nameOk && segOk && branchOk && statusOk &&
        accCountOk && accActiveOk && balOk && loansCountOk && outstandingOk &&
        createdFromOk && createdToOk
      );
    });
  }, [customers, query, columnFilters]);

  const sortedCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    const dir = sortBy.dir === 'asc' ? 1 : -1;

    const getVal = (c) => {
      switch (sortBy.key) {
        case 'customer_id':
          return c.customer_id || '';
        case 'name':
          return c.full_name || `${c.first_name || ''} ${c.last_name || ''}`;
        case 'segment':
          return c.customer_segment || c.customer_type || '';
        case 'branch_id':
          return c.branch_id || '';
        case 'status':
          return c.customer_status || 'ACTIVE';
        case 'accounts_count':
          return Number(c.accounts?.count || 0);
        case 'accounts_active':
          return Number(c.accounts?.active || 0);
        case 'balance':
          return Number(c.accounts?.balance || 0);
        case 'loans_count':
          return Number(c.loans?.count || 0);
        case 'outstanding':
          return Number(c.loans?.outstanding || 0);
        case 'created_at':
          return c.created_at ? new Date(c.created_at).getTime() : 0;
        default:
          return 0;
      }
    };

    list.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [filteredCustomers, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.customerGrowth', 'Customer Growth')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.customerGrowthSubtitle', 'Detailed analytics and insights about customers')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Advanced Filters */}
          <Select value={filters.dateRange} onValueChange={(v) => updateFilter('dateRange', v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Date Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.branch} onValueChange={(v) => updateFilter('branch', v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {(filterOptions.branches || []).map(b => (
                <SelectItem key={b.branch_id} value={b.branch_id}>{b.branch_name || b.branch_id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={comparisonMode} onValueChange={setComparisonMode}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Compare" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Comparison</SelectItem>
              <SelectItem value="branches">Compare Branches</SelectItem>
              <SelectItem value="months">Compare Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchPageData}>Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Customers" value={(overview?.totalCustomers || 0).toLocaleString()} icon={Users} change={overview?.change ? `${Number(overview.change).toFixed(2)}%` : undefined} trend={overview?.trend || 'up'} description="All customers" />
            <StatCard title="Active Customers" value={(overview?.activeCustomers || 0).toLocaleString()} icon={Activity} description="With active accounts" />
            <StatCard title="New This Month" value={(overview?.newCustomers || overview?.newCustomersMonth || 0).toLocaleString()} icon={Calendar} description="Created since month start" />
            <StatCard title="Avg Monthly Growth" value={(Number(overview?.change || overview?.growthRate || 0)).toFixed(2) + '%'} icon={TrendingUp} description="Based on new registrations" />
          </div>

          {comparisonData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4A5568]">
                  {comparisonMode === 'branches' ? 'Branch Comparison' : 'Monthly Comparison'}
                </CardTitle>
                <CardDescription>
                  {comparisonMode === 'branches' ? 'Total customers by branch' : 'Total customers over recent months'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonMode === 'branches' ? (
                  <ChartWidget
                    data={comparisonData.series}
                    chartType="bar"
                    xAxisKey="name"
                    yAxisKey="value"
                    height={280}
                    clickable={false}
                  />
                ) : (
                  <ChartWidget
                    data={comparisonData.series}
                    chartType="line"
                    xAxisKey="month"
                    yAxisKey="total"
                    height={280}
                    clickable={false}
                  />
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Recent Customers</CardTitle>
              <CardDescription>Last 50 customers with account and loan summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input className="pl-8" placeholder="Search by name, ID or segment..." value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('customer_id')}>ID {sortBy.key==='customer_id' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>Name {sortBy.key==='name' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('segment')}>Segment {sortBy.key==='segment' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('branch_id')}>Branch {sortBy.key==='branch_id' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>Status {sortBy.key==='status' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('accounts_count')}>Accounts {sortBy.key==='accounts_count' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('accounts_active')}>Active {sortBy.key==='accounts_active' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>Balance (SAR) {sortBy.key==='balance' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('loans_count')}>Loans {sortBy.key==='loans_count' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('outstanding')}>Outstanding (SAR) {sortBy.key==='outstanding' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>Created {sortBy.key==='created_at' ? (sortBy.dir==='asc' ? '▲' : '▼') : ''}</TableHead>
                    </TableRow>
                    {/* Filters row */}
                    <TableRow>
                      <TableHead>
                        <Input placeholder="ID" value={columnFilters.customer_id} onChange={(e)=>updateColumnFilter('customer_id', e.target.value)} className="h-8" />
                      </TableHead>
                      <TableHead>
                        <Input placeholder="Name" value={columnFilters.name} onChange={(e)=>updateColumnFilter('name', e.target.value)} className="h-8" />
                      </TableHead>
                      <TableHead>
                        <Input placeholder="Segment" value={columnFilters.segment} onChange={(e)=>updateColumnFilter('segment', e.target.value)} className="h-8" />
                      </TableHead>
                      <TableHead>
                        <Input placeholder="Branch" value={columnFilters.branch_id} onChange={(e)=>updateColumnFilter('branch_id', e.target.value)} className="h-8" />
                      </TableHead>
                      <TableHead>
                        <Input placeholder="Status" value={columnFilters.status} onChange={(e)=>updateColumnFilter('status', e.target.value)} className="h-8" />
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="min" value={columnFilters.accounts_count_min} onChange={(e)=>updateColumnFilter('accounts_count_min', e.target.value)} className="h-8 w-20" />
                          <Input type="number" placeholder="max" value={columnFilters.accounts_count_max} onChange={(e)=>updateColumnFilter('accounts_count_max', e.target.value)} className="h-8 w-20" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="min" value={columnFilters.accounts_active_min} onChange={(e)=>updateColumnFilter('accounts_active_min', e.target.value)} className="h-8 w-20" />
                          <Input type="number" placeholder="max" value={columnFilters.accounts_active_max} onChange={(e)=>updateColumnFilter('accounts_active_max', e.target.value)} className="h-8 w-20" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="min" value={columnFilters.balance_min} onChange={(e)=>updateColumnFilter('balance_min', e.target.value)} className="h-8 w-24" />
                          <Input type="number" placeholder="max" value={columnFilters.balance_max} onChange={(e)=>updateColumnFilter('balance_max', e.target.value)} className="h-8 w-24" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="min" value={columnFilters.loans_count_min} onChange={(e)=>updateColumnFilter('loans_count_min', e.target.value)} className="h-8 w-20" />
                          <Input type="number" placeholder="max" value={columnFilters.loans_count_max} onChange={(e)=>updateColumnFilter('loans_count_max', e.target.value)} className="h-8 w-20" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="min" value={columnFilters.outstanding_min} onChange={(e)=>updateColumnFilter('outstanding_min', e.target.value)} className="h-8 w-24" />
                          <Input type="number" placeholder="max" value={columnFilters.outstanding_max} onChange={(e)=>updateColumnFilter('outstanding_max', e.target.value)} className="h-8 w-24" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex gap-1">
                          <Input type="date" value={columnFilters.created_from} onChange={(e)=>updateColumnFilter('created_from', e.target.value)} className="h-8" />
                          <Input type="date" value={columnFilters.created_to} onChange={(e)=>updateColumnFilter('created_to', e.target.value)} className="h-8" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((c) => (
                      <TableRow key={c.customer_id}>
                        <TableCell className="font-medium">{c.customer_id}</TableCell>
                        <TableCell>{c.full_name || `${c.first_name || ''} ${c.last_name || ''}`}</TableCell>
                        <TableCell>{c.customer_segment || c.customer_type || '-'}</TableCell>
                        <TableCell>{c.branch_id || '-'}</TableCell>
                        <TableCell>{c.customer_status || 'ACTIVE'}</TableCell>
                        <TableCell>{c.accounts.count}</TableCell>
                        <TableCell>{c.accounts.active}</TableCell>
                        <TableCell>{c.accounts.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{c.loans.count}</TableCell>
                        <TableCell>{c.loans.outstanding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {sortedCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-gray-500">No customers found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4A5568]">By Branch</CardTitle>
                <CardDescription>Customer distribution per branch</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  data={(breakdown?.byBranch || []).map(({ name, value }) => ({ name, value }))}
                  chartType="bar"
                  xAxisKey="name"
                  yAxisKey="value"
                  height={280}
                  clickable={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#4A5568]">By Age Group</CardTitle>
                <CardDescription>Derived from date of birth</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  data={Object.entries(breakdown?.byAgeGroup || {}).map(([name, value]) => ({ name, value }))}
                  chartType="bar"
                  xAxisKey="name"
                  yAxisKey="value"
                  height={280}
                  clickable={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#4A5568]">By Gender</CardTitle>
                <CardDescription>Registered gender</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWidget
                  data={Object.entries(breakdown?.byGender || {}).map(([name, value]) => ({ name, value }))}
                  chartType="bar"
                  xAxisKey="name"
                  yAxisKey="value"
                  height={280}
                  clickable={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4A5568]">Customer Growth Trend</CardTitle>
              <CardDescription>New customers per month (last 12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWidget
                data={(trends?.dates || []).map((d, i) => ({ month: d, newCustomers: trends?.newCustomers?.[i] || 0, total: trends?.totalCustomers?.[i] || 0 }))}
                chartType="line"
                xAxisKey="month"
                yAxisKey="newCustomers"
                height={320}
                clickable={false}
                multiLine={{ total: { color: '#4A5568' } }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <RawDataPanel title="Raw Customers" description="Direct view into the customers table" data={customers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}