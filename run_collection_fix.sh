#!/bin/bash

# Script to fix collection schema issues

echo "Fixing collection schema issues..."

# Get Supabase connection details from environment
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set. Please set it first."
    echo "Example: export DATABASE_URL='postgresql://postgres:[password]@[host]:[port]/postgres'"
    exit 1
fi

# Run the SQL script
psql "$DATABASE_URL" -f /workspace/fix_collection_schema.sql

if [ $? -eq 0 ]; then
    echo "Collection schema fixed successfully!"
else
    echo "Error fixing collection schema. Please check the output above."
    exit 1
fi