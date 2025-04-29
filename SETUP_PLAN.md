# SokoClick Implementation Plan

This document outlines the step-by-step implementation plan for launching SokoClick within 48 hours. The plan is divided into phases with specific tasks, commands, and configurations needed for successful implementation.

## Project Overview

SokoClick is a mobile-first ecommerce auction platform with 25 dedicated slots, each containing product information directly. The platform will serve the Cameroonian market only, supporting both English and French languages, with WhatsApp integration for communication and payment on delivery methods only.

## Tech Stack

- **Frontend**: React with Vite, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime, Edge Functions)
- **Hosting**: Netlify with CI/CD integration
- **CDN**: Supabase Storage (utilizing its built-in CDN capabilities)
- **Monitoring**: Sentry, UptimeRobot (Optional)

## Day 1 (First 24 Hours)

### Phase 1: Infrastructure Setup (4 hours)

#### 1.1 - Project Repository Setup
```bash
# Create a new repository on GitHub
# Clone the repository locally
git clone https://github.com/PushNchat-com/sokoclick.git
cd sokoclick

# Initialize React+Vite project with TypeScript and Tailwind CSS
pnpm create vite@latest frontend -- --template react-ts # Create in a frontend subdir
cd frontend
pnpm install
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd .. # Back to root

# Setup Supabase project folder
mkdir supabase
cd supabase
supabase init # Initialize Supabase config
cd ..

# Configure Tailwind CSS (in frontend/tailwind.config.js)
```

#### 1.2 - Supabase Setup (New Project)
- Create a new project via the Supabase Dashboard (supabase.com).
- Note the Project URL and anon key.

#### 1.3 - Netlify Setup
- Connect your GitHub repository to Netlify.
- Configure build settings:
  - **Base directory**: `frontend`
  - **Build command**: `pnpm build`
  - **Publish directory**: `frontend/dist`
- Add Environment Variables in Netlify UI:
  - `VITE_SUPABASE_URL`: (Your new project URL)
  - `VITE_SUPABASE_ANON_KEY`: (Your new project anon key)

#### 1.4 - Prepare & Apply Initial Database Schema
- Create the migration file (if not already done):
  ```bash
  # Navigate to supabase folder
  cd supabase
  # Create migrations folder if it doesn't exist
  mkdir -p migrations
  # Create the initial migration file (replace timestamp)
  touch migrations/20240701100000_create_core_schema.sql
  cd ..
  ```
- **Populate `migrations/20240701100000_create_core_schema.sql`** with the final schema definition (including `users`, `auction_slots`, `analytics_events`, RLS, functions, etc.).
- **Apply the Schema:**
  - Go to the Supabase Dashboard for your new project.
  - Navigate to the SQL Editor.
  - Paste the entire content of `migrations/20240701100000_create_core_schema.sql`.
  - **Review carefully** and run the script.
- **Create Initial Admin User:**
  - In Supabase Dashboard -> Authentication -> Users, Add/Invite the admin user (e.g., `sokoclick.com@gmail.com`).
  - In Supabase Dashboard -> Table Editor -> `users` table, **manually add/update the row** for the admin user:
    - Set `id` to the user's Auth UID.
    - Set `role` to `'admin'`.
    - Fill other necessary details (name, WhatsApp number if applicable).

### Phase 2: Core Component & Service Stubbing (8 hours)

#### 2.1 - Frontend Project Structure Setup
- Ensure the `frontend/src` directory structure is organized (components, hooks, layouts, pages, services, store, types, utils).
- **Generate Supabase Types:**
  ```bash
  # Link local supabase project to remote
  cd supabase
  supabase login
  supabase link --project-ref <your-new-project-ref>

  # Generate types based on the applied schema
  # Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are accessible or pass keys directly
  supabase gen types typescript --project-id <your-new-project-ref> --schema public > ../frontend/src/types/supabase-types.ts
  cd ..
  ```

#### 2.2 - Base UI Components
- Create basic reusable UI components (`Button`, `Card`, `Modal`, `Skeleton`, `Icons`, etc.) in `frontend/src/components/ui`.

#### 2.3 - Service Layer Setup (`frontend/src/services`)
- Set up the Supabase client configuration (`supabase/config.ts`, `supabase/index.ts`) using environment variables.
- Create service files (`slots.ts`, `users.ts`, `analytics.ts`).
- Define initial functions signatures based on the schema (e.g., `fetchSlots`, `fetchSlotById`, `saveDraft`, `publishDraftToLive`, `fetchUsers`, `updateUserRole`, `logAnalyticsEvent`). Implement basic Supabase calls using the generated types.

#### 2.4 - Component Stubbing
- Create placeholder components for key areas:
  - `HomePage.tsx`: Basic layout, maybe a placeholder grid.
  - `SlotCard.tsx`: Structure to display basic slot info.
  - `AdminLayout.tsx`, `AdminDashboard.tsx`: Basic structure and navigation.
  - `SlotManagementPage.tsx`: Placeholder for slot grid/controls.
  - `Auth Components` (`Login.tsx`, `Signup.tsx`):
- **State Management Setup (`frontend/src/store`):**
  - Set up basic state management (e.g., Zustand or Context) for Language and Auth state.

### Phase 3: Frontend Refactoring - Slot Display & HomePage (12 hours)

#### 3.1 - Refactor `HomePage.tsx`
- Fetch slot data using `useSlots` from `services/slots.ts`.
- Display the 25 slots using a grid.
- Implement `SlotCard.tsx` to display `live_product_*` data for 'live' slots.
- Show empty/maintenance states correctly.
- Implement basic filtering/sorting UI (connected to service layer later).
- Integrate `EmptySlotCard.tsx` for non-live slots.

#### 3.2 - Refactor `SlotCard.tsx`
- Adapt props to accept data derived from the `Slot` type (live product details, status, seller info).
- Fetch associated seller info if needed (using `live_product_seller_id`).
- Display time remaining based on `end_time`.
- Include WhatsApp button linking to the seller.

#### 3.3 - Refactor `ProductDetails.tsx` / Create `SlotDetailPage.tsx`
- Create or adapt a page/component to show detailed view of a single *live* slot's content.
- Fetch data for a specific slot using its ID.
- Display all relevant `live_product_*` fields, images (`ImageGallery`), seller info, delivery info, etc.

## Day 2 (Second 24 Hours)

### Phase 4: Frontend Refactoring - Admin Dashboard (12 hours)

#### 4.1 - Refactor Admin Authentication & Layout
- Ensure admin login works correctly (`AdminLogin.tsx`).
- Implement `AdminLayout.tsx` with proper navigation.
- Secure admin routes based on user role (`admin`).

#### 4.2 - Refactor `SlotManagementPage.tsx` & Related Components
- Implement `SlotGridConnected.tsx` / `SlotGridAccessible.tsx` to display all 25 slots with their `slot_status` and `draft_status`.
- Allow selection of a slot.
- Create/Refactor `SlotDetailPanel.tsx` (or similar) that appears upon selection.
- This panel should contain:
  - View of current live content (read-only).
  - **Draft Editing Form**: Inputs for all `draft_product_*` fields, including `draft_seller_whatsapp_number`.
  - **Draft Image Uploader**: Interface to upload/manage images for `draft_product_image_urls` (using `SlotImageUploader.tsx` or similar).
  - Actions: Save Draft, Publish Draft, Set Maintenance, Clear Live Content.
- Connect actions to `services/slots.ts` functions (`saveDraft`, `publishDraftToLive`, `setSlotMaintenance`, `removeProductFromSlot`).

#### 4.3 - Refactor `UserManagement.tsx`
- Fetch users using `services/users.ts`.
- Display users (sellers, admins) with roles and verification status.
- Implement functionality to change user roles (especially assigning 'admin' or 'seller').
- Implement seller verification updates.

#### 4.4 - Implement `DashboardMetrics.tsx`
- Connect to `services/analytics.ts` and `services/slots.ts` (stats) to display key metrics.

### Phase 5: Code Cleanup & Documentation Update (4 hours)

#### 5.1 - Delete Obsolete Code
- Remove `services/products.ts`.
- Remove `components/admin/ProductApprovalWorkflow.tsx`, `AdminProductList.tsx`, `ProductForm.tsx`.
- Remove `pages/AdminProductsPage.tsx`.
- Remove `components/product/ProductList.tsx`, `ProductListItem.tsx` (confirm if needed elsewhere).

#### 5.2 - Update Documentation
- Ensure `README.md`, `SETUP_PLAN.md`, `slot-system-architecture.md`, `admin-dashboard-design.md` are consistent.
- Delete `guides/supabase-migration-guide.md` and any other obsolete docs.

### Phase 6: Testing, Deployment & Final Polish (8 hours)

#### 6.1 - Testing
- End-to-end testing of core flows (viewing slots, admin login, editing/publishing draft, user management).
- Responsive testing.
- WhatsApp integration testing.
- Bilingual testing.

#### 6.2 - Production Deployment
- Build frontend: `cd frontend && pnpm build`.
- Ensure Netlify deployment uses the correct environment variables for the *new* Supabase project.
- Trigger production deployment.

#### 6.3 - Monitoring Setup
- Integrate Sentry for error tracking.
- Set up basic uptime monitoring (e.g., UptimeRobot).

#### 6.4 - Launch Checklist & Handover
- Final checks.
- Update any remaining documentation.

## Post-Launch (First Week)

### Daily Monitoring
- Track user engagement metrics
- Monitor WhatsApp button clicks
- Identify and fix any emerging issues
- Gather user feedback
- Analyze product slot performance

### Quick Iterations
- Address priority bugs within 24 hours
- Implement minor UX improvements based on feedback
- Optimize image loading for slower connections
- Fine-tune admin workflow based on actual usage

### Documentation Updates
- Update documentation based on real-world usage
- Document common admin procedures
- Create troubleshooting guide
- Record standard operating procedures for platform management