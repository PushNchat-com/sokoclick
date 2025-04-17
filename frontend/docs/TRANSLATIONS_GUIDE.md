# SokoClick Translations Guide

This document provides a comprehensive guide for managing translations in the SokoClick application.

## Table of Contents

1. [Translation System Overview](#translation-system-overview)
2. [File Structure](#file-structure)
3. [Adding New Translations](#adding-new-translations)
4. [Translation Key Naming Conventions](#translation-key-naming-conventions)
5. [Tools for Translation Management](#tools-for-translation-management)
6. [Common Pitfalls](#common-pitfalls)
7. [Best Practices](#best-practices)

## Translation System Overview

SokoClick uses [react-i18next](https://react.i18next.com/) for internationalization. The application currently supports English and French, with English being the default language.

## File Structure

Translation files are located in:

```
/frontend/public/locales/en/translation.json   # English translations
/frontend/public/locales/fr/translation.json   # French translations
```

## Adding New Translations

1. Always add translations to **both** language files.
2. Use the same key structure in both files.
3. When adding a new component with UI text, add all translation keys first.
4. After adding new translations, run the `translation-sync.js` script to verify consistency.

Example translation key addition:

```json
// English (translation.json)
{
  "feature": {
    "title": "Feature Title",
    "description": "Feature description text"
  }
}

// French (translation.json)
{
  "feature": {
    "title": "Titre de la Fonctionnalité",
    "description": "Texte de description de la fonctionnalité"
  }
}
```

## Translation Key Naming Conventions

Keys should follow these conventions:
- Use camelCase for key names
- Use dot notation for nesting
- Keep keys organized by feature or component
- Use noun.verb.state pattern for complex scenarios
- Use singular nouns for single items, plural for multiple items

### Key Organization Structure

```
admin.                 # Admin dashboard and features
user.                  # User-related features
transaction.           # Transaction-related features
common.                # Common UI elements
errors.                # Error messages
validation.            # Validation messages
feature.               # Feature-specific translations
```

### Parameter Usage

Use parameters where text needs to include variables:

```json
{
  "admin": {
    "userCount": "{{count}} users registered"
  }
}
```

In code:
```javascript
t('admin.userCount', { count: 42 })
```

## Tools for Translation Management

The project includes several tools to help manage translations:

- `translation-sync.js` - Checks for missing translation keys between language files
- `verify-admin-translations.js` - Specifically verifies admin-related translations
- `fix-admin-translations-french.js` - Fixes missing French admin translations

To run these tools:

```bash
# Check for any inconsistencies in translations
node translation-sync.js

# Add missing translations automatically (adds placeholder text)
node translation-sync.js --fix

# Verify admin translations
node verify-admin-translations.js
```

## Common Pitfalls

1. **Hardcoded text in components**: Always use translation keys instead of hardcoded strings.
2. **Missing translations in one language**: Always add to both English and French files.
3. **Inconsistent capitalization**: Maintain consistent case treatment (Title Case, Sentence case, etc.).
4. **Different key structures**: Maintain the same nesting structure in both language files.
5. **References to unused keys**: Some components might reference keys that don't exist.
6. **Duplicate keys with slightly different names**: Avoid variations of the same content.

## Best Practices

1. **Use feature prefixes**: Group related translations under a common prefix (`admin.users.*`).
2. **Keep translation files synchronized**: Run the sync script regularly.
3. **Add translations before implementing UI**: Add translations early in the development cycle.
4. **Use descriptive key names**: Make keys self-descriptive.
5. **Comment complex translations**: Add code comments for context-dependent translations.
6. **Avoid HTML in translation strings**: Keep formatting separate from content.
7. **Organize keys alphabetically**: Within each section for easier scanning.
8. **Don't split sentences**: Avoid creating keys for fragments of sentences.

### Examples

Good:
```javascript
// Good - Complete translation key
<h1>{t('admin.dashboard.title')}</h1>
```

Bad:
```javascript
// Bad - Hardcoded text
<h1>Admin Dashboard</h1>

// Bad - Fragmented translation
<h1>{t('admin.dashboard')} {t('common.title')}</h1>
```

## Adding a New Component with Translations

1. Define all text that will appear in the UI
2. Create translation keys for each text element
3. Add keys to both language files
4. Use the translation hook in your component
5. Verify all translations appear correctly in both languages
6. Run the sync script to ensure all keys are present

---

**Note**: For any questions or clarifications about translations, please contact the development team. 