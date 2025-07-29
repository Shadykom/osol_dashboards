#!/bin/bash

# Database Schema Migration Script
# This script moves all tables from 'public' and 'kastle_collection' schemas to 'kastle_banking' schema

DB_URL="postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"

echo "=== Database Schema Migration Tool ==="
echo "Target schema: kastle_banking"
echo ""

# First, let's check what tables exist in each schema
echo "Checking current schema state..."
psql "$DB_URL" -c "
SELECT 
    table_schema,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;"

echo ""
echo "Starting migration..."
echo ""

# Run the migration
psql "$DB_URL" -f migrate_tables.sql

echo ""
echo "Migration complete!"
echo ""
echo "To verify the migration, you can run:"
echo "psql \"$DB_URL\" -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_type = 'BASE TABLE' ORDER BY table_name;\""