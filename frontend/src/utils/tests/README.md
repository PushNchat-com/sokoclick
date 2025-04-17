# Supabase Testing Utilities

This directory contains utilities for testing components and services that rely on Supabase.

## Overview

Testing components and services that interact with Supabase can be challenging. The utilities in this directory help create predictable test environments by:

1. Mocking the Supabase client
2. Providing in-memory data storage for tests
3. Simulating Supabase API responses

## Files

- `setup.ts` - Global test setup for Vitest, including basic Supabase mocks
- `supabaseMock.ts` - Advanced Supabase client mock with CRUD operations and query builder simulation

## Using the Supabase Mock

The `supabaseMock.ts` file provides a more comprehensive mock for Supabase that includes:

- In-memory data store
- Query builder simulation (select, filter, range, etc.)
- Authentication methods
- Storage operations

### Basic Usage

```typescript
import { mockSupabase, resetMockData, seedMockData } from '../utils/tests/supabaseMock';
import { describe, it, expect, beforeEach } from 'vitest';

describe('My Component Tests', () => {
  beforeEach(() => {
    // Reset mock data before each test
    resetMockData();
    
    // Seed with test data
    seedMockData({
      users: [
        { id: 'user1', email: 'test@example.com' }
      ],
      products: [
        { id: 'product1', name: 'Test Product', seller_id: 'user1' }
      ]
    });
  });

  it('should fetch data from Supabase', async () => {
    // Use the mock in your test
    const { data } = await mockSupabase
      .from('products')
      .select('*')
      .execute();
      
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test Product');
  });
});
```

### Injecting into Services

For testing services that use Supabase, you can inject the mock client:

```typescript
import { mockSupabase } from '../utils/tests/supabaseMock';
import { MyService } from '../services/MyService';

// Create service with mock client
const service = new MyService(mockSupabase);

// Now test the service methods
const result = await service.getProducts();
```

### Available Methods

The mock supports the following Supabase client methods:

- `from(table).select(fields)` - Select data from a table
- Query filters: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `in`, `is`
- `order(field, options)` - Order results
- `limit(count)` - Limit results
- `range(start, end)` - Pagination
- `single()` - Get a single record
- `execute()` - Execute a query
- `auth.signUp()`, `auth.signIn()`, `auth.signOut()`, `auth.getUser()`
- `storage.from(bucket).upload()`, `getPublicUrl()`, `remove()`

## Known Limitations

- The mock doesn't support real-time subscriptions
- Complex joins may not be fully supported
- The storage functionality is limited to basic operations
- RLS policies are not simulated

## Contributing

If you need additional mock functionality, please extend the mock utilities as needed and update this documentation. 