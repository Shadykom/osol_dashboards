-- Comprehensive fix for Supabase schema setup
-- This ensures all tables are accessible via the API

-- 1. Create or update RLS policies for API access
-- Enable RLS but allow authenticated users to access data

-- For collection_teams
ALTER TABLE kastle_banking.collection_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access" ON kastle_banking.collection_teams;
CREATE POLICY "Allow authenticated read access" ON kastle_banking.collection_teams
    FOR SELECT TO authenticated USING (true);

-- For collection_officers  
ALTER TABLE kastle_banking.collection_officers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access" ON kastle_banking.collection_officers;
CREATE POLICY "Allow authenticated read access" ON kastle_banking.collection_officers
    FOR SELECT TO authenticated USING (true);

-- For officer_performance_summary
ALTER TABLE kastle_banking.officer_performance_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access" ON kastle_banking.officer_performance_summary;
CREATE POLICY "Allow authenticated read access" ON kastle_banking.officer_performance_summary
    FOR SELECT TO authenticated USING (true);

-- 2. Create API-friendly views in public schema (Supabase prefers public schema)
CREATE OR REPLACE VIEW public.collection_teams AS
SELECT * FROM kastle_banking.collection_teams;

CREATE OR REPLACE VIEW public.collection_officers AS
SELECT * FROM kastle_banking.collection_officers;

CREATE OR REPLACE VIEW public.officer_performance_summary AS
SELECT * FROM kastle_banking.officer_performance_summary;

-- 3. Grant permissions on views
GRANT SELECT ON public.collection_teams TO authenticated;
GRANT SELECT ON public.collection_officers TO authenticated;
GRANT SELECT ON public.officer_performance_summary TO authenticated;

-- 4. Create a function to get officer performance with proper joins
CREATE OR REPLACE FUNCTION public.get_officer_performance_data(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    summary_id INTEGER,
    officer_id VARCHAR(50),
    summary_date DATE,
    total_collected NUMERIC,
    total_cases INTEGER,
    collection_officers JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ops.summary_id,
        ops.officer_id,
        ops.summary_date,
        ops.total_collected,
        ops.total_cases,
        jsonb_build_object(
            'officer_name', co.officer_name,
            'officer_type', co.officer_type,
            'team_id', co.team_id,
            'collection_teams', jsonb_build_object(
                'team_name', ct.team_name
            )
        ) as collection_officers
    FROM kastle_banking.officer_performance_summary ops
    LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
    LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
    WHERE ops.summary_date <= p_date
    ORDER BY ops.summary_date DESC, ops.total_collected DESC
    LIMIT 10;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_officer_performance_data TO authenticated;

-- 5. Verify the setup
SELECT 
    'Setup Complete' as status,
    current_database() as database,
    current_user as user,
    now() as timestamp;
