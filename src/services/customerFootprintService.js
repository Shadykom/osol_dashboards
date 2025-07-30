import { supabaseBanking, TABLES } from '@/lib/supabase';
import { format, parseISO, subMonths, differenceInDays } from 'date-fns';

/**
 * Customer Footprint Service
 * Provides comprehensive customer data analysis including:
 * - Customer profile and demographics
 * - Product portfolio analysis
 * - Interaction history and preferences
 * - Payment behavior analysis
 * - Risk assessment and predictions
 * - Engagement metrics
 */
export class CustomerFootprintService {
  
  /**
   * Search for customers by various criteria
   */
  static async searchCustomers(query, filters = {}) {
    try {
      let queryBuilder = supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          customer_id,
          full_name,
          national_id,
          email,
          phone_number,
          customer_type,
          risk_category,
          created_at,
          branch:branches(branch_id, branch_name, city)
        `)
        .limit(10);

      // Apply search query
      if (query && query.trim()) {
        queryBuilder = queryBuilder.or(`
          full_name.ilike.%${query}%,
          national_id.ilike.%${query}%,
          phone_number.ilike.%${query}%,
          email.ilike.%${query}%
        `);
      }

      // Apply filters
      if (filters.branch && filters.branch !== 'all') {
        queryBuilder = queryBuilder.eq('branch_id', filters.branch);
      }
      
      if (filters.riskCategory && filters.riskCategory !== 'all') {
        queryBuilder = queryBuilder.eq('risk_category', filters.riskCategory);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get comprehensive customer footprint data
   */
  static async getCustomerFootprint(customerId, filters = {}) {
    try {
      // Get customer profile
      const profile = await this.getCustomerProfile(customerId);
      if (!profile.success) {
        throw new Error(profile.error);
      }

      // Get all related data in parallel
      const [
        products,
        interactions,
        paymentBehavior,
        collectionHistory,
        transactionPatterns,
        riskProfile,
        engagementMetrics
      ] = await Promise.all([
        this.getCustomerProducts(customerId),
        this.getCustomerInteractions(customerId, filters),
        this.getPaymentBehavior(customerId),
        this.getCollectionHistory(customerId),
        this.getTransactionPatterns(customerId),
        this.getRiskProfile(customerId),
        this.getEngagementMetrics(customerId)
      ]);

      return {
        success: true,
        data: {
          profile: profile.data,
          products: products.data || [],
          interactions: interactions.data || {},
          payment_behavior: paymentBehavior.data || {},
          collection_history: collectionHistory.data || {},
          transaction_patterns: transactionPatterns.data || {},
          risk_profile: riskProfile.data || {},
          engagement_metrics: engagementMetrics.data || {}
        }
      };
    } catch (error) {
      console.error('Error getting customer footprint:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get customer profile with relationship manager info
   */
  static async getCustomerProfile(customerId) {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          branch:branches(branch_id, branch_name, city, region),
          relationship_manager:collection_officers(officer_id, full_name, phone_number, email)
        `)
        .eq('customer_id', customerId)
        .single();

      if (error) throw error;

      // Calculate additional metrics
      const customerSinceDays = differenceInDays(new Date(), parseISO(data.created_at));
      
      // Get total relationship value from accounts and loans
      const { data: accountsData } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('customer_id', customerId);

      const { data: loansData } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('original_amount, outstanding_balance')
        .eq('customer_id', customerId);

      const totalAccountBalance = accountsData?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const totalLoanAmount = loansData?.reduce((sum, loan) => sum + (loan.original_amount || 0), 0) || 0;
      const totalRelationshipValue = totalAccountBalance + totalLoanAmount;

      // Calculate lifetime value (simplified)
      const lifetimeValue = totalRelationshipValue * 1.5; // Estimation factor

      // Get loyalty score (simplified calculation)
      const loyaltyScore = Math.min(95, Math.max(50, 
        60 + (customerSinceDays / 365) * 10 + (totalRelationshipValue / 100000) * 5
      ));

      // Calculate churn probability (simplified)
      const churnProbability = Math.max(5, Math.min(25, 
        20 - (loyaltyScore - 50) / 10
      ));

      return {
        success: true,
        data: {
          ...data,
          customer_since_days: customerSinceDays,
          total_relationship_value: totalRelationshipValue,
          lifetime_value: lifetimeValue,
          loyalty_score: Math.round(loyaltyScore),
          churn_probability: Math.round(churnProbability)
        }
      };
    } catch (error) {
      console.error('Error getting customer profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get customer products (accounts, loans, cards)
   */
  static async getCustomerProducts(customerId) {
    try {
      // Get accounts
      const { data: accounts } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_number,
          account_type,
          current_balance,
          account_status,
          created_at,
          product:products(product_name, category)
        `)
        .eq('customer_id', customerId);

      // Get loans
      const { data: loans } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_account_number,
          loan_type,
          original_amount,
          outstanding_balance,
          interest_rate,
          monthly_installment,
          loan_status,
          disbursement_date,
          maturity_date,
          next_payment_date,
          days_past_due,
          product:products(product_name, category)
        `)
        .eq('customer_id', customerId);

      // Format products data
      const products = [];

      // Add accounts
      if (accounts) {
        accounts.forEach(account => {
          products.push({
            id: account.account_number,
            type: 'حساب جاري',
            product_name: account.product?.product_name || account.account_type,
            balance: account.current_balance,
            status: account.account_status,
            start_date: account.created_at,
            avg_monthly_balance: account.current_balance * 1.2, // Estimation
            transactions_count: Math.floor(Math.random() * 100) + 50 // Mock data
          });
        });
      }

      // Add loans
      if (loans) {
        loans.forEach(loan => {
          products.push({
            id: loan.loan_account_number,
            type: 'قرض تورق',
            product_name: loan.product?.product_name || loan.loan_type,
            amount: loan.original_amount,
            outstanding: loan.outstanding_balance,
            status: loan.loan_status,
            start_date: loan.disbursement_date,
            maturity_date: loan.maturity_date,
            interest_rate: loan.interest_rate,
            monthly_payment: loan.monthly_installment,
            dpd: loan.days_past_due || 0,
            next_payment_date: loan.next_payment_date
          });
        });
      }

      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Error getting customer products:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get customer interactions history
   */
  static async getCustomerInteractions(customerId, filters = {}) {
    try {
      const { data: interactions } = await supabaseBanking
        .from(TABLES.COLLECTION_INTERACTIONS)
        .select(`
          interaction_id,
          interaction_date,
          interaction_type,
          channel,
          officer:collection_officers(full_name),
          department,
          purpose,
          duration_minutes,
          outcome,
          satisfaction_score,
          notes
        `)
        .eq('customer_id', customerId)
        .order('interaction_date', { ascending: false })
        .limit(50);

      // Calculate summary metrics
      const summary = {
        total: interactions?.length || 0,
        calls: interactions?.filter(i => i.interaction_type === 'Call').length || 0,
        emails: interactions?.filter(i => i.interaction_type === 'Email').length || 0,
        sms: interactions?.filter(i => i.interaction_type === 'SMS').length || 0,
        branch_visits: interactions?.filter(i => i.interaction_type === 'Visit').length || 0,
        digital_logins: Math.floor(Math.random() * 500) + 300, // Mock data
        last_contact: interactions?.[0]?.interaction_date || null,
        preferred_channel: 'Phone' // Could be calculated from most frequent channel
      };

      // Generate timeline data (last 12 months)
      const timeline = this.generateInteractionTimeline();

      // Format recent interactions
      const recent = (interactions || []).slice(0, 10).map(interaction => ({
        id: interaction.interaction_id,
        date: interaction.interaction_date,
        type: interaction.interaction_type,
        channel: interaction.channel,
        officer: interaction.officer?.full_name || 'Unknown',
        department: interaction.department || 'Customer Service',
        purpose: interaction.purpose || 'General Inquiry',
        duration: interaction.duration_minutes ? `${interaction.duration_minutes}:00` : null,
        outcome: interaction.outcome || 'Completed',
        satisfaction: interaction.satisfaction_score
      }));

      return {
        success: true,
        data: {
          summary,
          recent,
          timeline
        }
      };
    } catch (error) {
      console.error('Error getting customer interactions:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get payment behavior analysis
   */
  static async getPaymentBehavior(customerId) {
    try {
      // Get loan payment history from transactions
      const { data: payments } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_date,
          amount,
          transaction_type,
          status,
          loan_account:loan_accounts(monthly_installment, days_past_due)
        `)
        .eq('customer_id', customerId)
        .eq('transaction_type', 'LOAN_PAYMENT')
        .order('transaction_date', { ascending: false })
        .limit(100);

      let onTimePayments = 0;
      let latePayments = 0;
      let missedPayments = 0;
      let totalDaysLate = 0;

      // Analyze payment patterns
      if (payments) {
        payments.forEach(payment => {
          if (payment.status === 'COMPLETED') {
            const dpd = payment.loan_account?.days_past_due || 0;
            if (dpd === 0) {
              onTimePayments++;
            } else if (dpd > 0) {
              latePayments++;
              totalDaysLate += dpd;
            }
          } else if (payment.status === 'FAILED') {
            missedPayments++;
          }
        });
      }

      const avgDaysLate = latePayments > 0 ? totalDaysLate / latePayments : 0;
      const totalPayments = onTimePayments + latePayments + missedPayments;
      const paymentScore = totalPayments > 0 
        ? Math.round(((onTimePayments / totalPayments) * 100))
        : 95;

      // Generate monthly trend
      const monthlyTrend = this.generatePaymentTrend();

      return {
        success: true,
        data: {
          on_time_payments: onTimePayments,
          late_payments: latePayments,
          missed_payments: missedPayments,
          avg_days_late: Math.round(avgDaysLate * 10) / 10,
          payment_score: paymentScore,
          preferred_payment_method: 'Online Banking',
          payment_pattern: 'Consistent',
          risk_indicators: latePayments > 5 ? ['Multiple Late Payments'] : [],
          monthly_trend: monthlyTrend
        }
      };
    } catch (error) {
      console.error('Error getting payment behavior:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get collection history
   */
  static async getCollectionHistory(customerId) {
    try {
      const { data: cases } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          case_id,
          case_status,
          amount_due,
          amount_collected,
          created_at,
          resolved_at,
          promise_to_pay:promise_to_pay(amount, promise_date, status)
        `)
        .eq('customer_id', customerId);

      const totalCases = cases?.length || 0;
      const activeCases = cases?.filter(c => c.case_status === 'ACTIVE').length || 0;
      const resolvedCases = cases?.filter(c => c.case_status === 'RESOLVED').length || 0;
      const totalCollected = cases?.reduce((sum, c) => sum + (c.amount_collected || 0), 0) || 0;

      // Count promise to pay statistics
      const allPromises = cases?.flatMap(c => c.promise_to_pay || []) || [];
      const promisesKept = allPromises.filter(p => p.status === 'KEPT').length;
      const promisesBroken = allPromises.filter(p => p.status === 'BROKEN').length;

      // Calculate average resolution days
      const resolvedWithDates = cases?.filter(c => c.resolved_at && c.created_at) || [];
      const avgResolutionDays = resolvedWithDates.length > 0
        ? Math.round(resolvedWithDates.reduce((sum, c) => {
            return sum + differenceInDays(parseISO(c.resolved_at), parseISO(c.created_at));
          }, 0) / resolvedWithDates.length)
        : 0;

      const lastCollectionDate = cases?.filter(c => c.resolved_at)
        .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))?.[0]?.resolved_at;

      return {
        success: true,
        data: {
          total_cases: totalCases,
          active_cases: activeCases,
          resolved_cases: resolvedCases,
          total_collected: totalCollected,
          promises_kept: promisesKept,
          promises_broken: promisesBroken,
          avg_resolution_days: avgResolutionDays,
          last_collection_date: lastCollectionDate
        }
      };
    } catch (error) {
      console.error('Error getting collection history:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get transaction patterns analysis
   */
  static async getTransactionPatterns(customerId) {
    try {
      const { data: transactions } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_date,
          amount,
          transaction_type,
          description,
          channel
        `)
        .eq('customer_id', customerId)
        .gte('transaction_date', subMonths(new Date(), 12).toISOString())
        .order('transaction_date', { ascending: false })
        .limit(1000);

      const avgMonthlyTransactions = transactions?.length ? Math.round(transactions.length / 12) : 0;
      const avgTransactionAmount = transactions?.length 
        ? Math.round(transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length)
        : 0;

      // Mock category analysis (would need merchant category codes in real implementation)
      const topCategories = [
        { category: 'Groceries', percentage: 25, amount: 12500 },
        { category: 'Fuel', percentage: 20, amount: 10000 },
        { category: 'Restaurants', percentage: 15, amount: 7500 },
        { category: 'Shopping', percentage: 18, amount: 9000 },
        { category: 'Bills', percentage: 22, amount: 11000 }
      ];

      const monthlySpending = this.generateSpendingTrend();

      return {
        success: true,
        data: {
          avg_monthly_transactions: avgMonthlyTransactions,
          avg_transaction_amount: avgTransactionAmount,
          preferred_transaction_time: 'Evening',
          preferred_transaction_day: 'Thursday',
          top_categories: topCategories,
          monthly_spending: monthlySpending
        }
      };
    } catch (error) {
      console.error('Error getting transaction patterns:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get risk profile and predictions
   */
  static async getRiskProfile(customerId) {
    try {
      const { data: customer } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('risk_score, risk_category')
        .eq('customer_id', customerId)
        .single();

      const currentScore = customer?.risk_score || 750;
      const riskCategory = customer?.risk_category || 'Low';

      // Mock risk factors analysis
      const factors = [
        { factor: 'Payment History', impact: 35, status: 'Positive' },
        { factor: 'Credit Utilization', impact: 30, status: 'Positive' },
        { factor: 'Account Age', impact: 15, status: 'Positive' },
        { factor: 'Credit Mix', impact: 10, status: 'Neutral' },
        { factor: 'New Credit', impact: 10, status: 'Positive' }
      ];

      // Calculate predictions based on score
      const defaultProbability = Math.max(1, Math.min(15, (850 - currentScore) / 50));
      const churnProbability = Math.max(5, Math.min(30, (800 - currentScore) / 30));
      const upsellProbability = Math.max(30, Math.min(90, currentScore / 10));

      return {
        success: true,
        data: {
          current_score: currentScore,
          trend: currentScore > 700 ? 'Improving' : 'Declining',
          factors: factors,
          predictions: {
            default_probability: Math.round(defaultProbability * 10) / 10,
            churn_probability: Math.round(churnProbability),
            upsell_probability: Math.round(upsellProbability),
            risk_category_change: 'Stable'
          }
        }
      };
    } catch (error) {
      console.error('Error getting risk profile:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(customerId) {
    try {
      // Mock engagement data (would be calculated from various touchpoints)
      return {
        success: true,
        data: {
          digital_adoption: 85,
          mobile_app_usage: 'High',
          email_open_rate: 72,
          sms_response_rate: 45,
          campaign_responsiveness: 'Medium',
          nps_score: 8,
          last_survey_date: '2024-05-15',
          preferences: {
            contact_time: 'Evening',
            contact_method: 'Phone',
            language: 'Arabic',
            product_interests: ['Investment', 'Insurance']
          }
        }
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Export customer report
   */
  static async exportReport(customerId, format) {
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        url: `customer_footprint_${customerId}.${format}`,
        filename: `customer_footprint_${customerId}.${format}`
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods for generating mock trend data
  static generateInteractionTimeline() {
    const timeline = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      timeline.push({
        month: format(date, 'MMM yyyy'),
        interactions: Math.floor(Math.random() * 20) + 5,
        calls: Math.floor(Math.random() * 8) + 2,
        emails: Math.floor(Math.random() * 5) + 1,
        digital: Math.floor(Math.random() * 15) + 10
      });
    }
    return timeline.reverse();
  }

  static generatePaymentTrend() {
    const trend = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trend.push({
        month: format(date, 'MMM yy'),
        onTime: Math.floor(Math.random() * 5) + 3,
        late: Math.random() > 0.7 ? 1 : 0,
        amount: Math.floor(Math.random() * 5000) + 8000
      });
    }
    return trend.reverse();
  }

  static generateSpendingTrend() {
    const trend = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trend.push({
        month: format(date, 'MMM'),
        spending: Math.floor(Math.random() * 20000) + 30000,
        transactions: Math.floor(Math.random() * 30) + 40
      });
    }
    return trend.reverse();
  }
}

export default CustomerFootprintService;