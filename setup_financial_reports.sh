#!/bin/bash

echo "Setting up financial report views..."

# Database connection string
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/osol_db}"

# Execute the SQL file
psql "$DB_URL" -f create_financial_report_views.sql

if [ $? -eq 0 ]; then
    echo "✅ Financial report views created successfully!"
    echo ""
    echo "The following views have been created:"
    echo "- balance_sheet_view: For Balance Sheet reports"
    echo "- cash_flow_view: For Cash Flow Statement reports"
    echo ""
    echo "Sample data has also been inserted for testing."
else
    echo "❌ Error creating financial report views"
    exit 1
fi