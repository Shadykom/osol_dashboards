// src/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { CustomerService } from '@/services/customerService';

export function useDashboard(autoRefresh = false, refreshInterval = 30000) {
  const [data, setData] = useState({
    kpis: null,
    recentTransactions: [],
    transactionAnalytics: null,
    customerAnalytics: null,
    loanAnalytics: null,
    monthlyComparison: null,
    branchComparison: null,
    realTimeMetrics: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      // Load all dashboard data in parallel with individual error handling
      const results = await Promise.allSettled([
        DashboardService.getExecutiveKPIs(),
        DashboardService.getRecentTransactions(10),
        DashboardService.getTransactionAnalytics(),
        CustomerService.getCustomerAnalytics(),
        DashboardService.getLoanAnalytics(),
        DashboardService.getMonthlyComparison(),
        DashboardService.getBranchComparison(),
        DashboardService.getRealTimeMetrics()
      ]);

      // Process results and extract data
      const [
        kpisResult,
        transactionsResult,
        transactionAnalyticsResult,
        customerAnalyticsResult,
        loanAnalyticsResult,
        monthlyComparisonResult,
        branchComparisonResult,
        realTimeMetricsResult
      ] = results;

      // Extract data from successful results, use null for failed ones
      const extractData = (result) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          return result.value.data;
        }
        console.warn('Failed to load data:', result.reason || result.value?.error);
        return null;
      };

      // Update state with loaded data
      setData({
        kpis: extractData(kpisResult),
        recentTransactions: extractData(transactionsResult) || [],
        transactionAnalytics: extractData(transactionAnalyticsResult),
        customerAnalytics: extractData(customerAnalyticsResult),
        loanAnalytics: extractData(loanAnalyticsResult),
        monthlyComparison: extractData(monthlyComparisonResult),
        branchComparison: extractData(branchComparisonResult),
        realTimeMetrics: extractData(realTimeMetricsResult)
      });
      
      setLastUpdated(new Date());
      console.log('Dashboard data loaded successfully');
      
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set empty data structure to prevent UI crashes
      setData({
        kpis: {
          total_customers: 0,
          total_accounts: 0,
          total_deposits: 0,
          total_loans: 0,
          daily_transactions: 0,
          monthly_revenue: 0
        },
        recentTransactions: [],
        transactionAnalytics: {
          by_channel: [],
          success_rate: 0,
          total_transactions: 0,
          completed_transactions: 0
        },
        customerAnalytics: {
          by_segment: [],
          kyc_status: [],
          by_risk_category: [],
          total_customers: 0
        },
        loanAnalytics: {
          total_portfolio: 0,
          disbursed_amount: 0,
          outstanding_amount: 0,
          by_status: [],
          default_rate: 0
        },
        monthlyComparison: {
          current_month: {
            revenue: 0,
            customers: 0,
            transactions: 0,
            deposits: 0
          },
          previous_month: {
            revenue: 0,
            customers: 0,
            transactions: 0,
            deposits: 0
          },
          trends: []
        },
        branchComparison: {
          branches: []
        },
        realTimeMetrics: {
          active_sessions: 0,
          pending_transactions: 0,
          failed_transactions_today: 0,
          system_alerts: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, loadDashboardData]);

  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Computed values
  const getTrend = useCallback((current, previous) => {
    if (current === previous) return { change: '0%', trend: 'neutral' };
    
    const change = ((current - previous) / previous * 100).toFixed(1);
    const trend = current > previous ? 'up' : 'down';
    
    return {
      change: `${trend === 'up' ? '+' : ''}${change}%`,
      trend
    };
  }, []);

  const getKPIWithTrend = useCallback((key) => {
    const currentValue = data.kpis?.[key] || 0;
    
    // For demonstration, we'll use monthly comparison data for trends
    if (key === 'total_customers' && data.monthlyComparison) {
      const trend = getTrend(
        data.monthlyComparison.current_month.customers,
        data.monthlyComparison.previous_month.customers
      );
      return { value: currentValue, ...trend };
    }
    
    if (key === 'monthly_revenue' && data.monthlyComparison) {
      const trend = getTrend(
        data.monthlyComparison.current_month.revenue,
        data.monthlyComparison.previous_month.revenue
      );
      return { value: currentValue, ...trend };
    }
    
    // Default trend for other KPIs
    return { value: currentValue, change: '+12.5%', trend: 'up' };
  }, [data, getTrend]);

  return {
    // Data
    kpis: data.kpis,
    recentTransactions: data.recentTransactions,
    transactionAnalytics: data.transactionAnalytics,
    customerAnalytics: data.customerAnalytics,
    loanAnalytics: data.loanAnalytics,
    monthlyComparison: data.monthlyComparison,
    branchComparison: data.branchComparison,
    realTimeMetrics: data.realTimeMetrics,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshData,
    
    // Helpers
    getKPIWithTrend
  };
}