/**
 * EPIC 2: Configuration & Maker-Checker Migration Runner
 * 
 * This script runs the EPIC 2 migrations using the Supabase JavaScript client.
 * Use this when you don't have direct psql access to the database.
 * 
 * Usage:
 *   node scripts/run-epic2-migration.js
 * 
 * Environment variables:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (with admin privileges)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Required:');
  console.error('  VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  console.error('');
  console.error('For Supabase, you can find these at:');
  console.error('  https://app.supabase.com/project/<your-project>/settings/api');
  process.exit(1);
}

// Create Supabase client with service role (admin) privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function runMigration() {
  console.log('============================================================================');
  console.log('EPIC 2: Configuration & Maker-Checker Migration');
  console.log('============================================================================');
  console.log('');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = [
    '001_epic2_config_workflow_schema.sql',
    '002_epic2_seed_data.sql'
  ];

  for (const filename of migrationFiles) {
    const filepath = path.join(migrationsDir, filename);
    
    console.log('----------------------------------------');
    console.log(`Running: ${filename}`);
    console.log('----------------------------------------');

    if (!fs.existsSync(filepath)) {
      console.error(`Error: Migration file not found: ${filepath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filepath, 'utf-8');

    // Split SQL into statements (simple split, may need improvement for complex SQL)
    // For now, we'll execute the entire file as one statement via RPC
    try {
      // Try using the exec function if available
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        // If exec_sql doesn't exist, fall back to raw REST API
        if (error.message.includes('function') || error.code === 'PGRST202') {
          console.log('Note: exec_sql function not available.');
          console.log('Please run the SQL files directly in Supabase SQL Editor:');
          console.log(`  ${filepath}`);
          console.log('');
          console.log('SQL Editor URL:');
          console.log(`  ${SUPABASE_URL.replace('.supabase.co', '')}/project/_/sql`);
        } else {
          throw error;
        }
      } else {
        console.log(`✓ ${filename} completed successfully`);
      }
    } catch (err) {
      console.error(`Error running migration: ${err.message}`);
      console.log('');
      console.log('Alternative: Run the SQL files directly in Supabase SQL Editor');
      console.log('');
      console.log('Migration files:');
      migrationFiles.forEach(f => {
        console.log(`  ${path.join(migrationsDir, f)}`);
      });
    }
    
    console.log('');
  }

  console.log('============================================================================');
  console.log('Migration Instructions');
  console.log('============================================================================');
  console.log('');
  console.log('If the migration script could not execute directly, please:');
  console.log('');
  console.log('1. Go to your Supabase project SQL Editor');
  console.log('2. Copy and paste the contents of each migration file');
  console.log('3. Execute them in order');
  console.log('');
  console.log('Migration files:');
  console.log(`  ${path.join(migrationsDir, '001_epic2_config_workflow_schema.sql')}`);
  console.log(`  ${path.join(migrationsDir, '002_epic2_seed_data.sql')}`);
  console.log('');
  console.log('After running migrations, expose the new schemas:');
  console.log('1. Go to Project Settings → API');
  console.log('2. Add to "Exposed schemas": config, workflow, audit');
  console.log('3. Save changes');
  console.log('');
}

runMigration().catch(console.error);
