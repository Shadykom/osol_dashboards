#!/bin/bash

# Script to fix reports page errors (Unified Schema Version)

echo "🔧 Fixing Reports Page Database Errors (Unified Schema)..."
echo "======================================================="

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
echo "🚀 Running fix_reports_errors_unified_schema.sql..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f fix_reports_errors_unified_schema.sql

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Reports fix applied successfully!"
    echo ""
    echo "📝 Changes made:"
    echo "   - Created collection tables in kastle_banking schema:"
    echo "     • collection_cases"
    echo "     • daily_collection_summary" 
    echo "     • collection_contact_attempts"
    echo "     • collection_risk_assessment"
    echo "     • collection_settlement_offers"
    echo "     • collection_officers"
    echo "     • audit_log (if not exists)"
    echo "   - Created report_schedules table"
    echo "   - Created transactions_view to map 'amount' column"
    echo "   - Added necessary indexes and permissions"
    echo ""
    echo "✨ All tables are now in the kastle_banking schema"
    echo ""
    echo "🔄 Please refresh your application to see the changes."
else
    echo ""
    echo "❌ Error applying reports fix. Please check the error messages above."
fi

# Clean up
unset PGPASSWORD