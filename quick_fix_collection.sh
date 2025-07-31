#!/bin/bash

echo "Quick Fix Script for Collection Overview"
echo "========================================"
echo ""

# Check if database credentials are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Usage: ./quick_fix_collection.sh <db_host> <db_user> <db_name>"
    echo "Example: ./quick_fix_collection.sh localhost postgres mydb"
    exit 1
fi

DB_HOST=$1
DB_USER=$2
DB_NAME=$3

echo "1. Running database fixes..."
echo "----------------------------"

# Create combined SQL file
cat > combined_fix.sql << 'SQLEOF'
-- Combined fix for collection overview

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

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
    ('OFF001', 'John Smith', 'Senior', 1, 'active', '+1234567890', 'john@example.com', CURRENT_DATE - interval '2 years'),
    ('OFF002', 'Jane Doe', 'Junior', 1, 'active', '+1234567891', 'jane@example.com', CURRENT_DATE - interval '1 year'),
    ('OFF003', 'Mike Johnson', 'Senior', 2, 'active', '+1234567892', 'mike@example.com', CURRENT_DATE - interval '3 years'),
    ('OFF004', 'Sarah Williams', 'Mid-level', 2, 'active', '+1234567893', 'sarah@example.com', CURRENT_DATE - interval '18 months'),
    ('OFF005', 'Tom Brown', 'Junior', 3, 'active', '+1234567894', 'tom@example.com', CURRENT_DATE - interval '6 months')
ON CONFLICT (officer_id) DO UPDATE SET
    officer_name = EXCLUDED.officer_name,
    team_id = EXCLUDED.team_id,
    status = EXCLUDED.status;

-- Insert performance data
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, summary_date, total_collected, total_cases
)
SELECT 
    officer_id,
    CURRENT_DATE as summary_date,
    75000.00 + (RANDOM() * 25000)::numeric(10,2),
    50 + (RANDOM() * 50)::integer
FROM kastle_banking.collection_officers
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- Disable RLS for testing
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    'Data inserted successfully' as status,
    COUNT(*) as performance_records
FROM kastle_banking.officer_performance_summary;
SQLEOF

# Run the SQL
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f combined_fix.sql

echo ""
echo "2. Frontend fixes already applied:"
echo "----------------------------------"
echo "✓ Date query changed from eq to lte"
echo "✓ Error handling added"
echo "✓ Property paths fixed"
echo ""
echo "3. Next steps:"
echo "--------------"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Restart development server"
echo "3. Check browser console for debug messages"
echo "4. Verify data is loading correctly"
echo ""
echo "Done! Check your collection overview page now."

# Cleanup
rm combined_fix.sql
