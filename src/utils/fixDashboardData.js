import { supabaseBanking, TABLES, checkSchemaAccess } from '@/lib/supabase';
import { seedDashboardData } from './seedDashboardData';
import { toast } from 'sonner';

// Check if database is accessible and has data
export async function checkDatabaseStatus() {
  try {
    // First check if schema is accessible
    const schemaAccessible = await checkSchemaAccess();
    if (!schemaAccessible) {
      return {
        isConnected: false,
        hasData: false,
        error: 'Database schema not accessible. Please check Supabase configuration.'
      };
    }

    // Check for data in key tables
    const [customersResult, accountsResult, transactionsResult] = await Promise.all([
      supabaseBanking.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }),
      supabaseBanking.from(TABLES.ACCOUNTS).select('*', { count: 'exact', head: true }),
      supabaseBanking.from(TABLES.TRANSACTIONS).select('*', { count: 'exact', head: true })
    ]);

    // Log the results for debugging
    console.log('Database status check results:', {
      customers: { count: customersResult.count, error: customersResult.error },
      accounts: { count: accountsResult.count, error: accountsResult.error },
      transactions: { count: transactionsResult.count, error: transactionsResult.error }
    });

    const hasData = (customersResult.count > 0) || (accountsResult.count > 0) || (transactionsResult.count > 0);

    return {
      isConnected: true,
      hasData,
      counts: {
        customers: customersResult.count || 0,
        accounts: accountsResult.count || 0,
        transactions: transactionsResult.count || 0
      },
      errors: {
        customers: customersResult.error,
        accounts: accountsResult.error,
        transactions: transactionsResult.error
      }
    };
  } catch (error) {
    console.error('Database status check failed:', error);
    return {
      isConnected: false,
      hasData: false,
      error: error.message
    };
  }
}

// Fix dashboard data issues
export async function fixDashboardData() {
  try {
    console.log('🔧 Starting dashboard data fix...');
    
    // 1. Check database status
    const status = await checkDatabaseStatus();
    console.log('Database status:', status);

    if (!status.isConnected) {
      toast.error('Database connection failed. Using mock data mode.');
      return { success: false, error: status.error, useMockData: true };
    }

    // 2. If no data exists, seed it
    if (!status.hasData) {
      toast.info('No data found. Seeding sample data...');
      const seedResult = await seedDashboardData();
      
      if (seedResult.success) {
        toast.success('Sample data seeded successfully!');
        // Reload the page to refresh all widgets
        setTimeout(() => window.location.reload(), 1000);
        return { success: true, dataSeeded: true };
      } else {
        toast.error('Failed to seed data. Using mock data mode.');
        return { success: false, error: seedResult.error, useMockData: true };
      }
    }

    // 3. Data exists, ensure it's accessible
    toast.success('Database connected and data available!');
    return { success: true, hasData: true };

  } catch (error) {
    console.error('Dashboard data fix failed:', error);
    toast.error('Failed to fix dashboard data. Using mock data mode.');
    return { success: false, error: error.message, useMockData: true };
  }
}

// Enhanced query wrapper that handles errors and returns mock data
export async function safeQuery(queryFn, mockDataFn) {
  try {
    const result = await queryFn();
    if (result.error) throw result.error;
    return result.data || mockDataFn();
  } catch (error) {
    console.warn('Query failed, using mock data:', error.message);
    return mockDataFn();
  }
}