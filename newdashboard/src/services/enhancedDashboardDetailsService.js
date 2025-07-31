// Enhanced dashboard detail service
//
// Provides functions to fetch detailed information for individual widgets.
// This skeleton includes an example implementation for the `overview_total_assets`
// widget and can be expanded to cover additional widget types.  See the
// supplied documentation for guidance on what data to return in each case.

import { supabaseBanking, TABLES } from '../lib/supabase';
import { getDateFilter, getPreviousPeriodData, calculatePercentageChange } from '../utils/dateFilters.js';

export const enhancedDashboardDetailsService = {
  async getWidgetDetails(section, widgetId, filters = {}) {
    try {
      const widgetKey = `${section}_${widgetId}`;
      let overviewData = {};
      let breakdownData = {};
      let trendsData = {};
      let rawData = {};

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
            title: widgetId,
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
      depositRatio: ((totalDeposits / total) * 100).toFixed(2),
      loanRatio: ((totalLoans / total) * 100).toFixed(2),
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
    // Implementation omitted in this skeleton
    return {};
  },

  async getTrendsData(section, widgetId, filters) {
    // Implementation omitted in this skeleton
    return [];
  },

  async getRawData(section, widgetId, filters) {
    // Implementation omitted in this skeleton
    return {};
  }
};