// Example Database Service
// Shows how to use the database abstraction layer with both Supabase and Oracle

import databaseManager, { DATABASE_TYPES } from '../lib/database.js';
import { TABLES } from '../lib/supabase.js';

// Example service for customer operations
export class CustomerService {
  constructor() {
    this.db = databaseManager;
  }

  // Get all customers
  async getAllCustomers() {
    const result = await this.db.select(TABLES.CUSTOMERS);
    return result;
  }

  // Get customer by ID
  async getCustomerById(customerId) {
    const result = await this.db.select(
      TABLES.CUSTOMERS,
      '*',
      { customer_id: customerId }
    );
    
    if (result.success && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    
    return { success: false, error: 'Customer not found' };
  }

  // Get customers by branch
  async getCustomersByBranch(branchId) {
    const result = await this.db.select(
      TABLES.CUSTOMERS,
      'customer_id, first_name, last_name, email, phone',
      { branch_id: branchId }
    );
    
    return result;
  }

  // Create new customer
  async createCustomer(customerData) {
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'branch_id'];
    for (const field of requiredFields) {
      if (!customerData[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Add timestamps
    const data = {
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await this.db.insert(TABLES.CUSTOMERS, data);
    return result;
  }

  // Update customer
  async updateCustomer(customerId, updateData) {
    // Add updated timestamp
    const data = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const result = await this.db.update(
      TABLES.CUSTOMERS,
      data,
      { customer_id: customerId }
    );
    
    return result;
  }

  // Delete customer
  async deleteCustomer(customerId) {
    const result = await this.db.delete(
      TABLES.CUSTOMERS,
      { customer_id: customerId }
    );
    
    return result;
  }

  // Complex query example - Get customer with accounts
  async getCustomerWithAccounts(customerId) {
    // For complex queries, we need to use database-specific implementations
    const dbType = this.db.getConfig().primaryDatabase;
    
    if (dbType === DATABASE_TYPES.SUPABASE) {
      // Supabase approach using relations
      const adapter = this.db.getAdapter(DATABASE_TYPES.SUPABASE);
      const { data, error } = await adapter.client
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          accounts:${TABLES.ACCOUNTS}(*)
        `)
        .eq('customer_id', customerId)
        .single();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } else {
      // Oracle approach using JOIN
      const query = `
        SELECT 
          c.*,
          a.account_id,
          a.account_number,
          a.account_type,
          a.balance,
          a.currency
        FROM ${TABLES.CUSTOMERS} c
        LEFT JOIN ${TABLES.ACCOUNTS} a ON c.customer_id = a.customer_id
        WHERE c.customer_id = :1
      `;
      
      const result = await this.db.rawQuery(query, [customerId]);
      
      if (result.success && result.data.length > 0) {
        // Transform Oracle result to match Supabase format
        const customer = result.data[0];
        const accounts = result.data
          .filter(row => row.ACCOUNT_ID)
          .map(row => ({
            account_id: row.ACCOUNT_ID,
            account_number: row.ACCOUNT_NUMBER,
            account_type: row.ACCOUNT_TYPE,
            balance: row.BALANCE,
            currency: row.CURRENCY
          }));
        
        return {
          success: true,
          data: {
            ...customer,
            accounts
          }
        };
      }
      
      return result;
    }
  }

  // Bulk operations example
  async bulkCreateCustomers(customersData) {
    const operations = customersData.map(customer => ({
      type: 'insert',
      table: TABLES.CUSTOMERS,
      data: {
        ...customer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    const result = await this.db.transaction(operations);
    return result;
  }
}

// Example service for account operations
export class AccountService {
  constructor() {
    this.db = databaseManager;
  }

  // Transfer money between accounts (transaction example)
  async transferMoney(fromAccountId, toAccountId, amount) {
    // First, get both accounts to check balances
    const fromAccountResult = await this.db.select(
      TABLES.ACCOUNTS,
      '*',
      { account_id: fromAccountId }
    );
    
    const toAccountResult = await this.db.select(
      TABLES.ACCOUNTS,
      '*',
      { account_id: toAccountId }
    );

    if (!fromAccountResult.success || fromAccountResult.data.length === 0) {
      return { success: false, error: 'Source account not found' };
    }

    if (!toAccountResult.success || toAccountResult.data.length === 0) {
      return { success: false, error: 'Destination account not found' };
    }

    const fromAccount = fromAccountResult.data[0];
    const toAccount = toAccountResult.data[0];

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Perform transaction
    const operations = [
      {
        type: 'update',
        table: TABLES.ACCOUNTS,
        data: { 
          balance: fromAccount.balance - amount,
          updated_at: new Date().toISOString()
        },
        filters: { account_id: fromAccountId }
      },
      {
        type: 'update',
        table: TABLES.ACCOUNTS,
        data: { 
          balance: toAccount.balance + amount,
          updated_at: new Date().toISOString()
        },
        filters: { account_id: toAccountId }
      },
      {
        type: 'insert',
        table: TABLES.TRANSACTIONS,
        data: {
          account_id: fromAccountId,
          transaction_type: 'DEBIT',
          amount: amount,
          description: `Transfer to account ${toAccountId}`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      },
      {
        type: 'insert',
        table: TABLES.TRANSACTIONS,
        data: {
          account_id: toAccountId,
          transaction_type: 'CREDIT',
          amount: amount,
          description: `Transfer from account ${fromAccountId}`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      }
    ];

    const result = await this.db.transaction(operations);
    return result;
  }
}

// Example: How to switch between databases
export async function switchDatabase(targetDatabase) {
  // Switch to Oracle
  if (targetDatabase === DATABASE_TYPES.ORACLE) {
    // First, ensure Oracle is configured
    const oracleAdapter = databaseManager.getAdapter(DATABASE_TYPES.ORACLE);
    const isConfigured = await oracleAdapter.isOracleConfigured();
    
    if (!isConfigured) {
      return { 
        success: false, 
        error: 'Oracle database is not configured. Please set ORACLE_* environment variables.' 
      };
    }

    // Test Oracle connection
    const testResult = await oracleAdapter.testOracleConnection();
    if (!testResult) {
      return { 
        success: false, 
        error: 'Failed to connect to Oracle database' 
      };
    }

    // Switch primary database
    databaseManager.switchPrimaryDatabase(DATABASE_TYPES.ORACLE);
    
    return { 
      success: true, 
      message: 'Switched to Oracle database' 
    };
  }

  // Switch to Supabase
  if (targetDatabase === DATABASE_TYPES.SUPABASE) {
    databaseManager.switchPrimaryDatabase(DATABASE_TYPES.SUPABASE);
    
    return { 
      success: true, 
      message: 'Switched to Supabase database' 
    };
  }

  return { 
    success: false, 
    error: 'Invalid database type' 
  };
}

// Example: Query builder helper for Oracle
export class OracleQueryBuilder {
  constructor() {
    this.query = '';
    this.binds = {};
    this.bindIndex = 1;
  }

  select(columns = '*') {
    this.query = `SELECT ${Array.isArray(columns) ? columns.join(', ') : columns}`;
    return this;
  }

  from(table) {
    this.query += ` FROM ${table}`;
    return this;
  }

  join(table, on) {
    this.query += ` JOIN ${table} ON ${on}`;
    return this;
  }

  leftJoin(table, on) {
    this.query += ` LEFT JOIN ${table} ON ${on}`;
    return this;
  }

  where(column, operator, value) {
    const whereKeyword = this.query.includes('WHERE') ? 'AND' : 'WHERE';
    
    if (value === undefined) {
      // Two parameter version: where('column', 'value')
      value = operator;
      operator = '=';
    }

    if (value === null) {
      this.query += ` ${whereKeyword} ${column} IS NULL`;
    } else if (Array.isArray(value)) {
      const placeholders = value.map((_, i) => `:${this.bindIndex + i}`).join(', ');
      this.query += ` ${whereKeyword} ${column} IN (${placeholders})`;
      value.forEach((v, i) => {
        this.binds[this.bindIndex + i] = v;
      });
      this.bindIndex += value.length;
    } else {
      this.query += ` ${whereKeyword} ${column} ${operator} :${this.bindIndex}`;
      this.binds[this.bindIndex] = value;
      this.bindIndex++;
    }

    return this;
  }

  orderBy(column, direction = 'ASC') {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count) {
    this.query += ` FETCH FIRST ${count} ROWS ONLY`;
    return this;
  }

  offset(count) {
    this.query += ` OFFSET ${count} ROWS`;
    return this;
  }

  build() {
    return {
      sql: this.query,
      binds: this.binds
    };
  }

  async execute() {
    const { sql, binds } = this.build();
    const adapter = databaseManager.getAdapter(DATABASE_TYPES.ORACLE);
    return await adapter.rawQuery(sql, Object.values(binds));
  }
}

// Usage examples
async function examples() {
  // Example 1: Using the customer service
  const customerService = new CustomerService();
  
  // Get all customers
  const allCustomers = await customerService.getAllCustomers();
  console.log('All customers:', allCustomers);

  // Create a new customer
  const newCustomer = await customerService.createCustomer({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    branch_id: 'BR001'
  });
  console.log('New customer:', newCustomer);

  // Example 2: Using the account service
  const accountService = new AccountService();
  
  // Transfer money
  const transferResult = await accountService.transferMoney(
    'ACC001',
    'ACC002',
    100.00
  );
  console.log('Transfer result:', transferResult);

  // Example 3: Using Oracle query builder
  const queryBuilder = new OracleQueryBuilder();
  const result = await queryBuilder
    .select(['customer_id', 'first_name', 'last_name', 'email'])
    .from('customers')
    .where('branch_id', 'BR001')
    .where('status', 'ACTIVE')
    .orderBy('created_at', 'DESC')
    .limit(10)
    .execute();
  
  console.log('Query result:', result);

  // Example 4: Switch to Oracle database
  const switchResult = await switchDatabase(DATABASE_TYPES.ORACLE);
  console.log('Switch result:', switchResult);
}

// Export everything
export default {
  CustomerService,
  AccountService,
  OracleQueryBuilder,
  switchDatabase,
  examples
};