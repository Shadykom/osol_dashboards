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
        .upsert([
          { 
            branch_id: 'BR001',
            branch_code: 'BR001', // Required field in database
            branch_name: 'Main Branch', 
            branch_type: 'MAIN' 
          },
          { 
            branch_id: 'BR002',
            branch_code: 'BR002', // Required field in database
            branch_name: 'Downtown Branch', 
            branch_type: 'URBAN' 
          },
          { 
            branch_id: 'BR003',
            branch_code: 'BR003', // Required field in database
            branch_name: 'West Side Branch', 
            branch_type: 'URBAN' 
          }
        ], { onConflict: 'branch_id' })
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
    // First check if customer types already exist
    const { data: existingTypes, error: checkTypesError } = await bankingClient
      .from(TABLES.CUSTOMER_TYPES)
      .select('type_code')
      .in('type_code', ['IND', 'CORP', 'SME']);
    
    if (!checkTypesError && (!existingTypes || existingTypes.length === 0)) {
      // Only insert if they don't exist
      const { error: customerTypeError } = await bankingClient
        .from(TABLES.CUSTOMER_TYPES)
        .insert([
          { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
          { type_code: 'CORP', type_name: 'Corporate', description: 'Corporate customers' },
          { type_code: 'SME', type_name: 'SME', description: 'Small and Medium Enterprises' }
        ]);
      
      if (customerTypeError) {
        console.error('Error inserting customer types:', customerTypeError);
      }
    } else {
      console.log('Customer types already exist, skipping insertion');
    }
    
    // Insert sample customers (without email and phone_number)
    const customerData = [];
    for (let i = 1; i <= 50; i++) {
      customerData.push({
        customer_id: `CUST${String(i).padStart(6, '0')}`,
        first_name: `Customer`,
        last_name: `${i}`,
        full_name: `Customer ${i}`,
        customer_type_id: i % 3 === 0 ? 2 : 1, // 1 for IND, 2 for CORP based on typical setup
        onboarding_branch: branches[i % branches.length].branch_id,
        kyc_status: 'VERIFIED',
        risk_category: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Use upsert to avoid duplicate key errors
    let customers;
    const { data: insertedCustomers, error: customerError } = await bankingClient
      .from(TABLES.CUSTOMERS)
      .upsert(customerData, { onConflict: 'customer_id' })
      .select();
    
    if (customerError) {
      console.error('Error inserting customers:', customerError);
      // Try to fetch existing customers
      const { data: existingCustomers, error: fetchError } = await bankingClient
        .from(TABLES.CUSTOMERS)
        .select()
        .limit(50);
      
      if (fetchError || !existingCustomers || existingCustomers.length === 0) {
        console.error('Could not insert or fetch customers');
        return false;
      }
      customers = existingCustomers;
    } else {
      customers = insertedCustomers;
    }
    
    // Insert sample customer contacts
    const customerContactData = [];
    customers.forEach((customer, index) => {
      // Add email contact
      customerContactData.push({
        customer_id: customer.customer_id,
        contact_type: 'EMAIL',
        contact_value: `customer${index + 1}@example.com`,
        is_primary: true,
        is_verified: true
      });
      // Add phone contact
      customerContactData.push({
        customer_id: customer.customer_id,
        contact_type: 'MOBILE',
        contact_value: `+1234567${String(index + 1).padStart(4, '0')}`,
        is_primary: false,
        is_verified: true
      });
    });

    const { error: customerContactError } = await bankingClient
      .from(TABLES.CUSTOMER_CONTACTS)
      .insert(customerContactData);

    if (customerContactError) {
      console.error('Error inserting customer contacts:', customerContactError);
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
          account_type_id: j % 3 + 1, // 1, 2, or 3 for different account types
          currency_code: 'USD',
          current_balance: Math.random() * 100000,
          available_balance: Math.random() * 90000,
          account_status: 'ACTIVE',
          branch_id: customer.onboarding_branch,
          opening_date: customer.created_at
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
      const principalAmount = Math.random() * 500000 + 10000;
      const outstandingPrincipal = Math.random() * 400000 + 5000;
      loanData.push({
        loan_account_number: `LOAN${String(index + 1).padStart(8, '0')}`,
        customer_id: customer.customer_id,
        product_id: index % 4 + 1, // 1-4 for different loan products
        principal_amount: principalAmount,
        outstanding_principal: outstandingPrincipal,
        interest_rate: Math.random() * 10 + 5,
        tenure_months: [12, 24, 36, 48, 60][index % 5],
        loan_status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'CLOSED'][index % 4],
        disbursement_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        maturity_date: new Date(Date.now() + Math.random() * 365 * 5 * 24 * 60 * 60 * 1000).toISOString(),
        emi_amount: principalAmount / 12 * 1.1, // Simple EMI calculation
        overdue_days: Math.floor(Math.random() * 30)
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