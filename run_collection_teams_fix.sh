#!/bin/bash

# Script to fix missing branch_id column in collection_teams table

echo "========================================="
echo "Fixing collection_teams branch_id column"
echo "========================================="

# Get Supabase credentials
source ./get_supabase_keys.sh

# Check if we have the necessary environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL not set"
    echo "Please run: source ./get_supabase_keys.sh"
    exit 1
fi

echo "Connecting to database..."
echo "Running fix_collection_teams_branch_id.sql..."

# Run the SQL script
psql "$SUPABASE_DB_URL" -f fix_collection_teams_branch_id.sql

if [ $? -eq 0 ]; then
    echo "✅ Successfully fixed collection_teams table!"
    echo ""
    echo "The following changes were made:"
    echo "1. Added branch_id column to collection_teams table"
    echo "2. Added foreign key constraint to branches table"
    echo "3. Added is_active column if it didn't exist"
    echo "4. Created index on branch_id for performance"
else
    echo "❌ Error occurred while running the fix"
    exit 1
fi

echo ""
echo "========================================="
echo "Fix completed!"
echo "========================================="