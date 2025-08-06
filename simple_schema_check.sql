-- Simple Schema Check for Branch Report
-- Copy and run each section one by one if needed

-- Section 1: Check branches table
\d kastle_banking.branches

-- Section 2: Check branch_collection_performance table  
\d kastle_banking.branch_collection_performance

-- Section 3: Check collection_officers table
\d kastle_banking.collection_officers

-- Section 4: Check collection_teams table
\d kastle_banking.collection_teams

-- Section 5: Check officer_performance_summary table
\d kastle_banking.officer_performance_summary

-- Section 6: List all columns in a simple format
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'branches'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'branch_collection_performance'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_officers'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'officer_performance_summary'
ORDER BY ordinal_position;