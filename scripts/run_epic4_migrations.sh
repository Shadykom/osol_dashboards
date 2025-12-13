#!/bin/bash
# EPIC 4: Audit, Evidence, Lineage - Migration Runner
# This script runs all migrations for the audit, evidence, and lineage system

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     EPIC 4: Audit, Evidence, Lineage - Migration Runner      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we have the required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    echo "   Please set these environment variables or run migrations manually"
    echo ""
    echo "   To run manually, connect to your Supabase SQL Editor and execute:"
    echo "   1. scripts/migrations/001_create_audit_schema.sql"
    echo "   2. scripts/migrations/002_create_lineage_schema.sql"
    echo "   3. scripts/migrations/003_create_rpc_functions.sql"
    echo ""
    exit 1
fi

# Directory containing migrations
MIGRATIONS_DIR="$(dirname "$0")/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

echo "📂 Running migrations from: $MIGRATIONS_DIR"
echo ""

# Function to run a migration file
run_migration() {
    local file=$1
    local name=$(basename "$file")
    
    echo "➜ Running: $name"
    
    # Read the SQL file
    local sql=$(cat "$file")
    
    # Execute via Supabase REST API (requires service role key)
    local response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": $(echo "$sql" | jq -Rs .)}")
    
    if echo "$response" | grep -q "error"; then
        echo "   ⚠️  Warning: $name may have errors, check Supabase logs"
        echo "   Response: $response"
    else
        echo "   ✅ Completed: $name"
    fi
}

# Run migrations in order
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Migration 1: Audit Schema
if [ -f "$MIGRATIONS_DIR/001_create_audit_schema.sql" ]; then
    run_migration "$MIGRATIONS_DIR/001_create_audit_schema.sql"
else
    echo "⚠️  Warning: 001_create_audit_schema.sql not found"
fi

# Migration 2: Lineage Schema
if [ -f "$MIGRATIONS_DIR/002_create_lineage_schema.sql" ]; then
    run_migration "$MIGRATIONS_DIR/002_create_lineage_schema.sql"
else
    echo "⚠️  Warning: 002_create_lineage_schema.sql not found"
fi

# Migration 3: RPC Functions
if [ -f "$MIGRATIONS_DIR/003_create_rpc_functions.sql" ]; then
    run_migration "$MIGRATIONS_DIR/003_create_rpc_functions.sql"
else
    echo "⚠️  Warning: 003_create_rpc_functions.sql not found"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Migration process completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify schemas in Supabase Dashboard → SQL Editor"
echo "   2. Create storage bucket 'evidence' if not exists"
echo "   3. Test immutability: Try updating audit.audit_events (should fail)"
echo "   4. Run tests: import { runAllTests } from '@/test/audit.test.js'"
echo ""
