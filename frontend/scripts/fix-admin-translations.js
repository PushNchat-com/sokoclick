#!/usr/bin/env node

/**
 * Admin Translation Fixer
 * 
 * This script adds missing admin translation keys identified by verify-admin-translations.js
 * to both English and French translation files.
 * 
 * Usage:
 *   node fix-admin-translations.js [--dry-run] [--interactive]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname); // This is the correct way to get the root directory

// Constants
const ADMIN_REPORT_PATH = path.resolve(rootDir, 'admin-translation-report.md');
const EN_TRANSLATION_PATH = path.resolve(rootDir, 'public/locales/en/translation.json');
const FR_TRANSLATION_PATH = path.resolve(rootDir, 'public/locales/fr/translation.json');

/**
 * Create readline interface for interactive mode
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Load translations from a file
 */
function loadTranslations(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error loading translations from ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Save translations to a file
 */
function saveTranslations(filePath, translations, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] Would save translations to ${filePath}`);
    return;
  }

  try {
    fs.writeFileSync(
      filePath, 
      JSON.stringify(translations, null, 2), 
      'utf8'
    );
    console.log(`✅ Saved translations to ${filePath}`);
  } catch (error) {
    console.error(`Error saving translations to ${filePath}:`, error.message);
  }
}

/**
 * Parse the admin translation report to extract suggested keys and texts
 */
function parseAdminReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found: ${reportPath}`);
    console.error(`Run verify-admin-translations.js first to generate the report.`);
    process.exit(1);
  }

  const report = fs.readFileSync(reportPath, 'utf8');
  const lines = report.split('\n');
  
  const suggestions = [];
  let currentComponent = '';
  
  lines.forEach(line => {
    // Match component headers
    const componentMatch = line.match(/^## (.+)$/);
    if (componentMatch) {
      currentComponent = componentMatch[1];
      return;
    }
    
    // Match table rows with suggested keys
    const tableRowMatch = line.match(/\| \d+ \| (.+?) \| `(.+?)` \| `(.+?)` \|/);
    if (tableRowMatch) {
      suggestions.push({
        component: currentComponent,
        text: tableRowMatch[1].replace(/\\\|/g, '|'), // Unescape pipe characters
        key: tableRowMatch[2],
        context: tableRowMatch[3].replace(/\\\|/g, '|') // Unescape pipe characters
      });
    }
  });
  
  return suggestions;
}

/**
 * Set a nested property in an object by key path
 */
function setNestedProperty(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  
  // Navigate to the last level
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Create the nested object if it doesn't exist
    if (!current[key]) {
      current[key] = {};
    } else if (typeof current[key] !== 'object') {
      // Convert primitive to object if needed
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the value at the deepest level
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Add missing translations interactively
 */
async function addTranslationsInteractive(suggestions, enTranslations, frTranslations) {
  const rl = createInterface();
  
  const updatedEn = { ...enTranslations };
  const updatedFr = { ...frTranslations };
  let addedCount = 0;
  
  for (const suggestion of suggestions) {
    const { key, text, component, context } = suggestion;
    
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Component: ${component}`);
    console.log(`Context: ${context}`);
    console.log(`Suggested Key: ${key}`);
    console.log(`English Text: ${text}`);
    
    const answer = await new Promise(resolve => {
      rl.question('Add this translation? (y/n/e/s) ', resolve);
    });
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'e') {
      // Add with default values
      setNestedProperty(updatedEn, key, text);
      
      if (answer.toLowerCase() === 'e') {
        // Edit the French translation
        const frText = await new Promise(resolve => {
          rl.question(`Enter French translation: `, resolve);
        });
        setNestedProperty(updatedFr, key, frText);
      } else {
        // Use placeholder for French
        setNestedProperty(updatedFr, key, `[FR] ${text}`);
      }
      
      addedCount++;
    } else if (answer.toLowerCase() === 's') {
      console.log('Skipping remaining suggestions...');
      break;
    }
  }
  
  rl.close();
  return { updatedEn, updatedFr, addedCount };
}

/**
 * Add missing translations automatically
 */
function addTranslationsAuto(suggestions, enTranslations, frTranslations) {
  const updatedEn = { ...enTranslations };
  const updatedFr = { ...frTranslations };
  let addedCount = 0;
  
  suggestions.forEach(({ key, text }) => {
    setNestedProperty(updatedEn, key, text);
    setNestedProperty(updatedFr, key, `[FR] ${text}`);
    addedCount++;
  });
  
  return { updatedEn, updatedFr, addedCount };
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Admin Translation Fixer');
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const interactive = args.includes('--interactive');
  
  if (dryRun) {
    console.log('Running in dry-run mode - no changes will be saved');
  }
  
  // Load translations
  const enTranslations = loadTranslations(EN_TRANSLATION_PATH);
  const frTranslations = loadTranslations(FR_TRANSLATION_PATH);
  
  // Parse the admin translation report
  const suggestions = parseAdminReport(ADMIN_REPORT_PATH);
  console.log(`Found ${suggestions.length} suggested translations in the report`);
  
  // Filter out keys that already exist
  const missingTranslations = suggestions.filter(({ key }) => {
    const parts = key.split('.');
    let current = enTranslations;
    
    for (const part of parts) {
      if (!current || current[part] === undefined) {
        return true;
      }
      current = current[part];
    }
    
    return false;
  });
  
  console.log(`${missingTranslations.length} translations are missing and need to be added`);
  
  if (missingTranslations.length === 0) {
    console.log('No missing translations to add, exiting.');
    return;
  }
  
  let result;
  
  if (interactive) {
    console.log('Running in interactive mode');
    result = await addTranslationsInteractive(missingTranslations, enTranslations, frTranslations);
  } else {
    console.log('Running in automatic mode');
    result = addTranslationsAuto(missingTranslations, enTranslations, frTranslations);
  }
  
  const { updatedEn, updatedFr, addedCount } = result;
  
  // Save translations
  if (addedCount > 0) {
    saveTranslations(EN_TRANSLATION_PATH, updatedEn, dryRun);
    saveTranslations(FR_TRANSLATION_PATH, updatedFr, dryRun);
    console.log(`✅ Added ${addedCount} translation keys`);
  } else {
    console.log('No translations were added');
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 