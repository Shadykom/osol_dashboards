import { 
  supabase,
  supabaseBanking,
  supabaseCollection, 
  TABLES, 
  formatApiResponse, 
  handleSupabaseError,
  isSupabaseConfigured,
  getClientForTable 
} from '../lib/supabase.js';

/**
 * Collection Service with correct schema references
 */
export class CollectionService {

  /**
   * Check if database is available
   */
  static async checkDatabaseConnection() {
    if (!isSupabaseConfigured) {
      return false;
    }
    
    try {
      // collection_cases is in banking schema
      const { error } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('case_id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get collection overview with correct schema references
   */
  static async getCollectionOverview() {
    try {
      const isConnected = await this.checkDatabaseConnection();
      
      if (!isConnected) {
        return formatApiResponse(this.getMockOverviewData());
      }

      // collection_cases is in banking schema
      const casesResponse = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select('case_status, total_outstanding, days_past_due');

      // daily_collection_summary is in collection schema
      const summaryResponse = await supabaseCollection
        .from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select('total_collected, collection_rate')
        .order('summary_date', { ascending: false })
        .limit(30);

      if (casesResponse.error || summaryResponse.error) {
        throw casesResponse.error || summaryResponse.error;
      }

      const cases = casesResponse.data || [];
      const summaries = summaryResponse.data || [];

      const overview = {
        totalCases: cases.length,
        activeCases: cases.filter(c => c.case_status === 'ACTIVE').length,
        totalOutstanding: cases.reduce((sum, c) => sum + parseFloat(c.total_outstanding || 0), 0),
        monthlyRecovery: summaries.reduce((sum, s) => sum + parseFloat(s.total_collected || 0), 0),
        collectionRate: summaries.length > 0 
          ? summaries.reduce((sum, s) => sum + parseFloat(s.collection_rate || 0), 0) / summaries.length
          : 0,
        statusDistribution: this.calculateStatusDistribution(cases),
        bucketDistribution: this.calculateBucketDistribution(cases)
      };

      return formatApiResponse(overview);
    } catch (error) {
      console.error('Collection overview error:', error);
      return formatApiResponse(this.getMockOverviewData());
    }
  }

  /**
   * Get collection cases with customer info
   */
  static async getCollectionCases(params = {}) {
    try {
      const { limit = 200, offset = 0, status = null } = params;

      const isConnected = await this.checkDatabaseConnection();
      
      if (!isConnected) {
        return formatApiResponse(this.getMockCasesData());
      }

      // Build query - collection_cases is in banking schema
      let query = supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          case_id,
          case_number,
          customer_id,
          account_number,
          total_outstanding,
          days_past_due,
          case_status,
          priority,
          assigned_to,
          branch_id,
          customers!inner(
            customer_id,
            full_name,
            customer_contacts(
              contact_type,
              contact_value
            )
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('case_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = (data || []).map(c => {
        const phoneContact = c.customers?.customer_contacts?.find(
          contact => contact.contact_type === 'MOBILE'
        );
        
        return {
          caseId: c.case_id,
          caseNumber: c.case_number,
          customerName: c.customers?.full_name || 'Unknown',
          customerPhone: phoneContact?.contact_value || 'N/A',
          accountNumber: c.account_number,
          totalOutstanding: parseFloat(c.total_outstanding || 0),
          daysPastDue: c.days_past_due || 0,
          status: c.case_status,
          priority: c.priority || 'MEDIUM',
          assignedTo: c.assigned_to
        };
      });

      return formatApiResponse(transformedData);
    } catch (error) {
      console.error('Collection cases error:', error);
      return formatApiResponse(this.getMockCasesData());
    }
  }

  /**
   * Get case details with all related data
   */
  static async getCaseDetails(caseId) {
    try {
      const isConnected = await this.checkDatabaseConnection();
      
      if (!isConnected) {
        return formatApiResponse(this.getMockCaseDetails(caseId));
      }

      // Get case info from banking schema
      const caseInfoResponse = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          *,
          customers!inner(
            customer_id,
            full_name,
            first_name,
            last_name,
            customer_contacts(
              contact_type,
              contact_value
            )
          )
        `)
        .eq('case_id', caseId)
        .single();

      // Get interactions from collection schema
      const interactionsResponse = await supabaseCollection
        .from(TABLES.COLLECTION_INTERACTIONS)
        .select(`
          *,
          collection_officers(
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('interaction_datetime', { ascending: false });

      // Get promises to pay from collection schema
      const ptpResponse = await supabaseCollection
        .from(TABLES.PROMISE_TO_PAY)
        .select(`
          *,
          collection_officers(
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('ptp_date', { ascending: false });

      // Get field visits from collection schema
      const visitsResponse = await supabaseCollection
        .from(TABLES.FIELD_VISITS)
        .select(`
          *,
          collection_officers(
            officer_name
          )
        `)
        .eq('case_id', caseId)
        .order('visit_date', { ascending: false });

      // Get legal case from collection schema
      const legalResponse = await supabaseCollection
        .from(TABLES.LEGAL_CASES)
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();

      const details = {
        caseInfo: {
          ...caseInfoResponse.data,
          kastle_banking: {
            full_name: caseInfoResponse.data?.customers?.full_name,
            phone_number: caseInfoResponse.data?.customers?.customer_contacts?.find(
              c => c.contact_type === 'MOBILE'
            )?.contact_value,
            email: caseInfoResponse.data?.customers?.customer_contacts?.find(
              c => c.contact_type === 'EMAIL'
            )?.contact_value
          }
        },
        interactions: interactionsResponse.data?.map(i => ({
          ...i,
          kastle_collection: i.collection_officers
        })) || [],
        promisesToPay: ptpResponse.data?.map(p => ({
          ...p,
          kastle_collection: p.collection_officers
        })) || [],
        fieldVisits: visitsResponse.data?.map(v => ({
          ...v,
          kastle_collection: v.collection_officers
        })) || [],
        legalCase: legalResponse.data
      };

      return formatApiResponse(details);
    } catch (error) {
      console.error('Case details error:', error);
      return formatApiResponse(this.getMockCaseDetails(caseId));
    }
  }

  /**
   * Get collection performance
   */
  static async getCollectionPerformance(period = 'monthly') {
    try {
      const isConnected = await this.checkDatabaseConnection();
      
      if (!isConnected) {
        return formatApiResponse(this.getMockPerformanceData());
      }

      const dateFilter = this.getDateFilter(period);
      
      // Get daily summary from collection schema
      const { data, error } = await supabaseCollection
        .from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select('*')
        .gte('summary_date', dateFilter)
        .order('summary_date', { ascending: true });

      if (error) throw error;

      const performance = {
        dailyTrends: data || [],
        topOfficers: await this.getTopOfficers(),
        teamComparison: await this.getTeamComparison(),
        campaignEffectiveness: await this.getCampaignEffectiveness()
      };

      return formatApiResponse(performance);
    } catch (error) {
      console.error('Collection performance error:', error);
      return formatApiResponse(this.getMockPerformanceData());
    }
  }

  /**
   * Get top performing officers
   */
  static async getTopOfficers() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get officer performance from collection schema
      const { data } = await supabaseCollection
        .from(TABLES.OFFICER_PERFORMANCE_METRICS)
        .select(`
          officer_id,
          amount_collected,
          quality_score,
          collection_officers!inner(
            officer_id,
            officer_name,
            officer_type
          )
        `)
        .eq('metric_date', today)
        .order('amount_collected', { ascending: false })
        .limit(10);

      return data?.map(d => ({
        officerId: d.officer_id,
        officerName: d.collection_officers?.officer_name,
        officerType: d.collection_officers?.officer_type,
        totalCollected: d.amount_collected,
        qualityScore: d.quality_score
      })) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get team comparison
   */
  static async getTeamComparison() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get team performance from collection schema
      const { data } = await supabaseCollection
        .from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select(`
          team_id,
          total_collected,
          collection_teams!inner(
            team_id,
            team_name
          )
        `)
        .eq('summary_date', today)
        .not('team_id', 'is', null);

      return data?.map(d => ({
        teamName: d.collection_teams?.team_name || `Team ${d.team_id}`,
        totalCollected: d.total_collected
      })) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get campaign effectiveness
   */
  static async getCampaignEffectiveness() {
    try {
      // Get active campaigns from collection schema
      const { data } = await supabaseCollection
        .from(TABLES.COLLECTION_CAMPAIGNS)
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5);

      return data?.map(c => ({
        campaignName: c.campaign_name,
        campaignType: c.campaign_type,
        targetRecovery: c.target_recovery,
        actualRecovery: c.actual_recovery,
        successRate: c.success_rate || 0,
        roi: c.roi || 0
      })) || [];
    } catch {
      return [];
    }
  }

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
   * Get NPF trend analysis
   */
  static async getNPFTrend(period = 'monthly') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      // Get collection cases from banking schema
      const { data, error } = await supabaseBanking
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
   * Get bucket distribution
   */
  static async getBucketDistribution() {
    try {
      // Get collection cases with bucket info from banking schema
      const { data, error } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          days_past_due,
          total_outstanding,
          bucket_id,
          collection_buckets(
            bucket_code,
            bucket_name
          )
        `)
        .eq('case_status', 'ACTIVE');

      if (error) throw error;

      const buckets = {};
      data?.forEach(case_ => {
        const bucketName = case_.collection_buckets?.bucket_name || this.getDPDBucket(case_.days_past_due);
        if (!buckets[bucketName]) {
          buckets[bucketName] = { count: 0, amount: 0 };
        }
        buckets[bucketName].count++;
        buckets[bucketName].amount += parseFloat(case_.total_outstanding || 0);
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
      // Get top defaulters from banking schema with customer info
      const { data, error } = await supabaseBanking
        .from(TABLES.COLLECTION_CASES)
        .select(`
          customer_id,
          total_outstanding,
          days_past_due,
          customers(
            full_name
          )
        `)
        .eq('case_status', 'ACTIVE')
        .order('total_outstanding', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map(d => ({
        customer_id: d.customer_id,
        customer_name: d.customers?.full_name || 'Unknown',
        total_outstanding: d.total_outstanding,
        days_past_due: d.days_past_due
      })) || [];
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
      
      // Get branch performance from collection schema
      const { data, error } = await supabaseCollection
        .from(TABLES.DAILY_COLLECTION_SUMMARY)
        .select(`
          branch_id,
          total_due_amount,
          total_collected,
          collection_rate
        `)
        .gte('summary_date', dateFilter);

      if (error) throw error;

      // Group by branch
      const branchData = {};
      data?.forEach(summary => {
        const branchId = summary.branch_id || 'UNKNOWN';
        if (!branchData[branchId]) {
          branchData[branchId] = { 
            outstanding: 0, 
            collected: 0,
            count: 0,
            totalRate: 0
          };
        }
        branchData[branchId].outstanding += parseFloat(summary.total_due_amount) || 0;
        branchData[branchId].collected += parseFloat(summary.total_collected) || 0;
        branchData[branchId].totalRate += parseFloat(summary.collection_rate) || 0;
        branchData[branchId].count++;
      });

      return Object.entries(branchData).map(([branchId, data]) => ({
        branchId,
        outstanding: data.outstanding,
        collected: data.collected,
        collectionRate: data.count > 0 ? (data.totalRate / data.count).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('Branch performance error:', error);
      return [];
    }
  }

  /**
   * Get portfolio health score
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

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static calculateStatusDistribution(cases) {
    const statusCounts = {};
    cases.forEach(c => {
      statusCounts[c.case_status] = (statusCounts[c.case_status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
  }

  static calculateBucketDistribution(cases) {
    const buckets = {};
    cases.forEach(c => {
      const bucket = this.getDPDBucket(c.days_past_due);
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    
    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count
    }));
  }

  static getDPDBucket(dpd) {
    if (dpd <= 0) return 'CURRENT';
    if (dpd <= 30) return 'BUCKET_1';
    if (dpd <= 60) return 'BUCKET_2';
    if (dpd <= 90) return 'BUCKET_3';
    if (dpd <= 180) return 'BUCKET_4';
    return 'BUCKET_5';
  }

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
      default:
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
    }
  }

  static async calculateCollectionEfficiency() {
    // Implement collection efficiency calculation
    return 78;
  }

  static async calculateRiskManagement() {
    return 65;
  }

  static async calculateCustomerContact() {
    return 82;
  }

  static async calculateDigitalAdoption() {
    return 70;
  }

  static async calculateCompliance() {
    return 68;
  }

  static async calculateFirstPaymentDefaultRate() {
    return 2.3;
  }

  static async calculateRollRate(bucket) {
    return 15.2;
  }

  static async calculateContactRate() {
    return 68.5;
  }

  static async calculatePTPKeepRate() {
    return 82.3;
  }

  static async calculateLegalSuccessRate() {
    return 45.8;
  }

  static getStrategicInitiatives() {
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
  // MOCK DATA METHODS
  // ============================================================================

  static getMockOverviewData() {
    return {
      totalCases: 1847,
      activeCases: 1523,
      totalOutstanding: 45200000,
      monthlyRecovery: 12800000,
      collectionRate: 68.5,
      statusDistribution: [
        { status: 'ACTIVE', count: 1523 },
        { status: 'RESOLVED', count: 234 },
        { status: 'LEGAL', count: 90 }
      ],
      bucketDistribution: [
        { bucket: 'CURRENT', count: 450 },
        { bucket: 'BUCKET_1', count: 520 },
        { bucket: 'BUCKET_2', count: 380 },
        { bucket: 'BUCKET_3', count: 297 },
        { bucket: 'BUCKET_4', count: 200 }
      ]
    };
  }

  static getMockCasesData() {
    return [
      {
        caseId: 1,
        caseNumber: 'COL-2024-001',
        customerName: 'Ahmed Al-Rashid',
        customerPhone: '+966501234567',
        accountNumber: 'ACC1234567890',
        totalOutstanding: 125000,
        daysPastDue: 45,
        status: 'ACTIVE',
        priority: 'HIGH',
        assignedTo: 'Mohammed Ali'
      },
      {
        caseId: 2,
        caseNumber: 'COL-2024-002',
        customerName: 'Fatima Al-Zahra',
        customerPhone: '+966502345678',
        accountNumber: 'ACC2345678901',
        totalOutstanding: 85000,
        daysPastDue: 30,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        assignedTo: 'Sara Ahmed'
      },
      {
        caseId: 3,
        caseNumber: 'COL-2024-003',
        customerName: 'Gulf Trading Co.',
        customerPhone: '+966503456789',
        accountNumber: 'ACC3456789012',
        totalOutstanding: 450000,
        daysPastDue: 90,
        status: 'LEGAL',
        priority: 'CRITICAL',
        assignedTo: 'Legal Team'
      }
    ];
  }

  static getMockCaseDetails(caseId) {
    return {
      caseInfo: {
        case_id: caseId,
        case_number: `COL-2024-${String(caseId).padStart(3, '0')}`,
        customer_name: 'Ahmed Al-Rashid',
        total_outstanding: 125000,
        principal_outstanding: 100000,
        interest_outstanding: 20000,
        penalty_outstanding: 5000,
        kastle_banking: {
          full_name: 'Ahmed Abdullah Al-Rashid',
          phone_number: '+966501234567',
          email: 'ahmed.rashid@email.com'
        }
      },
      interactions: [
        {
          interaction_id: 1,
          interaction_type: 'CALL',
          interaction_datetime: new Date().toISOString(),
          outcome: 'CONTACTED',
          notes: 'Customer promised to pay by month end',
          kastle_collection: {
            officer_name: 'Mohammed Ali'
          }
        }
      ],
      promisesToPay: [
        {
          ptp_id: 1,
          ptp_amount: 50000,
          ptp_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ptp_type: 'PARTIAL',
          status: 'ACTIVE',
          amount_received: 0,
          kastle_collection: {
            officer_name: 'Mohammed Ali'
          }
        }
      ],
      fieldVisits: [],
      legalCase: null
    };
  }

  static getMockPerformanceData() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        summary_date: date.toISOString().split('T')[0],
        total_collected: Math.floor(Math.random() * 1000000) + 500000,
        collection_rate: Math.floor(Math.random() * 30) + 50
      });
    }

    return {
      dailyTrends: days,
      topOfficers: [
        { 
          officerId: 'OFF001',
          officerName: 'Mohammed Ali',
          officerType: 'Senior',
          totalCollected: 2500000,
          qualityScore: 8.5
        },
        { 
          officerId: 'OFF002',
          officerName: 'Sara Ahmed',
          officerType: 'Senior',
          totalCollected: 2200000,
          qualityScore: 8.2
        }
      ],
      teamComparison: [
        { teamName: 'Team A', totalCollected: 5200000 },
        { teamName: 'Team B', totalCollected: 4800000 }
      ],
      campaignEffectiveness: [
        {
          campaignName: 'Q1 Recovery Drive',
          campaignType: 'Phone',
          targetRecovery: 10000000,
          actualRecovery: 8500000,
          successRate: 85,
          roi: 320
        }
      ]
    };
  }
}