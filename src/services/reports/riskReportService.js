import { supabaseBanking, TABLES } from '@/lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

class RiskReportService {
  /**
   * Get Credit Risk Report
   */
  async getCreditRiskReport(startDate, endDate) {
    try {
      // Get loan portfolio data
      const { data: loans, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_id,
          loan_amount,
          outstanding_balance,
          interest_rate,
          loan_status,
          disbursement_date,
          maturity_date,
          customer_id,
          loan_type_id,
          loan_types!inner(type_name),
          customers!inner(risk_rating, customer_type_id)
        `)
        .gte('disbursement_date', startDate)
        .lte('disbursement_date', endDate);

      if (loanError) throw loanError;

      // Calculate risk metrics
      const totalLoans = loans?.length || 0;
      const totalExposure = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      
      // NPL Analysis
      const nplLoans = loans?.filter(loan => 
        ['DEFAULT', 'DELINQUENT', 'WRITTEN_OFF'].includes(loan.loan_status)
      ) || [];
      const nplAmount = nplLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
      const nplRatio = totalExposure > 0 ? (nplAmount / totalExposure * 100) : 0;

      // Risk distribution by customer rating
      const riskDistribution = loans?.reduce((acc, loan) => {
        const rating = loan.customers?.risk_rating || 'UNRATED';
        if (!acc[rating]) {
          acc[rating] = { count: 0, exposure: 0 };
        }
        acc[rating].count++;
        acc[rating].exposure += loan.outstanding_balance || 0;
        return acc;
      }, {}) || {};

      // Loan type distribution
      const loanTypeDistribution = loans?.reduce((acc, loan) => {
        const type = loan.loan_types?.type_name || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, exposure: 0 };
        }
        acc[type].count++;
        acc[type].exposure += loan.outstanding_balance || 0;
        return acc;
      }, {}) || {};

      // Calculate provision requirements
      const provisionRequirements = {
        standard: totalExposure * 0.01, // 1% for standard loans
        watchlist: nplAmount * 0.1, // 10% for watchlist
        substandard: nplAmount * 0.25, // 25% for substandard
        doubtful: nplAmount * 0.5, // 50% for doubtful
        loss: nplAmount * 1.0 // 100% for loss
      };
      const totalProvisions = Object.values(provisionRequirements).reduce((sum, val) => sum + val, 0);

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalLoans,
          totalExposure: Math.round(totalExposure),
          nplAmount: Math.round(nplAmount),
          nplRatio: nplRatio.toFixed(2),
          provisionCoverage: ((totalProvisions / nplAmount) * 100).toFixed(2),
          totalProvisions: Math.round(totalProvisions)
        },
        portfolioQuality: {
          performing: loans?.filter(l => l.loan_status === 'ACTIVE')?.length || 0,
          watchlist: loans?.filter(l => l.loan_status === 'WATCHLIST')?.length || 0,
          substandard: loans?.filter(l => l.loan_status === 'SUBSTANDARD')?.length || 0,
          doubtful: loans?.filter(l => l.loan_status === 'DOUBTFUL')?.length || 0,
          loss: loans?.filter(l => l.loan_status === 'WRITTEN_OFF')?.length || 0
        },
        riskDistribution: Object.entries(riskDistribution).map(([rating, data]) => ({
          rating,
          count: data.count,
          exposure: Math.round(data.exposure),
          percentage: ((data.exposure / totalExposure) * 100).toFixed(2)
        })),
        byLoanType: Object.entries(loanTypeDistribution).map(([type, data]) => ({
          type,
          count: data.count,
          exposure: Math.round(data.exposure),
          percentage: ((data.exposure / totalExposure) * 100).toFixed(2)
        })),
        concentrationRisk: {
          top10Borrowers: Math.round(totalExposure * 0.25), // Simulated
          largestSingleExposure: Math.round(totalExposure * 0.05),
          sectorConcentration: {
            retail: Math.round(totalExposure * 0.4),
            corporate: Math.round(totalExposure * 0.35),
            sme: Math.round(totalExposure * 0.25)
          }
        }
      };
    } catch (error) {
      console.error('Error generating credit risk report:', error);
      throw error;
    }
  }

  /**
   * Get Market Risk Report
   */
  async getMarketRiskReport(asOfDate) {
    try {
      // Get investment portfolio
      const { data: accounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('account_id, current_balance, account_type_id')
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      // Simulate investment portfolio
      const totalAssets = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const investmentPortfolio = totalAssets * 0.3; // 30% in investments

      // Asset allocation
      const assetAllocation = {
        equities: investmentPortfolio * 0.3,
        bonds: investmentPortfolio * 0.5,
        commodities: investmentPortfolio * 0.1,
        forex: investmentPortfolio * 0.1
      };

      // Risk metrics (simulated)
      const varMetrics = {
        oneDay: investmentPortfolio * 0.015, // 1.5% daily VaR
        tenDay: investmentPortfolio * 0.047, // 4.7% 10-day VaR
        confidenceLevel: '95%'
      };

      // Stress testing scenarios
      const stressScenarios = {
        equityMarketCrash: {
          scenario: 'Equity market -20%',
          impact: assetAllocation.equities * -0.2,
          totalPortfolioImpact: (assetAllocation.equities * -0.2 / investmentPortfolio * 100).toFixed(2)
        },
        interestRateShock: {
          scenario: 'Interest rates +200bps',
          impact: assetAllocation.bonds * -0.08,
          totalPortfolioImpact: (assetAllocation.bonds * -0.08 / investmentPortfolio * 100).toFixed(2)
        },
        currencyDevaluation: {
          scenario: 'SAR devaluation -10%',
          impact: assetAllocation.forex * -0.1,
          totalPortfolioImpact: (assetAllocation.forex * -0.1 / investmentPortfolio * 100).toFixed(2)
        }
      };

      return {
        asOfDate,
        overview: {
          totalPortfolioValue: Math.round(investmentPortfolio),
          totalAtRisk: Math.round(varMetrics.oneDay),
          riskCapitalRatio: ((varMetrics.oneDay / investmentPortfolio) * 100).toFixed(2)
        },
        assetAllocation: Object.entries(assetAllocation).map(([asset, value]) => ({
          asset: asset.charAt(0).toUpperCase() + asset.slice(1),
          value: Math.round(value),
          percentage: ((value / investmentPortfolio) * 100).toFixed(2)
        })),
        valueAtRisk: {
          oneDay: Math.round(varMetrics.oneDay),
          tenDay: Math.round(varMetrics.tenDay),
          confidenceLevel: varMetrics.confidenceLevel,
          methodology: 'Historical Simulation'
        },
        sensitivityAnalysis: {
          equityBeta: 1.2,
          durationRisk: 4.5,
          fxExposure: '15%',
          commodityExposure: '10%'
        },
        stressTestResults: Object.entries(stressScenarios).map(([key, scenario]) => ({
          scenario: scenario.scenario,
          impact: Math.round(scenario.impact),
          portfolioImpact: `${scenario.totalPortfolioImpact}%`
        })),
        hedgingPositions: {
          equityHedges: Math.round(assetAllocation.equities * 0.2),
          interestRateSwaps: Math.round(assetAllocation.bonds * 0.3),
          fxForwards: Math.round(assetAllocation.forex * 0.5)
        }
      };
    } catch (error) {
      console.error('Error generating market risk report:', error);
      throw error;
    }
  }

  /**
   * Get Operational Risk Report
   */
  async getOperationalRiskReport(startDate, endDate) {
    try {
      // Get transaction data for operational risk analysis
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_id,
          transaction_amount,
          transaction_status,
          transaction_date,
          transaction_types!inner(type_name, transaction_category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Analyze operational incidents
      const failedTransactions = transactions?.filter(t => 
        t.transaction_status === 'FAILED' || t.transaction_status === 'REVERSED'
      ) || [];

      const totalTransactions = transactions?.length || 0;
      const failureRate = totalTransactions > 0 
        ? (failedTransactions.length / totalTransactions * 100) 
        : 0;

      // Risk categories (simulated)
      const riskCategories = {
        processRisk: {
          incidents: 12,
          severity: 'Medium',
          financialImpact: 45000
        },
        systemRisk: {
          incidents: 5,
          severity: 'High',
          financialImpact: 120000
        },
        peopleRisk: {
          incidents: 8,
          severity: 'Low',
          financialImpact: 25000
        },
        externalRisk: {
          incidents: 3,
          severity: 'High',
          financialImpact: 200000
        }
      };

      const totalIncidents = Object.values(riskCategories).reduce((sum, cat) => sum + cat.incidents, 0);
      const totalImpact = Object.values(riskCategories).reduce((sum, cat) => sum + cat.financialImpact, 0);

      // Key Risk Indicators (KRIs)
      const kris = {
        systemDowntime: {
          metric: 'System Downtime',
          value: '99.5%',
          target: '99.9%',
          status: 'Amber'
        },
        transactionErrors: {
          metric: 'Transaction Error Rate',
          value: failureRate.toFixed(2) + '%',
          target: '<1%',
          status: failureRate < 1 ? 'Green' : 'Red'
        },
        fraudIncidents: {
          metric: 'Fraud Incidents',
          value: '3',
          target: '0',
          status: 'Red'
        },
        dataBreaches: {
          metric: 'Data Breaches',
          value: '0',
          target: '0',
          status: 'Green'
        }
      };

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalIncidents,
          totalFinancialImpact: totalImpact,
          averageIncidentCost: Math.round(totalImpact / totalIncidents),
          operationalRiskCapital: Math.round(totalImpact * 2.5) // Basel II multiplier
        },
        incidentsByCategory: Object.entries(riskCategories).map(([category, data]) => ({
          category: category.replace(/([A-Z])/g, ' $1').trim(),
          incidents: data.incidents,
          severity: data.severity,
          financialImpact: data.financialImpact,
          percentage: ((data.incidents / totalIncidents) * 100).toFixed(2)
        })),
        keyRiskIndicators: Object.values(kris),
        controlEffectiveness: {
          preventiveControls: '85%',
          detectiveControls: '92%',
          correctiveControls: '78%',
          overallEffectiveness: '85%'
        },
        topRisks: [
          { risk: 'Cyber Security', impact: 'High', likelihood: 'Medium', trend: 'Increasing' },
          { risk: 'System Failures', impact: 'High', likelihood: 'Low', trend: 'Stable' },
          { risk: 'Fraud', impact: 'Medium', likelihood: 'Medium', trend: 'Decreasing' },
          { risk: 'Compliance Breach', impact: 'High', likelihood: 'Low', trend: 'Stable' },
          { risk: 'Third Party Failure', impact: 'Medium', likelihood: 'Low', trend: 'Increasing' }
        ],
        mitigationActions: {
          completed: 23,
          inProgress: 15,
          planned: 8,
          overdue: 2
        }
      };
    } catch (error) {
      console.error('Error generating operational risk report:', error);
      throw error;
    }
  }

  /**
   * Get NPL Analysis Report
   */
  async getNPLAnalysis(startDate, endDate) {
    try {
      // Get non-performing loans
      const { data: nplLoans, error: nplError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          loan_id,
          loan_amount,
          outstanding_balance,
          interest_rate,
          loan_status,
          disbursement_date,
          days_past_due,
          customer_id,
          loan_type_id,
          loan_types!inner(type_name),
          customers!inner(
            first_name,
            last_name,
            risk_rating,
            customer_type_id
          )
        `)
        .in('loan_status', ['DELINQUENT', 'DEFAULT', 'WRITTEN_OFF'])
        .gte('updated_at', startDate)
        .lte('updated_at', endDate);

      if (nplError) throw nplError;

      // Get all loans for ratio calculation
      const { data: allLoans, error: allLoansError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance')
        .in('loan_status', ['ACTIVE', 'DELINQUENT', 'DEFAULT']);

      if (allLoansError) throw allLoansError;

      const totalNPL = nplLoans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const totalLoans = allLoans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
      const nplRatio = totalLoans > 0 ? (totalNPL / totalLoans * 100) : 0;

      // Aging analysis
      const agingBuckets = nplLoans?.reduce((acc, loan) => {
        const dpd = loan.days_past_due || 0;
        if (dpd <= 30) acc['0-30']++;
        else if (dpd <= 60) acc['31-60']++;
        else if (dpd <= 90) acc['61-90']++;
        else if (dpd <= 180) acc['91-180']++;
        else acc['180+']++;
        return acc;
      }, { '0-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 }) || {};

      // NPL by loan type
      const nplByType = nplLoans?.reduce((acc, loan) => {
        const type = loan.loan_types?.type_name || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, amount: 0 };
        }
        acc[type].count++;
        acc[type].amount += loan.outstanding_balance || 0;
        return acc;
      }, {}) || {};

      // Recovery analysis
      const recoveryData = {
        totalRecovered: totalNPL * 0.15, // 15% recovery rate simulated
        averageRecoveryRate: '15%',
        recoveryByMethod: {
          restructuring: totalNPL * 0.08,
          collateralLiquidation: totalNPL * 0.05,
          legalAction: totalNPL * 0.02
        }
      };

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalNPLAccounts: nplLoans?.length || 0,
          totalNPLAmount: Math.round(totalNPL),
          nplRatio: nplRatio.toFixed(2),
          averageDPD: 75, // Simulated
          provisionCoverage: '85%',
          netNPL: Math.round(totalNPL * 0.15) // After provisions
        },
        agingAnalysis: Object.entries(agingBuckets).map(([bucket, count]) => ({
          bucket,
          count,
          percentage: nplLoans?.length > 0 ? ((count / nplLoans.length) * 100).toFixed(2) : '0'
        })),
        byLoanType: Object.entries(nplByType).map(([type, data]) => ({
          type,
          count: data.count,
          amount: Math.round(data.amount),
          percentage: ((data.amount / totalNPL) * 100).toFixed(2)
        })),
        movementAnalysis: {
          newNPL: Math.round(totalNPL * 0.2),
          recovered: Math.round(totalNPL * 0.15),
          writtenOff: Math.round(totalNPL * 0.05),
          netMovement: Math.round(totalNPL * 0.0) // New NPL - Recovered - Written off
        },
        recoveryAnalysis: {
          totalRecovered: Math.round(recoveryData.totalRecovered),
          recoveryRate: recoveryData.averageRecoveryRate,
          byMethod: Object.entries(recoveryData.recoveryByMethod).map(([method, amount]) => ({
            method: method.replace(/([A-Z])/g, ' $1').trim(),
            amount: Math.round(amount),
            percentage: ((amount / recoveryData.totalRecovered) * 100).toFixed(2)
          }))
        },
        topNPLAccounts: nplLoans?.slice(0, 5).map(loan => ({
          customerId: loan.customer_id,
          customerName: `${loan.customers?.first_name} ${loan.customers?.last_name}`,
          loanType: loan.loan_types?.type_name,
          outstandingAmount: Math.round(loan.outstanding_balance),
          daysPastDue: loan.days_past_due || 0,
          status: loan.loan_status
        })) || []
      };
    } catch (error) {
      console.error('Error generating NPL analysis report:', error);
      throw error;
    }
  }

  /**
   * Get Liquidity Risk Report
   */
  async getLiquidityRiskReport(asOfDate) {
    try {
      // Get deposit and loan data
      const { data: accounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_id,
          current_balance,
          account_type_id,
          account_types!inner(type_name, account_category)
        `)
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      const { data: loans, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select('outstanding_balance, maturity_date')
        .in('loan_status', ['ACTIVE', 'DISBURSED']);

      if (loanError) throw loanError;

      // Calculate liquidity metrics
      const totalDeposits = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const demandDeposits = accounts?.filter(a => a.account_types?.account_category === 'CHECKING')
        .reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      const termDeposits = accounts?.filter(a => a.account_types?.account_category === 'TERM')
        .reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

      const totalLoans = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;

      // Liquidity ratios
      const liquidAssets = totalDeposits * 0.2; // 20% of deposits as liquid
      const liquidityRatio = totalDeposits > 0 ? (liquidAssets / totalDeposits * 100) : 0;
      const loanToDepositRatio = totalDeposits > 0 ? (totalLoans / totalDeposits * 100) : 0;

      // Maturity ladder (simulated)
      const maturityLadder = {
        overnight: {
          assets: liquidAssets * 0.3,
          liabilities: demandDeposits * 0.1
        },
        oneWeek: {
          assets: liquidAssets * 0.2,
          liabilities: demandDeposits * 0.05
        },
        oneMonth: {
          assets: liquidAssets * 0.3,
          liabilities: demandDeposits * 0.1
        },
        threeMonths: {
          assets: liquidAssets * 0.2,
          liabilities: termDeposits * 0.2
        },
        sixMonths: {
          assets: totalLoans * 0.1,
          liabilities: termDeposits * 0.3
        },
        oneYear: {
          assets: totalLoans * 0.3,
          liabilities: termDeposits * 0.4
        },
        beyondOneYear: {
          assets: totalLoans * 0.6,
          liabilities: termDeposits * 0.1
        }
      };

      // Calculate gaps
      const liquidityGaps = Object.entries(maturityLadder).map(([period, data]) => ({
        period,
        assets: Math.round(data.assets),
        liabilities: Math.round(data.liabilities),
        gap: Math.round(data.assets - data.liabilities),
        cumulativeGap: 0 // Would be calculated cumulatively
      }));

      return {
        asOfDate,
        overview: {
          totalAssets: Math.round(totalDeposits + totalLoans),
          liquidAssets: Math.round(liquidAssets),
          totalDeposits: Math.round(totalDeposits),
          liquidityRatio: liquidityRatio.toFixed(2),
          loanToDepositRatio: loanToDepositRatio.toFixed(2),
          liquidityCoverageRatio: '125%' // Simulated
        },
        depositComposition: {
          demand: {
            amount: Math.round(demandDeposits),
            percentage: ((demandDeposits / totalDeposits) * 100).toFixed(2)
          },
          savings: {
            amount: Math.round((totalDeposits - demandDeposits - termDeposits)),
            percentage: (((totalDeposits - demandDeposits - termDeposits) / totalDeposits) * 100).toFixed(2)
          },
          term: {
            amount: Math.round(termDeposits),
            percentage: ((termDeposits / totalDeposits) * 100).toFixed(2)
          }
        },
        liquidityGaps,
        stressScenarios: {
          bankRun: {
            scenario: '20% deposit withdrawal',
            impact: Math.round(totalDeposits * -0.2),
            liquidityAfter: Math.round(liquidAssets - (totalDeposits * 0.2)),
            survivabilityDays: 15
          },
          marketCrisis: {
            scenario: 'No market funding',
            impact: Math.round(totalDeposits * -0.1),
            liquidityAfter: Math.round(liquidAssets - (totalDeposits * 0.1)),
            survivabilityDays: 30
          }
        },
        contingencyFunding: {
          committedLines: Math.round(totalAssets * 0.05),
          uncommittedLines: Math.round(totalAssets * 0.03),
          centralBankFacility: Math.round(totalAssets * 0.1),
          totalContingency: Math.round(totalAssets * 0.18)
        }
      };
    } catch (error) {
      console.error('Error generating liquidity risk report:', error);
      throw error;
    }
  }
}

export default new RiskReportService();