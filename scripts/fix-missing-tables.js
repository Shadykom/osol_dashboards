import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it in your .env file or as an environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'kastle_banking'
  }
});

async function runSQL() {
  try {
    console.log('🔧 Creating missing tables in kastle_banking schema...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'fix_missing_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      // If exec_sql doesn't exist, try running queries individually
      console.log('⚠️  exec_sql function not found, running queries individually...');
      
      const queries = sql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--'));
      
      for (const query of queries) {
        console.log(`\n📝 Running: ${query.substring(0, 50)}...`);
        
        // For CREATE TABLE and other DDL, we need to use raw SQL
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql_query: query })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error: ${errorText}`);
          } else {
            console.log('✅ Success');
          }
        } catch (err) {
          console.error(`❌ Error: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Tables created successfully');
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    
    // Check collection_officers
    const { count: officerCount, error: officerError } = await supabase
      .from('collection_officers')
      .select('*', { count: 'exact', head: true });
    
    if (officerError) {
      console.error('❌ collection_officers table check failed:', officerError.message);
    } else {
      console.log(`✅ collection_officers table exists (${officerCount || 0} rows)`);
    }
    
    // Check loan_accounts
    const { count: loanCount, error: loanError } = await supabase
      .from('loan_accounts')
      .select('*', { count: 'exact', head: true });
    
    if (loanError) {
      console.error('❌ loan_accounts table check failed:', loanError.message);
    } else {
      console.log(`✅ loan_accounts table exists (${loanCount || 0} rows)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
runSQL();