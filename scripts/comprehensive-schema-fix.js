import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to recursively find all JS/JSX/TS/TSX files
function findAllSourceFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
        findAllSourceFiles(fullPath, files);
      }
    } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main function
function fixSchemaReferences() {
  console.log('🔍 Finding all source files...');
  const sourceFiles = findAllSourceFiles(path.join(__dirname, '..'));
  console.log(`Found ${sourceFiles.length} source files\n`);
  
  let totalUpdates = 0;
  
  for (const file of sourceFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      let updates = 0;
      
      // Skip if file already imports supabaseBanking
      const importsSupabaseBanking = content.includes('supabaseBanking');
      const importsSupabase = content.match(/import.*\bsupabase\b.*from.*['"]@\/lib\/supabase['"]/);
      
      if (importsSupabase && !importsSupabaseBanking) {
        // Replace import { supabase } with import { supabaseBanking }
        content = content.replace(
          /import\s*{\s*supabase\s*}/g,
          'import { supabaseBanking }'
        );
        
        // Replace all supabase. with supabaseBanking.
        content = content.replace(/\bsupabase\./g, 'supabaseBanking.');
        updates++;
      }
      
      // If file imports both supabase and supabaseBanking
      if (content.includes('import') && content.includes('') && importsSupabaseBanking) {
        // Remove supabase from imports
        content = content.replace(/\bsupabase,\s*/g, '');
        
        // Replace any remaining supabaseBanking.from( with supabaseBanking.from(
        content = content.replace(/\bsupabase\.from\(/g, 'supabaseBanking.from(');
        updates++;
      }
      
      // Fix any remaining standalone supabase usage in files that might not have proper imports
      if (!file.includes('/lib/supabase.js') && content.includes('supabaseBanking.from(')) {
        content = content.replace(/\bsupabase\.from\(/g, 'supabaseBanking.from(');
        updates++;
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Updated: ${path.relative(path.join(__dirname, '..'), file)} (${updates} changes)`);
        totalUpdates++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✨ Schema fix complete! Updated ${totalUpdates} files.`);
  console.log('\n📝 Summary of changes:');
  console.log('- All imports of { supabase } changed to { supabaseBanking }');
  console.log('- All supabaseBanking.from() calls changed to supabaseBanking.from()');
  console.log('- All queries now use the kastle_banking schema');
  
  console.log('\n⚠️  Important: You may need to restart your development server for changes to take effect.');
}

// Run the fix
fixSchemaReferences();