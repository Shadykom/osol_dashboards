-- Fix Realtime Subscription Errors
-- Enable realtime for collection tables in kastle_banking schema

-- Enable realtime for branch_collection_performance table
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;

-- Enable realtime for collection_cases table  
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.collection_cases;

-- Enable realtime for other collection tables as well
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.collection_officers;
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.collection_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.collection_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.promise_to_pay;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'kastle_banking'
AND tablename IN (
    'branch_collection_performance',
    'collection_cases',
    'collection_officers', 
    'collection_teams',
    'collection_interactions',
    'promise_to_pay'
)
ORDER BY schemaname, tablename;