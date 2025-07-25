import { supabase, supabaseCollection, TABLES, formatApiResponse, handleSupabaseError } from '../lib/supabase.js';

/**
 * Comprehensive Collection Service - Complete collection management operations
 * Covers all aspects of collection management as per Osoul requirements
 */
export class CollectionService {

  // ============================================================================
  // EXECUTIVE DASHBOARD SERVICES
  // ============================================================================

  /**
   * Get executive dashboard metrics
   */
  static async getExecutiveDashboard(filters = {}) {
    try {
      const [
        portfolioHealth,
        npfTrend,
        bucketDistribution,
        top10Defaulters,
        branchPerformance,
        strategicInitiatives,
        riskIndicators
      ] = await Promise.all([
        this.getPortfolioHealthScore(),
        this.getNPFTrend(filters.period || 'monthly'),
        this.getBucketDistribution(),
        this.getTop10Defaulters(),
        this.getBranchPerformance(filters.period || 'monthly'),
        this.getStrategicInitiatives(),
        this.getRiskIndicators()
      ]);

      return formatApiResponse({
        portfolioHealth,
        npfTrend,
        bucketDistribution,
        top10Defaulters,
        branchPerformance,
        strategicInitiatives,
        riskIndicators
      });
    } catch (error) {
      console.error('Executive dashboard error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Calculate portfolio health score
   */
  static async getPortfolioHealthScore() {
    try {
      const components = await Promise.all([
        this.calculateCollectionEfficiency(),
        this.calculateRiskManagement(),
        this.calculateCustomerContact(),
        this.calculateDigitalAdoption(),
        this.calculateCompliance()
      ]);

      const weights = [30, 25, 20, 15, 10];
      const overallScore = components.reduce((sum, score, index) => 
        sum + (score * weights[index] / 100), 0
      );

      return {
        overall: Math.round(overallScore),
        components: [
          { name: 'Collection Efficiency', score: components[0], weight: weights[0] },
          { name: 'Risk Management', score: components[1], weight: weights[1] },
          { name: 'Customer Contact', score: components[2], weight: weights[2] },
          { name: 'Digital Adoption', score: components[3], weight: weights[3] },
          { name: 'Compliance', score: components[4], weight: weights[4] }
        ]
      };
    } catch (error) {
      console.error('Portfolio health score error:', error);
      return null;
    }
  }

  /**
   * Get NPF trend analysis
   */
  static async getNPFTrend(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('created_at, total_outstanding, days_past_due')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month and calculate NPF rate
      const monthlyData = {};
      data?.forEach(case_ => {
        const month = new Date(case_.created_at).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, npf: 0 };
        }
        monthlyData[month].total += parseFloat(case_.total_outstanding) || 0;
        if (case_.days_past_due > 90) {
          monthlyData[month].npf += parseFloat(case_.total_outstanding) || 0;
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        rate: data.total > 0 ? (data.npf / data.total * 100).toFixed(2) : 0,
        amount: data.npf
      }));
    } catch (error) {
      console.error('NPF trend error:', error);
      return [];
    }
  }

  /**
   * Get bucket distribution
   */
  static async getBucketDistribution() {
    try {
      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('days_past_due, total_outstanding')
        .eq('case_status', 'ACTIVE');

      if (error) throw error;

      const buckets = {
        'CURRENT': { count: 0, amount: 0 },
        'BUCKET_1': { count: 0, amount: 0 },
        'BUCKET_2': { count: 0, amount: 0 },
        'BUCKET_3': { count: 0, amount: 0 },
        'BUCKET_4': { count: 0, amount: 0 },
        'BUCKET_5': { count: 0, amount: 0 }
      };

      data?.forEach(case_ => {
        const bucket = this.getDPDBucket(case_.days_past_due);
        buckets[bucket].count++;
        buckets[bucket].amount += parseFloat(case_.total_outstanding) || 0;
      });

      return Object.entries(buckets).map(([bucket, data]) => ({
        bucket,
        count: data.count,
        amount: data.amount
      }));
    } catch (error) {
      console.error('Bucket distribution error:', error);
      return [];
    }
  }

  /**
   * Get top 10 defaulters
   */
  static async getTop10Defaulters() {
    try {
      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('customer_id, total_outstanding, days_past_due')
        .eq('case_status', 'ACTIVE')
        .order('total_outstanding', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Top 10 defaulters error:', error);
      return [];
    }
  }

  /**
   * Get branch performance
   */
  static async getBranchPerformance(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('branch_id, total_outstanding, amount_collected')
        .gte('created_at', dateFilter);

      if (error) throw error;

      // Group by branch
      const branchData = {};
      data?.forEach(case_ => {
        const branchId = case_.branch_id || 'UNKNOWN';
        if (!branchData[branchId]) {
          branchData[branchId] = { outstanding: 0, collected: 0 };
        }
        branchData[branchId].outstanding += parseFloat(case_.total_outstanding) || 0;
        branchData[branchId].collected += parseFloat(case_.amount_collected) || 0;
      });

      return Object.entries(branchData).map(([branchId, data]) => ({
        branchId,
        outstanding: data.outstanding,
        collected: data.collected,
        collectionRate: data.outstanding > 0 ? (data.collected / data.outstanding * 100).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('Branch performance error:', error);
      return [];
    }
  }

  /**
   * Get strategic initiatives status
   */
  static async getStrategicInitiatives() {
    // This would typically come from a project management table
    // For now, returning mock data
    return [
      { 
        name: 'Digital Collection Enhancement', 
        progress: 75, 
        impact: 'HIGH',
        status: 'ON_TRACK',
        target: 'Increase digital collections by 40%'
      },
      { 
        name: 'AI-Powered Risk Scoring', 
        progress: 60, 
        impact: 'MEDIUM',
        status: 'AT_RISK',
        target: 'Reduce default rate by 15%'
      },
      { 
        name: 'Field Force Optimization', 
        progress: 85, 
        impact: 'HIGH',
        status: 'ON_TRACK',
        target: 'Improve field collection efficiency by 30%'
      }
    ];
  }

  /**
   * Get key risk indicators
   */
  static async getRiskIndicators() {
    try {
      const [
        firstPaymentDefault,
        rollRate,
        contactRate,
        ptpKeepRate,
        legalSuccessRate
      ] = await Promise.all([
        this.calculateFirstPaymentDefaultRate(),
        this.calculateRollRate('30-60'),
        this.calculateContactRate(),
        this.calculatePTPKeepRate(),
        this.calculateLegalSuccessRate()
      ]);

      return [
        { indicator: 'First Payment Default Rate', value: firstPaymentDefault, threshold: 3.0 },
        { indicator: 'Roll Rate (30-60)', value: rollRate, threshold: 12.0 },
        { indicator: 'Customer Contact Rate', value: contactRate, threshold: 70.0 },
        { indicator: 'PTP Keep Rate', value: ptpKeepRate, threshold: 80.0 },
        { indicator: 'Legal Success Rate', value: legalSuccessRate, threshold: 50.0 }
      ].map(indicator => ({
        ...indicator,
        status: indicator.value <= indicator.threshold ? 'GOOD' : 
                indicator.value <= indicator.threshold * 1.2 ? 'WARNING' : 'CRITICAL'
      }));
    } catch (error) {
      console.error('Risk indicators error:', error);
      return [];
    }
  }

  // ============================================================================
  // DAILY COLLECTION DASHBOARD SERVICES
  // ============================================================================

  /**
   * Get real-time collection dashboard data
   */
  static async getDailyCollectionDashboard() {
    try {
      const [
        morningSnapshot,
        liveTracking,
        collectorActivity,
        hourlyTrend,
        queueStatus,
        criticalAlerts
      ] = await Promise.all([
        this.getMorningSnapshot(),
        this.getLiveTracking(),
        this.getCollectorActivity(),
        this.getHourlyCollectionTrend(),
        this.getQueueStatus(),
        this.getCriticalAlerts()
      ]);

      return formatApiResponse({
        morningSnapshot,
        liveTracking,
        collectorActivity,
        hourlyTrend,
        queueStatus,
        criticalAlerts,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Daily dashboard error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get morning snapshot metrics
   */
  static async getMorningSnapshot() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const [
        todayDue,
        ptpDueToday,
        fieldVisits,
        legalCases,
        yesterdayPerformance
      ] = await Promise.all([
        // Total due today
        supabaseCollection.from(TABLES.COLLECTION_CASE_DETAILS)
          .select('total_outstanding')
          .eq('case_status', 'ACTIVE'),

        // PTP due today
        supabaseCollection.from(TABLES.PROMISE_TO_PAY)
          .select('ptp_amount')
          .eq('ptp_date', today)
          .eq('status', 'ACTIVE'),

        // Field visits scheduled
        supabaseCollection.from(TABLES.FIELD_VISITS)
          .select('visit_id', { count: 'exact', head: true })
          .eq('visit_date', today),

        // Legal cases updates
        supabaseCollection.from(TABLES.LEGAL_CASES)
          .select('legal_case_id', { count: 'exact', head: true })
          .eq('next_hearing_date', today),

        // Yesterday's performance
        supabaseCollection.from(TABLES.DAILY_COLLECTION_SUMMARY)
          .select('total_due_amount, total_collected')
          .eq('summary_date', yesterday)
          .single()
      ]);

      const totalDueToday = todayDue.data?.reduce((sum, c) => 
        sum + parseFloat(c.total_outstanding), 0) || 0;
      
      const ptpDueTodayAmount = ptpDueToday.data?.reduce((sum, p) => 
        sum + parseFloat(p.ptp_amount), 0) || 0;

      return {
        totalDueToday,
        ptpDueToday: ptpDueTodayAmount,
        fieldVisitsScheduled: fieldVisits.count || 0,
        legalCasesUpdates: legalCases.count || 0,
        yesterdayCollection: yesterdayPerformance.data?.total_collected || 0,
        yesterdayTarget: yesterdayPerformance.data?.total_due_amount || 0,
        yesterdayAchievement: yesterdayPerformance.data?.total_due_amount > 0 ?
          ((yesterdayPerformance.data.total_collected / yesterdayPerformance.data.total_due_amount) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Morning snapshot error:', error);
      return {};
    }
  }

  /**
   * Get live tracking metrics (real-time)
   */
  static async getLiveTracking() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        collectors,
        payments,
        interactions,
        activeCalls
      ] = await Promise.all([
        // Collector status
        supabaseCollection.from(TABLES.COLLECTION_OFFICERS)
          .select('officer_id, status, last_active')
          .eq('status', 'ACTIVE'),

        // Today's payments
        supabase.from(TABLES.TRANSACTIONS)
          .select('amount, transaction_datetime')
          .gte('transaction_datetime', todayStart.toISOString())
          .eq('transaction_type', 'PAYMENT')
          .order('transaction_datetime', { ascending: false })
          .limit(10),

        // Today's interactions
        supabaseCollection.from(TABLES.COLLECTION_INTERACTIONS)
          .select('*')
          .gte('interaction_datetime', todayStart.toISOString()),

        // Active calls (mock for now)
        Promise.resolve({ data: [], count: 42 })
      ]);

      // Calculate collector statuses
      const collectorStatus = {
        online: 0,
        offline: 0,
        onBreak: 0
      };

      collectors.data?.forEach(collector => {
        const lastActive = new Date(collector.last_active);
        const minutesSinceActive = (now - lastActive) / 60000;
        
        if (minutesSinceActive < 5) collectorStatus.online++;
        else if (minutesSinceActive < 30) collectorStatus.onBreak++;
        else collectorStatus.offline++;
      });

      // Calculate metrics
      const totalPayments = payments.data?.reduce((sum, p) => 
        sum + parseFloat(p.amount), 0) || 0;
      
      const successfulContacts = interactions.data?.filter(i => 
        i.outcome === 'CONTACTED').length || 0;
      
      const ptpObtained = interactions.data?.filter(i => 
        i.promise_to_pay === true).length || 0;

      return {
        collectorsOnline: collectorStatus.online,
        collectorsOffline: collectorStatus.offline,
        collectorsOnBreak: collectorStatus.onBreak,
        totalCollectors: collectors.data?.length || 0,
        
        realTimePayments: totalPayments,
        paymentsCount: payments.data?.length || 0,
        failedAttempts: 0, // Would come from payment gateway
        
        contactSuccessRate: interactions.data?.length > 0 ?
          (successfulContacts / interactions.data.length * 100).toFixed(1) : 0,
        ptpObtained,
        ptpTarget: 180, // Would be calculated based on daily targets
        
        activeCalls: activeCalls.count || 0,
        avgCallDuration: '3:25',
        
        recentPayments: payments.data?.slice(0, 5).map(p => ({
          time: new Date(p.transaction_datetime).toLocaleTimeString(),
          customer: 'Customer Name', // Would join with customer table
          amount: p.amount,
          method: 'Online' // Would come from payment details
        })) || []
      };
    } catch (error) {
      console.error('Live tracking error:', error);
      return {};
    }
  }

  /**
   * Get collector activity
   */
  static async getCollectorActivity() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_OFFICERS)
        .select(`
          officer_id,
          officer_name,
          status,
          last_active,
          daily_target,
          daily_collected
        `)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      return data?.map(officer => ({
        ...officer,
        achievement: officer.daily_target > 0 ? 
          (officer.daily_collected / officer.daily_target * 100).toFixed(1) : 0,
        isActive: new Date(officer.last_active) > new Date(Date.now() - 300000) // 5 minutes
      })) || [];
    } catch (error) {
      console.error('Collector activity error:', error);
      return [];
    }
  }

  /**
   * Get hourly collection trend
   */
  static async getHourlyCollectionTrend() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('amount, transaction_datetime')
        .gte('transaction_datetime', today + 'T00:00:00Z')
        .lte('transaction_datetime', today + 'T23:59:59Z')
        .eq('transaction_type', 'PAYMENT');

      if (error) throw error;

      // Group by hour
      const hourlyData = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
      }

      data?.forEach(transaction => {
        const hour = new Date(transaction.transaction_datetime).getHours();
        hourlyData[hour] += parseFloat(transaction.amount) || 0;
      });

      return Object.entries(hourlyData).map(([hour, amount]) => ({
        hour: parseInt(hour),
        amount
      }));
    } catch (error) {
      console.error('Hourly collection trend error:', error);
      return [];
    }
  }

  /**
   * Get queue status
   */
  static async getQueueStatus() {
    try {
      const { data, error } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('case_status, priority_level')
        .eq('case_status', 'ACTIVE');

      if (error) throw error;

      const queueStats = {
        high: 0,
        medium: 0,
        low: 0,
        total: data?.length || 0
      };

      data?.forEach(case_ => {
        switch (case_.priority_level) {
          case 'HIGH':
            queueStats.high++;
            break;
          case 'MEDIUM':
            queueStats.medium++;
            break;
          default:
            queueStats.low++;
        }
      });

      return queueStats;
    } catch (error) {
      console.error('Queue status error:', error);
      return { high: 0, medium: 0, low: 0, total: 0 };
    }
  }

  /**
   * Get critical alerts
   */
  static async getCriticalAlerts() {
    try {
      const alerts = [];
      const today = new Date().toISOString().split('T')[0];

      // High value payments due
      const { data: highValueCases } = await supabaseCollection
        .from(TABLES.COLLECTION_CASE_DETAILS)
        .select('case_number, customer_id, total_outstanding')
        .gte('total_outstanding', 1000000)
        .eq('case_status', 'ACTIVE')
        .limit(3);

      highValueCases?.forEach(case_ => {
        alerts.push({
          type: 'HIGH_VALUE',
          message: `Large payment due: ${this.formatCurrency(case_.total_outstanding)} - Case ${case_.case_number}`,
          time: new Date().toLocaleTimeString()
        });
      });

      // Legal hearings today
      const { data: legalHearings } = await supabaseCollection
        .from(TABLES.LEGAL_CASES)
        .select('case_number, court_name, next_hearing_date')
        .eq('next_hearing_date', today)
        .limit(3);

      legalHearings?.forEach(legal => {
        alerts.push({
          type: 'LEGAL',
          message: `Court hearing today: ${legal.case_number} at ${legal.court_name}`,
          time: new Date(legal.next_hearing_date).toLocaleTimeString()
        });
      });

      // System alerts (would come from monitoring)
      if (Math.random() > 0.8) {
        alerts.push({
          type: 'SYSTEM',
          message: 'IVR system response slow - IT investigating',
          time: new Date().toLocaleTimeString()
        });
      }

      return alerts;
    } catch (error) {
      console.error('Critical alerts error:', error);
      return [];
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Format currency
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get DPD bucket
   */
  static getDPDBucket(dpd) {
    if (dpd <= 0) return 'CURRENT';
    if (dpd <= 30) return 'BUCKET_1';
    if (dpd <= 60) return 'BUCKET_2';
    if (dpd <= 90) return 'BUCKET_3';
    if (dpd <= 180) return 'BUCKET_4';
    return 'BUCKET_5';
  }

  /**
   * Calculate various efficiency metrics
   */
  static async calculateCollectionEfficiency() {
    // Implement collection efficiency calculation
    return 78; // Mock value
  }

  static async calculateRiskManagement() {
    // Implement risk management score calculation
    return 65; // Mock value
  }

  static async calculateCustomerContact() {
    // Implement customer contact score calculation
    return 82; // Mock value
  }

  static async calculateDigitalAdoption() {
    // Implement digital adoption score calculation
    return 70; // Mock value
  }

  static async calculateCompliance() {
    // Implement compliance score calculation
    return 68; // Mock value
  }

  /**
   * Calculate various rates
   */
  static async calculateFirstPaymentDefaultRate() {
    return 2.3; // Mock value
  }

  static async calculateRollRate(bucket) {
    return 15.2; // Mock value
  }

  static async calculateContactRate() {
    return 68.5; // Mock value
  }

  static async calculatePTPKeepRate() {
    return 82.3; // Mock value
  }

  static async calculateLegalSuccessRate() {
    return 45.8; // Mock value
  }

  /**
   * Get date filter based on period
   */
  static getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case 'daily':
        return now.toISOString().split('T')[0];
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString().split('T')[0];
      case 'quarterly':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return quarterAgo.toISOString().split('T')[0];
      case 'yearly':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return yearAgo.toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
    }
  }
}

