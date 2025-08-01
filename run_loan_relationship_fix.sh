#!/bin/bash

# Script to fix loan_accounts and loan_types relationship
# This resolves the error: "Could not find a relationship between 'loan_accounts' and 'loan_types'"

echo "========================================"
echo "Loan Relationship Fix Script"
echo "========================================"
echo ""

# Get database credentials
if [ -f "get_supabase_keys.sh" ]; then
    echo "Loading database credentials..."
    source ./get_supabase_keys.sh
else
    echo "Error: get_supabase_keys.sh not found"
    echo "Please ensure database credentials are available"
    exit 1
fi

# Check if we have the database URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    echo "Please set the DATABASE_URL environment variable"
    exit 1
fi

echo "Running loan relationship fix..."
echo ""

# Run the SQL fix
psql "$DATABASE_URL" -f fix_loan_relationship_complete.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Loan relationship fix completed successfully!"
    echo ""
    echo "The following has been done:"
    echo "1. Added loan_type_id column to loan_accounts table (if missing)"
    echo "2. Created foreign key constraint to loan_types table"
    echo "3. Set default loan type for existing records"
    echo "4. Created a view 'loan_accounts_with_types' for easier querying"
    echo ""
    echo "You can now query loan accounts with their types using:"
    echo "- Direct join: loan_accounts.loan_type_id -> loan_types.loan_type_id"
    echo "- View: SELECT * FROM kastle_banking.loan_accounts_with_types"
else
    echo ""
    echo "❌ Error running loan relationship fix"
    echo "Please check the error messages above"
    exit 1
fi