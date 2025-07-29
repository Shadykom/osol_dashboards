import { supabaseBanking } from '@/lib/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect to the customers table
    const { data: customers, error: customersError } = await supabaseBanking
      .from('public.customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.error('❌ Customers table error:', customersError);
    } else {
      console.log('✅ Customers table accessible:', customers?.length || 0, 'records');
    }
    
    // Test 2: Check accounts table
    const { data: accounts, error: accountsError } = await supabaseBanking
      .from('kastle_banking.accounts')
      .select('*')
      .limit(1);
    
    if (accountsError) {
      console.error('❌ Accounts table error:', accountsError);
    } else {
      console.log('✅ Accounts table accessible:', accounts?.length || 0, 'records');
    }
    
    // Test 3: Check transactions table
    const { data: transactions, error: transactionsError } = await supabaseBanking
      .from('kastle_banking.transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.error('❌ Transactions table error:', transactionsError);
    } else {
      console.log('✅ Transactions table accessible:', transactions?.length || 0, 'records');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { success: false, error };
  }
}