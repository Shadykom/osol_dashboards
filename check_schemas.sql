-- Check all tables in public schema
SELECT 'PUBLIC SCHEMA:' as schema_info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all tables in kastle_collection schema
SELECT '' as empty_line;
SELECT 'KASTLE_COLLECTION SCHEMA:' as schema_info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kastle_collection' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all tables in kastle_banking schema  
SELECT '' as empty_line;
SELECT 'KASTLE_BANKING SCHEMA:' as schema_info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kastle_banking' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Count tables in each schema
SELECT '' as empty_line;
SELECT 'SUMMARY:' as summary_info;
SELECT 
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;