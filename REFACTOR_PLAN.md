# SokoClick Refactoring Plan

This document outlines the steps to refactor the codebase based on the findings in `CLEANUP_REPORT.md`, focusing on consolidating logic, removing dead code, and aligning with the current database schema.

**Branching Strategy:** Create a dedicated feature branch for this refactoring effort (e.g., `refactor/admin-dashboard-cleanup`). Commit changes incrementally for each major step.

**Rollback Strategy:** If major issues arise, revert specific commits or the entire branch. Ensure automated tests pass at each step.

## Step 1: Consolidate Admin Dashboard Data Fetching

1.  **Modify `useAdminDashboardData` (`frontend/src/hooks/useAdminDashboardData.ts`):**
    *   Remove reliance on the (soon-to-be-deleted) `adminMetrics.ts` service.
    *   Integrate logic to fetch `totalViews` and `whatsappClicks` directly using `analyticsService` or Supabase client queries on `analytics_events`.
    *   Integrate logic to fetch detailed analytics data (views/clicks by date/slot) based on a date range parameter. Handle the removal of `ip_address` reference.
    *   Ensure it fetches counts for pending approvals (`draft_status = 'ready_to_publish'` on `auction_slots`).
    *   Keep fetching `activities` using `analyticsService`.
    *   Keep using `useSlotStats` for slot status counts.
    *   Add state management for the analytics date range.
    *   Update the hook's return type to include all necessary data (stats, metrics, activities, detailed analytics, date range state/setter).

2.  **Refactor `AdminDashboard` (`frontend/src/pages/AdminDashboard.tsx`):**
    *   Update the component to use the enhanced `useAdminDashboardData` hook.
    *   Manage the analytics date range state using the state/setter provided by the hook.
    *   Pass the necessary data down as props to `OverviewTab` and `AnalyticsTab`.
    *   Pass the date range state and setter down to `AnalyticsTab` (or a date range picker component).
    *   Handle loading and error states centrally based on the hook's status.

3.  **Refactor `DashboardMetrics` (`frontend/src/components/admin/DashboardMetrics.tsx`):**
    *   Remove internal `useEffect` for data fetching and the call to `getAdminMetrics`.
    *   Remove the `withLoading` HOC if loading/error is handled by `AdminDashboard`.
    *   Modify the component to accept `stats` (from `useSlotStats` via hook) and `metrics` (from hook) as props.
    *   Display metrics based on the passed props.

4.  **Refactor `AnalyticsComponent` (`frontend/src/components/admin/AnalyticsComponent.tsx`):**
    *   Remove internal `useEffect` for data fetching, `isLoading`, `error` states, and the call to `getAnalyticsMetrics`.
    *   Remove the internal date range state management.
    *   Modify the component to accept detailed analytics data (e.g., `viewsByDate`, `clicksBySlot`, etc.) as props.
    *   Render charts based on the passed props.

5.  **Refactor `AnalyticsTab` (`frontend/src/components/admin/tabs/AnalyticsTab.tsx`):**
    *   Accept detailed analytics data, date range state, and date range setter function as props from `AdminDashboard`.
    *   Pass the data down to `AnalyticsComponent`.
    *   Render a date range picker component and connect it to the state/setter.

## Step 2: Remove Obsolete Code

1.  **Delete Service:** Delete the file `frontend/src/services/adminMetrics.ts`.
2.  **Clean Imports:** Remove imports related to `adminMetrics.ts` from all files.

## Step 3: Refactor Product/Approval Management

*This is a significant step and requires careful implementation based on the UI/UX defined in `admin-dashboard-design.md`.*

1.  **Audit `ProductsTab` & `ApprovalsTab`:** Identify all components rendered within these tabs.
2.  **Refactor/Replace Components:**
    *   Any component designed to list/manage data from the old `products` table needs replacement or heavy refactoring.
    *   Create/modify components to display `auction_slots` data.
    *   **Approvals Workflow:** Focus on `auction_slots` with `draft_status = 'ready_to_publish'`. Components should display `draft_*` fields and allow admins to approve (copy `draft_*` to `live_*`, set `slot_status='live'`, clear `draft_*`, set `draft_status='empty'`) or reject (clear `draft_*`, set `draft_status='empty'`, potentially notify seller).
    *   **Product/Slot Management:** Focus on displaying all 25 `auction_slots`. Components should show `live_*` data for `live` slots, allow viewing/editing `draft_*` data, manage `slot_status` ('empty', 'live', 'maintenance'), and potentially assign approved drafts to empty slots.
    *   Ensure all interactions use the `auction_slots` table via Supabase service calls (likely needing updates in `frontend/src/services/slots.ts` or a new dedicated admin service).

## Step 4: Dependency Cleanup

1.  **Choose ClassName Library:** Decide between `classnames` and `clsx`. Assume `clsx`.
2.  **Replace Usage:** Search project-wide for `classnames` usage and replace with `clsx` (often used with `tailwind-merge`).
3.  **Uninstall:** Run `npm uninstall classnames @types/classnames`.
4.  **Verify Polyfills:** Check browser support targets. If `IntersectionObserver` and `ResizeObserver` are natively supported, run `npm uninstall intersection-observer resize-observer-polyfill`.

## Step 5: Verification

1.  **Run Type Checking:** Execute `npm run type-check` to catch any TypeScript errors.
2.  **Run Linter/Formatter:** Execute `npm run lint:fix` and `npm run format`.
3.  **Run Tests:** Execute `npm test` (or `npm run test:watch` during development). Add/update tests for the refactored `useAdminDashboardData` hook and any new/modified components.
4.  **Manual Testing:** Thoroughly test the Admin Dashboard:
    *   Verify all metrics and charts load correctly in Overview and Analytics tabs.
    *   Test date range filtering in Analytics.
    *   Test the entire product approval workflow in Approvals tab.
    *   Test managing slots and products in the Products tab.
    *   Verify all actions correctly update the `auction_slots` table in Supabase.

## Step 6: Merge & Deploy

1.  Ensure all tests pass and manual verification is complete.
2.  Merge the `refactor/admin-dashboard-cleanup` branch into the main development branch.
3.  Deploy changes to a staging environment for final checks before production. 