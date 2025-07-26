import { 
  supabaseCollection, 
  supabaseBanking,
  TABLES, 
  getClientForTable
} from '@/lib/supabase';

// Simple API response formatter
function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || null
      },
      pagination: null
    };
  }

  return {
    success: true,
    data,
    error: null,
    pagination
  };
}

export class CollectionService {
  /**
   * Get collection cases with filtering and pagination
   */
  static async getCollectionCases(params = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = null,
        priority = null,
        bucket = null,
        assignedTo = null,
        minAmount = null,
        maxAmount = null,
        minDpd = null,
        maxDpd = null
      } = params;

      // Use the view that joins all necessary data
      let query = supabaseCollection
        .from('v_specialist_loan_portfolio')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,case_number.ilike.%${search}%,loan_account_number.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('case_status', status);
      }

      if (priority && priority !== 'all') {
        query = query.eq('priority', priority);
      }

      if (bucket && bucket !== 'all') {
        query = query.eq('delinquency_bucket', bucket);
      }

      if (assignedTo && assignedTo !== 'all') {
        query = query.eq('officer_id', assignedTo);
      }

      if (minAmount) {
        query = query.gte('total_outstanding', minAmount);
      }

      if (maxAmount) {
        query = query.lte('total_outstanding', maxAmount);
      }

      if (minDpd) {
        query = query.gte('days_past_due', minDpd);
      }

      if (maxDpd) {
        query = query.lte('days_past_due', maxDpd);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by priority and days past due
      query = query.order('priority', { ascending: false })
                   .order('days_past_due', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data for frontend
      const transformedData = (data || []).map(item => ({
        caseId: item.case_id,
        caseNumber: item.case_number,
        customerName: item.customer_name,
        customerPhone: item.customer_phone || 'N/A',
        accountNumber: item.account_number,
        totalOutstanding: item.total_outstanding,
        daysPastDue: item.days_past_due,
        priority: item.priority,
        status: item.case_status,
        assignedTo: item.officer_name || 'Unassigned',
        delinquencyBucket: item.delinquency_bucket,
        lastContactDate: item.last_contact_date,
        hasPromiseToPay: item.has_promise_to_pay,
        callsThisMonth: item.calls_this_month || 0,
        messagesThisMonth: item.messages_this_month || 0
      }));

      const paginationInfo = {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };

      return formatApiResponse(transformedData, null, paginationInfo);
    } catch (error) {
      console.error('Collection cases error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get case details with all related information
   */
  static async getCaseDetails(caseId) {
    try {
      // Get case info
      const { data: caseData, error: caseError } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          *,
          kastle_banking.customers!customer_id (
            full_name,
            phone_number: customer_contacts!inner(contact_value),
            email: customer_contacts!inner(contact_value)
          )
        `)
        .eq('case_id', caseId)
        .single();

      if (caseError) throw caseError;

      // Get interactions
      const { data: interactions, error: interactionsError } = await supabaseCollection
        .from('collection_interactions')
        .select(`
          *,
          kastle_collection.collection_officers!officer_id (
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('interaction_datetime', { ascending: false })
        .limit(20);

      // Get promises to pay
      const { data: promisesToPay, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select(`
          *,
          kastle_collection.collection_officers!officer_id (
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      // Get field visits
      const { data: fieldVisits, error: visitsError } = await supabaseCollection
        .from('field_visits')
        .select(`
          *,
          kastle_collection.collection_officers!officer_id (
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('visit_date', { ascending: false });

      // Get legal case if exists
      const { data: legalCase, error: legalError } = await supabaseCollection
        .from('legal_cases')
        .select('*')
        .eq('case_id', caseId)
        .single();

      return formatApiResponse({
        caseInfo: caseData,
        interactions: interactions || [],
        promisesToPay: promisesToPay || [],
        fieldVisits: fieldVisits || [],
        legalCase: legalCase
      });
    } catch (error) {
      console.error('Case details error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection overview statistics
   */
  static async getCollectionOverview(filters = {}) {
    try {
      const { branch, team, status } = filters;

      // Build base query
      let query = supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('case_id, total_outstanding, days_past_due, case_status, priority, bucket_id');

      // Apply filters
      if (branch && branch !== 'all') {
        query = query.eq('branch_id', branch);
      }

      if (team && team !== 'all') {
        // Need to join with officers table
        query = query.in('assigned_to', 
          supabaseCollection
            .from('collection_officers')
            .select('officer_id')
            .eq('team_id', team)
        );
      }

      if (status && status !== 'all') {
        query = query.eq('case_status', status);
      }

      const { data: cases, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const totalCases = cases?.length || 0;
      const activeCases = cases?.filter(c => c.case_status === 'ACTIVE').length || 0;
      const totalOutstanding = cases?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;
      
      // Get monthly recovery data
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: recoveryData, error: recoveryError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('transaction_amount')
        .gte('transaction_date', startOfMonth.toISOString())
        .eq('transaction_type_id', 'RECOVERY') // Assuming there's a recovery transaction type
        .eq('status', 'COMPLETED');

      const monthlyRecovery = recoveryData?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;
      const collectionRate = totalOutstanding > 0 ? (monthlyRecovery / totalOutstanding) * 100 : 0;

      // Get status distribution
      const statusDistribution = cases?.reduce((acc, c) => {
        const status = c.case_status || 'UNKNOWN';
        if (!acc[status]) {
          acc[status] = { status, count: 0 };
        }
        acc[status].count++;
        return acc;
      }, {});

      // Get bucket distribution
      const { data: buckets } = await supabaseBanking
        .from(TABLES.COLLECTION_BUCKETS)
        .select('bucket_id, bucket_name');

      const bucketMap = new Map(buckets?.map(b => [b.bucket_id, b.bucket_name]) || []);
      
      const bucketDistribution = cases?.reduce((acc, c) => {
        const bucketName = bucketMap.get(c.bucket_id) || 'Unknown';
        if (!acc[bucketName]) {
          acc[bucketName] = { bucket: bucketName, count: 0 };
        }
        acc[bucketName].count++;
        return acc;
      }, {});

      return formatApiResponse({
        totalCases,
        activeCases,
        totalOutstanding,
        monthlyRecovery,
        collectionRate,
        statusDistribution: Object.values(statusDistribution || {}),
        bucketDistribution: Object.values(bucketDistribution || {})
      });
    } catch (error) {
      console.error('Collection overview error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection performance metrics
   */
  static async getCollectionPerformance(period = 'monthly', filters = {}) {
    try {
      // Get daily summaries
      const { data: dailySummaries, error: summaryError } = await supabaseCollection
        .from('daily_collection_summary')
        .select('*')
        .order('summary_date', { ascending: false })
        .limit(30);

      if (summaryError) throw summaryError;

      // Get top officers
      const { data: topOfficers, error: officersError } = await supabaseCollection
        .from('officer_performance_summary')
        .select(`
          *,
          kastle_collection.collection_officers!officer_id (
            officer_name,
            officer_type
          )
        `)
        .eq('summary_date', new Date().toISOString().split('T')[0])
        .order('total_collected', { ascending: false })
        .limit(10);

      // Get team comparison
      const { data: teams, error: teamsError } = await supabaseCollection
        .from('collection_teams')
        .select(`
          team_id,
          team_name,
          officer_performance_summary!inner (
            total_collected,
            total_cases
          )
        `)
        .eq('officer_performance_summary.summary_date', new Date().toISOString().split('T')[0]);

      // Get campaign effectiveness
      const { data: campaigns, error: campaignsError } = await supabaseCollection
        .from('collection_campaigns')
        .select('*')
        .eq('status', 'ACTIVE');

      // Transform data
      const dailyTrends = dailySummaries?.map(d => ({
        summary_date: d.summary_date,
        total_collected: d.total_collected,
        collection_rate: d.collection_rate,
        accounts_due: d.accounts_due,
        accounts_collected: d.accounts_collected
      })) || [];

      const officerData = topOfficers?.map(o => ({
        officerId: o.officer_id,
        officerName: o.kastle_collection?.officer_name || 'Unknown',
        officerType: o.kastle_collection?.officer_type || 'Unknown',
        totalCollected: o.total_collected,
        totalCalls: o.total_calls,
        contactRate: o.contact_rate,
        qualityScore: Math.random() * 2 + 8 // Mock quality score
      })) || [];

      const teamComparison = teams?.map(t => ({
        teamId: t.team_id,
        teamName: t.team_name,
        totalCollected: t.officer_performance_summary.reduce((sum, o) => sum + o.total_collected, 0)
      })) || [];

      const campaignEffectiveness = campaigns?.map(c => ({
        campaignName: c.campaign_name,
        campaignType: c.campaign_type,
        targetRecovery: c.target_recovery,
        actualRecovery: c.actual_recovery,
        successRate: c.success_rate,
        roi: c.roi
      })) || [];

      return formatApiResponse({
        dailyTrends,
        topOfficers: officerData,
        teamComparison,
        campaignEffectiveness
      });
    } catch (error) {
      console.error('Collection performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection analytics
   */
  static async getCollectionAnalytics(period = 'monthly') {
    try {
      // Get recovery trends
      const { data: trends, error: trendsError } = await supabaseCollection
        .from('daily_collection_summary')
        .select('summary_date, total_collected, collection_rate')
        .order('summary_date', { ascending: true })
        .limit(period === 'daily' ? 7 : period === 'weekly' ? 4 : 30);

      // Get bucket analysis
      const { data: bucketData, error: bucketError } = await supabaseCollection
        .from('collection_bucket_movement')
        .select(`
          to_bucket_id,
          from_bucket_id,
          kastle_banking.collection_buckets!to_bucket_id (
            bucket_name
          )
        `);

      // Get channel effectiveness
      const { data: channelData, error: channelError } = await supabaseCollection
        .from('digital_collection_attempts')
        .select('channel_type, payment_made, payment_amount')
        .gte('sent_datetime', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get PTP analysis
      const { data: ptpData, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select('status, ptp_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate analytics
      const recoveryTrends = trends?.map(t => ({
        summary_date: t.summary_date,
        total_collected: t.total_collected,
        collection_rate: t.collection_rate
      })) || [];

      const channelStats = channelData?.reduce((acc, c) => {
        if (!acc[c.channel_type]) {
          acc[c.channel_type] = {
            channel: c.channel_type,
            attempts: 0,
            successfulPayments: 0,
            totalAmount: 0
          };
        }
        acc[c.channel_type].attempts++;
        if (c.payment_made) {
          acc[c.channel_type].successfulPayments++;
          acc[c.channel_type].totalAmount += c.payment_amount || 0;
        }
        return acc;
      }, {});

      const ptpStats = {
        totalPtps: ptpData?.length || 0,
        keptPtps: ptpData?.filter(p => p.status === 'KEPT').length || 0,
        totalPromised: ptpData?.reduce((sum, p) => sum + (p.ptp_amount || 0), 0) || 0,
        keepRate: ptpData?.length > 0 ? 
          (ptpData.filter(p => p.status === 'KEPT').length / ptpData.length) * 100 : 0
      };

      return formatApiResponse({
        recoveryTrends,
        channelEffectiveness: Object.values(channelStats || {}),
        ptpAnalysis: {
          totalPtps: ptpStats.totalPtps,
          keepRate: ptpStats.keepRate,
          totalPromised: ptpStats.totalPromised,
          fulfillmentRate: ptpStats.keepRate
        },
        bucketAnalysis: [] // Would need more complex processing
      });
    } catch (error) {
      console.error('Collection analytics error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Generate collection report
   */
  static async generateCollectionReport(reportType = 'monthly') {
    try {
      // Get summary data
      const { data: summaryData, error: summaryError } = await supabaseCollection
        .from('daily_collection_summary')
        .select('*')
        .order('summary_date', { ascending: false })
        .limit(reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30);

      if (summaryError) throw summaryError;

      // Calculate totals
      const totalCollected = summaryData?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
      const totalInteractions = summaryData?.reduce((sum, d) => 
        sum + (d.calls_made || 0) + (d.digital_payments || 0), 0) || 0;

      // Get active campaigns count
      const { count: activeCampaigns } = await supabaseCollection
        .from('collection_campaigns')
        .select('campaign_id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Get total officers
      const { count: totalOfficers } = await supabaseCollection
        .from('collection_officers')
        .select('officer_id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      return formatApiResponse({
        totalCollected,
        totalInteractions,
        activeCampaigns: activeCampaigns || 0,
        totalOfficers: totalOfficers || 0,
        dailySummaries: summaryData || []
      });
    } catch (error) {
      console.error('Generate report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get officers performance
   */
  static async getOfficersPerformance(period = 'monthly') {
    try {
      const { data, error } = await supabaseCollection
        .from('officer_performance_summary')
        .select(`
          *,
          kastle_collection.collection_officers!officer_id (
            officer_name,
            officer_type
          )
        `)
        .eq('summary_date', new Date().toISOString().split('T')[0])
        .order('total_collected', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(o => ({
        officerId: o.officer_id,
        officerName: o.kastle_collection?.officer_name || 'Unknown',
        officerType: o.kastle_collection?.officer_type || 'Unknown',
        totalCollected: o.total_collected,
        totalCalls: o.total_calls,
        contactRate: o.contact_rate,
        totalCases: o.total_cases
      })) || [];

      return formatApiResponse(transformedData);
    } catch (error) {
      console.error('Officers performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get teams performance
   */
  static async getTeamsPerformance(period = 'monthly') {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_teams')
        .select(`
          team_id,
          team_name,
          collection_officers!inner (
            officer_id,
            officer_performance_summary!inner (
              total_collected,
              total_cases
            )
          )
        `);

      if (error) throw error;

      const teamPerformance = data?.map(team => {
        const totalCollected = team.collection_officers.reduce((sum, officer) => 
          sum + (officer.officer_performance_summary?.[0]?.total_collected || 0), 0);
        
        return {
          teamId: team.team_id,
          teamName: team.team_name,
          totalCollected
        };
      }) || [];

      return formatApiResponse(teamPerformance);
    } catch (error) {
      console.error('Teams performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get specialist report data
   */
  static async getSpecialistReport(specialistId, filters = {}) {
    try {
      const {
        dateRange = 'current_month',
        loanStatus = 'all',
        delinquencyBucket = 'all'
      } = filters;

      // Get specialist info
      const { data: specialist, error: specialistError } = await supabaseCollection
        .from('collection_officers')
        .select('*')
        .eq('officer_id', specialistId)
        .single();

      if (specialistError) throw specialistError;

      // Get assigned loans with all details
      let loansQuery = supabaseCollection
        .from('v_specialist_loan_portfolio')
        .select('*')
        .eq('officer_id', specialistId);

      // Apply filters
      if (loanStatus !== 'all') {
        loansQuery = loansQuery.eq('loan_status', loanStatus);
      }

      if (delinquencyBucket !== 'all') {
        loansQuery = loansQuery.eq('delinquency_bucket', delinquencyBucket);
      }

      const { data: loans, error: loansError } = await loansQuery;

      if (loansError) throw loansError;

      // Get performance summary
      const { data: performance, error: performanceError } = await supabaseCollection
        .from('officer_performance_summary')
        .select('*')
        .eq('officer_id', specialistId)
        .eq('summary_date', new Date().toISOString().split('T')[0])
        .single();

      // Get communication data for chart
      const { data: communicationData, error: commError } = await supabaseCollection
        .from('collection_interactions')
        .select('interaction_datetime, interaction_type')
        .eq('officer_id', specialistId)
        .gte('interaction_datetime', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('interaction_datetime', { ascending: true });

      // Process communication data by day
      const commByDay = communicationData?.reduce((acc, comm) => {
        const day = new Date(comm.interaction_datetime).toLocaleDateString('ar-SA', { weekday: 'long' });
        if (!acc[day]) {
          acc[day] = { day, calls: 0, messages: 0, responses: 0 };
        }
        if (comm.interaction_type === 'CALL') {
          acc[day].calls++;
        } else {
          acc[day].messages++;
        }
        acc[day].responses++; // Simplified
        return acc;
      }, {});

      // Calculate KPIs
      const totalLoans = loans?.length || 0;
      const totalPortfolioValue = loans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;
      const overdueLoans = loans?.filter(l => l.overdue_days > 0).length || 0;
      const totalOverdueAmount = loans?.reduce((sum, l) => sum + (l.due_amount || 0), 0) || 0;

      const kpis = {
        totalLoans,
        totalPortfolioValue,
        overdueLoans,
        totalOverdueAmount,
        collectionRate: performance?.collection_rate || 0,
        callsMade: performance?.total_calls || 0,
        messagesSent: performance?.total_messages || 0,
        promisesToPay: performance?.total_ptps || 0,
        promisesFulfilled: performance?.ptps_kept || 0,
        averageResponseRate: performance?.contact_rate || 0
      };

      // Get promises to pay
      const { data: promisesToPay, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select(`
          *,
          kastle_banking.collection_cases!case_id (
            customer_id,
            kastle_banking.customers!customer_id (
              full_name
            )
          )
        `)
        .eq('officer_id', specialistId)
        .in('status', ['ACTIVE', 'PENDING'])
        .order('ptp_date', { ascending: true });

      return formatApiResponse({
        specialist,
        kpis,
        loans: loans || [],
        communicationData: Object.values(commByDay || {}),
        promisesToPay: promisesToPay || [],
        performance: {
          collectionRate: performance?.collection_rate || 0,
          responseRate: performance?.contact_rate || 0,
          promiseRate: performance?.total_ptps > 0 ? 
            (performance.ptps_kept / performance.total_ptps) * 100 : 0,
          fulfillmentRate: performance?.ptp_keep_rate || 0
        }
      });
    } catch (error) {
      console.error('Specialist report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get all specialists
   */
  static async getSpecialists() {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_officers')
        .select('officer_id, officer_name, officer_type, team_id')
        .eq('status', 'ACTIVE')
        .order('officer_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get specialists error:', error);
      return formatApiResponse(null, error);
    }
  }
}