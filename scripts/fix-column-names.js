import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixColumnNames() {
  console.log('Starting column name fixes...');

  try {
    // First, let's check if we need to rename columns or update the queries
    // Check if customers table has 'status' or 'customer_status'
    const { data: customersSchema, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('Error checking customers table:', customersError);
    } else if (customersSchema && customersSchema.length > 0) {
      const sampleCustomer = customersSchema[0];
      console.log('Customer columns:', Object.keys(sampleCustomer));
      
      // Check if we have 'status' but not 'customer_status'
      if ('status' in sampleCustomer && !('customer_status' in sampleCustomer)) {
        console.log('Found "status" column in customers table. Application expects "customer_status".');
        console.log('You need to either:');
        console.log('1. Update the database column from "status" to "customer_status"');
        console.log('2. Update all application queries to use "status" instead of "customer_status"');
      }
    }

    // Check accounts table
    const { data: accountsSchema, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);

    if (accountsError) {
      console.error('Error checking accounts table:', accountsError);
    } else if (accountsSchema && accountsSchema.length > 0) {
      const sampleAccount = accountsSchema[0];
      console.log('\nAccount columns:', Object.keys(sampleAccount));
      
      // Accounts table should have 'account_status' which seems correct
      if (!('account_status' in sampleAccount)) {
        console.log('Missing "account_status" column in accounts table!');
      }
    }

    // Check loan_accounts table
    const { data: loanSchema, error: loanError } = await supabase
      .from('loan_accounts')
      .select('*')
      .limit(1);

    if (loanError) {
      console.error('Error checking loan_accounts table:', loanError);
    } else if (loanSchema && loanSchema.length > 0) {
      const sampleLoan = loanSchema[0];
      console.log('\nLoan account columns:', Object.keys(sampleLoan));
    }

  } catch (error) {
    console.error('Error during column check:', error);
  }
}

// Run the fix
fixColumnNames();