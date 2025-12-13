#!/usr/bin/env node

/**
 * Run EPIC 1 Setup on Supabase
 * 
 * Usage: 
 *   node run-supabase-setup.js
 *   node run-supabase-setup.js --seed
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection - UPDATE THIS IF NEEDED
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres';

const RUN_SEED = process.argv.includes('--seed');

async function main() {
  console.log('🚀 CMS EPIC 1 Supabase Setup');
  console.log('============================\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    console.log('🔌 Connecting to Supabase...');
    const { rows } = await pool.query('SELECT version()');
    console.log('✅ Connected to:', rows[0].version.substring(0, 50), '\n');

    // Run schema setup
    console.log('📦 Running schema setup...');
    const setupSql = fs.readFileSync(
      path.join(__dirname, 'supabase_epic1_setup.sql'),
      'utf8'
    );
    await pool.query(setupSql);
    console.log('✅ Schema setup complete!\n');

    // Run seed if requested
    if (RUN_SEED) {
      console.log('🌱 Running seed data...');
      const seedSql = fs.readFileSync(
        path.join(__dirname, 'supabase_epic1_seed.sql'),
        'utf8'
      );
      await pool.query(seedSql);
      console.log('✅ Seed data complete!\n');
    }

    // Verify tables
    console.log('📊 Verifying setup...');
    const { rows: tables } = await pool.query(`
      SELECT 
        tablename,
        CASE WHEN rowsecurity THEN '✅' ELSE '❌' END AS rls
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('tenants', 'cms_users', 'audit_log', 'system_config', 'tenant_config', 'feature_flags')
      ORDER BY tablename
    `);
    
    console.log('\nTables created:');
    console.log('---------------');
    tables.forEach(t => console.log(`  ${t.rls} ${t.tablename}`));

    // Count records
    const counts = await pool.query(`
      SELECT 'tenants' as tbl, COUNT(*)::int as cnt FROM tenants
      UNION ALL SELECT 'cms_users', COUNT(*)::int FROM cms_users
      UNION ALL SELECT 'feature_flags', COUNT(*)::int FROM feature_flags
      UNION ALL SELECT 'system_config', COUNT(*)::int FROM system_config
    `);
    
    console.log('\nRecord counts:');
    console.log('--------------');
    counts.rows.forEach(r => console.log(`  ${r.tbl}: ${r.cnt}`));

    console.log('\n🎉 EPIC 1 Setup Complete!');
    console.log('\nDefault dev tenant: 00000000-0000-0000-0000-000000000001');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
