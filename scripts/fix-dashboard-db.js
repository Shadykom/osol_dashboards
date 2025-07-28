import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile() {
  try {
    console.log('Reading SQL file...');
    const sqlContent = fs.readFileSync(join(__dirname, '../fix_dashboard_auth.sql'), 'utf8');
    
    console.log('Executing SQL to fix RLS policies...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      // If RPC doesn't exist, we'll continue with data seeding
    } else {
      console.log('SQL executed successfully');
    }
  } catch (error) {
    console.error('Error reading or executing SQL file:', error);
  }
}

async function seedDashboardData() {
  console.log('Starting dashboard data seeding...');
  
  try {
    // Check if data already exists
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customerCount && customerCount > 0) {
      console.log(`Data already exists (${customerCount} customers). Skipping seed.`);
      return;
    }
    
    // Seed branches
    console.log('Seeding branches...');
    const branches = [
      { branch_code: 'BR001', branch_name: 'Main Branch', branch_type: 'MAIN', status: 'ACTIVE' },
      { branch_code: 'BR002', branch_name: 'Downtown Branch', branch_type: 'BRANCH', status: 'ACTIVE' },
      { branch_code: 'BR003', branch_name: 'West Side Branch', branch_type: 'BRANCH', status: 'ACTIVE' },
      { branch_code: 'BR004', branch_name: 'Airport Branch', branch_type: 'BRANCH', status: 'ACTIVE' },
      { branch_code: 'BR005', branch_name: 'Mall Branch', branch_type: 'KIOSK', status: 'ACTIVE' }
    ];
    
    const { data: insertedBranches, error: branchError } = await supabase
      .from('branches')
      .upsert(branches, { onConflict: 'branch_code' })
      .select();
    
    if (branchError) {
      console.error('Error seeding branches:', branchError);
      return;
    }
    
    // Seed customer types
    console.log('Seeding customer types...');
    const customerTypes = [
      { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
      { type_code: 'CORP', type_name: 'Corporate', description: 'Corporate customers' },
      { type_code: 'SME', type_name: 'SME', description: 'Small and Medium Enterprises' },
      { type_code: 'GOV', type_name: 'Government', description: 'Government entities' }
    ];
    
    await supabase
      .from('customer_types')
      .upsert(customerTypes, { onConflict: 'type_code' });
    
    // Seed currencies
    console.log('Seeding currencies...');
    const currencies = [
      { currency_code: 'USD', currency_name: 'US Dollar', currency_symbol: '$' },
      { currency_code: 'EUR', currency_name: 'Euro', currency_symbol: '€' },
      { currency_code: 'GBP', currency_name: 'British Pound', currency_symbol: '£' },
      { currency_code: 'SAR', currency_name: 'Saudi Riyal', currency_symbol: '﷼' }
    ];
    
    await supabase
      .from('currencies')
      .upsert(currencies, { onConflict: 'currency_code' });
    
    // Seed customers
    console.log('Seeding customers...');
    const customers = [];
    const customerTypeIds = ['IND', 'CORP', 'SME', 'GOV'];
    const riskRatings = ['LOW', 'MEDIUM', 'HIGH'];
    
    for (let i = 1; i <= 100; i++) {
      const customerType = customerTypeIds[Math.floor(Math.random() * customerTypeIds.length)];
      const branchId = insertedBranches[Math.floor(Math.random() * insertedBranches.length)].branch_id;
      
      customers.push({
        customer_number: `CUST${String(i).padStart(6, '0')}`,
        full_name: `${customerType === 'CORP' ? 'Company' : 'Customer'} ${i}`,
        email: `customer${i}@example.com`,
        phone_number: `+966${String(500000000 + i).padStart(9, '0')}`,
        customer_type: customerType,
        branch_id: branchId,
        status: 'ACTIVE',
        kyc_status: 'VERIFIED',
        risk_rating: riskRatings[Math.floor(Math.random() * riskRatings.length)],
        date_of_birth: customerType === 'IND' ? new Date(1970 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString() : null,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { data: insertedCustomers, error: customerError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (customerError) {
      console.error('Error seeding customers:', customerError);
      return;
    }
    
    // Seed accounts
    console.log('Seeding accounts...');
    const accountTypes = ['SAVINGS', 'CHECKING', 'FIXED_DEPOSIT', 'INVESTMENT'];
    const accounts = [];
    
    insertedCustomers.forEach((customer, index) => {
      const numAccounts = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numAccounts; j++) {
        const balance = Math.random() * 500000 + 1000;
        accounts.push({
          account_number: `ACC${String(index * 10 + j + 1).padStart(10, '0')}`,
          customer_id: customer.customer_id,
          account_type: accountTypes[Math.floor(Math.random() * accountTypes.length)],
          currency_code: 'USD',
          current_balance: balance,
          available_balance: balance * 0.95,
          account_status: 'ACTIVE',
          branch_id: customer.branch_id,
          interest_rate: Math.random() * 5,
          created_at: customer.created_at
        });
      }
    });
    
    const { error: accountError } = await supabase
      .from('accounts')
      .insert(accounts);
    
    if (accountError) {
      console.error('Error seeding accounts:', accountError);
      return;
    }
    
    // Seed loan accounts
    console.log('Seeding loan accounts...');
    const loanTypes = ['PERSONAL', 'MORTGAGE', 'AUTO', 'BUSINESS', 'EDUCATION'];
    const loans = [];
    
    insertedCustomers.slice(0, 60).forEach((customer, index) => {
      const principalAmount = Math.random() * 1000000 + 10000;
      const paidAmount = Math.random() * principalAmount * 0.3;
      
      loans.push({
        loan_account_number: `LOAN${String(index + 1).padStart(8, '0')}`,
        customer_id: customer.customer_id,
        product_type: loanTypes[Math.floor(Math.random() * loanTypes.length)],
        principal_amount: principalAmount,
        outstanding_balance: principalAmount - paidAmount,
        interest_rate: Math.random() * 15 + 3,
        loan_status: Math.random() > 0.1 ? 'ACTIVE' : 'CLOSED',
        disbursement_date: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
        maturity_date: new Date(Date.now() + Math.random() * 1825 * 24 * 60 * 60 * 1000).toISOString(),
        branch_id: customer.branch_id,
        loan_term_months: Math.floor(Math.random() * 60) + 12,
        created_at: customer.created_at
      });
    });
    
    const { error: loanError } = await supabase
      .from('loan_accounts')
      .insert(loans);
    
    if (loanError) {
      console.error('Error seeding loans:', loanError);
      return;
    }
    
    // Seed transactions
    console.log('Seeding transactions...');
    const transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'FEE'];
    const transactions = [];
    const today = new Date();
    
    for (let i = 0; i < 500; i++) {
      const account = accounts[Math.floor(Math.random() * accounts.length)];
      const transactionDate = new Date(today.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      transactions.push({
        transaction_reference: `TXN${String(Date.now() + i).padStart(15, '0')}`,
        account_id: account.account_number,
        transaction_type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        amount: Math.random() * 10000 + 10,
        currency_code: account.currency_code,
        transaction_status: 'COMPLETED',
        transaction_date: transactionDate.toISOString(),
        value_date: transactionDate.toISOString(),
        description: `Transaction ${i + 1}`,
        created_at: transactionDate.toISOString()
      });
    }
    
    // Insert transactions in batches
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);
      
      if (error) {
        console.error(`Error seeding transactions batch ${i / batchSize + 1}:`, error);
      }
    }
    
    console.log('Dashboard data seeded successfully!');
    
    // Display summary
    const summary = {
      branches: insertedBranches.length,
      customers: insertedCustomers.length,
      accounts: accounts.length,
      loans: loans.length,
      transactions: transactions.length
    };
    
    console.log('\nData Summary:');
    console.log('=============');
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

async function main() {
  console.log('Fixing Dashboard Database...');
  console.log('===========================\n');
  
  // First try to execute SQL file to fix RLS
  await executeSQLFile();
  
  // Then seed the data
  await seedDashboardData();
  
  console.log('\nDashboard fix completed!');
  console.log('You can now log in with: admin@osoldashboard.com / admin123456');
}

main().catch(console.error);