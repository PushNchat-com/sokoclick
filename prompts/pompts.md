SokoClick prompts Template

🧠 Context:

We are working on a TypeScript-based React project using Vite as the build tool and Supabase as the backend. The architecture includes multiple reusable components and services.



You are a senior full-stack AI coding assistant helping debug and fix an issue in a TypeScript-based React (Vite) project using Supabase as the backend. Here's an error log from the browser/console:



Your task:

Diagnose the root cause of this error with advanced logical reasoning.

Explain clearly what is causing the issue (e.g., incorrect import/export, missing type, circular dependency, outdated build).

Implement a precise fix that solves the issue without introducing any side effects or breaking any existing functionality in the codebase.

Do not change unrelated code. Maintain existing project structure, naming conventions, and integration patterns (React + Vite + TypeScript + Supabase).

If the fix involves modifying an import/export, verify that the source file has the right named or default export, and update the importing file accordingly.

If applicable, suggest improvements or validation checks to prevent similar issues in the future.

Before applying the fix, double-check that the module path is correct and the exported members from the file match what's being imported.

Output the updated code with clear indications of what was changed, and optionally provide a brief explanation of the solution for human developers reviewing it. 

# Authentication System Documentation

## Architecture
- Supabase provides backend auth services
- UnifiedAuthContext manages auth state in React
- Protected routes use PrivateRoute and AdminRoute components

## User Roles
- CUSTOMER: Regular user access
- SELLER: Vendor access
- ADMIN: Administrative access
- SUPER_ADMIN: Full system access

## Auth Flow
1. User signs up/logs in through Supabase Auth
2. Session established with JWT token
3. User profile fetched with role information
4. UnifiedAuthProvider distributes auth state to components
5. Protected routes check auth state and user role 