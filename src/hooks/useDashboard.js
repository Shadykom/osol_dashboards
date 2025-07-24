import { useState, useEffect } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { CustomerService } from '@/services/customerService';

export function useDashboard() {
  const [kpis, setKpis] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load KPIs
      const kpisResponse = await DashboardService.getExecutiveKPIs();
      if (kpisResponse.success) {
        setKpis(kpisResponse.data);
      } else {
        console.error('Failed to load KPIs:', kpisResponse.error);
      }

      // Load recent transactions
      const transactionsResponse = await DashboardService.getRecentTransactions(5);
      if (transactionsResponse.success) {
        setRecentTransactions(transactionsResponse.data);
      } else {
        console.error('Failed to load recent transactions:', transactionsResponse.error);
      }

      // Load real-time metrics
      const metricsResponse = await DashboardService.getRealTimeMetrics();
      if (metricsResponse.success) {
        setRealTimeMetrics(metricsResponse.data);
      } else {
        console.error('Failed to load real-time metrics:', metricsResponse.error);
      }

    } catch (err) {
      console.error('Dashboard data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data function
  const refreshData = () => {
    loadDashboardData();
  };

  return {
    kpis,
    recentTransactions,
    realTimeMetrics,
    loading,
    error,
    refreshData
  };
}

export function useCustomers(params = {}) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCustomers = async (searchParams = params) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CustomerService.getCustomers(searchParams);
      
      if (response.success) {
        setCustomers(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.error?.error || 'Failed to load customers');
        setCustomers([]);
      }
    } catch (err) {
      console.error('Customers loading error:', err);
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const searchCustomers = (searchParams) => {
    loadCustomers(searchParams);
  };

  const refreshCustomers = () => {
    loadCustomers(params);
  };

  return {
    customers,
    pagination,
    loading,
    error,
    searchCustomers,
    refreshCustomers
  };
}

export function useCustomerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CustomerService.getCustomerAnalytics();
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError(response.error?.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics: loadAnalytics
  };
}

