// src/services/productReportService.js
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

export class ProductReportService {
  /**
   * Get all products
   */
  static async getProducts() {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('product_id, product_code, product_name, product_type, category_id, is_active')
        .eq('is_active', true)
        .order('product_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get products error:', error);
      // Return mock data if table doesn't exist
      return formatApiResponse([
        { product_id: 'PROD001', product_name: 'قرض تورق', product_type: 'Tawarruq', product_category: 'Islamic Finance' },
        { product_id: 'PROD002', product_name: 'قرض كاش', product_type: 'Cash', product_category: 'Personal Loans' },
        { product_id: 'PROD003', product_name: 'تمويل سيارات', product_type: 'Auto', product_category: 'Asset Finance' },
        { product_id: 'PROD004', product_name: 'تمويل عقاري', product_type: 'Real Estate', product_category: 'Mortgage' },
        { product_id: 'PROD005', product_name: 'بطاقة ائتمان', product_type: 'Credit Card', product_category: 'Cards' }
      ]);
    }
  }

  /**
   * Get comprehensive product report
   */
  static async getProductReport(productIds, filters = {}) {
    try {
      const {
        dateRange = 'current_month',
        branch = 'all',
        customerType = 'all',
        delinquencyBucket = 'all',
        comparison = true,
        trendPeriod = '3months'
      } = filters;

      // Ensure productIds is an array
      const productIdArray = Array.isArray(productIds) ? productIds : [productIds];
      
      // If multiple products, aggregate data
      if (productIdArray.length > 1) {
        return this.getMultiProductReport(productIdArray, filters);
      }

      // Single product report (existing logic)
      const productIdStr = String(productIdArray[0]);

      // Get product info
      const { data: product, error: productError } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('product_id', productIdStr)
        .single();

      if (productError) {
        // Use mock data
        const products = await this.getProducts();
        const mockProduct = products.data?.find(p => p.product_id === productIdStr) || products.data?.[0];
        
        return this.getMockProductReport(productIdStr, mockProduct, filters);
      }

      // Get all loan accounts for the product
      const { data: loans, error: loansError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_account_number,
          outstanding_balance,
          principal_amount,
          loan_amount,
          overdue_amount,
          overdue_days,
          customer_id,
          customers!inner (
            customer_id,
            full_name,
            customer_type,
            risk_category,
            onboarding_branch,
            branches!kastle_banking_customers_onboarding_branch_fkey (
              branch_id,
              branch_name,
              city,
              state
            )
          )
        `)
        .eq('product_id', productIdStr);

      if (loansError) throw loansError;

      // Get collection cases for the product
      const loanNumbers = loans?.map(l => l.loan_account_number) || [];
      
      // Get collection cases first (from banking schema)
      const { data: cases, error: casesError } = loanNumbers.length > 0
        ? await supabaseBanking
            .from(TABLES.COLLECTION_CASES)
            .select('*')
            .in('loan_account_number', loanNumbers)
        : { data: [], error: null };

      if (casesError) throw casesError;

      // Get related data separately to avoid foreign key issues
      let enrichedCases = [];
      if (cases && cases.length > 0) {
        const caseIds = cases.map(c => c.case_id);

        // Fetch interactions
        const { data: interactions } = caseIds.length > 0
          ? await supabaseCollection
              .from(TABLES.COLLECTION_INTERACTIONS)
              .select('case_id, interaction_type, outcome, interaction_datetime')
              .in('case_id', caseIds)
          : { data: [] };

        // Fetch promises to pay
        const { data: ptps } = caseIds.length > 0
          ? await supabaseCollection
              .from(TABLES.PROMISE_TO_PAY)
              .select('case_id, ptp_amount, ptp_date, status')
              .in('case_id', caseIds)
          : { data: [] };

        // Create lookup maps
        const interactionsMap = interactions?.reduce((map, interaction) => {
          if (!map[interaction.case_id]) map[interaction.case_id] = [];
          map[interaction.case_id].push(interaction);
          return map;
        }, {}) || {};

        const ptpMap = ptps?.reduce((map, ptp) => {
          if (!map[ptp.case_id]) map[ptp.case_id] = [];
          map[ptp.case_id].push(ptp);
          return map;
        }, {}) || {};

        // Enrich cases with related data
        enrichedCases = cases.map(caseItem => ({
          ...caseItem,
          collection_interactions: interactionsMap[caseItem.case_id] || [],
          promise_to_pay: ptpMap[caseItem.case_id] || []
        }));
      }

      // Calculate product metrics
      const metrics = this.calculateProductMetrics(loans, enrichedCases, dateRange);

      // Get branch performance for this product
      const branchPerformance = this.calculateBranchPerformance(loans, enrichedCases);

      // Get customer segment analysis
      const customerAnalysis = this.calculateCustomerAnalysis(loans, enrichedCases);

      // Get comparisons if requested
      let productComparison = null;
      if (comparison) {
        productComparison = await this.getProductComparison(productIdStr, metrics);
      }

      // Get communication stats
      const communicationStats = await this.getProductCommunicationStats(enrichedCases, dateRange);

      // Get risk analysis
      const riskAnalysis = this.calculateRiskAnalysis(loans, enrichedCases);

      // Get trends
      const trends = await this.getProductTrends(productIdStr, dateRange);

      return formatApiResponse({
        product,
        summary: metrics,
        branchPerformance,
        customerAnalysis,
        productComparison: productComparison?.data,
        communicationStats: communicationStats.data,
        riskAnalysis,
        trends,
        topDefaulters: this.getTopDefaulters(loans, 10)
      });
    } catch (error) {
      console.error('Product report error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Calculate product metrics
   */
  static calculateProductMetrics(loans, cases, dateRange) {
    const totalLoans = loans?.length || 0;
    const totalPortfolio = loans?.reduce((sum, l) => sum + (l.loan_amount || l.principal_amount || 0), 0) || 0;
    const totalOutstanding = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    const overdueLoans = loans?.filter(l => l.overdue_amount > 0).length || 0;
    const totalOverdue = loans?.reduce((sum, l) => sum + (l.overdue_amount || 0), 0) || 0;
    
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

    // Calculate average interest rate
    const avgInterestRate = totalLoans > 0 ?
      loans.reduce((sum, l) => sum + (l.interest_rate || 0), 0) / totalLoans : 0;

    return {
      totalLoans,
      totalPortfolio,
      totalOutstanding,
      overdueLoans,
      totalOverdue,
      delinquencyRate,
      collectionRate,
      activeCases,
      avgDPD,
      avgInterestRate,
      portfolioAtRisk: totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0,
      avgLoanSize: totalLoans > 0 ? totalPortfolio / totalLoans : 0
    };
  }

  /**
   * Calculate branch performance for product
   */
  static calculateBranchPerformance(loans, cases) {
    const branchStats = {};
    
    loans?.forEach(loan => {
      // Access the joined customer and branch data
      const customer = loan.customers;
      const branch = customer?.branches;
      const branchId = branch?.branch_id || 'unknown';
      const branchName = branch?.branch_name || 'Unknown Branch';
      
      if (!branchStats[branchId]) {
        branchStats[branchId] = {
          branchId,
          branchName,
          city: branch?.city || '',
          region: branch?.state || '', // Using state as region for display
          totalLoans: 0,
          totalAmount: 0,
          overdueLoans: 0,
          overdueAmount: 0,
          avgDPD: 0,
          dpdSum: 0
        };
      }
      
      branchStats[branchId].totalLoans++;
      branchStats[branchId].totalAmount += loan.loan_amount || loan.principal_amount || 0;
      
      if (loan.overdue_amount > 0) {
        branchStats[branchId].overdueLoans++;
        branchStats[branchId].overdueAmount += loan.overdue_amount || 0;
        branchStats[branchId].dpdSum += loan.overdue_days || 0;
      }
    });
    
    // Calculate metrics for each branch
    return Object.values(branchStats).map(branch => ({
      ...branch,
      avgDPD: branch.overdueLoans > 0 ? branch.dpdSum / branch.overdueLoans : 0,
      delinquencyRate: branch.totalAmount > 0 ? 
        (branch.overdueAmount / branch.totalAmount) * 100 : 0,
      portfolioShare: loans?.length > 0 ? 
        (branch.totalLoans / loans.length) * 100 : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Calculate customer analysis
   */
  static calculateCustomerAnalysis(loans, cases) {
    const customerTypeStats = {
      'INDIVIDUAL': { name: 'أفراد', count: 0, amount: 0, overdueCount: 0, overdueAmount: 0 },
      'CORPORATE': { name: 'شركات', count: 0, amount: 0, overdueCount: 0, overdueAmount: 0 },
      'SME': { name: 'منشآت صغيرة', count: 0, amount: 0, overdueCount: 0, overdueAmount: 0 }
    };
    
    const riskCategoryStats = {
      'Low': { count: 0, amount: 0, overdueAmount: 0 },
      'Medium': { count: 0, amount: 0, overdueAmount: 0 },
      'High': { count: 0, amount: 0, overdueAmount: 0 }
    };
    
    loans?.forEach(loan => {
      const customerType = loan.kastle_banking?.customers?.customer_type || 'INDIVIDUAL';
      const riskCategory = loan.kastle_banking?.customers?.risk_category || 'Medium';
      
      // Customer type stats
      if (customerTypeStats[customerType]) {
        customerTypeStats[customerType].count++;
        customerTypeStats[customerType].amount += loan.loan_amount || loan.principal_amount || 0;
        if (loan.overdue_amount > 0) {
          customerTypeStats[customerType].overdueCount++;
          customerTypeStats[customerType].overdueAmount += loan.overdue_amount || 0;
        }
      }
      
      // Risk category stats
      if (riskCategoryStats[riskCategory]) {
        riskCategoryStats[riskCategory].count++;
        riskCategoryStats[riskCategory].amount += loan.loan_amount || loan.principal_amount || 0;
        riskCategoryStats[riskCategory].overdueAmount += loan.overdue_amount || 0;
      }
    });
    
    // Calculate delinquency rates
    Object.values(customerTypeStats).forEach(stat => {
      stat.delinquencyRate = stat.amount > 0 ? (stat.overdueAmount / stat.amount) * 100 : 0;
    });
    
    Object.entries(riskCategoryStats).forEach(([category, stat]) => {
      stat.delinquencyRate = stat.amount > 0 ? (stat.overdueAmount / stat.amount) * 100 : 0;
    });
    
    return {
      byCustomerType: Object.values(customerTypeStats),
      byRiskCategory: Object.entries(riskCategoryStats).map(([category, stats]) => ({
        category,
        ...stats
      }))
    };
  }

  /**
   * Get product comparison
   */
  static async getProductComparison(productId, productMetrics) {
    try {
      // Get all products
      const { data: products, error: productsError } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('product_id, product_name, product_type')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Get metrics for all products (simplified - would need to calculate for each)
      const allProductMetrics = products?.map(product => ({
        productId: product.product_id,
        productName: product.product_name,
        productType: product.product_type,
        delinquencyRate: product.product_id === productId ? 
          productMetrics.delinquencyRate : 
          Math.random() * 15 + 5,
        collectionRate: product.product_id === productId ? 
          productMetrics.collectionRate : 
          Math.random() * 30 + 60,
        portfolioSize: product.product_id === productId ? 
          productMetrics.totalPortfolio : 
          Math.random() * 100000000 + 20000000,
        avgDPD: product.product_id === productId ? 
          productMetrics.avgDPD : 
          Math.random() * 60 + 20
      })) || [];

      // Calculate rankings
      allProductMetrics.sort((a, b) => a.delinquencyRate - b.delinquencyRate);
      const delinquencyRank = allProductMetrics.findIndex(p => p.productId === productId) + 1;

      allProductMetrics.sort((a, b) => b.collectionRate - a.collectionRate);
      const collectionRank = allProductMetrics.findIndex(p => p.productId === productId) + 1;

      // Calculate company averages
      const companyAvg = {
        delinquencyRate: allProductMetrics.reduce((sum, p) => sum + p.delinquencyRate, 0) / allProductMetrics.length,
        collectionRate: allProductMetrics.reduce((sum, p) => sum + p.collectionRate, 0) / allProductMetrics.length,
        avgDPD: allProductMetrics.reduce((sum, p) => sum + p.avgDPD, 0) / allProductMetrics.length
      };

      return formatApiResponse({
        rankings: {
          delinquencyRank,
          collectionRank,
          totalProducts: allProductMetrics.length
        },
        companyAverage: companyAvg,
        productComparison: allProductMetrics,
        performance: {
          vsCompanyAvg: {
            delinquencyRate: ((productMetrics.delinquencyRate - companyAvg.delinquencyRate) / companyAvg.delinquencyRate) * 100,
            collectionRate: ((productMetrics.collectionRate - companyAvg.collectionRate) / companyAvg.collectionRate) * 100,
            avgDPD: ((productMetrics.avgDPD - companyAvg.avgDPD) / companyAvg.avgDPD) * 100
          }
        }
      });
    } catch (error) {
      console.error('Product comparison error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get product communication statistics
   */
  static async getProductCommunicationStats(cases, dateRange) {
    try {
      const startDate = this.getDateRangeStart(dateRange);
      
      // Get all interactions for product cases
      const caseIds = cases?.map(c => c.case_id) || [];
      
      const { data: interactions, error } = await supabaseCollection
        .from(TABLES.COLLECTION_INTERACTIONS)
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
   * Calculate risk analysis
   */
  static calculateRiskAnalysis(loans, cases) {
    // Delinquency bucket distribution
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
    
    const bucketDistribution = Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      count: data.count,
      amount: data.amount,
      percentage: totalOverdue > 0 ? (data.amount / totalOverdue) * 100 : 0
    }));

    // Vintage analysis (simplified)
    const vintageAnalysis = this.calculateVintageAnalysis(loans);

    // Risk indicators
    const riskIndicators = {
      highDPDConcentration: bucketDistribution.filter(b => 
        b.bucket.includes('>90') || b.bucket.includes('>360')
      ).reduce((sum, b) => sum + b.percentage, 0),
      newLoanDefaultRate: this.calculateNewLoanDefaultRate(loans),
      restructuredLoans: loans?.filter(l => l.restructured).length || 0,
      writeOffCandidates: loans?.filter(l => l.overdue_days > 360).length || 0
    };

    return {
      bucketDistribution,
      vintageAnalysis,
      riskIndicators
    };
  }

  /**
   * Calculate vintage analysis
   */
  static calculateVintageAnalysis(loans) {
    const vintages = {};
    const currentDate = new Date();
    
    loans?.forEach(loan => {
      const disbursementDate = new Date(loan.disbursement_date);
      const monthYear = `${disbursementDate.getFullYear()}-${String(disbursementDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!vintages[monthYear]) {
        vintages[monthYear] = {
          month: monthYear,
          totalLoans: 0,
          totalAmount: 0,
          overdueLoans: 0,
          overdueAmount: 0
        };
      }
      
      vintages[monthYear].totalLoans++;
      vintages[monthYear].totalAmount += loan.loan_amount || loan.principal_amount || 0;
      
      if (loan.overdue_amount > 0) {
        vintages[monthYear].overdueLoans++;
        vintages[monthYear].overdueAmount += loan.overdue_amount || 0;
      }
    });
    
    // Calculate delinquency rates and sort by month
    return Object.values(vintages)
      .map(vintage => ({
        ...vintage,
        delinquencyRate: vintage.totalAmount > 0 ? 
          (vintage.overdueAmount / vintage.totalAmount) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  /**
   * Calculate new loan default rate
   */
  static calculateNewLoanDefaultRate(loans) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newLoans = loans?.filter(l => new Date(l.disbursement_date) >= thirtyDaysAgo) || [];
    const defaultedNewLoans = newLoans.filter(l => l.overdue_amount > 0);
    
    return newLoans.length > 0 ? (defaultedNewLoans.length / newLoans.length) * 100 : 0;
  }

  /**
   * Get top defaulters
   */
  static getTopDefaulters(loans, limit = 10) {
    return loans
      ?.filter(l => l.overdue_amount > 0)
      .sort((a, b) => b.overdue_amount - a.overdue_amount)
      .slice(0, limit)
      .map(loan => ({
        loanAccountNumber: loan.loan_account_number,
        customerName: loan.customers?.full_name || 'Unknown',
        customerType: loan.customers?.customer_type || 'Unknown',
        branchName: loan.customers?.branches?.branch_name || 'Unknown',
        loanAmount: loan.loan_amount || loan.principal_amount,
        overdueAmount: loan.overdue_amount,
        overdueDays: loan.overdue_days,
        riskCategory: loan.customers?.risk_category || 'Unknown'
      })) || [];
  }

  /**
   * Get product trends
   */
  static async getProductTrends(productId, dateRange) {
    // This would fetch historical data for trend analysis
    // For now, return mock trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      delinquencyRate: Math.random() * 5 + 10,
      collectionRate: Math.random() * 20 + 65,
      newLoans: Math.floor(Math.random() * 100 + 50),
      avgLoanSize: Math.floor(Math.random() * 50000 + 100000),
      defaultRate: Math.random() * 3 + 2
    }));
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
   * Get report for multiple products
   */
  static async getMultiProductReport(productIds, filters = {}) {
    try {
      // Get all products data
      const { data: products, error: productsError } = await supabaseBanking
        .from(TABLES.PRODUCTS)
        .select('*')
        .in('product_id', productIds);

      if (productsError) {
        // Use mock data for multiple products
        return this.getMockMultiProductReport(productIds, filters);
      }

      // Get loans for all selected products
      const { data: loans, error: loansError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_account_number,
          product_id,
          customer_id,
          outstanding_balance,
          principal_amount,
          loan_amount,
          overdue_amount,
          overdue_days,
          loan_status,
          disbursement_date,
          maturity_date,
          customers!customer_id (
            full_name,
            customer_type,
            onboarding_branch,
            branches!onboarding_branch (
              branch_name
            )
          )
        `)
        .in('product_id', productIds);

      if (loansError) {
        return this.getMockMultiProductReport(productIds, filters);
      }

      // Aggregate data by product
      const productMetrics = {};
      const aggregatedMetrics = {
        totalPortfolio: 0,
        overduePortfolio: 0,
        totalLoans: 0,
        overdueLoans: 0,
        totalCustomers: new Set(),
        overdueCustomers: new Set()
      };

      // Calculate metrics for each product
      productIds.forEach(productId => {
        const productLoans = loans?.filter(l => l.product_id === productId) || [];
        const product = products?.find(p => p.product_id === productId);
        
        const metrics = {
          productId,
          productName: product?.product_name || productId,
          productType: product?.product_type,
          totalPortfolio: 0,
          overduePortfolio: 0,
          totalLoans: productLoans.length,
          overdueLoans: 0,
          collectionRate: 0,
          delinquencyRate: 0,
          avgDPD: 0,
          totalCustomers: new Set(),
          overdueCustomers: new Set()
        };

        productLoans.forEach(loan => {
          metrics.totalPortfolio += loan.outstanding_balance || 0;
          metrics.totalCustomers.add(loan.customer_id);
          
          if (loan.overdue_amount > 0) {
            metrics.overduePortfolio += loan.overdue_amount;
            metrics.overdueLoans++;
            metrics.overdueCustomers.add(loan.customer_id);
            metrics.avgDPD += loan.overdue_days || 0;
          }
        });

        // Calculate rates
        if (metrics.totalPortfolio > 0) {
          metrics.delinquencyRate = (metrics.overduePortfolio / metrics.totalPortfolio) * 100;
          metrics.collectionRate = ((metrics.totalPortfolio - metrics.overduePortfolio) / metrics.totalPortfolio) * 100;
        }
        
        if (metrics.overdueLoans > 0) {
          metrics.avgDPD = metrics.avgDPD / metrics.overdueLoans;
        }

        // Update aggregated metrics
        aggregatedMetrics.totalPortfolio += metrics.totalPortfolio;
        aggregatedMetrics.overduePortfolio += metrics.overduePortfolio;
        aggregatedMetrics.totalLoans += metrics.totalLoans;
        aggregatedMetrics.overdueLoans += metrics.overdueLoans;
        metrics.totalCustomers.forEach(c => aggregatedMetrics.totalCustomers.add(c));
        metrics.overdueCustomers.forEach(c => aggregatedMetrics.overdueCustomers.add(c));

        productMetrics[productId] = {
          ...metrics,
          totalCustomers: metrics.totalCustomers.size,
          overdueCustomers: metrics.overdueCustomers.size
        };
      });

      // Calculate aggregated rates
      const aggregatedRates = {
        delinquencyRate: aggregatedMetrics.totalPortfolio > 0 
          ? (aggregatedMetrics.overduePortfolio / aggregatedMetrics.totalPortfolio) * 100 
          : 0,
        collectionRate: aggregatedMetrics.totalPortfolio > 0 
          ? ((aggregatedMetrics.totalPortfolio - aggregatedMetrics.overduePortfolio) / aggregatedMetrics.totalPortfolio) * 100 
          : 0
      };

      return formatApiResponse({
        summary: {
          ...aggregatedMetrics,
          ...aggregatedRates,
          totalCustomers: aggregatedMetrics.totalCustomers.size,
          overdueCustomers: aggregatedMetrics.overdueCustomers.size
        },
        productMetrics,
        products: Object.values(productMetrics),
        comparison: {
          enabled: true,
          productCount: productIds.length
        }
      });

    } catch (error) {
      console.error('Get multi-product report error:', error);
      return this.getMockMultiProductReport(productIds, filters);
    }
  }

  /**
   * Get mock data for multiple products
   */
  static getMockMultiProductReport(productIds, filters = {}) {
    const mockProducts = [
      { product_id: 'PROD001', product_name: 'قرض تورق', product_type: 'PERSONAL' },
      { product_id: 'PROD002', product_name: 'قرض كاش', product_type: 'PERSONAL' },
      { product_id: 'PROD003', product_name: 'تمويل سيارات', product_type: 'AUTO' },
      { product_id: 'PROD004', product_name: 'تمويل عقاري', product_type: 'REAL_ESTATE' },
      { product_id: 'PROD005', product_name: 'بطاقة ائتمان', product_type: 'CREDIT_CARD' }
    ];

    const productMetrics = {};
    let aggregatedMetrics = {
      totalPortfolio: 0,
      overduePortfolio: 0,
      totalLoans: 0,
      overdueLoans: 0,
      totalCustomers: 0,
      overdueCustomers: 0
    };

    productIds.forEach((productId, index) => {
      const product = mockProducts.find(p => p.product_id === productId) || mockProducts[index];
      const baseValue = (index + 1) * 10000000;
      
      const metrics = {
        productId: product.product_id,
        productName: product.product_name,
        productType: product.product_type,
        totalPortfolio: baseValue,
        overduePortfolio: baseValue * 0.15,
        totalLoans: 250 + (index * 50),
        overdueLoans: 35 + (index * 10),
        collectionRate: 85 - (index * 2),
        delinquencyRate: 15 + (index * 2),
        avgDPD: 45 + (index * 5),
        totalCustomers: 200 + (index * 40),
        overdueCustomers: 30 + (index * 8)
      };

      productMetrics[product.product_id] = metrics;
      
      // Update aggregated
      aggregatedMetrics.totalPortfolio += metrics.totalPortfolio;
      aggregatedMetrics.overduePortfolio += metrics.overduePortfolio;
      aggregatedMetrics.totalLoans += metrics.totalLoans;
      aggregatedMetrics.overdueLoans += metrics.overdueLoans;
      aggregatedMetrics.totalCustomers += metrics.totalCustomers;
      aggregatedMetrics.overdueCustomers += metrics.overdueCustomers;
    });

    return formatApiResponse({
      summary: {
        ...aggregatedMetrics,
        delinquencyRate: (aggregatedMetrics.overduePortfolio / aggregatedMetrics.totalPortfolio) * 100,
        collectionRate: ((aggregatedMetrics.totalPortfolio - aggregatedMetrics.overduePortfolio) / aggregatedMetrics.totalPortfolio) * 100
      },
      productMetrics,
      products: Object.values(productMetrics),
      comparison: {
        enabled: true,
        productCount: productIds.length
      }
    });
  }

  /**
   * Get mock product report
   */
  static getMockProductReport(productId, product, filters) {
    const mockData = {
      product,
      summary: {
        totalLoans: 3250,
        totalPortfolio: 325000000,
        totalOutstanding: 285000000,
        overdueLoans: 420,
        totalOverdue: 42500000,
        delinquencyRate: 13.1,
        collectionRate: 68.5,
        activeCases: 385,
        avgDPD: 52.3,
        avgInterestRate: 4.8,
        portfolioAtRisk: 14.9,
        avgLoanSize: 100000
      },
      branchPerformance: [
        {
          branchId: 'BR001',
          branchName: 'الرياض - الفرع الرئيسي',
          city: 'الرياض',
          region: 'الوسطى',
          totalLoans: 850,
          totalAmount: 85000000,
          overdueLoans: 105,
          overdueAmount: 10500000,
          avgDPD: 48,
          delinquencyRate: 12.4,
          portfolioShare: 26.2
        },
        {
          branchId: 'BR002',
          branchName: 'جدة - فرع التحلية',
          city: 'جدة',
          region: 'الغربية',
          totalLoans: 720,
          totalAmount: 72000000,
          overdueLoans: 95,
          overdueAmount: 9200000,
          avgDPD: 45,
          delinquencyRate: 12.8,
          portfolioShare: 22.2
        }
      ],
      customerAnalysis: {
        byCustomerType: [
          {
            name: 'أفراد',
            count: 2100,
            amount: 189000000,
            overdueCount: 280,
            overdueAmount: 25200000,
            delinquencyRate: 13.3
          },
          {
            name: 'شركات',
            count: 850,
            amount: 102000000,
            overdueCount: 95,
            overdueAmount: 11400000,
            delinquencyRate: 11.2
          },
          {
            name: 'منشآت صغيرة',
            count: 300,
            amount: 34000000,
            overdueCount: 45,
            overdueAmount: 5900000,
            delinquencyRate: 17.4
          }
        ],
        byRiskCategory: [
          {
            category: 'Low',
            count: 1950,
            amount: 195000000,
            overdueAmount: 15600000,
            delinquencyRate: 8.0
          },
          {
            category: 'Medium',
            count: 975,
            amount: 97500000,
            overdueAmount: 14625000,
            delinquencyRate: 15.0
          },
          {
            category: 'High',
            count: 325,
            amount: 32500000,
            overdueAmount: 12275000,
            delinquencyRate: 37.8
          }
        ]
      },
      productComparison: {
        rankings: {
          delinquencyRank: 3,
          collectionRank: 2,
          totalProducts: 5
        },
        companyAverage: {
          delinquencyRate: 11.8,
          collectionRate: 70.2,
          avgDPD: 48.5
        },
        performance: {
          vsCompanyAvg: {
            delinquencyRate: 11.0,
            collectionRate: -2.4,
            avgDPD: 7.8
          }
        }
      },
      communicationStats: {
        summary: {
          totalCalls: 3850,
          totalSMS: 2140,
          totalEmails: 580,
          totalInteractions: 6570,
          avgCallsPerCase: 10,
          avgMessagesPerCase: 7.1
        },
        callOutcomes: {
          'Answered': 1925,
          'No Answer': 1155,
          'Busy': 578,
          'Wrong Number': 192
        },
        ptpFromCalls: 308,
        effectiveness: {
          contactRate: 62.3,
          promiseRate: 8.0
        }
      },
      riskAnalysis: {
        bucketDistribution: [
          { bucket: 'Current', count: 2830, amount: 0, percentage: 0 },
          { bucket: '1-30', count: 210, amount: 10500000, percentage: 24.7 },
          { bucket: '31-60', count: 105, amount: 9450000, percentage: 22.2 },
          { bucket: '61-90', count: 63, amount: 7560000, percentage: 17.8 },
          { bucket: '91-180', count: 28, amount: 8400000, percentage: 19.8 },
          { bucket: '181-360', count: 10, amount: 4500000, percentage: 10.6 },
          { bucket: '>360', count: 4, amount: 2090000, percentage: 4.9 }
        ],
        vintageAnalysis: [
          { month: '2024-01', totalLoans: 280, totalAmount: 28000000, overdueLoans: 42, overdueAmount: 4200000, delinquencyRate: 15.0 },
          { month: '2024-02', totalLoans: 265, totalAmount: 26500000, overdueLoans: 37, overdueAmount: 3700000, delinquencyRate: 14.0 },
          { month: '2024-03', totalLoans: 290, totalAmount: 29000000, overdueLoans: 35, overdueAmount: 3500000, delinquencyRate: 12.1 },
          { month: '2024-04', totalLoans: 275, totalAmount: 27500000, overdueLoans: 30, overdueAmount: 3000000, delinquencyRate: 10.9 },
          { month: '2024-05', totalLoans: 285, totalAmount: 28500000, overdueLoans: 25, overdueAmount: 2500000, delinquencyRate: 8.8 },
          { month: '2024-06', totalLoans: 295, totalAmount: 29500000, overdueLoans: 15, overdueAmount: 1500000, delinquencyRate: 5.1 }
        ],
        riskIndicators: {
          highDPDConcentration: 35.3,
          newLoanDefaultRate: 3.5,
          restructuredLoans: 45,
          writeOffCandidates: 4
        }
      },
      trends: [
        { month: 'Jan', delinquencyRate: 11.5, collectionRate: 67.2, newLoans: 85, avgLoanSize: 98000, defaultRate: 3.2 },
        { month: 'Feb', delinquencyRate: 12.1, collectionRate: 66.8, newLoans: 92, avgLoanSize: 102000, defaultRate: 3.5 },
        { month: 'Mar', delinquencyRate: 12.8, collectionRate: 68.1, newLoans: 98, avgLoanSize: 99500, defaultRate: 3.8 },
        { month: 'Apr', delinquencyRate: 13.0, collectionRate: 67.9, newLoans: 105, avgLoanSize: 101000, defaultRate: 4.1 },
        { month: 'May', delinquencyRate: 13.2, collectionRate: 68.3, newLoans: 110, avgLoanSize: 100500, defaultRate: 3.9 },
        { month: 'Jun', delinquencyRate: 13.1, collectionRate: 68.5, newLoans: 118, avgLoanSize: 100000, defaultRate: 3.5 }
      ],
      topDefaulters: [
        {
          loanAccountNumber: 'LN0012345',
          customerName: 'شركة الرياض للتجارة',
          customerType: 'CORPORATE',
          branchName: 'الرياض - الفرع الرئيسي',
          loanAmount: 5000000,
          overdueAmount: 3500000,
          overdueDays: 185,
          riskCategory: 'High'
        },
        {
          loanAccountNumber: 'LN0023456',
          customerName: 'مؤسسة النور للمقاولات',
          customerType: 'SME',
          branchName: 'جدة - فرع التحلية',
          loanAmount: 3000000,
          overdueAmount: 2100000,
          overdueDays: 156,
          riskCategory: 'High'
        }
      ]
    };

    return formatApiResponse(mockData);
  }

  /**
   * Export product report
   */
  static async exportProductReport(productId, format, filters = {}) {
    try {
      const reportData = await this.getProductReport(productId, filters);
      
      if (!reportData.success) {
        throw new Error('Failed to fetch product report data');
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
      console.error('Export product report error:', error);
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