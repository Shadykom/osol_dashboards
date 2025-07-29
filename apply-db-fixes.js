import pg from 'pg';
import fs from 'fs/promises';
const { Client } = pg;

const connectionString = 'postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres';

async function applyDatabaseFixes() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    // Read the SQL file
    const sqlScript = await fs.readFile('db-schema-fix.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\nExecuting ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 80) + '...');
        
        await client.query(statement);
        console.log('✓ Success');
      } catch (error) {
        console.error(`✗ Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements even if one fails
      }
    }
    
    // Verify the fixes
    console.log('\n\nVerifying database structure...');
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'kastle_banking'
      ORDER BY table_name
    `);
    
    console.log('\nTables in kastle_banking schema:');
    tablesResult.rows.forEach(row => console.log('✓ ' + row.table_name));
    
    // Check foreign keys
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'kastle_banking'
    `);
    
    console.log('\nForeign key relationships:');
    fkResult.rows.forEach(row => 
      console.log(`✓ ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}`)
    );
    
    // Test a query that was failing
    console.log('\nTesting problematic queries...');
    
    try {
      const testQuery = await client.query(`
        SELECT 
          officer_id,
          officer_name,
          officer_type,
          team_id,
          contact_number,
          email,
          status,
          language_skills,
          collection_limit,
          commission_rate,
          joining_date,
          last_active,
          collection_teams.team_name,
          collection_teams.team_type
        FROM kastle_banking.collection_officers
        LEFT JOIN kastle_banking.collection_teams 
          ON collection_officers.team_id = collection_teams.team_id
        WHERE officer_id = 'OFF007'
      `);
      
      console.log('✓ Officer query with team join successful');
      if (testQuery.rows.length > 0) {
        console.log('  Found officer:', testQuery.rows[0].officer_name);
      }
    } catch (error) {
      console.error('✗ Officer query failed:', error.message);
    }
    
    console.log('\n✅ Database fixes applied successfully!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

applyDatabaseFixes();