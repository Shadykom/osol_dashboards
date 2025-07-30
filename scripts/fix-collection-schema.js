import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connectionString = 'postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres';

async function fixCollectionSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix_collection_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing collection schema fix...');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Skip SELECT statements that are just for verification
        if (statement.toUpperCase().startsWith('SELECT') && statement.includes('status')) {
          const result = await client.query(statement + ';');
          console.log('Verification:', result.rows[0]);
          continue;
        }

        await client.query(statement + ';');
        successCount++;
        
        // Log progress for important operations
        if (statement.includes('CREATE SCHEMA') || 
            statement.includes('CREATE TABLE') ||
            statement.includes('INSERT INTO')) {
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        }
      } catch (error) {
        errorCount++;
        // Only log errors that aren't "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Error executing statement:', error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log(`\nExecution complete!`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Errors (mostly duplicates): ${errorCount}`);

    // Verify the fix
    console.log('\nVerifying collection schema setup...');
    
    const verifyQuery = `
      SELECT 
        (SELECT COUNT(*) FROM kastle_collection.collection_teams) as teams_count,
        (SELECT COUNT(*) FROM kastle_collection.collection_officers) as officers_count,
        (SELECT COUNT(*) FROM kastle_collection.collection_buckets) as buckets_count,
        (SELECT COUNT(*) FROM kastle_collection.collection_cases) as cases_count,
        (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as daily_summaries_count,
        (SELECT COUNT(*) FROM kastle_collection.officer_performance_summary) as officer_performance_count
    `;

    const result = await client.query(verifyQuery);
    console.log('\nDatabase status:');
    console.log('- Teams:', result.rows[0].teams_count);
    console.log('- Officers:', result.rows[0].officers_count);
    console.log('- Buckets:', result.rows[0].buckets_count);
    console.log('- Collection Cases:', result.rows[0].cases_count);
    console.log('- Daily Summaries:', result.rows[0].daily_summaries_count);
    console.log('- Officer Performance Records:', result.rows[0].officer_performance_count);

    console.log('\n✅ Collection schema fix completed successfully!');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixCollectionSchema().catch(console.error);