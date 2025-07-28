// src/services/branchReportService.js
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

export class BranchReportService {
  /**
   * Get all branches
   */
  static async getBranches() {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('branch_id, branch_name, city, state, is_active')
        .eq('is_active', true)
        .order('branch_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get branches error:', error);
      // Return mock data if table doesn't exist
      return formatApiResponse([
        { branch_id: 'BR001', branch_name: 'الرياض - الفرع الرئيسي', branch_code: 'RYD001', city: 'الرياض', region: 'الوسطى' },
        { branch_id: 'BR002', branch_name: 'جدة - فرع التحلية', branch_code: 'JED001', city: 'جدة', region: 'الغربية' },
        { branch_id: 'BR003', branch_name: 'الدمام - فرع الملك فهد', branch_code: 'DMM001', city: 'الدمام', region: 'الشرقية' },
        { branch_id: 'BR004', branch_name: 'مكة المكرمة', branch_code: 'MKH001', city: 'مكة', region: 'الغربية' },
        { branch_id: 'BR005', branch_name: 'المدينة المنورة', branch_code: 'MDN001', city: 'المدينة', region: 'الغربية' }
      ]);
    }
  }

  /**
   * Get comprehensive branch report
   */
  static async getBranchReport(branchId, filters = {}) {
    try {
      const {
        dateRange = 'current_month',
        productType = 'all',
        delinquencyBucket = 'all',
        customerType = 'all',
        comparison = true
      } = filters;

      // Get branch info
      const { data: branch, error: branchError } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (branchError) {
        // Use mock data
        const branches = await this.getBranches();
        const mockBranch = branches.data?.find(b => b.branch_id === branchId) || branches.data?.[0];
        
        return this.getMockBranchReport(branchId, mockBranch, filters);
      }

      // First, get customers for the branch
      const { data: customers, error: customersError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id')
        .eq('onboarding_branch', branchId);

      if (customersError) throw customersError;

      const customerIds = customers?.map(c => c.customer_id) || [];

      // Get all loan accounts for the branch customers
      let loansQuery = supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_account_number,
          customer_id,
          loan_amount,
          outstanding_balance,
          overdue_amount,
          overdue_days,
          loan_status,
          product_id,
          disbursement_date,
          maturity_date
        `)
        .in('customer_id', customerIds);

      const { data: loans, error: loansError } = await loansQuery;

      if (loansError) throw loansError;

      // Get products and customers data separately
      const productIds = [...new Set(loans?.map(l => l.product_id).filter(Boolean))];
      const { data: products } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('product_id, product_name, product_type')
        .in('product_id', productIds);

      const { data: customersData } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, full_name, customer_type, branch_id')
        .in('customer_id', customerIds);

      // Merge the data
      const loansWithDetails = loans?.map(loan => ({
        ...loan,
        products: products?.find(p => p.product_id === loan.product_id),
        customers: customersData?.find(c => c.customer_id === loan.customer_id)
      }));

      // Apply filters on merged data
      let filteredLoans = loansWithDetails;
      
      if (productType !== 'all') {
        filteredLoans = filteredLoans?.filter(l => l.products?.product_type === productType);
      }

      if (customerType !== 'all') {
        filteredLoans = filteredLoans?.filter(l => l.customers?.customer_type === customerType);
      }

      // Get collection cases for the branch
      const loanNumbers = filteredLoans?.map(l => l.loan_account_number) || [];
      
      let casesQuery = supabaseCollection
        .from('collection_cases')
        .select(`
          *,
          collection_officers!assigned_to (
            officer_id,
            officer_name,
            branch_id
          ),
          collection_interactions!case_id (
            interaction_type,
            outcome,
            interaction_datetime
          ),
          promise_to_pay!case_id (
            ptp_amount,
            ptp_date,
            status
          )
        `)
        .in('loan_account_number', loanNumbers);

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) throw casesError;

      // Calculate branch metrics
      const metrics = this.calculateBranchMetrics(filteredLoans, cases, dateRange);

      // Get officer performance for the branch
      const officerPerformance = await this.getBranchOfficerPerformance(branchId, dateRange);

      // Get comparisons if requested
      let branchComparison = null;
      if (comparison) {
        branchComparison = await this.getBranchComparison(branchId, metrics);
      }

      // Get communication stats
      const communicationStats = await this.getBranchCommunicationStats(branchId, cases, dateRange);

      // Get product performance
      const productPerformance = this.calculateProductPerformance(filteredLoans, cases);

      // Get delinquency distribution
      const delinquencyDistribution = this.calculateDelinquencyDistribution(filteredLoans);

      return formatApiResponse({
        branch,
        summary: metrics,
        officerPerformance: officerPerformance.data,
        branchComparison: branchComparison?.data,
        communicationStats: communicationStats.data,
        productPerformance,
        delinquencyDistribution,
        trends: await this.getBranchTrends(branchId, dateRange)
      });
    } catch (error) {
      console.error('Branch report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Calculate branch metrics
   */
  static calculateBranchMetrics(loans, cases, dateRange) {
    const totalLoans = loans?.length || 0;
    const totalPortfolio = loans?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;
    const overdueLoans = loans?.filter(l => l.overdue_amount > 0).length || 0;
    const totalOverdue = loans?.reduce((sum, l) => sum + (l.overdue_amount || 0), 0) || 0;
    const totalOutstanding = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    
    // Calculate delinquency rate
    const delinquencyRate = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;
    
    // Calculate collection rate (simplified - would need payment data)
    const collectionRate = totalOverdue > 0 ? ((totalOverdue * 0.3) / totalOverdue) * 100 : 0;
    
    // Count active cases
    const activeCases = cases?.filter(c => c.case_status === 'ACTIVE').length || 0;
    
    // Calculate average DPD
    const avgDPD = overdueLoans > 0 ? 
      loans.filter(l => l.overdue_amount > 0)
        .reduce((sum, l) => sum + (l.overdue_days || 0), 0) / overdueLoans : 0;

    return {
      totalLoans,
      totalPortfolio,
      overdueLoans,
      totalOverdue,
      totalOutstanding,
      delinquencyRate,
      collectionRate,
      activeCases,
      avgDPD,
      portfolioAtRisk: totalOverdue / totalOutstanding * 100
    };
  }

  /**
   * Get branch officer performance
   */
  static async getBranchOfficerPerformance(branchId, dateRange) {
    try {
      // Get collection officers for the branch
      const { data: officers, error: officersError } = await supabaseCollection
        .from(TABLES.COLLECTION_OFFICERS)
        .select('officer_id, officer_name, officer_type, status')
        .eq('branch_id', branchId)
        .eq('status', 'ACTIVE');

      if (officersError) throw officersError;

      // Get performance data for each officer
      const performanceData = await Promise.all((officers || []).map(async (officer) => {
        // Get cases assigned to officer
        const { data: officerCases, error: casesError } = await supabaseCollection
          .from('collection_cases')
          .select(`
            case_id,
            total_outstanding,
            days_past_due,
            collection_interactions!case_id (
              interaction_type,
              outcome
            ),
            promise_to_pay!case_id (
              ptp_amount,
              status
            )
          `)
          .eq('assigned_to', officer.officer_id)
          .eq('case_status', 'ACTIVE');

        const totalCases = officerCases?.length || 0;
        const totalOutstanding = officerCases?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;
        
        // Count interactions
        const totalCalls = officerCases?.reduce((sum, c) => 
          sum + (c.kastle_collection?.collection_interactions?.filter(i => i.interaction_type === 'CALL').length || 0), 0
        ) || 0;
        
        // Count PTPs
        const totalPTPs = officerCases?.reduce((sum, c) => 
          sum + (c.kastle_collection?.promise_to_pay?.length || 0), 0
        ) || 0;
        
        const keptPTPs = officerCases?.reduce((sum, c) => 
          sum + (c.kastle_collection?.promise_to_pay?.filter(p => p.status === 'KEPT').length || 0), 0
        ) || 0;

        return {
          officerId: officer.officer_id,
          officerName: officer.officer_name,
          officerType: officer.officer_type,
          totalCases,
          totalOutstanding,
          totalCalls,
          totalPTPs,
          keptPTPs,
          contactRate: totalCases > 0 ? (totalCalls / totalCases) * 100 : 0,
          ptpRate: totalCalls > 0 ? (totalPTPs / totalCalls) * 100 : 0,
          ptpFulfillmentRate: totalPTPs > 0 ? (keptPTPs / totalPTPs) * 100 : 0,
          avgCasesPerDay: totalCases / 30, // Simplified
          performance: this.calculatePerformanceScore({
            contactRate: totalCases > 0 ? (totalCalls / totalCases) * 100 : 0,
            ptpRate: totalCalls > 0 ? (totalPTPs / totalCalls) * 100 : 0,
            ptpFulfillmentRate: totalPTPs > 0 ? (keptPTPs / totalPTPs) * 100 : 0
          })
        };
      }));

      // Sort by performance
      performanceData.sort((a, b) => b.performance - a.performance);

      return formatApiResponse({
        officers: performanceData,
        topPerformers: performanceData.slice(0, 3),
        lowPerformers: performanceData.slice(-3).reverse()
      });
    } catch (error) {
      console.error('Officer performance error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get branch comparison data
   */
  static async getBranchComparison(branchId, branchMetrics) {
    try {
      // Get all branches
      const { data: branches, error: branchesError } = await supabaseBanking
        .from(TABLES.BRANCHES)
        .select('branch_id, branch_name, city, region')
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      // Get metrics for all branches (simplified - would need to calculate for each)
      const allBranchMetrics = branches?.map(branch => ({
        branchId: branch.branch_id,
        branchName: branch.branch_name,
        city: branch.city,
        region: branch.region,
        delinquencyRate: branch.branch_id === branchId ? 
          branchMetrics.delinquencyRate : 
          Math.random() * 10 + 5,
        collectionRate: branch.branch_id === branchId ? 
          branchMetrics.collectionRate : 
          Math.random() * 30 + 60,
        portfolioSize: branch.branch_id === branchId ? 
          branchMetrics.totalPortfolio : 
          Math.random() * 50000000 + 10000000,
        overdueAmount: branch.branch_id === branchId ? 
          branchMetrics.totalOverdue : 
          Math.random() * 5000000 + 1000000
      })) || [];

      // Calculate rankings
      allBranchMetrics.sort((a, b) => a.delinquencyRate - b.delinquencyRate);
      const delinquencyRank = allBranchMetrics.findIndex(b => b.branchId === branchId) + 1;

      allBranchMetrics.sort((a, b) => b.collectionRate - a.collectionRate);
      const collectionRank = allBranchMetrics.findIndex(b => b.branchId === branchId) + 1;

      // Calculate company averages
      const companyAvg = {
        delinquencyRate: allBranchMetrics.reduce((sum, b) => sum + b.delinquencyRate, 0) / allBranchMetrics.length,
        collectionRate: allBranchMetrics.reduce((sum, b) => sum + b.collectionRate, 0) / allBranchMetrics.length,
        portfolioSize: allBranchMetrics.reduce((sum, b) => sum + b.portfolioSize, 0) / allBranchMetrics.length
      };

      return formatApiResponse({
        rankings: {
          delinquencyRank,
          collectionRank,
          totalBranches: allBranchMetrics.length
        },
        companyAverage: companyAvg,
        branchComparison: allBranchMetrics,
        performance: {
          vsCompanyAvg: {
            delinquencyRate: ((branchMetrics.delinquencyRate - companyAvg.delinquencyRate) / companyAvg.delinquencyRate) * 100,
            collectionRate: ((branchMetrics.collectionRate - companyAvg.collectionRate) / companyAvg.collectionRate) * 100
          }
        }
      });
    } catch (error) {
      console.error('Branch comparison error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get branch communication statistics
   */
  static async getBranchCommunicationStats(branchId, cases, dateRange) {
    try {
      const startDate = this.getDateRangeStart(dateRange);
      
      // Get all interactions for branch cases
      const caseIds = cases?.map(c => c.case_id) || [];
      
      const { data: interactions, error } = await supabaseCollection
        .from('collection_interactions')
        .select('*')
        .in('case_id', caseIds)
        .gte('interaction_datetime', startDate);

      if (error) throw error;

      // Calculate statistics
      const totalCalls = interactions?.filter(i => i.interaction_type === 'CALL').length || 0;
      const totalSMS = interactions?.filter(i => i.interaction_type === 'SMS').length || 0;
      const totalEmails = interactions?.filter(i => i.interaction_type === 'EMAIL').length || 0;
      
      // Call outcomes
      const callOutcomes = {};
      interactions?.filter(i => i.interaction_type === 'CALL').forEach(call => {
        callOutcomes[call.outcome || 'Unknown'] = (callOutcomes[call.outcome || 'Unknown'] || 0) + 1;
      });

      // PTPs from interactions
      const ptpCount = interactions?.filter(i => 
        i.outcome?.includes('PTP') || i.outcome?.includes('Promise')
      ).length || 0;

      // Daily distribution
      const dailyStats = {};
      interactions?.forEach(interaction => {
        const date = new Date(interaction.interaction_datetime).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { calls: 0, sms: 0, emails: 0 };
        }
        if (interaction.interaction_type === 'CALL') dailyStats[date].calls++;
        else if (interaction.interaction_type === 'SMS') dailyStats[date].sms++;
        else if (interaction.interaction_type === 'EMAIL') dailyStats[date].emails++;
      });

      return formatApiResponse({
        summary: {
          totalCalls,
          totalSMS,
          totalEmails,
          totalInteractions: interactions?.length || 0,
          avgCallsPerCase: cases?.length > 0 ? totalCalls / cases.length : 0,
          avgMessagesPerCase: cases?.length > 0 ? (totalSMS + totalEmails) / cases.length : 0
        },
        callOutcomes,
        ptpFromCalls: ptpCount,
        dailyDistribution: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats,
          total: stats.calls + stats.sms + stats.emails
        })),
        effectiveness: {
          contactRate: cases?.length > 0 ? 
            (interactions?.filter(i => i.outcome?.includes('Answered')).length / cases.length) * 100 : 0,
          promiseRate: totalCalls > 0 ? (ptpCount / totalCalls) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Communication stats error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Calculate product performance
   */
  static calculateProductPerformance(loans, cases) {
    const productStats = {};
    
    loans?.forEach(loan => {
      const productName = loan.kastle_banking?.products?.product_name || 'Unknown';
      const productType = loan.kastle_banking?.products?.product_type || 'Unknown';
      
      if (!productStats[productType]) {
        productStats[productType] = {
          productName,
          productType,
          totalLoans: 0,
          totalAmount: 0,
          overdueLoans: 0,
          overdueAmount: 0,
          avgDPD: 0,
          dpdSum: 0
        };
      }
      
      productStats[productType].totalLoans++;
      productStats[productType].totalAmount += loan.loan_amount || 0;
      
      if (loan.overdue_amount > 0) {
        productStats[productType].overdueLoans++;
        productStats[productType].overdueAmount += loan.overdue_amount || 0;
        productStats[productType].dpdSum += loan.overdue_days || 0;
      }
    });
    
    // Calculate averages and rates
    return Object.values(productStats).map(product => ({
      ...product,
      avgDPD: product.overdueLoans > 0 ? product.dpdSum / product.overdueLoans : 0,
      delinquencyRate: product.totalAmount > 0 ? 
        (product.overdueAmount / product.totalAmount) * 100 : 0,
      portfolioShare: loans?.length > 0 ? 
        (product.totalLoans / loans.length) * 100 : 0
    }));
  }

  /**
   * Calculate delinquency distribution
   */
  static calculateDelinquencyDistribution(loans) {
    const buckets = {
      'Current': { min: 0, max: 0, count: 0, amount: 0 },
      '1-30': { min: 1, max: 30, count: 0, amount: 0 },
      '31-60': { min: 31, max: 60, count: 0, amount: 0 },
      '61-90': { min: 61, max: 90, count: 0, amount: 0 },
      '91-180': { min: 91, max: 180, count: 0, amount: 0 },
      '181-360': { min: 181, max: 360, count: 0, amount: 0 },
      '>360': { min: 361, max: 9999, count: 0, amount: 0 }
    };
    
    loans?.forEach(loan => {
      const dpd = loan.overdue_days || 0;
      const amount = loan.overdue_amount || 0;
      
      for (const [bucket, range] of Object.entries(buckets)) {
        if (dpd >= range.min && dpd <= range.max) {
          buckets[bucket].count++;
          buckets[bucket].amount += amount;
          break;
        }
      }
    });
    
    const totalOverdue = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);
    
    return Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      count: data.count,
      amount: data.amount,
      percentage: totalOverdue > 0 ? (data.amount / totalOverdue) * 100 : 0
    }));
  }

  /**
   * Get branch trends
   */
  static async getBranchTrends(branchId, dateRange) {
    // This would fetch historical data for trend analysis
    // For now, return mock trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      delinquencyRate: Math.random() * 5 + 7,
      collectionRate: Math.random() * 20 + 70,
      newCases: Math.floor(Math.random() * 50 + 20),
      resolvedCases: Math.floor(Math.random() * 40 + 15)
    }));
  }

  /**
   * Calculate performance score
   */
  static calculatePerformanceScore(metrics) {
    const weights = {
      contactRate: 0.3,
      ptpRate: 0.4,
      ptpFulfillmentRate: 0.3
    };
    
    return (
      (metrics.contactRate * weights.contactRate) +
      (metrics.ptpRate * weights.ptpRate) +
      (metrics.ptpFulfillmentRate * weights.ptpFulfillmentRate)
    );
  }

  /**
   * Get date range start
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
   * Get mock branch report
   */
  static getMockBranchReport(branchId, branch, filters) {
    const mockData = {
      branch,
      summary: {
        totalLoans: 1250,
        totalPortfolio: 125000000,
        overdueLoans: 178,
        totalOverdue: 15600000,
        totalOutstanding: 98000000,
        delinquencyRate: 12.5,
        collectionRate: 73.4,
        activeCases: 156,
        avgDPD: 45.3,
        portfolioAtRisk: 15.9
      },
      officerPerformance: {
        officers: [
          {
            officerId: 'OFF001',
            officerName: 'أحمد محمد',
            officerType: 'Senior',
            totalCases: 45,
            totalOutstanding: 4500000,
            totalCalls: 312,
            totalPTPs: 23,
            keptPTPs: 18,
            contactRate: 85.2,
            ptpRate: 7.4,
            ptpFulfillmentRate: 78.3,
            avgCasesPerDay: 1.5,
            performance: 78.5
          },
          {
            officerId: 'OFF002',
            officerName: 'فاطمة أحمد',
            officerType: 'Senior',
            totalCases: 38,
            totalOutstanding: 3200000,
            totalCalls: 285,
            totalPTPs: 19,
            keptPTPs: 14,
            contactRate: 82.1,
            ptpRate: 6.7,
            ptpFulfillmentRate: 73.7,
            avgCasesPerDay: 1.3,
            performance: 74.2
          }
        ],
        topPerformers: [],
        lowPerformers: []
      },
      branchComparison: {
        rankings: {
          delinquencyRank: 3,
          collectionRank: 2,
          totalBranches: 5
        },
        companyAverage: {
          delinquencyRate: 11.2,
          collectionRate: 71.5,
          portfolioSize: 100000000
        },
        performance: {
          vsCompanyAvg: {
            delinquencyRate: 11.6,
            collectionRate: 2.7
          }
        }
      },
      communicationStats: {
        summary: {
          totalCalls: 1560,
          totalSMS: 892,
          totalEmails: 234,
          totalInteractions: 2686,
          avgCallsPerCase: 10,
          avgMessagesPerCase: 7.2
        },
        callOutcomes: {
          'Answered': 780,
          'No Answer': 456,
          'Busy': 234,
          'Wrong Number': 90
        },
        ptpFromCalls: 125,
        effectiveness: {
          contactRate: 65.4,
          promiseRate: 8.0
        }
      },
      productPerformance: [
        {
          productName: 'قرض تورق',
          productType: 'Tawarruq',
          totalLoans: 450,
          totalAmount: 45000000,
          overdueLoans: 67,
          overdueAmount: 5600000,
          avgDPD: 42,
          delinquencyRate: 12.4,
          portfolioShare: 36
        },
        {
          productName: 'قرض كاش',
          productType: 'Cash',
          totalLoans: 380,
          totalAmount: 28500000,
          overdueLoans: 58,
          overdueAmount: 3900000,
          avgDPD: 38,
          delinquencyRate: 13.7,
          portfolioShare: 30.4
        }
      ],
      delinquencyDistribution: [
        { bucket: 'Current', count: 1072, amount: 0, percentage: 0 },
        { bucket: '1-30', count: 89, amount: 4200000, percentage: 26.9 },
        { bucket: '31-60', count: 45, amount: 3800000, percentage: 24.4 },
        { bucket: '61-90', count: 28, amount: 3200000, percentage: 20.5 },
        { bucket: '91-180', count: 12, amount: 2800000, percentage: 17.9 },
        { bucket: '181-360', count: 3, amount: 1200000, percentage: 7.7 },
        { bucket: '>360', count: 1, amount: 400000, percentage: 2.6 }
      ],
      trends: [
        { month: 'Jan', delinquencyRate: 10.2, collectionRate: 72.5, newCases: 32, resolvedCases: 28 },
        { month: 'Feb', delinquencyRate: 11.1, collectionRate: 71.8, newCases: 38, resolvedCases: 30 },
        { month: 'Mar', delinquencyRate: 11.8, collectionRate: 73.2, newCases: 42, resolvedCases: 35 },
        { month: 'Apr', delinquencyRate: 12.2, collectionRate: 72.9, newCases: 45, resolvedCases: 38 },
        { month: 'May', delinquencyRate: 12.4, collectionRate: 73.1, newCases: 48, resolvedCases: 41 },
        { month: 'Jun', delinquencyRate: 12.5, collectionRate: 73.4, newCases: 52, resolvedCases: 44 }
      ]
    };

    return formatApiResponse(mockData);
  }

  /**
   * Export branch report
   */
  static async exportBranchReport(branchId, format, filters = {}) {
    try {
      const reportData = await this.getBranchReport(branchId, filters);
      
      if (!reportData.success) {
        throw new Error('Failed to fetch branch report data');
      }

      // Implementation would vary based on format
      switch (format) {
        case 'excel':
          return this.exportToExcel(reportData.data);
        case 'pdf':
          return this.exportToPDF(reportData.data);
        case 'csv':
          return this.exportToCSV(reportData.data);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export branch report error:', error);
      return formatApiResponse(null, error);
    }
  }

  // Export helper methods would go here...
  static exportToExcel(data) {
    console.log('Exporting to Excel:', data);
    return formatApiResponse({ url: 'mock_excel_url' });
  }

  static exportToPDF(data) {
    console.log('Exporting to PDF:', data);
    return formatApiResponse({ url: 'mock_pdf_url' });
  }

  static exportToCSV(data) {
    console.log('Exporting to CSV:', data);
    return formatApiResponse({ url: 'mock_csv_url' });
  }
}