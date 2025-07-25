import { supabase, TABLES, formatApiResponse, handleSupabaseError } from '../lib/supabase.js';

/**
 * Collection Service - Comprehensive collection management operations
 * Handles all collection-related data operations across kastle_collection schema
 */
export class CollectionService {

  // ============================================================================
  // COLLECTION OVERVIEW METRICS
  // ============================================================================

  /**
   * Get collection overview dashboard metrics
   */
  static async getCollectionOverview() {
    try {
      // Get basic collection metrics
      const [
        totalCases,
        activeCases,
        totalOutstanding,
        monthlyRecovery,
        bucketDistribution,
        statusDistribution
      ] = await Promise.all([
        // Total collection cases
        supabase.from(TABLES.COLLECTION_CASES)
          .select('*', { count: 'exact', head: true }),

        // Active collection cases
        supabase.from(TABLES.COLLECTION_CASES)
          .select('*', { count: 'exact', head: true })
          .eq('case_status', 'ACTIVE'),

        // Total outstanding amount
        supabase.from(TABLES.COLLECTION_CASES)
          .select('total_outstanding')
          .eq('case_status', 'ACTIVE'),

        // Monthly recovery from daily summaries
        supabase.from(TABLES.DAILY_COLLECTION_SUMMARY)
          .select('total_collected')
          .gte('summary_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),

        // Cases by bucket
        supabase.from(TABLES.COLLECTION_CASES)
          .select(`
            bucket_id,
            ${TABLES.COLLECTION_BUCKETS}!inner(bucket_name, bucket_code)
          `)
          .eq('case_status', 'ACTIVE'),

        // Cases by status
        supabase.from(TABLES.COLLECTION_CASES)
          .select('case_status')
      ]);

      // Calculate metrics
      const totalOutstandingAmount = totalOutstanding.data?.reduce((sum, case_) => 
        sum + (parseFloat(case_.total_outstanding) || 0), 0) || 0;

      const monthlyRecoveryAmount = monthlyRecovery.data?.reduce((sum, summary) => 
        sum + (parseFloat(summary.total_collected) || 0), 0) || 0;

      // Process bucket distribution
      const bucketStats = bucketDistribution.data?.reduce((acc, case_) => {
        const bucketName = case_.kastle_banking?.bucket_name || 'Unknown';
        acc[bucketName] = (acc[bucketName] || 0) + 1;
        return acc;
      }, {}) || {};

      // Process status distribution
      const statusStats = statusDistribution.data?.reduce((acc, case_) => {
        acc[case_.case_status] = (acc[case_.case_status] || 0) + 1;
        return acc;
      }, {}) || {};

      const overview = {
        totalCases: totalCases.count || 0,
        activeCases: activeCases.count || 0,
        totalOutstanding: totalOutstandingAmount,
        monthlyRecovery: monthlyRecoveryAmount,
        collectionRate: totalOutstandingAmount > 0 ? 
          ((monthlyRecoveryAmount / totalOutstandingAmount) * 100).toFixed(2) : 0,
        bucketDistribution: Object.entries(bucketStats).map(([bucket, count]) => ({
          bucket, count
        })),
        statusDistribution: Object.entries(statusStats).map(([status, count]) => ({
          status, count
        }))
      };

      return formatApiResponse(overview);
    } catch (error) {
      console.error('Collection overview error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection performance metrics
   */
  static async getCollectionPerformance(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);

      const [
        dailySummaries,
        officerMetrics,
        teamPerformance,
        campaignResults
      ] = await Promise.all([
        // Daily collection summaries
        supabase.from(TABLES.DAILY_COLLECTION_SUMMARY)
          .select('*')
          .gte('summary_date', dateFilter)
          .order('summary_date', { ascending: true }),

        // Officer performance
        supabase.from(TABLES.OFFICER_PERFORMANCE_METRICS)
          .select(`
            *,
            ${TABLES.COLLECTION_OFFICERS}!inner(officer_name, officer_type)
          `)
          .gte('metric_date', dateFilter),

        // Team performance
        supabase.from(TABLES.COLLECTION_TEAMS)
          .select(`
            *,
            ${TABLES.DAILY_COLLECTION_SUMMARY}!inner(total_collected, collection_rate)
          `),

        // Campaign performance
        supabase.from(TABLES.COLLECTION_CAMPAIGNS)
          .select('*')
          .eq('status', 'ACTIVE')
      ]);

      // Process performance data
      const performance = {
        dailyTrends: dailySummaries.data || [],
        topOfficers: this.processOfficerPerformance(officerMetrics.data || []),
        teamComparison: this.processTeamPerformance(teamPerformance.data || []),
        campaignEffectiveness: this.processCampaignResults(campaignResults.data || [])
      };

      return formatApiResponse(performance);
    } catch (error) {
      console.error('Collection performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // COLLECTION CASES MANAGEMENT
  // ============================================================================

  /**
   * Get collection cases with filters
   */
  static async getCollectionCases(filters = {}) {
    try {
      let query = supabase.from(TABLES.COLLECTION_CASES)
        .select(`
          *,
          kastle_banking_customers:customer_id(full_name, phone_number),
          kastle_banking_collection_buckets:bucket_id(bucket_name, bucket_code)
        `);

      // Apply filters
      if (filters.status) query = query.eq('case_status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.bucketId) query = query.eq('bucket_id', filters.bucketId);
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
      if (filters.branchId) query = query.eq('branch_id', filters.branchId);
      if (filters.minAmount) query = query.gte('total_outstanding', filters.minAmount);
      if (filters.maxAmount) query = query.lte('total_outstanding', filters.maxAmount);
      if (filters.minDpd) query = query.gte('days_past_due', filters.minDpd);
      if (filters.maxDpd) query = query.lte('days_past_due', filters.maxDpd);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);

      if (error) throw error;

      // Format cases for display
      const formattedCases = data?.map(case_ => ({
        caseId: case_.case_id,
        caseNumber: case_.case_number,
        customerName: case_.kastle_banking_customers?.full_name || 'Unknown',
        customerPhone: case_.kastle_banking_customers?.phone_number,
        accountNumber: case_.account_number,
        bucketName: case_.kastle_banking_collection_buckets?.bucket_name,
        totalOutstanding: parseFloat(case_.total_outstanding),
        daysPastDue: case_.days_past_due,
        priority: case_.priority,
        status: case_.case_status,
        assignedTo: case_.assigned_to,
        lastPaymentDate: case_.last_payment_date,
        lastPaymentAmount: case_.last_payment_amount,
        createdAt: case_.created_at,
        riskScore: case_.kastle_collection?.risk_score,
        delinquencyReason: case_.kastle_collection?.delinquency_reason
      })) || [];

      return formatApiResponse(formattedCases);
    } catch (error) {
      console.error('Get collection cases error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get case details with full interaction history
   */
  static async getCaseDetails(caseId) {
    try {
      const [
        caseInfo,
        interactions,
        promisesToPay,
        fieldVisits,
        legalCase,
        hardshipApp
      ] = await Promise.all([
        // Basic case information
        supabase.from(TABLES.COLLECTION_CASES)
          .select(`
            *,
            ${TABLES.CUSTOMERS}!inner(*),
            ${TABLES.COLLECTION_BUCKETS}!inner(*),
            ${TABLES.COLLECTION_CASE_DETAILS}(*)
          `)
          .eq('case_id', caseId)
          .single(),

        // Interaction history
        supabase.from(TABLES.COLLECTION_INTERACTIONS)
          .select(`
            *,
            ${TABLES.COLLECTION_OFFICERS}!inner(officer_name)
          `)
          .eq('case_id', caseId)
          .order('interaction_datetime', { ascending: false }),

        // Promises to pay
        supabase.from(TABLES.PROMISE_TO_PAY)
          .select(`
            *,
            ${TABLES.COLLECTION_OFFICERS}!inner(officer_name)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),

        // Field visits
        supabase.from(TABLES.FIELD_VISITS)
          .select(`
            *,
            ${TABLES.COLLECTION_OFFICERS}!inner(officer_name)
          `)
          .eq('case_id', caseId)
          .order('visit_date', { ascending: false }),

        // Legal case if exists
        supabase.from(TABLES.LEGAL_CASES)
          .select('*')
          .eq('case_id', caseId)
          .maybeSingle(),

        // Hardship application if exists
        supabase.from(TABLES.HARDSHIP_APPLICATIONS)
          .select('*')
          .eq('case_id', caseId)
          .maybeSingle()
      ]);

      const caseDetails = {
        caseInfo: caseInfo.data,
        interactions: interactions.data || [],
        promisesToPay: promisesToPay.data || [],
        fieldVisits: fieldVisits.data || [],
        legalCase: legalCase.data,
        hardshipApplication: hardshipApp.data
      };

      return formatApiResponse(caseDetails);
    } catch (error) {
      console.error('Get case details error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // COLLECTION OFFICERS & TEAMS
  // ============================================================================

  /**
   * Get collection officers performance
   */
  static async getOfficersPerformance(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);

      const { data, error } = await supabase
        .from(TABLES.OFFICER_PERFORMANCE_METRICS)
        .select(`
          *,
          ${TABLES.COLLECTION_OFFICERS}!inner(officer_name, officer_type, team_id),
          ${TABLES.COLLECTION_TEAMS}!inner(team_name, team_type)
        `)
        .gte('metric_date', dateFilter)
        .order('amount_collected', { ascending: false });

      if (error) throw error;

      // Aggregate performance by officer
      const officerStats = {};
      data?.forEach(metric => {
        const officerId = metric.officer_id;
        if (!officerStats[officerId]) {
          officerStats[officerId] = {
            officerId,
            officerName: metric.kastle_collection?.officer_name,
            officerType: metric.kastle_collection?.officer_type,
            teamName: metric.kastle_collection?.team_name,
            totalCollected: 0,
            totalCalls: 0,
            totalContacts: 0,
            totalPtps: 0,
            avgQualityScore: 0,
            metricsCount: 0
          };
        }

        const stats = officerStats[officerId];
        stats.totalCollected += parseFloat(metric.amount_collected) || 0;
        stats.totalCalls += metric.calls_made || 0;
        stats.totalContacts += metric.contacts_successful || 0;
        stats.totalPtps += metric.ptps_obtained || 0;
        stats.avgQualityScore += metric.quality_score || 0;
        stats.metricsCount++;
      });

      // Calculate averages and format results
      const officers = Object.values(officerStats).map(stats => ({
        ...stats,
        avgQualityScore: stats.metricsCount > 0 ? 
          (stats.avgQualityScore / stats.metricsCount).toFixed(2) : 0,
        contactRate: stats.totalCalls > 0 ? 
          ((stats.totalContacts / stats.totalCalls) * 100).toFixed(2) : 0,
        ptpRate: stats.totalContacts > 0 ? 
          ((stats.totalPtps / stats.totalContacts) * 100).toFixed(2) : 0
      }));

      return formatApiResponse(officers);
    } catch (error) {
      console.error('Get officers performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection teams performance
   */
  static async getTeamsPerformance(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);

      const { data, error } = await supabase
        .from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select(`
          *,
          ${TABLES.COLLECTION_TEAMS}!inner(team_name, team_type, team_code)
        `)
        .gte('summary_date', dateFilter);

      if (error) throw error;

      // Aggregate by team
      const teamStats = {};
      data?.forEach(summary => {
        const teamId = summary.team_id;
        if (!teamStats[teamId]) {
          teamStats[teamId] = {
            teamId,
            teamName: summary.kastle_collection?.team_name,
            teamType: summary.kastle_collection?.team_type,
            teamCode: summary.kastle_collection?.team_code,
            totalCollected: 0,
            totalDue: 0,
            totalCalls: 0,
            totalContacts: 0,
            totalPtps: 0,
            summaryCount: 0
          };
        }

        const stats = teamStats[teamId];
        stats.totalCollected += parseFloat(summary.total_collected) || 0;
        stats.totalDue += parseFloat(summary.total_due_amount) || 0;
        stats.totalCalls += summary.calls_made || 0;
        stats.totalContacts += summary.contacts_successful || 0;
        stats.totalPtps += summary.ptps_obtained || 0;
        stats.summaryCount++;
      });

      // Calculate team performance metrics
      const teams = Object.values(teamStats).map(stats => ({
        ...stats,
        collectionRate: stats.totalDue > 0 ? 
          ((stats.totalCollected / stats.totalDue) * 100).toFixed(2) : 0,
        contactRate: stats.totalCalls > 0 ? 
          ((stats.totalContacts / stats.totalCalls) * 100).toFixed(2) : 0,
        ptpRate: stats.totalContacts > 0 ? 
          ((stats.totalPtps / stats.totalContacts) * 100).toFixed(2) : 0,
        avgDailyCollection: stats.summaryCount > 0 ? 
          (stats.totalCollected / stats.summaryCount).toFixed(2) : 0
      }));

      return formatApiResponse(teams);
    } catch (error) {
      console.error('Get teams performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // COLLECTION REPORTS & ANALYTICS
  // ============================================================================

  /**
   * Get collection analytics and trends
   */
  static async getCollectionAnalytics(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);

      const [
        recoveryTrends,
        bucketMigration,
        channelEffectiveness,
        ptpAnalysis
      ] = await Promise.all([
        // Recovery trends over time
        supabase.from(TABLES.DAILY_COLLECTION_SUMMARY)
          .select('summary_date, total_collected, collection_rate')
          .gte('summary_date', dateFilter)
          .order('summary_date', { ascending: true }),

        // Bucket migration analysis
        supabase.from(TABLES.COLLECTION_CASES)
          .select(`
            bucket_id,
            days_past_due,
            case_status,
            ${TABLES.COLLECTION_BUCKETS}!inner(bucket_name, min_dpd, max_dpd)
          `),

        // Digital channel effectiveness
        supabase.from(TABLES.DIGITAL_COLLECTION_ATTEMPTS)
          .select('channel_type, payment_made, payment_amount, cost_per_message')
          .gte('sent_datetime', dateFilter + 'T00:00:00Z'),

        // Promise to Pay analysis
        supabase.from(TABLES.PROMISE_TO_PAY)
          .select('ptp_amount, ptp_date, status, amount_received')
          .gte('created_at', dateFilter + 'T00:00:00Z')
      ]);

      const analytics = {
        recoveryTrends: recoveryTrends.data || [],
        bucketAnalysis: this.processBucketMigration(bucketMigration.data || []),
        channelEffectiveness: this.processChannelEffectiveness(channelEffectiveness.data || []),
        ptpAnalysis: this.processPtpAnalysis(ptpAnalysis.data || [])
      };

      return formatApiResponse(analytics);
    } catch (error) {
      console.error('Get collection analytics error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Generate comprehensive collection report
   */
  static async generateCollectionReport(reportType, filters = {}) {
    try {
      let reportData = {};

      switch (reportType) {
        case 'daily':
          reportData = await this.generateDailyReport(filters);
          break;
        case 'weekly':
          reportData = await this.generateWeeklyReport(filters);
          break;
        case 'monthly':
          reportData = await this.generateMonthlyReport(filters);
          break;
        case 'officer_performance':
          reportData = await this.generateOfficerPerformanceReport(filters);
          break;
        case 'campaign_effectiveness':
          reportData = await this.generateCampaignReport(filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      return formatApiResponse(reportData);
    } catch (error) {
      console.error('Generate collection report error:', error);
      return formatApiResponse(null, error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

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
        return monthAgo.toISOString().split('T')[0];
    }
  }

  /**
   * Process officer performance data
   */
  static processOfficerPerformance(data) {
    // Group by officer and calculate aggregated metrics
    const officers = {};
    data.forEach(metric => {
      const id = metric.officer_id;
      if (!officers[id]) {
        officers[id] = {
          officerId: id,
          officerName: metric.kastle_collection?.officer_name,
          totalCollected: 0,
          totalCalls: 0,
          contactRate: 0,
          qualityScore: 0,
          records: 0
        };
      }
      officers[id].totalCollected += parseFloat(metric.amount_collected) || 0;
      officers[id].totalCalls += metric.calls_made || 0;
      officers[id].qualityScore += metric.quality_score || 0;
      officers[id].records++;
    });

    return Object.values(officers)
      .map(officer => ({
        ...officer,
        qualityScore: officer.records > 0 ? (officer.qualityScore / officer.records).toFixed(2) : 0
      }))
      .sort((a, b) => b.totalCollected - a.totalCollected)
      .slice(0, 10); // Top 10 officers
  }

  /**
   * Process team performance data
   */
  static processTeamPerformance(data) {
    return data.map(team => ({
      teamName: team.team_name,
      teamType: team.team_type,
      totalCollected: team.kastle_collection?.total_collected || 0,
      collectionRate: team.kastle_collection?.collection_rate || 0
    }));
  }

  /**
   * Process campaign results
   */
  static processCampaignResults(data) {
    return data.map(campaign => ({
      campaignName: campaign.campaign_name,
      campaignType: campaign.campaign_type,
      targetRecovery: campaign.target_recovery,
      actualRecovery: campaign.actual_recovery,
      successRate: campaign.success_rate,
      roi: campaign.roi
    }));
  }

  /**
   * Process bucket migration analysis
   */
  static processBucketMigration(data) {
    const buckets = {};
    data.forEach(case_ => {
      const bucketName = case_.kastle_banking?.bucket_name || 'Unknown';
      if (!buckets[bucketName]) {
        buckets[bucketName] = {
          bucketName,
          totalCases: 0,
          activeCases: 0,
          resolvedCases: 0,
          avgDpd: 0
        };
      }
      buckets[bucketName].totalCases++;
      if (case_.case_status === 'ACTIVE') buckets[bucketName].activeCases++;
      if (case_.case_status === 'RESOLVED') buckets[bucketName].resolvedCases++;
      buckets[bucketName].avgDpd += case_.days_past_due || 0;
    });

    return Object.values(buckets).map(bucket => ({
      ...bucket,
      avgDpd: bucket.totalCases > 0 ? (bucket.avgDpd / bucket.totalCases).toFixed(1) : 0,
      resolutionRate: bucket.totalCases > 0 ? 
        ((bucket.resolvedCases / bucket.totalCases) * 100).toFixed(2) : 0
    }));
  }

  /**
   * Process channel effectiveness
   */
  static processChannelEffectiveness(data) {
    const channels = {};
    data.forEach(attempt => {
      const channel = attempt.channel_type;
      if (!channels[channel]) {
        channels[channel] = {
          channel,
          totalAttempts: 0,
          successfulPayments: 0,
          totalAmount: 0,
          totalCost: 0
        };
      }
      channels[channel].totalAttempts++;
      if (attempt.payment_made) {
        channels[channel].successfulPayments++;
        channels[channel].totalAmount += parseFloat(attempt.payment_amount) || 0;
      }
      channels[channel].totalCost += parseFloat(attempt.cost_per_message) || 0;
    });

    return Object.values(channels).map(channel => ({
      ...channel,
      successRate: channel.totalAttempts > 0 ? 
        ((channel.successfulPayments / channel.totalAttempts) * 100).toFixed(2) : 0,
      roi: channel.totalCost > 0 ? 
        ((channel.totalAmount / channel.totalCost) * 100).toFixed(2) : 0
    }));
  }

  /**
   * Process Promise to Pay analysis
   */
  static processPtpAnalysis(data) {
    const analysis = {
      totalPtps: data.length,
      keptPtps: data.filter(ptp => ptp.status === 'KEPT').length,
      brokenPtps: data.filter(ptp => ptp.status === 'BROKEN').length,
      totalPromised: data.reduce((sum, ptp) => sum + (parseFloat(ptp.ptp_amount) || 0), 0),
      totalReceived: data.reduce((sum, ptp) => sum + (parseFloat(ptp.amount_received) || 0), 0)
    };

    analysis.keepRate = analysis.totalPtps > 0 ? 
      ((analysis.keptPtps / analysis.totalPtps) * 100).toFixed(2) : 0;
    analysis.fulfillmentRate = analysis.totalPromised > 0 ? 
      ((analysis.totalReceived / analysis.totalPromised) * 100).toFixed(2) : 0;

    return analysis;
  }

  /**
   * Generate daily collection report
   */
  static async generateDailyReport(filters) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(TABLES.DAILY_COLLECTION_SUMMARY)
      .select(`
        *,
        ${TABLES.COLLECTION_TEAMS}!inner(team_name),
        ${TABLES.BRANCHES}!inner(branch_name)
      `)
      .eq('summary_date', today);

    if (error) throw error;

    return {
      reportDate: today,
      summaries: data || [],
      totalCollected: data?.reduce((sum, s) => sum + (parseFloat(s.total_collected) || 0), 0) || 0,
      totalDue: data?.reduce((sum, s) => sum + (parseFloat(s.total_due_amount) || 0), 0) || 0
    };
  }

  /**
   * Generate monthly collection report
   */
  static async generateMonthlyReport(filters) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const [summaries, interactions, campaigns] = await Promise.all([
      supabase.from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select('*')
        .gte('summary_date', startOfMonth),
      
      supabase.from(TABLES.COLLECTION_INTERACTIONS)
        .select('*', { count: 'exact', head: true })
        .gte('interaction_datetime', startOfMonth + 'T00:00:00Z'),
      
      supabase.from(TABLES.COLLECTION_CAMPAIGNS)
        .select('*')
        .eq('status', 'ACTIVE')
    ]);

    return {
      period: 'monthly',
      startDate: startOfMonth,
      totalCollected: summaries.data?.reduce((sum, s) => 
        sum + (parseFloat(s.total_collected) || 0), 0) || 0,
      totalInteractions: interactions.count || 0,
      activeCampaigns: campaigns.data?.length || 0,
      dailySummaries: summaries.data || []
    };
  }

  /**
   * Generate officer performance report
   */
  static async generateOfficerPerformanceReport(filters) {
    const dateFilter = this.getDateFilter(filters.period || 'monthly');

    const { data, error } = await supabase
      .from(TABLES.OFFICER_PERFORMANCE_METRICS)
      .select(`
        *,
        ${TABLES.COLLECTION_OFFICERS}!inner(officer_name, officer_type, team_id)
      `)
      .gte('metric_date', dateFilter);

    if (error) throw error;

    return {
      period: filters.period || 'monthly',
      officers: this.processOfficerPerformance(data || []),
      totalOfficers: new Set(data?.map(m => m.officer_id)).size || 0
    };
  }
}

