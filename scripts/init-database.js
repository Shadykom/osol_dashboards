import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'kastle_banking' }
});

// Helper function to check if data exists
const checkDataExists = async (table, column, value) => {
  try {
    const { data, error } = await supabase
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
async function initializeReferenceData() {
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
        const { error } = await supabase.from('countries').insert(country);
        if (error) console.error('Error inserting country:', error);
        else console.log(`✓ Inserted country: ${country.country_name}`);
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
        const { error } = await supabase.from('currencies').insert(currency);
        if (error) console.error('Error inserting currency:', error);
        else console.log(`✓ Inserted currency: ${currency.currency_name}`);
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
        const { error } = await supabase.from('customer_types').insert(type);
        if (error) console.error('Error inserting customer type:', error);
        else console.log(`✓ Inserted customer type: ${type.type_name}`);
      }
    }
    
    // 4. Initialize Account Types
    const accountTypes = [
      { type_code: 'SAV', type_name: 'Savings Account', account_category: 'SAVINGS', description: 'Regular savings account' },
      { type_code: 'CUR', type_name: 'Current Account', account_category: 'CURRENT', description: 'Business current account' },
      { type_code: 'FD', type_name: 'Fixed Deposit', account_category: 'FIXED_DEPOSIT', description: 'Fixed term deposit' }
    ];
    
    for (const type of accountTypes) {
      const exists = await checkDataExists('account_types', 'type_code', type.type_code);
      if (!exists) {
        const { error } = await supabase.from('account_types').insert(type);
        if (error) console.error('Error inserting account type:', error);
        else console.log(`✓ Inserted account type: ${type.type_name}`);
      }
    }
    
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
        const { error } = await supabase.from('transaction_types').insert(type);
        if (error) console.error('Error inserting transaction type:', error);
        else console.log(`✓ Inserted transaction type: ${type.type_name}`);
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
        const { error } = await supabase.from('product_categories').insert(category);
        if (error) console.error('Error inserting product category:', error);
        else console.log(`✓ Inserted product category: ${category.category_name}`);
      }
    }
    
    // 7. Initialize Branches
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
        const { error } = await supabase.from('branches').insert(branch);
        if (error) console.error('Error inserting branch:', error);
        else console.log(`✓ Inserted branch: ${branch.branch_name}`);
      }
    }
    
    console.log('\n✅ Reference data initialization completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing reference data:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting database initialization...\n');
  
  const success = await initializeReferenceData();
  
  if (success) {
    console.log('\n✅ Database initialization completed successfully!');
  } else {
    console.log('\n❌ Database initialization failed!');
    process.exit(1);
  }
}

// Run the initialization
main().catch(console.error);