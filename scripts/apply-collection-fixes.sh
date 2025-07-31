#!/bin/bash

echo "🚀 Applying Collection Schema Fixes..."
echo "===================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Supabase URL and key are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase configuration not found in .env"
    exit 1
fi

echo "📍 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Function to execute SQL via Supabase API
execute_sql() {
    local sql_file=$1
    local sql_content=$(cat "$sql_file")
    
    echo "📄 Executing $sql_file..."
    
    # Use psql if available
    if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
        echo "   Using psql..."
        psql "$DATABASE_URL" -f "$sql_file"
    else
        echo "   Using Supabase SQL editor endpoint..."
        echo "   ⚠️  Note: This requires manual execution in Supabase SQL editor"
        echo "   📋 Copy the contents of $sql_file and run in:"
        echo "      $VITE_SUPABASE_URL/project/default/sql"
    fi
}

# Step 1: Apply collection schema fixes
if [ -f "fix_collection_schema.sql" ]; then
    execute_sql "fix_collection_schema.sql"
else
    echo "❌ fix_collection_schema.sql not found"
fi

echo ""

# Step 2: Apply foreign key fixes
if [ -f "fix_collection_foreign_keys.sql" ]; then
    execute_sql "fix_collection_foreign_keys.sql"
else
    echo "❌ fix_collection_foreign_keys.sql not found"
fi

echo ""

# Step 3: Fix table references in code
echo "📝 Fixing table references in code..."
if [ -f "scripts/fix-table-references.js" ]; then
    node scripts/fix-table-references.js
else
    echo "❌ scripts/fix-table-references.js not found"
fi

echo ""
echo "===================================="
echo "✅ Collection fixes applied!"
echo ""
echo "📋 Next steps:"
echo "1. If using manual SQL execution, run the SQL files in Supabase SQL editor"
echo "2. Restart your development server"
echo "3. Clear your browser cache"
echo "4. Test the collection pages"
echo ""
echo "🔗 Supabase SQL Editor: $VITE_SUPABASE_URL/project/default/sql"