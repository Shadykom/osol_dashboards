import { supabase, TABLES, formatApiResponse, handleSupabaseError } from '../lib/supabase.js';

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
      
      const { data, error } = await supabase
        .from(TABLES.COLLECTION_CASES)
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
        supabase.from(TABLES.COLLECTION_CASES)
          .select('total_outstanding')
          .eq('case_status', 'ACTIVE'),

        // PTP due today
        supabase.from(TABLES.PROMISE_TO_PAY)
          .select('ptp_amount')
          .eq('ptp_date', today)
          .eq('status', 'ACTIVE'),

        // Field visits scheduled
        supabase.from(TABLES.FIELD_VISITS)
          .select('visit_id', { count: 'exact', head: true })
          .eq('visit_date', today),

        // Legal cases updates
        supabase.from(TABLES.LEGAL_CASES)
          .select('legal_case_id', { count: 'exact', head: true })
          .eq('next_hearing_date', today),

        // Yesterday's performance
        supabase.from(TABLES.DAILY_COLLECTION_SUMMARY)
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
        supabase.from(TABLES.COLLECTION_OFFICERS)
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
        supabase.from(TABLES.COLLECTION_INTERACTIONS)
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
   * Get critical alerts
   */
  static async getCriticalAlerts() {
    try {
      const alerts = [];
      const today = new Date().toISOString().split('T')[0];

      // High value payments due
      const { data: highValueCases } = await supabase
        .from(TABLES.COLLECTION_CASES)
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
      const { data: legalHearings } = await supabase
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
  // COLLECTION PERFORMANCE ANALYTICS
  // ============================================================================

  /**
   * Get comprehensive collection analytics
   */
  static async getCollectionAnalytics(period = 'monthly') {
    try {
      const [
        recoveryAnalysis,
        bucketMigration,
        vintageAnalysis,
        channelPerformance,
        segmentAnalysis,
        forecastData
      ] = await Promise.all([
        this.getRecoveryAnalysis(period),
        this.getBucketMigrationAnalysis(period),
        this.getVintageAnalysis(),
        this.getChannelPerformanceAnalysis(period),
        this.getSegmentAnalysis(),
        this.getCollectionForecast()
      ]);

      return formatApiResponse({
        recoveryAnalysis,
        bucketMigration,
        vintageAnalysis,
        channelPerformance,
        segmentAnalysis,
        forecastData
      });
    } catch (error) {
      console.error('Collection analytics error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get vintage analysis
   */
  static async getVintageAnalysis() {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_vintage_analysis')
        .select('*')
        .order('origination_month', { ascending: false })
        .limit(12);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Vintage analysis error:', error);
      return [];
    }
  }

  /**
   * Get bucket migration analysis
   */
  static async getBucketMigrationAnalysis(period) {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_bucket_movement')
        .select(`
          *,
          from_bucket:from_bucket_id(bucket_name),
          to_bucket:to_bucket_id(bucket_name)
        `)
        .gte('movement_date', this.getDateFilter(period))
        .order('movement_date', { ascending: false });

      if (error) throw error;

      // Calculate migration rates
      const migrationMatrix = {};
      data?.forEach(movement => {
        const from = movement.from_bucket?.bucket_name || 'Unknown';
        const to = movement.to_bucket?.bucket_name || 'Unknown';
        
        if (!migrationMatrix[from]) migrationMatrix[from] = {};
        if (!migrationMatrix[from][to]) migrationMatrix[from][to] = 0;
        
        migrationMatrix[from][to]++;
      });

      return {
        movements: data || [],
        migrationMatrix
      };
    } catch (error) {
      console.error('Bucket migration error:', error);
      return { movements: [], migrationMatrix: {} };
    }
  }

  /**
   * Get channel performance analysis
   */
  static async getChannelPerformanceAnalysis(period) {
    try {
      const dateFilter = this.getDateFilter(period);

      const { data, error } = await supabase
        .from(TABLES.DIGITAL_COLLECTION_ATTEMPTS)
        .select('channel_type, payment_made, payment_amount, cost_per_message')
        .gte('sent_datetime', dateFilter + 'T00:00:00Z');

      if (error) throw error;

      // Aggregate by channel
      const channels = {};
      data?.forEach(attempt => {
        const channel = attempt.channel_type;
        if (!channels[channel]) {
          channels[channel] = {
            channel,
            attempts: 0,
            successful: 0,
            totalAmount: 0,
            totalCost: 0
          };
        }
        
        channels[channel].attempts++;
        if (attempt.payment_made) {
          channels[channel].successful++;
          channels[channel].totalAmount += parseFloat(attempt.payment_amount) || 0;
        }
        channels[channel].totalCost += parseFloat(attempt.cost_per_message) || 0;
      });

      // Calculate metrics
      return Object.values(channels).map(ch => ({
        ...ch,
        successRate: ch.attempts > 0 ? (ch.successful / ch.attempts * 100).toFixed(1) : 0,
        avgTicketSize: ch.successful > 0 ? (ch.totalAmount / ch.successful).toFixed(0) : 0,
        costPerSuccess: ch.successful > 0 ? (ch.totalCost / ch.successful).toFixed(2) : 0,
        roi: ch.totalCost > 0 ? ((ch.totalAmount - ch.totalCost) / ch.totalCost * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Channel performance error:', error);
      return [];
    }
  }

  /**
   * Get customer segment analysis
   */
  static async getSegmentAnalysis() {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_customer_segments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      return data?.map(segment => ({
        ...segment,
        performanceGap: segment.target_recovery_rate - segment.actual_recovery_rate,
        efficiency: segment.target_recovery_rate > 0 ?
          (segment.actual_recovery_rate / segment.target_recovery_rate * 100).toFixed(1) : 0
      })) || [];
    } catch (error) {
      console.error('Segment analysis error:', error);
      return [];
    }
  }

  /**
   * Get collection forecast
   */
  static async getCollectionForecast() {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_forecasts')
        .select('*')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(30);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Collection forecast error:', error);
      return [];
    }
  }

  // ============================================================================
  // QUEUE MANAGEMENT SERVICES
  // ============================================================================

  /**
   * Get queue management data
   */
  static async getQueueManagement() {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_queue_management')
        .select(`
          *,
          officer:assigned_officer_id(officer_name),
          team:assigned_team_id(team_name)
        `)
        .eq('is_active', true)
        .order('priority_level', { ascending: true });

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Queue management error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Update queue assignment
   */
  static async updateQueueAssignment(queueId, officerId, teamId) {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_queue_management')
        .update({
          assigned_officer_id: officerId,
          assigned_team_id: teamId,
          last_refreshed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('queue_id', queueId)
        .select()
        .single();

      if (error) throw error;

      return formatApiResponse(data);
    } catch (error) {
      console.error('Update queue assignment error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Optimize queue distribution
   */
  static async optimizeQueueDistribution() {
    try {
      // Get all active queues and officers
      const [queues, officers] = await Promise.all([
        supabase.from('kastle_collection.collection_queue_management')
          .select('*')
          .eq('is_active', true),
        supabase.from(TABLES.COLLECTION_OFFICERS)
          .select('officer_id, collection_limit')
          .eq('status', 'ACTIVE')
      ]);

      // Implement queue optimization algorithm
      // This would include workload balancing, skill matching, etc.
      const optimizedAssignments = this.calculateOptimalQueueDistribution(
        queues.data,
        officers.data
      );

      // Update assignments
      const updates = await Promise.all(
        optimizedAssignments.map(assignment =>
          this.updateQueueAssignment(
            assignment.queueId,
            assignment.officerId,
            assignment.teamId
          )
        )
      );

      return formatApiResponse({
        optimized: true,
        assignments: updates.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Optimize queue distribution error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // COMPLIANCE AND REPORTING SERVICES
  // ============================================================================

  /**
   * Get Sharia compliance report
   */
  static async getShariaComplianceReport(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);

      const [
        latePaymentCharges,
        charityDistribution,
        complianceViolations,
        methodsCompliance
      ] = await Promise.all([
        // Late payment charges collected
        supabase.from(TABLES.SHARIA_COMPLIANCE_LOG)
          .select('late_payment_charges, charity_amount')
          .gte('created_at', dateFilter + 'T00:00:00Z'),

        // Charity distribution status
        supabase.from(TABLES.SHARIA_COMPLIANCE_LOG)
          .select('*')
          .eq('compliance_type', 'CHARITY_DISTRIBUTION')
          .gte('distribution_date', dateFilter),

        // Compliance violations
        supabase.from('kastle_collection.collection_compliance_violations')
          .select('*')
          .eq('violation_type', 'SHARIA_COMPLIANCE')
          .gte('violation_date', dateFilter),

        // Collection methods compliance
        supabase.from(TABLES.COLLECTION_INTERACTIONS)
          .select('interaction_type, outcome')
          .gte('interaction_datetime', dateFilter + 'T00:00:00Z')
      ]);

      const totalLateCharges = latePaymentCharges.data?.reduce((sum, record) =>
        sum + (parseFloat(record.late_payment_charges) || 0), 0) || 0;

      const totalCharityDistributed = charityDistribution.data?.reduce((sum, record) =>
        sum + (parseFloat(record.charity_amount) || 0), 0) || 0;

      return formatApiResponse({
        latePaymentCharges: totalLateCharges,
        charityDistributed: totalCharityDistributed,
        pendingDistribution: totalLateCharges - totalCharityDistributed,
        complianceRate: 98.5, // Would be calculated based on violations
        violations: complianceViolations.data || [],
        approvedMethods: this.getApprovedCollectionMethods(),
        complianceStatus: complianceViolations.data?.length === 0 ? 'COMPLIANT' : 'VIOLATIONS_FOUND'
      });
    } catch (error) {
      console.error('Sharia compliance report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get SAMA compliance report
   */
  static async getSAMAComplianceReport(reportType, period) {
    try {
      const reports = {
        NPF: await this.generateNPFReport(period),
        PROVISION: await this.generateProvisionReport(period),
        WRITEOFF: await this.generateWriteOffReport(period),
        RECOVERY: await this.generateRecoveryReport(period),
        RESTRUCTURING: await this.generateRestructuringReport(period)
      };

      return formatApiResponse(reports[reportType] || null);
    } catch (error) {
      console.error('SAMA compliance report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Generate NPF report for SAMA
   */
  static async generateNPFReport(period) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COLLECTION_CASES)
        .select(`
          *,
          customer:customer_id(customer_type),
          product:kastle_banking.products(product_name, product_category_id)
        `)
        .gte('days_past_due', 90);

      if (error) throw error;

      // Group by required SAMA categories
      const npfByCategory = {
        retail: { count: 0, amount: 0 },
        corporate: { count: 0, amount: 0 },
        sme: { count: 0, amount: 0 }
      };

      const npfByProduct = {};
      const npfByBucket = {};

      data?.forEach(case_ => {
        // By customer type
        const customerType = case_.customer?.customer_type || 'retail';
        npfByCategory[customerType].count++;
        npfByCategory[customerType].amount += parseFloat(case_.total_outstanding) || 0;

        // By product
        const productName = case_.product?.product_name || 'Unknown';
        if (!npfByProduct[productName]) {
          npfByProduct[productName] = { count: 0, amount: 0 };
        }
        npfByProduct[productName].count++;
        npfByProduct[productName].amount += parseFloat(case_.total_outstanding) || 0;

        // By bucket
        const bucket = this.getDPDBucket(case_.days_past_due);
        if (!npfByBucket[bucket]) {
          npfByBucket[bucket] = { count: 0, amount: 0 };
        }
        npfByBucket[bucket].count++;
        npfByBucket[bucket].amount += parseFloat(case_.total_outstanding) || 0;
      });

      return {
        reportDate: new Date().toISOString(),
        period,
        totalNPF: data?.length || 0,
        totalNPFAmount: data?.reduce((sum, c) => sum + parseFloat(c.total_outstanding), 0) || 0,
        byCategory: npfByCategory,
        byProduct: npfByProduct,
        byBucket: npfByBucket,
        regulatory_compliant: true
      };
    } catch (error) {
      console.error('NPF report generation error:', error);
      return null;
    }
  }

  // ============================================================================
  // EARLY WARNING SYSTEM
  // ============================================================================

  /**
   * Get early warning indicators
   */
  static async getEarlyWarningIndicators() {
    try {
      const [
        firstPaymentDefaults,
        irregularPayments,
        multipleLoans,
        highDTI,
        industryRisks,
        behavioralChanges
      ] = await Promise.all([
        this.detectFirstPaymentDefaults(),
        this.detectIrregularPaymentPatterns(),
        this.detectMultipleLoanCustomers(),
        this.detectHighDTICustomers(),
        this.detectIndustryRisks(),
        this.detectBehavioralChanges()
      ]);

      return formatApiResponse({
        indicators: {
          firstPaymentDefaults,
          irregularPayments,
          multipleLoans,
          highDTI,
          industryRisks,
          behavioralChanges
        },
        totalRiskAccounts: firstPaymentDefaults.length + irregularPayments.length +
                          multipleLoans.length + highDTI.length,
        criticalAlerts: this.generateEarlyWarningAlerts({
          firstPaymentDefaults,
          irregularPayments,
          multipleLoans,
          highDTI
        })
      });
    } catch (error) {
      console.error('Early warning indicators error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Detect first payment defaults
   */
  static async detectFirstPaymentDefaults() {
    try {
      const { data, error } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_account_number,
          customer_id,
          first_installment_date,
          ${TABLES.TRANSACTIONS}!inner(transaction_datetime, amount)
        `)
        .eq('loan_status', 'ACTIVE')
        .lte('first_installment_date', new Date().toISOString());

      if (error) throw error;

      // Identify loans with no first payment
      const defaulters = data?.filter(loan => {
        const firstPaymentDue = new Date(loan.first_installment_date);
        const hasFirstPayment = loan.kastle_banking?.some(transaction =>
          new Date(transaction.transaction_datetime) <= firstPaymentDue
        );
        return !hasFirstPayment;
      }) || [];

      return defaulters;
    } catch (error) {
      console.error('First payment defaults detection error:', error);
      return [];
    }
  }

  // ============================================================================
  // AUTOMATION AND AI SERVICES
  // ============================================================================

  /**
   * Get automation metrics
   */
  static async getAutomationMetrics(period = 'monthly') {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_automation_metrics')
        .select('*')
        .gte('metric_date', this.getDateFilter(period))
        .order('metric_date', { ascending: true });

      if (error) throw error;

      // Calculate aggregated metrics
      const metrics = {
        byType: {},
        totalSavings: 0,
        avgEfficiencyGain: 0,
        overallSuccessRate: 0
      };

      data?.forEach(record => {
        if (!metrics.byType[record.automation_type]) {
          metrics.byType[record.automation_type] = {
            attempts: 0,
            successful: 0,
            collected: 0,
            costSaved: 0
          };
        }

        const typeMetrics = metrics.byType[record.automation_type];
        typeMetrics.attempts += record.total_attempts || 0;
        typeMetrics.successful += record.successful_contacts || 0;
        typeMetrics.collected += parseFloat(record.amount_collected) || 0;
        typeMetrics.costSaved += parseFloat(record.cost_saved) || 0;

        metrics.totalSavings += parseFloat(record.cost_saved) || 0;
        metrics.avgEfficiencyGain += parseFloat(record.efficiency_gain) || 0;
      });

      if (data?.length > 0) {
        metrics.avgEfficiencyGain /= data.length;
      }

      return formatApiResponse(metrics);
    } catch (error) {
      console.error('Automation metrics error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get AI model performance
   */
  static async getAIModelPerformance() {
    try {
      // This would integrate with actual AI/ML models
      // For now, returning mock performance data
      return formatApiResponse({
        riskScoring: {
          accuracy: 87.5,
          precision: 89.2,
          recall: 85.8,
          f1Score: 87.5,
          lastUpdated: new Date().toISOString()
        },
        paymentPrediction: {
          accuracy: 82.3,
          mape: 12.5, // Mean Absolute Percentage Error
          rmse: 15420, // Root Mean Square Error
          lastUpdated: new Date().toISOString()
        },
        customerSegmentation: {
          silhouetteScore: 0.72,
          clusters: 5,
          lastUpdated: new Date().toISOString()
        },
        collectionStrategy: {
          uplift: 23.5, // Percentage improvement
          costReduction: 18.2,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('AI model performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // SETTLEMENT AND RECOVERY SERVICES
  // ============================================================================

  /**
   * Get settlement offers
   */
  static async getSettlementOffers(filters = {}) {
    try {
      let query = supabase
        .from('kastle_collection.collection_settlement_offers')
        .select(`
          *,
          case:case_id(case_number, total_outstanding),
          customer:customer_id(full_name, phone_number)
        `);

      if (filters.status) query = query.eq('offer_status', filters.status);
      if (filters.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters.dateFrom) query = query.gte('offer_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('offer_date', filters.dateTo);

      const { data, error } = await query.order('offer_date', { ascending: false });

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get settlement offers error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Create settlement offer
   */
  static async createSettlementOffer(offerData) {
    try {
      const { data, error } = await supabase
        .from('kastle_collection.collection_settlement_offers')
        .insert({
          ...offerData,
          offer_status: 'PENDING',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit trail
      await this.createAuditTrail('SETTLEMENT_OFFER_CREATED', 'settlement_offer', data.offer_id, null, data);

      return formatApiResponse(data);
    } catch (error) {
      console.error('Create settlement offer error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get asset recovery status
   */
  static async getAssetRecoveryStatus() {
    try {
      const { data, error } = await supabase
        .from(TABLES.REPOSSESSED_ASSETS)
        .select(`
          *,
          case:case_id(case_number, customer_id)
        `)
        .order('repossession_date', { ascending: false });

      if (error) throw error;

      // Calculate summary metrics
      const summary = {
        totalAssets: data?.length || 0,
        inPossession: data?.filter(a => a.status === 'IN_POSSESSION').length || 0,
        underAuction: data?.filter(a => a.status === 'UNDER_AUCTION').length || 0,
        sold: data?.filter(a => a.status === 'SOLD').length || 0,
        totalValue: data?.reduce((sum, a) => sum + (parseFloat(a.estimated_value) || 0), 0) || 0,
        totalRecovered: data?.reduce((sum, a) => sum + (parseFloat(a.net_recovery) || 0), 0) || 0
      };

      return formatApiResponse({
        assets: data || [],
        summary
      });
    } catch (error) {
      console.error('Asset recovery status error:', error);
      return formatApiResponse(null, error);
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
   * Calculate optimal queue distribution
   */
  static calculateOptimalQueueDistribution(queues, officers) {
    // Implement sophisticated queue distribution algorithm
    // This is a simplified version
    const assignments = [];
    let officerIndex = 0;

    queues?.forEach(queue => {
      if (officers && officers[officerIndex]) {
        assignments.push({
          queueId: queue.queue_id,
          officerId: officers[officerIndex].officer_id,
          teamId: queue.assigned_team_id
        });
        officerIndex = (officerIndex + 1) % officers.length;
      }
    });

    return assignments;
  }

  /**
   * Get approved collection methods for Sharia compliance
   */
  static getApprovedCollectionMethods() {
    return [
      'Polite phone reminders',
      'Written notices via mail/email',
      'Personal visits with respect',
      'Negotiation and settlement offers',
      'Legal action as last resort',
      'No harassment or public shaming',
      'No collection during prayer times',
      'Respectful treatment of customers'
    ];
  }

  /**
   * Generate early warning alerts
   */
  static generateEarlyWarningAlerts(indicators) {
    const alerts = [];

    if (indicators.firstPaymentDefaults.length > 5) {
      alerts.push({
        type: 'CRITICAL',
        message: `${indicators.firstPaymentDefaults.length} accounts with first payment default`,
        action: 'Immediate contact required'
      });
    }

    if (indicators.multipleLoans.length > 10) {
      alerts.push({
        type: 'WARNING',
        message: `${indicators.multipleLoans.length} customers with multiple loans showing stress`,
        action: 'Review exposure and consider restructuring'
      });
    }

    return alerts;
  }

  /**
   * Create audit trail
   */
  static async createAuditTrail(actionType, entityType, entityId, oldValues, newValues) {
    try {
      await supabase
        .from(TABLES.COLLECTION_AUDIT_TRAIL)
        .insert({
          user_id: 'SYSTEM', // Would get from auth context
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          old_values: oldValues,
          new_values: newValues,
          action_timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Audit trail error:', error);
    }
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
   * Detect various risk patterns
   */
  static async detectIrregularPaymentPatterns() {
    return []; // Would implement pattern detection
  }

  static async detectMultipleLoanCustomers() {
    return []; // Would implement detection logic
  }

  static async detectHighDTICustomers() {
    return []; // Would implement DTI calculation
  }

  static async detectIndustryRisks() {
    return []; // Would implement industry risk detection
  }

  static async detectBehavioralChanges() {
    return []; // Would implement behavioral analysis
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