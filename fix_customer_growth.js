const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src/services/dashboardDetailsService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of the problematic filter
content = content.replace(
  /\.select\('\*', \{ count: 'exact', head: true \}\)\s*\.eq\('is_active', true\);/g,
  ".select('*', { count: 'exact', head: true });"
);

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fixed customer growth filter issue in dashboardDetailsService.js');