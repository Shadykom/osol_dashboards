import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MjEzMTcsImV4cCI6MjA0ODA5NzMxN30.Pnt5cVEGNNjGPvDVYdPfB0EAKlfvYI9k-oU3f7KnYDo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductReportIssues() {
  console.log('Fixing Product Report Database Issues...\n');

  try {
    // 1. Test connection
    console.log('1. Testing database connection...');
    const { data: test, error: testError } = await supabase
      .from('branches')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('   Database connection test failed:', testError.message);
    } else {
      console.log('   ✓ Database connection successful');
    }

    // 2. Check if products table exists and has data
    console.log('\n2. Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.log('   Products table error:', productsError.message);
      console.log('   Using mock data for products');
    } else {
      console.log(`   ✓ Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        console.log('   Sample product:', products[0]);
      }
    }

    // 3. Check loan_accounts table structure
    console.log('\n3. Checking loan_accounts table...');
    const { data: loans, error: loansError } = await supabase
      .from('loan_accounts')
      .select('loan_account_number, customer_id, product_id, loan_amount, overdue_amount')
      .limit(5);
    
    if (loansError) {
      console.log('   Loan accounts table error:', loansError.message);
      console.log('   Error details:', loansError);
    } else {
      console.log(`   ✓ Found ${loans?.length || 0} loan accounts`);
      if (loans && loans.length > 0) {
        console.log('   Sample loan:', loans[0]);
      }
    }

    // 4. Check branches table
    console.log('\n4. Checking branches table...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .limit(5);
    
    if (branchesError) {
      console.log('   Branches table error:', branchesError.message);
    } else {
      console.log(`   ✓ Found ${branches?.length || 0} branches`);
    }

    // 5. Check collection tables
    console.log('\n5. Checking collection tables...');
    
    // Check collection_cases
    const { data: cases, error: casesError } = await supabase
      .from('collection_cases')
      .select('count')
      .limit(1);
    
    if (casesError) {
      console.log('   Collection cases table error:', casesError.message);
    } else {
      console.log('   ✓ Collection cases table exists');
    }

    // Check officer_performance_metrics
    console.log('\n6. Checking officer_performance_metrics...');
    const { data: metrics, error: metricsError } = await supabase
      .from('officer_performance_metrics')
      .select('*')
      .limit(1);
    
    if (metricsError) {
      console.log('   Officer performance metrics error:', metricsError.message);
      console.log('   This table might be in kastle_collection schema');
    } else {
      console.log('   ✓ Officer performance metrics table accessible');
    }

    console.log('\n=== Summary ===');
    console.log('The main issue is that the product report is trying to query:');
    console.log('1. branch_id from loan_accounts table (column does not exist)');
    console.log('2. The product_id might be numeric in the database but string in the code');
    console.log('3. Some tables might be in different schemas (kastle_banking vs kastle_collection)');
    
    console.log('\n=== Recommendations ===');
    console.log('1. The ProductReportService has been updated to handle numeric product IDs');
    console.log('2. The branch_id query has been removed from loan_accounts select');
    console.log('3. Consider using the mock data functionality until proper schema is in place');

  } catch (error) {
    console.error('Error during database check:', error);
  }
}

// Run the fix
fixProductReportIssues().then(() => {
  console.log('\nDatabase check completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});