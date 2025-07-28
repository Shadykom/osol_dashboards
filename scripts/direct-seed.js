import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const { Client } = pg;

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres';

async function seedDatabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'kastle_banking'
    `);

    if (schemaCheck.rows.length === 0) {
      console.log('Creating kastle_banking schema...');
      await client.query('CREATE SCHEMA IF NOT EXISTS kastle_banking');
    }

    // Set search path
    await client.query('SET search_path TO kastle_banking, public');

    // Create tables if they don't exist
    console.log('Creating tables...');
    
    // Branches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        branch_id SERIAL PRIMARY KEY,
        branch_code VARCHAR(20) UNIQUE NOT NULL,
        branch_name VARCHAR(100) NOT NULL,
        branch_type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_types (
        customer_type_id SERIAL PRIMARY KEY,
        type_code VARCHAR(20) UNIQUE NOT NULL,
        type_name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Currencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        currency_id SERIAL PRIMARY KEY,
        currency_code VARCHAR(3) UNIQUE NOT NULL,
        currency_name VARCHAR(50) NOT NULL,
        currency_symbol VARCHAR(5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Account types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS account_types (
        account_type_id SERIAL PRIMARY KEY,
        type_code VARCHAR(20) UNIQUE NOT NULL,
        type_name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        customer_number VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(100),
        phone_number VARCHAR(50),
        customer_type VARCHAR(20),
        branch_id INTEGER REFERENCES branches(branch_id),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        kyc_status VARCHAR(20) DEFAULT 'PENDING',
        risk_rating VARCHAR(20),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id SERIAL PRIMARY KEY,
        account_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(customer_id),
        account_type VARCHAR(20),
        currency_code VARCHAR(3),
        current_balance DECIMAL(20,2) DEFAULT 0,
        available_balance DECIMAL(20,2) DEFAULT 0,
        account_status VARCHAR(20) DEFAULT 'ACTIVE',
        branch_id INTEGER REFERENCES branches(branch_id),
        interest_rate DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Loan accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_accounts (
        loan_account_id SERIAL PRIMARY KEY,
        loan_account_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(customer_id),
        product_type VARCHAR(50),
        principal_amount DECIMAL(20,2),
        outstanding_balance DECIMAL(20,2),
        interest_rate DECIMAL(5,2),
        loan_status VARCHAR(20) DEFAULT 'ACTIVE',
        disbursement_date DATE,
        maturity_date DATE,
        branch_id INTEGER REFERENCES branches(branch_id),
        loan_term_months INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        transaction_reference VARCHAR(50) UNIQUE NOT NULL,
        account_id VARCHAR(50),
        transaction_type VARCHAR(50),
        amount DECIMAL(20,2),
        currency_code VARCHAR(3),
        transaction_status VARCHAR(20) DEFAULT 'PENDING',
        transaction_date TIMESTAMP,
        value_date TIMESTAMP,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if data exists
    const customerCount = await client.query('SELECT COUNT(*) FROM customers');
    if (parseInt(customerCount.rows[0].count) > 0) {
      console.log('Data already exists. Skipping seed.');
      return;
    }

    // Seed data
    console.log('Seeding branches...');
    await client.query(`
      INSERT INTO branches (branch_code, branch_name, branch_type, status)
      VALUES 
        ('BR001', 'Main Branch', 'MAIN', 'ACTIVE'),
        ('BR002', 'Downtown Branch', 'BRANCH', 'ACTIVE'),
        ('BR003', 'West Side Branch', 'BRANCH', 'ACTIVE'),
        ('BR004', 'Airport Branch', 'BRANCH', 'ACTIVE'),
        ('BR005', 'Mall Branch', 'KIOSK', 'ACTIVE')
      ON CONFLICT (branch_code) DO NOTHING
    `);

    console.log('Seeding customer types...');
    await client.query(`
      INSERT INTO customer_types (type_code, type_name, description)
      VALUES 
        ('IND', 'Individual', 'Individual customers'),
        ('CORP', 'Corporate', 'Corporate customers'),
        ('SME', 'SME', 'Small and Medium Enterprises'),
        ('GOV', 'Government', 'Government entities')
      ON CONFLICT (type_code) DO NOTHING
    `);

    console.log('Seeding currencies...');
    await client.query(`
      INSERT INTO currencies (currency_code, currency_name, currency_symbol)
      VALUES 
        ('USD', 'US Dollar', '$'),
        ('EUR', 'Euro', '€'),
        ('GBP', 'British Pound', '£'),
        ('SAR', 'Saudi Riyal', '﷼')
      ON CONFLICT (currency_code) DO NOTHING
    `);

    console.log('Seeding account types...');
    await client.query(`
      INSERT INTO account_types (type_code, type_name, description)
      VALUES 
        ('SAVINGS', 'Savings Account', 'Regular savings account'),
        ('CHECKING', 'Checking Account', 'Regular checking account'),
        ('FIXED_DEPOSIT', 'Fixed Deposit', 'Fixed deposit account'),
        ('INVESTMENT', 'Investment Account', 'Investment account')
      ON CONFLICT (type_code) DO NOTHING
    `);

    // Get branch IDs
    const branches = await client.query('SELECT branch_id FROM branches');
    const branchIds = branches.rows.map(b => b.branch_id);

    console.log('Seeding customers...');
    for (let i = 1; i <= 100; i++) {
      const customerType = ['IND', 'CORP', 'SME', 'GOV'][Math.floor(Math.random() * 4)];
      const branchId = branchIds[Math.floor(Math.random() * branchIds.length)];
      const riskRating = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)];
      
      await client.query(`
        INSERT INTO customers (
          customer_number, full_name, email, phone_number, 
          customer_type, branch_id, status, kyc_status, risk_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        `CUST${String(i).padStart(6, '0')}`,
        `${customerType === 'CORP' ? 'Company' : 'Customer'} ${i}`,
        `customer${i}@example.com`,
        `+966${String(500000000 + i).padStart(9, '0')}`,
        customerType,
        branchId,
        'ACTIVE',
        'VERIFIED',
        riskRating
      ]);
    }

    // Get customer IDs
    const customers = await client.query('SELECT customer_id, branch_id FROM customers');

    console.log('Seeding accounts...');
    let accountIndex = 1;
    for (const customer of customers.rows) {
      const numAccounts = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numAccounts; j++) {
        const balance = Math.random() * 500000 + 1000;
        const accountType = ['SAVINGS', 'CHECKING', 'FIXED_DEPOSIT', 'INVESTMENT'][Math.floor(Math.random() * 4)];
        
        await client.query(`
          INSERT INTO accounts (
            account_number, customer_id, account_type, currency_code,
            current_balance, available_balance, account_status, branch_id, interest_rate
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          `ACC${String(accountIndex++).padStart(10, '0')}`,
          customer.customer_id,
          accountType,
          'USD',
          balance,
          balance * 0.95,
          'ACTIVE',
          customer.branch_id,
          Math.random() * 5
        ]);
      }
    }

    console.log('Seeding loan accounts...');
    const loanCustomers = customers.rows.slice(0, 60);
    for (let i = 0; i < loanCustomers.length; i++) {
      const customer = loanCustomers[i];
      const principalAmount = Math.random() * 1000000 + 10000;
      const paidAmount = Math.random() * principalAmount * 0.3;
      const loanType = ['PERSONAL', 'MORTGAGE', 'AUTO', 'BUSINESS', 'EDUCATION'][Math.floor(Math.random() * 5)];
      
      await client.query(`
        INSERT INTO loan_accounts (
          loan_account_number, customer_id, product_type, principal_amount,
          outstanding_balance, interest_rate, loan_status, disbursement_date,
          maturity_date, branch_id, loan_term_months
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        `LOAN${String(i + 1).padStart(8, '0')}`,
        customer.customer_id,
        loanType,
        principalAmount,
        principalAmount - paidAmount,
        Math.random() * 15 + 3,
        Math.random() > 0.1 ? 'ACTIVE' : 'CLOSED',
        new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + Math.random() * 1825 * 24 * 60 * 60 * 1000).toISOString(),
        customer.branch_id,
        Math.floor(Math.random() * 60) + 12
      ]);
    }

    console.log('Seeding transactions...');
    const accounts = await client.query('SELECT account_number FROM accounts LIMIT 50');
    const transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'FEE'];
    
    for (let i = 0; i < 500; i++) {
      const account = accounts.rows[Math.floor(Math.random() * accounts.rows.length)];
      const transactionDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      await client.query(`
        INSERT INTO transactions (
          transaction_reference, account_id, transaction_type, amount,
          currency_code, transaction_status, transaction_date, value_date, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        `TXN${String(Date.now() + i).padStart(15, '0')}`,
        account.account_number,
        transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        Math.random() * 10000 + 10,
        'USD',
        'COMPLETED',
        transactionDate.toISOString(),
        transactionDate.toISOString(),
        `Transaction ${i + 1}`
      ]);
    }

    // Create indexes
    console.log('Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(account_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_loan_accounts_status ON loan_accounts(loan_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)');

    console.log('Database seeded successfully!');

    // Display summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM branches) as branches,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM accounts) as accounts,
        (SELECT COUNT(*) FROM loan_accounts) as loans,
        (SELECT COUNT(*) FROM transactions) as transactions
    `);

    console.log('\nData Summary:');
    console.log('=============');
    const row = summary.rows[0];
    Object.entries(row).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

seedDatabase();