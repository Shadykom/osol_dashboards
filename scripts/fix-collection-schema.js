const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filename) {
  try {
    console.log(`\n📄 Running ${filename}...`);
    
    const sqlContent = await fs.readFile(path.join(__dirname, '..', filename), 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sqlContent
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      // Skip comments and empty statements
      if (!statement || statement.match(/^\s*--/) || statement.match(/^\s*$/)) {
        continue;
      }
      
      try {
        // For DO blocks and functions, execute as-is
        if (statement.includes('DO $$') || statement.includes('CREATE OR REPLACE FUNCTION')) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) throw error;
        } else {
          // For regular statements, use the REST API
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) throw error;
        }
        
        successCount++;
        
        // Log important operations
        if (statement.includes('CREATE SCHEMA')) {
          console.log('✅ Created schema');
        } else if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE[^(]+\(([^)]+)\)/)?.[1] || 'table';
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO\s+([^\s(]+)/)?.[1] || 'table';
          console.log(`✅ Inserted data into: ${tableName}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement:`, error.message);
        
        // Continue with other statements
        continue;
      }
    }
    
    console.log(`\n📊 Summary for ${filename}:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    return { successCount, errorCount };
  } catch (error) {
    console.error(`Failed to read or execute ${filename}:`, error);
    return { successCount: 0, errorCount: 1 };
  }
}

// Alternative approach using direct database connection
async function runSQLFileDirect(filename) {
  try {
    console.log(`\n📄 Running ${filename} using direct approach...`);
    
    const sqlContent = await fs.readFile(path.join(__dirname, '..', filename), 'utf8');
    
    // Use fetch to make direct SQL queries
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sqlContent })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    console.log(`✅ Successfully executed ${filename}`);
    return { successCount: 1, errorCount: 0 };
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    
    // Try executing statement by statement
    console.log('Attempting statement-by-statement execution...');
    return runSQLFile(filename);
  }
}

async function main() {
  console.log('🚀 Starting Collection Schema Fix...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  const files = [
    'fix_collection_schema.sql',
    'fix_collection_foreign_keys.sql'
  ];
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    // Check if file exists
    try {
      await fs.access(path.join(__dirname, '..', file));
      const result = await runSQLFile(file);
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
    } catch (error) {
      console.error(`❌ File not found: ${file}`);
      totalErrors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Collection Schema Fix Complete!');
  console.log(`📊 Total Summary:`);
  console.log(`   ✅ Successful operations: ${totalSuccess}`);
  console.log(`   ❌ Failed operations: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✨ All fixes applied successfully!');
    console.log('🔄 Please refresh your application to see the changes.');
  } else {
    console.log('\n⚠️  Some operations failed. Check the logs above for details.');
    console.log('💡 You may need to run this script again or apply fixes manually.');
  }
}

// Create RPC function if it doesn't exist
async function createExecSQLFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;
  
  try {
    await supabase.rpc('query', { query: createFunction });
    console.log('✅ Created exec_sql function');
  } catch (error) {
    // Function might already exist
    console.log('ℹ️  exec_sql function may already exist');
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});