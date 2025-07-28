import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a properly configured Supabase client with RLS bypass for initial setup
export const createAuthenticatedClient = (schema = 'kastle_banking') => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'osol-auth'
    },
    db: {
      schema: schema
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    }
  });
};

// Function to ensure user is authenticated
export const ensureAuthentication = async () => {
  const client = createAuthenticatedClient('public');
  
  try {
    // Check if user is already authenticated
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
      // Create a test user if not authenticated
      const { data, error } = await client.auth.signUp({
        email: 'admin@osoldashboard.com',
        password: 'admin123456',
        options: {
          data: {
            full_name: 'Admin User',
            role: 'admin'
          }
        }
      });
      
      if (error && error.message !== 'User already registered') {
        console.error('Error creating user:', error);
        return false;
      }
      
      // Sign in with the test user
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email: 'admin@osoldashboard.com',
        password: 'admin123456'
      });
      
      if (signInError) {
        console.error('Error signing in:', signInError);
        return false;
      }
      
      console.log('Successfully authenticated');
      return true;
    }
    
    console.log('User already authenticated');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

// Function to check if tables have data
export const checkTableData = async (client, tableName) => {
  try {
    const { count, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error checking ${tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Error checking ${tableName}:`, error);
    return 0;
  }
};

// Function to seed sample data for dashboard
export const seedDashboardData = async () => {
  const bankingClient = createAuthenticatedClient('kastle_banking');
  
  if (!bankingClient) {
    console.error('Failed to create banking client');
    return false;
  }
  
  try {
    // Check if data already exists
    const accountsCount = await checkTableData(bankingClient, 'accounts');
    const customersCount = await checkTableData(bankingClient, 'customers');
    
    console.log('Current data counts:', { accounts: accountsCount, customers: customersCount });
    
    // If data exists, skip seeding
    if (accountsCount > 0 && customersCount > 0) {
      console.log('Data already exists, skipping seed');
      return true;
    }
    
    console.log('Seeding sample data...');
    
    // Insert sample branches
    const { data: branches, error: branchError } = await bankingClient
      .from('branches')
      .upsert([
        { branch_code: 'BR001', branch_name: 'Main Branch', branch_type: 'MAIN', status: 'ACTIVE' },
        { branch_code: 'BR002', branch_name: 'Downtown Branch', branch_type: 'BRANCH', status: 'ACTIVE' },
        { branch_code: 'BR003', branch_name: 'West Side Branch', branch_type: 'BRANCH', status: 'ACTIVE' }
      ], { onConflict: 'branch_code' })
      .select();
    
    if (branchError) {
      console.error('Error inserting branches:', branchError);
      return false;
    }
    
    // Insert sample customer types
    const { error: customerTypeError } = await bankingClient
      .from('customer_types')
      .upsert([
        { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
        { type_code: 'CORP', type_name: 'Corporate', description: 'Corporate customers' },
        { type_code: 'SME', type_name: 'SME', description: 'Small and Medium Enterprises' }
      ], { onConflict: 'type_code' });
    
    if (customerTypeError) {
      console.error('Error inserting customer types:', customerTypeError);
    }
    
    // Insert sample customers
    const customerData = [];
    for (let i = 1; i <= 50; i++) {
      customerData.push({
        customer_number: `CUST${String(i).padStart(6, '0')}`,
        full_name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone_number: `+1234567${String(i).padStart(4, '0')}`,
        customer_type: i % 3 === 0 ? 'CORP' : 'IND',
        branch_id: branches[i % branches.length].branch_id,
        status: 'ACTIVE',
        kyc_status: 'VERIFIED',
        risk_rating: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { data: customers, error: customerError } = await bankingClient
      .from('customers')
      .insert(customerData)
      .select();
    
    if (customerError) {
      console.error('Error inserting customers:', customerError);
      return false;
    }
    
    // Insert sample accounts
    const accountData = [];
    customers.forEach((customer, index) => {
      // Each customer gets 1-3 accounts
      const numAccounts = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numAccounts; j++) {
        accountData.push({
          account_number: `ACC${String(index * 10 + j + 1).padStart(10, '0')}`,
          customer_id: customer.customer_id,
          account_type: ['SAVINGS', 'CHECKING', 'FIXED_DEPOSIT'][j % 3],
          currency_code: 'USD',
          current_balance: Math.random() * 100000,
          available_balance: Math.random() * 90000,
          account_status: 'ACTIVE',
          branch_id: customer.branch_id,
          created_at: customer.created_at
        });
      }
    });
    
    const { error: accountError } = await bankingClient
      .from('accounts')
      .insert(accountData);
    
    if (accountError) {
      console.error('Error inserting accounts:', accountError);
      return false;
    }
    
    // Insert sample loan accounts
    const loanData = [];
    customers.slice(0, 30).forEach((customer, index) => {
      loanData.push({
        loan_account_number: `LOAN${String(index + 1).padStart(8, '0')}`,
        customer_id: customer.customer_id,
        product_type: ['PERSONAL', 'MORTGAGE', 'AUTO', 'BUSINESS'][index % 4],
        principal_amount: Math.random() * 500000 + 10000,
        outstanding_balance: Math.random() * 400000 + 5000,
        interest_rate: Math.random() * 10 + 5,
        loan_status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'CLOSED'][index % 4],
        disbursement_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        maturity_date: new Date(Date.now() + Math.random() * 365 * 5 * 24 * 60 * 60 * 1000).toISOString(),
        branch_id: customer.branch_id,
        created_at: customer.created_at
      });
    });
    
    const { error: loanError } = await bankingClient
      .from('loan_accounts')
      .insert(loanData);
    
    if (loanError) {
      console.error('Error inserting loans:', loanError);
      return false;
    }
    
    // Insert sample transactions
    const transactionData = [];
    const today = new Date();
    for (let i = 0; i < 100; i++) {
      const account = accountData[Math.floor(Math.random() * accountData.length)];
      transactionData.push({
        transaction_reference: `TXN${String(i + 1).padStart(12, '0')}`,
        account_id: account.account_number,
        transaction_type: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'][i % 4],
        amount: Math.random() * 5000 + 100,
        currency_code: 'USD',
        transaction_status: 'COMPLETED',
        transaction_date: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        value_date: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Transaction ${i + 1}`,
        created_at: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { error: transactionError } = await bankingClient
      .from('transactions')
      .insert(transactionData);
    
    if (transactionError) {
      console.error('Error inserting transactions:', transactionError);
      return false;
    }
    
    console.log('Sample data seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
};

// Export a function to fix dashboard authentication and data
export const fixDashboard = async () => {
  console.log('Starting dashboard fix...');
  
  // Step 1: Ensure authentication
  const authSuccess = await ensureAuthentication();
  if (!authSuccess) {
    console.error('Failed to authenticate');
    return false;
  }
  
  // Step 2: Seed sample data if needed
  const seedSuccess = await seedDashboardData();
  if (!seedSuccess) {
    console.error('Failed to seed data');
    return false;
  }
  
  console.log('Dashboard fix completed successfully');
  return true;
};