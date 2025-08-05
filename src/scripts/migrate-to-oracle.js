// Migration Script: Supabase to Oracle
// This script helps migrate data from Supabase (PostgreSQL) to Oracle database

import databaseManager, { DATABASE_TYPES } from '../lib/database.js';
import { TABLES } from '../lib/supabase.js';
import oracle from '../lib/oracle.js';

// Configuration
const BATCH_SIZE = 1000; // Number of records to process at once
const TABLES_TO_MIGRATE = [
  TABLES.BRANCHES,
  TABLES.CUSTOMERS,
  TABLES.ACCOUNTS,
  TABLES.TRANSACTIONS,
  TABLES.LOAN_ACCOUNTS,
  // Add more tables as needed
];

// Oracle table creation scripts
const ORACLE_SCHEMA = {
  [TABLES.BRANCHES]: `
    CREATE TABLE branches (
      branch_id VARCHAR2(50) PRIMARY KEY,
      branch_code VARCHAR2(20) UNIQUE NOT NULL,
      branch_name VARCHAR2(100) NOT NULL,
      address VARCHAR2(255),
      city VARCHAR2(100),
      state VARCHAR2(100),
      country VARCHAR2(100),
      postal_code VARCHAR2(20),
      phone VARCHAR2(50),
      email VARCHAR2(100),
      manager_id VARCHAR2(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  [TABLES.CUSTOMERS]: `
    CREATE TABLE customers (
      customer_id VARCHAR2(50) PRIMARY KEY,
      first_name VARCHAR2(100) NOT NULL,
      last_name VARCHAR2(100) NOT NULL,
      middle_name VARCHAR2(100),
      email VARCHAR2(100) UNIQUE,
      phone VARCHAR2(50),
      date_of_birth DATE,
      gender VARCHAR2(20),
      nationality VARCHAR2(100),
      customer_type VARCHAR2(50),
      branch_id VARCHAR2(50),
      status VARCHAR2(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
    )
  `,
  
  [TABLES.ACCOUNTS]: `
    CREATE TABLE accounts (
      account_id VARCHAR2(50) PRIMARY KEY,
      account_number VARCHAR2(50) UNIQUE NOT NULL,
      customer_id VARCHAR2(50) NOT NULL,
      account_type VARCHAR2(50) NOT NULL,
      currency VARCHAR2(10) DEFAULT 'USD',
      balance NUMBER(15,2) DEFAULT 0,
      status VARCHAR2(20) DEFAULT 'ACTIVE',
      opened_date DATE DEFAULT SYSDATE,
      closed_date DATE,
      branch_id VARCHAR2(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
      CONSTRAINT fk_account_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
    )
  `,
  
  [TABLES.TRANSACTIONS]: `
    CREATE TABLE transactions (
      transaction_id VARCHAR2(50) PRIMARY KEY,
      account_id VARCHAR2(50) NOT NULL,
      transaction_type VARCHAR2(20) NOT NULL,
      amount NUMBER(15,2) NOT NULL,
      currency VARCHAR2(10) DEFAULT 'USD',
      description VARCHAR2(255),
      reference_number VARCHAR2(100),
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR2(20) DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES accounts(account_id)
    )
  `,
  
  [TABLES.LOAN_ACCOUNTS]: `
    CREATE TABLE loan_accounts (
      loan_id VARCHAR2(50) PRIMARY KEY,
      account_id VARCHAR2(50) NOT NULL,
      customer_id VARCHAR2(50) NOT NULL,
      loan_type VARCHAR2(50) NOT NULL,
      principal_amount NUMBER(15,2) NOT NULL,
      interest_rate NUMBER(5,2) NOT NULL,
      term_months NUMBER(5) NOT NULL,
      monthly_payment NUMBER(15,2),
      outstanding_balance NUMBER(15,2),
      status VARCHAR2(20) DEFAULT 'ACTIVE',
      disbursement_date DATE,
      maturity_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_loan_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
      CONSTRAINT fk_loan_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
  `
};

// Migration class
class DatabaseMigration {
  constructor() {
    this.supabaseAdapter = databaseManager.getAdapter(DATABASE_TYPES.SUPABASE);
    this.oracleAdapter = databaseManager.getAdapter(DATABASE_TYPES.ORACLE);
    this.stats = {
      tablesCreated: 0,
      recordsMigrated: 0,
      errors: []
    };
  }

  // Check if Oracle is configured
  async checkOracleConnection() {
    console.log('🔍 Checking Oracle connection...');
    
    const isConfigured = oracle.isOracleConfigured();
    if (!isConfigured) {
      throw new Error('Oracle database is not configured. Please set ORACLE_* environment variables.');
    }

    const testResult = await oracle.testOracleConnection();
    if (!testResult) {
      throw new Error('Failed to connect to Oracle database');
    }

    console.log('✅ Oracle connection successful');
    return true;
  }

  // Create tables in Oracle
  async createOracleTables() {
    console.log('\n📋 Creating Oracle tables...');
    
    for (const table of TABLES_TO_MIGRATE) {
      if (ORACLE_SCHEMA[table]) {
        try {
          // Check if table exists
          const checkQuery = `
            SELECT COUNT(*) as count 
            FROM user_tables 
            WHERE UPPER(table_name) = UPPER(:1)
          `;
          
          const checkResult = await oracle.executeQuery(checkQuery, [table]);
          
          if (checkResult.rows[0].COUNT > 0) {
            console.log(`⚠️  Table ${table} already exists, skipping...`);
            continue;
          }

          // Create table
          await oracle.executeQuery(ORACLE_SCHEMA[table]);
          console.log(`✅ Created table: ${table}`);
          this.stats.tablesCreated++;
        } catch (error) {
          console.error(`❌ Failed to create table ${table}:`, error.message);
          this.stats.errors.push({ table, error: error.message, phase: 'create_table' });
        }
      }
    }
  }

  // Migrate data for a specific table
  async migrateTable(tableName) {
    console.log(`\n🔄 Migrating table: ${tableName}`);
    
    try {
      // Get total count
      const countResult = await this.supabaseAdapter.client
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      const totalRecords = countResult.count || 0;
      console.log(`📊 Total records to migrate: ${totalRecords}`);

      if (totalRecords === 0) {
        console.log(`⚠️  No records to migrate in ${tableName}`);
        return;
      }

      // Migrate in batches
      let offset = 0;
      let migratedCount = 0;

      while (offset < totalRecords) {
        // Fetch batch from Supabase
        const { data: records, error } = await this.supabaseAdapter.client
          .from(tableName)
          .select('*')
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
          throw new Error(`Failed to fetch records: ${error.message}`);
        }

        if (!records || records.length === 0) {
          break;
        }

        // Insert batch into Oracle
        for (const record of records) {
          try {
            // Transform data if needed (handle date formats, etc.)
            const transformedRecord = this.transformRecord(tableName, record);
            
            const { sql, binds } = oracle.buildInsertStatement(tableName, transformedRecord);
            await oracle.executeQuery(sql, binds);
            
            migratedCount++;
            this.stats.recordsMigrated++;
          } catch (insertError) {
            console.error(`❌ Failed to insert record:`, insertError.message);
            this.stats.errors.push({ 
              table: tableName, 
              record: record, 
              error: insertError.message, 
              phase: 'insert' 
            });
          }
        }

        offset += BATCH_SIZE;
        const progress = Math.min(100, Math.round((offset / totalRecords) * 100));
        console.log(`📈 Progress: ${progress}% (${migratedCount}/${totalRecords} records)`);
      }

      console.log(`✅ Completed migration for ${tableName}: ${migratedCount} records`);
    } catch (error) {
      console.error(`❌ Failed to migrate table ${tableName}:`, error.message);
      this.stats.errors.push({ table: tableName, error: error.message, phase: 'migrate' });
    }
  }

  // Transform record data for Oracle compatibility
  transformRecord(tableName, record) {
    const transformed = { ...record };

    // Handle date/timestamp fields
    const dateFields = ['created_at', 'updated_at', 'transaction_date', 'opened_date', 
                       'closed_date', 'disbursement_date', 'maturity_date', 'date_of_birth'];
    
    dateFields.forEach(field => {
      if (transformed[field]) {
        // Convert to Oracle-compatible date format
        transformed[field] = new Date(transformed[field]);
      }
    });

    // Handle boolean fields (Oracle doesn't have boolean type)
    Object.keys(transformed).forEach(key => {
      if (typeof transformed[key] === 'boolean') {
        transformed[key] = transformed[key] ? 'Y' : 'N';
      }
    });

    // Handle null values
    Object.keys(transformed).forEach(key => {
      if (transformed[key] === null || transformed[key] === undefined) {
        delete transformed[key];
      }
    });

    return transformed;
  }

  // Create indexes for better performance
  async createIndexes() {
    console.log('\n🔧 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX idx_customers_email ON customers(email)',
      'CREATE INDEX idx_customers_branch ON customers(branch_id)',
      'CREATE INDEX idx_accounts_customer ON accounts(customer_id)',
      'CREATE INDEX idx_accounts_branch ON accounts(branch_id)',
      'CREATE INDEX idx_transactions_account ON transactions(account_id)',
      'CREATE INDEX idx_transactions_date ON transactions(transaction_date)',
      'CREATE INDEX idx_loans_customer ON loan_accounts(customer_id)',
      'CREATE INDEX idx_loans_account ON loan_accounts(account_id)'
    ];

    for (const indexSql of indexes) {
      try {
        await oracle.executeQuery(indexSql);
        console.log(`✅ Created index: ${indexSql.match(/CREATE INDEX (\w+)/)[1]}`);
      } catch (error) {
        if (error.message.includes('ORA-00955')) {
          console.log(`⚠️  Index already exists: ${indexSql.match(/CREATE INDEX (\w+)/)[1]}`);
        } else {
          console.error(`❌ Failed to create index:`, error.message);
        }
      }
    }
  }

  // Main migration process
  async migrate() {
    console.log('🚀 Starting Supabase to Oracle migration...\n');
    
    try {
      // Step 1: Check Oracle connection
      await this.checkOracleConnection();

      // Step 2: Create tables
      await this.createOracleTables();

      // Step 3: Migrate data
      for (const table of TABLES_TO_MIGRATE) {
        await this.migrateTable(table);
      }

      // Step 4: Create indexes
      await this.createIndexes();

      // Print summary
      console.log('\n📊 Migration Summary:');
      console.log(`✅ Tables created: ${this.stats.tablesCreated}`);
      console.log(`✅ Records migrated: ${this.stats.recordsMigrated}`);
      console.log(`❌ Errors: ${this.stats.errors.length}`);

      if (this.stats.errors.length > 0) {
        console.log('\n❌ Error Details:');
        this.stats.errors.forEach((error, index) => {
          console.log(`${index + 1}. Table: ${error.table}, Phase: ${error.phase}`);
          console.log(`   Error: ${error.error}`);
        });
      }

      return this.stats;
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    }
  }

  // Verify migration
  async verify() {
    console.log('\n🔍 Verifying migration...');
    
    const verificationResults = [];

    for (const table of TABLES_TO_MIGRATE) {
      try {
        // Get count from Supabase
        const { count: supabaseCount } = await this.supabaseAdapter.client
          .from(table)
          .select('*', { count: 'exact', head: true });

        // Get count from Oracle
        const oracleResult = await oracle.executeQuery(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const oracleCount = oracleResult.rows[0].COUNT;

        const match = supabaseCount === oracleCount;
        verificationResults.push({
          table,
          supabaseCount,
          oracleCount,
          match,
          difference: Math.abs(supabaseCount - oracleCount)
        });

        console.log(`${match ? '✅' : '❌'} ${table}: Supabase=${supabaseCount}, Oracle=${oracleCount}`);
      } catch (error) {
        console.error(`❌ Failed to verify ${table}:`, error.message);
        verificationResults.push({
          table,
          error: error.message
        });
      }
    }

    return verificationResults;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new DatabaseMigration();
  
  migration.migrate()
    .then(async (stats) => {
      console.log('\n✅ Migration completed!');
      
      // Run verification
      const verificationResults = await migration.verify();
      
      // Close Oracle connection pool
      await oracle.closeOraclePool();
      
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch(async (error) => {
      console.error('\n❌ Migration failed:', error);
      await oracle.closeOraclePool();
      process.exit(1);
    });
}

export default DatabaseMigration;