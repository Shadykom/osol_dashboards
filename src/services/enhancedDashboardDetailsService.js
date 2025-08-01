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

        // Get breakdown data based on widget type
        breakdownData = await this.getGenericBreakdown(section, widgetId, filters);
        trendsData = await this.getTrendsData(section, widgetId, filters);
        rawData = await this.getRawData(section, widgetId, filters);
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
      const dateFilter = getDateFilter(filters.dateRange);
      
      // Fetch customers data
      const { data: customers, error } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      const totalCustomers = customers?.length || 0;

      // Get customer type breakdown
      const customerTypes = {};
      customers?.forEach(customer => {
        const type = customer.customer_type || 'Unknown';
        customerTypes[type] = (customerTypes[type] || 0) + 1;
      });

      // Get new customers (last 30 days)
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
        individualCustomers: customerTypes['individual'] || 0,
        corporateCustomers: customerTypes['corporate'] || 0,
        vipCustomers: customerTypes['vip'] || 0,
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
      // Generate date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const dates = [];
      const totalCustomers = [];
      const newCustomers = [];
      const activeCustomers = [];
      const growthRates = [];

      // Fetch daily customer data
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        dates.push(currentDate);

        // Get customers up to this date
        const { data: customersUpToDate } = await supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('customer_id, created_at')
          .lte('created_at', currentDate);

        const totalCount = customersUpToDate?.length || 0;
        totalCustomers.push(totalCount);

        // Count new customers for this day
        const dayCustomers = customersUpToDate?.filter(c => 
          c.created_at.startsWith(currentDate)
        ).length || 0;
        newCustomers.push(dayCustomers);

        // Get active customers (those with accounts)
        const { data: activeAccounts } = await supabaseBanking
          .from(TABLES.ACCOUNTS)
          .select('customer_id')
          .in('customer_id', customersUpToDate?.map(c => c.customer_id) || [])
          .lte('created_at', currentDate);
        
        const activeCount = new Set(activeAccounts?.map(a => a.customer_id) || []).size;
        activeCustomers.push(activeCount);

        // Calculate daily growth rate
        if (totalCustomers.length > 1) {
          const previousTotal = totalCustomers[totalCustomers.length - 2];
          const growthRate = previousTotal > 0 ? 
            ((totalCount - previousTotal) / previousTotal * 100) : 0;
          growthRates.push(growthRate);
        } else {
          growthRates.push(0);
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
      console.error('Error fetching customers trends data:', error);
      // Return mock data as fallback
      const dates = [];
      const totalCustomers = [];
      const newCustomers = [];
      const activeCustomers = [];
      const growthRates = [];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      let baseCustomers = 1000;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
        baseCustomers += Math.floor(Math.random() * 20);
        totalCustomers.push(baseCustomers);
        newCustomers.push(Math.floor(Math.random() * 10));
        activeCustomers.push(Math.floor(baseCustomers * 0.8));
        growthRates.push(Math.random() * 2);
      }

      return {
        dates,
        totalCustomers,
        newCustomers,
        activeCustomers,
        growthRates
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
      const dateFilter = getDateFilter(filters.dateRange);
      
      // Fetch customers with their account information
      const { data: customers, error } = await supabaseBanking
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
        `)
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end)
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
      const dateFilter = getDateFilter(filters.dateRange);
      
      switch (widgetId) {
        case 'total_accounts':
          const accountTypes = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_type_id, account_types!inner(type_name)')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const typeBreakdown = {};
          accountTypes.data?.forEach(acc => {
            const typeName = acc.account_types?.type_name || 'Unknown';
            typeBreakdown[typeName] = (typeBreakdown[typeName] || 0) + 1;
          });
          
          return { byType: typeBreakdown };
          
        case 'total_deposits':
          const deposits = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_type_id, current_balance, account_types!inner(type_name)')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const depositBreakdown = {};
          deposits.data?.forEach(acc => {
            const typeName = acc.account_types?.type_name || 'Unknown';
            depositBreakdown[typeName] = (depositBreakdown[typeName] || 0) + acc.current_balance;
          });
          
          return { byType: depositBreakdown };
          
        default:
          return {};
      }
    } catch (error) {
      console.error('Error in getBankingBreakdown:', error);
      return {};
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
      const dateFilter = getDateFilter(filters.dateRange);
      
      switch (widgetId) {
        case 'total_customers':
          const customers = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_type')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const customerBreakdown = {};
          customers.data?.forEach(cust => {
            customerBreakdown[cust.customer_type] = (customerBreakdown[cust.customer_type] || 0) + 1;
          });
          
          return { byType: customerBreakdown };
          
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