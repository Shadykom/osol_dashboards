-- Fix Schema Access Issues for Kastle Banking Application
-- The application is trying to access tables as 'public.kastle_banking.tablename'
-- but they exist as 'kastle_banking.tablename'

-- Option 1: Update the search_path to include kastle_banking schema
ALTER DATABASE postgres SET search_path TO public, kastle_banking, extensions;

-- Option 2: Grant proper permissions to roles
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- Option 3: Create views in public schema that point to kastle_banking tables
-- This is the most compatible solution for your current application setup

-- Drop existing views if they exist
DROP VIEW IF EXISTS public."kastle_banking.accounts" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.transactions" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.customers" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.branches" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.loan_accounts" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.account_types" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.transaction_types" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.product_categories" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.products" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.customer_addresses" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.customer_contacts" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.customer_documents" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.customer_types" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.loan_applications" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.collection_buckets" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.collection_cases" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.countries" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.currencies" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.bank_config" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.audit_trail" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.auth_user_profiles" CASCADE;
DROP VIEW IF EXISTS public."kastle_banking.realtime_notifications" CASCADE;

-- Create views in public schema with the expected naming pattern
CREATE VIEW public."kastle_banking.accounts" AS SELECT * FROM kastle_banking.accounts;
CREATE VIEW public."kastle_banking.transactions" AS SELECT * FROM kastle_banking.transactions;
CREATE VIEW public."kastle_banking.customers" AS SELECT * FROM kastle_banking.customers;
CREATE VIEW public."kastle_banking.branches" AS SELECT * FROM kastle_banking.branches;
CREATE VIEW public."kastle_banking.loan_accounts" AS SELECT * FROM kastle_banking.loan_accounts;
CREATE VIEW public."kastle_banking.account_types" AS SELECT * FROM kastle_banking.account_types;
CREATE VIEW public."kastle_banking.transaction_types" AS SELECT * FROM kastle_banking.transaction_types;
CREATE VIEW public."kastle_banking.product_categories" AS SELECT * FROM kastle_banking.product_categories;
CREATE VIEW public."kastle_banking.products" AS SELECT * FROM kastle_banking.products;
CREATE VIEW public."kastle_banking.customer_addresses" AS SELECT * FROM kastle_banking.customer_addresses;
CREATE VIEW public."kastle_banking.customer_contacts" AS SELECT * FROM kastle_banking.customer_contacts;
CREATE VIEW public."kastle_banking.customer_documents" AS SELECT * FROM kastle_banking.customer_documents;
CREATE VIEW public."kastle_banking.customer_types" AS SELECT * FROM kastle_banking.customer_types;
CREATE VIEW public."kastle_banking.loan_applications" AS SELECT * FROM kastle_banking.loan_applications;
CREATE VIEW public."kastle_banking.collection_buckets" AS SELECT * FROM kastle_banking.collection_buckets;
CREATE VIEW public."kastle_banking.collection_cases" AS SELECT * FROM kastle_banking.collection_cases;
CREATE VIEW public."kastle_banking.countries" AS SELECT * FROM kastle_banking.countries;
CREATE VIEW public."kastle_banking.currencies" AS SELECT * FROM kastle_banking.currencies;
CREATE VIEW public."kastle_banking.bank_config" AS SELECT * FROM kastle_banking.bank_config;
CREATE VIEW public."kastle_banking.audit_trail" AS SELECT * FROM kastle_banking.audit_trail;
CREATE VIEW public."kastle_banking.auth_user_profiles" AS SELECT * FROM kastle_banking.auth_user_profiles;
CREATE VIEW public."kastle_banking.realtime_notifications" AS SELECT * FROM kastle_banking.realtime_notifications;

-- Grant permissions on the views
GRANT SELECT ON public."kastle_banking.accounts" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.transactions" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.customers" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.branches" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.loan_accounts" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.account_types" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.transaction_types" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.product_categories" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.products" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.customer_addresses" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.customer_contacts" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.customer_documents" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.customer_types" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.loan_applications" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.collection_buckets" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.collection_cases" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.countries" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.currencies" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.bank_config" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.audit_trail" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.auth_user_profiles" TO anon, authenticated, service_role;
GRANT SELECT ON public."kastle_banking.realtime_notifications" TO anon, authenticated, service_role;

-- Grant INSERT, UPDATE, DELETE permissions where appropriate
GRANT INSERT, UPDATE, DELETE ON public."kastle_banking.transactions" TO authenticated;
GRANT INSERT, UPDATE ON public."kastle_banking.customers" TO authenticated;
GRANT UPDATE ON public."kastle_banking.accounts" TO authenticated;
GRANT INSERT, UPDATE ON public."kastle_banking.realtime_notifications" TO authenticated;

-- Alternative Option 4: Update your application code
-- Instead of using SQL fixes, you should update your Supabase client configuration
-- to properly reference the kastle_banking schema:
-- 
-- In your application code, update the table references from:
-- 'kastle_banking.accounts' to just 'accounts'
-- 
-- And set the schema in your Supabase client:
-- const supabase = createClient(url, key, {
--   db: {
--     schema: 'kastle_banking'
--   }
-- })