import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase URL and key from environment or use defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzODUzMDUsImV4cCI6MjA0Mzk2MTMwNX0.bK_f-YNHEz6SOQZ8eVogf1WhIBqRaHXh88wWYVWeBE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSqlFile(filename) {
  try {
    const filePath = path.join(process.cwd(), filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running SQL from ${filename}...`);
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('SQL executed successfully!');
    if (data) {
      console.log('Result:', data);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get filename from command line arguments
const filename = process.argv[2];

if (!filename) {
  console.error('Please provide a SQL filename as argument');
  console.error('Usage: node scripts/runSql.js <filename.sql>');
  process.exit(1);
}

runSqlFile(filename);