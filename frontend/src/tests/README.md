# Sokoclick Testing Guide

This directory contains tests for the Sokoclick frontend application. It includes:

- Component tests
- API tests
- Utility tests

## Testing Approach

We use the following technologies for our testing:

- [Vitest](https://vitest.dev/) as the test runner
- [Testing Library](https://testing-library.com/) for rendering and interacting with components
- [Jest DOM](https://github.com/testing-library/jest-dom) for DOM assertions

## Test Structure

Each test file follows a similar structure:

1. Imports and setup
2. Mocks (if needed)
3. Test cases grouped by `describe` blocks
4. Assertions using `expect`

## Running Tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- src/tests/components/ProductList.test.tsx
```

To run tests in watch mode:

```bash
npm test -- --watch
```

## Mocking Strategies

### Supabase Mocking

We have a dedicated utility for mocking Supabase interactions located at `src/utils/tests/supabaseMock.ts`. This provides:

- In-memory data store
- Mock query builder
- Authentication methods

Example usage:

```typescript
import { mockSupabase, resetMockData, seedMockData } from '../../utils/tests/supabaseMock';

beforeEach(() => {
  resetMockData();
  seedMockData({
    users: [{ id: 'user1', name: 'Test User' }],
    products: [{ id: 'product1', name: 'Test Product' }]
  });
});

test('my test', async () => {
  // Test with seeded data
});
```

### Component Testing

For component tests, we generally follow these principles:

1. Prefer testing user behavior over implementation details
2. Use `render` to mount components
3. Use `screen` queries to find elements (e.g., `getByText`, `queryByTestId`)
4. Use `userEvent` for interactions like clicking or typing
5. Use `waitFor` or `findBy` queries for asynchronous assertions

Example:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

test('shows success message when button is clicked', async () => {
  render(<MyComponent />);
  
  // Simulate user clicking a button
  await userEvent.click(screen.getByText('Submit'));
  
  // Wait for async operation to complete
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

## Test Data

We maintain test data in the test files themselves rather than in separate fixture files to keep tests self-contained and easier to understand.

## CI/CD Integration

Tests are automatically run on pull requests and before deployments to ensure code quality. Tests must pass before code can be merged or deployed. 