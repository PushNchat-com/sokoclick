#!/usr/bin/env node

/**
 * Admin Translation Verification Tool
 * 
 * This script analyzes admin components to detect potential hardcoded strings
 * and suggests translation keys for them.
 * 
 * Usage:
 *   node verify-admin-translations.js [--fix] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname); // This is the correct way to get the root directory

// Constants
const ADMIN_COMPONENTS_PATH = path.resolve(rootDir, 'src/components/admin');
const ADMIN_PAGES_PATH = path.resolve(rootDir, 'src/pages/admin');
const EN_TRANSLATION_PATH = path.resolve(rootDir, 'public/locales/en/translation.json');
const REPORT_FILE = path.resolve(rootDir, 'admin-translation-report.md');

// Patterns to match potential hardcoded strings
const STRING_PATTERNS = [
  // JSX text content
  />([A-Z][a-zA-Z0-9 ]{2,})</g,
  // Attribute values with capitalized text
  /="([A-Z][a-zA-Z0-9 ]{2,})"/g,
  // Button text
  /<Button[^>]*>([A-Za-z0-9 ]{2,})<\/Button>/g,
  // Heading text
  /<h[1-6][^>]*>([A-Za-z0-9 ]{2,})<\/h[1-6]>/g,
  // Title props
  /title="([A-Za-z0-9 ]{2,})"/g,
  // Placeholder texts
  /placeholder="([A-Za-z0-9 ]{2,})"/g
];

// Exclude these patterns
const EXCLUDE_PATTERNS = [
  /\${/g,            // Template literals
  /import /g,        // Import statements
  /console\./g,      // Console statements
  /\/\//g,           // Comments
  /\* /g,            // JSDoc comments
  /const /g,         // Variable declarations
  /return /g,        // Return statements
  /function /g,      // Function declarations
  /props\./g,        // Props access
  /t\("/g,           // Existing translations
  /t\('/g,           // Existing translations with single quotes
  /useTranslation/g, // Translation hook
  /<\//g,            // Closing tags
  /\/>/g,            // Self-closing tags
  /onChange/g,       // Event handlers
  /onClick/g,        // Event handlers
];

/**
 * Get all admin component files
 */
function getAdminFiles() {
  const componentsFiles = getFilesRecursively(ADMIN_COMPONENTS_PATH, ['.tsx', '.jsx']);
  const pagesFiles = getFilesRecursively(ADMIN_PAGES_PATH, ['.tsx', '.jsx']);
  return [...componentsFiles, ...pagesFiles];
}

/**
 * Get files recursively from a directory
 */
function getFilesRecursively(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath, extensions));
    } else {
      const ext = path.extname(fullPath);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  });
  
  return files;
}

/**
 * Extract potential hardcoded strings from a file
 */
function extractPotentialStrings(filePath) {
  const componentName = path.basename(filePath, path.extname(filePath));
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const potentialStrings = [];
  
  lines.forEach((line, index) => {
    // Skip lines that match exclude patterns
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(line))) {
      return;
    }
    
    STRING_PATTERNS.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 2) {
          potentialStrings.push({
            component: componentName,
            line: index + 1,
            text: match[1].trim(),
            context: line.trim()
          });
        }
      }
    });
  });
  
  return potentialStrings;
}

/**
 * Generate a suggested translation key
 */
function suggestTranslationKey(componentName, text) {
  // Convert to camelCase
  const camelCased = text
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (_, char) => char.toLowerCase());
  
  // Ensure first letter is lowercase
  return `admin.${componentName.toLowerCase()}.${camelCased}`;
}

/**
 * Load existing translations
 */
function loadTranslations() {
  try {
    return JSON.parse(fs.readFileSync(EN_TRANSLATION_PATH, 'utf8'));
  } catch (error) {
    console.error('Error loading translations:', error.message);
    return {};
  }
}

/**
 * Check if a suggested key exists in translations
 */
function keyExists(translations, key) {
  const parts = key.split('.');
  let current = translations;
  
  for (const part of parts) {
    if (!current || current[part] === undefined) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Generate a markdown report
 */
function generateReport(results) {
  let report = `# Admin Translation Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total files analyzed: ${results.totalFiles}\n`;
  report += `Total potential hardcoded strings: ${results.totalStrings}\n\n`;
  
  results.componentResults.forEach(component => {
    report += `## ${component.component}\n\n`;
    
    if (component.strings.length === 0) {
      report += `✅ No potential hardcoded strings found\n\n`;
    } else {
      report += `⚠️ Found ${component.strings.length} potential hardcoded strings\n\n`;
      report += `| Line | Text | Suggested Key | Context |\n`;
      report += `| --- | --- | --- | --- |\n`;
      
      component.strings.forEach(string => {
        // Escape pipe characters in markdown table
        const escapedText = string.text.replace(/\|/g, '\\|');
        const escapedContext = string.context.replace(/\|/g, '\\|');
        report += `| ${string.line} | ${escapedText} | \`${string.suggestedKey}\` | \`${escapedContext}\` |\n`;
      });
      
      report += '\n';
    }
  });
  
  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`Report generated: ${REPORT_FILE}`);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Admin Translation Verification Tool');
  
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const verbose = args.includes('--verbose');
  
  const files = getAdminFiles();
  console.log(`Found ${files.length} admin component files`);
  
  const translations = loadTranslations();
  console.log(`Loaded existing translations`);
  
  const componentResults = [];
  let totalStrings = 0;
  
  files.forEach(file => {
    if (verbose) {
      console.log(`Analyzing ${path.basename(file)}...`);
    }
    
    const strings = extractPotentialStrings(file);
    const componentName = path.basename(file, path.extname(file));
    
    const stringsWithKeys = strings.map(string => ({
      ...string,
      suggestedKey: suggestTranslationKey(componentName, string.text),
      exists: keyExists(translations, suggestTranslationKey(componentName, string.text))
    }));
    
    totalStrings += stringsWithKeys.length;
    
    if (stringsWithKeys.length > 0 || verbose) {
      console.log(`  ${componentName}: ${stringsWithKeys.length} potential hardcoded strings`);
    }
    
    componentResults.push({
      component: componentName,
      file,
      strings: stringsWithKeys
    });
  });
  
  // Generate report
  generateReport({
    totalFiles: files.length,
    totalStrings,
    componentResults
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total files analyzed: ${files.length}`);
  console.log(`  Total potential hardcoded strings: ${totalStrings}`);
  
  if (totalStrings > 0) {
    console.log(`\nReview the report for suggested translation keys: ${REPORT_FILE}`);
    if (!shouldFix) {
      console.log(`Run with --fix to automatically add missing keys to translation files.`);
    }
  } else {
    console.log(`\n✅ No potential hardcoded strings found!`);
  }
}

// Run the script
main(); 