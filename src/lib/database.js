// Database Abstraction Layer
// Provides a unified interface for both Supabase (PostgreSQL) and Oracle databases

import { supabase, supabaseBanking, TABLES } from './supabase.js';
import oracle from './oracle.js';

// Database types
export const DATABASE_TYPES = {
  SUPABASE: 'supabase',
  ORACLE: 'oracle'
};

// Configuration to determine which database to use
const config = {
  // Primary database (default: Supabase)
  primaryDatabase: process.env.PRIMARY_DATABASE || DATABASE_TYPES.SUPABASE,
  
  // Enable dual database mode (write to both, read from primary)
  dualDatabaseMode: process.env.DUAL_DATABASE_MODE === 'true',
  
  // Tables to sync between databases
  syncTables: process.env.SYNC_TABLES ? process.env.SYNC_TABLES.split(',') : []
};

// Database adapter interface
class DatabaseAdapter {
  constructor(type) {
    this.type = type;
  }

  async select(table, columns = '*', filters = {}) {
    throw new Error('select method must be implemented');
  }

  async insert(table, data) {
    throw new Error('insert method must be implemented');
  }

  async update(table, data, filters) {
    throw new Error('update method must be implemented');
  }

  async delete(table, filters) {
    throw new Error('delete method must be implemented');
  }

  async rawQuery(query, params = []) {
    throw new Error('rawQuery method must be implemented');
  }

  async transaction(operations) {
    throw new Error('transaction method must be implemented');
  }
}

// Supabase adapter
class SupabaseAdapter extends DatabaseAdapter {
  constructor() {
    super(DATABASE_TYPES.SUPABASE);
    this.client = supabaseBanking;
  }

  async select(table, columns = '*', filters = {}) {
    try {
      let query = this.client.from(table).select(columns);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase select error:', error);
      return { success: false, error: error.message };
    }
  }

  async insert(table, data) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }
  }

  async update(table, data, filters) {
    try {
      let query = this.client.from(table).update(data);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();
      
      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(table, filters) {
    try {
      let query = this.client.from(table).delete();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async rawQuery(query, params = []) {
    try {
      const { data, error } = await this.client.rpc('exec_sql', {
        query,
        params
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase raw query error:', error);
      return { success: false, error: error.message };
    }
  }

  async transaction(operations) {
    // Supabase doesn't have built-in transaction support in the JS client
    // This is a simplified version - for production, use database functions
    try {
      const results = [];
      for (const op of operations) {
        const result = await this[op.type](op.table, op.data, op.filters);
        if (!result.success) {
          throw new Error(`Transaction failed at ${op.type} on ${op.table}: ${result.error}`);
        }
        results.push(result);
      }
      return { success: true, data: results };
    } catch (error) {
      console.error('Supabase transaction error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Oracle adapter
class OracleAdapter extends DatabaseAdapter {
  constructor() {
    super(DATABASE_TYPES.ORACLE);
  }

  async select(table, columns = '*', filters = {}) {
    try {
      let sql = `SELECT ${columns === '*' ? '*' : columns} FROM ${table}`;
      const binds = {};
      let bindIndex = 1;

      // Build WHERE clause
      const whereClauses = [];
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const placeholders = value.map((_, i) => `:${bindIndex + i}`).join(', ');
          whereClauses.push(`${key} IN (${placeholders})`);
          value.forEach((v, i) => {
            binds[bindIndex + i] = v;
          });
          bindIndex += value.length;
        } else if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else {
          whereClauses.push(`${key} = :${bindIndex}`);
          binds[bindIndex] = value;
          bindIndex++;
        }
      });

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      const result = await oracle.executeQuery(sql, binds);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Oracle select error:', error);
      return { success: false, error: error.message };
    }
  }

  async insert(table, data) {
    try {
      const { sql, binds } = oracle.buildInsertStatement(table, data);
      const result = await oracle.executeQuery(sql, binds, {
        autoCommit: true
      });
      
      return { success: true, data: { rowsAffected: result.rowsAffected } };
    } catch (error) {
      console.error('Oracle insert error:', error);
      return { success: false, error: error.message };
    }
  }

  async update(table, data, filters) {
    try {
      const whereClauses = Object.keys(filters)
        .map((key, index) => `${key} = :w${index + 1}`)
        .join(' AND ');
      
      const { sql, binds } = oracle.buildUpdateStatement(
        table,
        data,
        whereClauses,
        filters
      );
      
      const result = await oracle.executeQuery(sql, binds, {
        autoCommit: true
      });
      
      return { success: true, data: { rowsAffected: result.rowsAffected } };
    } catch (error) {
      console.error('Oracle update error:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(table, filters) {
    try {
      let sql = `DELETE FROM ${table}`;
      const binds = {};
      let bindIndex = 1;

      // Build WHERE clause
      const whereClauses = [];
      Object.entries(filters).forEach(([key, value]) => {
        whereClauses.push(`${key} = :${bindIndex}`);
        binds[bindIndex] = value;
        bindIndex++;
      });

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      const result = await oracle.executeQuery(sql, binds, {
        autoCommit: true
      });
      
      return { success: true, data: { rowsAffected: result.rowsAffected } };
    } catch (error) {
      console.error('Oracle delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async rawQuery(query, params = []) {
    try {
      const binds = {};
      params.forEach((param, index) => {
        binds[index + 1] = param;
      });
      
      const result = await oracle.executeQuery(query, binds);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Oracle raw query error:', error);
      return { success: false, error: error.message };
    }
  }

  async transaction(operations) {
    try {
      const queries = operations.map(op => {
        switch (op.type) {
          case 'insert': {
            const { sql, binds } = oracle.buildInsertStatement(op.table, op.data);
            return { sql, binds };
          }
          case 'update': {
            const whereClauses = Object.keys(op.filters)
              .map((key, index) => `${key} = :w${index + 1}`)
              .join(' AND ');
            const { sql, binds } = oracle.buildUpdateStatement(
              op.table,
              op.data,
              whereClauses,
              op.filters
            );
            return { sql, binds };
          }
          case 'delete': {
            const whereClauses = Object.keys(op.filters)
              .map((key, index) => `${key} = :${index + 1}`)
              .join(' AND ');
            const sql = `DELETE FROM ${op.table} WHERE ${whereClauses}`;
            const binds = Object.values(op.filters);
            return { sql, binds };
          }
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      });

      const results = await oracle.executeTransaction(queries);
      return { success: true, data: results };
    } catch (error) {
      console.error('Oracle transaction error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Database manager
class DatabaseManager {
  constructor() {
    this.adapters = {
      [DATABASE_TYPES.SUPABASE]: new SupabaseAdapter(),
      [DATABASE_TYPES.ORACLE]: new OracleAdapter()
    };
    
    this.primaryAdapter = this.adapters[config.primaryDatabase];
    this.secondaryAdapter = config.dualDatabaseMode 
      ? this.adapters[config.primaryDatabase === DATABASE_TYPES.SUPABASE ? DATABASE_TYPES.ORACLE : DATABASE_TYPES.SUPABASE]
      : null;
  }

  async select(table, columns = '*', filters = {}) {
    // Always read from primary database
    return await this.primaryAdapter.select(table, columns, filters);
  }

  async insert(table, data) {
    const primaryResult = await this.primaryAdapter.insert(table, data);
    
    // If dual database mode is enabled and table is in sync list
    if (config.dualDatabaseMode && config.syncTables.includes(table) && this.secondaryAdapter) {
      await this.secondaryAdapter.insert(table, data);
    }
    
    return primaryResult;
  }

  async update(table, data, filters) {
    const primaryResult = await this.primaryAdapter.update(table, data, filters);
    
    // If dual database mode is enabled and table is in sync list
    if (config.dualDatabaseMode && config.syncTables.includes(table) && this.secondaryAdapter) {
      await this.secondaryAdapter.update(table, data, filters);
    }
    
    return primaryResult;
  }

  async delete(table, filters) {
    const primaryResult = await this.primaryAdapter.delete(table, filters);
    
    // If dual database mode is enabled and table is in sync list
    if (config.dualDatabaseMode && config.syncTables.includes(table) && this.secondaryAdapter) {
      await this.secondaryAdapter.delete(table, filters);
    }
    
    return primaryResult;
  }

  async rawQuery(query, params = []) {
    return await this.primaryAdapter.rawQuery(query, params);
  }

  async transaction(operations) {
    const primaryResult = await this.primaryAdapter.transaction(operations);
    
    // If dual database mode is enabled, run transaction on secondary
    if (config.dualDatabaseMode && this.secondaryAdapter) {
      // Filter operations for synced tables only
      const syncedOperations = operations.filter(op => config.syncTables.includes(op.table));
      if (syncedOperations.length > 0) {
        await this.secondaryAdapter.transaction(syncedOperations);
      }
    }
    
    return primaryResult;
  }

  // Get specific adapter
  getAdapter(type) {
    return this.adapters[type];
  }

  // Switch primary database
  switchPrimaryDatabase(type) {
    if (this.adapters[type]) {
      config.primaryDatabase = type;
      this.primaryAdapter = this.adapters[type];
      this.secondaryAdapter = config.dualDatabaseMode 
        ? this.adapters[type === DATABASE_TYPES.SUPABASE ? DATABASE_TYPES.ORACLE : DATABASE_TYPES.SUPABASE]
        : null;
    }
  }

  // Get current configuration
  getConfig() {
    return { ...config };
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export the database manager and utilities
export default databaseManager;
export { DatabaseAdapter, SupabaseAdapter, OracleAdapter, DATABASE_TYPES };