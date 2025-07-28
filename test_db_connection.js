import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Database connection from your provided URL
const connectionString = 'postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres';
const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing database connection...');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'kastle_banking'
  }
});

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: test, error: testError } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('Current customer count:', test);
    
    // Insert test data
    console.log('\n2. Inserting test data...');
    
    // Insert a test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        customer_id: 'test_' + Date.now(),
        customer_number: 'TEST' + Date.now(),
        first_name: 'Test',
        last_name: 'Customer',
        customer_type: 'INDIVIDUAL',
        customer_status: 'ACTIVE',
        email: 'test@example.com',
        phone_number: '+966500000000'
      })
      .select()
      .single();
    
    if (customerError) {
      console.error('Failed to insert customer:', customerError);
    } else {
      console.log('✅ Test customer created:', customer.customer_id);
      
      // Insert a test account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          account_id: 'test_acc_' + Date.now(),
          account_number: 'TESTACC' + Date.now(),
          customer_id: customer.customer_id,
          account_type: 'SAVINGS',
          account_status: 'ACTIVE',
          current_balance: 10000,
          available_balance: 10000,
          currency_code: 'SAR'
        })
        .select()
        .single();
      
      if (accountError) {
        console.error('Failed to insert account:', accountError);
      } else {
        console.log('✅ Test account created:', account.account_number);
      }
    }
    
    // Check data counts
    console.log('\n3. Checking data counts...');
    const tables = ['customers', 'accounts', 'transactions', 'loan_accounts'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error counting ${table}:`, error);
      } else {
        console.log(`${table}: ${count || 0} records`);
      }
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    console.log('\nYou can now run the application and the dashboard should display data.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();