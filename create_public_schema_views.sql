-- Create views in public schema for all kastle_banking tables
-- This is a workaround for when kastle_banking schema is not exposed through Supabase API

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.collection_officers CASCADE;
DROP VIEW IF EXISTS public.collection_teams CASCADE;
DROP VIEW IF EXISTS public.collection_cases CASCADE;
DROP VIEW IF EXISTS public.customers CASCADE;
DROP VIEW IF EXISTS public.accounts CASCADE;
DROP VIEW IF EXISTS public.branches CASCADE;
DROP VIEW IF EXISTS public.loan_accounts CASCADE;
DROP VIEW IF EXISTS public.transactions CASCADE;
DROP VIEW IF EXISTS public.delinquencies CASCADE;
DROP VIEW IF EXISTS public.collection_interactions CASCADE;
DROP VIEW IF EXISTS public.call_attempts CASCADE;
DROP VIEW IF EXISTS public.promise_to_pay CASCADE;
DROP VIEW IF EXISTS public.legal_cases CASCADE;
DROP VIEW IF EXISTS public.field_visits CASCADE;
DROP VIEW IF EXISTS public.digital_collection_attempts CASCADE;
DROP VIEW IF EXISTS public.collection_scores CASCADE;
DROP VIEW IF EXISTS public.collection_strategies CASCADE;
DROP VIEW IF EXISTS public.daily_collection_summary CASCADE;
DROP VIEW IF EXISTS public.officer_performance_metrics CASCADE;
DROP VIEW IF EXISTS public.officer_performance_summary CASCADE;
DROP VIEW IF EXISTS public.case_bucket_history CASCADE;
DROP VIEW IF EXISTS public.collection_buckets CASCADE;
DROP VIEW IF EXISTS public.collection_rates CASCADE;
DROP VIEW IF EXISTS public.products CASCADE;
DROP VIEW IF EXISTS public.product_categories CASCADE;
DROP VIEW IF EXISTS public.currencies CASCADE;
DROP VIEW IF EXISTS public.countries CASCADE;
DROP VIEW IF EXISTS public.customer_types CASCADE;
DROP VIEW IF EXISTS public.audit_trail CASCADE;
DROP VIEW IF EXISTS public.auth_user_profiles CASCADE;
DROP VIEW IF EXISTS public.system_performance CASCADE;
DROP VIEW IF EXISTS public.hardship_applications CASCADE;

-- Create views for all kastle_banking tables

-- Core banking tables
CREATE OR REPLACE VIEW public.customers AS
SELECT * FROM kastle_banking.customers;

CREATE OR REPLACE VIEW public.accounts AS
SELECT * FROM kastle_banking.accounts;

CREATE OR REPLACE VIEW public.branches AS
SELECT * FROM kastle_banking.branches;

CREATE OR REPLACE VIEW public.loan_accounts AS
SELECT * FROM kastle_banking.loan_accounts;

CREATE OR REPLACE VIEW public.transactions AS
SELECT * FROM kastle_banking.transactions;

CREATE OR REPLACE VIEW public.products AS
SELECT * FROM kastle_banking.products;

CREATE OR REPLACE VIEW public.product_categories AS
SELECT * FROM kastle_banking.product_categories;

CREATE OR REPLACE VIEW public.currencies AS
SELECT * FROM kastle_banking.currencies;

CREATE OR REPLACE VIEW public.countries AS
SELECT * FROM kastle_banking.countries;

CREATE OR REPLACE VIEW public.customer_types AS
SELECT * FROM kastle_banking.customer_types;

-- Collection-specific tables
CREATE OR REPLACE VIEW public.collection_officers AS
SELECT * FROM kastle_banking.collection_officers;

CREATE OR REPLACE VIEW public.collection_teams AS
SELECT * FROM kastle_banking.collection_teams;

CREATE OR REPLACE VIEW public.collection_cases AS
SELECT * FROM kastle_banking.collection_cases;

CREATE OR REPLACE VIEW public.collection_interactions AS
SELECT * FROM kastle_banking.collection_interactions;

CREATE OR REPLACE VIEW public.call_attempts AS
SELECT * FROM kastle_banking.call_attempts;

CREATE OR REPLACE VIEW public.promise_to_pay AS
SELECT * FROM kastle_banking.promise_to_pay;

CREATE OR REPLACE VIEW public.legal_cases AS
SELECT * FROM kastle_banking.legal_cases;

CREATE OR REPLACE VIEW public.field_visits AS
SELECT * FROM kastle_banking.field_visits;

CREATE OR REPLACE VIEW public.digital_collection_attempts AS
SELECT * FROM kastle_banking.digital_collection_attempts;

CREATE OR REPLACE VIEW public.collection_scores AS
SELECT * FROM kastle_banking.collection_scores;

CREATE OR REPLACE VIEW public.collection_strategies AS
SELECT * FROM kastle_banking.collection_strategies;

CREATE OR REPLACE VIEW public.collection_buckets AS
SELECT * FROM kastle_banking.collection_buckets;

CREATE OR REPLACE VIEW public.collection_rates AS
SELECT * FROM kastle_banking.collection_rates;

CREATE OR REPLACE VIEW public.delinquencies AS
SELECT * FROM kastle_banking.delinquencies;

-- Performance and summary tables
CREATE OR REPLACE VIEW public.daily_collection_summary AS
SELECT * FROM kastle_banking.daily_collection_summary;

CREATE OR REPLACE VIEW public.officer_performance_metrics AS
SELECT * FROM kastle_banking.officer_performance_metrics;

CREATE OR REPLACE VIEW public.officer_performance_summary AS
SELECT * FROM kastle_banking.officer_performance_summary;

CREATE OR REPLACE VIEW public.case_bucket_history AS
SELECT * FROM kastle_banking.case_bucket_history;

CREATE OR REPLACE VIEW public.system_performance AS
SELECT * FROM kastle_banking.system_performance;

CREATE OR REPLACE VIEW public.hardship_applications AS
SELECT * FROM kastle_banking.hardship_applications;

-- Audit and auth tables
CREATE OR REPLACE VIEW public.audit_trail AS
SELECT * FROM kastle_banking.audit_trail;

CREATE OR REPLACE VIEW public.auth_user_profiles AS
SELECT * FROM kastle_banking.auth_user_profiles;

-- Grant permissions on all views to anon and authenticated roles
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND table_name IN (
            'customers', 'accounts', 'branches', 'loan_accounts', 'transactions',
            'products', 'product_categories', 'currencies', 'countries', 'customer_types',
            'collection_officers', 'collection_teams', 'collection_cases',
            'collection_interactions', 'call_attempts', 'promise_to_pay',
            'legal_cases', 'field_visits', 'digital_collection_attempts',
            'collection_scores', 'collection_strategies', 'collection_buckets',
            'collection_rates', 'delinquencies', 'daily_collection_summary',
            'officer_performance_metrics', 'officer_performance_summary',
            'case_bucket_history', 'system_performance', 'hardship_applications',
            'audit_trail', 'auth_user_profiles'
        )
    LOOP
        EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', view_name);
        RAISE NOTICE 'Granted SELECT on public.% to anon, authenticated', view_name;
    END LOOP;
END $$;

-- Test the views
SELECT 'collection_officers' as table_name, COUNT(*) as row_count FROM public.collection_officers
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'accounts', COUNT(*) FROM public.accounts
UNION ALL
SELECT 'branches', COUNT(*) FROM public.branches
UNION ALL
SELECT 'loan_accounts', COUNT(*) FROM public.loan_accounts;