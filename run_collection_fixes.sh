#!/bin/bash

# Script to fix collection database errors
# This addresses all the console errors shown

echo "🚀 Collection Database Fix Script"
echo "================================"

# Check if SQL file exists
if [ ! -f "fix_collection_database_errors.sql" ]; then
    echo "❌ Error: fix_collection_database_errors.sql file not found!"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: No .env file found. Using environment variables."
fi

# Extract Supabase connection details
if [ -n "$DATABASE_URL" ]; then
    # Parse DATABASE_URL
    SUPABASE_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    SUPABASE_DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    SUPABASE_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    SUPABASE_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    SUPABASE_DB=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
    # Use individual environment variables
    SUPABASE_HOST="${SUPABASE_HOST:-db.bzlenegoilnswsbanxgb.supabase.co}"
    SUPABASE_PORT="${SUPABASE_PORT:-5432}"
    SUPABASE_DB="${SUPABASE_DB:-postgres}"
    SUPABASE_USER="${SUPABASE_USER:-postgres}"
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "❌ Error: SUPABASE_DB_PASSWORD not found in environment!"
        echo "Please set it in your .env file or as an environment variable."
        exit 1
    fi
fi

echo "📋 Connection Details:"
echo "  Host: $SUPABASE_HOST"
echo "  Port: $SUPABASE_PORT"
echo "  Database: $SUPABASE_DB"
echo "  User: $SUPABASE_USER"
echo ""

echo "🔄 Executing database fixes..."
echo "  • Adding branch_id to collection_teams"
echo "  • Enabling realtime for required tables"
echo "  • Creating simplified views for complex queries"
echo "  • Setting up proper foreign key relationships"
echo ""

# Execute the SQL script
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "fix_collection_database_errors.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database fixes applied successfully!"
    echo ""
    echo "📝 What was fixed:"
    echo "  • collection_teams.branch_id column added"
    echo "  • Realtime enabled for collection_cases and branch_collection_performance"
    echo "  • Simplified views created to avoid query parsing errors"
    echo "  • Foreign key relationships established"
    echo ""
    echo "🔍 Your application should now work without the console errors!"
else
    echo ""
    echo "❌ Error applying database fixes!"
    echo "Please check the error messages above."
    exit 1
fi