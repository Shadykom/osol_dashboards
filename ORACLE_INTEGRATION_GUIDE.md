# Oracle Database Integration Guide

This guide explains how to integrate Oracle Database with your existing Supabase-based system.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Migration](#migration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The system now supports dual database operation:
- **Supabase (PostgreSQL)**: Current primary database
- **Oracle Database**: Can be used as primary or secondary database

Key features:
- Database abstraction layer for seamless switching
- Support for both databases simultaneously
- Data migration tools
- Query builder for Oracle
- Connection pooling for performance

## Prerequisites

### Oracle Database Requirements
- Oracle Database 12c or higher
- Oracle Instant Client (for node-oracledb)
- Network access to Oracle database
- Database user with appropriate permissions

### System Requirements
- Node.js 16.x or higher
- npm or pnpm package manager
- Environment variables configuration

## Installation

1. **Install Oracle Database Driver**
   ```bash
   pnpm add oracledb
   ```

2. **Install Oracle Instant Client** (if not already installed)
   - Download from: https://www.oracle.com/database/technologies/instant-client.html
   - Follow platform-specific installation instructions
   - Set environment variables:
     ```bash
     export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH
     ```

## Configuration

### 1. Environment Variables

Create a `.env` file with Oracle configuration:

```env
# Oracle Database Configuration
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=hostname:1521/servicename

# Optional: Connection Pool Settings
ORACLE_POOL_MIN=4
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=1
ORACLE_POOL_TIMEOUT=60

# Database Mode Configuration
PRIMARY_DATABASE=supabase  # or 'oracle'
DUAL_DATABASE_MODE=false   # Set to true for dual database operation
SYNC_TABLES=customers,accounts,transactions  # Tables to sync between databases
```

### 2. Oracle Connection String Examples

**Standard Connection:**
```
localhost:1521/ORCL
```

**Oracle Cloud Autonomous Database:**
```
adb.region.oraclecloud.com:1522/unique_name_high.adb.oraclecloud.com
```

**RAC Connection:**
```
(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=host1)(PORT=1521))(ADDRESS=(PROTOCOL=TCP)(HOST=host2)(PORT=1521)))(CONNECT_DATA=(SERVICE_NAME=myservice)))
```

## Usage

### 1. Using the Database Abstraction Layer

```javascript
import databaseManager from './src/lib/database.js';

// Simple queries work with both databases
const customers = await databaseManager.select('customers');
const newCustomer = await databaseManager.insert('customers', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

### 2. Using Database-Specific Features

```javascript
import databaseManager, { DATABASE_TYPES } from './src/lib/database.js';

// Get Oracle adapter for Oracle-specific operations
const oracleAdapter = databaseManager.getAdapter(DATABASE_TYPES.ORACLE);

// Execute Oracle-specific query
const result = await oracleAdapter.rawQuery(
  'SELECT * FROM customers WHERE ROWNUM <= :1',
  [10]
);
```

### 3. Using the Oracle Query Builder

```javascript
import { OracleQueryBuilder } from './src/services/databaseService.example.js';

const query = new OracleQueryBuilder()
  .select(['customer_id', 'first_name', 'last_name'])
  .from('customers')
  .where('branch_id', 'BR001')
  .where('status', 'ACTIVE')
  .orderBy('created_at', 'DESC')
  .limit(10);

const result = await query.execute();
```

### 4. Switching Between Databases

```javascript
import { switchDatabase, DATABASE_TYPES } from './src/services/databaseService.example.js';

// Switch to Oracle as primary database
await switchDatabase(DATABASE_TYPES.ORACLE);

// Switch back to Supabase
await switchDatabase(DATABASE_TYPES.SUPABASE);
```

### 5. Using Services with Database Abstraction

```javascript
import { CustomerService } from './src/services/databaseService.example.js';

const customerService = new CustomerService();

// These methods work with whichever database is primary
const customers = await customerService.getAllCustomers();
const customer = await customerService.getCustomerById('CUST001');
const newCustomer = await customerService.createCustomer({
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  branch_id: 'BR001'
});
```

## Migration

### Running the Migration Script

1. **Configure Oracle credentials in .env**

2. **Run the migration:**
   ```bash
   node src/scripts/migrate-to-oracle.js
   ```

3. **The migration script will:**
   - Create tables in Oracle
   - Copy data from Supabase to Oracle
   - Create indexes for performance
   - Verify data integrity

### Migration Options

You can customize the migration by editing `src/scripts/migrate-to-oracle.js`:

```javascript
const TABLES_TO_MIGRATE = [
  'branches',
  'customers',
  'accounts',
  // Add more tables as needed
];

const BATCH_SIZE = 1000; // Adjust based on your needs
```

## Best Practices

### 1. Connection Management
- Always use the connection pool (handled automatically)
- Don't create connections manually
- The system handles connection cleanup

### 2. Error Handling
```javascript
const result = await databaseManager.select('customers');
if (!result.success) {
  console.error('Query failed:', result.error);
  // Handle error appropriately
}
```

### 3. Transactions
```javascript
const operations = [
  { type: 'update', table: 'accounts', data: { balance: 100 }, filters: { id: 1 } },
  { type: 'insert', table: 'transactions', data: { amount: 50, type: 'DEBIT' } }
];

const result = await databaseManager.transaction(operations);
```

### 4. Date Handling
- Dates are automatically converted between PostgreSQL and Oracle formats
- Use ISO strings or Date objects in JavaScript

### 5. Performance Tips
- Use connection pooling (enabled by default)
- Create appropriate indexes
- Use batch operations for bulk data
- Monitor pool statistics

## Troubleshooting

### Common Issues

1. **ORA-12154: TNS:could not resolve the connect identifier**
   - Check your connection string format
   - Ensure the database service is running
   - Verify network connectivity

2. **DPI-1047: Cannot locate a 64-bit Oracle Client library**
   - Install Oracle Instant Client
   - Set LD_LIBRARY_PATH (Linux/Mac) or PATH (Windows)
   - Ensure the architecture matches (64-bit)

3. **ORA-01017: invalid username/password**
   - Verify credentials in .env file
   - Check user permissions in Oracle
   - Ensure the user exists and is not locked

4. **Connection Pool Errors**
   - Check pool configuration limits
   - Monitor active connections
   - Adjust pool size based on load

### Debugging

Enable debug logging:
```javascript
// In your code
console.log(databaseManager.getConfig());

// Check Oracle connection
const oracle = databaseManager.getAdapter(DATABASE_TYPES.ORACLE);
await oracle.testOracleConnection();
```

### Performance Monitoring

```javascript
// Get pool statistics
const pool = await oracle.getOracleConnection();
const stats = pool.getStatistics();
console.log('Pool Stats:', stats);
```

## Additional Resources

- [Oracle node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Oracle SQL Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Oracle and node-oracledb documentation
3. Check application logs for detailed error messages