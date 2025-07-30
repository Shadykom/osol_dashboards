#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY_HERE') {
  console.error('❌ Supabase credentials not configured in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'kastle_banking' }
});

async function seedData() {
  console.log('🌱 Starting dashboard data seeding...\n');

  try {
    // 1. Seed Branches
    console.log('📍 Seeding branches...');
    const branches = [
      { branch_id: 'BR001', branch_code: 'BR001', branch_name: 'Main Branch - Riyadh', branch_type: 'MAIN', city: 'Riyadh', country_code: 'SA', is_active: true },
      { branch_id: 'BR002', branch_code: 'BR002', branch_name: 'Olaya Branch', branch_type: 'URBAN', city: 'Riyadh', country_code: 'SA', is_active: true },
      { branch_id: 'BR003', branch_code: 'BR003', branch_name: 'Jeddah Main', branch_type: 'URBAN', city: 'Jeddah', country_code: 'SA', is_active: true }
    ];
    
    const { error: branchError } = await supabase
      .from('branches')
      .upsert(branches, { onConflict: 'branch_id' });
    
    if (branchError) console.error('Branch error:', branchError);
    else console.log('✅ Branches seeded');

    // 2. Seed Customer Types
    console.log('\n👥 Seeding customer types...');
    const customerTypes = [
      { type_code: 'IND', type_name: 'Individual', description: 'Individual customers' },
      { type_code: 'CORP', type_name: 'Corporate', description: 'Corporate customers' }
    ];
    
    const { error: typeError } = await supabase
      .from('customer_types')
      .upsert(customerTypes, { onConflict: 'type_code' });
    
    if (typeError) console.error('Customer type error:', typeError);
    else console.log('✅ Customer types seeded');

    // Get customer type IDs
    const { data: types } = await supabase
      .from('customer_types')
      .select('type_id, type_code');
    
    const typeMap = {};
    types?.forEach(t => { typeMap[t.type_code] = t.type_id; });

    // 3. Seed Customers
    console.log('\n👤 Seeding customers...');
    const customers = [];
    const firstNames = ['Ahmed', 'Mohammed', 'Abdullah', 'Khalid', 'Fahad'];
    const lastNames = ['Al-Rashid', 'Al-Saud', 'Al-Zahrani', 'Al-Qahtani'];
    
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      customers.push({
        customer_number: `CUST${String(i + 1).padStart(6, '0')}`,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('al-', '')}${i}@example.com`,
        phone: `+9665${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        customer_type_id: typeMap.IND,
        customer_segment: i < 5 ? 'VIP' : i < 15 ? 'Premium' : 'Standard',
        branch_id: branches[i % branches.length].branch_id,
        is_active: true
      });
    }
    
    const { error: customerError } = await supabase
      .from('customers')
      .upsert(customers, { onConflict: 'customer_number' });
    
    if (customerError) console.error('Customer error:', customerError);
    else console.log('✅ Customers seeded');

    // 4. Seed Account Types
    console.log('\n💳 Seeding account types...');
    const accountTypes = [
      { type_code: 'SAV', type_name: 'Savings Account', account_category: 'SAVINGS' },
      { type_code: 'CUR', type_name: 'Current Account', account_category: 'CURRENT' }
    ];
    
    const { error: accTypeError } = await supabase
      .from('account_types')
      .upsert(accountTypes, { onConflict: 'type_code' });
    
    if (accTypeError) console.error('Account type error:', accTypeError);
    else console.log('✅ Account types seeded');

    // Get account type IDs
    const { data: accTypes } = await supabase
      .from('account_types')
      .select('type_id, type_code');
    
    const accTypeMap = {};
    accTypes?.forEach(t => { accTypeMap[t.type_code] = t.type_id; });

    // Get customer IDs
    const { data: customerData } = await supabase
      .from('customers')
      .select('customer_id, customer_number');
    
    // 5. Seed Accounts
    console.log('\n🏦 Seeding accounts...');
    const accounts = [];
    
    customerData?.slice(0, 30).forEach((customer, i) => {
      accounts.push({
        account_number: `ACC${String(i + 1).padStart(10, '0')}`,
        customer_id: customer.customer_id,
        account_type_id: accTypeMap[i % 2 === 0 ? 'SAV' : 'CUR'],
        branch_id: branches[i % branches.length].branch_id,
        current_balance: Math.floor(Math.random() * 100000) + 5000,
        available_balance: Math.floor(Math.random() * 100000) + 5000,
        account_status: 'ACTIVE',
        currency_code: 'SAR'
      });
    });
    
    const { error: accountError } = await supabase
      .from('accounts')
      .upsert(accounts, { onConflict: 'account_number' });
    
    if (accountError) console.error('Account error:', accountError);
    else console.log('✅ Accounts seeded');

    // 6. Seed some transactions
    console.log('\n💸 Seeding transactions...');
    const { data: accountData } = await supabase
      .from('accounts')
      .select('account_id, account_number')
      .limit(10);
    
    const transactions = [];
    const transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];
    
    accountData?.forEach((account, i) => {
      for (let j = 0; j < 5; j++) {
        const type = transactionTypes[j % transactionTypes.length];
        const amount = Math.floor(Math.random() * 5000) + 100;
        transactions.push({
          account_id: account.account_id,
          transaction_type: type,
          transaction_amount: amount,
          transaction_date: new Date(Date.now() - j * 24 * 60 * 60 * 1000).toISOString(),
          description: `${type} transaction`,
          status: 'COMPLETED',
          branch_id: branches[0].branch_id
        });
      }
    });
    
    const { error: transError } = await supabase
      .from('transactions')
      .insert(transactions);
    
    if (transError) console.error('Transaction error:', transError);
    else console.log('✅ Transactions seeded');

    // 7. Seed collection cases
    console.log('\n⚖️ Seeding collection cases...');
    const collectionCases = [];
    
    customerData?.slice(0, 10).forEach((customer, i) => {
      collectionCases.push({
        case_number: `CASE${String(i + 1).padStart(6, '0')}`,
        customer_id: customer.customer_id,
        total_outstanding: Math.floor(Math.random() * 50000) + 10000,
        case_status: 'ACTIVE',
        dpd: Math.floor(Math.random() * 90) + 30,
        assigned_date: new Date().toISOString()
      });
    });
    
    const { error: caseError } = await supabase
      .from('collection_cases')
      .upsert(collectionCases, { onConflict: 'case_number' });
    
    if (caseError) console.error('Collection case error:', caseError);
    else console.log('✅ Collection cases seeded');

    console.log('\n🎉 Dashboard data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Branches: ${branches.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Accounts: ${accounts.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Collection Cases: ${collectionCases.length}`);
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedData().then(() => {
  console.log('\n✨ Done! Refresh your dashboard to see the data.');
  process.exit(0);
});