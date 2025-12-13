#!/bin/bash
# ============================================================================
# EPIC 2: Configuration & Maker-Checker Migration Script
# ============================================================================
# This script applies the EPIC 2 database migrations to create:
# - config schema (packages, versions, items)
# - workflow schema (approvals, approval_steps)
# - audit schema (config_audit_log)
# - RLS policies for tenant isolation
# - Seed data with default "core" package
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================================================"
echo "EPIC 2: Configuration & Maker-Checker Migration"
echo "============================================================================"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL or SUPABASE_DB_URL not set${NC}"
    echo ""
    echo "To run this migration, you need to set one of the following:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/db'"
    echo "  or"
    echo "  export SUPABASE_DB_URL='postgresql://user:pass@host:port/db'"
    echo ""
    echo "For Supabase, you can find the connection string at:"
    echo "  https://app.supabase.com/project/<your-project>/settings/database"
    echo ""
    echo "Alternatively, you can run the SQL files directly in the Supabase SQL editor."
    echo ""
    echo "Migration files location:"
    echo "  ${MIGRATIONS_DIR}/001_epic2_config_workflow_schema.sql"
    echo "  ${MIGRATIONS_DIR}/002_epic2_seed_data.sql"
    exit 1
fi

DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

echo -e "${GREEN}Database URL configured${NC}"
echo ""

# Function to run SQL file
run_sql_file() {
    local file=$1
    local name=$2
    
    echo "----------------------------------------"
    echo "Running: ${name}"
    echo "File: ${file}"
    echo "----------------------------------------"
    
    if [ -f "$file" ]; then
        psql "$DB_URL" -f "$file" 2>&1 | while read line; do
            if [[ "$line" == *"ERROR"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ "$line" == *"NOTICE"* ]]; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo "$line"
            fi
        done
        
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            echo -e "${GREEN}✓ ${name} completed successfully${NC}"
        else
            echo -e "${RED}✗ ${name} failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}File not found: ${file}${NC}"
        exit 1
    fi
    
    echo ""
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Run migrations
echo "Starting migrations..."
echo ""

# 1. Schema and tables migration
run_sql_file "${MIGRATIONS_DIR}/001_epic2_config_workflow_schema.sql" "Schema & Tables Migration"

# 2. Seed data migration
run_sql_file "${MIGRATIONS_DIR}/002_epic2_seed_data.sql" "Seed Data Migration"

echo "============================================================================"
echo -e "${GREEN}All EPIC 2 migrations completed successfully!${NC}"
echo "============================================================================"
echo ""
echo "Created schemas:"
echo "  - config (packages, versions, items)"
echo "  - workflow (approvals, approval_steps)"
echo "  - audit (config_audit_log)"
echo ""
echo "Created seed data:"
echo "  - Default 'core' package with published version"
echo "  - Default 'collections' package with published version"
echo "  - Sample configuration items"
echo ""
echo "Next steps:"
echo "  1. Expose the new schemas in Supabase API settings (if using Supabase)"
echo "  2. Update your application to use the new ConfigService and WorkflowService"
echo "  3. Configure tenant ID in your auth context"
echo ""
