#!/bin/bash

# Script to fix reports page errors

echo "🔧 Fixing Reports Page Database Errors..."
echo "========================================"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Get database credentials
DB_HOST="aws-0-eu-central-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.bzlenegoilnswsbanxgb"

echo "📋 Database connection details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Prompt for password
echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Run the fix script
echo ""
echo "🚀 Running fix_reports_errors.sql..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f fix_reports_errors.sql

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Reports fix applied successfully!"
    echo ""
    echo "📝 Changes made:"
    echo "   - Created kastle_collection schema"
    echo "   - Created collection tables (collection_cases, daily_collection_summary, etc.)"
    echo "   - Created report_schedules table in kastle_banking schema"
    echo "   - Created transactions_view to map 'amount' column"
    echo "   - Added necessary indexes and permissions"
    echo ""
    echo "🔄 Please refresh your application to see the changes."
else
    echo ""
    echo "❌ Error applying reports fix. Please check the error messages above."
fi

# Clean up
unset PGPASSWORD