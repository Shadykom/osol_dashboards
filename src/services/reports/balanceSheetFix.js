import { supabase } from '@/lib/supabase';

export async function getBalanceSheetData(reportDate) {
  try {
    // Get loan accounts data with proper join syntax
    const { data: loanData, error: loanError } = await supabase
      .from('loan_accounts')
      .select(`
        outstanding_balance,
        loan_status,
        loan_amount,
        disbursement_date,
        loan_type_id,
        loan_types (
          type_name,
          max_amount
        )
      `)
      .in('loan_status', ['ACTIVE', 'DISBURSED'])
      .lte('disbursement_date', reportDate || new Date().toISOString());

    if (loanError) {
      console.error('Error fetching loan data:', loanError);
      // Fallback query without join
      const { data: fallbackData } = await supabase
        .from('loan_accounts')
        .select('outstanding_balance, loan_status, loan_amount, disbursement_date')
        .in('loan_status', ['ACTIVE', 'DISBURSED'])
        .lte('disbursement_date', reportDate || new Date().toISOString());
      
      return { loans: fallbackData || [] };
    }

    // Get other balance sheet components
    const { data: accounts } = await supabase
      .from('accounts')
      .select('account_type_id, current_balance')
      .eq('account_status', 'ACTIVE');

    const { data: deposits } = await supabase
      .from('deposit_accounts')
      .select('balance, account_type');

    // Calculate totals
    const totalLoans = loanData?.reduce((sum, loan) => 
      sum + (loan.outstanding_balance || 0), 0) || 0;

    const totalDeposits = deposits?.reduce((sum, deposit) => 
      sum + (deposit.balance || 0), 0) || 0;

    const cashAndBalances = accounts?.filter(acc => 
      acc.account_type_id === 1 || acc.account_type_id === 2
    ).reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

    return {
      assets: {
        cashAndBalances,
        loans: totalLoans,
        total: cashAndBalances + totalLoans
      },
      liabilities: {
        deposits: totalDeposits,
        total: totalDeposits
      },
      equity: {
        total: (cashAndBalances + totalLoans) - totalDeposits
      }
    };
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    throw error;
  }
}

// Export a function to fix the reports module
export function fixBalanceSheetReport() {
  // Override the problematic query in the reports module
  if (window.reportsModule) {
    window.reportsModule.getBalanceSheet = getBalanceSheetData;
  }
  
  // Also fix any Supabase query syntax issues
  const originalFrom = supabase.from;
  supabase.from = function(table) {
    const query = originalFrom.call(this, table);
    const originalSelect = query.select;
    
    query.select = function(columns) {
      // Fix the !inner syntax to proper join syntax
      if (columns && columns.includes('!inner')) {
        columns = columns.replace(/(\w+)!inner\(([^)]+)\)/g, '$1 ($2)');
      }
      return originalSelect.call(this, columns);
    };
    
    return query;
  };
}

// Auto-fix on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', fixBalanceSheetReport);
}