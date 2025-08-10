import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { ComparisonService } from '@/services/comparisonService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MultiSelect } from '@/components/ui/multi-select';
import { supabase } from '@/lib/supabase';

function useDefaultRanges() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    range1: { from: startOfMonth, to: endOfMonth },
    range2: { from: prevStart, to: prevEnd }
  };
}

function formatNumber(x) {
  if (x == null) return '-';
  return new Intl.NumberFormat().format(x);
}

function Delta({ delta, pct }) {
  const up = (pct || 0) > 0;
  const color = pct == null ? '#64748b' : up ? '#16a34a' : '#dc2626';
  return (
    <div style={{ color, fontSize: 12 }}>
      {delta == null ? '-' : `${formatNumber(delta)} (${pct?.toFixed?.(1)}%)`}
    </div>
  );
}

export default function ComparisonDashboard() {
  const { range1, range2 } = useDefaultRanges();
  const [date1, setDate1] = useState(range1);
  const [date2, setDate2] = useState(range2);
  const [granularity, setGranularity] = useState('month');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCaseProducts, setSelectedCaseProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const navigate = useNavigate();
  const [branchOptions, setBranchOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [caseProductOptions, setCaseProductOptions] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: branches }, { data: products }, { data: caseProducts }] = await Promise.all([
        supabase.from('branches').select('branch_id, branch_name').limit(500),
        supabase.from('products').select('product_id, product_name').limit(500),
        supabase.from('collection_cases').select('product_type').not('product_type', 'is', null).limit(500)
      ]);
      setBranchOptions((branches || []).map(b => ({ value: b.branch_id, label: `${b.branch_id} - ${b.branch_name}` })));
      setProductOptions((products || []).map(p => ({ value: p.product_id, label: p.product_name })));
      const uniqTypes = Array.from(new Set((caseProducts || []).map(c => c.product_type).filter(Boolean)));
      setCaseProductOptions(uniqTypes.map(v => ({ value: v, label: v })));
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sales, collections, customers, accounts, cases] = await Promise.all([
        ComparisonService.compareSales({ branchIds: selectedBranches.length ? selectedBranches : null, productIds: selectedProducts.length ? selectedProducts : null, start1: date1.from, end1: date1.to, start2: date2.from, end2: date2.to, granularity }),
        ComparisonService.compareCollections({ branchIds: selectedBranches.length ? selectedBranches : null, start1: date1.from, end1: date1.to, start2: date2.from, end2: date2.to, granularity }),
        ComparisonService.compareCustomers({ branchIds: selectedBranches.length ? selectedBranches : null, start1: date1.from, end1: date1.to, start2: date2.from, end2: date2.to, granularity }),
        ComparisonService.compareAccounts({ branchIds: selectedBranches.length ? selectedBranches : null, productIds: selectedProducts.length ? selectedProducts : null, start1: date1.from, end1: date1.to, start2: date2.from, end2: date2.to, granularity }),
        ComparisonService.compareCases({ branchIds: selectedBranches.length ? selectedBranches : null, productTypes: selectedCaseProducts.length ? selectedCaseProducts : null, start1: date1.from, end1: date1.to, start2: date2.from, end2: date2.to, granularity })
      ]);
      setData({ sales, collections, customers, accounts, cases });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => {
    const sAgg = (data.sales?.data || []).reduce((acc, r) => ({
      v1: acc.v1 + Number(r.value_1 || 0),
      v2: acc.v2 + Number(r.value_2 || 0)
    }), { v1: 0, v2: 0 });
    const sDelta = sAgg.v2 - sAgg.v1;
    const sPct = sAgg.v1 ? (sDelta / sAgg.v1) * 100 : null;

    const cAgg = (data.collections?.data || []).reduce((acc, r) => ({
      v1: acc.v1 + Number(r.value_1 || 0),
      v2: acc.v2 + Number(r.value_2 || 0)
    }), { v1: 0, v2: 0 });
    const cDelta = cAgg.v2 - cAgg.v1;
    const cPct = cAgg.v1 ? (cDelta / cAgg.v1) * 100 : null;

    const cuAgg = (data.customers?.data || []).reduce((acc, r) => ({
      v1: acc.v1 + Number(r.value_1 || 0),
      v2: acc.v2 + Number(r.value_2 || 0)
    }), { v1: 0, v2: 0 });
    const cuDelta = cuAgg.v2 - cuAgg.v1;
    const cuPct = cuAgg.v1 ? (cuDelta / cuAgg.v1) * 100 : null;

    const aAgg = (data.accounts?.data || []).reduce((acc, r) => ({
      v1: acc.v1 + Number(r.value_1 || 0),
      v2: acc.v2 + Number(r.value_2 || 0)
    }), { v1: 0, v2: 0 });
    const aDelta = aAgg.v2 - aAgg.v1;
    const aPct = aAgg.v1 ? (aDelta / aAgg.v1) * 100 : null;

    const caAgg = (data.cases?.data || []).reduce((acc, r) => ({
      v1: acc.v1 + Number(r.new_cases_1 || 0),
      v2: acc.v2 + Number(r.new_cases_2 || 0)
    }), { v1: 0, v2: 0 });
    const caDelta = caAgg.v2 - caAgg.v1;
    const caPct = caAgg.v1 ? (caDelta / caAgg.v1) * 100 : null;

    return [
      { key: 'sales', title: 'Sales (Credits)', value: sAgg.v2, delta: sDelta, pct: sPct, onClick: () => navigate('/dashboard/modern-detail/sales') },
      { key: 'collections', title: 'Collections', value: cAgg.v2, delta: cDelta, pct: cPct, onClick: () => navigate('/collection/daily') },
      { key: 'customers', title: 'New Customers', value: cuAgg.v2, delta: cuDelta, pct: cuPct, onClick: () => navigate('/dashboard/customer-growth') },
      { key: 'accounts', title: 'New Accounts', value: aAgg.v2, delta: aDelta, pct: aPct, onClick: () => navigate('/accounts') },
      { key: 'cases', title: 'New Cases', value: caAgg.v2, delta: caDelta, pct: caPct, onClick: () => navigate('/collection/cases') }
    ];
  }, [data, navigate]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={granularity} onValueChange={setGranularity}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Granularity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        <MultiSelect options={branchOptions} value={selectedBranches} onChange={setSelectedBranches} placeholder="Branches" className="w-[240px]" />
        <MultiSelect options={productOptions} value={selectedProducts} onChange={setSelectedProducts} placeholder="Products" className="w-[240px]" />
        <MultiSelect options={caseProductOptions} value={selectedCaseProducts} onChange={setSelectedCaseProducts} placeholder="Case Products" className="w-[240px]" />
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
        <div className="text-sm text-muted-foreground">
          {format(date1.from, 'yyyy-MM-dd')} → {format(date1.to, 'yyyy-MM-dd')} vs {format(date2.from, 'yyyy-MM-dd')} → {format(date2.to, 'yyyy-MM-dd')}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.key} className="cursor-pointer" onClick={c.onClick}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatNumber(c.value)}</div>
              <Delta delta={c.delta} pct={c.pct} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}