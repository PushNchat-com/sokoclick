#!/usr/bin/env node

/**
 * Translation Synchronization Tool
 * 
 * This script compares the English and French translation files to identify missing keys.
 * It can also fix the missing keys by copying them from one language to another.
 * 
 * Usage:
 *   node translation-sync.js           - Check for missing keys
 *   node translation-sync.js --fix     - Fix missing keys by copying from English to French
 * 
 * The fix option will add the English text to the French file with a "[NEEDS TRANSLATION]" prefix
 * to make it obvious which entries need to be translated properly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the translation files
const EN_TRANSLATION_PATH = path.resolve(__dirname, '../public/locales/en/translation.json');
const FR_TRANSLATION_PATH = path.resolve(__dirname, '../public/locales/fr/translation.json');

// Function to flatten a nested object
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
    } else {
      acc[`${pre}${key}`] = obj[key];
    }
    return acc;
  }, {});
}

// Function to set a nested property in an object
function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return obj;
}

// Main function to sync translations
function syncTranslations() {
  console.log('\n🔍 Starting translation synchronization check...');

  // Read the translation files
  const enTranslations = JSON.parse(fs.readFileSync(EN_TRANSLATION_PATH, 'utf8'));
  const frTranslations = JSON.parse(fs.readFileSync(FR_TRANSLATION_PATH, 'utf8'));

  // Flatten the objects for comparison
  const flattenedEn = flattenObject(enTranslations);
  const flattenedFr = flattenObject(frTranslations);

  const enKeys = Object.keys(flattenedEn);
  const frKeys = Object.keys(flattenedFr);

  console.log(`📊 English translations: ${enKeys.length} keys`);
  console.log(`📊 French translations: ${frKeys.length} keys`);

  // Find keys missing in French
  const missingInFr = enKeys.filter(key => !frKeys.includes(key));
  
  // Find keys missing in English
  const missingInEn = frKeys.filter(key => !enKeys.includes(key));

  // Report the findings
  if (missingInFr.length === 0 && missingInEn.length === 0) {
    console.log('✅ Perfect! All translation keys are synchronized between English and French.');
    return;
  }

  if (missingInFr.length > 0) {
    console.log(`\n❌ Found ${missingInFr.length} keys missing in French:`);
    missingInFr.forEach(key => {
      console.log(`  - ${key}: "${flattenedEn[key]}"`);
    });
  }

  if (missingInEn.length > 0) {
    console.log(`\n❌ Found ${missingInEn.length} keys missing in English:`);
    missingInEn.forEach(key => {
      console.log(`  - ${key}: "${flattenedFr[key]}"`);
    });
  }

  // Fix missing keys if --fix flag is provided
  const shouldFix = process.argv.includes('--fix');
  if (shouldFix) {
    console.log('\n🔧 Fixing missing translation keys...');
    
    // Add missing French keys
    if (missingInFr.length > 0) {
      let updatedFrTranslations = JSON.parse(JSON.stringify(frTranslations));
      
      missingInFr.forEach(key => {
        const value = `[NEEDS TRANSLATION] ${flattenedEn[key]}`;
        updatedFrTranslations = setNestedProperty(updatedFrTranslations, key, value);
      });
      
      fs.writeFileSync(
        FR_TRANSLATION_PATH,
        JSON.stringify(updatedFrTranslations, null, 2),
        'utf8'
      );
      console.log(`✅ Added ${missingInFr.length} missing keys to French translations.`);
    }
    
    // Add missing English keys
    if (missingInEn.length > 0) {
      let updatedEnTranslations = JSON.parse(JSON.stringify(enTranslations));
      
      missingInEn.forEach(key => {
        const value = `[NEEDS TRANSLATION] ${flattenedFr[key]}`;
        updatedEnTranslations = setNestedProperty(updatedEnTranslations, key, value);
      });
      
      fs.writeFileSync(
        EN_TRANSLATION_PATH,
        JSON.stringify(updatedEnTranslations, null, 2),
        'utf8'
      );
      console.log(`✅ Added ${missingInEn.length} missing keys to English translations.`);
    }
  } else {
    console.log('\n💡 To automatically fix missing keys, run:');
    console.log('  node translation-sync.js --fix');
  }

  console.log('\n✨ Translation check complete!');
}

// Run the sync function
syncTranslations(); 