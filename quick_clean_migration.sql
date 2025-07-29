-- QUICK CLEAN MIGRATION
-- Simple script to clean up duplicates and move everything to kastle_banking

-- Drop all duplicates from other schemas (keeping kastle_banking versions)
DROP TABLE IF EXISTS public.collection_officers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_officers CASCADE;
DROP TABLE IF EXISTS public.promise_to_pay CASCADE;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay CASCADE;
DROP TABLE IF EXISTS public.collection_cases CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_teams CASCADE;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics CASCADE;
DROP TABLE IF EXISTS public.collection_interactions CASCADE;
DROP TABLE IF EXISTS public.officer_performance_summary CASCADE;

-- Move collection_interactions and officer_performance_summary from kastle_collection
ALTER TABLE IF EXISTS kastle_collection.collection_interactions SET SCHEMA kastle_banking;
ALTER TABLE IF EXISTS kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;

-- Now run the safe migration to move any other remaining tables
-- This will move all other tables without errors
\i safe_migration.sql