-- ACTION PLAN FOR YOUR SPECIFIC DUPLICATE TABLES
-- Based on your duplicate analysis results

-- ================================================
-- STEP 1: ANALYZE DATA IN DUPLICATE TABLES
-- ================================================
-- Run these queries to understand which version has the most data

-- Tables in ALL THREE schemas:
\echo 'Checking collection_officers across all schemas:'
SELECT 'kastle_banking' as schema, COUNT(*) as rows FROM kastle_banking.collection_officers
UNION ALL
SELECT 'kastle_collection', COUNT(*) FROM kastle_collection.collection_officers
UNION ALL
SELECT 'public', COUNT(*) FROM public.collection_officers
ORDER BY rows DESC;

\echo ''
\echo 'Checking promise_to_pay across all schemas:'
SELECT 'kastle_banking' as schema, COUNT(*) as rows FROM kastle_banking.promise_to_pay
UNION ALL
SELECT 'kastle_collection', COUNT(*) FROM kastle_collection.promise_to_pay
UNION ALL
SELECT 'public', COUNT(*) FROM public.promise_to_pay
ORDER BY rows DESC;

-- Tables in TWO schemas:
\echo ''
\echo 'Checking other duplicate tables:'
SELECT 'collection_cases' as table_name, 'kastle_banking' as schema, COUNT(*) as rows FROM kastle_banking.collection_cases
UNION ALL
SELECT 'collection_cases', 'public', COUNT(*) FROM public.collection_cases
UNION ALL
SELECT 'collection_interactions', 'kastle_collection', COUNT(*) FROM kastle_collection.collection_interactions
UNION ALL
SELECT 'collection_interactions', 'public', COUNT(*) FROM public.collection_interactions
UNION ALL
SELECT 'collection_teams', 'kastle_banking', COUNT(*) FROM kastle_banking.collection_teams
UNION ALL
SELECT 'collection_teams', 'kastle_collection', COUNT(*) FROM kastle_collection.collection_teams
UNION ALL
SELECT 'customers', 'kastle_banking', COUNT(*) FROM kastle_banking.customers
UNION ALL
SELECT 'customers', 'public', COUNT(*) FROM public.customers
UNION ALL
SELECT 'officer_performance_metrics', 'kastle_banking', COUNT(*) FROM kastle_banking.officer_performance_metrics
UNION ALL
SELECT 'officer_performance_metrics', 'kastle_collection', COUNT(*) FROM kastle_collection.officer_performance_metrics
UNION ALL
SELECT 'officer_performance_summary', 'kastle_collection', COUNT(*) FROM kastle_collection.officer_performance_summary
UNION ALL
SELECT 'officer_performance_summary', 'public', COUNT(*) FROM public.officer_performance_summary
ORDER BY table_name, rows DESC;

-- ================================================
-- STEP 2: CONSOLIDATION COMMANDS
-- ================================================
-- Choose ONE of these options based on your data analysis

\echo ''
\echo '================================================'
\echo 'OPTION 1: KEEP ONLY KASTLE_BANKING VERSION'
\echo '(Use if kastle_banking has the complete data)'
\echo '================================================'

-- Drop all duplicates from other schemas
DROP TABLE IF EXISTS public.collection_officers;
DROP TABLE IF EXISTS kastle_collection.collection_officers;
DROP TABLE IF EXISTS public.promise_to_pay;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay;
DROP TABLE IF EXISTS public.collection_cases;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS kastle_collection.collection_teams;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics;

-- Move tables that don't exist in kastle_banking yet
ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;

-- Clean up any remaining duplicates
DROP TABLE IF EXISTS public.collection_interactions;
DROP TABLE IF EXISTS public.officer_performance_summary;

\echo ''
\echo '================================================'
\echo 'OPTION 2: BACKUP AND MERGE DATA'
\echo '(Use if different schemas have different data)'
\echo '================================================'

-- First, rename duplicates to preserve data
ALTER TABLE public.collection_officers RENAME TO collection_officers_backup_public;
ALTER TABLE kastle_collection.collection_officers RENAME TO collection_officers_backup_kastle_collection;
ALTER TABLE public.promise_to_pay RENAME TO promise_to_pay_backup_public;
ALTER TABLE kastle_collection.promise_to_pay RENAME TO promise_to_pay_backup_kastle_collection;
ALTER TABLE public.collection_cases RENAME TO collection_cases_backup_public;
ALTER TABLE public.customers RENAME TO customers_backup_public;
ALTER TABLE kastle_collection.collection_teams RENAME TO collection_teams_backup_kastle_collection;
ALTER TABLE kastle_collection.officer_performance_metrics RENAME TO officer_performance_metrics_backup_kastle_collection;

-- Move non-duplicate tables
ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;

-- Clean up remaining duplicates
DROP TABLE IF EXISTS public.collection_interactions;
DROP TABLE IF EXISTS public.officer_performance_summary;

-- Then merge data from backups (example - adjust based on your primary keys):
-- INSERT INTO kastle_banking.collection_officers 
-- SELECT * FROM public.collection_officers_backup_public
-- WHERE id NOT IN (SELECT id FROM kastle_banking.collection_officers);

\echo ''
\echo '================================================'
\echo 'STEP 3: FINAL MIGRATION'
\echo '================================================'

-- After handling duplicates, run this to move any remaining tables:
-- psql "your_connection_string" -f safe_migration.sql

-- Verify final state:
SELECT 
    table_schema,
    COUNT(*) as table_count,
    string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;