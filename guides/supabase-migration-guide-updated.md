# Supabase Migration Guide

This guide helps you update your code to use the new centralized Supabase configuration.

## Overview

We've centralized our Supabase client instantiation to:
1. Ensure consistent configuration across the application
2. Add proper TypeScript typing
3. Implement connection monitoring and testing utilities
4. Improve error handling and environment variable validation

## Migration Steps

### 1. Update your imports

**Before:**
```typescript
import { supabase } from '../lib/supabaseClient';
// or
import { supabase } from '../services/supabase';
```

**After:**
```typescript
import { supabase } from '@/services/supabase';
// or more specifically
import { supabase } from '@/services/supabase/index';
```

### 2. Use the new connection testing utilities

The centralized configuration includes new utilities for testing and monitoring your Supabase connection:

```typescript
import { testConnection, checkConnectionHealth, monitorConnection } from '@/services/supabase';

// Test the connection with detailed metrics
async function checkDatabase() {
  const status = await testConnection();
  console.log(`Connected: ${status.isConnected}, Latency: ${status.latency}ms`);
  
  if (!status.isConnected) {
    console.error('Connection error:', status.error);
  }
}

// Set up connection monitoring
const stopMonitoring = monitorConnection(
  60000, // Check every minute
  (status) => {
    if (!status.isConnected) {
      console.error('Database connection lost');
      // Show notification to user
    }
  }
);

// Later, stop monitoring when component unmounts
useEffect(() => {
  return () => stopMonitoring();
}, []);
```

### 3. Take advantage of TypeScript types

The new configuration uses TypeScript types that mirror our database schema:

```typescript
import { supabase } from '@/services/supabase';
import type { Product, InsertProduct } from '@/types/supabase-types';

// TypeScript will enforce the correct shape of your data
const newProduct: InsertProduct = {
  name_en: 'Product Name',
  name_fr: 'Nom du Produit',
  price: 9.99,
  currency: 'XAF',
  image_urls: ['https://example.com/image.jpg'],
  seller_id: '123',
  seller_whatsapp: '+123456789',
  status: 'pending'
};

const { data, error } = await supabase
  .from('products')
  .insert(newProduct)
  .select()
  .single();

// data will be properly typed as Product | null
```

## Tools to Assist Migration

### Automated Migration Script

We've created a script to help you identify and automatically update imports:

```bash
# Run in report mode (shows what would change)
node scripts/update-supabase-imports.js

# Run in fix mode (applies the changes)
node scripts/update-supabase-imports.js --fix
```

The script:
- Scans all TypeScript/JavaScript files in the src directory
- Identifies imports from the deprecated paths
- Reports files and line numbers that need updating
- Optionally updates the imports automatically with the `--fix` flag

### CI/CD Validation

A GitHub workflow has been added to validate that no code is using the old Supabase client:

```yaml
# Located at: frontend/.github/workflows/validate-supabase-imports.yml
name: Validate Supabase Imports

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/src/**/*.ts'
      - 'frontend/src/**/*.tsx'
  pull_request:
    branches: [ main, develop ]
```

The workflow:
- Checks for imports from the deprecated `lib/supabaseClient` path
- Ensures no direct calls to `createClient` outside the centralized config
- Runs automatically on pull requests and pushes to main/develop branches

If the workflow fails, you'll need to update the imports in the flagged files.

## Testing Connection Utilities

The new Supabase module includes comprehensive tests for the connection utilities:

```bash
# Run the Supabase connection tests
npm test -- src/services/supabase/__tests__/connection.test.ts
```

Tests cover:
- Successful and failed connection scenarios
- Connection health checks with latency monitoring
- Continuous connection monitoring with status change notifications

## Important Changes

1. **Environment Variables**: The configuration now strictly validates the presence of Supabase environment variables at startup.

2. **Error Logging**: Connection errors are now consistently logged and can be monitored.

3. **Type Safety**: All database operations now use TypeScript types that match our schema.

4. **Testing**: New utilities for testing connections are available.

5. **Robust Error Handling**: The client includes better error handling and retry mechanisms.

## Transition Timeline

- **Phase 1 (Current)**: The old client location is maintained but deprecated, with forwarding to the new client.
- **Phase 2 (Next Release)**: Warning logs will be added when using the deprecated paths.
- **Phase 3 (Future Release)**: The deprecated files will be removed completely.

## Affected Files and Services

The primary files affected by this change:

- `frontend/src/lib/supabaseClient.ts` (deprecated)
- `frontend/src/services/supabase.ts` (now re-exports from centralized location)
- `frontend/src/services/supabase/config.ts` (new centralized client)
- `frontend/src/services/supabase/connection.ts` (new monitoring utilities)
- `frontend/src/services/supabase/index.ts` (main export point)
- `frontend/src/types/supabase-types.ts` (database type definitions)

## Additional Resources

- [Supabase TypeScript Documentation](https://supabase.io/docs/reference/javascript/typescript-support)
- [Database Schema Reference](../../supabase/migrations/20240615120500_sokoclick_initial_schema.sql) 