import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFix() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/fix-branch-id-queries.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Alternative approach: execute the SQL statements directly
      console.log('Trying alternative approach...');
      
      // Check if branch_id column exists
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'kastle_banking')
        .eq('table_name', 'loan_accounts')
        .eq('column_name', 'branch_id');
      
      if (!columns || columns.length === 0) {
        console.log('branch_id column does not exist, need to add it manually');
        console.log('Please execute the following SQL in your Supabase SQL editor:');
        console.log(sqlContent);
      } else {
        console.log('branch_id column already exists');
      }
    } else {
      console.log('SQL executed successfully:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

executeSQLFix();