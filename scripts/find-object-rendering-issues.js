#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

// Patterns that might indicate object rendering
const suspiciousPatterns = [
  // Direct object rendering: {someObject}
  /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}(?![.?\[])/g,
  
  // Potential object properties being rendered
  /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\s*&&\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g,
  
  // Conditional rendering that might return an object
  /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g
];

// Known safe variables/patterns to ignore
const safePatterns = [
  'children',
  'className',
  'style',
  't', // translation function
  'i18n',
  'isRTL',
  'loading',
  'error',
  'disabled',
  'open',
  'value',
  'checked',
  'selected'
];

// Properties mentioned in the error
const errorProperties = [
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

function findJSXFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
        walk(fullPath);
      } else if (stat.isFile() && (item.endsWith('.jsx') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  
  // Check for direct object rendering
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    
    // Check for JSX expressions
    const jsxExpressions = line.match(/\{[^}]+\}/g);
    if (!jsxExpressions) return;
    
    jsxExpressions.forEach(expr => {
      // Remove the braces
      const innerExpr = expr.slice(1, -1).trim();
      
      // Skip if it's a safe pattern
      if (safePatterns.some(safe => innerExpr === safe)) return;
      
      // Skip if it has property access, method calls, or array access
      if (innerExpr.includes('.') || innerExpr.includes('(') || innerExpr.includes('[')) return;
      
      // Skip if it's a number or string literal
      if (/^\d+$/.test(innerExpr) || /^["'`]/.test(innerExpr)) return;
      
      // Skip if it's a boolean literal
      if (innerExpr === 'true' || innerExpr === 'false') return;
      
      // Skip if it's an expression with operators
      if (/[+\-*/%<>=!&|]/.test(innerExpr)) return;
      
      // Check if it might be an object variable
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(innerExpr)) {
        // Check if this variable name is suspicious
        const isSuspicious = errorProperties.some(prop => 
          innerExpr.toLowerCase().includes(prop.toLowerCase())
        );
        
        if (isSuspicious || innerExpr.includes('data') || innerExpr.includes('Data') || 
            innerExpr.includes('report') || innerExpr.includes('Report')) {
          issues.push({
            line: index + 1,
            expression: expr,
            variable: innerExpr,
            content: line.trim(),
            severity: isSuspicious ? 'high' : 'medium'
          });
        }
      }
    });
  });
  
  // Check for specific error properties
  errorProperties.forEach(prop => {
    const regex = new RegExp(`\\b${prop}\\b`, 'g');
    lines.forEach((line, index) => {
      if (regex.test(line) && line.includes('{') && line.includes('}')) {
        // Check if this property is being rendered
        const renderPattern = new RegExp(`\\{[^}]*\\b${prop}\\b[^}]*\\}`, 'g');
        const matches = line.match(renderPattern);
        if (matches) {
          matches.forEach(match => {
            // Skip if it has property access
            if (!match.includes('.')) {
              issues.push({
                line: index + 1,
                expression: match,
                variable: prop,
                content: line.trim(),
                severity: 'critical'
              });
            }
          });
        }
      }
    });
  });
  
  return issues;
}

function main() {
  console.log(`${colors.yellow}Scanning for potential object rendering issues...${colors.reset}\n`);
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findJSXFiles(srcDir);
  
  console.log(`Found ${files.length} JSX/TSX files to check\n`);
  
  let totalIssues = 0;
  const fileIssues = [];
  
  files.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      fileIssues.push({ file: path.relative(process.cwd(), file), issues });
    }
  });
  
  if (totalIssues === 0) {
    console.log(`${colors.green}✓ No suspicious object rendering patterns found${colors.reset}`);
  } else {
    console.log(`${colors.red}Found ${totalIssues} potential issues:${colors.reset}\n`);
    
    // Sort by severity
    fileIssues.forEach(({ file, issues }) => {
      console.log(`${colors.yellow}${file}:${colors.reset}`);
      
      // Group by severity
      const critical = issues.filter(i => i.severity === 'critical');
      const high = issues.filter(i => i.severity === 'high');
      const medium = issues.filter(i => i.severity === 'medium');
      
      if (critical.length > 0) {
        console.log(`  ${colors.red}Critical issues:${colors.reset}`);
        critical.forEach(issue => {
          console.log(`    Line ${issue.line}: ${issue.expression}`);
          console.log(`      ${issue.content}`);
        });
      }
      
      if (high.length > 0) {
        console.log(`  ${colors.yellow}High priority issues:${colors.reset}`);
        high.forEach(issue => {
          console.log(`    Line ${issue.line}: ${issue.expression}`);
          console.log(`      ${issue.content}`);
        });
      }
      
      if (medium.length > 0) {
        console.log(`  Medium priority issues:`);
        medium.forEach(issue => {
          console.log(`    Line ${issue.line}: ${issue.expression}`);
        });
      }
      
      console.log();
    });
    
    console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
    console.log('1. Check each flagged expression to ensure it\'s not rendering an object directly');
    console.log('2. Use property access (e.g., {user.name}) instead of {user}');
    console.log('3. For debugging, wrap suspicious variables with safeRender() from debugObjectRendering.js');
    console.log('4. Use JSON.stringify() for objects you want to display for debugging');
  }
}

// Run the script
main();