# SokoClick Slot System Architecture

## Overview

The slot system is the core feature of the SokoClick platform, providing a structured approach to showcasing exactly 25 featured products at any given time. This document outlines the complete architecture, implementation details, and usage patterns of the slot system across the application.

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [TypeScript Interface](#2-typescript-interface)
3. [Service Layer](#3-service-layer)
4. [Admin Components](#4-admin-components)
5. [Product-Slot Integration](#5-product-slot-integration)
6. [Frontend Display](#6-frontend-display)
7. [Approval Workflow](#7-approval-workflow)
8. [Analytics Integration](#8-analytics-integration)
9. [Slot-Based Storage System](#9-slot-based-storage-system)
10. [Architecture Patterns](#10-architecture-patterns)
11. [Special Features](#11-special-features)

## 1. Database Schema

The slot system is built around the `auction_slots` table in the PostgreSQL database:

```sql
create table public.auction_slots (
  id integer primary key check (id between 1 and 25),
  product_id uuid references public.products(id) on delete set null,
  is_active boolean default false,
  start_time timestamptz,
  end_time timestamptz,
  featured boolean default false,
  view_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_active = true and product_id is not null and start_time is not null and end_time is not null) or
    (is_active = false)
  )
);
```

Key characteristics:
- Fixed 25 slots (enforced by check constraint)
- Each slot can reference at most one product
- Slots have active/inactive status
- Time-based display with start and end times
- Featured flag for premium placement
- View count tracking

The system also uses additional fields in the `products` table:

```sql
auction_slot_id integer unique,
```

This creates a bidirectional relationship between products and slots, which helps maintain data integrity.

### Database Initialization

The 25 fixed slots are initialized during database creation:

```sql
-- Initialize 25 slots
INSERT INTO auction_slots (id, is_active, created_at, updated_at)
SELECT i, FALSE, NOW(), NOW()
FROM generate_series(1, 25) AS i;
```

### Database Indexes

To optimize query performance, the following indexes are created:

```sql
-- Auction slots table indexes
create index auction_slots_product_id_idx on public.auction_slots (product_id);
create index auction_slots_active_status_idx on public.auction_slots (is_active);
create index auction_slots_time_range_idx on public.auction_slots (start_time, end_time);
```

## 2. TypeScript Interface

The slot system is represented in the frontend by a TypeScript interface in `frontend/src/services/slots.ts`:

```typescript
export interface Slot {
  id: number;
  product_id?: string;
  product?: Product;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  status: SlotStatus;
  // Additional fields for UI state management
  reservedUntil?: string;
  reservedBy?: string;
  maintenance: boolean;
  product_name?: string;
  product_image?: string;
  price?: number;
  currency?: string;
  is_maintenance?: boolean;
}
```

The system defines four possible slot statuses:

```typescript
export enum SlotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance'
}
```

These statuses are calculated based on the current state of the slot and are not stored directly in the database.

## 3. Service Layer

The slot system is managed through the `slotService` object in `frontend/src/services/slots.ts`, which provides a comprehensive API for slot operations.

### Main Functions

#### Slot Reservation

```typescript
async reserveSlot(slotId, endTime, reservedBy): Promise<ServiceResponse>
```

Temporarily reserves a slot for a specified duration, with validations to ensure the slot is available.

#### Slot Maintenance

```typescript
async setSlotMaintenance(slotId, maintenance): Promise<ServiceResponse>
```

Sets or clears maintenance mode for a slot, preventing it from being assigned products.

#### Product Assignment

```typescript
async assignProductToSlot(slotId, productId, duration = 7): Promise<ServiceResponse>
```

Assigns a product to a slot with thorough validation checks:
- Ensures slot is available
- Verifies product exists and isn't already assigned
- Confirms product has 'approved' status
- Sets time bounds based on duration parameter (default 7 days)
- Updates both product and slot tables atomically

#### Product Removal

```typescript
async removeProductFromSlot(slotId): Promise<ServiceResponse>
```

Removes a product from a slot, resets slot properties, and automatically clears any images stored in the slot folder.

#### Statistics Retrieval

```typescript
async getSlotStats(): Promise<{
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
}>
```

Returns summary statistics of all slots by status, used for dashboard metrics and filtering tabs.

### React Hooks

The service layer also provides React hooks for consuming slot data:

#### useSlots Hook

```typescript
useSlots(filterStatus?: SlotStatus, searchTerm?: string)
```

Returns all slots with optional filtering by status or search term. Used in the admin dashboard and slot management pages.

#### useSlot Hook

```typescript
useSlot(slotId: number)
```

Returns a single slot by ID, with related product information. Used in slot detail views.

#### useSlotStats Hook

```typescript
useSlotStats()
```

Returns statistics for slot usage, used in the admin dashboard.

#### useProductBySlot Hook

```typescript
useProductBySlot(slotNumber: number)
```

Gets the product assigned to a specific slot, used in product detail pages and slot assignment workflows.

## 4. Admin Components

The slot system is primarily managed through several admin components that provide different levels of functionality.

### SlotGrid Component

`frontend/src/components/admin/SlotGrid.tsx` is the core visual representation of the slot system:

- Displays a responsive grid of 25 slot cards
- Shows product information for occupied slots
- Provides status indicators (available, occupied, reserved, maintenance)
- Includes time remaining information for slots with end times
- Supports actions: reserve, cancel reservation, toggle maintenance, remove product
- Implements responsive layouts for different screen sizes
- Provides loading states with skeletons

### SlotGridConnected Component

`frontend/src/components/admin/SlotGridConnected.tsx` adds data connectivity to the SlotGrid:

- Fetches slot data using the `useSlots` hook
- Handles service interactions and error states
- Provides loading states and error handling
- Triggers toast notifications for user feedback
- Handles refreshing data after operations

### SlotManagement Component

`frontend/src/components/admin/SlotManagement.tsx` provides a full management interface:

- Tab-based filtering of slots by status
- Search functionality
- Slot statistics display
- Action buttons for slot operations
- Undo capability for operations using the `useUndo` hook
- Bulk operations on slots
- Detailed error handling and user feedback

### StorageInitializer Component

`frontend/src/components/admin/StorageInitializer.tsx` provides tools for managing the slot-based storage system:

- Initialize all 25 slot folders in storage
- Clear images from specific slot folders
- Display success/error messages for operations
- Integrated with admin dashboard

## 5. Product-Slot Integration

The slot system is integrated with the product system in several ways to ensure consistency and user-friendly management.

### Product Assignment

Products can be assigned to slots through various interfaces:

- Directly in the SlotManagement component
- Via the AdminProductList's "Assign Slot" action
- Through the product approval workflow after a product is approved
- From the product detail page for admins

### BaseProductForm Integration

The `BaseProductForm` component integrates with the slot system for admin users:

- Allows slot selection during product creation
- Shows available slots (those without products assigned)
- Sets the initial slot ID when a product is created from a slot context
- Validates that only approved products can be assigned to slots

### Bidirectional Relationship

The system maintains a bidirectional relationship:

- Products store their assigned slot ID in the `auction_slot_id` field
- Slots store their assigned product ID in the `product_id` field
- Service methods ensure consistency between both tables
- Database constraints enforce referential integrity

## 6. Frontend Display

The slot system drives the main product display on the homepage and provides the core browsing experience.

### HomePage Component

The `HomePage` component in `frontend/src/pages/HomePage.tsx`:

- Creates grid items from slots for display
- Filters slots based on status, product approval, and categories
- Sorts products based on various criteria (newest, ending soon, price)
- Displays only approved products in active slots for regular users
- Showcases featured slots prominently
- Creates a dynamic grid layout that adjusts to available slots

### Product Detail Page

The product detail page integrates with the slot system:

- Displays slot information for products in slots
- Shows time remaining for product display
- Tracks view counts for analytics
- Provides admin actions for slot management when viewed by admins

## 7. Approval Workflow

The product approval workflow integrates with the slot system to streamline the process of getting products displayed.

### ProductApprovalWorkflow Component

`frontend/src/components/admin/ProductApprovalWorkflow.tsx`:

- Allows admins to approve or reject pending products
- Approved products become eligible for slot assignment
- After approval, products can be immediately assigned to slots
- Shows slot assignment options for approved products
- Integrates with the slot service for direct assignment

### Approval Status Integration

The system enforces rules about approval status:

- Only approved products can be assigned to slots
- If a product is rejected, it is automatically removed from any slot
- If a product becomes inactive, it is also removed from slots
- The UI reflects these status restrictions to guide admin actions

## 8. Analytics Integration

The slot system includes analytics tracking to measure performance and engagement.

### View Count Tracking

- View counts are tracked per slot in the `view_count` field
- The `log_product_view` database function increments the view count
- Views are tracked in the analytics_events table with slot_id reference
- Multiple view types are differentiated (initial view, detailed view)

### WhatsApp Click Tracking

- WhatsApp clicks are tracked and associated with slots
- Conversion rates are calculated based on views vs. WhatsApp engagement
- Performance metrics are displayed per slot

### AnalyticsComponent

The `AnalyticsComponent` in `frontend/src/components/admin/AnalyticsComponent.tsx`:

- Shows metrics related to slot performance
- Provides time-series data for slot engagement
- Compares performance across different slots
- Allows filtering by date range and slot
- Shows conversion metrics for business intelligence

## 9. Slot-Based Storage System

The slot system includes a dedicated storage architecture that organizes product images by slot number.

### Storage Structure

- Each slot has a dedicated folder in Supabase storage
- Folder naming follows the pattern: `slot-{slotNumber}`
- Images for a given product are stored only in its assigned slot's folder
- When products change slots, their images are moved or recreated in the new slot's folder

### Implementation Components

#### Slot Storage Utilities

The `slotStorage.ts` utility provides core functions for slot-based storage:

```typescript
// Initialize all 25 slot folders
initializeSlotFolders(): Promise<{ success: boolean; message: string }>

// Clear all images from a slot's folder
clearSlotImages(slotNumber: number): Promise<{ success: boolean; message: string }>

// Generate a standardized path for a slot image
getSlotImagePath(slotNumber: number, file: File, productId: string): string
```

#### FileUploadService Extensions

The `fileUpload.ts` service is extended to support slot-based uploads:

```typescript
// Add slot-aware parameters to the core upload method
uploadFile(file: File, bucket: string, path: string, options: { 
  slotNumber?: number, 
  onProgress?: (progress: number) => void 
}): Promise<ImageUploadResult>

// Add a dedicated method for slot uploads
uploadToSlot(file: File, slotNumber: number, productId: string, options: {}): Promise<ImageUploadResult>
```

#### Automatic Cleanup

When a product is removed from a slot (via `removeProductFromSlot`), the system automatically:

1. Clears all images from the slot's folder
2. Preserves the folder structure with an empty `.folder` file
3. Logs the cleanup operation for audit purposes

### Admin Interface

The `StorageInitializer` component provides admin tools for the slot storage system:

- One-click initialization of the entire 25-slot folder structure
- Interface to clear images from specific slots
- Error handling and feedback for all operations
- Integrated with the admin dashboard

### SEO Benefits

The slot-based organization provides several SEO advantages:

- Consistent URL patterns for images (`https://[storage-url]/product-images/slot-{slotNumber}/{filename}`)
- Stable URLs for slots that gain authority over time 
- Clear semantic relationship between images and their slot position
- Simplified content management when products change

### Direct Image Upload

Admins can upload images directly to specific slot folders:

- Select a slot number
- Upload files directly to that slot's folder
- Preview existing images in the slot folder
- Delete individual images from the slot folder

## 10. Architecture Patterns

The slot system follows several architectural patterns to ensure maintainability and performance.

### Repository Pattern

Clean separation between data access and business logic:
- Database operations are isolated in service methods
- Business rules are enforced at the service layer
- UI components don't directly access the database

### Hook Pattern

React hooks for data fetching and state management:
- Custom hooks encapsulate data access logic
- Components remain focused on presentation
- State management is standardized across the application

### Service Layer Pattern

Central service for all slot operations:
- All slot-related operations go through the `slotService`
- Validation and business rules are consistently applied
- Error handling is standardized

### Component Composition

Layered components from presentation to connected data:
- `SlotGrid` focuses on presentation
- `SlotGridConnected` handles data fetching
- `SlotManagement` provides complete workflow

## 11. Special Features

The slot system includes several special features that enhance its flexibility and usability.

### Undo Capability

The system supports undoing slot operations:
- State changes are tracked in the `useUndo` hook
- Operations can be reversed within a time window
- Users receive feedback about undo availability

### Maintenance Mode

Slots can be temporarily taken offline for maintenance:
- Prevents new product assignments
- Visually indicated in the admin interface
- Maintainable without losing slot configuration

### Reservation System

Slots can be reserved before product assignment:
- Creates a temporary hold on a slot
- Includes time limit for the reservation
- Indicates who made the reservation

### Featured Slots

Slots can be marked as featured for special display:
- Highlighted in the UI with special styling
- Can be sorted to appear at the top of listings
- Tracked separately for analytics purposes

### Time-based Display

Products are displayed for specific time periods:
- Start and end times control visibility
- Countdown timers show time remaining
- Automated removal when time expires

### Image Storage Integration

The slot system is tightly integrated with the storage system:
- Images are organized by slot number
- When products expire or are removed, images are automatically cleaned up
- Admins can directly upload images to specific slot folders
- SEO benefits from consistent image URL patterns

### Search & Filtering

Comprehensive search and filtering capabilities:
- Filter slots by status
- Search by product name or details
- Category-based filtering
- Custom sort orders

## Conclusion

The slot system forms the foundation of the SokoClick platform, providing a structured way to showcase 25 featured products with robust management capabilities. The system's comprehensive architecture ensures data integrity, performance, and a seamless user experience for both admins and regular users.

By limiting the platform to exactly 25 slots, SokoClick maintains a focused, high-quality marketplace that prioritizes the visibility of select products rather than overwhelming users with endless options. 