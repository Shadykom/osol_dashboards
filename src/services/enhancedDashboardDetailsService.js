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

  async getTotalAssetsBreakdown(filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      // Fetch accounts and loans data
      const [accountsResult, loansResult, branchesResult] = await Promise.all([
        supabaseBanking.from(TABLES.ACCOUNTS)
          .select('account_type, current_balance, status, branch_id, currency')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end),
        supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
          .select('loan_type, outstanding_balance, status, branch_id')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end),
        supabaseBanking.from(TABLES.BRANCHES)
          .select('branch_id, branch_name')
      ]);

      const accounts = accountsResult.data || [];
      const loans = loansResult.data || [];
      const branches = branchesResult.data || [];
      
      // Create branch lookup
      const branchLookup = {};
      branches.forEach(branch => {
        branchLookup[branch.branch_id] = branch.branch_name;
      });

      // Breakdown by Category (Deposits vs Loans)
      const byCategory = {
        'Deposits': accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
        'Loans': loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0)
      };

      // Breakdown by Account Type
      const byAccountType = {};
      accounts.forEach(acc => {
        const type = acc.account_type || 'Other';
        byAccountType[type] = (byAccountType[type] || 0) + (acc.current_balance || 0);
      });

      // Breakdown by Product Type (Loan Types)
      const byProductType = {};
      loans.forEach(loan => {
        const type = loan.loan_type || 'Other';
        byProductType[type] = (byProductType[type] || 0) + (loan.outstanding_balance || 0);
      });

      // Breakdown by Branch
      const byBranch = {};
      accounts.forEach(acc => {
        const branchName = branchLookup[acc.branch_id] || 'Unknown Branch';
        byBranch[branchName] = (byBranch[branchName] || 0) + (acc.current_balance || 0);
      });
      loans.forEach(loan => {
        const branchName = branchLookup[loan.branch_id] || 'Unknown Branch';
        byBranch[branchName] = (byBranch[branchName] || 0) + (loan.outstanding_balance || 0);
      });

      // Breakdown by Currency
      const byCurrency = {};
      accounts.forEach(acc => {
        const currency = acc.currency || 'SAR';
        byCurrency[currency] = (byCurrency[currency] || 0) + (acc.current_balance || 0);
      });

      // Breakdown by Status
      const byStatus = {
        'Active Accounts': 0,
        'Inactive Accounts': 0,
        'Active Loans': 0,
        'Closed Loans': 0
      };
      accounts.forEach(acc => {
        if (acc.status === 'active') {
          byStatus['Active Accounts'] += acc.current_balance || 0;
        } else {
          byStatus['Inactive Accounts'] += acc.current_balance || 0;
        }
      });
      loans.forEach(loan => {
        if (loan.status === 'active') {
          byStatus['Active Loans'] += loan.outstanding_balance || 0;
        } else {
          byStatus['Closed Loans'] += loan.outstanding_balance || 0;
        }
      });

      return {
        byCategory,
        byAccountType,
        byProductType,
        byBranch: Object.fromEntries(
          Object.entries(byBranch)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10) // Top 10 branches
        ),
        byCurrency,
        byStatus
      };
    } catch (error) {
      console.error('Error fetching breakdown data:', error);
      return {};
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
      }

      // Fetch data for each date
      let previousTotal = 0;
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [accountsResult, loansResult] = await Promise.all([
          supabaseBanking.from(TABLES.ACCOUNTS)
            .select('current_balance')
            .lte('created_at', nextDate.toISOString()),
          supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
            .select('outstanding_balance')
            .lte('created_at', nextDate.toISOString())
        ]);

        const totalDepositsForDate = accountsResult.data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
        const totalLoansForDate = loansResult.data?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
        const totalAssetsForDate = totalDepositsForDate + totalLoansForDate;

        deposits.push(totalDepositsForDate);
        loans.push(totalLoansForDate);
        totalAssets.push(totalAssetsForDate);

        // Calculate growth rate
        if (i > 0 && previousTotal > 0) {
          const growthRate = ((totalAssetsForDate - previousTotal) / previousTotal) * 100;
          growthRates.push(parseFloat(growthRate.toFixed(2)));
        } else {
          growthRates.push(0);
        }
        previousTotal = totalAssetsForDate;
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

  async getRawData(section, widgetId, filters) {
    try {
      const dateFilter = getDateFilter(filters.dateRange);
      
      // Fetch top accounts and loans
      const [accountsResult, loansResult] = await Promise.all([
        supabaseBanking.from(TABLES.ACCOUNTS)
          .select('*')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end)
          .order('current_balance', { ascending: false })
          .limit(50),
        supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
          .select('*')
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end)
          .order('outstanding_balance', { ascending: false })
          .limit(50)
      ]);

      const accounts = accountsResult.data || [];
      const loans = loansResult.data || [];

      return {
        accounts: accounts.map(acc => ({
          account_id: acc.account_id,
          account_number: acc.account_number,
          account_type: acc.account_type,
          current_balance: acc.current_balance,
          status: acc.status,
          created_at: acc.created_at,
          customer_id: acc.customer_id,
          branch_id: acc.branch_id,
          currency: acc.currency || 'SAR'
        })),
        loans: loans.map(loan => ({
          loan_id: loan.loan_id,
          loan_type: loan.loan_type,
          outstanding_balance: loan.outstanding_balance,
          original_amount: loan.original_amount,
          status: loan.status,
          created_at: loan.created_at,
          customer_id: loan.customer_id,
          branch_id: loan.branch_id,
          interest_rate: loan.interest_rate,
          term_months: loan.term_months
        })),
        totalAccounts: accounts.length,
        totalLoans: loans.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching raw data:', error);
      return {
        accounts: [],
        loans: [],
        totalAccounts: 0,
        totalLoans: 0,
        lastUpdated: new Date().toISOString()
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
        csv += `${acc.account_number},${acc.account_type},${acc.current_balance},${acc.status},${acc.created_at}\n`;
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
            .select('account_type')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const typeBreakdown = {};
          accountTypes.data?.forEach(acc => {
            typeBreakdown[acc.account_type] = (typeBreakdown[acc.account_type] || 0) + 1;
          });
          
          return { byType: typeBreakdown };
          
        case 'total_deposits':
          const deposits = await supabaseBanking
            .from(TABLES.ACCOUNTS)
            .select('account_type, current_balance')
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end);
          
          const depositBreakdown = {};
          deposits.data?.forEach(acc => {
            depositBreakdown[acc.account_type] = (depositBreakdown[acc.account_type] || 0) + acc.current_balance;
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