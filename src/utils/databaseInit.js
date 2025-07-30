import { supabaseBanking, TABLES } from '@/lib/supabase';

// Flag to prevent concurrent initializations
let isInitializing = false;

// Helper function to check if data exists
const checkDataExists = async (table, column, value) => {
  try {
    const { data, error } = await supabaseBanking
      .from(table)
      .select('*')
      .eq(column, value)
      .single();
    
    return !error && data !== null;
  } catch (err) {
    return false;
  }
};

// Initialize reference data
export const initializeReferenceData = async () => {
  console.log('Initializing reference data...');
  
  try {
    // 1. Initialize Countries
    const countries = [
      { country_code: 'US', country_name: 'United States', currency_code: 'USD', is_active: true },
      { country_code: 'SA', country_name: 'Saudi Arabia', currency_code: 'SAR', is_active: true },
      { country_code: 'GB', country_name: 'United Kingdom', currency_code: 'GBP', is_active: true }
    ];
    
    for (const country of countries) {
      const exists = await checkDataExists('countries', 'country_code', country.country_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('countries').insert(country);
        if (error) console.error('Error inserting country:', error);
      }
    }
    
    // 2. Initialize Currencies
    const currencies = [
      { currency_code: 'USD', currency_name: 'US Dollar', currency_symbol: '$', decimal_places: 2, is_active: true },
      { currency_code: 'SAR', currency_name: 'Saudi Riyal', currency_symbol: 'ر.س', decimal_places: 2, is_active: true },
      { currency_code: 'GBP', currency_name: 'British Pound', currency_symbol: '£', decimal_places: 2, is_active: true }
    ];
    
    for (const currency of currencies) {
      const exists = await checkDataExists('currencies', 'currency_code', currency.currency_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('currencies').insert(currency);
        if (error) console.error('Error inserting currency:', error);
      }
    }
    
    // 3. Initialize Customer Types
    const customerTypes = [
      { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
      { type_code: 'CORP', type_name: 'Corporate', description: 'Corporate customers' },
      { type_code: 'SME', type_name: 'SME', description: 'Small and Medium Enterprises' }
    ];
    
    for (const type of customerTypes) {
      const exists = await checkDataExists('customer_types', 'type_code', type.type_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('customer_types').insert(type);
        if (error) console.error('Error inserting customer type:', error);
      }
    }
    
    // Get customer type IDs for reference
    const { data: customerTypeData } = await supabaseBanking
      .from('customer_types')
      .select('type_id, type_code');
    
    const customerTypeMap = {};
    customerTypeData?.forEach(type => {
      customerTypeMap[type.type_code] = type.type_id;
    });
    
    // 4. Initialize Account Types
    const accountTypes = [
      { type_code: 'SAV', type_name: 'Savings Account', account_category: 'SAVINGS', description: 'Regular savings account' },
      { type_code: 'CUR', type_name: 'Current Account', account_category: 'CURRENT', description: 'Business current account' },
      { type_code: 'FD', type_name: 'Fixed Deposit', account_category: 'FIXED_DEPOSIT', description: 'Fixed term deposit' }
    ];
    
    for (const type of accountTypes) {
      const exists = await checkDataExists('account_types', 'type_code', type.type_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('account_types').insert(type);
        if (error) console.error('Error inserting account type:', error);
      }
    }
    
    // Get account type IDs for reference
    const { data: accountTypeData } = await supabaseBanking
      .from('account_types')
      .select('type_id, type_code');
    
    const accountTypeMap = {};
    accountTypeData?.forEach(type => {
      accountTypeMap[type.type_code] = type.type_id;
    });
    
    // 5. Initialize Transaction Types
    const transactionTypes = [
      { type_code: 'DEP', type_name: 'Deposit', transaction_category: 'CREDIT' },
      { type_code: 'WTH', type_name: 'Withdrawal', transaction_category: 'DEBIT' },
      { type_code: 'TRF', type_name: 'Transfer', transaction_category: 'TRANSFER' },
      { type_code: 'INT', type_name: 'Interest', transaction_category: 'INTEREST' },
      { type_code: 'CHG', type_name: 'Charge', transaction_category: 'CHARGE' }
    ];
    
    for (const type of transactionTypes) {
      const exists = await checkDataExists('transaction_types', 'type_code', type.type_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('transaction_types').insert(type);
        if (error) console.error('Error inserting transaction type:', error);
      }
    }
    
    // 6. Initialize Product Categories
    const productCategories = [
      { category_code: 'DEP', category_name: 'Deposit Products', category_type: 'DEPOSIT', description: 'Deposit products' },
      { category_code: 'LOAN', category_name: 'Loan Products', category_type: 'LOAN', description: 'Loan products' },
      { category_code: 'CARD', category_name: 'Card Products', category_type: 'CARD', description: 'Card products' }
    ];
    
    for (const category of productCategories) {
      const exists = await checkDataExists('product_categories', 'category_code', category.category_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('product_categories').insert(category);
        if (error) console.error('Error inserting product category:', error);
      }
    }
    
    // Get product category IDs
    const { data: categoryData } = await supabaseBanking
      .from('product_categories')
      .select('category_id, category_code');
    
    const categoryMap = {};
    categoryData?.forEach(cat => {
      categoryMap[cat.category_code] = cat.category_id;
    });
    
    // 7. Initialize Products
    const products = [
      { 
        product_code: 'SAV001', 
        product_name: 'Regular Savings', 
        category_id: categoryMap['DEP'],
        min_balance: 1000,
        max_balance: 1000000,
        interest_rate: 2.5,
        is_active: true
      },
      { 
        product_code: 'CUR001', 
        product_name: 'Business Current', 
        category_id: categoryMap['DEP'],
        min_balance: 5000,
        max_balance: 10000000,
        interest_rate: 0,
        is_active: true
      },
      { 
        product_code: 'LOAN001', 
        product_name: 'Personal Loan', 
        category_id: categoryMap['LOAN'],
        min_balance: 10000,
        max_balance: 500000,
        interest_rate: 8.5,
        is_active: true
      }
    ];
    
    for (const product of products) {
      const exists = await checkDataExists('products', 'product_code', product.product_code);
      if (!exists) {
        const { error } = await supabaseBanking.from('products').insert(product);
        if (error) console.error('Error inserting product:', error);
      }
    }
    
    // 8. Initialize Branches
    const branches = [
      { 
        branch_id: 'BR001',
        branch_code: 'BR001',
        branch_name: 'Main Branch',
        branch_type: 'MAIN',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        phone: '+1234567890',
        email: 'main@bank.com',
        is_active: true
      },
      { 
        branch_id: 'BR002',
        branch_code: 'BR002',
        branch_name: 'Downtown Branch',
        branch_type: 'URBAN',
        address: '456 Downtown Ave',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        phone: '+1234567891',
        email: 'downtown@bank.com',
        is_active: true
      },
      { 
        branch_id: 'BR003',
        branch_code: 'BR003',
        branch_name: 'West Side Branch',
        branch_type: 'URBAN',
        address: '789 West Side Road',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        phone: '+1234567892',
        email: 'westside@bank.com',
        is_active: true
      }
    ];
    
    for (const branch of branches) {
      const exists = await checkDataExists('branches', 'branch_id', branch.branch_id);
      if (!exists) {
        const { error } = await supabaseBanking.from('branches').insert(branch);
        if (error) console.error('Error inserting branch:', error);
      }
    }
    
    console.log('Reference data initialization completed');
    return { customerTypeMap, accountTypeMap, categoryMap };
    
  } catch (error) {
    console.error('Error initializing reference data:', error);
    throw error;
  }
};

// Initialize sample business data
export const initializeSampleData = async () => {
  console.log('Initializing sample data...');
  
  try {
    // First ensure reference data is initialized
    const { customerTypeMap, accountTypeMap } = await initializeReferenceData();
    
    // Check if we already have customers
    const { count: customerCount, error: countError } = await supabaseBanking
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    // If there's an error checking, try a different approach
    if (countError) {
      console.log('Error checking customer count, trying alternative check:', countError);
      // Try to select just one customer
      const { data: existingCustomers, error: selectError } = await supabaseBanking
        .from('customers')
        .select('customer_id')
        .limit(1);
      
      if (!selectError && existingCustomers && existingCustomers.length > 0) {
        console.log('Sample data already exists (found customers), skipping...');
        return true;
      }
    } else if (customerCount && customerCount > 0) {
      console.log('Sample data already exists, skipping...');
      return true;
    }
    
    // Get branches for reference
    const { data: branches } = await supabaseBanking
      .from('branches')
      .select('branch_id');
    
    if (!branches || branches.length === 0) {
      console.error('No branches found');
      return false;
    }
    
    // Create sample customers
    const customers = [];
    for (let i = 1; i <= 20; i++) {
      customers.push({
        customer_id: `CUST${String(i).padStart(6, '0')}`,
        customer_type_id: customerTypeMap[i % 3 === 0 ? 'CORP' : 'IND'],
        first_name: `Customer`,
        last_name: `${i}`,
        full_name: `Customer ${i}`,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        date_of_birth: new Date(1970 + (i % 30), i % 12, (i % 28) + 1).toISOString().split('T')[0],
        nationality: 'US',
        national_id: `ID${String(i).padStart(9, '0')}`,
        email: `customer${i}@example.com`,
        mobile_number: `+1234567${String(i).padStart(4, '0')}`,
        customer_segment: ['RETAIL', 'PREMIUM', 'HNI'][i % 3],
        kyc_status: 'VERIFIED',
        risk_category: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        is_active: true,
        branch_id: branches[i % branches.length].branch_id
      });
    }
    
    // Insert customers with upsert to avoid duplicates
    const { error: customerError } = await supabaseBanking
      .from('customers')
      .upsert(customers, { onConflict: 'customer_id' });
    
    if (customerError) {
      // Check if it's a duplicate key error
      if (customerError.code === '23505') {
        console.log('Customers already exist, continuing with other data...');
      } else {
        console.error('Error inserting customers:', customerError);
        return false;
      }
    }
    
    // Create sample accounts
    const accounts = [];
    const { data: accountTypes } = await supabaseBanking
      .from('account_types')
      .select('type_id');
    
    customers.forEach((customer, index) => {
      // Each customer gets 1-2 accounts
      const numAccounts = (index % 2) + 1;
      for (let j = 0; j < numAccounts; j++) {
        accounts.push({
          account_number: `ACC${String(index * 10 + j + 1).padStart(10, '0')}`,
          customer_id: customer.customer_id,
          account_type_id: accountTypes[j % accountTypes.length].type_id,
          branch_id: customer.branch_id,
          currency_code: 'USD',
          current_balance: Math.floor(Math.random() * 100000),
          available_balance: Math.floor(Math.random() * 90000),
          hold_amount: 0,
          account_status: 'ACTIVE',
          opening_date: new Date().toISOString().split('T')[0],
          last_transaction_date: new Date().toISOString()
        });
      }
    });
    
    // Insert accounts
    const { error: accountError } = await supabaseBanking
      .from('accounts')
      .upsert(accounts, { onConflict: 'account_number' });
    
    if (accountError) {
      if (accountError.code === '23505') {
        console.log('Accounts already exist, continuing with other data...');
      } else {
        console.error('Error inserting accounts:', accountError);
        return false;
      }
    }
    
    // Create sample transactions
    const { data: transactionTypes } = await supabaseBanking
      .from('transaction_types')
      .select('type_id, transaction_category');
    
    const transactions = [];
    accounts.forEach((account, index) => {
      // Each account gets 5-10 transactions
      const numTransactions = Math.floor(Math.random() * 6) + 5;
      let runningBalance = account.current_balance;
      
      for (let k = 0; k < numTransactions; k++) {
        const txType = transactionTypes[k % transactionTypes.length];
        const amount = Math.floor(Math.random() * 5000) + 100;
        const isDebit = txType.transaction_category === 'DEBIT' || txType.transaction_category === 'CHARGE';
        
        if (isDebit) {
          runningBalance -= amount;
        } else {
          runningBalance += amount;
        }
        
        transactions.push({
          account_number: account.account_number,
          transaction_type_id: txType.type_id,
          debit_credit: isDebit ? 'DEBIT' : 'CREDIT',
          transaction_amount: amount,
          currency_code: 'USD',
          running_balance: Math.max(0, runningBalance),
          channel: ['BRANCH', 'ATM', 'INTERNET', 'MOBILE'][k % 4],
          narration: `Sample transaction ${k + 1}`,
          status: 'COMPLETED',
          branch_id: account.branch_id,
          transaction_date: new Date(Date.now() - (numTransactions - k) * 24 * 60 * 60 * 1000).toISOString(),
          value_date: new Date(Date.now() - (numTransactions - k) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    });
    
    // Insert transactions in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const { error: txError } = await supabaseBanking
        .from('transactions')
        .insert(batch);
      
      if (txError) {
        if (txError.code === '23505') {
          console.log('Some transactions already exist, continuing...');
        } else {
          console.error('Error inserting transactions batch:', txError);
        }
      }
    }
    
    console.log('Sample data initialization completed');
    return true;
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return false;
  }
};

// Initialize database with all required reference data
export const initializeDatabase = async () => {
  // Prevent concurrent initializations
  if (isInitializing) {
    console.log('Database initialization already in progress, skipping...');
    return;
  }
  
  isInitializing = true;
  
  try {
    console.log('Starting database initialization...');
    
    // Initialize reference data first
    await initializeReferenceData();
    
    // Then initialize sample data
    await initializeSampleData();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};