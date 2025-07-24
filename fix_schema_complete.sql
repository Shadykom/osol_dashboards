-- ============================================================================
-- KASTLE BANKING SCHEMA FIX
-- ============================================================================
-- 
-- PROBLEM: The application is trying to access tables as 'kastle_banking.customers'
-- but Supabase interprets this as looking for a table named 'kastle_banking.customers'
-- in the 'public' schema, rather than the 'customers' table in the 'kastle_banking' schema.
--
-- SOLUTION OPTIONS:
-- ============================================================================

-- ============================================================================
-- OPTION 1: SQL FIX (RECOMMENDED FOR IMMEDIATE FIX)
-- Create views in the public schema that match the application's expectations
-- ============================================================================

-- First, grant necessary permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- Create views that match the application's table naming
CREATE OR REPLACE VIEW public."kastle_banking.accounts" AS 
SELECT * FROM kastle_banking.accounts;

CREATE OR REPLACE VIEW public."kastle_banking.transactions" AS 
SELECT * FROM kastle_banking.transactions;

CREATE OR REPLACE VIEW public."kastle_banking.customers" AS 
SELECT * FROM kastle_banking.customers;

CREATE OR REPLACE VIEW public."kastle_banking.branches" AS 
SELECT * FROM kastle_banking.branches;

CREATE OR REPLACE VIEW public."kastle_banking.loan_accounts" AS 
SELECT * FROM kastle_banking.loan_accounts;

CREATE OR REPLACE VIEW public."kastle_banking.account_types" AS 
SELECT * FROM kastle_banking.account_types;

CREATE OR REPLACE VIEW public."kastle_banking.transaction_types" AS 
SELECT * FROM kastle_banking.transaction_types;

CREATE OR REPLACE VIEW public."kastle_banking.product_categories" AS 
SELECT * FROM kastle_banking.product_categories;

CREATE OR REPLACE VIEW public."kastle_banking.products" AS 
SELECT * FROM kastle_banking.products;

CREATE OR REPLACE VIEW public."kastle_banking.customer_addresses" AS 
SELECT * FROM kastle_banking.customer_addresses;

CREATE OR REPLACE VIEW public."kastle_banking.customer_contacts" AS 
SELECT * FROM kastle_banking.customer_contacts;

CREATE OR REPLACE VIEW public."kastle_banking.customer_documents" AS 
SELECT * FROM kastle_banking.customer_documents;

CREATE OR REPLACE VIEW public."kastle_banking.customer_types" AS 
SELECT * FROM kastle_banking.customer_types;

CREATE OR REPLACE VIEW public."kastle_banking.loan_applications" AS 
SELECT * FROM kastle_banking.loan_applications;

CREATE OR REPLACE VIEW public."kastle_banking.collection_buckets" AS 
SELECT * FROM kastle_banking.collection_buckets;

CREATE OR REPLACE VIEW public."kastle_banking.collection_cases" AS 
SELECT * FROM kastle_banking.collection_cases;

CREATE OR REPLACE VIEW public."kastle_banking.countries" AS 
SELECT * FROM kastle_banking.countries;

CREATE OR REPLACE VIEW public."kastle_banking.currencies" AS 
SELECT * FROM kastle_banking.currencies;

CREATE OR REPLACE VIEW public."kastle_banking.bank_config" AS 
SELECT * FROM kastle_banking.bank_config;

CREATE OR REPLACE VIEW public."kastle_banking.audit_trail" AS 
SELECT * FROM kastle_banking.audit_trail;

CREATE OR REPLACE VIEW public."kastle_banking.auth_user_profiles" AS 
SELECT * FROM kastle_banking.auth_user_profiles;

CREATE OR REPLACE VIEW public."kastle_banking.realtime_notifications" AS 
SELECT * FROM kastle_banking.realtime_notifications;

-- Grant appropriate permissions on the views
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- OPTION 2: APPLICATION CODE FIX (RECOMMENDED FOR LONG-TERM)
-- Update the application to properly use the kastle_banking schema
-- ============================================================================

-- The application code should be updated as follows:

/*
// File: src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with schema configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'kastle_banking'  // Add this line to specify the schema
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Update table constants to use just table names (without schema prefix)
export const TABLES = {
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  LOAN_ACCOUNTS: 'loan_accounts',
  ACCOUNT_TYPES: 'account_types',
  TRANSACTION_TYPES: 'transaction_types',
  BRANCHES: 'branches',
  CURRENCIES: 'currencies',
  COUNTRIES: 'countries',
  AUDIT_TRAIL: 'audit_trail',
  AUTH_USER_PROFILES: 'auth_user_profiles',
  REALTIME_NOTIFICATIONS: 'realtime_notifications'
};
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after applying the fix to verify everything works
-- ============================================================================

-- Test query 1: Check if views are created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'kastle_banking.%';

-- Test query 2: Check permissions
SELECT grantee, privilege_type, table_name
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name LIKE 'kastle_banking.%'
AND grantee IN ('anon', 'authenticated', 'service_role');

-- Test query 3: Verify data access through views
SELECT COUNT(*) FROM public."kastle_banking.accounts";
SELECT COUNT(*) FROM public."kastle_banking.customers";
SELECT COUNT(*) FROM public."kastle_banking.transactions";