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
        maxDpd = null,
        dateFrom = null,
        dateTo = null
      } = params;

      // Build query - collection_cases is in kastle_banking schema
      let query = supabaseBanking
        .from('collection_cases')
        .select(`
          *,
          loan_accounts!loan_account_number (
            loan_amount,
            outstanding_balance,
            overdue_amount,
            overdue_days,
            product_id,
            products!product_id (
              product_name,
              product_type
            )
          ),
          customers!customer_id (
            full_name,
            customer_type,
            customer_contacts!customer_id (
              contact_type,
              contact_value
            )
          ),
          collection_buckets!bucket_id (
            bucket_name,
            min_days,
            max_days
          )
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`case_number.ilike.%${search}%,loan_account_number.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('case_status', status);
      }

      if (priority && priority !== 'all') {
        query = query.eq('priority', priority);
      }

      if (bucket && bucket !== 'all') {
        query = query.eq('bucket_id', bucket);
      }

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      if (minAmount) {
        query = query.gte('total_outstanding', minAmount);
      }

      if (maxAmount) {
        query = query.lte('total_outstanding', maxAmount);
      }

      if (minDpd) {
        query = query.gte('dpd', minDpd);
      }

      if (maxDpd) {
        query = query.lte('dpd', maxDpd);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get officer details separately from kastle_collection schema
      let casesWithOfficers = data || [];
      if (data && data.length > 0) {
        const officerIds = [...new Set(data.map(c => c.assigned_to).filter(id => id))];
        
        if (officerIds.length > 0) {
          const { data: officers, error: officersError } = await supabaseCollection
            .from('collection_officers')
            .select('officer_id, officer_name, officer_type, team_id, contact_number')
            .in('officer_id', officerIds);

          if (!officersError && officers) {
            const officersMap = officers.reduce((acc, officer) => {
              acc[officer.officer_id] = officer;
              return acc;
            }, {});

            casesWithOfficers = data.map(caseData => ({
              ...caseData,
              collection_officers: officersMap[caseData.assigned_to] || null
            }));
          }
        }
      }

      const pagination = {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };

      return formatApiResponse(casesWithOfficers, null, pagination);
    } catch (error) {
      console.error('Error fetching collection cases:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get case details with all related information
   */
  static async getCaseDetails(caseId) {
    try {
      // Get case info with all related data
      const { data: caseData, error: caseError } = await supabaseCollection
        .from('collection_cases')
        .select(`
          *,
          loan_accounts!loan_account_number (
            *,
            products!product_id (*)
          ),
          customers!customer_id (
            *,
            customer_contacts!customer_id (*),
            customer_addresses!customer_id (*)
          ),
          collection_officers!assigned_to (*),
          collection_strategies!strategy_id (*),
          collection_buckets!bucket_id (*)
        `)
        .eq('case_id', caseId)
        .single();

      if (caseError) throw caseError;

      // Get interactions
      const { data: interactions, error: interactionsError } = await supabaseCollection
        .from('collection_interactions')
        .select(`
          *,
          collection_officers!officer_id (
            officer_name,
            officer_type
          )
        `)
        .eq('case_id', caseId)
        .order('interaction_datetime', { ascending: false });

      // Get promises to pay
      const { data: promisesToPay, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select(`
          *,
          collection_officers!officer_id (
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
          collection_officers!officer_id (
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

      // Get payment history
      const { data: payments, error: paymentsError } = await supabaseBanking
        .from('transactions')
        .select('*')
        .eq('account_number', caseData?.account_number)
        .eq('transaction_type_id', 'LOAN_REPAYMENT')
        .order('transaction_date', { ascending: false })
        .limit(10);

      // Get collection score history
      const { data: scoreHistory, error: scoreError } = await supabaseCollection
        .from('collection_scores')
        .select('*')
        .eq('case_id', caseId)
        .order('score_date', { ascending: false })
        .limit(30);

      return formatApiResponse({
        caseInfo: caseData,
        interactions: interactions || [],
        promisesToPay: promisesToPay || [],
        fieldVisits: fieldVisits || [],
        legalCase: legalCase,
        recentPayments: payments || [],
        scoreHistory: scoreHistory || [],
        summary: {
          totalInteractions: interactions?.length || 0,
          totalPTPs: promisesToPay?.length || 0,
          activePTPs: promisesToPay?.filter(p => p.status === 'ACTIVE').length || 0,
          keptPTPs: promisesToPay?.filter(p => p.status === 'KEPT').length || 0,
          totalFieldVisits: fieldVisits?.length || 0,
          lastPaymentDate: payments?.[0]?.transaction_date || null,
          lastPaymentAmount: payments?.[0]?.transaction_amount || 0
        }
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
      const { branch, team, status, dateFrom, dateTo } = filters;

      // Build base query for cases
      let casesQuery = supabaseCollection
        .from('collection_cases')
        .select('case_id, total_outstanding, days_past_due, case_status, priority, bucket_id, assigned_to');

      // Apply filters
      if (status && status !== 'all') {
        casesQuery = casesQuery.eq('case_status', status);
      }

      if (dateFrom) {
        casesQuery = casesQuery.gte('created_at', dateFrom);
      }

      if (dateTo) {
        casesQuery = casesQuery.lte('created_at', dateTo);
      }

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) throw casesError;

      // Filter by team if needed
      let filteredCases = cases || [];
      if (team && team !== 'all') {
        const { data: teamOfficers } = await supabaseCollection
          .from('collection_officers')
          .select('officer_id')
          .eq('team_id', team);
        
        const officerIds = teamOfficers?.map(o => o.officer_id) || [];
        filteredCases = filteredCases.filter(c => officerIds.includes(c.assigned_to));
      }

      // Calculate statistics
      const totalCases = filteredCases.length;
      const activeCases = filteredCases.filter(c => c.case_status === 'ACTIVE').length;
      const totalOutstanding = filteredCases.reduce((sum, c) => sum + (c.total_outstanding || 0), 0);
      
      // Get monthly recovery data
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyRecovery } = await supabaseCollection
        .from('daily_collection_summary')
        .select('total_collected')
        .gte('summary_date', startOfMonth.toISOString().split('T')[0]);

      const totalMonthlyRecovery = monthlyRecovery?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
      const collectionRate = totalOutstanding > 0 ? (totalMonthlyRecovery / totalOutstanding) * 100 : 0;

      // Get bucket distribution
      const { data: buckets } = await supabaseCollection
        .from('collection_buckets')
        .select('bucket_id, bucket_name, min_days, max_days');

      const bucketDistribution = buckets?.map(bucket => {
        const count = filteredCases.filter(c => c.bucket_id === bucket.bucket_id).length;
        const amount = filteredCases
          .filter(c => c.bucket_id === bucket.bucket_id)
          .reduce((sum, c) => sum + (c.total_outstanding || 0), 0);
        
        return {
          bucketId: bucket.bucket_id,
          bucketName: bucket.bucket_name,
          minDays: bucket.min_days,
          maxDays: bucket.max_days,
          count,
          amount,
          percentage: totalCases > 0 ? (count / totalCases) * 100 : 0
        };
      }) || [];

      // Get status distribution
      const statusTypes = ['ACTIVE', 'CLOSED', 'LEGAL', 'WRITTEN_OFF'];
      const statusDistribution = statusTypes.map(status => {
        const count = filteredCases.filter(c => c.case_status === status).length;
        const amount = filteredCases
          .filter(c => c.case_status === status)
          .reduce((sum, c) => sum + (c.total_outstanding || 0), 0);
        
        return {
          status,
          count,
          amount,
          percentage: totalCases > 0 ? (count / totalCases) * 100 : 0
        };
      });

      // Get priority distribution
      const priorities = ['HIGH', 'MEDIUM', 'LOW'];
      const priorityDistribution = priorities.map(priority => {
        const count = filteredCases.filter(c => c.priority === priority).length;
        return {
          priority,
          count,
          percentage: totalCases > 0 ? (count / totalCases) * 100 : 0
        };
      });

      // Get team performance
      const { data: teams } = await supabaseCollection
        .from('collection_teams')
        .select(`
          team_id,
          team_name,
          collection_officers!team_id (
            officer_id,
            officer_name
          )
        `);

      const teamPerformance = await Promise.all((teams || []).map(async (team) => {
        const teamOfficerIds = team.kastle_collection?.collection_officers?.map(o => o.officer_id) || [];
        const teamCases = filteredCases.filter(c => teamOfficerIds.includes(c.assigned_to));
        
        // Get team recovery
        const { data: teamRecovery } = await supabaseCollection
          .from('officer_performance_summary')
          .select('total_collected')
          .in('officer_id', teamOfficerIds)
          .gte('summary_date', startOfMonth.toISOString().split('T')[0]);

        const totalTeamRecovery = teamRecovery?.reduce((sum, r) => sum + (r.total_collected || 0), 0) || 0;

        return {
          teamId: team.team_id,
          teamName: team.team_name,
          officerCount: teamOfficerIds.length,
          caseCount: teamCases.length,
          totalOutstanding: teamCases.reduce((sum, c) => sum + (c.total_outstanding || 0), 0),
          monthlyRecovery: totalTeamRecovery,
          collectionRate: teamCases.length > 0 ? 
            (totalTeamRecovery / teamCases.reduce((sum, c) => sum + (c.total_outstanding || 0), 0)) * 100 : 0
        };
      }));

      return formatApiResponse({
        summary: {
          totalCases,
          activeCases,
          closedCases: totalCases - activeCases,
          totalOutstanding,
          monthlyRecovery: totalMonthlyRecovery,
          collectionRate,
          avgDPD: filteredCases.length > 0 ? 
            filteredCases.reduce((sum, c) => sum + (c.days_past_due || 0), 0) / filteredCases.length : 0
        },
        distributions: {
          byBucket: bucketDistribution,
          byStatus: statusDistribution,
          byPriority: priorityDistribution
        },
        teamPerformance,
        trends: {
          newCasesThisMonth: filteredCases.filter(c => 
            new Date(c.created_at) >= startOfMonth
          ).length,
          closedCasesThisMonth: 0 // Would need to track closure date
        }
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
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 28);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 3);
          break;
      }

      // Get daily summaries
      const { data: dailySummaries, error: summaryError } = await supabaseCollection
        .from('daily_collection_summary')
        .select('*')
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

      if (summaryError) throw summaryError;

      // Get top officers performance
      const { data: officerPerformance, error: officersError } = await supabaseCollection
        .from('officer_performance_summary')
        .select(`
          *,
          collection_officers!officer_id (
            officer_name,
            officer_type,
            team_id,
            collection_teams (
              team_name
            )
          )
        `)
        .eq('summary_date', endDate.toISOString().split('T')[0])
        .order('total_collected', { ascending: false })
        .limit(10);

      // Get team comparison
      const { data: teams, error: teamsError } = await supabaseCollection
        .from('collection_teams')
        .select('*');

      const teamComparison = await Promise.all((teams || []).map(async (team) => {
        const { data: teamData } = await supabaseCollection
          .from('officer_performance_summary')
          .select('total_collected, total_cases, contact_rate')
          .eq('summary_date', endDate.toISOString().split('T')[0])
          .in('officer_id', 
            supabaseCollection
              .from('collection_officers')
              .select('officer_id')
              .eq('team_id', team.team_id)
          );

        const totalCollected = teamData?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
        const totalCases = teamData?.reduce((sum, d) => sum + (d.total_cases || 0), 0) || 0;
        const avgContactRate = teamData?.length > 0 ?
          teamData.reduce((sum, d) => sum + (d.contact_rate || 0), 0) / teamData.length : 0;

        return {
          teamId: team.team_id,
          teamName: team.team_name,
          teamLead: team.team_lead,
          totalCollected,
          totalCases,
          avgContactRate,
          officerCount: teamData?.length || 0
        };
      }));

      // Get campaign effectiveness
      const { data: campaigns, error: campaignsError } = await supabaseCollection
        .from('collection_campaigns')
        .select('*')
        .in('status', ['ACTIVE', 'COMPLETED'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Get channel performance
      const { data: channelPerformance } = await supabaseCollection
        .from('digital_collection_attempts')
        .select('channel_type, payment_made, payment_amount')
        .gte('sent_datetime', startDate.toISOString());

      const channelStats = channelPerformance?.reduce((acc, attempt) => {
        if (!acc[attempt.channel_type]) {
          acc[attempt.channel_type] = {
            channel: attempt.channel_type,
            attempts: 0,
            successful: 0,
            totalAmount: 0
          };
        }
        
        acc[attempt.channel_type].attempts++;
        if (attempt.payment_made) {
          acc[attempt.channel_type].successful++;
          acc[attempt.channel_type].totalAmount += attempt.payment_amount || 0;
        }
        
        return acc;
      }, {}) || {};

      // Format response
      const dailyTrends = dailySummaries?.map(d => ({
        date: d.summary_date,
        totalCollected: d.total_collected || 0,
        collectionRate: d.collection_rate || 0,
        accountsDue: d.accounts_due || 0,
        accountsCollected: d.accounts_collected || 0,
        callsMade: d.calls_made || 0,
        ptpCreated: d.ptps_created || 0,
        ptpKept: d.ptps_kept || 0
      })) || [];

      const topOfficers = officerPerformance?.map(o => ({
        officerId: o.officer_id,
        officerName: o.kastle_collection?.collection_officers?.officer_name || 'Unknown',
        officerType: o.kastle_collection?.collection_officers?.officer_type || 'Unknown',
        teamName: o.kastle_collection?.collection_officers?.kastle_collection?.collection_teams?.team_name || 'Unknown',
        totalCollected: o.total_collected || 0,
        totalCases: o.total_cases || 0,
        totalCalls: o.total_calls || 0,
        contactRate: o.contact_rate || 0,
        ptpRate: o.ptp_rate || 0,
        qualityScore: o.quality_score || 0
      })) || [];

      const campaignEffectiveness = campaigns?.map(c => ({
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        campaignType: c.campaign_type,
        status: c.status,
        targetRecovery: c.target_recovery || 0,
        actualRecovery: c.actual_recovery || 0,
        successRate: c.success_rate || 0,
        roi: c.roi || 0,
        startDate: c.start_date,
        endDate: c.end_date
      })) || [];

      return formatApiResponse({
        dailyTrends,
        topOfficers,
        teamComparison,
        campaignEffectiveness,
        channelPerformance: Object.values(channelStats),
        summary: {
          totalCollected: dailySummaries?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0,
          avgCollectionRate: dailySummaries?.length > 0 ?
            dailySummaries.reduce((sum, d) => sum + (d.collection_rate || 0), 0) / dailySummaries.length : 0,
          totalCalls: dailySummaries?.reduce((sum, d) => sum + (d.calls_made || 0), 0) || 0,
          totalPTPs: dailySummaries?.reduce((sum, d) => sum + (d.ptps_created || 0), 0) || 0,
          ptpFulfillmentRate: dailySummaries?.reduce((sum, d) => sum + (d.ptps_created || 0), 0) > 0 ?
            (dailySummaries.reduce((sum, d) => sum + (d.ptps_kept || 0), 0) / 
             dailySummaries.reduce((sum, d) => sum + (d.ptps_created || 0), 0)) * 100 : 0
        }
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
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (period === 'daily' ? 1 : period === 'weekly' ? 3 : 12));

      const { data: trends, error: trendsError } = await supabaseCollection
        .from('daily_collection_summary')
        .select('summary_date, total_collected, collection_rate, calls_made, ptps_created, ptps_kept')
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

      if (trendsError) throw trendsError;

      // Get bucket movement analysis
      const { data: bucketMovements, error: bucketError } = await supabaseCollection
        .from('case_bucket_history')
        .select(`
          from_bucket_id,
          to_bucket_id,
          movement_date,
          case_count,
          total_amount,
          collection_buckets!from_bucket_id (
            bucket_name
          )
        `)
        .gte('movement_date', startDate.toISOString())
        .order('movement_date', { ascending: false });

      // Get PTP analysis
      const { data: ptpData, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select('status, ptp_amount, created_at, kept_date, broken_date')
        .gte('created_at', startDate.toISOString());

      // Calculate analytics
      const recoveryTrends = trends?.map(t => ({
        date: t.summary_date,
        totalCollected: t.total_collected || 0,
        collectionRate: t.collection_rate || 0,
        callsPerCollection: t.total_collected > 0 ? (t.calls_made / t.total_collected) : 0,
        ptpConversionRate: t.calls_made > 0 ? (t.ptps_created / t.calls_made) * 100 : 0,
        ptpFulfillmentRate: t.ptps_created > 0 ? (t.ptps_kept / t.ptps_created) * 100 : 0
      })) || [];

      // Channel effectiveness from digital attempts
      const { data: digitalAttempts } = await supabaseCollection
        .from('digital_collection_attempts')
        .select('channel_type, payment_made, payment_amount, response_received')
        .gte('sent_datetime', startDate.toISOString());

      const channelStats = digitalAttempts?.reduce((acc, attempt) => {
        if (!acc[attempt.channel_type]) {
          acc[attempt.channel_type] = {
            channel: attempt.channel_type,
            attempts: 0,
            responses: 0,
            payments: 0,
            totalAmount: 0
          };
        }
        
        acc[attempt.channel_type].attempts++;
        if (attempt.response_received) acc[attempt.channel_type].responses++;
        if (attempt.payment_made) {
          acc[attempt.channel_type].payments++;
          acc[attempt.channel_type].totalAmount += attempt.payment_amount || 0;
        }
        
        return acc;
      }, {}) || {};

      const channelEffectiveness = Object.values(channelStats).map(channel => ({
        ...channel,
        responseRate: channel.attempts > 0 ? (channel.responses / channel.attempts) * 100 : 0,
        conversionRate: channel.attempts > 0 ? (channel.payments / channel.attempts) * 100 : 0,
        avgPaymentAmount: channel.payments > 0 ? channel.totalAmount / channel.payments : 0
      }));

      // PTP Analysis
      const ptpStats = {
        totalPTPs: ptpData?.length || 0,
        activePTPs: ptpData?.filter(p => p.status === 'ACTIVE').length || 0,
        keptPTPs: ptpData?.filter(p => p.status === 'KEPT').length || 0,
        brokenPTPs: ptpData?.filter(p => p.status === 'BROKEN').length || 0,
        totalPromised: ptpData?.reduce((sum, p) => sum + (p.ptp_amount || 0), 0) || 0,
        totalKept: ptpData?.filter(p => p.status === 'KEPT')
          .reduce((sum, p) => sum + (p.ptp_amount || 0), 0) || 0,
        keepRate: ptpData?.length > 0 ? 
          (ptpData.filter(p => p.status === 'KEPT').length / ptpData.length) * 100 : 0,
        avgDaysToKeep: ptpData?.filter(p => p.status === 'KEPT' && p.kept_date).length > 0 ?
          ptpData.filter(p => p.status === 'KEPT' && p.kept_date)
            .reduce((sum, p) => {
              const days = Math.floor((new Date(p.kept_date) - new Date(p.created_at)) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / ptpData.filter(p => p.status === 'KEPT' && p.kept_date).length : 0
      };

      // Bucket analysis
      const bucketAnalysis = bucketMovements?.reduce((acc, movement) => {
        const fromBucket = movement.kastle_collection?.collection_buckets?.bucket_name || 'Unknown';
        const key = `${fromBucket}_to_${movement.to_bucket_id}`;
        
        if (!acc[key]) {
          acc[key] = {
            from: fromBucket,
            to: movement.to_bucket_id,
            count: 0,
            amount: 0
          };
        }
        
        acc[key].count += movement.case_count || 0;
        acc[key].amount += movement.total_amount || 0;
        
        return acc;
      }, {}) || {};

      return formatApiResponse({
        recoveryTrends,
        channelEffectiveness,
        ptpAnalysis: {
          summary: ptpStats,
          weeklyBreakdown: this.groupPTPByWeek(ptpData)
        },
        bucketAnalysis: Object.values(bucketAnalysis),
        insights: {
          bestPerformingChannel: channelEffectiveness.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.channel,
          avgCollectionRate: recoveryTrends.length > 0 ?
            recoveryTrends.reduce((sum, t) => sum + t.collectionRate, 0) / recoveryTrends.length : 0,
          collectionTrend: this.calculateTrend(recoveryTrends.map(t => t.totalCollected))
        }
      });
    } catch (error) {
      console.error('Collection analytics error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Generate collection report
   */
  static async generateCollectionReport(reportType = 'summary') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Default to last month

      let reportData = {};

      switch (reportType) {
        case 'summary':
          // Get overall collection summary
          const { data: summary } = await supabaseCollection
            .from('daily_collection_summary')
            .select('*')
            .gte('summary_date', startDate.toISOString().split('T')[0])
            .lte('summary_date', endDate.toISOString().split('T')[0])
            .order('summary_date', { ascending: false });

          const totalCollected = summary?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
          const avgCollectionRate = summary?.length > 0 ?
            summary.reduce((sum, d) => sum + (d.collection_rate || 0), 0) / summary.length : 0;

          reportData = {
            reportType: 'summary',
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            totalCollected,
            avgCollectionRate,
            totalAccounts: summary?.[0]?.accounts_due || 0,
            accountsCollected: summary?.reduce((sum, d) => sum + (d.accounts_collected || 0), 0) || 0,
            dailySummaries: summary || []
          };
          break;

        case 'detailed':
          // Get detailed collection data by officer
          const { data: officerData } = await supabaseCollection
            .from('officer_performance_summary')
            .select(`
              *,
              collection_officers (
                officer_name,
                officer_type,
                team_id
              )
            `)
            .gte('summary_date', startDate.toISOString().split('T')[0])
            .lte('summary_date', endDate.toISOString().split('T')[0])
            .order('total_collected', { ascending: false });

          reportData = {
            reportType: 'detailed',
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            officerPerformance: officerData || [],
            totalOfficers: new Set(officerData?.map(d => d.officer_id)).size || 0
          };
          break;

        case 'bucket':
          // Get collection by bucket
          const { data: bucketData } = await supabaseCollection
            .from('collection_cases')
            .select(`
              bucket_id,
              total_outstanding,
              days_past_due,
              case_status,
              collection_buckets (
                bucket_name,
                min_days,
                max_days
              )
            `)
            .eq('case_status', 'ACTIVE');

          const bucketSummary = bucketData?.reduce((acc, caseItem) => {
            const bucketName = caseItem.kastle_collection?.collection_buckets?.bucket_name || 'Unknown';
            if (!acc[bucketName]) {
              acc[bucketName] = {
                bucketName,
                count: 0,
                totalOutstanding: 0,
                avgDPD: 0
              };
            }
            acc[bucketName].count++;
            acc[bucketName].totalOutstanding += caseItem.total_outstanding || 0;
            acc[bucketName].avgDPD += caseItem.days_past_due || 0;
            return acc;
          }, {}) || {};

          // Calculate averages
          Object.values(bucketSummary).forEach(bucket => {
            bucket.avgDPD = bucket.count > 0 ? bucket.avgDPD / bucket.count : 0;
          });

          reportData = {
            reportType: 'bucket',
            period: `As of ${endDate.toLocaleDateString()}`,
            bucketAnalysis: Object.values(bucketSummary),
            totalCases: bucketData?.length || 0,
            totalOutstanding: bucketData?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0
          };
          break;

        case 'team':
          // Get collection by team
          const { data: teams } = await supabaseCollection
            .from('collection_teams')
            .select(`
              *,
              collection_officers (
                officer_id,
                officer_name
              )
            `);

          const teamPerformance = await Promise.all((teams || []).map(async (team) => {
            const officerIds = team.kastle_collection?.collection_officers?.map(o => o.officer_id) || [];
            
            const { data: teamData } = await supabaseCollection
              .from('officer_performance_summary')
              .select('total_collected, total_cases, contact_rate')
              .in('officer_id', officerIds)
              .gte('summary_date', startDate.toISOString().split('T')[0])
              .lte('summary_date', endDate.toISOString().split('T')[0]);

            const totalCollected = teamData?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
            const totalCases = teamData?.reduce((sum, d) => sum + (d.total_cases || 0), 0) || 0;
            const avgContactRate = teamData?.length > 0 ?
              teamData.reduce((sum, d) => sum + (d.contact_rate || 0), 0) / teamData.length : 0;

            return {
              teamId: team.team_id,
              teamName: team.team_name,
              teamType: team.team_type,
              officerCount: officerIds.length,
              totalCollected,
              totalCases,
              avgContactRate
            };
          }));

          reportData = {
            reportType: 'team',
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            teamPerformance: teamPerformance.sort((a, b) => b.totalCollected - a.totalCollected),
            totalTeams: teams?.length || 0
          };
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      return formatApiResponse(reportData);
    } catch (error) {
      console.error('Generate collection report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get officers performance
   */
  static async getOfficersPerformance(period = 'monthly') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 28);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 3);
          break;
      }

      const { data: officerPerformance, error: officersError } = await supabaseCollection
        .from('officer_performance_summary')
        .select(`
          *,
          collection_officers (
            officer_name,
            officer_type,
            team_id
          )
        `)
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0])
        .order('total_collected', { ascending: false });

      if (officersError) throw officersError;

      const totalOfficers = new Set(officerPerformance?.map(d => d.officer_id)).size || 0;

      return formatApiResponse({
        officerPerformance: officerPerformance || [],
        totalOfficers
      });
    } catch (error) {
      console.error('Get officers performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get teams performance
   */
  static async getTeamsPerformance(period = 'monthly') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 28);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 3);
          break;
      }

      const { data: teams, error: teamsError } = await supabaseCollection
        .from('collection_teams')
        .select(`
          *,
          collection_officers (
            officer_id,
            officer_name
          )
        `);

      if (teamsError) throw teamsError;

      const teamPerformance = await Promise.all((teams || []).map(async (team) => {
        const officerIds = team.kastle_collection?.collection_officers?.map(o => o.officer_id) || [];
        
        const { data: teamData } = await supabaseCollection
          .from('officer_performance_summary')
          .select('total_collected, total_cases, contact_rate, ptp_rate')
          .in('officer_id', officerIds)
          .gte('summary_date', startDate.toISOString().split('T')[0])
          .lte('summary_date', endDate.toISOString().split('T')[0]);

        const totalCollected = teamData?.reduce((sum, d) => sum + (d.total_collected || 0), 0) || 0;
        const totalCases = teamData?.reduce((sum, d) => sum + (d.total_cases || 0), 0) || 0;
        const avgContactRate = teamData?.length > 0 ?
          teamData.reduce((sum, d) => sum + (d.contact_rate || 0), 0) / teamData.length : 0;
        const avgPtpRate = teamData?.length > 0 ?
          teamData.reduce((sum, d) => sum + (d.ptp_rate || 0), 0) / teamData.length : 0;

        return {
          teamId: team.team_id,
          teamName: team.team_name,
          teamType: team.team_type,
          teamLead: team.manager_id,
          officerCount: officerIds.length,
          totalCollected,
          totalCases,
          avgContactRate,
          avgPtpRate,
          collectionRate: totalCases > 0 ? (totalCollected / totalCases) * 100 : 0
        };
      }));

      return formatApiResponse({
        teamPerformance: teamPerformance.sort((a, b) => b.totalCollected - a.totalCollected),
        totalTeams: teams?.length || 0
      });
    } catch (error) {
      console.error('Get teams performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get officers list
   */
  static async getOfficers(filters = {}) {
    try {
      const { teamId, officerType, status = 'ACTIVE' } = filters;

      let query = supabaseCollection
        .from('collection_officers')
        .select(`
          *,
          collection_teams (
            team_name,
            team_lead
          )
        `);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      if (officerType) {
        query = query.eq('officer_type', officerType);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('officer_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get officers error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get specialists (collection officers)
   */
  static async getSpecialists() {
    try {
      // First get the officers
      const { data: officers, error: officersError } = await supabaseCollection
        .from(TABLES.COLLECTION_OFFICERS)
        .select(`
          officer_id, 
          officer_name, 
          officer_type, 
          team_id, 
          email, 
          contact_number
        `)
        .eq('status', 'ACTIVE')
        .in('officer_type', ['CALL_AGENT', 'FIELD_AGENT', 'SENIOR_COLLECTOR', 'TEAM_LEAD'])
        .order('officer_name');

      if (officersError) throw officersError;

      // If we have officers, get the teams separately
      if (officers && officers.length > 0) {
        const teamIds = [...new Set(officers.map(o => o.team_id).filter(id => id))];
        
        if (teamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabaseCollection
            .from(TABLES.COLLECTION_TEAMS)
            .select('team_id, team_name, team_type')
            .in('team_id', teamIds);

          if (teamsError) {
            console.error('Error fetching teams:', teamsError);
            // Continue without teams data
          } else if (teams) {
            // Create a map for quick lookup
            const teamsMap = teams.reduce((acc, team) => {
              acc[team.team_id] = team;
              return acc;
            }, {});

            // Merge team data with officers
            officers.forEach(officer => {
              if (officer.team_id && teamsMap[officer.team_id]) {
                officer.collection_teams = teamsMap[officer.team_id];
              }
            });
          }
        }
      }

      return formatApiResponse(officers || []);
    } catch (error) {
      console.error('Get specialists error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get comprehensive specialist report with all required data
   */
  static async getSpecialistReport(specialistId, filters = {}) {
    try {
      const {
        dateRange = 'current_month',
        loanStatus = 'all',
        delinquencyBucket = 'all',
        customerType = 'all',
        productType = 'all',
        ptpStatus = 'all'
      } = filters;

      // Get specialist info
      const { data: specialist, error: specialistError } = await supabaseCollection
        .from('collection_officers')
        .select('*')
        .eq('officer_id', specialistId)
        .single();

      if (specialistError) throw specialistError;

      // Get cases assigned to specialist with all loan details
      let casesQuery = supabaseCollection
        .from('collection_cases')
        .select(`
          *,
          loan_accounts!loan_account_number (
            *,
            products!product_id (
              product_name,
              product_type
            ),
            loan_schedules!loan_account_number (
              installment_number,
              due_date,
              principal_amount,
              interest_amount,
              paid_date,
              paid_amount,
              status
            )
          ),
          customers!customer_id (
            full_name,
            customer_type,
            national_id,
            customer_contacts!customer_id (
              contact_type,
              contact_value
            )
          )
        `)
        .eq('assigned_to', specialistId)
        .eq('case_status', 'ACTIVE');

      // Apply date range filter
      const dateRangeStart = this.getDateRangeStart(dateRange);
      if (dateRangeStart) {
        casesQuery = casesQuery.gte('created_at', dateRangeStart);
      }

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) throw casesError;

      // Get communication logs for the specialist
      const { data: communicationLogs, error: commError } = await supabaseCollection
        .from('collection_interactions')
        .select(`
          *,
          collection_cases!case_id (
            loan_account_number,
            customer_id
          )
        `)
        .eq('officer_id', specialistId)
        .gte('interaction_datetime', this.getDateRangeStart(dateRange))
        .order('interaction_datetime', { ascending: false });

      // Get promises to pay
      const { data: promisesToPay, error: ptpError } = await supabaseCollection
        .from('promise_to_pay')
        .select(`
          *,
          collection_cases!case_id (
            loan_account_number,
            customer_id,
            customers!customer_id (
              full_name
            )
          )
        `)
        .eq('officer_id', specialistId)
        .order('ptp_date', { ascending: true });

      // Process and enrich loan data
      const enrichedLoans = cases?.map(caseItem => {
        const loan = caseItem.kastle_banking?.loan_accounts;
        const customer = caseItem.kastle_banking?.customers;
        const schedules = loan?.kastle_banking?.loan_schedules || [];
        
        // Calculate payment details
        const totalLoanAmount = loan?.loan_amount || 0;
        const paidAmount = schedules
          .filter(s => s.status === 'PAID')
          .reduce((sum, s) => sum + (s.paid_amount || 0), 0);
        const dueAmount = schedules
          .filter(s => s.status === 'DUE' && new Date(s.due_date) <= new Date())
          .reduce((sum, s) => sum + (s.principal_amount + s.interest_amount || 0), 0);
        const overdueAmount = loan?.overdue_amount || dueAmount;
        const notDueAmount = totalLoanAmount - paidAmount - dueAmount;
        
        // Get communication stats for this loan
        const loanCommunications = communicationLogs?.filter(
          log => log.kastle_collection?.collection_cases?.loan_account_number === loan?.loan_account_number
        ) || [];
        
        const callsThisMonth = loanCommunications.filter(c => c.interaction_type === 'CALL').length;
        const messagesThisMonth = loanCommunications.filter(c => 
          c.interaction_type === 'SMS' || c.interaction_type === 'EMAIL'
        ).length;
        
        const lastCall = loanCommunications
          .filter(c => c.interaction_type === 'CALL')
          .sort((a, b) => new Date(b.interaction_datetime) - new Date(a.interaction_datetime))[0];
        
        // Get PTP for this loan
        const activePTP = promisesToPay?.find(
          ptp => ptp.kastle_collection?.collection_cases?.loan_account_number === loan?.loan_account_number &&
                 ptp.status === 'ACTIVE'
        );
        
        // Process installment details
        const installmentDetails = schedules
          .sort((a, b) => a.installment_number - b.installment_number)
          .map(schedule => ({
            installmentNumber: schedule.installment_number,
            dueDate: schedule.due_date,
            amount: schedule.principal_amount + schedule.interest_amount,
            paidDate: schedule.paid_date,
            paidAmount: schedule.paid_amount,
            overdueDays: schedule.status === 'OVERDUE' ? 
              Math.floor((new Date() - new Date(schedule.due_date)) / (1000 * 60 * 60 * 24)) : 0,
            status: schedule.status
          }));

        return {
          // Customer data
          customerId: customer?.national_id || caseItem.customer_id,
          customerName: customer?.full_name || 'Unknown',
          customerType: customer?.customer_type || 'INDIVIDUAL',
          customerPhone: customer?.kastle_banking?.customer_contacts
            ?.find(c => c.contact_type === 'MOBILE')?.contact_value || 'N/A',
          
          // Loan identification
          loanNumber: loan?.loan_account_number || caseItem.loan_account_number,
          caseNumber: caseItem.case_number,
          
          // Loan details
          loanStartDate: loan?.loan_start_date,
          maturityDate: loan?.maturity_date,
          totalLoanAmount,
          
          // Payment details
          paidAmount,
          dueAmount,
          notDueAmount,
          totalOverdueAmount: overdueAmount,
          
          // Delinquency details
          delinquencyBucket: this.getDelinquencyBucket(caseItem.days_past_due),
          totalOverdueDays: caseItem.days_past_due || 0,
          installmentDetails,
          
          // Product and status
          productType: loan?.kastle_banking?.products?.product_type || 'Unknown',
          loanStatus: loan?.loan_status || 'ACTIVE',
          
          // Communication data
          lastContactDate: lastCall?.interaction_datetime || caseItem.last_contact_date,
          callsThisMonth,
          messagesThisMonth,
          lastCallResult: lastCall?.outcome || 'No calls made',
          
          // Promise to Pay
          hasPromiseToPay: !!activePTP,
          ptpDate: activePTP?.ptp_date,
          ptpAmount: activePTP?.ptp_amount,
          ptpStatus: activePTP?.status
        };
      }) || [];

      // Apply filters
      const filteredLoans = enrichedLoans.filter(loan => {
        const matchesStatus = loanStatus === 'all' || loan.loanStatus === loanStatus;
        const matchesBucket = delinquencyBucket === 'all' || loan.delinquencyBucket === delinquencyBucket;
        const matchesCustomerType = customerType === 'all' || loan.customerType === customerType;
        const matchesProductType = productType === 'all' || loan.productType === productType;
        const matchesPTPStatus = ptpStatus === 'all' || 
          (ptpStatus === 'has_ptp' && loan.hasPromiseToPay) ||
          (ptpStatus === 'no_ptp' && !loan.hasPromiseToPay);

        return matchesStatus && matchesBucket && matchesCustomerType && matchesProductType && matchesPTPStatus;
      });

      // Calculate performance metrics
      const performance = await this.calculateSpecialistPerformance(
        specialistId, 
        filteredLoans, 
        communicationLogs,
        promisesToPay,
        dateRange
      );

      // Calculate KPIs
      const totalLoans = filteredLoans.length;
      const totalPortfolioValue = filteredLoans.reduce((sum, l) => sum + (l.totalLoanAmount || 0), 0);
      const overdueLoans = filteredLoans.filter(l => l.totalOverdueDays > 0).length;
      const totalOverdueAmount = filteredLoans.reduce((sum, l) => sum + (l.totalOverdueAmount || 0), 0);

      const kpis = {
        totalLoans,
        totalPortfolioValue,
        overdueLoans,
        totalOverdueAmount,
        collectionRate: performance?.collection_rate || 0,
        callsMade: communicationLogs?.filter(l => l.interaction_type === 'CALL').length || 0,
        messagesSent: communicationLogs?.filter(l => 
          l.interaction_type === 'SMS' || l.interaction_type === 'EMAIL'
        ).length || 0,
        promisesToPay: promisesToPay?.filter(p => p.status === 'ACTIVE').length || 0,
        promisesFulfilled: promisesToPay?.filter(p => p.status === 'KEPT').length || 0,
        averageResponseRate: performance?.contact_rate || 0
      };

      // Prepare communication data for charts
      const communicationData = this.aggregateCommunicationByDay(communicationLogs);

      return formatApiResponse({
        specialist,
        kpis,
        loans: filteredLoans,
        communicationData,
        promisesToPay: promisesToPay || [],
        performance: {
          collectionRate: performance?.collection_rate || 0,
          responseRate: performance?.contact_rate || 0,
          promiseRate: performance?.promise_rate || 0,
          fulfillmentRate: performance?.fulfillment_rate || 0
        }
      });
    } catch (error) {
      console.error('Specialist report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Create a new collection case
   */
  static async createCollectionCase(caseData) {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_cases')
        .insert([{
          ...caseData,
          case_number: `CASE-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create initial collection score
      await supabaseCollection
        .from('collection_scores')
        .insert([{
          case_id: data.case_id,
          score_date: new Date().toISOString(),
          collection_score: 0,
          risk_score: caseData.risk_score || 50,
          priority_score: caseData.priority_score || 50
        }]);

      return formatApiResponse(data);
    } catch (error) {
      console.error('Create collection case error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Update collection case
   */
  static async updateCollectionCase(caseId, updates) {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('case_id', caseId)
        .select()
        .single();

      if (error) throw error;

      return formatApiResponse(data);
    } catch (error) {
      console.error('Update collection case error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Log collection interaction
   */
  static async logInteraction(interactionData) {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_interactions')
        .insert([{
          ...interactionData,
          interaction_datetime: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update case last contact date
      await this.updateCollectionCase(interactionData.case_id, {
        last_contact_date: new Date().toISOString()
      });

      return formatApiResponse(data);
    } catch (error) {
      console.error('Log interaction error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Create promise to pay
   */
  static async createPromiseToPay(ptpData) {
    try {
      const { data, error } = await supabaseCollection
        .from('promise_to_pay')
        .insert([{
          ...ptpData,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return formatApiResponse(data);
    } catch (error) {
      console.error('Create PTP error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Update promise to pay status
   */
  static async updatePromiseToPay(ptpId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      if (status === 'KEPT') {
        updateData.kept_date = new Date().toISOString();
      } else if (status === 'BROKEN') {
        updateData.broken_date = new Date().toISOString();
      }

      const { data, error } = await supabaseCollection
        .from('promise_to_pay')
        .update(updateData)
        .eq('ptp_id', ptpId)
        .select()
        .single();

      if (error) throw error;

      return formatApiResponse(data);
    } catch (error) {
      console.error('Update PTP error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Schedule field visit
   */
  static async scheduleFieldVisit(visitData) {
    try {
      const { data, error } = await supabaseCollection
        .from('field_visits')
        .insert([{
          ...visitData,
          status: 'SCHEDULED',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return formatApiResponse(data);
    } catch (error) {
      console.error('Schedule field visit error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Helper method to get date range start
   */
  static getDateRangeStart(dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'current_month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'last_month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString();
      case 'current_year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }

  /**
   * Get delinquency bucket based on days past due
   */
  static getDelinquencyBucket(daysPastDue) {
    if (daysPastDue <= 0) return 'Current';
    if (daysPastDue <= 30) return '1-30 Days';
    if (daysPastDue <= 60) return '31-60 Days';
    if (daysPastDue <= 90) return '61-90 Days';
    if (daysPastDue <= 180) return '91-180 Days';
    if (daysPastDue <= 360) return '181-360 Days';
    return '>360 Days';
  }

  /**
   * Calculate specialist performance metrics
   */
  static async calculateSpecialistPerformance(specialistId, loans, communications, ptps, dateRange) {
    const totalCalls = communications?.filter(c => c.interaction_type === 'CALL').length || 0;
    const answeredCalls = communications?.filter(c => 
      c.interaction_type === 'CALL' && 
      (c.outcome?.includes('Answered') || c.outcome?.includes('تم الرد'))
    ).length || 0;
    
    const contactRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
    
    const totalPTPs = ptps?.length || 0;
    const keptPTPs = ptps?.filter(p => p.status === 'KEPT').length || 0;
    const fulfillmentRate = totalPTPs > 0 ? (keptPTPs / totalPTPs) * 100 : 0;
    
    const loansWithPTP = loans?.filter(l => l.hasPromiseToPay).length || 0;
    const promiseRate = loans?.length > 0 ? (loansWithPTP / loans.length) * 100 : 0;
    
    // Calculate collection rate
    const totalDue = loans?.reduce((sum, l) => sum + (l.dueAmount || 0), 0) || 0;
    const totalPaid = loans?.reduce((sum, l) => sum + (l.paidAmount || 0), 0) || 0;
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
    
    return {
      collection_rate: collectionRate,
      contact_rate: contactRate,
      promise_rate: promiseRate,
      fulfillment_rate: fulfillmentRate
    };
  }

  /**
   * Aggregate communication data by day
   */
  static aggregateCommunicationByDay(communications) {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayData = {};
    
    // Initialize all days
    days.forEach(day => {
      dayData[day] = { day, calls: 0, messages: 0, answered: 0 };
    });
    
    // Aggregate data
    communications?.forEach(comm => {
      const date = new Date(comm.interaction_datetime);
      const dayName = days[date.getDay()];
      
      if (comm.interaction_type === 'CALL') {
        dayData[dayName].calls++;
        if (comm.outcome?.includes('Answered') || comm.outcome?.includes('تم الرد')) {
          dayData[dayName].answered++;
        }
      } else if (comm.interaction_type === 'SMS' || comm.interaction_type === 'EMAIL') {
        dayData[dayName].messages++;
      }
    });
    
    return Object.values(dayData);
  }

  /**
   * Group PTP data by week
   */
  static groupPTPByWeek(ptpData) {
    const weeks = {};
    
    ptpData?.forEach(ptp => {
      const date = new Date(ptp.created_at);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: weekKey,
          total: 0,
          kept: 0,
          broken: 0,
          active: 0,
          totalAmount: 0
        };
      }
      
      weeks[weekKey].total++;
      weeks[weekKey].totalAmount += ptp.ptp_amount || 0;
      
      switch (ptp.status) {
        case 'KEPT':
          weeks[weekKey].kept++;
          break;
        case 'BROKEN':
          weeks[weekKey].broken++;
          break;
        case 'ACTIVE':
          weeks[weekKey].active++;
          break;
      }
    });
    
    return Object.values(weeks);
  }

  /**
   * Calculate trend (increasing, decreasing, stable)
   */
  static calculateTrend(values) {
    if (!values || values.length < 2) return 'stable';
    
    const recentValues = values.slice(-5); // Last 5 data points
    const avgRecent = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    const avgPrevious = values.slice(-10, -5).reduce((sum, v) => sum + v, 0) / 5;
    
    const changePercent = ((avgRecent - avgPrevious) / avgPrevious) * 100;
    
    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get teams
   */
  static async getTeams() {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_teams')
        .select('*')
        .order('team_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get teams error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection strategies
   */
  static async getStrategies() {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_strategies')
        .select('*')
        .eq('is_active', true)
        .order('strategy_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get strategies error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection buckets
   */
  static async getBuckets() {
    try {
      const { data, error } = await supabaseCollection
        .from('collection_buckets')
        .select('*')
        .order('min_days');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get buckets error:', error);
      return formatApiResponse(null, error);
    }
  }
}