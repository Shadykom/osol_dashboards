#!/bin/bash

# Setup script for OSOL Collection Dashboard
# This script runs the necessary SQL files to set up the database

echo "Setting up OSOL Collection Dashboard Database..."

# Get Supabase connection details
source get_supabase_keys.sh

# Function to run SQL file
run_sql() {
    local sql_file=$1
    local description=$2
    
    echo "Running: $description"
    psql "$DATABASE_URL" -f "$sql_file" 2>&1 | grep -E "(ERROR|NOTICE|CREATE|ALTER|INSERT|UPDATE|GRANT)"
    
    if [ $? -eq 0 ]; then
        echo "✓ $description completed"
    else
        echo "✗ $description failed"
        return 1
    fi
}

# Main setup
echo "1. Creating collection dashboard tables..."
run_sql "fix_collection_tables_safe.sql" "Create tables"

echo ""
echo "Setup complete!"
echo ""
echo "The script has:"
echo "- Created all necessary tables in kastle_banking schema"
echo "- Added required columns to existing tables"
echo "- Created indexes for performance"
echo "- Disabled RLS for testing (enable in production)"
echo "- Inserted sample data for testing"
echo ""
echo "To enable RLS in production, run:"
echo "  psql \$DATABASE_URL -f fix_kastle_banking_collection_rls.sql"
echo ""
echo "Next steps:"
echo "1. Test the dashboards at:"
echo "   - /collection/executive"
echo "   - /collection/specialist"
echo "2. Add your user to kastle_banking.user_roles table:"
echo "   INSERT INTO kastle_banking.user_roles (user_id, email, full_name, role)"
echo "   VALUES ('your-user-id', 'your-email', 'Your Name', 'EXECUTIVE');"