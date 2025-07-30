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

      // Customer segments - handle missing foreign key gracefully
      let segmentCounts = {};
      try {
        const { data: segments, error: segmentsError } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select(`
            customer_type_id,
            customer_types (
              type_name
            )
          `)
          .order('customer_type_id');
        
        if (segmentsError) {
          console.error('Error fetching customer segments:', segmentsError);
          // Fallback to simple customer type count without join
          const { data: customers } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_type_id');
          
          segmentCounts = customers?.reduce((acc, curr) => {
            const typeId = curr.customer_type_id || 'Unknown';
            acc[`Type ${typeId}`] = (acc[`Type ${typeId}`] || 0) + 1;
            return acc;
          }, {}) || {};
        } else {
          segmentCounts = segments?.reduce((acc, curr) => {
            const typeName = curr.customer_types?.type_name || 'Unknown';
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
          }, {}) || {};
        }
      } catch (error) {
        console.error('Error in customer segments query:', error);
        // Use empty object as fallback
        segmentCounts = {};
      }

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

// Loan Details Service
export const loanDetailsService = {
  async getOverviewStats() {
    try {
      // Total loans
      const { count: totalLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      // Active loans
      const { count: activeLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('loan_status', 'ACTIVE');

      // Total loan amount
      const { data: loanAmounts } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('loan_amount, outstanding_balance, total_interest_paid');

      const totalLoanAmount = loanAmounts?.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0) || 0;
      const totalOutstanding = loanAmounts?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const totalInterestPaid = loanAmounts?.reduce((sum, loan) => sum + (loan.total_interest_paid || 0), 0) || 0;

      // Overdue loans
      const { count: overdueLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .gt('days_past_due', 0);

      // NPL (Non-Performing Loans)
      const { count: nplLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .gt('days_past_due', 90);

      const nplRatio = totalLoans > 0 ? (nplLoans / totalLoans * 100).toFixed(2) : 0;

      return {
        data: {
          totalLoans: totalLoans || 0,
          activeLoans: activeLoans || 0,
          totalLoanAmount: totalLoanAmount,
          totalOutstanding: totalOutstanding,
          totalInterestPaid: totalInterestPaid,
          overdueLoans: overdueLoans || 0,
          nplLoans: nplLoans || 0,
          nplRatio: nplRatio,
          averageLoanSize: totalLoans > 0 ? totalLoanAmount / totalLoans : 0
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // By product type
      const { data: productData } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('product_id, products!inner(product_name), loan_amount');

      const productBreakdown = productData?.reduce((acc, curr) => {
        const productName = curr.products?.product_name || 'Unknown';
        if (!acc[productName]) {
          acc[productName] = { count: 0, amount: 0 };
        }
        acc[productName].count++;
        acc[productName].amount += curr.loan_amount || 0;
        return acc;
      }, {}) || {};

      // By loan status
      const { data: statusData } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('loan_status');

      const statusBreakdown = statusData?.reduce((acc, curr) => {
        const status = curr.loan_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // By risk category (based on DPD)
      const { data: riskData } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('days_past_due');

      const riskCategories = {
        'Current (0 DPD)': 0,
        'Early (1-30 DPD)': 0,
        'Late (31-60 DPD)': 0,
        'Default (61-90 DPD)': 0,
        'NPL (90+ DPD)': 0
      };

      riskData?.forEach(loan => {
        const dpd = loan.days_past_due || 0;
        if (dpd === 0) riskCategories['Current (0 DPD)']++;
        else if (dpd <= 30) riskCategories['Early (1-30 DPD)']++;
        else if (dpd <= 60) riskCategories['Late (31-60 DPD)']++;
        else if (dpd <= 90) riskCategories['Default (61-90 DPD)']++;
        else riskCategories['NPL (90+ DPD)']++;
      });

      // By loan amount range
      const { data: amountData } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('loan_amount');

      const amountRanges = {
        '0-50K': 0,
        '50K-200K': 0,
        '200K-500K': 0,
        '500K-1M': 0,
        '1M+': 0
      };

      amountData?.forEach(loan => {
        const amount = loan.loan_amount || 0;
        if (amount < 50000) amountRanges['0-50K']++;
        else if (amount < 200000) amountRanges['50K-200K']++;
        else if (amount < 500000) amountRanges['200K-500K']++;
        else if (amount < 1000000) amountRanges['500K-1M']++;
        else amountRanges['1M+']++;
      });

      return {
        data: {
          byProduct: productBreakdown,
          byStatus: statusBreakdown,
          byRiskCategory: riskCategories,
          byAmountRange: amountRanges
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getLoanTrends(days = 30) {
    try {
      const dates = [];
      const disbursements = [];
      const collections = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Count new loans (disbursements)
        const { count: newLoans } = await supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('*', { count: 'exact', head: true })
          .gte('disbursement_date', date.toISOString())
          .lt('disbursement_date', nextDate.toISOString());
        
        // This would need payment/collection data
        // For now, using mock data
        const dailyCollections = Math.floor(Math.random() * 50) + 20;
        
        dates.push(date.toLocaleDateString());
        disbursements.push(newLoans || 0);
        collections.push(dailyCollections);
      }

      return {
        data: { 
          dates, 
          disbursements,
          collections
        },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], disbursements: [], collections: [] });
    }
  }
};

// Branch Performance Service
export const branchDetailsService = {
  async getOverviewStats() {
    try {
      // Total branches
      const { count: totalBranches } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('*', { count: 'exact', head: true });

      // Branch performance metrics
      const { data: branchData } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select(`
          branch_id,
          branch_name,
          customers!inner(customer_id),
          accounts!inner(account_id, current_balance)
        `);

      // Calculate metrics per branch
      const branchMetrics = {};
      branchData?.forEach(branch => {
        if (!branchMetrics[branch.branch_name]) {
          branchMetrics[branch.branch_name] = {
            customers: new Set(),
            accounts: 0,
            totalBalance: 0
          };
        }
        branch.customers?.forEach(c => branchMetrics[branch.branch_name].customers.add(c.customer_id));
        branchMetrics[branch.branch_name].accounts += branch.accounts?.length || 0;
        branchMetrics[branch.branch_name].totalBalance += branch.accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      });

      // Find top performing branch
      let topBranch = { name: 'N/A', balance: 0 };
      Object.entries(branchMetrics).forEach(([name, metrics]) => {
        if (metrics.totalBalance > topBranch.balance) {
          topBranch = { name, balance: metrics.totalBalance };
        }
      });

      // Calculate totals
      const totalCustomers = Object.values(branchMetrics).reduce((sum, b) => sum + b.customers.size, 0);
      const totalAccounts = Object.values(branchMetrics).reduce((sum, b) => sum + b.accounts, 0);
      const totalBalance = Object.values(branchMetrics).reduce((sum, b) => sum + b.totalBalance, 0);

      return {
        data: {
          totalBranches: totalBranches || 0,
          totalCustomers,
          totalAccounts,
          totalBalance,
          topBranch: topBranch.name,
          topBranchBalance: topBranch.balance,
          averageBalancePerBranch: totalBranches > 0 ? totalBalance / totalBranches : 0,
          averageCustomersPerBranch: totalBranches > 0 ? Math.floor(totalCustomers / totalBranches) : 0
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // Get all branches with their metrics
      const { data: branches } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('branch_id, branch_name, branch_code, city');

      const branchBreakdown = {};
      
      for (const branch of branches || []) {
        // Get customer count
        const { count: customerCount } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branch.branch_id);

        // Get account metrics
        const { data: accounts } = await supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('current_balance')
          .eq('branch_id', branch.branch_id);

        const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

        branchBreakdown[branch.branch_name] = {
          code: branch.branch_code,
          city: branch.city,
          customers: customerCount || 0,
          accounts: accounts?.length || 0,
          totalBalance,
          averageBalance: accounts?.length > 0 ? totalBalance / accounts.length : 0
        };
      }

      // By city
      const cityBreakdown = {};
      branches?.forEach(branch => {
        const city = branch.city || 'Unknown';
        cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
      });

      return {
        data: {
          byBranch: branchBreakdown,
          byCity: cityBreakdown
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBranchTrends(branchId = null, days = 30) {
    try {
      const dates = [];
      const newCustomers = [];
      const newAccounts = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Build query
        let customerQuery = supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        let accountQuery = supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        if (branchId) {
          customerQuery = customerQuery.eq('branch_id', branchId);
          accountQuery = accountQuery.eq('branch_id', branchId);
        }
        
        const { count: custCount } = await customerQuery;
        const { count: accCount } = await accountQuery;
        
        dates.push(date.toLocaleDateString());
        newCustomers.push(custCount || 0);
        newAccounts.push(accCount || 0);
      }

      return {
        data: { 
          dates, 
          newCustomers,
          newAccounts
        },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], newCustomers: [], newAccounts: [] });
    }
  }
};

// Collection Details Service
export const collectionDetailsService = {
  async getOverviewStats() {
    try {
      // Total collection cases
      const { count: totalCases } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('*', { count: 'exact', head: true });

      // Active cases
      const { count: activeCases } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'ACTIVE');

      // Total amount in collection
      const { data: caseAmounts } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('total_outstanding, amount_collected');

      const totalOutstanding = caseAmounts?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;
      const totalCollected = caseAmounts?.reduce((sum, c) => sum + (c.amount_collected || 0), 0) || 0;
      const collectionRate = totalOutstanding > 0 ? (totalCollected / totalOutstanding * 100).toFixed(2) : 0;

      // Cases by bucket
      const { data: bucketData } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('bucket_id, collection_buckets!inner(bucket_name)');

      const bucketBreakdown = bucketData?.reduce((acc, curr) => {
        const bucketName = curr.collection_buckets?.bucket_name || 'Unknown';
        acc[bucketName] = (acc[bucketName] || 0) + 1;
        return acc;
      }, {}) || {};

      // Promise to pay
      const { count: ptpCount } = await supabaseBanking
        .from(TABLES.PROMISE_TO_PAY)
        .select('*', { count: 'exact', head: true })
        .eq('ptp_status', 'ACTIVE');

      return {
        data: {
          totalCases: totalCases || 0,
          activeCases: activeCases || 0,
          totalOutstanding,
          totalCollected,
          collectionRate,
          ptpCount: ptpCount || 0,
          buckets: bucketBreakdown,
          averageCaseValue: totalCases > 0 ? totalOutstanding / totalCases : 0
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
        .from(TABLES.COLLECTION_CASES)
        .select('case_status');

      const statusBreakdown = statusData?.reduce((acc, curr) => {
        const status = curr.case_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // By priority
      const { data: priorityData } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('priority');

      const priorityBreakdown = priorityData?.reduce((acc, curr) => {
        const priority = curr.priority || 'MEDIUM';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {}) || {};

      // By days in collection
      const { data: ageData } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('created_at');

      const ageRanges = {
        '0-30 days': 0,
        '31-60 days': 0,
        '61-90 days': 0,
        '91-180 days': 0,
        '180+ days': 0
      };

      const now = new Date();
      ageData?.forEach(caseItem => {
        const daysInCollection = Math.floor((now - new Date(caseItem.created_at)) / (1000 * 60 * 60 * 24));
        if (daysInCollection <= 30) ageRanges['0-30 days']++;
        else if (daysInCollection <= 60) ageRanges['31-60 days']++;
        else if (daysInCollection <= 90) ageRanges['61-90 days']++;
        else if (daysInCollection <= 180) ageRanges['91-180 days']++;
        else ageRanges['180+ days']++;
      });

      // By collection method
      const collectionMethods = {
        'Phone Call': 45,
        'SMS': 30,
        'Email': 15,
        'Field Visit': 7,
        'Legal': 3
      };

      return {
        data: {
          byStatus: statusBreakdown,
          byPriority: priorityBreakdown,
          byAge: ageRanges,
          byMethod: collectionMethods
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getCollectionTrends(days = 30) {
    try {
      const dates = [];
      const newCases = [];
      const resolvedCases = [];
      const collections = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // New cases
        const { count: newCount } = await supabaseBanking
          .from(TABLES.COLLECTION_CASES)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());
        
        // Resolved cases (would need resolution_date field)
        const { count: resolvedCount } = await supabaseBanking
          .from(TABLES.COLLECTION_CASES)
          .select('*', { count: 'exact', head: true })
          .eq('case_status', 'CLOSED')
          .gte('updated_at', date.toISOString())
          .lt('updated_at', nextDate.toISOString());
        
        // Daily collections (mock data for now)
        const dailyCollection = Math.floor(Math.random() * 500000) + 100000;
        
        dates.push(date.toLocaleDateString());
        newCases.push(newCount || 0);
        resolvedCases.push(resolvedCount || 0);
        collections.push(dailyCollection);
      }

      return {
        data: { 
          dates, 
          newCases,
          resolvedCases,
          collections
        },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], newCases: [], resolvedCases: [], collections: [] });
    }
  }
};

// Product Performance Service
export const productDetailsService = {
  async getOverviewStats() {
    try {
      // Total products
      const { count: totalProducts } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('*', { count: 'exact', head: true });

      // Active products
      const { count: activeProducts } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Product performance
      const { data: productLoans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          product_id,
          products!inner(product_name, interest_rate),
          loan_amount,
          total_interest_paid
        `);

      const productMetrics = {};
      productLoans?.forEach(loan => {
        const productName = loan.products?.product_name || 'Unknown';
        if (!productMetrics[productName]) {
          productMetrics[productName] = {
            count: 0,
            totalAmount: 0,
            totalInterest: 0,
            rate: loan.products?.interest_rate || 0
          };
        }
        productMetrics[productName].count++;
        productMetrics[productName].totalAmount += loan.loan_amount || 0;
        productMetrics[productName].totalInterest += loan.total_interest_paid || 0;
      });

      // Find best performing product
      let topProduct = { name: 'N/A', interest: 0 };
      Object.entries(productMetrics).forEach(([name, metrics]) => {
        if (metrics.totalInterest > topProduct.interest) {
          topProduct = { name, interest: metrics.totalInterest };
        }
      });

      const totalLoanAmount = Object.values(productMetrics).reduce((sum, p) => sum + p.totalAmount, 0);
      const totalInterestGenerated = Object.values(productMetrics).reduce((sum, p) => sum + p.totalInterest, 0);

      return {
        data: {
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          totalLoanAmount,
          totalInterestGenerated,
          topProduct: topProduct.name,
          topProductRevenue: topProduct.interest,
          averageInterestRate: Object.values(productMetrics).reduce((sum, p) => sum + p.rate, 0) / Object.keys(productMetrics).length || 0,
          productCount: Object.keys(productMetrics).length
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getBreakdown() {
    try {
      // By category
      const { data: categoryData } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('category_id, product_categories!inner(category_name)');

      const categoryBreakdown = categoryData?.reduce((acc, curr) => {
        const categoryName = curr.product_categories?.category_name || 'Unknown';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {}) || {};

      // By product with metrics
      const { data: productData } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select(`
          product_id,
          product_name,
          interest_rate,
          loan_accounts!inner(loan_amount, outstanding_balance)
        `);

      const productBreakdown = {};
      productData?.forEach(product => {
        const totalLoans = product.loan_accounts?.length || 0;
        const totalAmount = product.loan_accounts?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;
        const totalOutstanding = product.loan_accounts?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;

        productBreakdown[product.product_name] = {
          rate: product.interest_rate,
          loans: totalLoans,
          totalAmount,
          totalOutstanding,
          utilizationRate: totalAmount > 0 ? ((totalAmount - totalOutstanding) / totalAmount * 100).toFixed(2) : 0
        };
      });

      return {
        data: {
          byCategory: categoryBreakdown,
          byProduct: productBreakdown
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getProductTrends(productId = null, days = 30) {
    try {
      const dates = [];
      const newLoans = [];
      const amounts = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        let query = supabaseBanking
          .from(TABLES.LOAN_ACCOUNTS)
          .select('loan_amount')
          .gte('disbursement_date', date.toISOString())
          .lt('disbursement_date', nextDate.toISOString());
        
        if (productId) {
          query = query.eq('product_id', productId);
        }
        
        const { data: loans } = await query;
        
        dates.push(date.toLocaleDateString());
        newLoans.push(loans?.length || 0);
        amounts.push(loans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0);
      }

      return {
        data: { 
          dates, 
          newLoans,
          amounts
        },
        error: null
      };
    } catch (error) {
      return handleError(error, { dates: [], newLoans: [], amounts: [] });
    }
  }
};

// Chart Widget Details Service
export const chartDetailsService = {
  async getDetailsByChartType(chartType, widgetId) {
    // Extract the specific chart type from widget ID
    const parts = widgetId.split('_');
    const mainType = parts[0];
    const subType = parts[1];

    switch (mainType) {
      case 'total':
        if (subType === 'assets') {
          return this.getTotalAssetsDetails();
        }
        break;
      case 'transactions':
        if (subType === 'chart' || subType === 'trend') {
          return this.getTransactionChartDetails();
        }
        break;
      case 'customer':
        if (subType === 'segments') {
          return this.getCustomerSegmentDetails();
        }
        break;
      case 'daily':
        if (subType === 'transactions') {
          return this.getDailyTransactionDetails();
        }
        break;
      case 'revenue':
        if (subType === 'trend') {
          return this.getRevenueTrendDetails();
        }
        break;
      default:
        return { data: null, error: 'Unknown chart type' };
    }
  },

  async getTotalAssetsDetails() {
    try {
      // Get account balances
      const { data: accounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_type_id, current_balance, branch_id')
        .eq('account_status', 'ACTIVE');
      
      // Get loan balances
      const { data: loans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('product_id, outstanding_balance, branch_id')
        .eq('loan_status', 'ACTIVE');
      
      // Calculate totals by type
      const accountsByType = {};
      accounts?.forEach(acc => {
        const typeId = acc.account_type_id || 'Unknown';
        if (!accountsByType[typeId]) {
          accountsByType[typeId] = { count: 0, balance: 0 };
        }
        accountsByType[typeId].count++;
        accountsByType[typeId].balance += acc.current_balance || 0;
      });
      
      const loansByProduct = {};
      loans?.forEach(loan => {
        const productId = loan.product_id || 'Unknown';
        if (!loansByProduct[productId]) {
          loansByProduct[productId] = { count: 0, balance: 0 };
        }
        loansByProduct[productId].count++;
        loansByProduct[productId].balance += loan.outstanding_balance || 0;
      });
      
      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const totalAssets = totalDeposits + totalLoans;
      
      // Calculate branch distribution
      const branchAssets = {};
      accounts?.forEach(acc => {
        const branchId = acc.branch_id || 'Unknown';
        if (!branchAssets[branchId]) {
          branchAssets[branchId] = { deposits: 0, loans: 0 };
        }
        branchAssets[branchId].deposits += acc.current_balance || 0;
      });
      
      loans?.forEach(loan => {
        const branchId = loan.branch_id || 'Unknown';
        if (!branchAssets[branchId]) {
          branchAssets[branchId] = { deposits: 0, loans: 0 };
        }
        branchAssets[branchId].loans += loan.outstanding_balance || 0;
      });
      
      return {
        data: {
          overview: {
            totalAssets,
            totalDeposits,
            totalLoans,
            depositRatio: totalAssets > 0 ? (totalDeposits / totalAssets * 100).toFixed(2) : 0,
            loanRatio: totalAssets > 0 ? (totalLoans / totalAssets * 100).toFixed(2) : 0
          },
          accountTypes: accountsByType,
          loanProducts: loansByProduct,
          branchDistribution: branchAssets,
          metrics: {
            averageAccountBalance: accounts?.length > 0 ? totalDeposits / accounts.length : 0,
            averageLoanBalance: loans?.length > 0 ? totalLoans / loans.length : 0,
            totalAccounts: accounts?.length || 0,
            totalLoanAccounts: loans?.length || 0
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getTransactionChartDetails() {
    try {
      // Hourly breakdown for last 7 days
      const hourlyData = {};
      const days = 7;
      
      for (let d = 0; d < days; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toLocaleDateString();
        hourlyData[dateStr] = new Array(24).fill(0);
        
        const { data: transactions } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('transaction_date')
          .gte('transaction_date', new Date(date.setHours(0, 0, 0, 0)).toISOString())
          .lt('transaction_date', new Date(date.setHours(23, 59, 59, 999)).toISOString());
        
        transactions?.forEach(t => {
          const hour = new Date(t.transaction_date).getHours();
          hourlyData[dateStr][hour]++;
        });
      }

      // Peak hours analysis
      const allHours = Object.values(hourlyData).flat();
      const hourlyAverages = new Array(24).fill(0).map((_, hour) => {
        const sum = Object.values(hourlyData).reduce((total, day) => total + day[hour], 0);
        return sum / days;
      });

      const peakHour = hourlyAverages.indexOf(Math.max(...hourlyAverages));
      const lowHour = hourlyAverages.indexOf(Math.min(...hourlyAverages));

      return {
        data: {
          hourlyBreakdown: hourlyData,
          hourlyAverages,
          peakHour,
          lowHour,
          peakVolume: Math.max(...hourlyAverages),
          lowVolume: Math.min(...hourlyAverages)
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getCustomerSegmentDetails() {
    try {
      // Detailed segment analysis - handle missing foreign key gracefully
      let segments;
      let useTypeId = false;
      
      try {
        const { data, error } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select(`
            customer_type_id,
            customer_types!inner(type_name, type_code),
            accounts!inner(current_balance),
            created_at
          `);
        
        if (error) {
          console.error('Error with customer_types join:', error);
          // Fallback query without the join
          const { data: fallbackData } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select(`
              customer_type_id,
              accounts!inner(current_balance),
              created_at
            `);
          segments = fallbackData;
          useTypeId = true;
        } else {
          segments = data;
        }
      } catch (error) {
        console.error('Error fetching customer segments:', error);
        segments = [];
      }

      const segmentAnalysis = {};
      segments?.forEach(customer => {
        const typeName = useTypeId 
          ? `Type ${customer.customer_type_id || 'Unknown'}`
          : (customer.customer_types?.type_name || 'Unknown');
          
        if (!segmentAnalysis[typeName]) {
          segmentAnalysis[typeName] = {
            count: 0,
            totalBalance: 0,
            averageBalance: 0,
            newThisMonth: 0
          };
        }
        segmentAnalysis[typeName].count++;
        segmentAnalysis[typeName].totalBalance += customer.accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
        
        // Check if new this month
        const createdDate = new Date(customer.created_at);
        const thisMonth = new Date();
        if (createdDate.getMonth() === thisMonth.getMonth() && createdDate.getFullYear() === thisMonth.getFullYear()) {
          segmentAnalysis[typeName].newThisMonth++;
        }
      });

      // Calculate averages
      Object.values(segmentAnalysis).forEach(segment => {
        segment.averageBalance = segment.count > 0 ? segment.totalBalance / segment.count : 0;
      });

      return {
        data: {
          segments: segmentAnalysis,
          totalSegments: Object.keys(segmentAnalysis).length
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getDailyTransactionDetails() {
    try {
      // Last 24 hours breakdown by type
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data: transactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_type_id,
          transaction_types!inner(type_name),
          amount,
          transaction_status,
          transaction_date
        `)
        .gte('transaction_date', yesterday.toISOString())
        .lte('transaction_date', now.toISOString());

      // Analyze by type and hour
      const typeBreakdown = {};
      const hourlyVolume = new Array(24).fill(0);
      const hourlyCount = new Array(24).fill(0);
      
      transactions?.forEach(t => {
        const typeName = t.transaction_types?.type_name || 'Unknown';
        const hour = new Date(t.transaction_date).getHours();
        
        if (!typeBreakdown[typeName]) {
          typeBreakdown[typeName] = {
            count: 0,
            volume: 0,
            successful: 0,
            failed: 0
          };
        }
        
        typeBreakdown[typeName].count++;
        typeBreakdown[typeName].volume += Math.abs(t.amount || 0);
        
        if (t.transaction_status === 'SUCCESS') {
          typeBreakdown[typeName].successful++;
        } else if (t.transaction_status === 'FAILED') {
          typeBreakdown[typeName].failed++;
        }
        
        hourlyVolume[hour] += Math.abs(t.amount || 0);
        hourlyCount[hour]++;
      });

      return {
        data: {
          typeBreakdown,
          hourlyVolume,
          hourlyCount,
          totalTransactions: transactions?.length || 0,
          totalVolume: hourlyVolume.reduce((sum, vol) => sum + vol, 0)
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  },

  async getRevenueTrendDetails() {
    try {
      // Monthly revenue breakdown by type
      const monthlyRevenue = {};
      const revenueByType = {};
      
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthKey = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        monthlyRevenue[monthKey] = {
          interest: 0,
          fees: 0,
          charges: 0,
          total: 0
        };
        
        // Get revenue transactions
        const { data: revenues } = await supabaseBanking
          .from(TABLES.TRANSACTIONS)
          .select('amount, transaction_type_id')
          .in('transaction_type_id', ['FEE', 'CHARGE', 'INTEREST'])
          .gte('transaction_date', monthStart.toISOString())
          .lte('transaction_date', monthEnd.toISOString());
        
        revenues?.forEach(r => {
          const amount = r.amount || 0;
          monthlyRevenue[monthKey].total += amount;
          
          switch (r.transaction_type_id) {
            case 'INTEREST':
              monthlyRevenue[monthKey].interest += amount;
              break;
            case 'FEE':
              monthlyRevenue[monthKey].fees += amount;
              break;
            case 'CHARGE':
              monthlyRevenue[monthKey].charges += amount;
              break;
          }
        });
      }

      // Calculate growth rates
      const months = Object.keys(monthlyRevenue);
      const growthRates = [];
      for (let i = 1; i < months.length; i++) {
        const current = monthlyRevenue[months[i]].total;
        const previous = monthlyRevenue[months[i-1]].total;
        const growth = previous > 0 ? ((current - previous) / previous * 100).toFixed(2) : 0;
        growthRates.push({ month: months[i], growth });
      }

      return {
        data: {
          monthlyRevenue,
          growthRates,
          averageMonthlyRevenue: Object.values(monthlyRevenue).reduce((sum, m) => sum + m.total, 0) / 12,
          bestMonth: Object.entries(monthlyRevenue).reduce((best, [month, data]) => 
            data.total > best.revenue ? { month, revenue: data.total } : best, 
            { month: '', revenue: 0 }
          )
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  }
};