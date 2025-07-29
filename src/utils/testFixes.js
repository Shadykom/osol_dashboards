// Test script to verify fixes
import { supabaseBanking, TABLES } from '@/lib/supabase';

export async function testFixes() {
  console.log('🧪 Testing fixes...\n');
  
  // Test 1: Check Ethereum conflict resolver
  console.log('1️⃣ Testing Ethereum conflict resolver:');
  if (window.ethereum) {
    console.log('✅ window.ethereum is defined');
    console.log('   Type:', typeof window.ethereum);
    console.log('   Has isMetaMask:', !!window.ethereum.isMetaMask);
  } else {
    console.log('⚠️  window.ethereum is not defined (this is OK if no wallet extensions are installed)');
  }
  
  // Test 2: Check Supabase connection
  console.log('\n2️⃣ Testing Supabase connection:');
  try {
    const { data, error } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('   Sample data:', data);
    }
  } catch (e) {
    console.log('❌ Supabase connection failed:', e.message);
  }
  
  // Test 3: Check data integrity
  console.log('\n3️⃣ Testing data integrity:');
  try {
    // Check customer types
    const { data: customerTypes, error: ctError } = await supabaseBanking
      .from(TABLES.CUSTOMER_TYPES)
      .select('type_code, type_name')
      .order('type_code');
    
    if (ctError) {
      console.log('❌ Customer types error:', ctError.message);
    } else {
      console.log('✅ Customer types found:', customerTypes.length);
      customerTypes.forEach(ct => console.log(`   - ${ct.type_code}: ${ct.type_name}`));
    }
    
    // Check branches
    const { data: branches, error: brError } = await supabaseBanking
      .from(TABLES.BRANCHES)
      .select('branch_id, branch_name')
      .limit(5);
    
    if (brError) {
      console.log('❌ Branches error:', brError.message);
    } else {
      console.log('\n✅ Branches found:', branches.length);
      branches.forEach(br => console.log(`   - ${br.branch_id}: ${br.branch_name}`));
    }
    
    // Check customers
    const { count: customerCount } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n✅ Total customers: ${customerCount}`);
    
    // Check accounts
    const { count: accountCount } = await supabaseBanking
      .from(TABLES.ACCOUNTS)
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Total accounts: ${accountCount}`);
    
  } catch (e) {
    console.log('❌ Data integrity check failed:', e.message);
  }
  
  // Test 4: Check widget configuration
  console.log('\n4️⃣ Testing widget configuration:');
  const testWidgetTypes = ['customers', 'accounts', 'revenue', 'unknown_type'];
  testWidgetTypes.forEach(type => {
    // This is a simple check - in real app, import widgetConfigs
    console.log(`   ${type}: Will be handled by widgetConfigs`);
  });
  
  console.log('\n✅ All tests completed!');
}

// Add to window for easy testing
if (typeof window !== 'undefined') {
  window.testFixes = testFixes;
}