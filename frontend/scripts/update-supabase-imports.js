#!/usr/bin/env node

/**
 * This script helps find and update Supabase imports in your codebase to use
 * the new centralized client from '@/services/supabase'.
 * 
 * Usage:
 *   node scripts/update-supabase-imports.js [--fix]
 * 
 * Options:
 *   --fix   Automatically update the imports (without this flag, it just reports)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const OLD_IMPORT_PATTERNS = [
  "from '../lib/supabaseClient'",
  "from \"../lib/supabaseClient\"",
  "from './supabase'"
];
const NEW_IMPORT = "from '@/services/supabase'";
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Parse arguments
const shouldFix = process.argv.includes('--fix');
const isVerbose = process.argv.includes('--verbose');

console.log(`
🔍 Scanning for deprecated Supabase imports...
${shouldFix ? '⚠️  FIX MODE ENABLED - files will be modified' : '📋 REPORT MODE - no files will be modified'}
`);

/**
 * Find all files with a specific extension in directory (recursive)
 */
function findFiles(dir, extensions) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name === 'node_modules') continue;
      files = [...files, ...findFiles(fullPath, extensions)];
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Search a file for old import patterns
 */
function findOldImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];
  
  for (const pattern of OLD_IMPORT_PATTERNS) {
    if (content.includes(pattern)) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
          matches.push({
            lineNumber: i + 1,
            line: lines[i].trim(),
            pattern
          });
        }
      }
    }
  }
  
  return matches;
}

/**
 * Update imports in a file
 */
function updateImports(filePath, matches) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const match of matches) {
    // Get the whole import statement
    const importLine = match.line;
    
    // Create the replacement with the new import path
    let updatedLine = importLine.replace(match.pattern, NEW_IMPORT);
    
    // Replace the line in the file content
    content = content.replace(importLine, updatedLine);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Main function
 */
function main() {
  // Find all TypeScript/JavaScript files
  const files = findFiles(SRC_DIR, FILE_EXTENSIONS);
  console.log(`Found ${files.length} files to scan`);
  
  // Track statistics
  const stats = {
    filesWithOldImports: 0,
    totalOldImports: 0,
    filesFixed: 0
  };
  
  const filesWithOldImports = [];
  
  // Scan each file
  for (const file of files) {
    const matches = findOldImports(file);
    
    if (matches.length > 0) {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      filesWithOldImports.push({ path: relativePath, matches });
      
      stats.filesWithOldImports++;
      stats.totalOldImports += matches.length;
      
      if (shouldFix) {
        updateImports(file, matches);
        stats.filesFixed++;
      }
    }
  }
  
  // Print results
  console.log('\n📊 Scan Results:');
  console.log(`- Files scanned: ${files.length}`);
  console.log(`- Files with old imports: ${stats.filesWithOldImports}`);
  console.log(`- Total old imports found: ${stats.totalOldImports}`);
  
  if (shouldFix) {
    console.log(`- Files fixed: ${stats.filesFixed}`);
  }
  
  if (filesWithOldImports.length > 0) {
    console.log('\n📝 Details:');
    
    for (const file of filesWithOldImports) {
      console.log(`\n${file.path}:`);
      
      for (const match of file.matches) {
        console.log(`  - Line ${match.lineNumber}: ${match.line}`);
        if (shouldFix) {
          const updatedLine = match.line.replace(match.pattern, NEW_IMPORT);
          console.log(`    Updated to: ${updatedLine}`);
        }
      }
    }
    
    if (!shouldFix) {
      console.log('\n💡 To automatically fix these imports, run:');
      console.log('  node scripts/update-supabase-imports.js --fix');
    }
  } else {
    console.log('\n✅ No old Supabase imports found. Your codebase is using the centralized client!');
  }
}

// Run the script
main(); 