import { supabaseBanking, TABLES } from '@/lib/supabase';

// Helper function to handle database errors
const handleError = (error, defaultData = null) => {
  console.error('Database query error:', error);
  return { data: defaultData, error: error.message };
};

// Customer Details Service
export const customerDetailsService = {
  // Get customer overview stats
  async getOverviewStats() {
    try {
      // Total customers
      const { count: totalCustomers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true });

      // Active customers (with active accounts)
      const { data: activeCustomers } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('customer_id', { count: 'exact' })
        .eq('account_status', 'ACTIVE');
      
      const uniqueActiveCustomers = new Set(activeCustomers?.map(a => a.customer_id) || []).size;

      // New customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newCustomersMonth } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Customer segments
      const { data: segments } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_type_id, customer_types!inner(type_name)')
        .order('customer_type_id');

      const segmentCounts = segments?.reduce((acc, curr) => {
        const typeName = curr.customer_types?.type_name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        data: {
          totalCustomers: totalCustomers || 0,
          activeCustomers: uniqueActiveCustomers,
          newCustomersMonth: newCustomersMonth || 0,
          segments: segmentCounts,
          growthRate: ((newCustomersMonth || 0) / (totalCustomers || 1) * 100).toFixed(2)
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  // Get customer breakdown by various dimensions
  async getBreakdown() {
    try {
      // By branch
      const { data: byBranch } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('branch_id, branches!inner(branch_name)')
        .order('branch_id');

      const branchBreakdown = byBranch?.reduce((acc, curr) => {
        const branchName = curr.branches?.branch_name || 'Unknown';
        acc[branchName] = (acc[branchName] || 0) + 1;
        return acc;
      }, {}) || {};

      // By age group
      const { data: customers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('date_of_birth');

      const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
      customers?.forEach(customer => {
        if (customer.date_of_birth) {
          const age = new Date().getFullYear() - new Date(customer.date_of_birth).getFullYear();
          if (age >= 18 && age <= 25) ageGroups['18-25']++;
          else if (age >= 26 && age <= 35) ageGroups['26-35']++;
          else if (age >= 36 && age <= 45) ageGroups['36-45']++;
          else if (age >= 46 && age <= 55) ageGroups['46-55']++;
          else if (age >= 56) ageGroups['56+']++;
        }
      });

      // By gender
      const { data: genderData } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('gender');

      const genderBreakdown = genderData?.reduce((acc, curr) => {
        const gender = curr.gender || 'Not Specified';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        data: {
          byBranch: branchBreakdown,
          byAgeGroup: ageGroups,
          byGender: genderBreakdown
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  // Get customer trend data
  async getCustomerTrends(days = 30) {
    try {
      const dates = [];
      const trends = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { count } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        dates.push(date.toLocaleDateString());
        trends.push(count || 0);
      }

      return {
        data: { dates, values: trends },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], values: [] });
    }
  }
};

// Account Details Service
export const accountDetailsService = {
  async getOverviewStats() {
    try {
      // Total accounts
      const { count: totalAccounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      // Active accounts
      const { count: activeAccounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'ACTIVE');

      // Account types breakdown
      const { data: accountTypes } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_type_id, account_types!inner(type_name)');

      const typeBreakdown = accountTypes?.reduce((acc, curr) => {
        const typeName = curr.account_types?.type_name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {}) || {};

      // Total balance
      const { data: balances } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');

      const totalBalance = balances?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

      return {
        data: {
          totalAccounts: totalAccounts || 0,
          activeAccounts: activeAccounts || 0,
          dormantAccounts: (totalAccounts || 0) - (activeAccounts || 0),
          accountTypes: typeBreakdown,
          totalBalance: totalBalance,
          averageBalance: totalBalance / (activeAccounts || 1)
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // By status
      const { data: statusData } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_status');

      const statusBreakdown = statusData?.reduce((acc, curr) => {
        const status = curr.account_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // By currency
      const { data: currencyData } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('currency_code');

      const currencyBreakdown = currencyData?.reduce((acc, curr) => {
        const currency = curr.currency_code || 'SAR';
        acc[currency] = (acc[currency] || 0) + 1;
        return acc;
      }, {}) || {};

      // By balance range
      const { data: balanceData } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');

      const balanceRanges = {
        '0-10K': 0,
        '10K-50K': 0,
        '50K-100K': 0,
        '100K-500K': 0,
        '500K+': 0
      };

      balanceData?.forEach(acc => {
        const balance = acc.current_balance || 0;
        if (balance < 10000) balanceRanges['0-10K']++;
        else if (balance < 50000) balanceRanges['10K-50K']++;
        else if (balance < 100000) balanceRanges['50K-100K']++;
        else if (balance < 500000) balanceRanges['100K-500K']++;
        else balanceRanges['500K+']++;
      });

      return {
        data: {
          byStatus: statusBreakdown,
          byCurrency: currencyBreakdown,
          byBalanceRange: balanceRanges
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  }
};

// Revenue Details Service
export const revenueDetailsService = {
  async getOverviewStats() {
    try {
      // Current month revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthRevenue } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .in('transaction_type_id', ['FEE', 'CHARGE', 'INTEREST']) // Revenue-generating transactions
        .gte('transaction_date', startOfMonth.toISOString());

      const currentMonthRevenue = monthRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Previous month revenue
      const startOfPrevMonth = new Date(startOfMonth);
      startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
      const endOfPrevMonth = new Date(startOfMonth);
      endOfPrevMonth.setDate(0);

      const { data: prevMonthRevenue } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .in('transaction_type_id', ['FEE', 'CHARGE', 'INTEREST'])
        .gte('transaction_date', startOfPrevMonth.toISOString())
        .lt('transaction_date', startOfMonth.toISOString());

      const previousMonthRevenue = prevMonthRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Year to date revenue
      const startOfYear = new Date();
      startOfYear.setMonth(0);
      startOfYear.setDate(1);
      startOfYear.setHours(0, 0, 0, 0);

      const { data: ytdRevenue } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .in('transaction_type_id', ['FEE', 'CHARGE', 'INTEREST'])
        .gte('transaction_date', startOfYear.toISOString());

      const yearToDateRevenue = ytdRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const growthRate = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(2)
        : 0;

      return {
        data: {
          currentMonth: currentMonthRevenue,
          previousMonth: previousMonthRevenue,
          yearToDate: yearToDateRevenue,
          growthRate: growthRate,
          dailyAverage: currentMonthRevenue / new Date().getDate()
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // By product
      const { data: productRevenue } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('product_id, products!inner(product_name), total_interest_paid');

      const productBreakdown = productRevenue?.reduce((acc, curr) => {
        const productName = curr.products?.product_name || 'Unknown';
        acc[productName] = (acc[productName] || 0) + (curr.total_interest_paid || 0);
        return acc;
      }, {}) || {};

      // By branch
      const { data: branchAccounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_id, customers!inner(branch_id, branches!inner(branch_name))');

      // This would need transaction data linked to accounts for accurate branch revenue
      // For now, we'll use a simplified approach

      // By revenue type
      const revenueTypes = {
        'Interest Income': 0,
        'Fee Income': 0,
        'Commission Income': 0,
        'Other Income': 0
      };

      // Mock data for demonstration
      const totalRevenue = Object.values(productBreakdown).reduce((sum, val) => sum + val, 0);
      revenueTypes['Interest Income'] = totalRevenue * 0.6;
      revenueTypes['Fee Income'] = totalRevenue * 0.25;
      revenueTypes['Commission Income'] = totalRevenue * 0.1;
      revenueTypes['Other Income'] = totalRevenue * 0.05;

      return {
        data: {
          byProduct: productBreakdown,
          byRevenueType: revenueTypes
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getRevenueTrends(days = 30) {
    try {
      const dates = [];
      const values = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const { data } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('amount')
          .in('transaction_type_id', ['FEE', 'CHARGE', 'INTEREST'])
          .gte('transaction_date', date.toISOString())
          .lt('transaction_date', nextDate.toISOString());
        
        const dailyRevenue = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
        
        dates.push(date.toLocaleDateString());
        values.push(dailyRevenue);
      }

      return {
        data: { dates, values },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], values: [] });
    }
  }
};

// Transaction Details Service
export const transactionDetailsService = {
  async getOverviewStats() {
    try {
      // Today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .gte('transaction_date', today.toISOString());

      // This week's transactions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const { count: weekCount } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .gte('transaction_date', weekStart.toISOString());

      // Transaction volume
      const { data: volumeData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('amount')
        .gte('transaction_date', today.toISOString());

      const todayVolume = volumeData?.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0;

      // Average transaction size
      const avgTransactionSize = todayCount > 0 ? todayVolume / todayCount : 0;

      return {
        data: {
          todayCount: todayCount || 0,
          weekCount: weekCount || 0,
          todayVolume: todayVolume,
          averageSize: avgTransactionSize,
          successRate: 98.5 // Mock success rate
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // By type
      const { data: typeData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_type_id, transaction_types!inner(type_name)');

      const typeBreakdown = typeData?.reduce((acc, curr) => {
        const typeName = curr.transaction_types?.type_name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {}) || {};

      // By status
      const { data: statusData } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_status');

      const statusBreakdown = statusData?.reduce((acc, curr) => {
        const status = curr.transaction_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // By channel (mock data)
      const channelBreakdown = {
        'Mobile Banking': 45,
        'Internet Banking': 30,
        'ATM': 15,
        'Branch': 10
      };

      return {
        data: {
          byType: typeBreakdown,
          byStatus: statusBreakdown,
          byChannel: channelBreakdown
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getHourlyDistribution() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hourlyData = new Array(24).fill(0);
      
      const { data: transactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_date')
        .gte('transaction_date', today.toISOString());

      transactions?.forEach(t => {
        const hour = new Date(t.transaction_date).getHours();
        hourlyData[hour]++;
      });

      return {
        data: {
          hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          values: hourlyData
        },
        error: null
      };
    } catch (error) {
      return handleError(error, { hours: [], values: [] });
    }
  }
};

// Generic KPI Details Service
export const kpiDetailsService = {
  async getDetailsByType(kpiType, widgetId) {
    switch (kpiType) {
      case 'customers':
        return customerDetailsService.getOverviewStats();
      case 'accounts':
        return accountDetailsService.getOverviewStats();
      case 'revenue':
        return revenueDetailsService.getOverviewStats();
      case 'transactions':
        return transactionDetailsService.getOverviewStats();
      default:
        return { data: null, error: 'Unknown KPI type' };
    }
  }
};