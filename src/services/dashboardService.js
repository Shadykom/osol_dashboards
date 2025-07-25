// src/services/dashboardService.js
import { supabase, TABLES, formatApiResponse, isSupabaseConfigured } from '@/lib/supabase';
import { MockDashboardService } from './mockDashboardService';

export class DashboardService {
  /**
   * Get executive dashboard KPIs
   */
  static async getExecutiveKPIs() {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.log('Using mock data for KPIs');
      return MockDashboardService.getExecutiveKPIs();
    }

    try {
      // Get total customers
      const { count: totalCustomers, error: customersError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true });

      // Get total accounts
      const { count: totalAccounts, error: accountsError } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('*', { count: 'exact', head: true });

      // Get total deposits (sum of current_balance for all accounts)
      const { data: depositsData, error: depositsError } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_status', 'ACTIVE');

      // Get total loans (sum of outstanding_balance for all loan accounts)
      const { data: loansData, error: loansError } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance')
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      // Get daily transactions count
      const today = new Date().toISOString().split('T')[0];
      const { count: dailyTransactions, error: transactionsError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .gte('transaction_date', today);

      if (customersError || accountsError || depositsError || loansError || transactionsError) {
        throw customersError || accountsError || depositsError || loansError || transactionsError;
      }

      // Calculate totals
      const totalDeposits = depositsData?.reduce((sum, account) => sum + (parseFloat(account.current_balance) || 0), 0) || 0;
      const totalLoans = loansData?.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0) || 0;

      // Mock monthly revenue calculation (would need proper revenue tracking)
      const monthlyRevenue = totalDeposits * 0.02; // Assuming 2% monthly revenue rate

      const kpis = {
        total_customers: totalCustomers || 0,
        total_accounts: totalAccounts || 0,
        total_deposits: totalDeposits,
        total_loans: totalLoans,
        daily_transactions: dailyTransactions || 0,
        monthly_revenue: monthlyRevenue
      };

      return formatApiResponse(kpis);
    } catch (error) {
      console.error('Error fetching KPIs, falling back to mock data:', error);
      return MockDashboardService.getExecutiveKPIs();
    }
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(limit = 10) {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getRecentTransactions(limit);
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_id,
          transaction_amount,
          transaction_type,
          status,
          transaction_date,
          created_at,
          ${TABLES.CUSTOMERS}!inner(customer_name),
          ${TABLES.ACCOUNTS}!inner(account_number)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedTransactions = data?.map(transaction => ({
        id: transaction.transaction_id,
        customer_name: transaction.customers?.customer_name || 'Unknown',
        account_number: transaction.accounts?.account_number || 'N/A',
        amount: transaction.transaction_amount,
        transaction_type: transaction.transaction_type,
        status: transaction.status,
        created_at: transaction.created_at
      })) || [];

      return formatApiResponse(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions, falling back to mock data:', error);
      return MockDashboardService.getRecentTransactions(limit);
    }
  }

  /**
   * Get transaction analytics
   */
  static async getTransactionAnalytics() {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getTransactionAnalytics();
    }

    try {
      // This would be a complex query in real implementation
      // For now, return mock data to prevent errors
      return MockDashboardService.getTransactionAnalytics();
    } catch (error) {
      console.error('Error fetching transaction analytics, falling back to mock data:', error);
      return MockDashboardService.getTransactionAnalytics();
    }
  }

  /**
   * Get loan analytics
   */
  static async getLoanAnalytics() {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getLoanAnalytics();
    }

    try {
      // This would be a complex query in real implementation
      // For now, return mock data to prevent errors
      return MockDashboardService.getLoanAnalytics();
    } catch (error) {
      console.error('Error fetching loan analytics, falling back to mock data:', error);
      return MockDashboardService.getLoanAnalytics();
    }
  }

  /**
   * Get monthly comparison
   */
  static async getMonthlyComparison() {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getMonthlyComparison();
    }

    try {
      // This would be a complex query in real implementation
      // For now, return mock data to prevent errors
      return MockDashboardService.getMonthlyComparison();
    } catch (error) {
      console.error('Error fetching monthly comparison, falling back to mock data:', error);
      return MockDashboardService.getMonthlyComparison();
    }
  }

  /**
   * Get branch comparison
   */
  static async getBranchComparison() {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getBranchComparison();
    }

    try {
      // This would be a complex query in real implementation
      // For now, return mock data to prevent errors
      return MockDashboardService.getBranchComparison();
    } catch (error) {
      console.error('Error fetching branch comparison, falling back to mock data:', error);
      return MockDashboardService.getBranchComparison();
    }
  }

  /**
   * Get real-time metrics
   */
  static async getRealTimeMetrics() {
    if (!isSupabaseConfigured) {
      return MockDashboardService.getRealTimeMetrics();
    }

    try {
      // This would be a complex query in real implementation
      // For now, return mock data to prevent errors
      return MockDashboardService.getRealTimeMetrics();
    } catch (error) {
      console.error('Error fetching real-time metrics, falling back to mock data:', error);
      return MockDashboardService.getRealTimeMetrics();
    }
  }
}

