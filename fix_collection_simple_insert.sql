-- Simple insert script with proper type casting

-- Insert teams
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type) 
VALUES 
    (1, 'Alpha Collection Team', 'Field'),
    (2, 'Beta Collection Team', 'Call Center'),
    (3, 'Gamma Collection Team', 'Digital')
ON CONFLICT (team_id) DO NOTHING;

-- Insert officers
INSERT INTO kastle_banking.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    status, contact_number, email, joining_date
)
VALUES 
    ('OFF001', 'John Smith', 'Senior', 1, 'active', '+1234567890', 'john.smith@example.com', CURRENT_DATE - interval '2 years'),
    ('OFF002', 'Jane Doe', 'Junior', 1, 'active', '+1234567891', 'jane.doe@example.com', CURRENT_DATE - interval '1 year'),
    ('OFF003', 'Mike Johnson', 'Senior', 2, 'active', '+1234567892', 'mike.johnson@example.com', CURRENT_DATE - interval '3 years'),
    ('OFF004', 'Sarah Williams', 'Mid-level', 2, 'active', '+1234567893', 'sarah.williams@example.com', CURRENT_DATE - interval '18 months'),
    ('OFF005', 'Tom Brown', 'Junior', 3, 'active', '+1234567894', 'tom.brown@example.com', CURRENT_DATE - interval '6 months')
ON CONFLICT (officer_id) DO UPDATE SET
    officer_name = EXCLUDED.officer_name,
    team_id = EXCLUDED.team_id,
    status = EXCLUDED.status;

-- Insert performance data with explicit values
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, 
    summary_date, 
    total_cases,
    total_portfolio_value,
    total_collected,
    collection_rate,
    total_calls,
    total_messages,
    successful_contacts,
    contact_rate,
    total_ptps,
    ptps_kept,
    ptp_keep_rate,
    avg_response_time
)
VALUES
    -- Current date data
    ('OFF001', CURRENT_DATE, 85, 850000.00, 75000.00, 88.24, 180, 75, 120, 66.67, 35, 28, 80.00, 45.5),
    ('OFF002', CURRENT_DATE, 72, 720000.00, 62000.00, 86.11, 160, 65, 105, 65.63, 30, 24, 80.00, 42.3),
    ('OFF003', CURRENT_DATE, 95, 950000.00, 85000.00, 89.47, 200, 85, 135, 67.50, 40, 32, 80.00, 48.2),
    ('OFF004', CURRENT_DATE, 78, 780000.00, 68000.00, 87.18, 170, 70, 115, 67.65, 33, 26, 78.79, 44.7),
    ('OFF005', CURRENT_DATE, 65, 650000.00, 55000.00, 84.62, 150, 60, 95, 63.33, 28, 22, 78.57, 40.8),
    
    -- Last day of current month
    ('OFF001', date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day', 90, 900000.00, 80000.00, 88.89, 190, 80, 130, 68.42, 38, 30, 78.95, 46.2),
    ('OFF002', date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day', 75, 750000.00, 65000.00, 86.67, 165, 68, 110, 66.67, 32, 25, 78.13, 43.1),
    ('OFF003', date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day', 98, 980000.00, 88000.00, 89.80, 205, 88, 140, 68.29, 42, 34, 80.95, 49.0),
    ('OFF004', date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day', 80, 800000.00, 70000.00, 87.50, 175, 72, 118, 67.43, 35, 28, 80.00, 45.3),
    ('OFF005', date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day', 68, 680000.00, 58000.00, 85.29, 155, 62, 98, 63.23, 30, 23, 76.67, 41.5),
    
    -- Last day of previous month
    ('OFF001', date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day', 82, 820000.00, 72000.00, 87.80, 175, 72, 118, 67.43, 34, 27, 79.41, 44.8),
    ('OFF002', date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day', 70, 700000.00, 60000.00, 85.71, 158, 63, 102, 64.56, 29, 23, 79.31, 41.9),
    ('OFF003', date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day', 92, 920000.00, 82000.00, 89.13, 195, 82, 132, 67.69, 39, 31, 79.49, 47.5),
    ('OFF004', date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day', 76, 760000.00, 66000.00, 86.84, 168, 69, 112, 66.67, 32, 25, 78.13, 44.1),
    ('OFF005', date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day', 63, 630000.00, 53000.00, 84.13, 148, 58, 92, 62.16, 27, 21, 77.78, 40.2)
ON CONFLICT DO NOTHING;

-- Grant permissions and disable RLS
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT 
    'Data inserted successfully' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT officer_id) as unique_officers,
    COUNT(DISTINCT summary_date) as unique_dates,
    MIN(summary_date) as earliest_date,
    MAX(summary_date) as latest_date
FROM kastle_banking.officer_performance_summary;
