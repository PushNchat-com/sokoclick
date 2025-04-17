#!/usr/bin/env node

/**
 * Admin Translation Checker
 * 
 * This script scans the admin components to identify potentially hard-coded strings
 * that should be translated using the i18n framework.
 * 
 * Usage:
 *   node admin-translation-checker.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to scan
const ADMIN_COMPONENTS_PATH = path.resolve(__dirname, '../src/components/admin');
const ADMIN_PAGES_PATH = path.resolve(__dirname, '../src/pages/admin');

// Lists to hold potential issues
const hardCodedTexts = [];
const potentialMissingTranslations = [];

/**
 * Scan a file for hard-coded text nodes
 */
function scanFile(filePath) {
  // Skip non-TSX/JSX files
  if (!['.tsx', '.jsx'].some(ext => filePath.endsWith(ext))) {
    return;
  }
  
  console.log(`📄 Scanning ${path.relative(path.resolve(__dirname, '..'), filePath)}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Parse the file
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    // Traverse the AST
    traverse.default(ast, {
      // Check JSX text elements
      JSXText(path) {
        const text = path.node.value.trim();
        if (text.length > 3 && !text.startsWith('{') && !text.match(/^\d+$/)) {
          const lineNumber = path.node.loc.start.line;
          hardCodedTexts.push({
            file: filePath,
            text,
            line: lineNumber,
            type: 'JSXText',
          });
        }
      },
      
      // Check string literals in JSX attributes
      JSXAttribute(path) {
        if (
          path.node.name.name !== 'className' && 
          path.node.name.name !== 'style' && 
          path.node.name.name !== 'id' &&
          path.node.name.name !== 'type' &&
          path.node.name.name !== 'href' &&
          path.node.name.name !== 'src' &&
          path.node.name.name !== 'alt' &&
          path.node.name.name !== 'key' &&
          path.node.name.name !== 'data-testid'
        ) {
          const value = path.node.value;
          
          if (value && value.type === 'StringLiteral' && value.value.length > 3) {
            const lineNumber = path.node.loc.start.line;
            hardCodedTexts.push({
              file: filePath,
              text: value.value,
              line: lineNumber,
              type: 'JSXAttribute',
              attribute: path.node.name.name,
            });
          }
        }
      },
      
      // Check for potential t function calls with string literals
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          (callee.type === 'Identifier' && callee.name === 't') ||
          (callee.type === 'MemberExpression' && 
           callee.property.type === 'Identifier' && 
           callee.property.name === 't')
        ) {
          if (
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === 'StringLiteral'
          ) {
            const key = path.node.arguments[0].value;
            // Check if key is not in proper naming format
            if (!key.includes('.') || key.startsWith(' ') || key.endsWith(' ')) {
              const lineNumber = path.node.loc.start.line;
              potentialMissingTranslations.push({
                file: filePath,
                key,
                line: lineNumber,
                issue: 'Potentially malformed translation key',
              });
            }
          }
        }
      },
    });
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
  }
}

/**
 * Scan a directory recursively
 */
function scanDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      scanFile(fullPath);
    }
  }
}

// Main function
function main() {
  console.log('🔍 Starting Admin Translation Check...');
  
  // Scan admin components
  console.log('\n📁 Scanning admin components directory...');
  scanDirectory(ADMIN_COMPONENTS_PATH);
  
  // Scan admin pages
  console.log('\n📁 Scanning admin pages directory...');
  scanDirectory(ADMIN_PAGES_PATH);
  
  // Report findings
  console.log('\n📊 Translation Check Results:');
  
  if (hardCodedTexts.length === 0 && potentialMissingTranslations.length === 0) {
    console.log('✅ No issues found! All text appears to be properly translated.');
    return;
  }
  
  // Report hard-coded text
  if (hardCodedTexts.length > 0) {
    console.log(`\n❌ Found ${hardCodedTexts.length} potentially hard-coded strings that should be translated:`);
    hardCodedTexts.forEach(({ file, text, line, type, attribute }) => {
      const relPath = path.relative(path.resolve(__dirname, '..'), file);
      console.log(`  - ${relPath}:${line} - ${type}${attribute ? ` (${attribute})` : ''}: "${text}"`);
    });
    
    console.log('\n💡 To fix hard-coded strings:');
    console.log('  1. Import the translation function: import { useTranslation } from "react-i18next";');
    console.log('  2. Add the hook in your component: const { t } = useTranslation();');
    console.log('  3. Replace text with translation keys: t("admin.componentName.textKey")');
    console.log('  4. Add the key to your translation files');
  }
  
  // Report potentially malformed translation keys
  if (potentialMissingTranslations.length > 0) {
    console.log(`\n⚠️ Found ${potentialMissingTranslations.length} potentially malformed translation keys:`);
    potentialMissingTranslations.forEach(({ file, key, line, issue }) => {
      const relPath = path.relative(path.resolve(__dirname, '..'), file);
      console.log(`  - ${relPath}:${line} - ${issue}: "${key}"`);
    });
    
    console.log('\n💡 To fix malformed translation keys:');
    console.log('  1. Use a structured key format: "section.subsection.element"');
    console.log('  2. For admin components: "admin.componentName.elementName"');
    console.log('  3. Ensure the key exists in your translation files');
  }
  
  console.log('\n✨ Translation check complete!');
}

// Run the main function
main(); 