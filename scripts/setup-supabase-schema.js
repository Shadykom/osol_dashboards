import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE';

console.log('🚀 Testing Supabase Connection...\n');

// Create client for kastle_banking schema
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'kastle_banking'
  },
  auth: {
    persistSession: false
  }
});

async function testConnection() {
  console.log('1. Testing basic connection...');
  
  // Test public schema access first
  const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' }
  });
  
  const { data: publicTest, error: publicError } = await publicClient
    .from('_prisma_migrations')
    .select('*')
    .limit(1);
  
  if (publicError) {
    console.log('❌ Public schema test failed:', publicError.message);
  } else {
    console.log('✅ Public schema accessible');
  }
  
  console.log('\n2. Testing kastle_banking schema...');
  
  // Test kastle_banking schema
  const { data: bankingTest, error: bankingError } = await supabase
    .from('customers')
    .select('customer_id')
    .limit(1);
  
  if (bankingError) {
    console.log('❌ kastle_banking schema test failed:', bankingError.message);
    
    if (bankingError.code === '42P01' || bankingError.message.includes('relation') || bankingError.message.includes('does not exist')) {
      console.log('\n⚠️  IMPORTANT: The kastle_banking schema is not exposed in Supabase!');
      console.log('\nTo fix this:');
      console.log('1. Go to: https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api');
      console.log('2. Scroll to "Exposed schemas" section');
      console.log('3. Add "kastle_banking" to the list of exposed schemas');
      console.log('4. Click "Save"');
      console.log('5. Wait a few seconds and run this script again');
    }
  } else {
    console.log('✅ kastle_banking schema is accessible!');
    console.log('Sample data:', bankingTest);
  }
  
  console.log('\n3. Testing available tables in kastle_banking schema...');
  
  const tables = [
    'customers',
    'accounts', 
    'transactions',
    'loan_accounts',
    'branches',
    'products',
    'collection_cases'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: accessible`);
    }
  }
  
  console.log('\n4. Testing data insertion (if schema is accessible)...');
  
  if (!bankingError) {
    // Try to count existing data
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current customer count: ${customerCount || 0}`);
    
    if (customerCount === 0) {
      console.log('\n⚠️  No data found in the database.');
      console.log('You may want to run the data seeder to populate sample data.');
    }
  }
}

testConnection().catch(console.error);