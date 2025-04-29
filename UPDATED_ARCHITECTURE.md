# SokoClick Updated Architecture Guide

This document outlines the target architecture and guidelines following the refactoring process, aiming to prevent future duplication and maintain code health.

## 1. Directory Structure

The current directory structure within `frontend/src` is generally sound. Maintain the separation of concerns:

```
frontend/src/
├── assets/         # Static assets (images, fonts)
├── clients/        # API client configurations (e.g., Supabase)
├── components/     # Reusable UI components
│   ├── admin/      # Components specific to the admin dashboard
│   │   └── tabs/   # Specific tabs within the admin dashboard
│   ├── auth/       # Authentication related components
│   ├── product/    # Product display components (e.g., ProductCard)
│   ├── ui/         # Generic UI elements (Button, Input, Modal, etc.)
│   └── ...
├── config/         # Application configuration
├── contexts/       # React Context providers (Auth, Language, etc.)
├── hooks/          # Custom React Hooks (data fetching, state logic)
├── layouts/        # Page layout structures (e.g., MainLayout, AdminLayout)
├── lib/            # Core libraries, external service integrations (non-data)
├── pages/          # Top-level page components corresponding to routes
├── services/       # Data fetching and manipulation logic (interacts with Supabase)
├── store/          # State management (if using Zustand, Redux, or similar; includes LanguageContext)
├── styles/         # Global styles, Tailwind setup
├── types/          # TypeScript type definitions (including supabase-types.ts)
├── utils/          # Utility functions (formatting, validation, helpers)
└── ...             # Other root files (App.tsx, main.tsx)
```

**Key Principles:**
*   Keep components small and focused.
*   Place components specific to a feature (like admin) within a subdirectory.
*   Separate data-fetching/mutation logic into `services/` or custom `hooks/`.
*   Use `utils/` for pure, reusable functions.
*   Define shared types in `types/`. Ensure `supabase-types.ts` is updated via `npm run gen:types` after any schema change.

## 2. Shared Modules & Abstractions

*   **Admin Data Hook:**
    *   **`useAdminDashboardData` (`hooks/useAdminDashboardData.ts`):** This hook is the single source of truth for data required by the admin dashboard overview and analytics sections. It encapsulates fetching stats, metrics, activities, and detailed analytics, handling loading and error states.
*   **Core Services:**
    *   **`services/slots.ts`:** Contains functions for interacting with the `auction_slots` table (fetching, updating live/draft status, etc.). May need an admin-specific counterpart or extensions for approval workflows.
    *   **`services/analytics.ts`:** Contains functions for fetching/subscribing to `analytics_events` and activities.
    *   **`services/auth.ts`:** Handles user authentication.
    *   **`services/users.ts`:** Handles fetching/updating user data (including sellers).
*   **Utility Functions (`utils/`):**
    *   Consolidate common formatting (dates, currency), validation (WhatsApp numbers, form inputs), and helper functions here.
    *   Examples: `formatDate`, `formatCurrency`, `validateWhatsAppNumber`, `cn` (for classnames).
*   **UI Components (`components/ui/`):**
    *   Maintain a library of generic, reusable UI components (Button, Modal, Input, Select, Spinner, ErrorMessage, etc.) styled with Tailwind CSS.

## 3. Guidelines to Prevent Future Duplication

*   **Centralize Data Fetching:** For related data needed across multiple components within a feature (like the admin dashboard), use a single custom hook (`useAdminDashboardData`) to fetch and provide the data via context or prop drilling. Avoid fetching the same data in multiple child components.
*   **Utilize Shared Services:** Before writing new data fetching logic, check existing services (`services/*`) for relevant functions.
*   **Create Reusable Hooks:** If complex stateful logic or side effects are needed in multiple components, extract them into a custom hook (`hooks/*`).
*   **Build Generic UI Components:** Design UI components (`components/ui/*`) to be configurable via props rather than creating slightly different versions for each use case.
*   **Leverage Utility Functions:** For common, pure logic (validation, formatting), create functions in `utils/*` instead of repeating the logic inline.
*   **Strict Schema Alignment:** Always refer to `types/supabase-types.ts` (kept up-to-date with `npm run gen:types`) and the SQL migrations when interacting with Supabase data. Ensure frontend logic correctly uses field names (`live_*`, `draft_*`, `slot_status`, `draft_status`) and expected data types/enums.
*   **Code Reviews:** Actively look for duplication and adherence to the established architecture during code reviews.
*   **Regular Audits:** Periodically revisit the codebase (especially after major feature additions) to identify and refactor any emerging duplication or dead code.

By adhering to this structure and these guidelines, the SokoClick codebase will remain more maintainable, scalable, and easier for developers to navigate. 