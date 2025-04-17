#!/usr/bin/env node

/**
 * Admin Translation Key Generator
 * 
 * This script generates translation key templates for admin components
 * and adds them to the translation files if they don't already exist.
 * 
 * Usage:
 *   node generate-admin-translation-keys.js [--dry-run] [--component=ComponentName]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

// Paths
const ADMIN_COMPONENTS_PATH = path.resolve(__dirname, 'src/components/admin');
const ADMIN_PAGES_PATH = path.resolve(__dirname, 'src/pages/admin');
const EN_TRANSLATION_PATH = path.resolve(__dirname, 'public/locales/en/translation.json');
const FR_TRANSLATION_PATH = path.resolve(__dirname, 'public/locales/fr/translation.json');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const componentArg = args.find(arg => arg.startsWith('--component='));
const targetComponent = componentArg ? componentArg.split('=')[1] : null;

// Common UI elements for admin components
const COMMON_UI_ELEMENTS = {
  titles: {
    pageTitle: "Page Title",
    sectionTitle: "Section Title",
    modalTitle: "Modal Title", 
    formTitle: "Form Title"
  },
  actions: {
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    view: "View",
    refresh: "Refresh",
    export: "Export",
    import: "Import",
    filter: "Filter",
    search: "Search",
    clear: "Clear",
    apply: "Apply"
  },
  messages: {
    loading: "Loading...",
    noData: "No data available",
    error: "An error occurred",
    success: "Operation successful",
    confirmDelete: "Are you sure you want to delete this item?",
    required: "This field is required"
  },
  tables: {
    noResults: "No results found",
    rowsPerPage: "Rows per page",
    of: "of",
    next: "Next",
    previous: "Previous"
  },
  filters: {
    filterBy: "Filter by",
    status: "Status",
    date: "Date",
    category: "Category",
    reset: "Reset Filters"
  },
  placeholders: {
    search: "Search...",
    selectDate: "Select date",
    selectOption: "Select an option"
  },
  tooltips: {
    info: "Information",
    settings: "Settings",
    help: "Help",
    moreOptions: "More options"
  }
};

/**
 * Get component files
 */
function getComponentFiles() {
  const componentFiles = [];
  
  // Helper to scan directory
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (
        (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) && 
        !file.name.includes('.test.') && 
        !file.name.includes('.spec.')
      ) {
        // Check for target component if specified
        if (!targetComponent || 
            file.name.replace(/\.(tsx|jsx)$/, '') === targetComponent ||
            file.name.includes(targetComponent)) {
          componentFiles.push({
            path: fullPath,
            name: file.name.replace(/\.(tsx|jsx)$/, '')
          });
        }
      }
    }
  }
  
  // Scan admin components and pages
  scanDir(ADMIN_COMPONENTS_PATH);
  scanDir(ADMIN_PAGES_PATH);
  
  return componentFiles;
}

/**
 * Generate keys for a component
 */
function generateKeysForComponent(componentName) {
  const formattedName = componentName
    .replace(/([A-Z])/g, ' $1')
    .trim();
  
  // Create base structure
  const keys = {
    [`admin.${componentName}.title`]: `${formattedName}`,
    [`admin.${componentName}.description`]: `Manage and view ${formattedName.toLowerCase()}`,
  };
  
  // Add common UI elements
  Object.entries(COMMON_UI_ELEMENTS).forEach(([category, elements]) => {
    Object.entries(elements).forEach(([elementKey, value]) => {
      keys[`admin.${componentName}.${category}.${elementKey}`] = value;
    });
  });
  
  return keys;
}

/**
 * Update translation file with new keys
 */
function updateTranslationFile(filePath, newKeys) {
  // Read existing translations
  const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let addedCount = 0;
  
  // Add new keys if they don't exist
  for (const [key, value] of Object.entries(newKeys)) {
    if (!hasNestedProperty(translations, key)) {
      setNestedProperty(translations, key, filePath.includes('/fr/') ? `[NEEDS TRANSLATION] ${value}` : value);
      addedCount++;
    }
  }
  
  // Write back if changes were made
  if (addedCount > 0 && !isDryRun) {
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
  }
  
  return addedCount;
}

/**
 * Check if object has a nested property
 */
function hasNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (let part of parts) {
    if (current === undefined || current === null || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Set a nested property on an object
 */
function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Main function
 */
function main() {
  console.log(`🔍 ${isDryRun ? '[DRY RUN] ' : ''}Generating admin translation keys...`);
  
  // Get components
  const componentFiles = getComponentFiles();
  console.log(`Found ${componentFiles.length} admin component(s)`);
  
  if (componentFiles.length === 0) {
    console.log('No components found to process.');
    return;
  }
  
  let totalEnKeys = 0;
  let totalFrKeys = 0;
  
  // Process each component
  for (const component of componentFiles) {
    console.log(`\n📄 Processing: ${component.name}`);
    
    // Generate keys
    const keys = generateKeysForComponent(component.name);
    console.log(`  Generated ${Object.keys(keys).length} keys`);
    
    // Update English translations
    const enKeysAdded = updateTranslationFile(EN_TRANSLATION_PATH, keys);
    totalEnKeys += enKeysAdded;
    console.log(`  Added ${enKeysAdded} keys to English translations${isDryRun ? ' (dry run)' : ''}`);
    
    // Update French translations
    const frKeysAdded = updateTranslationFile(FR_TRANSLATION_PATH, keys);
    totalFrKeys += frKeysAdded;
    console.log(`  Added ${frKeysAdded} keys to French translations${isDryRun ? ' (dry run)' : ''}`);
  }
  
  console.log(`\n✅ Done! Added ${totalEnKeys} English keys and ${totalFrKeys} French keys${isDryRun ? ' (dry run)' : ''}`);
  
  if (isDryRun) {
    console.log('This was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main(); 