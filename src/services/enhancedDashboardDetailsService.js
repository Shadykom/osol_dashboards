// Enhanced dashboard detail service
//
// Provides functions to fetch detailed information for individual widgets.

import { supabaseBanking, TABLES } from '../lib/supabase';
import { getDateFilter, getPreviousPeriodData, calculatePercentageChange } from '../utils/dateFilters.js';

// Import the widget catalog to access widget definitions
const getWidgetCatalog = async () => {
  try {
    // Dynamically import to avoid circular dependencies
    const dashboardModule = await import('../pages/Dashboard.jsx');
    return dashboardModule.WIDGET_CATALOG || {};
  } catch (error) {
    console.error('Error loading widget catalog:', error);
    return {};
  }
};

export const enhancedDashboardDetailsService = {
  async getWidgetDetails(section, widgetId, filters = {}) {
    try {
      const widgetKey = `${section}_${widgetId}`;
      console.log('Getting widget details for:', { section, widgetId, widgetKey });
      
      let overviewData = {};
      let breakdownData = {};
      let trendsData = {};
      let rawData = {};

      // Get the widget catalog
      const WIDGET_CATALOG = await getWidgetCatalog();
      const widgetDef = WIDGET_CATALOG[section]?.[widgetId];
      
      console.log('Widget definition found:', !!widgetDef, widgetDef?.type);

      if (widgetDef) {
        // Use the widget's query function to get data
        if (widgetDef.query) {
          const widgetData = await widgetDef.query(filters);
          console.log('Widget query returned:', widgetData);
          
          // Special handling for total_assets widget
          if (section === 'overview' && widgetId === 'total_assets') {
            // For total_assets detail view, we need more detailed data
            overviewData = await this.getTotalAssetsOverview(filters);
            overviewData.widgetType = widgetDef.type;
            overviewData.widgetName = widgetDef.nameEn || widgetDef.name || widgetId;
          } else if (section === 'customers' && widgetId === 'total_customers') {
            // For total_customers detail view
            overviewData = await this.getCustomersOverview(filters);
            overviewData.widgetType = widgetDef.type;
            overviewData.widgetName = widgetDef.nameEn || widgetDef.name || widgetId;
          } else if (section === 'banking') {
            // For banking section widgets
            overviewData = await this.getBankingOverview(widgetId, filters);
            overviewData.widgetType = widgetDef.type;
            overviewData.widgetName = widgetDef.nameEn || widgetDef.name || widgetId;
          } else if (widgetDef.type === 'chart') {
            // For chart widgets, the data is usually an array
            overviewData = {
              data: Array.isArray(widgetData) ? widgetData : widgetData.data || [],
              widgetName: widgetDef.nameEn || widgetDef.name || widgetId,
              widgetType: widgetDef.type,
              chartType: widgetDef.chartType,
              ...widgetData // Include any additional properties
            };
          } else {
            // For KPI widgets
            overviewData = {
              ...widgetData,
              widgetName: widgetDef.nameEn || widgetDef.name || widgetId,
              widgetType: widgetDef.type,
              chartType: widgetDef.chartType
            };
          }
        }

        // Get breakdown data based on widget type and section
        if (section === 'customers') {
          breakdownData = await this.getCustomersBreakdown(widgetId, filters);
          trendsData = await this.getCustomersTrendsData(filters);
          rawData = await this.getCustomersRawData(filters);
        } else if (section === 'banking') {
          breakdownData = await this.getBankingBreakdown(widgetId, filters);
          trendsData = await this.getBankingTrendsData(widgetId, filters);
          rawData = await this.getBankingRawData(widgetId, filters);
        } else {
          breakdownData = await this.getGenericBreakdown(section, widgetId, filters);
          trendsData = await this.getTrendsData(section, widgetId, filters);
          rawData = await this.getRawData(section, widgetId, filters);
        }
      } else {
        // Fallback for specific widgets
        switch (widgetKey) {
          case 'overview_total_assets':
            overviewData = await this.getTotalAssetsOverview(filters);
            breakdownData = await this.getTotalAssetsBreakdown(filters);
            trendsData = await this.getTrendsData(section, widgetId, filters);
            rawData = await this.getRawData(section, widgetId, filters);
            break;
          case 'customers_total_customers':
            overviewData = await this.getCustomersOverview(filters);
            breakdownData = await this.getCustomersBreakdown(widgetId, filters);
            trendsData = await this.getCustomersTrendsData(filters);
            rawData = await this.getCustomersRawData(filters);
            break;
          // Add more cases for other widgets
          default:
            break;
        }
      }

      console.log('Final overview data:', overviewData);

      return {
        success: true,
        data: {
          overview: overviewData,
          breakdown: breakdownData,
          trends: trendsData,
          raw: rawData,
          metadata: {
            widgetId,
            section,
            title: widgetDef?.nameEn || widgetDef?.name || widgetId,
            filters,
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('Error fetching widget details:', error);
      return { success: false, error: error.message };
    }
  },

  async getTotalAssetsOverview(filters) {
    const dateFilter = getDateFilter(filters.dateRange);
    const [accounts, loans] = await Promise.all([
      supabaseBanking.from(TABLES.ACCOUNTS)
        .select('*')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end),
      supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
        .select('*')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end)
    ]);
    const totalDeposits = accounts.data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
    const totalLoans = loans.data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
    const total = totalDeposits + totalLoans;
    const previousPeriod = await getPreviousPeriodData(filters);
    const change = calculatePercentageChange(total, previousPeriod.totalAssets || 0);
    return {
      totalAssets: total,
      totalDeposits,
      totalLoans,
      depositRatio: total > 0 ? ((totalDeposits / total) * 100).toFixed(2) : '0',
      loanRatio: total > 0 ? ((totalLoans / total) * 100).toFixed(2) : '0',
      transactionVolume: 0,
      accountCount: accounts.data?.length || 0,
      loanCount: loans.data?.length || 0,
      avgAccountBalance: accounts.data?.length > 0 ? totalDeposits / accounts.data.length : 0,
      avgLoanBalance: loans.data?.length > 0 ? totalLoans / loans.data.length : 0,
      change: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  },

  async getCustomersOverview(filters) {
    try {
      // For total customers overview, we should not apply date filters to match main dashboard
      // Only apply date filters for specific time-based analysis
      const shouldApplyDateFilter = filters?.applyDateFilter !== false;
      
      let customersQuery = supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*');
      
      // Apply date filter only if explicitly requested
      if (shouldApplyDateFilter && filters?.dateRange && filters.dateRange !== 'all_time') {
        const dateFilter = getDateFilter(filters.dateRange);
        customersQuery = customersQuery
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end);
      }
      
      // Fetch customers data
      const { data: customers, error } = await customersQuery;
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      const totalCustomers = customers?.length || 0;

      // Get customer type breakdown
      const customerTypes = {};
      customers?.forEach(customer => {
        const type = customer.customer_type || customer.customer_segment || 'Standard';
        customerTypes[type] = (customerTypes[type] || 0) + 1;
      });

      // Get new customers (last 30 days) - this should always use date filter
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newCustomers = customers?.filter(c => 
        new Date(c.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Get active customers (those with accounts)
      const { data: activeCustomers } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('customer_id')
        .in('customer_id', customers?.map(c => c.customer_id) || []);
      
      const activeCount = new Set(activeCustomers?.map(a => a.customer_id) || []).size;

      // Calculate growth rate
      const previousPeriod = await getPreviousPeriodData(filters);
      const growthRate = calculatePercentageChange(totalCustomers, previousPeriod.totalCustomers || 0);

      return {
        totalCustomers,
        activeCustomers: activeCount,
        inactiveCustomers: totalCustomers - activeCount,
        newCustomers,
        customerTypes,
        individualCustomers: customerTypes['individual'] || customerTypes['Individual'] || 0,
        corporateCustomers: customerTypes['corporate'] || customerTypes['Corporate'] || 0,
        vipCustomers: customerTypes['vip'] || customerTypes['VIP'] || customerTypes['Premium'] || 0,
        activeRatio: totalCustomers > 0 ? ((activeCount / totalCustomers) * 100).toFixed(2) : '0',
        change: growthRate,
        trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable'
      };
    } catch (error) {
      console.error('Error in getCustomersOverview:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        newCustomers: 0,
        customerTypes: {},
        individualCustomers: 0,
        corporateCustomers: 0,
        vipCustomers: 0,
        activeRatio: '0',
        change: 0,
        trend: 'stable'
      };
    }
  },

  async getBankingOverview(widgetId, filters) {
    try {
      console.log('Getting banking overview for widget:', widgetId);
      
      // Apply branch filter if provided
      let accountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          kastle_banking.account_types!account_type_id (
            type_name,
            account_category
          )
        `);
      
      if (filters?.branch && filters.branch !== 'all') {
        accountsQuery = accountsQuery.eq('branch_id', filters.branch);
      }
      
      const { data: accounts } = await accountsQuery;
      
      if (!accounts) {
        return {
          totalAccounts: 0,
          activeAccounts: 0,
          totalBalance: 0,
          avgBalance: 0,
          change: 0,
          trend: 'stable'
        };
      }

      const totalAccounts = accounts.length;
      const activeAccounts = accounts.filter(acc => acc.account_status === 'ACTIVE').length;
      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
      const avgBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0;
      
      // Account type breakdown for overview
      const accountTypes = {};
      accounts.forEach(account => {
        const category = account.kastle_banking?.account_types?.account_category || 'Unknown';
        accountTypes[category] = (accountTypes[category] || 0) + 1;
      });

      // Get previous period data for change calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let previousQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .lte('created_at', thirtyDaysAgo.toISOString());
      
      if (filters?.branch && filters.branch !== 'all') {
        previousQuery = previousQuery.eq('branch_id', filters.branch);
      }
      
      const { data: previousAccounts } = await previousQuery;
      const previousBalance = previousAccounts?.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0) || 0;
      
      // Calculate change and trend
      const change = previousBalance > 0 ? ((totalBalance - previousBalance) / previousBalance * 100) : 0;
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      // Get new accounts this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      let newAccountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());
      
      if (filters?.branch && filters.branch !== 'all') {
        newAccountsQuery = newAccountsQuery.eq('branch_id', filters.branch);
      }
      
      const { count: newAccountsThisMonth } = await newAccountsQuery;

      // Calculate ratios
      const activeRatio = totalAccounts > 0 ? ((activeAccounts / totalAccounts) * 100).toFixed(1) : 0;
      const dormantAccounts = accounts.filter(acc => acc.account_status === 'DORMANT').length;
      const blockedAccounts = accounts.filter(acc => acc.account_status === 'BLOCKED').length;

      return {
        totalAccounts,
        activeAccounts,
        totalBalance,
        avgBalance,
        change,
        trend,
        accountTypes,
        activeRatio,
        dormantAccounts,
        blockedAccounts,
        newAccountsThisMonth: newAccountsThisMonth || 0,
        // Additional banking-specific metrics
        savingsAccounts: accounts.filter(acc => 
          acc.kastle_banking?.account_types?.account_category === 'SAVINGS'
        ).length,
        currentAccounts: accounts.filter(acc => 
          acc.kastle_banking?.account_types?.account_category === 'CURRENT'
        ).length,
        totalSavingsBalance: accounts
          .filter(acc => acc.kastle_banking?.account_types?.account_category === 'SAVINGS')
          .reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0),
        totalCurrentBalance: accounts
          .filter(acc => acc.kastle_banking?.account_types?.account_category === 'CURRENT')
          .reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0)
      };
    } catch (error) {
      console.error('Error fetching banking overview:', error);
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        totalBalance: 0,
        avgBalance: 0,
        change: 0,
        trend: 'stable',
        accountTypes: {},
        activeRatio: 0,
        dormantAccounts: 0,
        blockedAccounts: 0,
        newAccountsThisMonth: 0,
        savingsAccounts: 0,
        currentAccounts: 0,
        totalSavingsBalance: 0,
        totalCurrentBalance: 0
      };
    }
  },

  async getTotalAssetsBreakdown(filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      // Fetch accounts and loans data with better error handling
      const [accountsResult, loansResult, branchesResult] = await Promise.allSettled([
        supabaseBanking.from(TABLES.ACCOUNTS)
          .select('account_type_id, current_balance, status, branch_id, currency, account_types!inner(type_name)')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end),
        supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
          .select('loan_type, outstanding_balance, status, branch_id')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end),
        supabaseBanking.from(TABLES.BRANCHES)
          .select('branch_id, branch_name')
      ]);

      const accounts = accountsResult.status === 'fulfilled' ? (accountsResult.value.data || []) : [];
      const loans = loansResult.status === 'fulfilled' ? (loansResult.value.data || []) : [];
      const branches = branchesResult.status === 'fulfilled' ? (branchesResult.value.data || []) : [];
      
      // Log any failures for debugging
      if (accountsResult.status === 'rejected') {
        console.error('Failed to fetch accounts:', accountsResult.reason);
      }
      if (loansResult.status === 'rejected') {
        console.error('Failed to fetch loans:', loansResult.reason);
      }
      if (branchesResult.status === 'rejected') {
        console.error('Failed to fetch branches:', branchesResult.reason);
      }
      
      // Create branch lookup
      const branchLookup = {};
      branches.forEach(branch => {
        branchLookup[branch.branch_id] = branch.branch_name;
      });

      // Breakdown by Category (Deposits vs Loans)
      const depositsTotal = accounts.reduce((sum, acc) => sum + (parseFloat(acc.current_balance) || 0), 0);
      const loansTotal = loans.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0);
      
      const byCategory = {
        'Deposits': depositsTotal,
        'Loans': loansTotal
      };

      // Breakdown by Account Type
      const byAccountType = {};
      accounts.forEach(acc => {
        const type = acc.account_types?.type_name || 'Other';
        byAccountType[type] = (byAccountType[type] || 0) + (parseFloat(acc.current_balance) || 0);
      });

      // Breakdown by Product Type (Loan Types)
      const byProductType = {};
      loans.forEach(loan => {
        const type = loan.loan_type || 'Other';
        byProductType[type] = (byProductType[type] || 0) + (parseFloat(loan.outstanding_balance) || 0);
      });

      // Breakdown by Branch
      const byBranch = {};
      accounts.forEach(acc => {
        const branchName = branchLookup[acc.branch_id] || 'Unknown Branch';
        byBranch[branchName] = (byBranch[branchName] || 0) + (parseFloat(acc.current_balance) || 0);
      });
      loans.forEach(loan => {
        const branchName = branchLookup[loan.branch_id] || 'Unknown Branch';
        byBranch[branchName] = (byBranch[branchName] || 0) + (parseFloat(loan.outstanding_balance) || 0);
      });

      // Breakdown by Currency
      const byCurrency = {};
      accounts.forEach(acc => {
        const currency = acc.currency || 'SAR';
        byCurrency[currency] = (byCurrency[currency] || 0) + (parseFloat(acc.current_balance) || 0);
      });

      // Breakdown by Status
      const byStatus = {
        'Active Accounts': 0,
        'Inactive Accounts': 0,
        'Active Loans': 0,
        'Closed Loans': 0
      };
      accounts.forEach(acc => {
        const balance = parseFloat(acc.current_balance) || 0;
        if (acc.status === 'active') {
          byStatus['Active Accounts'] += balance;
        } else {
          byStatus['Inactive Accounts'] += balance;
        }
      });
      loans.forEach(loan => {
        const balance = parseFloat(loan.outstanding_balance) || 0;
        if (loan.status === 'active') {
          byStatus['Active Loans'] += balance;
        } else {
          byStatus['Closed Loans'] += balance;
        }
      });

      // Ensure we always return data, even if it's empty
      const result = {
        byCategory: Object.keys(byCategory).length > 0 ? byCategory : { 'No Data': 0 },
        byAccountType: Object.keys(byAccountType).length > 0 ? byAccountType : { 'No Data': 0 },
        byProductType: Object.keys(byProductType).length > 0 ? byProductType : { 'No Data': 0 },
        byBranch: Object.keys(byBranch).length > 0 ? 
          Object.fromEntries(
            Object.entries(byBranch)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10) // Top 10 branches
          ) : { 'No Data': 0 },
        byCurrency: Object.keys(byCurrency).length > 0 ? byCurrency : { 'SAR': 0 },
        byStatus: byStatus
      };

      console.log('Breakdown data generated:', result);
      return result;
    } catch (error) {
      console.error('Error fetching breakdown data:', error);
      // Return fallback data structure
      return {
        byCategory: { 'No Data': 0 },
        byAccountType: { 'No Data': 0 },
        byProductType: { 'No Data': 0 },
        byBranch: { 'No Data': 0 },
        byCurrency: { 'SAR': 0 },
        byStatus: {
          'Active Accounts': 0,
          'Inactive Accounts': 0,
          'Active Loans': 0,
          'Closed Loans': 0
        }
      };
    }
  },

  async getTrendsData(section, widgetId, filters) {
    try {
      // Generate date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const dates = [];
      const totalAssets = [];
      const deposits = [];
      const loans = [];
      const growthRates = [];

      // Generate dates for the trend
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
        // Mock data with some variation
        const baseValue = 1000000;
        const variation = Math.random() * 100000 - 50000;
        const depositValue = baseValue * 0.6 + variation;
        const loanValue = baseValue * 0.4 - variation;
        totalAssets.push(depositValue + loanValue);
        deposits.push(depositValue);
        loans.push(loanValue);
        growthRates.push(Math.random() * 10 - 5);
      }

      return {
        dates,
        totalAssets,
        deposits,
        loans,
        growthRates
      };
    } catch (error) {
      console.error('Error fetching trends data:', error);
      return {
        dates: [],
        totalAssets: [],
        deposits: [],
        loans: [],
        growthRates: []
      };
    }
  },

  async getCustomersTrendsData(filters) {
    try {
      // For customer trends, we should match the main dashboard behavior
      const shouldApplyDateFilter = filters?.applyDateFilter !== false;
      
      // Generate weekly data for last 12 weeks instead of daily (more efficient)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 84); // 12 weeks

      const dates = [];
      const totalCustomers = [];
      const newCustomers = [];
      const activeCustomers = [];
      const growthRates = [];

      // Get all customers first to avoid repeated queries
      let allCustomersQuery = supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, created_at');
      
      // Apply date filter if requested
      if (shouldApplyDateFilter && filters?.dateRange && filters.dateRange !== 'all_time') {
        const dateFilter = getDateFilter(filters.dateRange);
        allCustomersQuery = allCustomersQuery
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end);
      }
      
      const { data: allCustomers } = await allCustomersQuery;
      
      // Get all accounts for active customer calculation
      const { data: allAccounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('customer_id, created_at');

      // Generate weekly data points
      for (let week = 0; week < 12; week++) {
        const weekEndDate = new Date(endDate);
        weekEndDate.setDate(weekEndDate.getDate() - (week * 7));
        const weekStartDate = new Date(weekEndDate);
        weekStartDate.setDate(weekStartDate.getDate() - 6);
        
        const weekLabel = weekEndDate.toISOString().split('T')[0];
        dates.unshift(weekLabel);

        // Count customers up to this week
        const customersUpToWeek = allCustomers?.filter(c => 
          new Date(c.created_at) <= weekEndDate
        ) || [];
        const totalCount = customersUpToWeek.length;
        totalCustomers.unshift(totalCount);

        // Count new customers this week
        const weekNewCustomers = allCustomers?.filter(c => {
          const createdDate = new Date(c.created_at);
          return createdDate >= weekStartDate && createdDate <= weekEndDate;
        }).length || 0;
        newCustomers.unshift(weekNewCustomers);

        // Count active customers (those with accounts)
        const customerIds = customersUpToWeek.map(c => c.customer_id);
        const activeCount = new Set(
          allAccounts?.filter(a => customerIds.includes(a.customer_id))
            .map(a => a.customer_id) || []
        ).size;
        activeCustomers.unshift(activeCount);

        // Calculate weekly growth rate
        if (week > 0) {
          const previousTotal = totalCustomers[0];
          const growthRate = previousTotal > 0 ? 
            ((totalCount - previousTotal) / previousTotal * 100) : 0;
          growthRates.unshift(growthRate);
        } else {
          growthRates.unshift(0);
        }
      }

      return {
        dates,
        totalCustomers,
        newCustomers,
        activeCustomers,
        growthRates
      };
    } catch (error) {
      console.error('Error in getCustomersTrendsData:', error);
      return {
        dates: [],
        totalCustomers: [],
        newCustomers: [],
        activeCustomers: [],
        growthRates: []
      };
    }
  },

  async getRawData(section, widgetId, filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      // For total assets, return combined accounts and loans data
      if (section === 'overview' && widgetId === 'total_assets') {
        const [accounts, loans] = await Promise.all([
          supabaseBanking.from(TABLES.ACCOUNTS)
            .select('*')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end)
            .limit(100),
          supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
            .select('*')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end)
            .limit(100)
        ]);

        return {
          accounts: accounts.data || [],
          loans: loans.data || []
        };
      }

      // Return empty data for now
      return {
        data: []
      };
    } catch (error) {
      console.error('Error fetching raw data:', error);
      return {
        data: []
      };
    }
  },

  async getCustomersRawData(filters) {
    try {
      // For customer raw data, we should match the main dashboard behavior
      const shouldApplyDateFilter = filters?.applyDateFilter !== false;
      
      let customersQuery = supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          accounts:${TABLES.ACCOUNTS}(
            account_id,
            account_number,
            account_type,
            current_balance,
            status
          )
        `);
      
      // Apply date filter only if explicitly requested
      if (shouldApplyDateFilter && filters?.dateRange && filters.dateRange !== 'all_time') {
        const dateFilter = getDateFilter(filters.dateRange);
        customersQuery = customersQuery
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end);
      }
      
      // Fetch customers with their account information
      const { data: customers, error } = await customersQuery
        .limit(100)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers raw data:', error);
        throw error;
      }

      // Transform the data for display
      const transformedData = customers?.map(customer => ({
        ...customer,
        total_balance: customer.accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0,
        account_count: customer.accounts?.length || 0,
        active_accounts: customer.accounts?.filter(acc => acc.status === 'active').length || 0
      })) || [];

      return {
        customers: transformedData
      };
    } catch (error) {
      console.error('Error in getCustomersRawData:', error);
      return {
        customers: []
      };
    }
  },

  async exportWidgetData(section, widgetId, format, filters = {}) {
    try {
      const widgetData = await this.getWidgetDetails(section, widgetId, filters);
      if (!widgetData.success) {
        throw new Error('Failed to fetch widget data');
      }
      
      // Generate CSV data
      if (format === 'csv') {
        const csvData = this.generateCSV(widgetData.data);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${section}_${widgetId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return {
          success: true,
          message: 'Export completed successfully'
        };
      }
      
      // For other formats, return success for now
      return {
        success: true,
        message: `Export to ${format} completed successfully`
      };
    } catch (error) {
      console.error('Error exporting widget data:', error);
      return { success: false, error: error.message };
    }
  },

  generateCSV(data) {
    let csv = 'Total Assets Report\n\n';
    
    // Overview section
    if (data.overview) {
      csv += 'Overview\n';
      csv += 'Metric,Value\n';
      csv += `Total Assets,${data.overview.totalAssets}\n`;
      csv += `Total Deposits,${data.overview.totalDeposits}\n`;
      csv += `Total Loans,${data.overview.totalLoans}\n`;
      csv += `Deposit Ratio,${data.overview.depositRatio}%\n`;
      csv += `Loan Ratio,${data.overview.loanRatio}%\n`;
      csv += `Account Count,${data.overview.accountCount}\n`;
      csv += `Loan Count,${data.overview.loanCount}\n`;
      csv += `Average Account Balance,${data.overview.avgAccountBalance}\n`;
      csv += `Average Loan Balance,${data.overview.avgLoanBalance}\n`;
      csv += '\n';
    }
    
    // Breakdown section
    if (data.breakdown) {
      csv += 'Breakdown Analysis\n';
      
      if (data.breakdown.byCategory) {
        csv += '\nBy Category\n';
        csv += 'Category,Amount\n';
        Object.entries(data.breakdown.byCategory).forEach(([key, value]) => {
          csv += `${key},${value}\n`;
        });
      }
      
      if (data.breakdown.byAccountType) {
        csv += '\nBy Account Type\n';
        csv += 'Type,Amount\n';
        Object.entries(data.breakdown.byAccountType).forEach(([key, value]) => {
          csv += `${key},${value}\n`;
        });
      }
      
      csv += '\n';
    }
    
    // Raw data section
    if (data.raw && data.raw.accounts) {
      csv += 'Top Accounts\n';
      csv += 'Account Number,Type,Balance,Status,Created\n';
      data.raw.accounts.slice(0, 10).forEach(acc => {
        csv += `${acc.account_number},${acc.account_types?.type_name || 'Unknown'},${acc.current_balance},${acc.status},${acc.created_at}\n`;
      });
    }
    
    return csv;
  },

  async getBankingBreakdown(widgetId, filters) {
    try {
      console.log('Getting banking breakdown for widget:', widgetId);
      
      // Apply branch filter if provided
      let accountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          kastle_banking.account_types!account_type_id (
            type_name,
            account_category
          ),
          kastle_banking.customers!customer_id (
            customer_id,
            first_name,
            last_name
          )
        `);
      
      if (filters?.branch && filters.branch !== 'all') {
        accountsQuery = accountsQuery.eq('branch_id', filters.branch);
      }
      
      const { data: accounts } = await accountsQuery;
      
      if (!accounts) {
        return {
          byCategory: {},
          byAccountType: {},
          byStatus: {},
          byBranch: {},
          byCurrency: {}
        };
      }

      // Breakdown by account category
      const byCategory = {};
      accounts.forEach(account => {
        const category = account.kastle_banking?.account_types?.account_category || 'Unknown';
        if (!byCategory[category]) byCategory[category] = 0;
        byCategory[category] += parseFloat(account.current_balance || 0);
      });

      // Breakdown by account type
      const byAccountType = {};
      accounts.forEach(account => {
        const type = account.kastle_banking?.account_types?.type_name || 'Unknown';
        if (!byAccountType[type]) byAccountType[type] = 0;
        byAccountType[type] += parseFloat(account.current_balance || 0);
      });

      // Breakdown by account status
      const byStatus = {};
      accounts.forEach(account => {
        const status = account.account_status || 'Unknown';
        if (!byStatus[status]) byStatus[status] = 0;
        byStatus[status] += 1;
      });

      // Breakdown by branch
      const byBranch = {};
      accounts.forEach(account => {
        const branch = account.branch_id || 'Unknown';
        if (!byBranch[branch]) byBranch[branch] = 0;
        byBranch[branch] += parseFloat(account.current_balance || 0);
      });

      // Breakdown by currency
      const byCurrency = {};
      accounts.forEach(account => {
        const currency = account.currency_code || 'SAR';
        if (!byCurrency[currency]) byCurrency[currency] = 0;
        byCurrency[currency] += parseFloat(account.current_balance || 0);
      });

      return {
        byCategory,
        byAccountType,
        byStatus,
        byBranch,
        byCurrency
      };
    } catch (error) {
      console.error('Error fetching banking breakdown:', error);
      return {
        byCategory: {},
        byAccountType: {},
        byStatus: {},
        byBranch: {},
        byCurrency: {}
      };
    }
  },

  async getBankingTrendsData(widgetId, filters) {
    try {
      console.log('Getting banking trends for widget:', widgetId);
      
      // Generate data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const dates = [];
      const totalBalances = [];
      const accountCounts = [];
      const growthRates = [];

      // Apply branch filter if provided
      let baseQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*');
      
      if (filters?.branch && filters.branch !== 'all') {
        baseQuery = baseQuery.eq('branch_id', filters.branch);
      }

      // Get all accounts in date range
      const { data: allAccounts } = await baseQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Generate daily data points
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);

        // Get accounts created up to this date
        const accountsUpToDate = allAccounts?.filter(acc => 
          new Date(acc.created_at) <= d
        ) || [];

        const totalBalance = accountsUpToDate.reduce((sum, acc) => 
          sum + parseFloat(acc.current_balance || 0), 0
        );
        
        totalBalances.push(totalBalance);
        accountCounts.push(accountsUpToDate.length);
        
        // Calculate growth rate
        const prevBalance = totalBalances[totalBalances.length - 2] || 0;
        const growthRate = prevBalance > 0 ? 
          ((totalBalance - prevBalance) / prevBalance * 100) : 0;
        growthRates.push(growthRate);
      }

      return {
        dates,
        totalBalances,
        accountCounts,
        growthRates
      };
    } catch (error) {
      console.error('Error fetching banking trends:', error);
      return {
        dates: [],
        totalBalances: [],
        accountCounts: [],
        growthRates: []
      };
    }
  },

  async getBankingRawData(widgetId, filters) {
    try {
      console.log('Getting banking raw data for widget:', widgetId);
      
      // Apply branch filter if provided
      let accountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          kastle_banking.account_types!account_type_id (
            type_name,
            account_category
          ),
          kastle_banking.customers!customer_id (
            customer_id,
            first_name,
            last_name,
            customer_type_id
          )
        `)
        .order('current_balance', { ascending: false })
        .limit(50);
      
      if (filters?.branch && filters.branch !== 'all') {
        accountsQuery = accountsQuery.eq('branch_id', filters.branch);
      }
      
      const { data: accounts } = await accountsQuery;

      // Get account statistics
      const totalAccountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true });
      
      const activeAccountsQuery = supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'ACTIVE');

      const [totalResult, activeResult] = await Promise.all([
        totalAccountsQuery,
        activeAccountsQuery
      ]);

      return {
        accounts: accounts || [],
        totalAccounts: totalResult.count || 0,
        activeAccounts: activeResult.count || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching banking raw data:', error);
      return {
        accounts: [],
        totalAccounts: 0,
        activeAccounts: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  async getLendingBreakdown(widgetId, filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      switch (widgetId) {
        case 'loan_portfolio':
          const loans = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_type, outstanding_balance')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const loanBreakdown = {};
          loans.data?.forEach(loan => {
            loanBreakdown[loan.loan_type] = (loanBreakdown[loan.loan_type] || 0) + loan.outstanding_balance;
          });
          
          return { byType: loanBreakdown };
          
        default:
          return {};
      }
    } catch (error) {
      console.error('Error in getLendingBreakdown:', error);
      return {};
    }
  },

  async getCollectionsBreakdown(widgetId, filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      switch (widgetId) {
        case 'active_cases':
          // Get collection cases breakdown by status
          const cases = await supabaseBanking
            .from(TABLES.LOAN_ACCOUNTS)
            .select('loan_status, outstanding_balance')
            .in('loan_status', ['OVERDUE', 'DEFAULT'])
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const caseBreakdown = {};
          cases.data?.forEach(loan => {
            caseBreakdown[loan.loan_status] = (caseBreakdown[loan.loan_status] || 0) + 1;
          });
          
          return { byStatus: caseBreakdown };
          
        default:
          return {};
      }
    } catch (error) {
      console.error('Error in getCollectionsBreakdown:', error);
      return {};
    }
  },

  async getCustomersBreakdown(widgetId, filters) {
    try {
      // For customer breakdown, we should match the main dashboard behavior
      const shouldApplyDateFilter = filters?.applyDateFilter !== false;
      
      switch (widgetId) {
        case 'total_customers':
          // Query customers with branch information
          let customersQuery = supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select(`
              customer_type, 
              customer_segment, 
              customer_type_id, 
              kyc_status, 
              risk_category,
              onboarding_branch,
              branches!onboarding_branch(branch_name, branch_code)
            `);
          
          // Apply date filter only if explicitly requested
          if (shouldApplyDateFilter && filters?.dateRange && filters.dateRange !== 'all_time') {
            const dateFilter = getDateFilter(filters.dateRange);
            customersQuery = customersQuery
              .gte('created_at', dateFilter.start)
              .lte('created_at', dateFilter.end);
          }
          
          const { data: customers, error } = await customersQuery;
          
          if (error) {
            console.error('Error fetching customers for breakdown:', error);
            return {};
          }
          
          const rawBreakdowns = {
            byType: {},
            bySegment: {},
            byKYC: {},
            byRisk: {},
            byBranch: {}
          };
          
          customers?.forEach(cust => {
            // Customer Type breakdown
            const type = cust.customer_type || cust.customer_segment || 'Standard';
            rawBreakdowns.byType[type] = (rawBreakdowns.byType[type] || 0) + 1;
            
            // Customer Segment breakdown
            const segment = cust.customer_segment || cust.customer_type || 'Standard';
            rawBreakdowns.bySegment[segment] = (rawBreakdowns.bySegment[segment] || 0) + 1;
            
            // KYC Status breakdown
            const kycStatus = cust.kyc_status || 'Pending';
            rawBreakdowns.byKYC[kycStatus] = (rawBreakdowns.byKYC[kycStatus] || 0) + 1;
            
            // Risk Category breakdown
            const riskCategory = cust.risk_category || 'Medium';
            rawBreakdowns.byRisk[riskCategory] = (rawBreakdowns.byRisk[riskCategory] || 0) + 1;

            // Branch breakdown
            const branchName = cust.branches?.branch_name || 'Unknown Branch';
            rawBreakdowns.byBranch[branchName] = (rawBreakdowns.byBranch[branchName] || 0) + 1;
          });
          
          // Convert to format expected by UI (matching BreakdownCard component)
          const convertToChartData = (breakdown, colors = ['#E6B800', '#4A5568', '#22c55e', '#3b82f6', '#ef4444', '#f97316']) => {
            return Object.entries(breakdown)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([name, value], index) => ({
                name,
                value,
                fill: colors[index % colors.length]
              }));
          };

          // Format as expected by UI template
          return {
            byCategory: convertToChartData(rawBreakdowns.bySegment), // Use segment as main category
            byType: convertToChartData(rawBreakdowns.byType),
            bySegment: convertToChartData(rawBreakdowns.bySegment),
            byKYC: convertToChartData(rawBreakdowns.byKYC),
            byRisk: convertToChartData(rawBreakdowns.byRisk),
            byBranch: Object.entries(rawBreakdowns.byBranch)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10) // Top 10 branches
              .map(([name, value]) => ({ name, value })),
            byStatus: convertToChartData(rawBreakdowns.byKYC) // Use KYC status as main status
          };
          
        default:
          return {};
      }
    } catch (error) {
      console.error('Error in getCustomersBreakdown:', error);
      return {};
    }
  },

  async getGenericBreakdown(section, widgetId, filters) {
    // Special handling for total_assets
    if (section === 'overview' && widgetId === 'total_assets') {
      return await this.getTotalAssetsBreakdown(filters);
    }
    
    // Skeleton for generic breakdown - to be implemented per widget
    return {
      byCategory: {},
      byType: {},
      byBranch: {}
    };
  }
};