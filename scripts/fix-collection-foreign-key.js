import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCollectionForeignKey() {
  console.log('🔧 Fixing collection_cases foreign key relationship...\n');
  
  try {
    // First, check if the foreign key already exists
    console.log('1️⃣ Checking if foreign key constraint already exists...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints 
          WHERE constraint_schema = 'kastle_banking' 
          AND table_name = 'collection_cases' 
          AND constraint_name = 'collection_cases_assigned_to_fkey'
        `
      });
    
    if (constraintError) {
      console.error('❌ Error checking constraints:', constraintError);
      console.log('\n⚠️  Cannot execute SQL directly. Please run the following SQL in your Supabase SQL Editor:');
      console.log('📋 Copy and paste this SQL:\n');
      
      const sqlContent = fs.readFileSync(path.join(__dirname, '..', 'fix_collection_cases_foreign_key.sql'), 'utf8');
      console.log('```sql');
      console.log(sqlContent);
      console.log('```\n');
      
      console.log('🔗 Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql/new');
      console.log('📝 Paste the SQL above and click "Run"\n');
      return;
    }
    
    if (constraints && constraints[0]?.count > 0) {
      console.log('✅ Foreign key constraint already exists!');
      return;
    }
    
    // Try to add the foreign key constraint
    console.log('2️⃣ Adding foreign key constraint...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE kastle_banking.collection_cases
        ADD CONSTRAINT collection_cases_assigned_to_fkey 
        FOREIGN KEY (assigned_to) 
        REFERENCES kastle_banking.collection_officers(officer_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      `
    });
    
    if (addError) {
      console.error('❌ Error adding foreign key:', addError);
      console.log('\n⚠️  Please run the SQL manually as shown above.');
      return;
    }
    
    console.log('✅ Foreign key constraint added successfully!');
    
    // Create index for better performance
    console.log('3️⃣ Creating index on assigned_to column...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to 
        ON kastle_banking.collection_cases(assigned_to);
      `
    });
    
    if (indexError) {
      console.error('⚠️  Warning: Could not create index:', indexError);
    } else {
      console.log('✅ Index created successfully!');
    }
    
    // Test the relationship
    console.log('\n4️⃣ Testing the relationship...');
    const { data: testData, error: testError } = await supabase
      .from('collection_cases')
      .select(`
        case_id,
        case_number,
        assigned_to,
        collection_officers!assigned_to (
          officer_name
        )
      `)
      .limit(1);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log('✅ Relationship test successful!');
      if (testData && testData.length > 0) {
        console.log('📊 Sample data:', JSON.stringify(testData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 Please check the Supabase dashboard and run the SQL manually if needed.');
  }
}

// Run the fix
fixCollectionForeignKey()
  .then(() => {
    console.log('\n✨ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });