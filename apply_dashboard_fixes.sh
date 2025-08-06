#!/bin/bash

# Apply Dashboard Fixes Script
# This script applies the SQL fixes for dashboard errors

echo "🔧 Applying Dashboard Error Fixes..."
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env"
    exit 1
fi

# Extract project ref from Supabase URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p')

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: Could not extract project reference from Supabase URL"
    exit 1
fi

echo "📊 Project Reference: $PROJECT_REF"
echo "🔗 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo "🔄 $description..."
    
    # Use curl to execute SQL via Supabase REST API
    response=$(curl -s -X POST \
        "${VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${VITE_SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${VITE_SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(cat "$sql_file" | jq -Rs .)}")
    
    if [ $? -eq 0 ]; then
        echo "✅ $description completed"
    else
        echo "❌ $description failed"
        echo "Response: $response"
    fi
    echo ""
}

# Alternative: Use psql if available
if command -v psql &> /dev/null; then
    echo "🐘 Using psql to apply fixes..."
    
    # Get database connection string
    DB_URL="postgresql://postgres.${PROJECT_REF}:${VITE_SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    
    # Execute the SQL file
    PGPASSWORD="${VITE_SUPABASE_SERVICE_ROLE_KEY}" psql "$DB_URL" -f fix_dashboard_errors.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Dashboard fixes applied successfully!"
    else
        echo "❌ Failed to apply dashboard fixes"
        exit 1
    fi
else
    echo "⚠️  psql not found. Please install PostgreSQL client tools."
    echo ""
    echo "You can install it with:"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  - macOS: brew install postgresql"
    echo "  - Or run the SQL file directly in Supabase SQL Editor"
    echo ""
    echo "📋 SQL file to run: fix_dashboard_errors.sql"
fi

echo ""
echo "🎉 Dashboard error fixes process completed!"
echo ""
echo "📝 Next steps:"
echo "1. Refresh your dashboard to see if errors are resolved"
echo "2. Check the browser console for any remaining errors"
echo "3. If issues persist, check the Supabase logs"

# Make the script executable
chmod +x apply_dashboard_fixes.sh