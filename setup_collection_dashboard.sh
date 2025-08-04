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
    psql "$DATABASE_URL" -f "$sql_file" 2>&1 | grep -E "(ERROR|NOTICE|CREATE|ALTER|INSERT|UPDATE)"
    
    if [ $? -eq 0 ]; then
        echo "✓ $description completed"
    else
        echo "✗ $description failed"
        return 1
    fi
}

# Main setup
echo "1. Extending kastle_banking schema..."
run_sql "extend_kastle_banking_collection_schema.sql" "Schema extension"

echo ""
echo "2. Disabling RLS for testing (temporary)..."
run_sql "disable_collection_rls_temporary.sql" "Disable RLS"

echo ""
echo "Setup complete!"
echo ""
echo "To enable RLS in production, run:"
echo "  psql \$DATABASE_URL -f fix_kastle_banking_collection_rls.sql"
echo ""
echo "Next steps:"
echo "1. Insert test data into the collection tables"
echo "2. Add user roles to kastle_banking.user_roles table"
echo "3. Test the dashboards at:"
echo "   - /executive-collection-dashboard"
echo "   - /specialist-collection-dashboard"