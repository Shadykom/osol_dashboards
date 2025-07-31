import { supabaseBanking, TABLES } from '@/lib/supabase';

export async function testCustomerCount() {
  console.log('=== Testing Customer Count ===');
  
  try {
    // Test 1: Direct count query
    console.log('\n1. Testing direct count query...');
    const { count, error, status, statusText } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('*', { count: 'exact', head: true });
    
    console.log('Result:', { count, error, status, statusText });
    
    // Test 2: Get actual data
    console.log('\n2. Fetching actual customer data...');
    const { data, error: dataError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id, full_name, created_at')
      .limit(10);
    
    console.log('Data result:', { 
      recordCount: data?.length || 0, 
      error: dataError,
      sampleData: data?.slice(0, 3) 
    });
    
    // Test 3: Check if table exists
    console.log('\n3. Checking if table exists...');
    const { data: tableCheck, error: tableError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id')
      .limit(1);
    
    console.log('Table exists:', !tableError);
    if (tableError) {
      console.error('Table error:', tableError);
    }
    
    // Test 4: Try different count method
    console.log('\n4. Testing alternative count method...');
    const { data: allCustomers, error: allError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id');
    
    console.log('Alternative count:', {
      count: allCustomers?.length || 0,
      error: allError
    });
    
    return {
      directCount: count || 0,
      dataCount: data?.length || 0,
      alternativeCount: allCustomers?.length || 0,
      errors: { countError: error, dataError, tableError, allError }
    };
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return { error: err.message };
  }
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  window.testCustomerCount = testCustomerCount;
}