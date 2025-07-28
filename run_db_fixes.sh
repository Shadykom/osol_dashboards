#!/bin/bash

# Database connection string
DB_URL="postgresql://postgres:OSOL1a159753@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"

echo "Applying database fixes for collection overview dashboard..."

# Install psql if not available
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL client..."
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

# Apply the fixes
echo "Running SQL fixes..."
psql "$DB_URL" < fix_collection_overview.sql

echo "Database fixes completed!"
echo ""
echo "Summary of fixes applied:"
echo "1. Created collection_cases table in kastle_banking schema"
echo "2. Created collection_buckets table with default buckets"
echo "3. Fixed data type issues in loan_accounts table"
echo "4. Added missing columns to officer_performance_metrics"
echo "5. Created sample collection cases from overdue loans"
echo "6. Granted necessary permissions and enabled RLS"
echo ""
echo "Please refresh your dashboard to see the changes."