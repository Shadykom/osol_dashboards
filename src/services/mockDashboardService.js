// src/services/mockDashboardService.js
import { mockData } from '@/lib/supabaseConfig';

// Simple API response formatter
function formatApiResponse(data, error = null) {
  return {
    data: data || null,
    error: error,
    success: !error
  };
}

export class MockDashboardService {
  /**
   * Get executive dashboard KPIs (mock data)
   */
  static async getExecutiveKPIs() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return formatApiResponse(mockData.kpis);
  }

  /**
   * Get recent transactions (mock data)
   */
  static async getRecentTransactions(limit = 10) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transactions = mockData.recentTransactions.slice(0, limit);
    return formatApiResponse(transactions);
  }

  /**
   * Get transaction analytics (mock data)
   */
  static async getTransactionAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return formatApiResponse(mockData.transactionAnalytics);
  }

  /**
   * Get loan analytics (mock data)
   */
  static async getLoanAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 350));
    
    return formatApiResponse(mockData.loanAnalytics);
  }

  /**
   * Get monthly comparison (mock data)
   */
  static async getMonthlyComparison() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentMonth = {
      revenue: mockData.kpis.monthly_revenue,
      customers: mockData.kpis.total_customers,
      transactions: mockData.kpis.daily_transactions * 30,
      deposits: mockData.kpis.total_deposits
    };
    
    const previousMonth = {
      revenue: currentMonth.revenue * 0.85,
      customers: currentMonth.customers * 0.92,
      transactions: currentMonth.transactions * 0.88,
      deposits: currentMonth.deposits * 0.90
    };
    
    return formatApiResponse({
      current_month: currentMonth,
      previous_month: previousMonth,
      trends: [
        { metric: 'revenue', change: 15.0, trend: 'up' },
        { metric: 'customers', change: 8.7, trend: 'up' },
        { metric: 'transactions', change: 13.6, trend: 'up' },
        { metric: 'deposits', change: 11.1, trend: 'up' }
      ]
    });
  }

  /**
   * Get branch comparison (mock data)
   */
  static async getBranchComparison() {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const branches = [
      { name: 'Riyadh Main', customers: 3500, deposits: 850000000, transactions: 12500 },
      { name: 'Jeddah Branch', customers: 2800, deposits: 720000000, transactions: 9800 },
      { name: 'Dammam Branch', customers: 2200, deposits: 580000000, transactions: 7600 },
      { name: 'Mecca Branch', customers: 1900, deposits: 490000000, transactions: 6200 },
      { name: 'Medina Branch', customers: 1600, deposits: 380000000, transactions: 5100 }
    ];
    
    return formatApiResponse({ branches });
  }

  /**
   * Get real-time metrics (mock data)
   */
  static async getRealTimeMetrics() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const metrics = {
      active_sessions: Math.floor(Math.random() * 500) + 200,
      pending_transactions: Math.floor(Math.random() * 50) + 10,
      failed_transactions_today: Math.floor(Math.random() * 20) + 2,
      system_alerts: Math.floor(Math.random() * 5)
    };
    
    return formatApiResponse(metrics);
  }
}

