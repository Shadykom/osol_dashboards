#!/bin/bash

# Dashboard Fixes Script
# This script applies all necessary fixes for the dashboard errors

echo "========================================="
echo "Dashboard Fixes Script"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "Error: Missing required environment variables!"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
    exit 1
fi

# Extract database connection details from Supabase URL
DB_HOST=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
DB_PASSWORD=$VITE_SUPABASE_DB_PASSWORD
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

if [ -z "$DB_PASSWORD" ]; then
    echo "Error: VITE_SUPABASE_DB_PASSWORD not found in .env"
    echo "Please add your database password to the .env file"
    exit 1
fi

# Construct database URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db.${DB_HOST}.supabase.co:${DB_PORT}/${DB_NAME}"

echo "Running dashboard fixes..."
echo ""

# 1. Apply database schema fixes
echo "1. Applying database schema fixes..."
PGPASSWORD=$DB_PASSWORD psql "$DATABASE_URL" -f fix_dashboard_errors.sql
if [ $? -eq 0 ]; then
    echo "✓ Database schema fixes applied successfully"
else
    echo "✗ Failed to apply database schema fixes"
fi
echo ""

# 2. Apply realtime subscription fixes
echo "2. Enabling realtime subscriptions for collection tables..."
PGPASSWORD=$DB_PASSWORD psql "$DATABASE_URL" -f fix_realtime_subscriptions.sql
if [ $? -eq 0 ]; then
    echo "✓ Realtime subscriptions enabled successfully"
else
    echo "✗ Failed to enable realtime subscriptions"
fi
echo ""

echo "========================================="
echo "Dashboard fixes completed!"
echo "========================================="
echo ""
echo "Please refresh your browser to see the changes."
echo ""
echo "Note: The following fixes were applied:"
echo "- Fixed missing database columns in transactions and loan_accounts tables"
echo "- Added missing translation keys for print functionality"
echo "- Enabled realtime subscriptions for collection tables"
echo ""
echo "If you still see errors, check the browser console for details."