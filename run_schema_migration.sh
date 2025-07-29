#!/bin/bash

# Schema Migration Script for kastle_banking consolidation
# This script runs the SQL migration to move all tables to kastle_banking schema

echo "========================================"
echo "Schema Migration to kastle_banking"
echo "========================================"
echo ""
echo "This script will:"
echo "1. Move all tables from kastle_collection to kastle_banking"
echo "2. Update foreign key constraints"
echo "3. Grant necessary permissions"
echo "4. Disable Row Level Security"
echo ""
echo "Database: postgresql://postgres:****@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Running migration..."
    
    # Set the password as environment variable
    export PGPASSWORD="OSOL1a15975311"
    
    # Run the migration script
    psql -h db.bzlenegoilnswsbanxgb.supabase.co \
         -p 5432 \
         -U postgres \
         -d postgres \
         -f check_and_update_schemas.sql \
         -v ON_ERROR_STOP=1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Update Supabase API settings to expose 'kastle_banking' schema"
        echo "2. Test the application to ensure all queries work correctly"
    else
        echo ""
        echo "❌ Migration failed. Please check the error messages above."
    fi
else
    echo "Migration cancelled."
fi