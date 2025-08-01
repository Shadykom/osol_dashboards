import { supabaseBanking, TABLES } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

class FinancialReportService {
  /**
   * Get Income Statement Report
   */
  async getIncomeStatement(startDate, endDate) {
    try {
      // Get transaction data for revenue
      const { data: transactionData, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_amount,
          transaction_type_id,
          transaction_date,
          transaction_types!inner(type_name)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Calculate transaction fees (1.5% average)
      const totalTransactionVolume = transactionData?.reduce((sum, t) => 
        sum + (t.transaction_amount || 0), 0) || 0;
      const transactionFees = totalTransactionVolume * 0.015;

      // Get loan interest income
      const { data: loanData, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          interest_rate, 
          outstanding_balance, 
          loan_status,
          loan_amount,
          disbursement_date
        `)
        .eq('loan_status', 'ACTIVE')
        .lte('disbursement_date', endDate);

      if (loanError) throw loanError;

      // Calculate monthly interest income
      const monthlyInterestIncome = loanData?.reduce((sum, loan) => {
        const monthlyInterest = (loan.outstanding_balance * (loan.interest_rate / 100) / 12) || 0;
        return sum + monthlyInterest;
      }, 0) || 0;

      // Get account fees
      const { data: accountData, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_type_id,
          current_balance,
          account_status,
          created_at,
          account_types!inner(type_name)
        `)
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      // Calculate account monthly fees
      const accountMonthlyFees = accountData?.reduce((sum, account) => {
        let monthlyFee = 0;
        switch(account.account_type_id) {
          case 1: monthlyFee = 10; break; // Savings
          case 2: monthlyFee = 25; break; // Checking
          case 3: monthlyFee = 50; break; // Business
          default: monthlyFee = 15;
        }
        return sum + monthlyFee;
      }, 0) || 0;

      // Calculate expenses (simulated based on revenue)
      const totalRevenue = transactionFees + monthlyInterestIncome + accountMonthlyFees;
      const personnelExpenses = totalRevenue * 0.35;
      const administrativeExpenses = totalRevenue * 0.15;
      const technologyExpenses = totalRevenue * 0.10;
      const marketingExpenses = totalRevenue * 0.05;
      const otherExpenses = totalRevenue * 0.05;
      const totalExpenses = personnelExpenses + administrativeExpenses + technologyExpenses + marketingExpenses + otherExpenses;

      const operatingIncome = totalRevenue - totalExpenses;
      const taxRate = 0.20;
      const taxExpense = operatingIncome * taxRate;
      const netIncome = operatingIncome - taxExpense;

      return {
        period: {
          startDate,
          endDate
        },
        revenue: {
          interestIncome: Math.round(monthlyInterestIncome),
          feeIncome: Math.round(accountMonthlyFees),
          commissionIncome: Math.round(transactionFees),
          otherIncome: Math.round(totalRevenue * 0.02),
          totalRevenue: Math.round(totalRevenue)
        },
        expenses: {
          personnelExpenses: Math.round(personnelExpenses),
          administrativeExpenses: Math.round(administrativeExpenses),
          technologyExpenses: Math.round(technologyExpenses),
          marketingExpenses: Math.round(marketingExpenses),
          otherExpenses: Math.round(otherExpenses),
          totalExpenses: Math.round(totalExpenses)
        },
        summary: {
          operatingIncome: Math.round(operatingIncome),
          netIncomeBeforeTax: Math.round(operatingIncome),
          taxExpense: Math.round(taxExpense),
          netIncome: Math.round(netIncome)
        },
        metrics: {
          operatingMargin: (operatingIncome / totalRevenue * 100) || 0,
          netMargin: (netIncome / totalRevenue * 100) || 0,
          revenueGrowth: 5.2, // Simulated
          expenseRatio: (totalExpenses / totalRevenue * 100) || 0
        }
      };
    } catch (error) {
      console.error('Error generating income statement:', error);
      throw error;
    }
  }

  /**
   * Get Balance Sheet Report
   */
  async getBalanceSheet(asOfDate) {
    try {
      // Get account balances
      const { data: accountData, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_id,
          current_balance,
          account_status,
          account_type_id,
          account_types!inner(
            type_name,
            account_category
          )
        `)
        .eq('account_status', 'ACTIVE');

      if (accountError) throw accountError;

      // Get loan balances
      const { data: loanData, error: loanError } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          outstanding_balance, 
          loan_status,
          loan_amount,
          disbursement_date,
          loan_types!inner(
            type_name,
            max_amount
          )
        `)
        .in('loan_status', ['ACTIVE', 'DISBURSED'])
        .lte('disbursement_date', asOfDate);

      if (loanError) throw loanError;

      // Calculate asset components
      const cashAndEquivalents = accountData?.reduce((sum, acc) => {
        if (acc.account_types?.account_category === 'CHECKING') {
          return sum + (acc.current_balance * 0.2 || 0);
        }
        return sum;
      }, 0) || 0;

      const totalLoans = loanData?.reduce((sum, loan) => 
        sum + (loan.outstanding_balance || 0), 0) || 0;

      const investments = accountData?.filter(acc => 
        acc.current_balance > 100000 && acc.account_types?.account_category === 'SAVINGS'
      ).reduce((sum, acc) => sum + (acc.current_balance * 0.7 || 0), 0) || 0;

      const fixedAssets = (cashAndEquivalents + totalLoans) * 0.05;
      const otherAssets = (cashAndEquivalents + totalLoans) * 0.03;

      // Calculate liability components
      const totalDeposits = accountData?.reduce((sum, acc) => 
        sum + (acc.current_balance || 0), 0) || 0;

      const savingsDeposits = accountData?.reduce((sum, acc) => {
        if (acc.account_types?.account_category === 'SAVINGS') {
          return sum + (acc.current_balance || 0);
        }
        return sum;
      }, 0) || 0;

      const checkingDeposits = accountData?.reduce((sum, acc) => {
        if (acc.account_types?.account_category === 'CHECKING') {
          return sum + (acc.current_balance || 0);
        }
        return sum;
      }, 0) || 0;

      const borrowings = totalLoans * 0.2;
      const otherLiabilities = totalDeposits * 0.05;

      // Calculate totals
      const totalAssets = cashAndEquivalents + totalLoans + investments + fixedAssets + otherAssets;
      const totalLiabilities = totalDeposits + borrowings + otherLiabilities;
      const totalEquity = totalAssets - totalLiabilities;

      return {
        asOfDate,
        assets: {
          cash: Math.round(cashAndEquivalents),
          loans: Math.round(totalLoans),
          investments: Math.round(investments),
          fixedAssets: Math.round(fixedAssets),
          otherAssets: Math.round(otherAssets),
          totalAssets: Math.round(totalAssets)
        },
        liabilities: {
          deposits: Math.round(totalDeposits),
          savingsDeposits: Math.round(savingsDeposits),
          checkingDeposits: Math.round(checkingDeposits),
          borrowings: Math.round(borrowings),
          otherLiabilities: Math.round(otherLiabilities),
          totalLiabilities: Math.round(totalLiabilities)
        },
        equity: {
          paidInCapital: Math.round(totalEquity * 0.6),
          retainedEarnings: Math.round(totalEquity * 0.35),
          otherEquity: Math.round(totalEquity * 0.05),
          totalEquity: Math.round(totalEquity)
        },
        metrics: {
          totalAccounts: accountData?.length || 0,
          totalLoans: loanData?.length || 0,
          debtToEquityRatio: totalEquity > 0 ? (totalLiabilities / totalEquity).toFixed(2) : 0,
          currentRatio: totalLiabilities > 0 ? (cashAndEquivalents / totalLiabilities).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw error;
    }
  }

  /**
   * Get Cash Flow Statement
   */
  async getCashFlowStatement(startDate, endDate) {
    try {
      // Get transaction data
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_amount,
          transaction_type_id,
          transaction_date,
          transaction_types!inner(type_name, transaction_category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Categorize cash flows
      const operatingInflows = transactions?.filter(t => 
        ['CREDIT', 'CHARGE', 'INTEREST'].includes(t.transaction_types?.transaction_category)
      ).reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;

      const operatingOutflows = transactions?.filter(t => 
        ['DEBIT', 'TRANSFER'].includes(t.transaction_types?.transaction_category) && t.transaction_amount < 0
      ).reduce((sum, t) => sum + Math.abs(t.transaction_amount || 0), 0) || 0;

      const investingInflows = transactions?.filter(t => 
        t.transaction_types?.type_name?.includes('Investment Sale') || 
        t.transaction_types?.type_name?.includes('Asset Sale')
      ).reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;

      const investingOutflows = transactions?.filter(t => 
        t.transaction_types?.type_name?.includes('Investment Purchase') || 
        t.transaction_types?.type_name?.includes('Asset Purchase')
      ).reduce((sum, t) => sum + Math.abs(t.transaction_amount || 0), 0) || 0;

      const financingInflows = transactions?.filter(t => 
        t.transaction_types?.type_name?.includes('Loan') && t.transaction_amount > 0
      ).reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;

      const financingOutflows = transactions?.filter(t => 
        (t.transaction_types?.type_name?.includes('Loan') || 
         t.transaction_types?.type_name?.includes('Dividend')) && t.transaction_amount < 0
      ).reduce((sum, t) => sum + Math.abs(t.transaction_amount || 0), 0) || 0;

      // Calculate net cash flows
      const netOperatingCashFlow = operatingInflows - operatingOutflows;
      const netInvestingCashFlow = investingInflows - investingOutflows;
      const netFinancingCashFlow = financingInflows - financingOutflows;
      const netCashFlow = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

      // Get beginning and ending cash
      const { data: beginningAccount } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_type_id', 2) // Checking accounts
        .lte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: endingAccount } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select('current_balance')
        .eq('account_type_id', 2) // Checking accounts
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1);

      const beginningCash = beginningAccount?.[0]?.current_balance || 0;
      const endingCash = endingAccount?.[0]?.current_balance || (beginningCash + netCashFlow);

      return {
        period: {
          startDate,
          endDate
        },
        operatingActivities: {
          inflows: Math.round(operatingInflows),
          outflows: Math.round(operatingOutflows),
          netCashFlow: Math.round(netOperatingCashFlow)
        },
        investingActivities: {
          inflows: Math.round(investingInflows),
          outflows: Math.round(investingOutflows),
          netCashFlow: Math.round(netInvestingCashFlow)
        },
        financingActivities: {
          inflows: Math.round(financingInflows),
          outflows: Math.round(financingOutflows),
          netCashFlow: Math.round(netFinancingCashFlow)
        },
        summary: {
          beginningCash: Math.round(beginningCash),
          netIncrease: Math.round(netCashFlow),
          endingCash: Math.round(endingCash)
        },
        metrics: {
          operatingCashFlowRatio: operatingInflows > 0 ? (netOperatingCashFlow / operatingInflows * 100) : 0,
          cashFlowMargin: netCashFlow > 0 ? (netCashFlow / (operatingInflows + investingInflows + financingInflows) * 100) : 0
        }
      };
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      throw error;
    }
  }

  /**
   * Get Profit & Loss Statement (similar to Income Statement with more detail)
   */
  async getProfitLossStatement(startDate, endDate) {
    try {
      // Get the income statement data first
      const incomeData = await this.getIncomeStatement(startDate, endDate);

      // Add more detailed breakdown
      const { data: transactionData, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          transaction_amount,
          transaction_type_id,
          transaction_types!inner(type_name, transaction_category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Group transactions by type
      const transactionsByType = transactionData?.reduce((acc, t) => {
        const typeName = t.transaction_types?.type_name || 'Other';
        if (!acc[typeName]) acc[typeName] = 0;
        acc[typeName] += t.transaction_amount || 0;
        return acc;
      }, {}) || {};

      return {
        ...incomeData,
        detailedRevenue: {
          ...incomeData.revenue,
          byTransactionType: transactionsByType
        },
        detailedExpenses: {
          ...incomeData.expenses,
          salaries: Math.round(incomeData.expenses.personnelExpenses * 0.8),
          benefits: Math.round(incomeData.expenses.personnelExpenses * 0.2),
          rent: Math.round(incomeData.expenses.administrativeExpenses * 0.4),
          utilities: Math.round(incomeData.expenses.administrativeExpenses * 0.2),
          supplies: Math.round(incomeData.expenses.administrativeExpenses * 0.2),
          other: Math.round(incomeData.expenses.administrativeExpenses * 0.2)
        }
      };
    } catch (error) {
      console.error('Error generating profit & loss statement:', error);
      throw error;
    }
  }

  /**
   * Get Budget Variance Analysis
   */
  async getBudgetVarianceAnalysis(startDate, endDate) {
    try {
      // Get actual data
      const actualData = await this.getIncomeStatement(startDate, endDate);

      // Generate budget data (simulated - in real app, this would come from budget tables)
      const budgetData = {
        revenue: {
          interestIncome: actualData.revenue.interestIncome * 0.95,
          feeIncome: actualData.revenue.feeIncome * 0.98,
          commissionIncome: actualData.revenue.commissionIncome * 1.02,
          otherIncome: actualData.revenue.otherIncome * 1.0,
          totalRevenue: actualData.revenue.totalRevenue * 0.97
        },
        expenses: {
          personnelExpenses: actualData.expenses.personnelExpenses * 1.05,
          administrativeExpenses: actualData.expenses.administrativeExpenses * 1.02,
          technologyExpenses: actualData.expenses.technologyExpenses * 0.98,
          marketingExpenses: actualData.expenses.marketingExpenses * 1.10,
          otherExpenses: actualData.expenses.otherExpenses * 1.0,
          totalExpenses: actualData.expenses.totalExpenses * 1.03
        }
      };

      // Calculate variances
      const revenueVariances = {};
      const expenseVariances = {};

      Object.keys(actualData.revenue).forEach(key => {
        const actual = actualData.revenue[key];
        const budget = budgetData.revenue[key];
        const variance = actual - budget;
        const variancePercent = budget > 0 ? (variance / budget * 100) : 0;
        
        revenueVariances[key] = {
          actual: Math.round(actual),
          budget: Math.round(budget),
          variance: Math.round(variance),
          variancePercent: variancePercent.toFixed(2)
        };
      });

      Object.keys(actualData.expenses).forEach(key => {
        const actual = actualData.expenses[key];
        const budget = budgetData.expenses[key];
        const variance = actual - budget;
        const variancePercent = budget > 0 ? (variance / budget * 100) : 0;
        
        expenseVariances[key] = {
          actual: Math.round(actual),
          budget: Math.round(budget),
          variance: Math.round(variance),
          variancePercent: variancePercent.toFixed(2)
        };
      });

      return {
        period: {
          startDate,
          endDate
        },
        revenue: revenueVariances,
        expenses: expenseVariances,
        summary: {
          totalRevenueVariance: Math.round(actualData.revenue.totalRevenue - budgetData.revenue.totalRevenue),
          totalExpenseVariance: Math.round(actualData.expenses.totalExpenses - budgetData.expenses.totalExpenses),
          netIncomeVariance: Math.round(
            (actualData.revenue.totalRevenue - actualData.expenses.totalExpenses) -
            (budgetData.revenue.totalRevenue - budgetData.expenses.totalExpenses)
          )
        },
        metrics: {
          revenueAchievement: (actualData.revenue.totalRevenue / budgetData.revenue.totalRevenue * 100).toFixed(2),
          expenseControl: (actualData.expenses.totalExpenses / budgetData.expenses.totalExpenses * 100).toFixed(2),
          overallPerformance: actualData.revenue.totalRevenue > budgetData.revenue.totalRevenue ? 'Above Budget' : 'Below Budget'
        }
      };
    } catch (error) {
      console.error('Error generating budget variance analysis:', error);
      throw error;
    }
  }
}

export default new FinancialReportService();