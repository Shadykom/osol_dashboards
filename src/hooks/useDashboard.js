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
      // Load all dashboard data in parallel
      const [
        kpisResponse,
        transactionsResponse,
        transactionAnalyticsResponse,
        customerAnalyticsResponse,
        loanAnalyticsResponse,
        monthlyComparisonResponse,
        branchComparisonResponse,
        realTimeMetricsResponse
      ] = await Promise.all([
        DashboardService.getExecutiveKPIs(),
        DashboardService.getRecentTransactions(10),
        DashboardService.getTransactionAnalytics(),
        CustomerService.getCustomerAnalytics(),
        DashboardService.getLoanAnalytics(),
        DashboardService.getMonthlyComparison(),
        DashboardService.getBranchComparison(),
        DashboardService.getRealTimeMetrics()
      ]);

      // Check for errors in responses
      const responses = [
        kpisResponse,
        transactionsResponse,
        transactionAnalyticsResponse,
        customerAnalyticsResponse,
        loanAnalyticsResponse,
        monthlyComparisonResponse,
        branchComparisonResponse,
        realTimeMetricsResponse
      ];

      const hasError = responses.some(response => !response.success);
      
      if (hasError) {
        // Find first error
        const errorResponse = responses.find(response => !response.success);
        throw new Error(errorResponse?.error?.error || 'Failed to load dashboard data');
      }

      // Update state with loaded data
      console.log('Setting dashboard data in hook:');
      console.log('KPIs response:', kpisResponse);
      console.log('KPIs data:', kpisResponse.data);
      
      setData({
        kpis: kpisResponse.data,
        recentTransactions: transactionsResponse.data,
        transactionAnalytics: transactionAnalyticsResponse.data,
        customerAnalytics: customerAnalyticsResponse.data,
        loanAnalytics: loanAnalyticsResponse.data,
        monthlyComparison: monthlyComparisonResponse.data,
        branchComparison: branchComparisonResponse.data,
        realTimeMetrics: realTimeMetricsResponse.data
      });
      
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set default/mock data to ensure UI doesn't break
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