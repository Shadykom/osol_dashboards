#!/usr/bin/env python3
import psycopg2
from psycopg2 import sql
import sys

# Database connection parameters
DB_URL = "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"

def connect_to_db():
    """Establish connection to the database"""
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = False  # Use transactions
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def get_tables_in_schema(cursor, schema_name):
    """Get all tables in a specific schema"""
    query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = %s 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """
    cursor.execute(query, (schema_name,))
    return [row[0] for row in cursor.fetchall()]

def create_schema_if_not_exists(cursor, schema_name):
    """Create schema if it doesn't exist"""
    cursor.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(
        sql.Identifier(schema_name)
    ))

def move_table(cursor, table_name, from_schema, to_schema):
    """Move a table from one schema to another"""
    try:
        # Build the ALTER TABLE statement
        alter_query = sql.SQL("ALTER TABLE {}.{} SET SCHEMA {}").format(
            sql.Identifier(from_schema),
            sql.Identifier(table_name),
            sql.Identifier(to_schema)
        )
        cursor.execute(alter_query)
        print(f"  ✓ Moved {from_schema}.{table_name} to {to_schema}.{table_name}")
        return True
    except Exception as e:
        print(f"  ✗ Error moving {from_schema}.{table_name}: {e}")
        return False

def main():
    print("=== Database Schema Migration Tool ===")
    print(f"Target schema: kastle_banking")
    print()
    
    # Connect to database
    conn = connect_to_db()
    cursor = conn.cursor()
    
    try:
        # Ensure kastle_banking schema exists
        create_schema_if_not_exists(cursor, 'kastle_banking')
        
        # Get tables from each schema
        schemas_to_check = ['public', 'kastle_collection']
        total_moved = 0
        total_failed = 0
        
        for schema in schemas_to_check:
            print(f"\nChecking schema: {schema}")
            tables = get_tables_in_schema(cursor, schema)
            
            if not tables:
                print(f"  No tables found in {schema} schema")
                continue
                
            print(f"  Found {len(tables)} table(s) to move:")
            
            for table in tables:
                if move_table(cursor, table, schema, 'kastle_banking'):
                    total_moved += 1
                else:
                    total_failed += 1
        
        # Show current state of kastle_banking schema
        print(f"\n\nFinal state of kastle_banking schema:")
        kastle_banking_tables = get_tables_in_schema(cursor, 'kastle_banking')
        print(f"  Total tables: {len(kastle_banking_tables)}")
        for table in kastle_banking_tables:
            print(f"    - {table}")
        
        # Summary
        print(f"\n\nMigration Summary:")
        print(f"  Tables successfully moved: {total_moved}")
        print(f"  Tables failed to move: {total_failed}")
        
        if total_failed == 0:
            # Commit the transaction if all successful
            conn.commit()
            print("\n✓ All changes committed successfully!")
        else:
            # Rollback if any failures
            conn.rollback()
            print("\n✗ Changes rolled back due to errors!")
            
    except Exception as e:
        print(f"\nError during migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()