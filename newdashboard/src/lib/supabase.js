// Supabase client configuration
//
// This file exports a Supabase client instance configured using environment
// variables.  In a real application you would provide your project's URL
// and anon key via `.env` and reference them here.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey);

export const TABLES = {
  ACCOUNTS: 'accounts',
  LOAN_ACCOUNTS: 'loan_accounts',
  TRANSACTIONS: 'transactions',
  BRANCHES: 'branches',
  CUSTOMERS: 'customers'
};