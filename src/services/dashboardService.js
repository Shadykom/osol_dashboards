// src/services/dashboardService.js
import { 
  supabase, 
  supabaseBanking, 
  TABLES, 
  formatApiResponse, 
  handleSupabaseError, 
  isSupabaseConfigured,
  MOCK_DATA,
  getClientForTable,
  getTableNameOnly
} from '@/lib/supabase';

export class DashboardService {
  /**
   * Get executive dashboard KPIs with fallback to mock data
   */
  static async getExecutiveKPIs() {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using mock data');
        return formatApiResponse(MOCK_DATA.dashboard);
      }

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        // Get total customers
        supabaseBanking
          .from(getTableNameOnly(TABLES.CUSTOMERS))
          .select('*', { count: 'exact', head: true }),

        // Get total accounts
        supabaseBanking
          .from(getTableNameOnly(TABLES.ACCOUNTS))
          .select('*', { count: 'exact', head: true }),

        // Get deposits data
        supabaseBanking
          .from(getTableNameOnly(TABLES.ACCOUNTS))
          .select('current_balance')
          .eq('account_status', 'ACTIVE'),

        // Get loans data
        supabaseBanking
          .from(getTableNameOnly(TABLES.LOAN_ACCOUNTS))
          .select('outstanding_balance')
          .in('loan_status', ['ACTIVE', 'DISBURSED']),

        // Get daily transactions
        supabaseBanking
          .from(getTableNameOnly(TABLES.TRANSACTIONS))
          .select('*', { count: 'exact', head: true })
          .gte('transaction_date', new Date().toISOString().split('T')[0]),

        // Get recent transactions
        supabaseBanking
          .from(getTableNameOnly(TABLES.TRANSACTIONS))
          .select('id, customer_id, amount, transaction_type, status, transaction_datetime')
          .order('transaction_datetime', { ascending: false })
          .limit(5)
      ]);

      // Check if any critical queries failed
      const [customersResult, accountsResult, depositsResult, loansResult, transactionsCountResult, recentTransactionsResult] = results;

      // If all critical queries failed, fall back to mock data
      if (results.every(result => result.status === 'rejected')) {
        console.warn('All database queries failed, using mock data');
        return formatApiResponse(MOCK_DATA.dashboard);
      }

      // Extract successful results or use defaults
      const totalCustomers = customersResult.status === 'fulfilled' ? customersResult.value.count || 0 : MOCK_DATA.dashboard.totalCustomers;
      const totalAccounts = accountsResult.status === 'fulfilled' ? accountsResult.value.count || 0 : MOCK_DATA.dashboard.totalAccounts;
      
      const depositsData = depositsResult.status === 'fulfilled' ? depositsResult.value.data || [] : [];
      const loansData = loansResult.status === 'fulfilled' ? loansResult.value.data || [] : [];
      
      const dailyTransactions = transactionsCountResult.status === 'fulfilled' ? transactionsCountResult.value.count || 0 : MOCK_DATA.dashboard.dailyTransactions;
      const recentTransactions = recentTransactionsResult.status === 'fulfilled' ? recentTransactionsResult.value.data || [] : MOCK_DATA.dashboard.recentTransactions;

      // Calculate totals with fallback
      const totalDeposits = depositsData.length > 0 
        ? depositsData.reduce((sum, account) => sum + (parseFloat(account.current_balance) || 0), 0)
        : MOCK_DATA.dashboard.totalDeposits;
        
      const totalLoans = loansData.length > 0
        ? loansData.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0)
        : MOCK_DATA.dashboard.totalLoans;

      // Calculate monthly revenue (mock calculation)
      const monthlyRevenue = totalDeposits > 0 ? totalDeposits * 0.02 : MOCK_DATA.dashboard.monthlyRevenue;

      const kpis = {
        totalCustomers,
        totalAccounts,
        totalDeposits,
        totalLoans,
        dailyTransactions,
        monthlyRevenue,
        recentTransactions: recentTransactions.map(tx => ({
          ...tx,
          customer_name: tx.customer_name || `Customer ${tx.customer_id || 'Unknown'}`,
          type: tx.transaction_type || 'UNKNOWN',
          amount: parseFloat(tx.amount) || 0
        })),
        // Additional metrics
        metrics: {
          depositsGrowth: '+15.3%',
          loansGrowth: '+22.1%',
          transactionsGrowth: '-2.4%',
          revenueGrowth: '+18.7%'
        }
      };

      return formatApiResponse(kpis);

    } catch (error) {
      console.error('Dashboard KPIs error:', error);
      
      // Log specific errors for debugging
      results?.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Query ${index} failed:`, result.reason);
        }
      });

      // Return mock data as fallback
      return formatApiResponse(MOCK_DATA.dashboard);
    }
  }

  /**
   * Get recent transactions with enhanced error handling
   */
  static async getRecentTransactions(limit = 10) {
    try {
      if (!isSupabaseConfigured) {
        return formatApiResponse(MOCK_DATA.dashboard.recentTransactions.slice(0, limit));
      }

      const { data, error } = await supabaseBanking
        .from(getTableNameOnly(TABLES.TRANSACTIONS))
        .select(`
          id,
          customer_id,
          amount,
          transaction_type,
          status,
          transaction_datetime,
          description
        `)
        .order('transaction_datetime', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Recent transactions query failed, using mock data:', error);
        return formatApiResponse(MOCK_DATA.dashboard.recentTransactions.slice(0, limit));
      }

      const formattedTransactions = data?.map(tx => ({
        ...tx,
        customer_name: tx.customer_name || `Customer ${tx.customer_id || 'Unknown'}`,
        type: tx.transaction_type || 'UNKNOWN',
        amount: parseFloat(tx.amount) || 0,
        formatted_amount: new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR'
        }).format(parseFloat(tx.amount) || 0)
      })) || [];

      return formatApiResponse(formattedTransactions);

    } catch (error) {
      console.error('Recent transactions error:', error);
      return formatApiResponse(MOCK_DATA.dashboard.recentTransactions.slice(0, limit));
    }
  }

  /**
   * Get customer analytics with fallback
   */
  static async getCustomerAnalytics() {
    try {
      if (!isSupabaseConfigured) {
        return formatApiResponse({
          totalCustomers: MOCK_DATA.dashboard.totalCustomers,
          activeCustomers: Math.floor(MOCK_DATA.dashboard.totalCustomers * 0.85),
          newCustomersThisMonth: 234,
          customerGrowthRate: '+12.5%'
        });
      }

      const results = await Promise.allSettled([
        // Total customers
        supabaseBanking
          .from(getTableNameOnly(TABLES.CUSTOMERS))
          .select('*', { count: 'exact', head: true }),

        // Active customers
        supabaseBanking
          .from(getTableNameOnly(TABLES.CUSTOMERS))
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),

        // New customers this month
        supabaseBanking
          .from(getTableNameOnly(TABLES.CUSTOMERS))
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      const [totalResult, activeResult, newResult] = results;

      const analytics = {
        totalCustomers: totalResult.status === 'fulfilled' ? totalResult.value.count || 0 : MOCK_DATA.dashboard.totalCustomers,
        activeCustomers: activeResult.status === 'fulfilled' ? activeResult.value.count || 0 : Math.floor(MOCK_DATA.dashboard.totalCustomers * 0.85),
        newCustomersThisMonth: newResult.status === 'fulfilled' ? newResult.value.count || 0 : 234,
        customerGrowthRate: '+12.5%' // Would be calculated based on historical data
      };

      return formatApiResponse(analytics);

    } catch (error) {
      console.error('Customer analytics error:', error);
      return formatApiResponse({
        totalCustomers: MOCK_DATA.dashboard.totalCustomers,
        activeCustomers: Math.floor(MOCK_DATA.dashboard.totalCustomers * 0.85),
        newCustomersThisMonth: 234,
        customerGrowthRate: '+12.5%'
      });
    }
  }

  /**
   * Get account summary with fallback
   */
  static async getAccountSummary() {
    try {
      if (!isSupabaseConfigured) {
        return formatApiResponse({
          totalAccounts: MOCK_DATA.dashboard.totalAccounts,
          activeAccounts: Math.floor(MOCK_DATA.dashboard.totalAccounts * 0.92),
          totalDeposits: MOCK_DATA.dashboard.totalDeposits,
          averageBalance: MOCK_DATA.dashboard.totalDeposits / MOCK_DATA.dashboard.totalAccounts
        });
      }

      const results = await Promise.allSettled([
        // Total accounts
        supabaseBanking
          .from(getTableNameOnly(TABLES.ACCOUNTS))
          .select('*', { count: 'exact', head: true }),

        // Active accounts
        supabaseBanking
          .from(getTableNameOnly(TABLES.ACCOUNTS))
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'ACTIVE'),

        // Account balances
        supabaseBanking
          .from(getTableNameOnly(TABLES.ACCOUNTS))
          .select('current_balance')
          .eq('account_status', 'ACTIVE')
      ]);

      const [totalResult, activeResult, balancesResult] = results;

      const balances = balancesResult.status === 'fulfilled' ? balancesResult.value.data || [] : [];
      const totalDeposits = balances.reduce((sum, acc) => sum + (parseFloat(acc.current_balance) || 0), 0);
      const totalAccounts = totalResult.status === 'fulfilled' ? totalResult.value.count || 0 : MOCK_DATA.dashboard.totalAccounts;

      const summary = {
        totalAccounts,
        activeAccounts: activeResult.status === 'fulfilled' ? activeResult.value.count || 0 : Math.floor(totalAccounts * 0.92),
        totalDeposits: totalDeposits || MOCK_DATA.dashboard.totalDeposits,
        averageBalance: totalAccounts > 0 ? totalDeposits / totalAccounts : 0
      };

      return formatApiResponse(summary);

    } catch (error) {
      console.error('Account summary error:', error);
      return formatApiResponse({
        totalAccounts: MOCK_DATA.dashboard.totalAccounts,
        activeAccounts: Math.floor(MOCK_DATA.dashboard.totalAccounts * 0.92),
        totalDeposits: MOCK_DATA.dashboard.totalDeposits,
        averageBalance: MOCK_DATA.dashboard.totalDeposits / MOCK_DATA.dashboard.totalAccounts
      });
    }
  }

  /**
   * Get loan portfolio summary with fallback
   */
  static async getLoanPortfolio() {
    try {
      if (!isSupabaseConfigured) {
        return formatApiResponse({
          totalLoans: MOCK_DATA.dashboard.totalLoans,
          activeLoans: 1245,
          totalOutstanding: MOCK_DATA.dashboard.totalLoans,
          averageLoanSize: MOCK_DATA.dashboard.totalLoans / 1245
        });
      }

      const results = await Promise.allSettled([
        // Total loan accounts
        supabaseBanking
          .from(getTableNameOnly(TABLES.LOAN_ACCOUNTS))
          .select('*', { count: 'exact', head: true }),

        // Active loans
        supabaseBanking
          .from(getTableNameOnly(TABLES.LOAN_ACCOUNTS))
          .select('*', { count: 'exact', head: true })
          .in('loan_status', ['ACTIVE', 'DISBURSED']),

        // Outstanding balances
        supabaseBanking
          .from(getTableNameOnly(TABLES.LOAN_ACCOUNTS))
          .select('outstanding_balance')
          .in('loan_status', ['ACTIVE', 'DISBURSED'])
      ]);

      const [totalResult, activeResult, balancesResult] = results;

      const balances = balancesResult.status === 'fulfilled' ? balancesResult.value.data || [] : [];
      const totalOutstanding = balances.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0);
      const activeLoans = activeResult.status === 'fulfilled' ? activeResult.value.count || 0 : 1245;

      const portfolio = {
        totalLoans: totalResult.status === 'fulfilled' ? totalResult.value.count || 0 : activeLoans,
        activeLoans,
        totalOutstanding: totalOutstanding || MOCK_DATA.dashboard.totalLoans,
        averageLoanSize: activeLoans > 0 ? totalOutstanding / activeLoans : 0
      };

      return formatApiResponse(portfolio);

    } catch (error) {
      console.error('Loan portfolio error:', error);
      return formatApiResponse({
        totalLoans: MOCK_DATA.dashboard.totalLoans,
        activeLoans: 1245,
        totalOutstanding: MOCK_DATA.dashboard.totalLoans,
        averageLoanSize: MOCK_DATA.dashboard.totalLoans / 1245
      });
    }
  }
}

