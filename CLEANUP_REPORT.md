# SokoClick Code Cleanup Report

This report details identified redundancies, unused code, and potential schema mismatches found during the codebase audit.

## 1. Duplicated Logic & Data Fetching

*   **Cluster:** Admin Dashboard Metrics & Analytics Fetching
    *   **Files Involved:**
        *   `frontend/src/components/admin/DashboardMetrics.tsx`
        *   `frontend/src/components/admin/AnalyticsComponent.tsx`
        *   `frontend/src/services/adminMetrics.ts`
        *   `frontend/src/hooks/useAdminDashboardData.ts`
    *   **Issue:** Both `DashboardMetrics` and `AnalyticsComponent` fetch their own data using `adminMetrics.ts`, duplicating effort and potentially fetching redundant data already available or fetchable via the central `useAdminDashboardData` hook used in `AdminDashboard.tsx`.
    *   **Proposed Abstraction:** Consolidate all data fetching for the admin dashboard (stats, basic metrics, activities, detailed analytics with date range) into the `useAdminDashboardData` hook. Pass data down as props to `DashboardMetrics` and `AnalyticsComponent`.
    *   **Removal Candidate:** `frontend/src/services/adminMetrics.ts` can likely be removed entirely after its logic is integrated or replaced within `useAdminDashboardData`.

## 2. Orphaned Files & Potential Dead Code

*   **Service:** `frontend/src/services/adminMetrics.ts` (See section 1)
    *   **Reason:** Logic will be moved to `useAdminDashboardData` or replaced by calls to other services (`slots`, `analytics`).
*   **Components related to `products` table:**
    *   **Files Involved:** Potentially components rendered within `frontend/src/components/admin/tabs/ProductsTab.tsx` and `frontend/src/components/admin/tabs/ApprovalsTab.tsx` (e.g., `SlotGridConnected`, `ProductApprovalWorkflow` mentioned in `AdminDashboard.tsx` comments, although not directly visible in provided files). Need further investigation.
    *   **Reason:** The database schema refactor (`20240701100000_refactor_slots_schema.sql`) removed the dedicated `products` table. All product data (live and draft) is now within `auction_slots`. Components solely interacting with the old `products` table are dead code or require complete refactoring to use `auction_slots`.
    *   **Action:** Audit components used in `ProductsTab` and `ApprovalsTab`. Remove unused ones or refactor them to work with `auction_slots` draft/live fields and statuses.

## 3. Schema Mismatches & Outdated Logic

*   **Service Logic:** `getAdminMetrics` in `adminMetrics.ts`
    *   **Issue:** Queries non-existent `products` table for `totalProducts` and `pendingApprovals`. Queries `is_active` field on `auction_slots` which no longer exists (use `slot_status = 'live'` instead).
    *   **Resolution:** Remove this service. Fetch equivalent data using correct tables/fields within `useAdminDashboardData`. Pending approvals should query `auction_slots` where `draft_status = 'ready_to_publish'`.
*   **Service Logic:** `getAnalyticsMetrics` in `adminMetrics.ts`
    *   **Issue:** References `ip_address` field on `analytics_events` table for unique visitor calculation, but this field does not exist in the schema (`20240701100000_refactor_slots_schema.sql`).
    *   **Resolution:** Remove the `ip_address` reference. Unique visitor tracking needs reconsideration based on available fields (e.g., `user_id` for logged-in users, `session_id` for anonymous users if reliably tracked).
*   **Admin Components:** Components under `ProductsTab` and `ApprovalsTab`.
    *   **Issue:** Likely designed to work with the old `products` table structure.
    *   **Resolution:** Refactor these components entirely to manage `auction_slots`, specifically interacting with `draft_*` fields and `draft_status` for approvals, and `live_*` fields for displaying live products.

## 4. Dependency Cleanup

*   **Package:** `classnames` vs `clsx`
    *   **Issue:** Both libraries are present in `package.json`. They serve the same purpose.
    *   **Resolution:** Standardize on one. `clsx` is often preferred for performance/size. If `clsx` is chosen, remove `classnames` and `@types/classnames`. Ensure `tailwind-merge` is used alongside `clsx` where appropriate.
*   **Polyfills:** `intersection-observer`, `resize-observer-polyfill`
    *   **Issue:** Might be unnecessary depending on target browser support.
    *   **Resolution:** Verify target browser requirements (e.g., using `browserslist` and checking caniuse.com). Remove if not strictly needed.

## 5. Configuration Files

*   No major issues identified in `package.json` scripts.
*   Other configuration files (`.eslintrc.js`, `vite.config.js`, etc.) were not provided for audit but should be checked for obsolete rules or settings as part of the refactoring process.
*   Ensure the `gen:types` script is run regularly to keep `supabase-types.ts` synchronized with the database schema. 