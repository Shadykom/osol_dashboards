import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'kastle_banking'
  }
});

// Tables to check
const tablesToCheck = [
  { name: 'customers', expectedColumns: ['customer_id', 'full_name', 'customer_type'] },
  { name: 'loan_accounts', expectedColumns: ['loan_account_number', 'principal_amount', 'loan_amount'] },
  { name: 'collection_cases', expectedColumns: ['case_id', 'customer_id', 'total_outstanding', 'total_amount'] },
  { name: 'collection_buckets', expectedColumns: ['bucket_id', 'bucket_name', 'min_dpd', 'max_dpd'] },
  { name: 'v_collection_officers', expectedColumns: ['officer_id', 'officer_name', 'officer_type'] },
  { name: 'v_collection_interactions', expectedColumns: ['interaction_id', 'case_id', 'interaction_type'] },
  { name: 'v_promise_to_pay', expectedColumns: ['ptp_id', 'case_id', 'ptp_amount'] },
  { name: 'v_officer_performance_summary', expectedColumns: ['summary_id', 'officer_id', 'total_cases'] }
];

async function checkTable(tableName, expectedColumns) {
  console.log(`\n📋 Checking table: ${tableName}`);
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`  ❌ Error accessing table: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Table accessible`);
    
    // Check columns if we got data
    if (data && data.length > 0) {
      const actualColumns = Object.keys(data[0]);
      console.log(`  📊 Found columns: ${actualColumns.join(', ')}`);
      
      // Check for expected columns
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      if (missingColumns.length > 0) {
        console.error(`  ⚠️  Missing expected columns: ${missingColumns.join(', ')}`);
      }
    } else {
      console.log(`  ℹ️  No data in table to check columns`);
    }
    
    return true;
  } catch (err) {
    console.error(`  ❌ Unexpected error: ${err.message}`);
    return false;
  }
}

async function checkForeignKeys() {
  console.log('\n🔗 Checking foreign key relationships...');
  
  try {
    // Test join between collection_cases and customers
    const { data: cases, error: casesError } = await supabase
      .from('collection_cases')
      .select(`
        case_id,
        customer_id,
        customers!customer_id (
          full_name
        )
      `)
      .limit(1);
    
    if (casesError) {
      console.error(`  ❌ Error with collection_cases -> customers join: ${casesError.message}`);
    } else {
      console.log(`  ✅ collection_cases -> customers join working`);
    }
    
    // Test join between collection_cases and loan_accounts
    const { data: casesLoans, error: casesLoansError } = await supabase
      .from('collection_cases')
      .select(`
        case_id,
        loan_account_number,
        loan_accounts!loan_account_number (
          loan_amount,
          principal_amount
        )
      `)
      .limit(1);
    
    if (casesLoansError) {
      console.error(`  ❌ Error with collection_cases -> loan_accounts join: ${casesLoansError.message}`);
    } else {
      console.log(`  ✅ collection_cases -> loan_accounts join working`);
    }
    
  } catch (err) {
    console.error(`  ❌ Unexpected error checking foreign keys: ${err.message}`);
  }
}

async function checkDataConsistency() {
  console.log('\n🔍 Checking data consistency...');
  
  try {
    // Check if loan_amount matches principal_amount
    const { data: loans, error: loansError } = await supabase
      .from('loan_accounts')
      .select('loan_account_number, loan_amount, principal_amount')
      .limit(5);
    
    if (!loansError && loans) {
      console.log(`  ℹ️  Sample loan_accounts data:`);
      loans.forEach(loan => {
        const match = loan.loan_amount === loan.principal_amount ? '✅' : '❌';
        console.log(`    ${match} Account ${loan.loan_account_number}: loan_amount=${loan.loan_amount}, principal_amount=${loan.principal_amount}`);
      });
    }
    
    // Check if total_amount matches total_outstanding
    const { data: cases, error: casesError } = await supabase
      .from('collection_cases')
      .select('case_number, total_amount, total_outstanding')
      .limit(5);
    
    if (!casesError && cases) {
      console.log(`  ℹ️  Sample collection_cases data:`);
      cases.forEach(caseItem => {
        const match = caseItem.total_amount === caseItem.total_outstanding ? '✅' : '❌';
        console.log(`    ${match} Case ${caseItem.case_number}: total_amount=${caseItem.total_amount}, total_outstanding=${caseItem.total_outstanding}`);
      });
    }
    
  } catch (err) {
    console.error(`  ❌ Unexpected error checking data consistency: ${err.message}`);
  }
}

async function main() {
  console.log('🔍 Database Schema Validation Tool');
  console.log('==================================');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Schema: kastle_banking`);
  
  // Check each table
  let successCount = 0;
  for (const table of tablesToCheck) {
    const success = await checkTable(table.name, table.expectedColumns);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Summary: ${successCount}/${tablesToCheck.length} tables accessible`);
  
  // Check foreign keys
  await checkForeignKeys();
  
  // Check data consistency
  await checkDataConsistency();
  
  console.log('\n✅ Database check complete!');
  
  if (successCount < tablesToCheck.length) {
    console.log('\n⚠️  Some issues were found. Please run the migration script:');
    console.log('   scripts/fix_database_schema.sql');
  }
}

// Run the check
main().catch(console.error);