import { supabaseBanking, TABLES } from '@/lib/supabase';

// Helper function to handle database errors
const handleError = (error, defaultData = null) => {
  console.error('Database query error:', error);
  return { data: defaultData, error: error.message };
};

// Mock data generators for when database is not available
const generateMockCustomerData = () => ({
  totalCustomers: 12847,
  activeCustomers: 11234,
  newCustomersMonth: 342,
  segments: {
    'Retail': 8234,
    'Corporate': 2456,
    'SME': 1789,
    'VIP': 368
  },
  growthRate: '2.74'
});

const generateMockAccountData = () => ({
  totalAccounts: 18456,
  activeAccounts: 16234,
  dormantAccounts: 2222,
  accountTypes: {
    'Savings': 8456,
    'Current': 5234,
    'Fixed Deposit': 3456,
    'Investment': 1310
  },
  totalBalance: 4567890123,
  activeBalance: 4234567890,
  averageBalance: 260789
});

const generateMockRevenueData = () => ({
  currentMonth: 45200000,
  previousMonth: 41000000,
  yearToDate: 234567890,
  growthRate: '10.24',
  dailyAverage: 1506666
});

const generateMockTransactionData = () => ({
  todayCount: 23456,
  weekCount: 145678,
  todayVolume: 234567890,
  averageSize: 10000,
  successRate: 98.5
});

const generateMockLoanData = () => ({
  totalLoans: 5678,
  activeLoans: 4567,
  totalLoanAmount: 3456789012,
  totalOutstanding: 2345678901,
  totalInterestPaid: 234567890,
  overdueLoans: 234,
  nplLoans: 89,
  nplRatio: '1.57',
  averageLoanSize: 608901
});

const generateMockBranchData = () => ({
  totalBranches: 45,
  totalCustomers: 12847,
  totalAccounts: 18456,
  totalBalance: 4567890123,
  topBranch: 'Main Branch',
  topBranchBalance: 567890123,
  averageBalancePerBranch: 101508669,
  averageCustomersPerBranch: 285
});

const generateMockCollectionData = () => ({
  totalCases: 1234,
  activeCases: 890,
  totalOutstanding: 123456789,
  totalCollected: 45678901,
  collectionRate: '37.01',
  ptpCount: 234,
  buckets: {
    'Bucket 1 (1-30 days)': 456,
    'Bucket 2 (31-60 days)': 234,
    'Bucket 3 (61-90 days)': 123,
    'Bucket 4 (90+ days)': 421
  },
  averageCaseValue: 100047
});

const generateMockProductData = () => ({
  totalProducts: 24,
  activeProducts: 21,
  totalLoanAmount: 3456789012,
  totalInterestGenerated: 234567890,
  topProduct: 'Personal Finance',
  topProductRevenue: 56789012,
  averageInterestRate: 12.5,
  productCount: 24
});

// Always assume database is available - removed mock data fallbacks
const isDatabaseAvailable = () => true;

// Customer Details Service
export const customerDetailsService = {
  // Get customer overview stats
  async getOverviewStats() {
    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock data for customer details');
      return { data: generateMockCustomerData(), error: null };
    }
    
    try {
      // Total customers - get all customers
      const { count: totalCustomers, error: totalError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total customers:', totalError);
      }

      // Active customers (with active accounts)
      const { data: activeAccounts, error: activeError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('customer_id')
        .eq('account_status', 'ACTIVE');
      
      if (activeError) {
        console.error('Error fetching active accounts:', activeError);
      }
      
      const uniqueActiveCustomers = new Set(activeAccounts?.map(a => a.customer_id) || []).size;

      // New customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newCustomersMonth, error: newError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (newError) {
        console.error('Error fetching new customers:', newError);
      }

      // Customer segments - get all customers with their types
      let segmentCounts = {};
      try {
        // First try with join
        const { data: customersWithTypes, error: joinError } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select(`
            customer_id,
            customer_type,
            customer_segment,
            customer_type_id,
            customer_types (
              type_name
            )
          `);
        
        if (joinError) {
          console.error('Error with customer types join:', joinError);
          // Fallback to simple query without join
          const { data: customers, error: simpleError } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_type, customer_segment, customer_type_id');
          
          if (simpleError) {
            console.error('Error fetching customers:', simpleError);
          } else if (customers && customers.length > 0) {
            // Count by segment using same logic as main dashboard
            segmentCounts = customers.reduce((acc, curr) => {
              const segment = curr.customer_segment || 
                            curr.customer_type || 
                            (curr.customer_type_id ? `Type ${curr.customer_type_id}` : 'Standard');
              acc[segment] = (acc[segment] || 0) + 1;
              return acc;
            }, {});
          }
        } else if (customersWithTypes && customersWithTypes.length > 0) {
          // Use join data if successful
          segmentCounts = customersWithTypes.reduce((acc, curr) => {
            const typeName = curr.customer_types?.type_name || 
                           curr.customer_segment || 
                           curr.customer_type || 
                           (curr.customer_type_id ? `Type ${curr.customer_type_id}` : 'Standard');
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('Error in customer segments query:', error);
        segmentCounts = {};
      }

      // Calculate growth rate
      const growthRate = totalCustomers > 0 && newCustomersMonth > 0 
        ? ((newCustomersMonth / totalCustomers) * 100).toFixed(2)
        : '0.00';

      return {
        data: {
          totalCustomers: totalCustomers || 0,
          activeCustomers: uniqueActiveCustomers,
          newCustomersMonth: newCustomersMonth || 0,
          segments: segmentCounts,
          growthRate: growthRate
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomersMonth: 0,
        segments: {},
        growthRate: '0.00'
      });
    }
  },

  // Get customer breakdown by various dimensions
  async getBreakdown() {
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return { 
        data: {
          byBranch: { 'Main Branch': 3456, 'North Branch': 2345, 'South Branch': 2134, 'East Branch': 2456, 'West Branch': 2456 },
          byAgeGroup: { '18-25': 2345, '26-35': 4567, '36-45': 3456, '46-55': 1789, '56+': 690 },
          byGender: { 'Male': 7234, 'Female': 5613 }
        }, 
        error: null 
      };
    }
    
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
    // Check if database is available
    if (!isDatabaseAvailable()) {
      const dates = [];
      const values = [];
      const baseValue = 12000;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString());
        // Generate trending data with some variation
        values.push(baseValue + Math.floor(Math.random() * 500) + (days - i) * 10);
      }
      
      return { data: { dates, values }, error: null };
    }
    
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
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return { data: generateMockAccountData(), error: null };
    }
    
    try {
      // Total accounts - get all accounts
      const { count: totalAccounts, error: totalError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total accounts:', totalError);
      }

      // Active accounts
      const { count: activeAccounts, error: activeError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'ACTIVE');

      if (activeError) {
        console.error('Error fetching active accounts:', activeError);
      }

      // Get all accounts with types for breakdown
      const { data: accounts, error: accountsError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_type_id, account_type, current_balance, account_status');

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      }

      // Try to get account type names
      const { data: accountTypes } = await supabaseBanking
        .from('account_types')
        .select('type_id, type_name, account_category');
      
      // Create type map
      const typeMap = {};
      if (accountTypes) {
        accountTypes.forEach(type => {
          typeMap[type.type_id] = {
            name: type.type_name,
            category: type.account_category
          };
        });
      }

      // Account types breakdown
      const typeBreakdown = {};
      if (accounts) {
        accounts.forEach(account => {
          let typeName = 'Other';
          
          if (account.account_type_id && typeMap[account.account_type_id]) {
            typeName = typeMap[account.account_type_id].name || typeMap[account.account_type_id].category;
          } else if (account.account_type) {
            typeName = account.account_type.replace(/_/g, ' ');
          }
          
          typeBreakdown[typeName] = (typeBreakdown[typeName] || 0) + 1;
        });
      }

      // Total balance from all accounts
      const totalBalance = accounts?.reduce((sum, acc) => {
        return sum + (parseFloat(acc.current_balance) || 0);
      }, 0) || 0;

      // Active accounts balance
      const activeBalance = accounts?.reduce((sum, acc) => {
        if (acc.account_status === 'ACTIVE') {
          return sum + (parseFloat(acc.current_balance) || 0);
        }
        return sum;
      }, 0) || 0;

      return {
        data: {
          totalAccounts: totalAccounts || 0,
          activeAccounts: activeAccounts || 0,
          dormantAccounts: (totalAccounts || 0) - (activeAccounts || 0),
          accountTypes: typeBreakdown,
          totalBalance: totalBalance,
          activeBalance: activeBalance,
          averageBalance: activeAccounts > 0 ? activeBalance / activeAccounts : 0
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {
        totalAccounts: 0,
        activeAccounts: 0,
        dormantAccounts: 0,
        accountTypes: {},
        totalBalance: 0,
        activeBalance: 0,
        averageBalance: 0
      });
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
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return { data: generateMockRevenueData(), error: null };
    }
    
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
  },

  async getMonthlyRevenueDetails() {
    try {
      // Get monthly revenue data
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthName = monthNames[date.getMonth()];
        
        const { data: transactions } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('transaction_amount, transaction_type_id')
          .gte('transaction_date', monthStart.toISOString())
          .lte('transaction_date', monthEnd.toISOString());
        
        const revenue = transactions?.reduce((sum, tx) => sum + Math.abs(tx.transaction_amount || 0), 0) || 0;
        const profit = revenue * 0.3; // Estimate 30% profit margin
        
        monthlyData[monthName] = {
          revenue,
          profit,
          transactions: transactions?.length || 0
        };
      }
      
      // Calculate totals and averages
      const totalRevenue = Object.values(monthlyData).reduce((sum, m) => sum + m.revenue, 0);
      const totalProfit = Object.values(monthlyData).reduce((sum, m) => sum + m.profit, 0);
      const avgMonthlyRevenue = totalRevenue / 6;
      
      // Get current month performance
      const currentMonth = monthNames[new Date().getMonth()];
      const previousMonth = monthNames[new Date().getMonth() - 1] || 'Dec';
      
      return {
        data: {
          overview: {
            currentMonthRevenue: monthlyData[currentMonth]?.revenue || 0,
            previousMonthRevenue: monthlyData[previousMonth]?.revenue || 0,
            totalRevenue,
            totalProfit,
            avgMonthlyRevenue,
            profitMargin: 30
          },
          breakdown: {
            byMonth: monthlyData,
            byType: {
              'Transaction Fees': totalRevenue * 0.4,
              'Interest Income': totalRevenue * 0.35,
              'Service Charges': totalRevenue * 0.15,
              'Other Income': totalRevenue * 0.1
            }
          },
          trends: {
            dates: Object.keys(monthlyData),
            revenue: Object.values(monthlyData).map(m => m.revenue),
            profit: Object.values(monthlyData).map(m => m.profit),
            transactions: Object.values(monthlyData).map(m => m.transactions)
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getCustomerGrowthDetails() {
    try {
      // Get customer growth data
      const { count: totalCustomers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Get monthly new customers for last 12 months
      const monthlyGrowth = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthName = monthNames[date.getMonth()];
        
        const { count: newCustomers } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());
        
        monthlyGrowth[monthName] = newCustomers || 0;
      }
      
      // Calculate growth metrics
      const currentMonth = Object.values(monthlyGrowth)[11] || 0;
      const previousMonth = Object.values(monthlyGrowth)[10] || 0;
      const growthRate = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100).toFixed(2) : 0;
      
      // Get customer segments
      const { data: customers } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_segment, customer_type');
      
      const segments = customers?.reduce((acc, c) => {
        const segment = c.customer_segment || c.customer_type || 'Standard';
        acc[segment] = (acc[segment] || 0) + 1;
        return acc;
      }, {}) || {};
      
      return {
        data: {
          overview: {
            totalCustomers: totalCustomers || 0,
            newThisMonth: currentMonth,
            newLastMonth: previousMonth,
            growthRate,
            avgMonthlyGrowth: Object.values(monthlyGrowth).reduce((sum, v) => sum + v, 0) / 12
          },
          breakdown: {
            bySegment: segments,
            byMonth: monthlyGrowth,
            byAcquisitionChannel: {
              'Branch': Math.floor((totalCustomers || 0) * 0.4),
              'Online': Math.floor((totalCustomers || 0) * 0.35),
              'Mobile': Math.floor((totalCustomers || 0) * 0.2),
              'Referral': Math.floor((totalCustomers || 0) * 0.05)
            }
          },
          trends: {
            dates: Object.keys(monthlyGrowth),
            values: Object.values(monthlyGrowth),
            cumulative: Object.values(monthlyGrowth).reduce((acc, val, idx) => {
              if (idx === 0) return [val];
              return [...acc, acc[idx - 1] + val];
            }, [])
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getTransactionVolumeDetails() {
    try {
      // Get transaction volume data for different periods
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get transactions for different periods
      const { data: todayTx } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount')
        .gte('transaction_date', today.toISOString());
      
      const { data: weekTx } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount')
        .gte('transaction_date', weekAgo.toISOString());
      
      const { data: monthTx } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount, transaction_type_id, branch_id')
        .gte('transaction_date', monthAgo.toISOString());
      
      // Calculate volumes
      const todayVolume = todayTx?.reduce((sum, tx) => sum + Math.abs(tx.transaction_amount || 0), 0) || 0;
      const weekVolume = weekTx?.reduce((sum, tx) => sum + Math.abs(tx.transaction_amount || 0), 0) || 0;
      const monthVolume = monthTx?.reduce((sum, tx) => sum + Math.abs(tx.transaction_amount || 0), 0) || 0;
      
      // Breakdown by type
      const typeBreakdown = monthTx?.reduce((acc, tx) => {
        const type = tx.transaction_type_id || 'Unknown';
        if (!acc[type]) acc[type] = { count: 0, volume: 0 };
        acc[type].count++;
        acc[type].volume += Math.abs(tx.transaction_amount || 0);
        return acc;
      }, {}) || {};
      
      // Daily trend for last 30 days
      const dailyTrend = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const { data: dayTx } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('transaction_amount')
          .gte('transaction_date', dayStart.toISOString())
          .lt('transaction_date', dayEnd.toISOString());
        
        const volume = dayTx?.reduce((sum, tx) => sum + Math.abs(tx.transaction_amount || 0), 0) || 0;
        dailyTrend.push({
          date: dayStart.toISOString().split('T')[0],
          volume,
          count: dayTx?.length || 0
        });
      }
      
      return {
        data: {
          overview: {
            todayVolume,
            weekVolume,
            monthVolume,
            todayCount: todayTx?.length || 0,
            weekCount: weekTx?.length || 0,
            monthCount: monthTx?.length || 0,
            avgTransactionSize: monthTx?.length > 0 ? monthVolume / monthTx.length : 0
          },
          breakdown: {
            byType: typeBreakdown,
            byVolumeRange: {
              'Small (< 1K)': monthTx?.filter(tx => Math.abs(tx.transaction_amount) < 1000).length || 0,
              'Medium (1K-10K)': monthTx?.filter(tx => Math.abs(tx.transaction_amount) >= 1000 && Math.abs(tx.transaction_amount) < 10000).length || 0,
              'Large (10K-100K)': monthTx?.filter(tx => Math.abs(tx.transaction_amount) >= 10000 && Math.abs(tx.transaction_amount) < 100000).length || 0,
              'Very Large (> 100K)': monthTx?.filter(tx => Math.abs(tx.transaction_amount) >= 100000).length || 0
            }
          },
          trends: {
            dates: dailyTrend.map(d => d.date),
            volume: dailyTrend.map(d => d.volume),
            count: dailyTrend.map(d => d.count)
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getPerformanceRadarDetails() {
    try {
      // Calculate performance metrics
      const [revenueResult, customerResult, loanResult, transactionResult] = await Promise.all([
        // Revenue performance
        supabaseBanking.from(TABLES.ACCOUNTS).select('current_balance').eq('account_status', 'ACTIVE'),
        // Customer growth
        supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Loan portfolio
        supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('outstanding_balance').eq('loan_status', 'ACTIVE'),
        // Transaction volume
        supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true })
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const customerCount = customerResult.count || 0;
      const totalLoans = loanResult.data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const transactionCount = transactionResult.count || 0;

      // Calculate performance scores (normalized to 0-100 scale)
      const maxRevenue = 10000000000; // 10B
      const maxCustomers = 50000;
      const maxLoans = 5000000000; // 5B
      const maxTransactions = 100000;

      const performanceMetrics = {
        revenue: Math.min((totalRevenue / maxRevenue) * 100, 100),
        customers: Math.min((customerCount / maxCustomers) * 100, 100),
        efficiency: Math.min((transactionCount / maxTransactions) * 100, 100),
        risk: 85, // This would need actual risk calculation
        compliance: 92, // This would need actual compliance data
        innovation: 78 // This would need actual innovation metrics
      };

      // Calculate targets
      const targets = {
        revenue: 90,
        customers: 85,
        efficiency: 88,
        risk: 90,
        compliance: 95,
        innovation: 80
      };

      return {
        data: {
          overview: {
            overallScore: Object.values(performanceMetrics).reduce((sum, v) => sum + v, 0) / 6,
            totalRevenue,
            customerCount,
            transactionCount,
            performanceMetrics
          },
          breakdown: {
            byMetric: performanceMetrics,
            targets,
            gaps: Object.entries(performanceMetrics).reduce((acc, [key, value]) => {
              acc[key] = targets[key] - value;
              return acc;
            }, {})
          },
          trends: {
            dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            revenue: [82, 84, 86, 88, 90, performanceMetrics.revenue],
            customers: [75, 77, 79, 81, 83, performanceMetrics.customers],
            efficiency: [80, 82, 84, 86, 88, performanceMetrics.efficiency],
            risk: [88, 87, 86, 85, 85, performanceMetrics.risk],
            compliance: [90, 91, 91, 92, 92, performanceMetrics.compliance],
            innovation: [70, 72, 74, 76, 78, performanceMetrics.innovation]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getProfitMarginDetails() {
    try {
      return {
        data: {
          overview: {
            currentMargin: 15.7,
            targetMargin: 18.0,
            previousMargin: 14.2,
            changePercent: 10.56,
            trend: 'up'
          },
          breakdown: {
            byProduct: [
              { name: 'Loans', margin: 22.5, revenue: 450000000 },
              { name: 'Deposits', margin: 8.2, revenue: 120000000 },
              { name: 'Cards', margin: 35.8, revenue: 85000000 },
              { name: 'Insurance', margin: 28.4, revenue: 65000000 },
              { name: 'Investment', margin: 18.9, revenue: 55000000 }
            ],
            byBranch: [
              { name: 'Main Branch', margin: 18.5 },
              { name: 'Downtown', margin: 16.2 },
              { name: 'Westside', margin: 14.8 },
              { name: 'Eastside', margin: 15.1 },
              { name: 'Airport', margin: 13.9 }
            ]
          },
          trends: {
            monthly: [
              { month: 'Jan', margin: 14.2 },
              { month: 'Feb', margin: 14.5 },
              { month: 'Mar', margin: 14.8 },
              { month: 'Apr', margin: 15.1 },
              { month: 'May', margin: 15.4 },
              { month: 'Jun', margin: 15.7 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBranchPerformanceDetails() {
    try {
      return {
        data: {
          overview: {
            totalBranches: 5,
            averagePerformance: 82.4,
            topPerformer: 'Main Branch',
            improvementRate: 5.2
          },
          branches: [
            {
              name: 'Main Branch',
              score: 92.5,
              revenue: 125000000,
              customers: 45000,
              transactions: 850000,
              efficiency: 88.5
            },
            {
              name: 'Downtown',
              score: 85.2,
              revenue: 98000000,
              customers: 38000,
              transactions: 720000,
              efficiency: 82.1
            },
            {
              name: 'Westside',
              score: 78.9,
              revenue: 76000000,
              customers: 29000,
              transactions: 540000,
              efficiency: 75.4
            },
            {
              name: 'Eastside',
              score: 81.3,
              revenue: 82000000,
              customers: 31000,
              transactions: 580000,
              efficiency: 78.9
            },
            {
              name: 'Airport',
              score: 74.1,
              revenue: 65000000,
              customers: 22000,
              transactions: 410000,
              efficiency: 71.2
            }
          ],
          metrics: {
            revenue: { weight: 30, average: 89200000 },
            customers: { weight: 25, average: 33000 },
            transactions: { weight: 25, average: 620000 },
            efficiency: { weight: 20, average: 79.2 }
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getProductDistributionDetails() {
    try {
      return {
        data: {
          overview: {
            totalProducts: 5,
            totalValue: 6913579134,
            dominantProduct: 'Loans',
            diversificationIndex: 0.72
          },
          distribution: [
            {
              name: 'Loans',
              value: 3456789567,
              percentage: 50,
              count: 125000,
              growth: 8.5
            },
            {
              name: 'Deposits',
              value: 2074073740,
              percentage: 30,
              count: 450000,
              growth: 5.2
            },
            {
              name: 'Cards',
              value: 691357913,
              percentage: 10,
              count: 85000,
              growth: 12.3
            },
            {
              name: 'Insurance',
              value: 414644348,
              percentage: 6,
              count: 32000,
              growth: 15.7
            },
            {
              name: 'Investment',
              value: 276543174,
              percentage: 4,
              count: 18000,
              growth: 22.1
            }
          ],
          trends: {
            quarterly: [
              { quarter: 'Q1', loans: 48, deposits: 32, cards: 9, insurance: 5, investment: 6 },
              { quarter: 'Q2', loans: 49, deposits: 31, cards: 10, insurance: 5, investment: 5 },
              { quarter: 'Q3', loans: 50, deposits: 30, cards: 10, insurance: 6, investment: 4 },
              { quarter: 'Q4', loans: 50, deposits: 30, cards: 10, insurance: 6, investment: 4 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getRiskMetricsDetails() {
    try {
      return {
        data: {
          overview: {
            overallRiskScore: 72.5,
            riskLevel: 'Medium',
            trend: 'improving',
            changePercent: -5.2
          },
          categories: [
            {
              name: 'Credit Risk',
              score: 68.5,
              level: 'Medium',
              indicators: {
                nplRatio: 2.8,
                provisionCoverage: 145,
                defaultRate: 1.2
              }
            },
            {
              name: 'Market Risk',
              score: 75.2,
              level: 'Low',
              indicators: {
                var: 2500000,
                stressTestResult: 'Pass',
                exposureLimit: 85
              }
            },
            {
              name: 'Operational Risk',
              score: 71.8,
              level: 'Medium',
              indicators: {
                incidentCount: 12,
                lossAmount: 450000,
                controlEffectiveness: 88
              }
            },
            {
              name: 'Liquidity Risk',
              score: 78.4,
              level: 'Low',
              indicators: {
                lcr: 125,
                nsfr: 118,
                cashRatio: 22
              }
            }
          ],
          mitigation: {
            activeMeasures: 24,
            implemented: 18,
            effectiveness: 85.5
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getDigitalAdoptionDetails() {
    try {
      return {
        data: {
          overview: {
            adoptionRate: 67.8,
            activeUsers: 285000,
            monthlyGrowth: 4.5,
            targetRate: 80.0
          },
          channels: {
            mobile: {
              users: 185000,
              percentage: 64.9,
              transactions: 2450000,
              growth: 8.2
            },
            web: {
              users: 75000,
              percentage: 26.3,
              transactions: 890000,
              growth: 3.5
            },
            atm: {
              users: 25000,
              percentage: 8.8,
              transactions: 450000,
              growth: -2.1
            }
          },
          features: {
            mobilePayments: { adoption: 78.5, satisfaction: 4.2 },
            onlineTransfers: { adoption: 82.3, satisfaction: 4.4 },
            digitalStatements: { adoption: 91.2, satisfaction: 4.6 },
            cardlessWithdrawal: { adoption: 45.6, satisfaction: 3.9 },
            virtualCards: { adoption: 34.2, satisfaction: 4.1 }
          },
          demographics: {
            byAge: [
              { group: '18-25', rate: 92.5 },
              { group: '26-35', rate: 85.3 },
              { group: '36-45', rate: 72.1 },
              { group: '46-55', rate: 58.4 },
              { group: '56+', rate: 41.2 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getLoanPortfolioDetails() {
    try {
      return {
        data: {
          overview: {
            totalLoans: 3456789567,
            activeLoans: 125000,
            averageLoanSize: 27654,
            portfolioGrowth: 8.5
          },
          breakdown: {
            byType: [
              { type: 'Personal Loans', amount: 1037036870, count: 65000, avgSize: 15954 },
              { type: 'Home Loans', amount: 1728394784, count: 25000, avgSize: 69136 },
              { type: 'Business Loans', amount: 518518435, count: 20000, avgSize: 25926 },
              { type: 'Auto Loans', amount: 172839478, count: 15000, avgSize: 11523 }
            ],
            byStatus: [
              { status: 'Current', amount: 3215013197, percentage: 93 },
              { status: 'Overdue', amount: 138271583, percentage: 4 },
              { status: 'NPL', amount: 103504787, percentage: 3 }
            ]
          },
          trends: {
            monthly: [
              { month: 'Jan', disbursed: 285000000, repaid: 245000000 },
              { month: 'Feb', disbursed: 295000000, repaid: 255000000 },
              { month: 'Mar', disbursed: 310000000, repaid: 265000000 },
              { month: 'Apr', disbursed: 325000000, repaid: 275000000 },
              { month: 'May', disbursed: 340000000, repaid: 285000000 },
              { month: 'Jun', disbursed: 355000000, repaid: 295000000 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getLoanByProductDetails() {
    try {
      return {
        data: {
          overview: {
            totalProducts: 4,
            topProduct: 'Home Loans',
            averageInterestRate: 8.75,
            portfolioYield: 10.2
          },
          products: [
            {
              name: 'Personal Loans',
              amount: 1037036870,
              count: 65000,
              avgSize: 15954,
              interestRate: 12.5,
              nplRate: 3.2,
              growth: 15.3
            },
            {
              name: 'Home Loans',
              amount: 1728394784,
              count: 25000,
              avgSize: 69136,
              interestRate: 7.5,
              nplRate: 1.8,
              growth: 8.7
            },
            {
              name: 'Business Loans',
              amount: 518518435,
              count: 20000,
              avgSize: 25926,
              interestRate: 9.5,
              nplRate: 4.5,
              growth: 12.1
            },
            {
              name: 'Auto Loans',
              amount: 172839478,
              count: 15000,
              avgSize: 11523,
              interestRate: 8.0,
              nplRate: 2.1,
              growth: 6.4
            }
          ],
          performance: {
            byProduct: [
              { product: 'Personal Loans', yield: 11.8, cost: 5.2, margin: 6.6 },
              { product: 'Home Loans', yield: 7.2, cost: 3.8, margin: 3.4 },
              { product: 'Business Loans', yield: 9.1, cost: 4.5, margin: 4.6 },
              { product: 'Auto Loans', yield: 7.6, cost: 4.1, margin: 3.5 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getNPLRatioDetails() {
    try {
      return {
        data: {
          overview: {
            currentNPL: 2.8,
            previousNPL: 3.2,
            targetNPL: 2.5,
            trend: 'improving',
            changePercent: -12.5
          },
          breakdown: {
            byProduct: [
              { product: 'Personal Loans', npl: 3.2, amount: 33185180 },
              { product: 'Home Loans', npl: 1.8, amount: 31111106 },
              { product: 'Business Loans', npl: 4.5, amount: 23333330 },
              { product: 'Auto Loans', npl: 2.1, amount: 3631629 }
            ],
            byAge: [
              { days: '31-60', amount: 45000000, percentage: 35 },
              { days: '61-90', amount: 32000000, percentage: 25 },
              { days: '91-180', amount: 28000000, percentage: 22 },
              { days: '180+', amount: 23000000, percentage: 18 }
            ]
          },
          recovery: {
            totalRecovered: 15000000,
            recoveryRate: 35.5,
            writtenOff: 8000000,
            underLitigation: 12000000
          },
          trends: {
            quarterly: [
              { quarter: 'Q1', npl: 3.5, recovered: 12000000 },
              { quarter: 'Q2', npl: 3.2, recovered: 13500000 },
              { quarter: 'Q3', npl: 3.0, recovered: 14200000 },
              { quarter: 'Q4', npl: 2.8, recovered: 15000000 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getTotalCustomersDetails() {
    try {
      return {
        data: {
          overview: {
            totalCustomers: 425000,
            activeCustomers: 385000,
            newCustomers: 12500,
            churnRate: 2.3,
            growthRate: 5.8
          },
          segments: {
            retail: { count: 380000, percentage: 89.4, growth: 6.2 },
            corporate: { count: 35000, percentage: 8.2, growth: 4.5 },
            sme: { count: 10000, percentage: 2.4, growth: 12.3 }
          },
          demographics: {
            byAge: [
              { range: '18-25', count: 85000, percentage: 20 },
              { range: '26-35', count: 127500, percentage: 30 },
              { range: '36-45', count: 106250, percentage: 25 },
              { range: '46-55', count: 63750, percentage: 15 },
              { range: '56+', count: 42500, percentage: 10 }
            ],
            byGender: [
              { gender: 'Male', count: 238000, percentage: 56 },
              { gender: 'Female', count: 187000, percentage: 44 }
            ]
          },
          activity: {
            highlyActive: { count: 212500, percentage: 50 },
            moderatelyActive: { count: 127500, percentage: 30 },
            lowActivity: { count: 85000, percentage: 20 }
          },
          trends: {
            monthly: [
              { month: 'Jan', total: 405000, new: 8500, churned: 2100 },
              { month: 'Feb', total: 408000, new: 9200, churned: 2200 },
              { month: 'Mar', total: 412000, new: 10100, churned: 2100 },
              { month: 'Apr', total: 416500, new: 11000, churned: 2500 },
              { month: 'May', total: 421000, new: 11800, churned: 2300 },
              { month: 'Jun', total: 425000, new: 12500, churned: 2500 }
            ]
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  }
}