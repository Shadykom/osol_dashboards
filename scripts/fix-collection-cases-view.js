import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://bzlenegoilnswsbanxgb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCollectionCasesView() {
  console.log('🔧 Fixing collection_cases_detailed view...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(path.dirname(__dirname), 'fix_collection_cases_view.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content loaded successfully');
    
    // Since we can't execute raw SQL directly through Supabase client,
    // we'll check if the view exists and provide instructions
    
    // Check if the view exists
    const { data: viewCheck, error: viewError } = await supabase
      .from('collection_cases_detailed')
      .select('id')
      .limit(1);
    
    if (viewError && viewError.code === '42P01') {
      console.log('❌ View does not exist. The view needs to be created.');
      console.log('\n📋 Please execute the following SQL in your Supabase SQL editor:');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql/new');
      console.log('\n--- BEGIN SQL ---');
      console.log(sqlContent);
      console.log('--- END SQL ---\n');
      
      console.log('After executing the SQL, the collection cases page should work properly.');
    } else if (viewError) {
      console.error('❌ Error checking view:', viewError);
    } else {
      console.log('✅ View already exists!');
      console.log('Sample data:', viewCheck);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Run the fix
fixCollectionCasesView();