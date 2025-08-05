-- Export all schema information for branch report tables
-- This single query will show all columns from all relevant tables

SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.columns c
WHERE c.table_schema = 'kastle_banking' 
AND c.table_name IN (
    'branches',
    'branch_collection_performance',
    'collection_officers', 
    'collection_teams',
    'officer_performance_summary'
)
ORDER BY 
    CASE c.table_name
        WHEN 'branches' THEN 1
        WHEN 'branch_collection_performance' THEN 2
        WHEN 'collection_teams' THEN 3
        WHEN 'collection_officers' THEN 4
        WHEN 'officer_performance_summary' THEN 5
    END,
    c.ordinal_position;