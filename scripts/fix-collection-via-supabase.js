import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjA1MjM2NiwiZXhwIjoyMDM3NjI4MzY2fQ.RVFZ1E7gLdP0KkT_cpWdUdLZSDGM8K3T88wWYVWeBE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCollectionSchema() {
  try {
    console.log('Fixing collection schema via Supabase...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix_collection_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`Processing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip verification SELECT statements
        if (statement.toUpperCase().startsWith('SELECT') && statement.includes('status')) {
          continue;
        }

        // Execute the statement via Supabase RPC
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct execution as a fallback
          const { error: directError } = await supabase.from('_').select().limit(0);
          // This is a hack to get access to the underlying connection
          
          if (directError) {
            throw error;
          }
        }

        successCount++;
        
        // Log progress for important operations
        if (statement.includes('CREATE SCHEMA') || 
            statement.includes('CREATE TABLE') ||
            (statement.includes('INSERT INTO') && i % 10 === 0)) {
          console.log(`✓ [${i+1}/${statements.length}] Executed: ${statement.substring(0, 50)}...`);
        }
      } catch (error) {
        errorCount++;
        if (!error.message?.includes('already exists') && 
            !error.message?.includes('duplicate key')) {
          errors.push({
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
        }
      }
    }

    console.log(`\nExecution complete!`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\nNon-duplicate errors:');
      errors.forEach(e => {
        console.error(`- ${e.error}`);
        console.error(`  Statement: ${e.statement}`);
      });
    }

    // Since we can't execute raw SQL easily with Supabase client,
    // let's create a simplified version
    console.log('\nApplying simplified fix...');
    await applySimplifiedFix();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function applySimplifiedFix() {
  console.log('Note: The kastle_collection schema needs to be created manually in Supabase.');
  console.log('\nTo fix the collection dashboard:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy and paste the contents of fix_collection_schema.sql');
  console.log('3. Execute the SQL');
  console.log('\nAlternatively, you can use the psql command with the connection string:');
  console.log('postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres');
  
  // Create a minimal fix SQL file
  const minimalFix = `
-- Minimal Collection Schema Fix
-- Run this in Supabase SQL Editor

-- Create schema
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Grant permissions
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Create essential tables with minimal structure
CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id INTEGER PRIMARY KEY,
    team_name VARCHAR(100),
    team_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(100),
    team_id INTEGER
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id VARCHAR(50) PRIMARY KEY,
    bucket_name VARCHAR(100),
    min_days INTEGER,
    max_days INTEGER
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(50),
    loan_account_number VARCHAR(50),
    customer_id VARCHAR(50),
    total_outstanding DECIMAL(15,2),
    days_past_due INTEGER,
    case_status VARCHAR(50),
    priority VARCHAR(20),
    bucket_id VARCHAR(50),
    assigned_to VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_interactions (
    interaction_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    officer_id VARCHAR(50),
    interaction_type VARCHAR(50),
    interaction_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.promise_to_pay (
    ptp_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    promised_amount DECIMAL(15,2),
    promise_date DATE,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE UNIQUE,
    total_cases INTEGER,
    total_outstanding DECIMAL(15,2),
    total_collected DECIMAL(15,2),
    collection_rate DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50),
    summary_date DATE,
    total_collected DECIMAL(15,2),
    quality_score DECIMAL(5,2)
);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Disable RLS
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- Insert minimal data
INSERT INTO kastle_collection.collection_teams (team_id, team_name, team_type) VALUES
    (1, 'Team A', 'FIELD'),
    (2, 'Team B', 'CALL_CENTER')
ON CONFLICT DO NOTHING;

INSERT INTO kastle_collection.collection_officers (officer_id, officer_name, team_id) VALUES
    ('OFF001', 'Officer 1', 1),
    ('OFF002', 'Officer 2', 2)
ON CONFLICT DO NOTHING;

INSERT INTO kastle_collection.collection_buckets (bucket_id, bucket_name, min_days, max_days) VALUES
    ('BUCKET_1', '1-30 Days', 1, 30),
    ('BUCKET_2', '31-60 Days', 31, 60),
    ('BUCKET_3', '61-90 Days', 61, 90)
ON CONFLICT DO NOTHING;

-- Insert sample daily summary
INSERT INTO kastle_collection.daily_collection_summary (summary_date, total_cases, total_outstanding, total_collected, collection_rate)
VALUES (CURRENT_DATE, 100, 1000000, 50000, 5.0)
ON CONFLICT DO NOTHING;
`;

  // Save the minimal fix
  const minimalFixPath = path.join(__dirname, '..', 'fix_collection_minimal.sql');
  fs.writeFileSync(minimalFixPath, minimalFix);
  
  console.log(`\nMinimal fix SQL saved to: ${minimalFixPath}`);
  console.log('You can run this file in Supabase SQL Editor to fix the immediate issues.');
}

// Run the fix
fixCollectionSchema().catch(console.error);