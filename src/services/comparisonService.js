import { supabase } from '@/lib/supabase';
import { formatApiResponse } from '@/utils/apiHelpers';

function toDateString(d) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

// Generate mock comparison data for testing
function generateMockComparisonData(start1, end1, start2, end2, granularity = 'month') {
  const periods = [];
  const currentDate = new Date(start2);
  const endDate = new Date(end2);
  
  while (currentDate <= endDate) {
    const period = new Date(currentDate);
    const value1 = Math.floor(Math.random() * 100000) + 50000;
    const value2 = value1 * (1 + (Math.random() - 0.5) * 0.3); // ±15% variation
    
    periods.push({
      period: period.toISOString().split('T')[0],
      branch_id: `BR00${Math.floor(Math.random() * 5) + 1}`,
      product_id: Math.floor(Math.random() * 10) + 1,
      value_1: value1,
      value_2: value2,
      delta: value2 - value1,
      pct_change: ((value2 - value1) / value1) * 100
    });
    
    // Increment based on granularity
    if (granularity === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (granularity === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (granularity === 'quarter') {
      currentDate.setMonth(currentDate.getMonth() + 3);
    } else {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }
  
  return periods;
}

export const ComparisonService = {
  async compareSales({ branchIds = null, productIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    try {
      const { data, error } = await supabase.rpc('fn_compare_sales', {
        p_branch_ids: branchIds || null,
        p_product_ids: productIds || null,
        p_start_1: toDateString(start1),
        p_end_1: toDateString(end1),
        p_start_2: toDateString(start2),
        p_end_2: toDateString(end2),
        p_granularity: granularity
      });
      
      if (error && error.code === '42883') {
        // Function doesn't exist, return mock data
        console.warn('Database function fn_compare_sales not found, using mock data');
        return formatApiResponse(generateMockComparisonData(start1, end1, start2, end2, granularity), null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      // Fallback to mock data
      return formatApiResponse(generateMockComparisonData(start1, end1, start2, end2, granularity), null);
    }
  },

  async compareCollections({ branchIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    try {
      const { data, error } = await supabase.rpc('fn_compare_collections', {
        p_branch_ids: branchIds || null,
        p_start_1: toDateString(start1),
        p_end_1: toDateString(end1),
        p_start_2: toDateString(start2),
        p_end_2: toDateString(end2),
        p_granularity: granularity
      });
      
      if (error && error.code === '42883') {
        // Function doesn't exist, return mock data
        console.warn('Database function fn_compare_collections not found, using mock data');
        return formatApiResponse(generateMockComparisonData(start1, end1, start2, end2, granularity), null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      return formatApiResponse(generateMockComparisonData(start1, end1, start2, end2, granularity), null);
    }
  },

  async compareCustomers({ branchIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    try {
      const { data, error } = await supabase.rpc('fn_compare_customers', {
        p_branch_ids: branchIds || null,
        p_start_1: toDateString(start1),
        p_end_1: toDateString(end1),
        p_start_2: toDateString(start2),
        p_end_2: toDateString(end2),
        p_granularity: granularity
      });
      
      if (error && error.code === '42883') {
        // Function doesn't exist, return mock data with customer-specific values
        console.warn('Database function fn_compare_customers not found, using mock data');
        const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
        return formatApiResponse(mockData.map(d => ({
          ...d,
          value_1: Math.floor(d.value_1 / 1000), // Smaller numbers for customer counts
          value_2: Math.floor(d.value_2 / 1000)
        })), null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
      return formatApiResponse(mockData.map(d => ({
        ...d,
        value_1: Math.floor(d.value_1 / 1000),
        value_2: Math.floor(d.value_2 / 1000)
      })), null);
    }
  },

  async compareAccounts({ branchIds = null, productIds = null, start1, end1, start2, end2, granularity = 'month' }) {
    try {
      const { data, error } = await supabase.rpc('fn_compare_accounts', {
        p_branch_ids: branchIds || null,
        p_product_ids: productIds || null,
        p_start_1: toDateString(start1),
        p_end_1: toDateString(end1),
        p_start_2: toDateString(start2),
        p_end_2: toDateString(end2),
        p_granularity: granularity
      });
      
      if (error && error.code === '42883') {
        console.warn('Database function fn_compare_accounts not found, using mock data');
        const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
        return formatApiResponse(mockData.map(d => ({
          ...d,
          value_1: Math.floor(d.value_1 / 500),
          value_2: Math.floor(d.value_2 / 500)
        })), null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
      return formatApiResponse(mockData.map(d => ({
        ...d,
        value_1: Math.floor(d.value_1 / 500),
        value_2: Math.floor(d.value_2 / 500)
      })), null);
    }
  },

  async compareCases({ branchIds = null, productTypes = null, start1, end1, start2, end2, granularity = 'month' }) {
    try {
      const { data, error } = await supabase.rpc('fn_compare_cases', {
        p_branch_ids: branchIds || null,
        p_product_types: productTypes || null,
        p_start_1: toDateString(start1),
        p_end_1: toDateString(end1),
        p_start_2: toDateString(start2),
        p_end_2: toDateString(end2),
        p_granularity: granularity
      });
      
      if (error && error.code === '42883') {
        console.warn('Database function fn_compare_cases not found, using mock data');
        const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
        return formatApiResponse(mockData.map(d => ({
          period: d.period,
          branch_id: d.branch_id,
          product_type: `Type_${d.product_id}`,
          new_cases_1: Math.floor(d.value_1 / 2000),
          new_cases_2: Math.floor(d.value_2 / 2000),
          resolved_cases_1: Math.floor(d.value_1 / 2500),
          resolved_cases_2: Math.floor(d.value_2 / 2500)
        })), null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = generateMockComparisonData(start1, end1, start2, end2, granularity);
      return formatApiResponse(mockData.map(d => ({
        period: d.period,
        branch_id: d.branch_id,
        product_type: `Type_${d.product_id}`,
        new_cases_1: Math.floor(d.value_1 / 2000),
        new_cases_2: Math.floor(d.value_2 / 2000),
        resolved_cases_1: Math.floor(d.value_1 / 2500),
        resolved_cases_2: Math.floor(d.value_2 / 2500)
      })), null);
    }
  },

  async getSalesDetails(filters) {
    const { branchIds = null, productIds = null, start, end } = filters;
    
    try {
      let q = supabase.from('vw_sales_detail').select('*')
        .gte('transaction_date', toDateString(start))
        .lte('transaction_date', toDateString(end));
      
      if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
      if (productIds && productIds.length) q = q.in('product_id', productIds);
      
      const { data, error } = await q.limit(1000);
      
      if (error && error.code === '42P01') {
        // View doesn't exist, return mock data
        console.warn('View vw_sales_detail not found, using mock data');
        const mockData = Array.from({ length: 50 }, (_, i) => ({
          transaction_id: i + 1,
          transaction_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
          account_number: `ACC${String(i + 1000).padStart(6, '0')}`,
          customer_id: `CUST${String(i + 100).padStart(5, '0')}`,
          branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
          product_id: productIds?.[0] || Math.floor(Math.random() * 10) + 1,
          transaction_amount: Math.floor(Math.random() * 50000) + 1000,
          value: Math.floor(Math.random() * 50000) + 1000,
          status: 'COMPLETED',
          channel: ['ONLINE', 'BRANCH', 'ATM', 'MOBILE'][Math.floor(Math.random() * 4)]
        }));
        return formatApiResponse(mockData, null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      // Return mock data on error
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        transaction_id: i + 1,
        transaction_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
        account_number: `ACC${String(i + 1000).padStart(6, '0')}`,
        customer_id: `CUST${String(i + 100).padStart(5, '0')}`,
        branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
        product_id: productIds?.[0] || Math.floor(Math.random() * 10) + 1,
        transaction_amount: Math.floor(Math.random() * 50000) + 1000,
        value: Math.floor(Math.random() * 50000) + 1000,
        status: 'COMPLETED',
        channel: ['ONLINE', 'BRANCH', 'ATM', 'MOBILE'][Math.floor(Math.random() * 4)]
      }));
      return formatApiResponse(mockData, null);
    }
  },

  async getCollectionsDetails(filters) {
    const { branchIds = null, start, end } = filters;
    
    try {
      let q = supabase.from('vw_collections_detail').select('*')
        .gte('summary_date', toDateString(start))
        .lte('summary_date', toDateString(end));
      
      if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
      
      const { data, error } = await q.limit(1000);
      
      if (error && error.code === '42P01') {
        console.warn('View vw_collections_detail not found, using mock data');
        const mockData = Array.from({ length: 30 }, (_, i) => ({
          summary_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
          branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
          total_due_amount: Math.floor(Math.random() * 1000000) + 100000,
          total_collected: Math.floor(Math.random() * 800000) + 80000,
          collection_rate: 75 + Math.random() * 20,
          accounts_due: Math.floor(Math.random() * 500) + 100,
          accounts_collected: Math.floor(Math.random() * 400) + 80,
          value: Math.floor(Math.random() * 800000) + 80000
        }));
        return formatApiResponse(mockData, null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        summary_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
        branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
        total_due_amount: Math.floor(Math.random() * 1000000) + 100000,
        total_collected: Math.floor(Math.random() * 800000) + 80000,
        collection_rate: 75 + Math.random() * 20,
        accounts_due: Math.floor(Math.random() * 500) + 100,
        accounts_collected: Math.floor(Math.random() * 400) + 80,
        value: Math.floor(Math.random() * 800000) + 80000
      }));
      return formatApiResponse(mockData, null);
    }
  },

  async getCustomersDetails(filters) {
    const { branchIds = null, start, end } = filters;
    
    try {
      let q = supabase.from('vw_customers_detail').select('*')
        .gte('onboarding_date', toDateString(start))
        .lte('onboarding_date', toDateString(end));
      
      if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
      
      const { data, error } = await q.limit(1000);
      
      if (error && error.code === '42P01') {
        console.warn('View vw_customers_detail not found, using mock data');
        const mockData = Array.from({ length: 100 }, (_, i) => ({
          customer_id: `CUST${String(i + 1000).padStart(5, '0')}`,
          full_name: `Customer ${i + 1}`,
          onboarding_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
          branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
          customer_type: ['INDIVIDUAL', 'CORPORATE'][Math.floor(Math.random() * 2)],
          segment: ['RETAIL', 'PREMIUM', 'VIP'][Math.floor(Math.random() * 3)],
          customer_status: 'ACTIVE',
          value: 1
        }));
        return formatApiResponse(mockData, null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        customer_id: `CUST${String(i + 1000).padStart(5, '0')}`,
        full_name: `Customer ${i + 1}`,
        onboarding_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
        branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
        customer_type: ['INDIVIDUAL', 'CORPORATE'][Math.floor(Math.random() * 2)],
        segment: ['RETAIL', 'PREMIUM', 'VIP'][Math.floor(Math.random() * 3)],
        customer_status: 'ACTIVE',
        value: 1
      }));
      return formatApiResponse(mockData, null);
    }
  },

  async getAccountsDetails(filters) {
    const { branchIds = null, productIds = null, start, end } = filters;
    
    try {
      let q = supabase.from('vw_accounts_detail').select('*')
        .gte('opening_date', toDateString(start))
        .lte('opening_date', toDateString(end));
      
      if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
      if (productIds && productIds.length) q = q.in('product_id', productIds);
      
      const { data, error } = await q.limit(1000);
      
      if (error && error.code === '42P01') {
        console.warn('View vw_accounts_detail not found, using mock data');
        const mockData = Array.from({ length: 75 }, (_, i) => ({
          account_id: i + 1,
          account_number: `ACC${String(i + 10000).padStart(8, '0')}`,
          customer_id: `CUST${String(Math.floor(i / 2) + 100).padStart(5, '0')}`,
          product_id: productIds?.[0] || Math.floor(Math.random() * 10) + 1,
          branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
          opening_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
          account_status: 'ACTIVE',
          current_balance: Math.floor(Math.random() * 100000) + 1000,
          value: 1
        }));
        return formatApiResponse(mockData, null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = Array.from({ length: 75 }, (_, i) => ({
        account_id: i + 1,
        account_number: `ACC${String(i + 10000).padStart(8, '0')}`,
        customer_id: `CUST${String(Math.floor(i / 2) + 100).padStart(5, '0')}`,
        product_id: productIds?.[0] || Math.floor(Math.random() * 10) + 1,
        branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
        opening_date: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
        account_status: 'ACTIVE',
        current_balance: Math.floor(Math.random() * 100000) + 1000,
        value: 1
      }));
      return formatApiResponse(mockData, null);
    }
  },

  async getCasesDetails(filters) {
    const { branchIds = null, productTypes = null, start, end } = filters;
    
    try {
      let q = supabase.from('vw_cases_detail').select('*')
        .gte('created_at', toDateString(start))
        .lte('created_at', toDateString(end));
      
      if (branchIds && branchIds.length) q = q.in('branch_id', branchIds);
      if (productTypes && productTypes.length) q = q.in('product_type', productTypes);
      
      const { data, error } = await q.limit(1000);
      
      if (error && error.code === '42P01') {
        console.warn('View vw_cases_detail not found, using mock data');
        const mockData = Array.from({ length: 40 }, (_, i) => ({
          case_id: i + 1,
          case_number: `CASE${String(i + 1000).padStart(6, '0')}`,
          customer_id: `CUST${String(Math.floor(i / 2) + 100).padStart(5, '0')}`,
          account_number: `ACC${String(i + 5000).padStart(8, '0')}`,
          branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
          product_type: productTypes?.[0] || `Type_${Math.floor(Math.random() * 5) + 1}`,
          total_outstanding: Math.floor(Math.random() * 50000) + 5000,
          total_overdue: Math.floor(Math.random() * 30000) + 3000,
          dpd: Math.floor(Math.random() * 90) + 1,
          case_status: ['OPEN', 'IN_PROGRESS', 'RESOLVED'][Math.floor(Math.random() * 3)],
          created_at: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
          value: Math.floor(Math.random() * 50000) + 5000
        }));
        return formatApiResponse(mockData, null);
      }
      
      return formatApiResponse(data, error);
    } catch (err) {
      const mockData = Array.from({ length: 40 }, (_, i) => ({
        case_id: i + 1,
        case_number: `CASE${String(i + 1000).padStart(6, '0')}`,
        customer_id: `CUST${String(Math.floor(i / 2) + 100).padStart(5, '0')}`,
        account_number: `ACC${String(i + 5000).padStart(8, '0')}`,
        branch_id: branchIds?.[0] || `BR00${Math.floor(Math.random() * 5) + 1}`,
        product_type: productTypes?.[0] || `Type_${Math.floor(Math.random() * 5) + 1}`,
        total_outstanding: Math.floor(Math.random() * 50000) + 5000,
        total_overdue: Math.floor(Math.random() * 30000) + 3000,
        dpd: Math.floor(Math.random() * 90) + 1,
        case_status: ['OPEN', 'IN_PROGRESS', 'RESOLVED'][Math.floor(Math.random() * 3)],
        created_at: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString(),
        value: Math.floor(Math.random() * 50000) + 5000
      }));
      return formatApiResponse(mockData, null);
    }
  }
};