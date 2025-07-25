// src/lib/supabaseConfig.js
// Supabase configuration validation and fallback handling

export function validateSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'https://your-project.supabase.co' &&
                      supabaseAnonKey !== 'your-anon-key' &&
                      supabaseUrl.includes('supabase.co');
  
  if (!isConfigured) {
    console.warn('Supabase credentials not configured. Using mock data mode.');
    return false;
  }
  
  return true;
}

export function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: validateSupabaseConfig()
  };
}

// Mock data for fallback when Supabase is not configured
export const mockData = {
  kpis: {
    total_customers: 12847,
    total_accounts: 18293,
    total_deposits: 2400000000, // SAR 2.4B
    total_loans: 1800000000, // SAR 1.8B
    daily_transactions: 8547,
    monthly_revenue: 45200000 // SAR 45.2M
  },
  
  recentTransactions: [
    {
      id: 'TRN20250124_001',
      customer_name: 'Ahmed Al-Rashid',
      account_number: '1234567890',
      amount: 15000,
      transaction_type: 'Transfer',
      status: 'Completed',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
    },
    {
      id: 'TRN20250124_002',
      customer_name: 'Fatima Al-Zahra',
      account_number: '1234567891',
      amount: 5500,
      transaction_type: 'Deposit',
      status: 'Pending',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    },
    {
      id: 'TRN20250124_003',
      customer_name: 'Mohammed Al-Saud',
      account_number: '1234567892',
      amount: 25000,
      transaction_type: 'Withdrawal',
      status: 'Completed',
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8 minutes ago
    }
  ],
  
  transactionAnalytics: {
    by_channel: [
      { channel: 'Mobile App', count: 4521, percentage: 45.2 },
      { channel: 'ATM', count: 3210, percentage: 32.1 },
      { channel: 'Branch', count: 1543, percentage: 15.4 },
      { channel: 'Online Banking', count: 726, percentage: 7.3 }
    ],
    success_rate: 98.5,
    total_transactions: 10000,
    completed_transactions: 9850
  },
  
  customerAnalytics: {
    by_segment: [
      { segment: 'Premium', count: 1284, percentage: 10.0 },
      { segment: 'Gold', count: 3854, percentage: 30.0 },
      { segment: 'Silver', count: 5139, percentage: 40.0 },
      { segment: 'Basic', count: 2570, percentage: 20.0 }
    ],
    kyc_status: [
      { status: 'Verified', count: 11563, percentage: 90.0 },
      { status: 'Pending', count: 1284, percentage: 10.0 }
    ],
    by_risk_category: [
      { category: 'Low Risk', count: 9000, percentage: 70.0 },
      { category: 'Medium Risk', count: 3200, percentage: 25.0 },
      { category: 'High Risk', count: 647, percentage: 5.0 }
    ],
    total_customers: 12847
  },
  
  loanAnalytics: {
    total_portfolio: 1800000000,
    disbursed_amount: 1650000000,
    outstanding_amount: 1500000000,
    by_status: [
      { status: 'Active', count: 5420, amount: 1200000000 },
      { status: 'Pending', count: 234, amount: 150000000 },
      { status: 'Overdue', count: 156, amount: 100000000 },
      { status: 'Closed', count: 8900, amount: 350000000 }
    ],
    default_rate: 2.5
  }
};

