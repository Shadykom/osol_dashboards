// Temporary Supabase client with mock data for testing
// This bypasses the API key requirement until proper keys are configured

import { createClient } from '@supabase/supabase-js';

// Mock data for testing
const mockData = {
  accounts: {
    active: 1250,
    total_balance: 4567890.50
  },
  transactions: {
    daily: 342,
    weekly_trend: [
      { date: '2025-01-22', amount: 125000 },
      { date: '2025-01-23', amount: 145000 },
      { date: '2025-01-24', amount: 132000 },
      { date: '2025-01-25', amount: 156000 },
      { date: '2025-01-26', amount: 98000 },
      { date: '2025-01-27', amount: 142000 },
      { date: '2025-01-28', amount: 138000 }
    ]
  },
  customers: {
    total: 987,
    segments: [
      { name: 'Premium', value: 234 },
      { name: 'Standard', value: 456 },
      { name: 'Basic', value: 297 }
    ]
  },
  loans: {
    portfolio: 8765432.10,
    npl_ratio: 3.2,
    by_product: [
      { name: 'Personal Loans', value: 3456789 },
      { name: 'Auto Loans', value: 2345678 },
      { name: 'Home Loans', value: 1234567 },
      { name: 'Business Loans', value: 1728398 }
    ]
  }
};

// Create a mock client that returns test data
export const createMockSupabaseClient = () => {
  return {
    from: (table) => ({
      select: (columns) => {
        const query = {
          eq: () => query,
          gte: () => query,
          lte: () => query,
          limit: () => query,
          order: () => query,
          then: (resolve) => {
            // Return mock data based on the table
            let data = [];
            let error = null;
            
            switch(table) {
              case 'accounts':
                data = [{ current_balance: 4567890.50 }];
                break;
              case 'transactions':
                data = mockData.transactions.weekly_trend;
                break;
              case 'customers':
                data = Array(987).fill({ id: 1, customer_status: 'ACTIVE' });
                break;
              case 'loan_accounts':
                data = mockData.loans.by_product.map(p => ({
                  product_name: p.name,
                  outstanding_balance: p.value
                }));
                break;
              default:
                data = [];
            }
            
            resolve({ data, error });
            return Promise.resolve({ data, error });
          }
        };
        return query;
      },
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null })
    }),
    auth: {
      getSession: () => Promise.resolve({ 
        data: { 
          session: {
            user: { email: 'test@osol.com' },
            access_token: 'mock-token'
          } 
        }, 
        error: null 
      }),
      signIn: () => Promise.resolve({ 
        data: { 
          user: { email: 'test@osol.com' },
          session: { access_token: 'mock-token' }
        }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback) => {
        // Mock auth state change
        callback('SIGNED_IN', { 
          user: { email: 'test@osol.com' },
          access_token: 'mock-token'
        });
        return { unsubscribe: () => {} };
      }
    },
    rpc: (functionName, params) => {
      // Mock RPC responses
      const rpcData = {
        get_dashboard_metrics: mockData,
        get_total_assets: { total: 4567890.50 },
        get_active_accounts: { count: 1250 }
      };
      
      return Promise.resolve({ 
        data: rpcData[functionName] || {}, 
        error: null 
      });
    }
  };
};

// Export the mock client as the default
export const supabase = createMockSupabaseClient();
export const supabaseBanking = supabase;
export const supabaseCollection = supabase;

// Export table constants
export const TABLES = {
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  LOAN_ACCOUNTS: 'loan_accounts',
  BRANCHES: 'branches',
  CURRENCIES: 'currencies',
  COUNTRIES: 'countries',
  PRODUCTS: 'products'
};

export const COLLECTION_TABLES = {
  COLLECTION_CASES: 'collection_cases',
  COLLECTION_OFFICERS: 'collection_officers',
  COLLECTION_TEAMS: 'collection_teams'
};

export function getClientForTable(tableName) {
  return supabase;
}

console.log('Using mock Supabase client - configure real API keys for production');