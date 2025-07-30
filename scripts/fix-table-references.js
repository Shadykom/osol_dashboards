import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixTableReferences() {
  const files = [
    'src/services/collectionService.js',
    'src/services/specialistReportService.js'
  ];
  
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, '..', file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Replace all instances of .from('kastle_collection.table_name') with .from('table_name')
      const pattern = /\.from\(['"]kastle_collection\.([^'"]+)['"]\)/g;
      const originalContent = content;
      content = content.replace(pattern, ".from('$1')");
      
      // Also fix any references in select statements
      const selectPattern = /kastle_collection\.([a-zA-Z_]+)!/g;
      content = content.replace(selectPattern, '$1!');
      
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fixed table references in ${file}`);
        
        // Count replacements
        const replacements = (originalContent.match(pattern) || []).length;
        console.log(`   📝 Replaced ${replacements} table references`);
      } else {
        console.log(`ℹ️  No changes needed in ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
}

async function main() {
  console.log('🔧 Fixing table references in service files...\n');
  
  await fixTableReferences();
  
  console.log('\n✨ Table reference fixes complete!');
  console.log('🔄 Please restart your development server to see the changes.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});