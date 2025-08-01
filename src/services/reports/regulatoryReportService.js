import { supabaseBanking, TABLES } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

class RegulatoryReportService {
  /**
   * Get SAMA Monthly Report
   */
  async getSAMAMonthlyReport(startDate, endDate) {
    try {
      // Get account data
      const { data: accounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_id,
          current_balance,
          account_status,
          account_type_id,
          created_at,
          account_types!inner(
            type_name,
            account_category
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (accountError) throw accountError;

      // Get loan data
      const { data: loans, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_id,
          loan_amount,
          outstanding_balance,
          interest_rate,
          loan_status,
          disbursement_date,
          loan_type_id
        `)
        .gte('disbursement_date', startDate)
        .lte('disbursement_date', endDate);

      if (loanError) throw loanError;

      // Fetch loan types
      if (loans && loans.length > 0) {
        const loanTypeIds = [...new Set(loans.map(l => l.loan_type_id).filter(Boolean))];
        if (loanTypeIds.length > 0) {
          const { data: loanTypes, error: typeError } = await supabaseBanking
            .from(TABLES.LOAN_TYPES)
            .select('loan_type_id, type_name')
            .in('loan_type_id', loanTypeIds);
          
          if (!typeError && loanTypes) {
            const typeMap = new Map(loanTypes.map(t => [t.loan_type_id, t]));
            loans.forEach(loan => {
              loan.loan_types = typeMap.get(loan.loan_type_id) || null;
            });
          }
        }
      }

      // Get transaction data
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_amount,
          transaction_type_id,
          transaction_date,
          transaction_types!inner(type_name, category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Calculate key metrics
      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const newAccounts = accounts?.length || 0;
      const newLoans = loans?.length || 0;

      // Calculate liquidity metrics
      const liquidAssets = totalDeposits * 0.15; // 15% of deposits as liquid assets
      const totalAssets = totalDeposits + totalLoans;
      const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets * 100) : 0;

      // NPL calculation
      const nplLoans = loans?.filter(loan => loan.loan_status === 'DEFAULT')?.length || 0;
      const nplRatio = loans?.length > 0 ? (nplLoans / loans.length * 100) : 0;

      return {
        reportPeriod: {
          startDate,
          endDate,
          month: format(new Date(startDate), 'MMMM yyyy')
        },
        summary: {
          totalDeposits: Math.round(totalDeposits),
          totalLoans: Math.round(totalLoans),
          totalAssets: Math.round(totalAssets),
          newAccounts,
          newLoans,
          totalTransactions: transactions?.length || 0
        },
        liquidityMetrics: {
          liquidAssets: Math.round(liquidAssets),
          liquidityRatio: liquidityRatio.toFixed(2),
          quickRatio: ((liquidAssets / totalDeposits) * 100).toFixed(2)
        },
        creditMetrics: {
          totalLoansOutstanding: Math.round(totalLoans),
          nplRatio: nplRatio.toFixed(2),
          provisionCoverage: '85.00', // Simulated
          loanToDepositRatio: totalDeposits > 0 ? ((totalLoans / totalDeposits) * 100).toFixed(2) : '0.00'
        },
        capitalMetrics: {
          tier1Capital: Math.round(totalAssets * 0.08),
          tier2Capital: Math.round(totalAssets * 0.04),
          totalCapital: Math.round(totalAssets * 0.12),
          capitalAdequacyRatio: '15.2' // Simulated
        },
        depositBreakdown: {
          savingsDeposits: accounts?.filter(a => a.account_type_id === 1).reduce((sum, a) => sum + a.current_balance, 0) || 0,
          checkingDeposits: accounts?.filter(a => a.account_type_id === 2).reduce((sum, a) => sum + a.current_balance, 0) || 0,
          termDeposits: accounts?.filter(a => a.account_type_id === 3).reduce((sum, a) => sum + a.current_balance, 0) || 0
        },
        compliance: {
          amlScreenings: Math.round(newAccounts * 1.2), // Simulated
          suspiciousTransactions: 0,
          ctrsFiledDelta: 2, // Simulated
          sarsFiledDelta: 0
        }
      };
    } catch (error) {
      console.error('Error generating SAMA monthly report:', error);
      throw error;
    }
  }

  /**
   * Get Basel III Compliance Report
   */
  async getBaselIIICompliance(asOfDate) {
    try {
      // Get balance sheet data
      const { data: accounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance, account_type_id')
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      const { data: loans, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance, loan_status, interest_rate')
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      if (loanError) throw loanError;

      // Calculate risk-weighted assets
      const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      
      // Risk weights (simplified)
      const cashRiskWeight = 0;
      const governmentBondsRiskWeight = 0;
      const corporateLoansRiskWeight = 1;
      const retailLoansRiskWeight = 0.75;
      
      // Assume portfolio composition
      const cashAndEquivalents = totalDeposits * 0.1;
      const governmentBonds = totalDeposits * 0.2;
      const corporateLoans = totalLoans * 0.4;
      const retailLoans = totalLoans * 0.6;
      
      const riskWeightedAssets = 
        (cashAndEquivalents * cashRiskWeight) +
        (governmentBonds * governmentBondsRiskWeight) +
        (corporateLoans * corporateLoansRiskWeight) +
        (retailLoans * retailLoansRiskWeight);

      // Capital calculations
      const totalAssets = totalDeposits + totalLoans;
      const tier1Capital = totalAssets * 0.08;
      const tier2Capital = totalAssets * 0.04;
      const totalCapital = tier1Capital + tier2Capital;

      // Ratios
      const cet1Ratio = riskWeightedAssets > 0 ? (tier1Capital / riskWeightedAssets * 100) : 0;
      const tier1Ratio = riskWeightedAssets > 0 ? (tier1Capital / riskWeightedAssets * 100) : 0;
      const totalCapitalRatio = riskWeightedAssets > 0 ? (totalCapital / riskWeightedAssets * 100) : 0;

      // Leverage ratio
      const leverageRatio = totalAssets > 0 ? (tier1Capital / totalAssets * 100) : 0;

      // Liquidity Coverage Ratio (LCR)
      const highQualityLiquidAssets = cashAndEquivalents + governmentBonds;
      const netCashOutflows = totalDeposits * 0.05; // 5% of deposits as potential outflows
      const lcr = netCashOutflows > 0 ? (highQualityLiquidAssets / netCashOutflows * 100) : 0;

      // Net Stable Funding Ratio (NSFR)
      const availableStableFunding = totalDeposits * 0.9 + tier1Capital;
      const requiredStableFunding = totalLoans * 0.85;
      const nsfr = requiredStableFunding > 0 ? (availableStableFunding / requiredStableFunding * 100) : 0;

      return {
        asOfDate,
        capitalAdequacy: {
          riskWeightedAssets: Math.round(riskWeightedAssets),
          cet1Capital: Math.round(tier1Capital),
          tier1Capital: Math.round(tier1Capital),
          tier2Capital: Math.round(tier2Capital),
          totalCapital: Math.round(totalCapital),
          cet1Ratio: cet1Ratio.toFixed(2),
          tier1Ratio: tier1Ratio.toFixed(2),
          totalCapitalRatio: totalCapitalRatio.toFixed(2),
          minimumRequirements: {
            cet1: '4.5%',
            tier1: '6.0%',
            total: '8.0%'
          },
          buffers: {
            conservationBuffer: '2.5%',
            countercyclicalBuffer: '0.0%',
            systemicBuffer: '0.0%'
          }
        },
        leverageRatio: {
          tier1Capital: Math.round(tier1Capital),
          totalExposure: Math.round(totalAssets),
          ratio: leverageRatio.toFixed(2),
          minimumRequirement: '3.0%'
        },
        liquidityMetrics: {
          lcr: {
            hqla: Math.round(highQualityLiquidAssets),
            netCashOutflows: Math.round(netCashOutflows),
            ratio: lcr.toFixed(2),
            minimumRequirement: '100%'
          },
          nsfr: {
            availableStableFunding: Math.round(availableStableFunding),
            requiredStableFunding: Math.round(requiredStableFunding),
            ratio: nsfr.toFixed(2),
            minimumRequirement: '100%'
          }
        },
        riskExposures: {
          creditRisk: Math.round(riskWeightedAssets * 0.85),
          marketRisk: Math.round(riskWeightedAssets * 0.10),
          operationalRisk: Math.round(riskWeightedAssets * 0.05),
          totalRWA: Math.round(riskWeightedAssets)
        }
      };
    } catch (error) {
      console.error('Error generating Basel III compliance report:', error);
      throw error;
    }
  }

  /**
   * Get AML/CFT Report
   */
  async getAMLReport(startDate, endDate) {
    try {
      // Get customer data
      const { data: customers, error: customerError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, created_at, kyc_status, risk_rating')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (customerError) throw customerError;

      // Get transaction data for monitoring
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_id,
          transaction_amount,
          transaction_date,
          transaction_types!inner(type_name, category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Analyze transactions for suspicious patterns
      const largeTransactions = transactions?.filter(t => t.transaction_amount > 50000) || [];
      const cashTransactions = transactions?.filter(t => 
        t.transaction_types?.category === 'CASH'
      ) || [];

      // Risk categorization
      const highRiskCustomers = customers?.filter(c => c.risk_rating === 'HIGH')?.length || 0;
      const mediumRiskCustomers = customers?.filter(c => c.risk_rating === 'MEDIUM')?.length || 0;
      const lowRiskCustomers = customers?.filter(c => c.risk_rating === 'LOW')?.length || 0;

      return {
        reportPeriod: {
          startDate,
          endDate
        },
        customerDueDiligence: {
          newCustomers: customers?.length || 0,
          kycCompleted: customers?.filter(c => c.kyc_status === 'VERIFIED')?.length || 0,
          kycPending: customers?.filter(c => c.kyc_status === 'PENDING')?.length || 0,
          enhancedDueDiligence: highRiskCustomers
        },
        riskAssessment: {
          highRisk: highRiskCustomers,
          mediumRisk: mediumRiskCustomers,
          lowRisk: lowRiskCustomers,
          totalCustomers: customers?.length || 0
        },
        transactionMonitoring: {
          totalTransactions: transactions?.length || 0,
          largeTransactions: largeTransactions.length,
          cashTransactions: cashTransactions.length,
          suspiciousActivities: 0, // Would come from actual monitoring system
          alertsGenerated: Math.round(largeTransactions.length * 0.1),
          alertsCleared: Math.round(largeTransactions.length * 0.09),
          alertsEscalated: Math.round(largeTransactions.length * 0.01)
        },
        reporting: {
          ctrsFiledDelta: largeTransactions.filter(t => t.transaction_amount > 100000).length,
          sarsFiledDelta: 0,
          str: 0 // Suspicious Transaction Reports
        },
        training: {
          employeesTrained: 45,
          trainingHours: 180,
          complianceScore: '92%'
        }
      };
    } catch (error) {
      console.error('Error generating AML report:', error);
      throw error;
    }
  }

  /**
   * Get Liquidity Coverage Ratio Report
   */
  async getLiquidityCoverageRatio(asOfDate) {
    try {
      // Get account balances
      const { data: accounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance, account_type_id')
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

      // Calculate HQLA (High Quality Liquid Assets)
      const level1Assets = totalDeposits * 0.15; // Cash and central bank reserves
      const level2AAssets = totalDeposits * 0.10; // Government bonds
      const level2BAssets = totalDeposits * 0.05; // Corporate bonds

      const totalHQLA = level1Assets + (level2AAssets * 0.85) + (level2BAssets * 0.50);

      // Calculate net cash outflows
      const retailDeposits = accounts?.filter(a => a.account_type_id === 1)
        .reduce((sum, a) => sum + a.current_balance, 0) || 0;
      const corporateDeposits = totalDeposits - retailDeposits;

      const retailOutflowRate = 0.05; // 5% for stable retail deposits
      const corporateOutflowRate = 0.25; // 25% for corporate deposits

      const totalOutflows = (retailDeposits * retailOutflowRate) + (corporateDeposits * corporateOutflowRate);
      const totalInflows = totalOutflows * 0.75; // Assumed 75% of outflows come back as inflows
      const netCashOutflows = Math.max(totalOutflows - totalInflows, totalOutflows * 0.25);

      const lcr = netCashOutflows > 0 ? (totalHQLA / netCashOutflows * 100) : 0;

      return {
        asOfDate,
        hqla: {
          level1: Math.round(level1Assets),
          level2A: Math.round(level2AAssets),
          level2B: Math.round(level2BAssets),
          totalHQLA: Math.round(totalHQLA)
        },
        cashFlows: {
          totalOutflows: Math.round(totalOutflows),
          totalInflows: Math.round(totalInflows),
          netCashOutflows: Math.round(netCashOutflows)
        },
        ratio: {
          lcr: lcr.toFixed(2),
          minimumRequirement: '100%',
          buffer: (lcr - 100).toFixed(2)
        },
        breakdown: {
          retailDeposits: {
            amount: Math.round(retailDeposits),
            outflowRate: `${(retailOutflowRate * 100).toFixed(0)}%`,
            outflow: Math.round(retailDeposits * retailOutflowRate)
          },
          corporateDeposits: {
            amount: Math.round(corporateDeposits),
            outflowRate: `${(corporateOutflowRate * 100).toFixed(0)}%`,
            outflow: Math.round(corporateDeposits * corporateOutflowRate)
          }
        }
      };
    } catch (error) {
      console.error('Error generating LCR report:', error);
      throw error;
    }
  }

  /**
   * Get Capital Adequacy Report
   */
  async getCapitalAdequacyReport(asOfDate) {
    try {
      const baselReport = await this.getBaselIIICompliance(asOfDate);
      
      // Add additional capital adequacy specific metrics
      return {
        ...baselReport.capitalAdequacy,
        asOfDate,
        capitalComponents: {
          commonEquity: Math.round(baselReport.capitalAdequacy.cet1Capital),
          additionalTier1: 0,
          tier2Instruments: Math.round(baselReport.capitalAdequacy.tier2Capital),
          deductions: 0
        },
        riskWeightedAssetsByType: {
          creditRisk: Math.round(baselReport.riskExposures.creditRisk),
          marketRisk: Math.round(baselReport.riskExposures.marketRisk),
          operationalRisk: Math.round(baselReport.riskExposures.operationalRisk),
          total: Math.round(baselReport.riskExposures.totalRWA)
        },
        complianceStatus: {
          cet1: parseFloat(baselReport.capitalAdequacy.cet1Ratio) >= 4.5 ? 'Compliant' : 'Non-Compliant',
          tier1: parseFloat(baselReport.capitalAdequacy.tier1Ratio) >= 6.0 ? 'Compliant' : 'Non-Compliant',
          total: parseFloat(baselReport.capitalAdequacy.totalCapitalRatio) >= 8.0 ? 'Compliant' : 'Non-Compliant'
        }
      };
    } catch (error) {
      console.error('Error generating capital adequacy report:', error);
      throw error;
    }
  }
}

export default new RegulatoryReportService();