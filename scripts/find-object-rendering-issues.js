#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// The problematic keys from the error message
const problematicKeys = [
  'title',
  'performanceReport', 
  'summary',
  'totalPortfolio',
  'overdueAmount',
  'activeCases',
  'collectionRate',
  'officers',
  'officerName',
  'cases',
  'dueAmount',
  'contactRate',
  'allProducts'
];

console.log('Searching for potential object rendering issues...\n');

// Search for JSX files
const files = await glob('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

let issuesFound = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Look for patterns that might indicate object rendering
    // Pattern 1: Direct object rendering in JSX {someObject}
    const objectRenderPattern = /\{(\w+)\}/g;
    const matches = line.matchAll(objectRenderPattern);
    
    for (const match of matches) {
      const varName = match[1];
      
      // Check if this variable might contain our problematic keys
      problematicKeys.forEach(key => {
        if (content.includes(`${varName}.${key}`) || 
            content.includes(`${varName}['${key}']`) ||
            content.includes(`${varName}["${key}"]`)) {
          console.log(`Potential issue in ${file}:${index + 1}`);
          console.log(`  Variable '${varName}' contains key '${key}' and might be rendered directly`);
          console.log(`  Line: ${line.trim()}`);
          console.log('');
          issuesFound++;
        }
      });
    }
    
    // Pattern 2: Look for Label components with dynamic content
    if (line.includes('<Label') && line.includes('{')) {
      const labelPattern = /<Label[^>]*>([^<]*\{[^}]+\}[^<]*)<\/Label>/;
      const labelMatch = line.match(labelPattern);
      
      if (labelMatch) {
        console.log(`Label with dynamic content in ${file}:${index + 1}`);
        console.log(`  Line: ${line.trim()}`);
        console.log('');
      }
    }
  });
});

console.log(`\nSearch complete. Found ${issuesFound} potential issues.`);

// Also search for the specific error pattern in translation files
console.log('\nChecking translation files for missing keys...');

const translationFiles = await glob('public/locales/**/*.json');

translationFiles.forEach(file => {
  try {
    const translations = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Check if any of the problematic keys exist as translation keys
    problematicKeys.forEach(key => {
      if (JSON.stringify(translations).includes(key)) {
        console.log(`Found key '${key}' in translation file: ${file}`);
      }
    });
  } catch (error) {
    console.error(`Error reading ${file}: ${error.message}`);
  }
});

console.log('\nDone.');