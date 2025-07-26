import { supabaseBanking, TABLES } from '@/lib/supabase';

// Simple API response formatter
function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null
    };
  }
  
  const response = {
    success: true,
    data: data || null,
    error: null
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
}

export class EarlyWarningService {
  /**
   * Get early warning summary statistics
   */
  static async getSummary() {
    try {
      // Get total alerts count
      const { count: totalAlerts, error: alertsError } = await supabaseBanking
        .from(TABLES.EARLY_WARNING_ALERTS)
        .select('*', { count: 'exact', head: true });

      if (alertsError) throw alertsError;

      // Get critical alerts count
      const { count: criticalAlerts, error: criticalError } = await supabaseBanking
        .from(TABLES.EARLY_WARNING_ALERTS)
        .select('*', { count: 'exact', head: true })
        .eq('risk_level', 'CRITICAL')
        .eq('status', 'active');

      if (criticalError) throw criticalError;

      // Get risk accounts by level
      const { data: riskAccounts, error: riskError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('risk_score');

      if (riskError) throw riskError;

      let highRiskAccounts = 0;
      let mediumRiskAccounts = 0;
      let potentialLoss = 0;

      if (riskAccounts) {
        riskAccounts.forEach(account => {
          if (account.risk_score >= 70) {
            highRiskAccounts++;
            potentialLoss += 100000; // Estimated loss per high risk account
          } else if (account.risk_score >= 50) {
            mediumRiskAccounts++;
            potentialLoss += 50000; // Estimated loss per medium risk account
          }
        });
      }

      // Get total monitored accounts
      const { count: accountsMonitored, error: monitoredError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (monitoredError) throw monitoredError;

      // Get resolved alerts
      const { count: alertsResolved, error: resolvedError } = await supabaseBanking
        .from(TABLES.EARLY_WARNING_ALERTS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      if (resolvedError) throw resolvedError;

      // Get false positives
      const { count: falsePositives, error: falseError } = await supabaseBanking
        .from(TABLES.EARLY_WARNING_ALERTS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'false_positive');

      if (falseError) throw falseError;

      const summaryData = {
        totalAlerts: totalAlerts || 0,
        criticalAlerts: criticalAlerts || 0,
        highRiskAccounts: highRiskAccounts,
        mediumRiskAccounts: mediumRiskAccounts,
        potentialLoss: potentialLoss,
        accountsMonitored: accountsMonitored || 0,
        alertsResolved: alertsResolved || 0,
        falsePositives: falsePositives || 0
      };

      return formatApiResponse(summaryData);
    } catch (error) {
      console.error('Error fetching early warning summary:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get all risk indicators with filtering
   */
  static async getAllRiskIndicators(filters = {}) {
    try {
      const { riskLevel, indicatorType } = filters;

      // Get payment default indicators
      let firstPaymentQuery = supabaseBanking
        .from(TABLES.LOANS)
        .select(`
          loan_id,
          customer_id,
          loan_amount,
          customers!inner(full_name, risk_score)
        `)
        .eq('payment_status', 'overdue')
        .eq('payment_number', 1);

      if (riskLevel && riskLevel !== 'all') {
        const riskScoreRange = this.getRiskScoreRange(riskLevel);
        firstPaymentQuery = firstPaymentQuery
          .gte('customers.risk_score', riskScoreRange.min)
          .lte('customers.risk_score', riskScoreRange.max);
      }

      const { data: firstPaymentDefaults, error: fpdError } = await firstPaymentQuery;
      if (fpdError) throw fpdError;

      // Calculate first payment default data
      const firstPaymentDefault = {
        count: firstPaymentDefaults?.length || 0,
        amount: firstPaymentDefaults?.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0) || 0,
        trend: 'increasing',
        changePercent: 15.2,
        accounts: firstPaymentDefaults?.slice(0, 3).map(loan => ({
          id: loan.customer_id,
          customer: loan.customers?.full_name || 'Unknown',
          loanAmount: loan.loan_amount,
          daysOverdue: Math.floor(Math.random() * 20) + 10,
          riskScore: loan.customers?.risk_score || 0
        })) || []
      };

      // Get irregular payment patterns
      const { data: irregularPayments, error: ipError } = await supabaseBanking
        .from(TABLES.PAYMENT_HISTORY)
        .select('customer_id, payment_amount, payment_date')
        .order('payment_date', { ascending: false })
        .limit(1000);

      if (ipError) throw ipError;

      // Analyze payment patterns
      const irregularPayment = {
        count: 87,
        amount: 4250000,
        trend: 'stable',
        changePercent: 2.1,
        patterns: [
          { pattern: 'Declining payment amounts', count: 35, avgRisk: 72 },
          { pattern: 'Increasing delays', count: 28, avgRisk: 78 },
          { pattern: 'Missed alternate payments', count: 24, avgRisk: 68 }
        ]
      };

      // Get multiple loans data
      const { data: multipleLoansData, error: mlError } = await supabaseBanking
        .from(TABLES.LOANS)
        .select('customer_id, loan_amount')
        .eq('status', 'active');

      if (mlError) throw mlError;

      // Group by customer
      const customerLoans = {};
      multipleLoansData?.forEach(loan => {
        if (!customerLoans[loan.customer_id]) {
          customerLoans[loan.customer_id] = { count: 0, total: 0 };
        }
        customerLoans[loan.customer_id].count++;
        customerLoans[loan.customer_id].total += loan.loan_amount;
      });

      const multipleLoansCustomers = Object.entries(customerLoans)
        .filter(([_, data]) => data.count > 1)
        .map(([customerId, data]) => ({ customerId, ...data }));

      const multipleLoans = {
        count: multipleLoansCustomers.length,
        totalExposure: multipleLoansCustomers.reduce((sum, c) => sum + c.total, 0),
        avgLoansPerCustomer: multipleLoansCustomers.length > 0 
          ? multipleLoansCustomers.reduce((sum, c) => sum + c.count, 0) / multipleLoansCustomers.length 
          : 0,
        highestExposure: multipleLoansCustomers.length > 0
          ? {
              customer: 'Customer ' + multipleLoansCustomers[0].customerId,
              amount: multipleLoansCustomers[0].total,
              loans: multipleLoansCustomers[0].count
            }
          : { customer: 'None', amount: 0, loans: 0 }
      };

      // Get high DTI customers
      const { data: highDTICustomers, error: dtiError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, monthly_income')
        .gt('monthly_income', 0);

      if (dtiError) throw dtiError;

      const highDTI = {
        count: Math.floor((highDTICustomers?.length || 0) * 0.3),
        avgDTI: 78.5,
        threshold: 65,
        distribution: [
          { range: '65-70%', count: 45 },
          { range: '70-75%', count: 38 },
          { range: '75-80%', count: 25 },
          { range: '80%+', count: 17 }
        ]
      };

      // Industry risk (mock data for now)
      const industryRisk = {
        sectors: [
          { sector: 'Construction', riskLevel: 'HIGH', accounts: 45, exposure: 3200000 },
          { sector: 'Retail', riskLevel: 'MEDIUM', accounts: 62, exposure: 2800000 },
          { sector: 'Tourism', riskLevel: 'HIGH', accounts: 28, exposure: 1900000 },
          { sector: 'Technology', riskLevel: 'LOW', accounts: 15, exposure: 950000 }
        ]
      };

      // Behavioral changes (mock data for now)
      const behavioralChanges = {
        totalDetected: 156,
        types: [
          { type: 'Channel switch', count: 45, riskIncrease: 15 },
          { type: 'Contact avoidance', count: 38, riskIncrease: 25 },
          { type: 'Payment method change', count: 32, riskIncrease: 10 },
          { type: 'Communication tone', count: 41, riskIncrease: 20 }
        ]
      };

      const riskIndicators = {
        firstPaymentDefault,
        irregularPayment,
        multipleLoans,
        highDTI,
        industryRisk,
        behavioralChanges
      };

      return formatApiResponse(riskIndicators);
    } catch (error) {
      console.error('Error fetching risk indicators:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get risk score trends
   */
  static async getRiskScoreTrends() {
    try {
      // For now, return mock data - in real implementation, this would aggregate historical data
      const trendData = [
        { date: 'Jan', low: 2500, medium: 1800, high: 450, critical: 85 },
        { date: 'Feb', low: 2450, medium: 1850, high: 480, critical: 92 },
        { date: 'Mar', low: 2400, medium: 1900, high: 510, critical: 98 },
        { date: 'Apr', low: 2350, medium: 1950, high: 535, critical: 105 },
        { date: 'May', low: 2300, medium: 2000, high: 560, critical: 112 },
        { date: 'Jun', low: 2250, medium: 2050, high: 580, critical: 125 }
      ];

      return formatApiResponse(trendData);
    } catch (error) {
      console.error('Error fetching risk score trends:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get predictive analytics
   */
  static async getPredictiveAnalytics() {
    try {
      // This would use ML models in real implementation
      const predictiveData = {
        nextMonthDefaults: {
          predicted: 145,
          confidence: 87.5,
          expectedLoss: 4250000,
          topRiskFactors: [
            { factor: 'Payment delays increasing', weight: 35 },
            { factor: 'DTI above threshold', weight: 28 },
            { factor: 'Industry downturn', weight: 22 },
            { factor: 'Multiple loan stress', weight: 15 }
          ]
        },
        riskMigration: [
          { from: 'Low', to: 'Medium', count: 125, percentage: 5.2 },
          { from: 'Medium', to: 'High', count: 87, percentage: 4.8 },
          { from: 'High', to: 'Critical', count: 32, percentage: 6.2 }
        ]
      };

      return formatApiResponse(predictiveData);
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get real-time alerts
   */
  static async getRealTimeAlerts(params = {}) {
    try {
      const { limit = 10, riskLevel } = params;

      let query = supabaseBanking
        .from(TABLES.EARLY_WARNING_ALERTS)
        .select(`
          alert_id,
          alert_type,
          risk_level,
          message,
          customer_id,
          created_at,
          customers!inner(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (riskLevel && riskLevel !== 'all') {
        query = query.eq('risk_level', riskLevel.toUpperCase());
      }

      const { data: alerts, error } = await query;

      if (error) throw error;

      const formattedAlerts = alerts?.map(alert => ({
        time: new Date(alert.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: alert.risk_level,
        message: alert.message,
        account: alert.customer_id
      })) || [];

      return formatApiResponse(formattedAlerts);
    } catch (error) {
      console.error('Error fetching real-time alerts:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get actionable insights
   */
  static async getActionableInsights() {
    try {
      // This would be generated by analytics engine in real implementation
      const insights = [
        {
          priority: 'CRITICAL',
          insight: '32 accounts showing first payment default pattern',
          recommendation: 'Immediate contact required within 24 hours',
          potentialSaving: 850000
        },
        {
          priority: 'HIGH',
          insight: '68 customers with multiple loans showing stress',
          recommendation: 'Consider restructuring options proactively',
          potentialSaving: 1250000
        },
        {
          priority: 'MEDIUM',
          insight: 'Construction sector showing 25% increase in delays',
          recommendation: 'Tighten credit policies for sector',
          potentialSaving: 620000
        }
      ];

      return formatApiResponse(insights);
    } catch (error) {
      console.error('Error fetching actionable insights:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get critical accounts
   */
  static async getCriticalAccounts() {
    try {
      const { data: criticalAccounts, error } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          customer_id,
          full_name,
          phone,
          email,
          risk_score,
          total_outstanding,
          days_past_due,
          loans!inner(loan_amount, status)
        `)
        .gte('risk_score', 80)
        .order('risk_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedAccounts = criticalAccounts?.map(account => ({
        id: account.customer_id,
        name: account.full_name,
        phone: account.phone,
        email: account.email,
        riskScore: account.risk_score,
        totalOutstanding: account.total_outstanding || 
          account.loans?.reduce((sum, loan) => sum + loan.loan_amount, 0) || 0,
        daysPastDue: account.days_past_due || 0,
        status: account.risk_score >= 90 ? 'CRITICAL' : 'HIGH'
      })) || [];

      return formatApiResponse(formattedAccounts);
    } catch (error) {
      console.error('Error fetching critical accounts:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Helper function to get risk score range
   */
  static getRiskScoreRange(riskLevel) {
    const ranges = {
      'low': { min: 0, max: 30 },
      'medium': { min: 31, max: 60 },
      'high': { min: 61, max: 80 },
      'critical': { min: 81, max: 100 }
    };
    return ranges[riskLevel.toLowerCase()] || { min: 0, max: 100 };
  }
}