#!/bin/bash

# Script to update officer_performance_summary table in Supabase
# Make sure you have psql installed and your Supabase credentials ready

echo "🚀 Officer Performance Summary Table Update Script"
echo "=================================================="

# Check if SQL file exists
if [ ! -f "update_officer_performance_summary.sql" ]; then
    echo "❌ Error: update_officer_performance_summary.sql file not found!"
    echo "Please make sure the SQL file is in the current directory."
    exit 1
fi

# Supabase connection details
# Replace these with your actual Supabase project details
SUPABASE_PROJECT_ID="bzlenegoilnswsbanxgb"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-your_db_password_here}"
SUPABASE_HOST="db.${SUPABASE_PROJECT_ID}.supabase.co"
SUPABASE_PORT="5432"
SUPABASE_USER="postgres"
SUPABASE_DB="postgres"

echo "📋 Connection Details:"
echo "   Host: $SUPABASE_HOST"
echo "   Port: $SUPABASE_PORT"
echo "   User: $SUPABASE_USER"
echo "   Database: $SUPABASE_DB"
echo ""

# Check if password is provided
if [ "$SUPABASE_DB_PASSWORD" = "your_db_password_here" ]; then
    echo "⚠️  Please set your database password:"
    echo "   export SUPABASE_DB_PASSWORD='your_actual_password'"
    echo "   or edit this script to include your password"
    echo ""
    echo "💡 You can find your database password in:"
    echo "   https://app.supabase.com/project/$SUPABASE_PROJECT_ID/settings/database"
    echo ""
    read -p "Enter your database password: " -s SUPABASE_DB_PASSWORD
    echo ""
fi

# Test connection
echo "🔍 Testing database connection..."
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please check your credentials and try again."
    exit 1
fi

# Execute the SQL script
echo ""
echo "🔄 Executing officer_performance_summary table update..."
echo "This will:"
echo "  • Create/update the officer_performance_summary table"
echo "  • Create sample collection_officers and collection_teams"
echo "  • Insert 30 days of sample performance data"
echo "  • Set up proper indexes and relationships"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Running SQL script..."
    
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "update_officer_performance_summary.sql"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Officer performance summary table updated successfully!"
        echo ""
        echo "🎉 What was created:"
        echo "  • officer_performance_summary table with proper structure"
        echo "  • 10 sample collection officers"
        echo "  • 4 sample collection teams"
        echo "  • 30 days of performance data for each officer"
        echo "  • Proper indexes and foreign key relationships"
        echo ""
        echo "🔍 You can now test your application. The officer performance queries should work!"
        echo ""
        echo "💡 To verify the data was created, you can run:"
        echo "   SELECT COUNT(*) FROM kastle_banking.officer_performance_summary;"
        echo "   SELECT COUNT(*) FROM kastle_banking.collection_officers;"
    else
        echo "❌ Script execution failed!"
        echo "Please check the error messages above and try again."
        exit 1
    fi
else
    echo "❌ Operation cancelled."
    exit 0
fi

echo ""
echo "🚀 Update complete! Your application should now work without the database errors."