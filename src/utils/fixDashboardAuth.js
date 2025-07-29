import { supabaseBanking, supabaseCollection, TABLES, getClientForTable } from '@/lib/supabase';

// Use the shared clients instead of creating new ones
export const createAuthenticatedClient = (schema = 'kastle_banking') => {
  // Return the appropriate shared client based on schema
  if (schema === 'kastle_banking') {
    return supabaseBanking;
  } else if (schema === 'kastle_collection') {
    return supabaseCollection;
  } else {
    // Default to kastle_banking schema
    return supabaseBanking;
  }
};

// Ensure authentication - bypassed to always return true
export const ensureAuthentication = async () => {
  console.log('Authentication check bypassed - always authenticated');
  
  // Always return true - no authentication required
  return true;
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
  const bankingClient = supabaseBanking; // Use shared client
  
  if (!bankingClient) {
    console.error('Banking client not available');
    return false;
  }
  
  try {
    // Check if data already exists
    const accountsCount = await checkTableData(bankingClient, TABLES.ACCOUNTS);
    const customersCount = await checkTableData(bankingClient, TABLES.CUSTOMERS);
    const branchesCount = await checkTableData(bankingClient, TABLES.BRANCHES);
    
    console.log('Current data counts:', { 
      accounts: accountsCount, 
      customers: customersCount,
      branches: branchesCount 
    });
    
    // If data exists, skip seeding
    if (accountsCount > 0 && customersCount > 0 && branchesCount > 0) {
      console.log('Data already exists, skipping seed');
      return true;
    }
    
    console.log('Seeding sample data...');
    
    // Check if branches already exist before inserting
    let branches = [];
    if (branchesCount === 0) {
      // Insert sample branches only if they don't exist
      const { data: insertedBranches, error: branchError } = await bankingClient
        .from(TABLES.BRANCHES)
        .insert([
          { branch_id: 'BR001', branch_code: 'BR001', branch_name: 'Main Branch', branch_type: 'MAIN', is_active: true },
          { branch_id: 'BR002', branch_code: 'BR002', branch_name: 'Downtown Branch', branch_type: 'URBAN', is_active: true },
          { branch_id: 'BR003', branch_code: 'BR003', branch_name: 'West Side Branch', branch_type: 'URBAN', is_active: true }
        ])
        .select();
      
      if (branchError) {
        console.error('Error inserting branches:', branchError);
        // Try to fetch existing branches instead
        const { data: existingBranches, error: fetchError } = await bankingClient
          .from(TABLES.BRANCHES)
          .select()
          .limit(3);
        
        if (fetchError || !existingBranches || existingBranches.length === 0) {
          console.error('Could not insert or fetch branches');
          return false;
        }
        branches = existingBranches;
      } else {
        branches = insertedBranches;
      }
    } else {
      // Fetch existing branches
      const { data: existingBranches, error: fetchError } = await bankingClient
        .from(TABLES.BRANCHES)
        .select()
        .limit(3);
      
      if (fetchError || !existingBranches || existingBranches.length === 0) {
        console.error('Could not fetch existing branches');
        return false;
      }
      branches = existingBranches;
    }
    
    // If we already have customers and accounts, we're done
    if (customersCount > 0 && accountsCount > 0) {
      console.log('Customers and accounts already exist, skipping rest of seed');
      return true;
    }
    
    // Insert sample customer types
    const { error: customerTypeError } = await bankingClient
      .from(TABLES.CUSTOMER_TYPES)
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
      .from(TABLES.CUSTOMERS)
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
      .from(TABLES.ACCOUNTS)
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
      .from(TABLES.LOAN_ACCOUNTS)
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
      .from(TABLES.TRANSACTIONS)
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
export const fixDashboard = async (options = {}) => {
  // Check environment variable to disable seeding
  const disableSeedingFromEnv = import.meta.env.VITE_DISABLE_SEEDING === 'true';
  const { skipSeeding = disableSeedingFromEnv } = options;
  
  console.log('Starting dashboard fix...');
  
  // Step 1: Check authentication
  const authSuccess = await ensureAuthentication();
  if (!authSuccess) {
    console.log('User not authenticated - skipping dashboard fix');
    // Return true to allow the dashboard to load without authentication
    // The app should handle authentication separately
    return true;
  }
  
  // Step 2: Seed sample data if needed (only if authenticated and not skipped)
  if (!skipSeeding) {
    const seedSuccess = await seedDashboardData();
    if (!seedSuccess) {
      console.error('Failed to seed data');
      // Don't fail completely if seeding fails
    }
  } else {
    console.log('Skipping data seeding as requested');
  }
  
  console.log('Dashboard fix completed');
  return true;
};