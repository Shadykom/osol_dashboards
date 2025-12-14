-- =============================================================================
-- EPIC 5: Verify Installation Script
-- =============================================================================
-- Run this script to verify that EPIC 5 schemas and tables were created
-- =============================================================================

-- Check if schemas exist
SELECT '1. SCHEMAS' as check_item;
SELECT schema_name, 
       CASE WHEN schema_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.schemata 
WHERE schema_name IN ('mdm', 'integration');

-- Check MDM tables
SELECT '2. MDM TABLES' as check_item;
SELECT table_name, 
       '✅ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'mdm' 
ORDER BY table_name;

-- Check Integration tables
SELECT '3. INTEGRATION TABLES' as check_item;
SELECT table_name, 
       '✅ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'integration' 
ORDER BY table_name;

-- Check RLS is enabled on MDM tables
SELECT '4. MDM RLS STATUS' as check_item;
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'mdm'
ORDER BY tablename;

-- Check RLS is enabled on Integration tables
SELECT '5. INTEGRATION RLS STATUS' as check_item;
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'integration'
ORDER BY tablename;

-- Check if tenants exist (needed for seeding)
SELECT '6. TENANTS CHECK' as check_item;
SELECT 'platform.tenants' as source, COUNT(*) as tenant_count FROM platform.tenants
UNION ALL
SELECT 'public.tenants (if exists)', 
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
           THEN (SELECT COUNT(*)::bigint FROM public.tenants)
           ELSE 0
       END;

-- Summary
SELECT '7. SUMMARY' as check_item;
SELECT 
    (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('mdm', 'integration')) as schemas_count,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'mdm') as mdm_tables_count,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'integration') as integration_tables_count;
