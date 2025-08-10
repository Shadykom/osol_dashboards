import { supabase } from '@/lib/supabase';
import { formatApiResponse } from '@/utils/apiHelpers';

function toDateString(d) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export const ComparisonService = {
  async compareSales({ branchIds = null, productIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    const { data, error } = await supabase.rpc('fn_compare_sales', {
      p_branch_ids: branchIds,
      p_product_ids: productIds,
      p_start_1: toDateString(start1),
      p_end_1: toDateString(end1),
      p_start_2: toDateString(start2),
      p_end_2: toDateString(end2),
      p_granularity: granularity
    });
    return formatApiResponse(data, error);
  },

  async compareCollections({ branchIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    const { data, error } = await supabase.rpc('fn_compare_collections', {
      p_branch_ids: branchIds,
      p_start_1: toDateString(start1),
      p_end_1: toDateString(end1),
      p_start_2: toDateString(start2),
      p_end_2: toDateString(end2),
      p_granularity: granularity
    });
    return formatApiResponse(data, error);
  },

  async compareCustomers({ branchIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    const { data, error } = await supabase.rpc('fn_compare_customers', {
      p_branch_ids: branchIds,
      p_start_1: toDateString(start1),
      p_end_1: toDateString(end1),
      p_start_2: toDateString(start2),
      p_end_2: toDateString(end2),
      p_granularity: granularity
    });
    return formatApiResponse(data, error);
  },

  async compareAccounts({ branchIds = null, productIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    const { data, error } = await supabase.rpc('fn_compare_accounts', {
      p_branch_ids: branchIds,
      p_product_ids: productIds,
      p_start_1: toDateString(start1),
      p_end_1: toDateString(end1),
      p_start_2: toDateString(start2),
      p_end_2: toDateString(end2),
      p_granularity: granularity
    });
    return formatApiResponse(data, error);
  },

  async compareCases({ branchIds = null, productTypes = null, start1, end1, start2, end2, granularity = 'month' }) {
    const { data, error } = await supabase.rpc('fn_compare_cases', {
      p_branch_ids: branchIds,
      p_product_types: productTypes,
      p_start_1: toDateString(start1),
      p_end_1: toDateString(end1),
      p_start_2: toDateString(start2),
      p_end_2: toDateString(end2),
      p_granularity: granularity
    });
    return formatApiResponse(data, error);
  },

  async getSalesDetails(filters) {
    const { branchIds = null, productIds = null, start, end } = filters;
    let q = supabase.from('vw_sales_detail').select('*').gte('transaction_date', toDateString(start)).lte('transaction_date', toDateString(end));
    if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
    if (productIds && productIds.length) q = q.in('product_id', productIds);
    const { data, error } = await q.limit(1000);
    return formatApiResponse(data, error);
  },

  async getCollectionsDetails(filters) {
    const { branchIds = null, start, end } = filters;
    let q = supabase.from('vw_collections_detail').select('*').gte('summary_date', toDateString(start)).lte('summary_date', toDateString(end));
    if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
    const { data, error } = await q.limit(1000);
    return formatApiResponse(data, error);
  },

  async getCustomersDetails(filters) {
    const { branchIds = null, start, end } = filters;
    let q = supabase.from('vw_customers_detail').select('*').gte('onboarding_date', toDateString(start)).lte('onboarding_date', toDateString(end));
    if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
    const { data, error } = await q.limit(1000);
    return formatApiResponse(data, error);
  },

  async getAccountsDetails(filters) {
    const { branchIds = null, productIds = null, start, end } = filters;
    let q = supabase.from('vw_accounts_detail').select('*').gte('opening_date', toDateString(start)).lte('opening_date', toDateString(end));
    if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
    if (productIds && productIds.length) q = q.in('product_id', productIds);
    const { data, error } = await q.limit(1000);
    return formatApiResponse(data, error);
  },

  async getCasesDetails(filters) {
    const { branchIds = null, productTypes = null, start, end } = filters;
    let q = supabase.from('vw_cases_detail').select('*').gte('created_at', toDateString(start)).lte('created_at', toDateString(end));
    if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
    if (productTypes && productTypes.length) q = q.in('product_type', productTypes);
    const { data, error } = await q.limit(1000);
    return formatApiResponse(data, error);
  }
};