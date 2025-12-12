#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Runs SQL migration files in order.
 * Usage: node run-migrations.js [--seed]
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDS_DIR = path.join(__dirname, 'seeds');
const RUN_SEEDS = process.argv.includes('--seed');

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

/**
 * Get migration files sorted by name
 */
function getMigrationFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping...`);
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

/**
 * Run a single SQL file
 */
async function runSqlFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Running: ${fileName}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`   ✅ Success`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function main() {
  console.log('🚀 CMS Database Migration Runner');
  console.log('================================\n');
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✅ Connected to database\n');
    
    // Run migrations
    console.log('📁 Running migrations...');
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    
    if (migrations.length === 0) {
      console.log('   No migration files found');
    } else {
      for (const file of migrations) {
        await runSqlFile(path.join(MIGRATIONS_DIR, file));
      }
      console.log(`\n✅ Ran ${migrations.length} migration(s)`);
    }
    
    // Run seeds if requested
    if (RUN_SEEDS) {
      console.log('\n📁 Running seed scripts...');
      const seeds = getMigrationFiles(SEEDS_DIR);
      
      if (seeds.length === 0) {
        console.log('   No seed files found');
      } else {
        for (const file of seeds) {
          await runSqlFile(path.join(SEEDS_DIR, file));
        }
        console.log(`\n✅ Ran ${seeds.length} seed(s)`);
      }
    }
    
    console.log('\n🎉 Migration complete!');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
