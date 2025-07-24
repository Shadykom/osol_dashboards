import { supabase, TABLES, formatApiResponse } from '@/lib/supabase';

export class DashboardService {
  /**
   * Get executive dashboard KPIs
   */
  static async getExecutiveKPIs() {
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
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get transaction analytics
   */
  static async getTransactionAnalytics(params = {}) {
    try {
      const {
        from_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        to_date = new Date().toISOString().split('T')[0] // today
      } = params;

      // Get transactions by channel
      const { data: channelData, error: channelError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('channel, transaction_amount')
        .gte('transaction_date', from_date)
        .lte('transaction_date', to_date)
        .eq('status', 'COMPLETED');

      // Get transactions by status for success rate
      const { data: statusData, error: statusError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('status')
        .gte('transaction_date', from_date)
        .lte('transaction_date', to_date);

      if (channelError || statusError) {
        throw channelError || statusError;
      }

      // Process channel data
      const channelStats = channelData?.reduce((acc, transaction) => {
        const channel = transaction.channel;
        if (!acc[channel]) {
          acc[channel] = { count: 0, amount: 0 };
        }
        acc[channel].count += 1;
        acc[channel].amount += parseFloat(transaction.transaction_amount) || 0;
        return acc;
      }, {}) || {};

      const by_channel = Object.entries(channelStats).map(([channel, stats]) => ({
        channel,
        count: stats.count,
        amount: stats.amount
      }));

      // Calculate success rate
      const totalTransactions = statusData?.length || 0;
      const completedTransactions = statusData?.filter(t => t.status === 'COMPLETED').length || 0;
      const success_rate = totalTransactions > 0 ? ((completedTransactions / totalTransactions) * 100).toFixed(1) : 0;

      const analytics = {
        by_channel,
        success_rate: parseFloat(success_rate),
        total_transactions: totalTransactions,
        completed_transactions: completedTransactions
      };

      return formatApiResponse(analytics);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get loan portfolio analytics
   */
  static async getLoanAnalytics() {
    try {
      // Get all loan accounts
      const { data: loansData, error: loansError } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*');

      if (loansError) {
        throw loansError;
      }

      if (!loansData || loansData.length === 0) {
        return formatApiResponse({
          total_portfolio: 0,
          disbursed_amount: 0,
          outstanding_amount: 0,
          by_status: [],
          default_rate: 0
        });
      }

      // Calculate totals
      const totalPortfolio = loansData.reduce((sum, loan) => sum + (parseFloat(loan.loan_amount) || 0), 0);
      const disbursedAmount = loansData.reduce((sum, loan) => sum + (parseFloat(loan.disbursed_amount) || 0), 0);
      const outstandingAmount = loansData.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0);

      // Group by status
      const statusStats = loansData.reduce((acc, loan) => {
        const status = loan.loan_status;
        if (!acc[status]) {
          acc[status] = { count: 0, amount: 0 };
        }
        acc[status].count += 1;
        acc[status].amount += parseFloat(loan.outstanding_balance) || 0;
        return acc;
      }, {});

      const by_status = Object.entries(statusStats).map(([status, stats]) => ({
        status,
        count: stats.count,
        amount: stats.amount
      }));

      // Calculate default rate
      const defaultedLoans = loansData.filter(loan => loan.loan_status === 'DEFAULTED').length;
      const default_rate = loansData.length > 0 ? ((defaultedLoans / loansData.length) * 100).toFixed(1) : 0;

      const analytics = {
        total_portfolio: totalPortfolio,
        disbursed_amount: disbursedAmount,
        outstanding_amount: outstandingAmount,
        by_status,
        default_rate: parseFloat(default_rate)
      };

      return formatApiResponse(analytics);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get real-time metrics
   */
  static async getRealTimeMetrics() {
    try {
      // Get pending transactions count
      const { count: pendingTransactions, error: pendingError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Get failed transactions today
      const today = new Date().toISOString().split('T')[0];
      const { count: failedTransactionsToday, error: failedError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'FAILED')
        .gte('transaction_date', today);

      if (pendingError || failedError) {
        throw pendingError || failedError;
      }

      const metrics = {
        active_sessions: Math.floor(Math.random() * 50) + 10, // Mock data
        pending_transactions: pendingTransactions || 0,
        failed_transactions_today: failedTransactionsToday || 0,
        system_alerts: Math.floor(Math.random() * 5) // Mock data
      };

      return formatApiResponse(metrics);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(limit = 10) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          accounts!inner(customer_id, customers!inner(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Format the data for display
      const formattedTransactions = data?.map(transaction => ({
        id: transaction.transaction_ref,
        customer: transaction.accounts?.customers?.full_name || 'Unknown Customer',
        account: transaction.account_number,
        amount: `${transaction.currency_code} ${parseFloat(transaction.transaction_amount).toLocaleString()}`,
        type: transaction.debit_credit === 'DEBIT' ? 'Withdrawal' : 'Deposit',
        status: transaction.status,
        time: this.formatTimeAgo(transaction.created_at)
      })) || [];

      return formatApiResponse(formattedTransactions);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Helper function to format time ago
   */
  static formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
}

