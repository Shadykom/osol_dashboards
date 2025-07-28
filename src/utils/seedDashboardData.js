// Utility to seed dashboard data
import { supabaseBanking, TABLES } from '@/lib/supabase';

// Helper function to generate random data
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));
const randomChoice = (arr) => arr[randomInt(0, arr.length)];

// Saudi names for realistic data
const firstNames = ['Ahmed', 'Mohammed', 'Abdullah', 'Khalid', 'Fahad', 'Omar', 'Ali', 'Hassan', 'Ibrahim', 'Yousef',
                   'Fatima', 'Aisha', 'Maryam', 'Noura', 'Sarah', 'Huda', 'Layla', 'Zainab', 'Khadija', 'Amira'];
const lastNames = ['Al-Rashid', 'Al-Saud', 'Al-Zahrani', 'Al-Qahtani', 'Al-Otaibi', 'Al-Harbi', 'Al-Dossari', 'Al-Shehri', 'Al-Ghamdi', 'Al-Maliki'];

export async function seedDashboardData() {
  console.log('Starting data seeding...');
  
  try {
    // 1. Seed basic reference data
    await seedReferenceData();
    
    // 2. Seed customers
    await seedCustomers();
    
    // 3. Seed accounts
    await seedAccounts();
    
    // 4. Seed loans
    await seedLoans();
    
    // 5. Seed transactions
    await seedTransactions();
    
    // 6. Seed collection data
    await seedCollectionData();
    
    console.log('Data seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error: error.message };
  }
}

async function seedReferenceData() {
  console.log('Seeding reference data...');
  
  // Countries
  const countries = [
    { country_code: 'SA', country_name: 'Saudi Arabia', is_active: true },
    { country_code: 'AE', country_name: 'United Arab Emirates', is_active: true },
    { country_code: 'KW', country_name: 'Kuwait', is_active: true },
    { country_code: 'QA', country_name: 'Qatar', is_active: true },
    { country_code: 'BH', country_name: 'Bahrain', is_active: true },
    { country_code: 'OM', country_name: 'Oman', is_active: true }
  ];
  
  await supabaseBanking.from(TABLES.COUNTRIES).upsert(countries, { onConflict: 'country_code' });
  
  // Currencies
  const currencies = [
    { currency_code: 'SAR', currency_name: 'Saudi Riyal', symbol: '﷼', is_active: true },
    { currency_code: 'USD', currency_name: 'US Dollar', symbol: '$', is_active: true },
    { currency_code: 'EUR', currency_name: 'Euro', symbol: '€', is_active: true },
    { currency_code: 'GBP', currency_name: 'British Pound', symbol: '£', is_active: true }
  ];
  
  await supabaseBanking.from(TABLES.CURRENCIES).upsert(currencies, { onConflict: 'currency_code' });
  
  // Customer Types
  const customerTypes = [
    { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
    { type_code: 'CRP', type_name: 'Corporate', description: 'Corporate customers' },
    { type_code: 'SME', type_name: 'Small & Medium Enterprise', description: 'SME customers' },
    { type_code: 'GOV', type_name: 'Government', description: 'Government entities' }
  ];
  
  await supabaseBanking.from(TABLES.CUSTOMER_TYPES).upsert(customerTypes, { onConflict: 'type_code' });
  
  // Account Types
  const accountTypes = [
    { type_code: 'SAV', type_name: 'Savings Account', description: 'Regular savings account', min_balance: 1000.00, interest_rate: 2.5 },
    { type_code: 'CUR', type_name: 'Current Account', description: 'Current account for daily transactions', min_balance: 5000.00, interest_rate: 0.0 },
    { type_code: 'DEP', type_name: 'Deposit Account', description: 'Fixed deposit account', min_balance: 10000.00, interest_rate: 4.5 },
    { type_code: 'VIP', type_name: 'VIP Account', description: 'Premium account with special benefits', min_balance: 50000.00, interest_rate: 3.5 }
  ];
  
  await supabaseBanking.from('account_types').upsert(accountTypes, { onConflict: 'type_code' });
  
  // Transaction Types
  const transactionTypes = [
    { type_code: 'DEP', type_name: 'Deposit', description: 'Cash or check deposit', is_debit: false },
    { type_code: 'WTH', type_name: 'Withdrawal', description: 'Cash withdrawal', is_debit: true },
    { type_code: 'TRF', type_name: 'Transfer', description: 'Fund transfer', is_debit: true },
    { type_code: 'PMT', type_name: 'Payment', description: 'Bill payment', is_debit: true },
    { type_code: 'FEE', type_name: 'Fee', description: 'Service fee', is_debit: true },
    { type_code: 'INT', type_name: 'Interest', description: 'Interest credit', is_debit: false }
  ];
  
  await supabaseBanking.from('transaction_types').upsert(transactionTypes, { onConflict: 'type_code' });
  
  // Product Categories
  const productCategories = [
    { category_code: 'DEP', category_name: 'Deposits', description: 'Deposit products' },
    { category_code: 'LON', category_name: 'Loans', description: 'Loan products' },
    { category_code: 'CRD', category_name: 'Cards', description: 'Credit and debit cards' },
    { category_code: 'INV', category_name: 'Investments', description: 'Investment products' }
  ];
  
  await supabaseBanking.from(TABLES.PRODUCT_CATEGORIES).upsert(productCategories, { onConflict: 'category_code' });
  
  // Get category IDs for products
  const { data: categories } = await supabaseBanking.from(TABLES.PRODUCT_CATEGORIES).select('category_id, category_code');
  const categoryMap = categories.reduce((acc, cat) => ({ ...acc, [cat.category_code]: cat.category_id }), {});
  
  // Products
  const products = [
    { product_code: 'SAV001', product_name: 'Basic Savings', category_id: categoryMap.DEP, description: 'Basic savings account', min_amount: 1000.00, max_amount: 1000000.00, interest_rate: 2.5, is_active: true },
    { product_code: 'PRL001', product_name: 'Personal Loan', category_id: categoryMap.LON, description: 'Personal loan for individuals', min_amount: 10000.00, max_amount: 500000.00, interest_rate: 8.5, is_active: true },
    { product_code: 'HML001', product_name: 'Home Loan', category_id: categoryMap.LON, description: 'Home mortgage loan', min_amount: 100000.00, max_amount: 5000000.00, interest_rate: 6.5, is_active: true },
    { product_code: 'AUL001', product_name: 'Auto Loan', category_id: categoryMap.LON, description: 'Vehicle financing', min_amount: 50000.00, max_amount: 500000.00, interest_rate: 7.5, is_active: true },
    { product_code: 'CRD001', product_name: 'Credit Card', category_id: categoryMap.CRD, description: 'Standard credit card', min_amount: 5000.00, max_amount: 100000.00, interest_rate: 18.0, is_active: true }
  ];
  
  await supabaseBanking.from(TABLES.PRODUCTS).upsert(products, { onConflict: 'product_code' });
  
  // Branches
  const branches = [
    { branch_code: 'BR001', branch_name: 'Main Branch - Riyadh', branch_type: 'MAIN', address: 'King Fahd Road', city: 'Riyadh', region: 'Central', country_code: 'SA', phone: '+966112345678', email: 'main@bank.sa', is_active: true },
    { branch_code: 'BR002', branch_name: 'Olaya Branch', branch_type: 'BRANCH', address: 'Olaya Street', city: 'Riyadh', region: 'Central', country_code: 'SA', phone: '+966112345679', email: 'olaya@bank.sa', is_active: true },
    { branch_code: 'BR003', branch_name: 'Jeddah Main', branch_type: 'BRANCH', address: 'Tahlia Street', city: 'Jeddah', region: 'Western', country_code: 'SA', phone: '+966122345678', email: 'jeddah@bank.sa', is_active: true },
    { branch_code: 'BR004', branch_name: 'Dammam Branch', branch_type: 'BRANCH', address: 'King Saud Street', city: 'Dammam', region: 'Eastern', country_code: 'SA', phone: '+966132345678', email: 'dammam@bank.sa', is_active: true },
    { branch_code: 'BR005', branch_name: 'Makkah Branch', branch_type: 'BRANCH', address: 'Ibrahim Khalil Road', city: 'Makkah', region: 'Western', country_code: 'SA', phone: '+966125345678', email: 'makkah@bank.sa', is_active: true }
  ];
  
  await supabaseBanking.from(TABLES.BRANCHES).upsert(branches, { onConflict: 'branch_code' });
}

async function seedCustomers() {
  console.log('Seeding customers...');
  
  // Check existing customers
  const { count } = await supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true });
  
  if (count >= 100) {
    console.log('Sufficient customers already exist');
    return;
  }
  
  // Get reference data
  const { data: customerTypes } = await supabaseBanking.from(TABLES.CUSTOMER_TYPES).select('customer_type_id, type_code');
  const indTypeId = customerTypes.find(t => t.type_code === 'IND').customer_type_id;
  
  const { data: branches } = await supabaseBanking.from(TABLES.BRANCHES).select('branch_id');
  
  const customers = [];
  const numCustomers = 200;
  
  for (let i = count + 1; i <= count + numCustomers; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const gender = Math.random() > 0.5 ? 'M' : 'F';
    
    customers.push({
      customer_number: `CUS${String(i).padStart(6, '0')}`,
      customer_type_id: indTypeId,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      date_of_birth: new Date(1970 + randomInt(0, 40), randomInt(0, 12), randomInt(1, 28)).toISOString().split('T')[0],
      gender: gender,
      nationality: 'SA',
      national_id: `1${String(randomInt(100000000, 999999999)).padStart(9, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('-', '')}${randomInt(100, 999)}@email.com`,
      mobile_number: `05${String(randomInt(10000000, 99999999)).padStart(8, '0')}`,
      customer_segment: randomChoice(['BASIC', 'SILVER', 'SILVER', 'GOLD', 'GOLD', 'GOLD', 'PREMIUM']),
      kyc_status: Math.random() < 0.9 ? 'VERIFIED' : 'PENDING',
      risk_category: randomChoice(['LOW', 'LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
      is_active: true,
      branch_id: randomChoice(branches).branch_id
    });
  }
  
  await supabaseBanking.from(TABLES.CUSTOMERS).insert(customers);
}

async function seedAccounts() {
  console.log('Seeding accounts...');
  
  // Check existing accounts
  const { count } = await supabaseBanking.from(TABLES.ACCOUNTS).select('*', { count: 'exact', head: true });
  
  if (count >= 200) {
    console.log('Sufficient accounts already exist');
    return;
  }
  
  // Get reference data
  const { data: customers } = await supabaseBanking.from(TABLES.CUSTOMERS).select('customer_id, branch_id');
  const { data: accountTypes } = await supabaseBanking.from('account_types').select('account_type_id');
  
  const accounts = [];
  let accountNum = count + 1;
  
  // Create 1-2 accounts per customer
  for (const customer of customers.slice(0, 150)) {
    const numAccounts = randomInt(1, 3);
    
    for (let i = 0; i < numAccounts; i++) {
      const balance = random(1000, 500000);
      
      accounts.push({
        account_number: `ACC${String(accountNum++).padStart(10, '0')}`,
        customer_id: customer.customer_id,
        account_type_id: randomChoice(accountTypes).account_type_id,
        branch_id: customer.branch_id,
        currency_code: 'SAR',
        current_balance: balance,
        available_balance: balance * 0.95,
        hold_amount: 0,
        account_status: Math.random() < 0.95 ? 'ACTIVE' : 'DORMANT',
        overdraft_limit: Math.random() < 0.3 ? random(5000, 50000) : 0,
        last_transaction_date: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  }
  
  await supabaseBanking.from(TABLES.ACCOUNTS).insert(accounts);
}

async function seedLoans() {
  console.log('Seeding loans...');
  
  // Check existing loans
  const { count } = await supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('*', { count: 'exact', head: true });
  
  if (count >= 50) {
    console.log('Sufficient loans already exist');
    return;
  }
  
  // Get reference data
  const { data: customers } = await supabaseBanking.from(TABLES.CUSTOMERS).select('customer_id, branch_id');
  const { data: products } = await supabaseBanking.from(TABLES.PRODUCTS).select('product_id, category_id');
  const { data: categories } = await supabaseBanking.from(TABLES.PRODUCT_CATEGORIES).select('category_id, category_code');
  
  const loanProducts = products.filter(p => categories.find(c => c.category_id === p.category_id && c.category_code === 'LON'));
  
  const loans = [];
  let loanNum = count + 1;
  
  // Create loans for 30% of customers
  const selectedCustomers = customers.slice(0, Math.floor(customers.length * 0.3));
  
  for (const customer of selectedCustomers.slice(0, 100)) {
    const loanAmount = random(100000, 1000000);
    const interestRate = random(5, 10);
    const totalMonths = randomInt(12, 60);
    const paidMonths = randomInt(0, Math.min(24, totalMonths));
    const overdueChance = Math.random();
    let overdueDays = 0;
    
    if (overdueChance > 0.8) {
      if (overdueChance > 0.95) {
        overdueDays = randomInt(90, 180);
      } else if (overdueChance > 0.9) {
        overdueDays = randomInt(30, 90);
      } else {
        overdueDays = randomInt(1, 30);
      }
    }
    
    const remainingRatio = 1 - (paidMonths / totalMonths);
    const outstanding = loanAmount * remainingRatio;
    const principal = outstanding * 0.9;
    const interest = outstanding * 0.1;
    const installment = loanAmount * (1 + interestRate / 100) / totalMonths;
    
    loans.push({
      loan_account_number: `LN${String(loanNum++).padStart(10, '0')}`,
      customer_id: customer.customer_id,
      product_id: randomChoice(loanProducts).product_id,
      branch_id: customer.branch_id,
      currency_code: 'SAR',
      loan_amount: loanAmount,
      disbursed_amount: loanAmount,
      outstanding_balance: outstanding,
      principal_outstanding: principal,
      interest_outstanding: interest,
      loan_status: overdueDays > 90 ? 'DEFAULT' : (overdueDays > 0 ? 'OVERDUE' : 'ACTIVE'),
      disbursement_date: new Date(Date.now() - totalMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maturity_date: new Date(Date.now() + (totalMonths - paidMonths) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interest_rate: interestRate,
      installment_amount: installment,
      total_installments: totalMonths,
      paid_installments: paidMonths,
      overdue_days: overdueDays,
      overdue_amount: overdueDays > 0 ? installment * (overdueDays / 30) : 0,
      next_installment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }
  
  await supabaseBanking.from(TABLES.LOAN_ACCOUNTS).insert(loans);
}

async function seedTransactions() {
  console.log('Seeding transactions...');
  
  // Check existing transactions
  const { count } = await supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true });
  
  if (count >= 1000) {
    console.log('Sufficient transactions already exist');
    return;
  }
  
  // Get reference data
  const { data: accounts } = await supabaseBanking.from(TABLES.ACCOUNTS).select('account_id').eq('account_status', 'ACTIVE').limit(100);
  const { data: transactionTypes } = await supabaseBanking.from('transaction_types').select('transaction_type_id, type_code, type_name');
  const { data: customers } = await supabaseBanking.from(TABLES.CUSTOMERS).select('full_name');
  
  const transactions = [];
  let transNum = count + 1;
  const today = new Date();
  
  // Create transactions for active accounts
  for (const account of accounts) {
    const numTransactions = randomInt(5, 20);
    
    for (let i = 0; i < numTransactions; i++) {
      const transType = randomChoice(transactionTypes);
      const daysAgo = randomInt(0, 30);
      const transDate = new Date(today - daysAgo * 24 * 60 * 60 * 1000);
      
      transactions.push({
        transaction_ref: `TRN${today.toISOString().split('T')[0].replace(/-/g, '')}_${String(transNum++).padStart(6, '0')}`,
        account_id: account.account_id,
        transaction_type_id: transType.transaction_type_id,
        amount: random(100, 50000),
        currency_code: 'SAR',
        transaction_date: transDate.toISOString(),
        value_date: transDate.toISOString().split('T')[0],
        description: `Transaction - ${transType.type_name}`,
        status: Math.random() < 0.95 ? 'COMPLETED' : 'PENDING',
        channel: randomChoice(['MOBILE', 'MOBILE', 'MOBILE', 'ATM', 'ATM', 'BRANCH', 'ONLINE']),
        reference_number: `REF${String(randomInt(100000, 999999)).padStart(6, '0')}`,
        beneficiary_name: transType.type_code === 'TRF' ? randomChoice(customers).full_name : null,
        beneficiary_account: transType.type_code === 'TRF' ? `ACC${String(randomInt(1000000000, 9999999999)).padStart(10, '0')}` : null
      });
    }
  }
  
  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    await supabaseBanking.from(TABLES.TRANSACTIONS).insert(transactions.slice(i, i + batchSize));
  }
}

async function seedCollectionData() {
  console.log('Seeding collection data...');
  
  // Collection Buckets
  const buckets = [
    { bucket_code: 'CURRENT', bucket_name: 'Current', min_dpd: 0, max_dpd: 0, priority: 1, is_active: true },
    { bucket_code: 'BUCKET1', bucket_name: '1-30 DPD', min_dpd: 1, max_dpd: 30, priority: 2, is_active: true },
    { bucket_code: 'BUCKET2', bucket_name: '31-60 DPD', min_dpd: 31, max_dpd: 60, priority: 3, is_active: true },
    { bucket_code: 'BUCKET3', bucket_name: '61-90 DPD', min_dpd: 61, max_dpd: 90, priority: 4, is_active: true },
    { bucket_code: 'BUCKET4', bucket_name: '91-120 DPD', min_dpd: 91, max_dpd: 120, priority: 5, is_active: true },
    { bucket_code: 'BUCKET5', bucket_name: '121-180 DPD', min_dpd: 121, max_dpd: 180, priority: 6, is_active: true },
    { bucket_code: 'BUCKET6', bucket_name: '180+ DPD', min_dpd: 181, max_dpd: 9999, priority: 7, is_active: true }
  ];
  
  await supabaseBanking.from(TABLES.COLLECTION_BUCKETS).upsert(buckets, { onConflict: 'bucket_code' });
  
  // Get overdue loans
  const { data: overdueLoans } = await supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
    .select('loan_account_id, customer_id, outstanding_balance, principal_outstanding, interest_outstanding, overdue_days')
    .gt('overdue_days', 0);
  
  if (overdueLoans && overdueLoans.length > 0) {
    const { data: bucketData } = await supabaseBanking.from(TABLES.COLLECTION_BUCKETS).select('bucket_id, min_dpd, max_dpd');
    
    // Create collection cases
    const cases = [];
    const today = new Date();
    let caseNum = 1;
    
    for (const loan of overdueLoans) {
      const bucket = bucketData.find(b => loan.overdue_days >= b.min_dpd && loan.overdue_days <= b.max_dpd);
      
      cases.push({
        case_number: `CASE${today.toISOString().slice(0, 7).replace('-', '')}${String(caseNum++).padStart(5, '0')}`,
        loan_account_id: loan.loan_account_id,
        customer_id: loan.customer_id,
        bucket_id: bucket.bucket_id,
        assigned_date: new Date(today - loan.overdue_days / 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_outstanding: loan.outstanding_balance,
        principal_outstanding: loan.principal_outstanding,
        interest_outstanding: loan.interest_outstanding,
        overdue_days: loan.overdue_days,
        case_status: loan.overdue_days > 180 ? 'LEGAL' : (loan.overdue_days > 90 ? 'ESCALATED' : 'ACTIVE'),
        priority: loan.overdue_days > 90 ? 'HIGH' : (loan.overdue_days > 30 ? 'MEDIUM' : 'LOW'),
        last_payment_date: new Date(today - randomInt(30, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        last_payment_amount: random(1000, 10000),
        promise_to_pay_date: Math.random() < 0.3 ? new Date(today.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        promise_to_pay_amount: Math.random() < 0.3 ? loan.outstanding_balance * random(0.1, 0.5) : null
      });
    }
    
    await supabaseBanking.from(TABLES.COLLECTION_CASES).insert(cases);
    
    // Create delinquencies
    const { data: loanDetails } = await supabaseBanking.from(TABLES.LOAN_ACCOUNTS)
      .select('loan_account_id, customer_id, branch_id, product_id, outstanding_balance, overdue_days, overdue_amount, loan_status')
      .in('loan_status', ['ACTIVE', 'OVERDUE', 'DEFAULT']);
    
    const delinquencies = loanDetails.map(loan => ({
      loan_account_id: loan.loan_account_id,
      customer_id: loan.customer_id,
      branch_id: loan.branch_id,
      product_id: loan.product_id,
      outstanding_balance: loan.outstanding_balance,
      dpd: loan.overdue_days,
      bucket: loan.overdue_days === 0 ? 'CURRENT' : 
              loan.overdue_days <= 30 ? 'BUCKET1' :
              loan.overdue_days <= 60 ? 'BUCKET2' :
              loan.overdue_days <= 90 ? 'BUCKET3' :
              loan.overdue_days <= 120 ? 'BUCKET4' :
              loan.overdue_days <= 180 ? 'BUCKET5' : 'BUCKET6',
      delinquency_amount: loan.overdue_amount,
      last_payment_date: new Date(today - randomInt(30, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_payment_amount: random(1000, 10000),
      risk_rating: loan.overdue_days > 90 ? 'HIGH' : (loan.overdue_days > 30 ? 'MEDIUM' : 'LOW')
    }));
    
    await supabaseBanking.from(TABLES.DELINQUENCIES).upsert(delinquencies, { onConflict: 'loan_account_id' });
  }
  
  console.log('Collection data seeded successfully');
}

// Function to check if data exists
export async function checkDataExists() {
  try {
    const checks = await Promise.all([
      supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }),
      supabaseBanking.from(TABLES.ACCOUNTS).select('*', { count: 'exact', head: true }),
      supabaseBanking.from(TABLES.LOAN_ACCOUNTS).select('*', { count: 'exact', head: true }),
      supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true })
    ]);
    
    return {
      customers: checks[0].count || 0,
      accounts: checks[1].count || 0,
      loans: checks[2].count || 0,
      transactions: checks[3].count || 0
    };
  } catch (error) {
    console.error('Error checking data:', error);
    return null;
  }
}