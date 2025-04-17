# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Deployment

### Netlify Deployment

This project is configured for deployment to Netlify. The following files ensure proper routing:

- `public/_redirects`: Ensures all routes redirect to index.html for SPA routing
- `netlify.toml`: Contains build configuration and redirects

To deploy to Netlify:

1. Run the PowerShell deployment script:
   ```powershell
   .\deploy.ps1
   ```

2. Verify the built files in the `dist` directory include the `_redirects` file.

3. Deploy using the Netlify CLI or connect your repository for continuous deployment.

### PowerShell Commands

When using PowerShell, use separate commands instead of the `&&` operator:

```powershell
# INCORRECT in PowerShell:
cd frontend && pnpm run dev

# CORRECT in PowerShell:
cd frontend
pnpm run dev
```

### SPA Routing

The application uses client-side routing with React Router. To ensure this works correctly in all environments:

1. Keep the `_redirects` file in the `public` directory
2. Maintain the redirects configuration in `netlify.toml`
3. Use the verification pages (`/deploy-check.html` and `/netlify-deploy-check.txt`) to confirm proper configuration

For troubleshooting routing issues, visit:
- Netlify's documentation on [redirects](https://docs.netlify.com/routing/redirects/)
- The [deploy-check.html](/deploy-check.html) page on your deployed site

## Testing

This project uses Vitest for unit and integration testing, along with React Testing Library for component testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Utilities

#### Supabase Mock Utilities

For testing components and services that interact with Supabase, we've created a comprehensive mock utility in `src/utils/tests/supabaseMock.ts`. This utility provides:

- In-memory data storage for tests
- Mock implementations of Supabase query builders
- Authentication and storage method mocks

Example usage:

```typescript
import { mockSupabase, resetMockData, seedMockData } from '../utils/tests/supabaseMock';

describe('My Test Suite', () => {
  beforeEach(() => {
    // Reset mock data
    resetMockData();
    
    // Seed test data
    seedMockData({
      users: [{ id: 'user1', email: 'test@example.com' }],
      products: [{ id: 'product1', name: 'Test Product' }]
    });
  });
  
  it('fetches data correctly', async () => {
    // Use the mock in tests
    const { data } = await mockSupabase
      .from('products')
      .select('*')
      .execute();
      
    expect(data).toHaveLength(1);
  });
});
```

For more information about the mock utilities, see the README in `src/utils/tests/README.md`.

#### API Testing

We use the mock Supabase client for API tests. You can inject the mock client into API classes for testing:

```typescript
import { ProductAPI } from '../api/testableApi';
import { mockSupabase } from '../utils/tests/supabaseMock';

// Create API with mock client
const productApi = new ProductAPI(mockSupabase);

// Test API methods
const products = await productApi.getProducts();
```

#### Component Testing

For component tests, we use React Testing Library with custom mocks for Supabase, context providers, and other dependencies. See examples in the `src/tests/components` directory.

## Supabase MCP Integration

This project supports the Model Context Protocol (MCP) for AI-assisted development with Supabase. We've created comprehensive documentation to help you get started:

- [MCP Quick Start Guide](./docs/mcp-quick-start.md) - Get set up in 5 minutes
- [Complete Setup Guide](./docs/mcp-setup.md) - Detailed instructions and troubleshooting
- [Example Queries](./docs/mcp-example-queries.md) - SokoClick-specific queries to try

With MCP configured, you can use AI assistants like Claude in Cursor to:
- Query the SokoClick database directly
- Generate optimized SQL for frontend components
- Explore database schema and relationships
- Get help with testing and mock data

See the [official Supabase MCP documentation](https://supabase.com/docs/guides/getting-started/mcp) for more information.
