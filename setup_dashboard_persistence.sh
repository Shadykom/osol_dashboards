#!/bin/bash

# Setup Dashboard Persistence Tables
# This script creates the necessary tables for persisting dashboard customizations

echo "Setting up dashboard persistence tables..."

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-osol_db}"
DB_USER="${DB_USER:-postgres}"

# Check if we should use password authentication
if [ -z "$DB_PASSWORD" ]; then
    echo "Note: DB_PASSWORD not set, attempting connection without password"
    PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
else
    export PGPASSWORD=$DB_PASSWORD
    PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

# Execute the SQL script
echo "Creating dashboard persistence tables..."
$PSQL_CMD -f create_dashboard_persistence_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Dashboard persistence tables created successfully!"
    echo ""
    echo "The following tables have been created (if they didn't exist):"
    echo "  - dashboard_templates: Stores dashboard templates"
    echo "  - user_dashboards: Stores user-specific dashboard configurations"
    echo "  - user_dashboard_widgets: Stores widget configurations for each dashboard"
    echo "  - user_preferences: Stores general user preferences"
    echo ""
    echo "Dashboard customizations will now be persisted across user sessions."
else
    echo "❌ Error creating dashboard persistence tables"
    echo "Please check your database connection settings and try again."
    exit 1
fi

# Verify tables were created
echo ""
echo "Verifying tables..."
$PSQL_CMD -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('dashboard_templates', 'user_dashboards', 'user_dashboard_widgets', 'user_preferences');" 

echo ""
echo "Setup complete! Dashboard customizations will now be saved to the database."