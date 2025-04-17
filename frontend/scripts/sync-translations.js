#!/usr/bin/env node

/**
 * Translation Sync Tool
 * 
 * This script synchronizes translation keys between English and French files.
 * It ensures all keys in English exist in French and vice versa.
 * 
 * Usage:
 *   node sync-translations.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname); // This is the correct way to get the root directory

// Constants
const EN_TRANSLATION_PATH = path.resolve(rootDir, 'public/locales/en/translation.json');
const FR_TRANSLATION_PATH = path.resolve(rootDir, 'public/locales/fr/translation.json');

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
 * Flatten nested object structure into a flat object with dot notation keys
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {});
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
      current[key] = { value: current[key] };
    }
    current = current[key];
  }
  
  // Set the value at the deepest level
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Get a nested property in an object by key path
 */
function getNestedProperty(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Compare two translation objects and find missing keys
 */
function findMissingKeys(source, target) {
  const flatSource = flattenObject(source);
  const flatTarget = flattenObject(target);
  
  const missingKeys = Object.keys(flatSource).filter(key => !(key in flatTarget));
  
  return missingKeys.map(key => ({
    key,
    value: flatSource[key]
  }));
}

/**
 * Add missing keys to target object
 */
function addMissingKeys(target, missingKeys, markAsNeeded = false) {
  const updated = JSON.parse(JSON.stringify(target));
  let count = 0;
  
  missingKeys.forEach(({ key, value }) => {
    // If markAsNeeded is true, prefix the value to indicate it needs translation
    const newValue = markAsNeeded ? `[NEEDS TRANSLATION] ${value}` : value;
    setNestedProperty(updated, key, newValue);
    count++;
  });
  
  return { updated, count };
}

/**
 * Print summary of missing keys
 */
function printSummary(enMissingKeys, frMissingKeys) {
  console.log('\n🔍 Translation Sync Summary:');
  console.log(`English keys missing from French: ${enMissingKeys.length}`);
  console.log(`French keys missing from English: ${frMissingKeys.length}`);
  
  if (enMissingKeys.length > 0) {
    console.log('\nSample English keys missing from French:');
    enMissingKeys.slice(0, 5).forEach(({ key, value }) => {
      console.log(`  - ${key}: "${value}"`);
    });
    
    if (enMissingKeys.length > 5) {
      console.log(`  ... and ${enMissingKeys.length - 5} more`);
    }
  }
  
  if (frMissingKeys.length > 0) {
    console.log('\nSample French keys missing from English:');
    frMissingKeys.slice(0, 5).forEach(({ key, value }) => {
      console.log(`  - ${key}: "${value}"`);
    });
    
    if (frMissingKeys.length > 5) {
      console.log(`  ... and ${frMissingKeys.length - 5} more`);
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Translation Sync Tool');
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log('Running in dry-run mode - no changes will be saved');
  }
  
  // Load translations
  const enTranslations = loadTranslations(EN_TRANSLATION_PATH);
  const frTranslations = loadTranslations(FR_TRANSLATION_PATH);
  
  console.log(`Loaded ${Object.keys(flattenObject(enTranslations)).length} English keys`);
  console.log(`Loaded ${Object.keys(flattenObject(frTranslations)).length} French keys`);
  
  // Find missing keys in both directions
  const enMissingFromFr = findMissingKeys(enTranslations, frTranslations);
  const frMissingFromEn = findMissingKeys(frTranslations, enTranslations);
  
  // Print summary
  printSummary(enMissingFromFr, frMissingFromEn);
  
  // Add missing keys
  if (enMissingFromFr.length > 0) {
    const { updated: updatedFr, count: frUpdatedCount } = addMissingKeys(
      frTranslations, 
      enMissingFromFr, 
      true
    );
    
    console.log(`\nAdding ${frUpdatedCount} missing English keys to French translations`);
    saveTranslations(FR_TRANSLATION_PATH, updatedFr, dryRun);
  }
  
  if (frMissingFromEn.length > 0) {
    const { updated: updatedEn, count: enUpdatedCount } = addMissingKeys(
      enTranslations, 
      frMissingFromEn, 
      true
    );
    
    console.log(`\nAdding ${enUpdatedCount} missing French keys to English translations`);
    saveTranslations(EN_TRANSLATION_PATH, updatedEn, dryRun);
  }
  
  if (enMissingFromFr.length === 0 && frMissingFromEn.length === 0) {
    console.log('\n✅ All translation keys are synchronized!');
  } else {
    console.log('\n✅ Translations synchronized with marked placeholders');
    console.log('Review and translate the entries marked with [NEEDS TRANSLATION]');
  }
}

// Run the script
main(); 