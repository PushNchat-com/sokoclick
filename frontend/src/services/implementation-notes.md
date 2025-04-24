# Frontend-to-Service Implementation Notes

This document provides guidelines for connecting the SokoClick frontend components to the Supabase services.

## Component Integration Plan

### ProductCard Component

1. Update the component to accept data from the product service:
   ```tsx
   // Before
   const ProductCard: React.FC<ProductCardProps> = ({ product, ...props }) => {
     // Component logic
   }
   
   // After
   const ProductCard: React.FC<{ productId: string; slotId?: number }> = ({ productId, slotId }) => {
     const { product, loading, error } = useProduct(productId);
     
     if (loading) return <ProductCardSkeleton />;
     if (error) return <ErrorMessage message={error} />;
     if (!product) return null;
     
     // Existing component logic with product data
   }
   ```

2. Add proper loading states using the Skeleton component.
3. Add error handling with a standardized error component.

### SlotGrid Component

1. Update the component to use the slots service directly:
   ```tsx
   // Before
   const SlotGrid: React.FC<SlotGridProps> = ({ slots, loading, ... }) => {
     // Component logic
   }
   
   // After
   const SlotGrid: React.FC<{ filter?: SlotStatus }> = ({ filter }) => {
     const { slots, loading, error, refresh } = useSlots(filter);
     
     // Add error handling
     if (error) {
       return <ErrorDisplay message={error} onRetry={refresh} />;
     }
     
     // Existing component logic
   }
   ```

2. Ensure all action handlers (reserve, cancel, etc.) include:
   - Loading state feedback
   - Success notifications
   - Error handling with user-friendly messages

### ProductPage Component

1. Fetch product data using the product service:
   ```tsx
   const ProductPage: React.FC = () => {
     const { slotId } = useParams();
     const { product, loading, error } = useProductBySlot(Number(slotId));
     
     if (loading) return <ProductPageSkeleton />;
     if (error) return <ErrorPage message={error} />;
     if (!product) return <NotFoundPage />;
     
     // Existing component logic
   }
   ```

2. Add loading states for all data-dependent sections.
3. Implement retry mechanisms for failed data fetches.

## Standard Error Handling Components

Create reusable error handling components:

1. `ErrorMessage`: For inline errors within components
2. `ErrorBoundary`: To catch and display component errors
3. `ErrorPage`: For full-page error states
4. `Toast`: For transient notifications

## Loading State Components

Standardize loading state components:

1. `LoadingSpinner`: For button loading states
2. `ProductCardSkeleton`: For product card loading
3. `SlotGridSkeleton`: For slot grid loading
4. `PageSkeleton`: For full page loading

## UI Feedback Implementation

### Toast Notification System

Implement a toast notification system that provides consistent feedback for user actions:

```tsx
// Usage example
const handleReserveSlot = async (slotId) => {
  setLoading(true);
  try {
    await slotService.reserveSlot(slotId, ...);
    toast.success('Slot reserved successfully!');
    refresh();
  } catch (error) {
    toast.error(`Failed to reserve slot: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### Confirmation Dialogs

Create a reusable confirmation dialog component for critical actions:

```tsx
// Usage example
const handleRemoveProduct = (slotId) => {
  openConfirmDialog({
    title: 'Remove Product',
    message: 'Are you sure you want to remove this product from the slot?',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await slotService.removeProductFromSlot(slotId);
        toast.success('Product removed successfully');
        refresh();
      } catch (error) {
        toast.error(`Failed to remove product: ${error.message}`);
      }
    }
  });
};
```

## Testing Strategy

1. Create test fixtures in Supabase with representative data.
2. Test all CRUD operations systematically.
3. Verify error handling behavior by simulating service failures.
4. Test all UI state transitions (loading → success, loading → error).
5. Test performance with larger datasets.

## Implementation Phases

### Phase 1: Service Integration Foundations

1. Create standardized error handling components
2. Implement toast notification system
3. Set up loading state components

### Phase 2: Connect Individual Components

1. Update MainLayout to fetch global data
2. Connect ProductCard to services
3. Update SlotGrid with service integration
4. Connect ProductPage to services

### Phase 3: Admin Dashboard Integration

1. Connect SlotManagement to services
2. Update UserManagement with service integration
3. Connect ProductForm to product service

### Phase 4: Polish and Optimization

1. Add optimistic UI updates for better UX
2. Implement retry mechanisms
3. Add loading state animations
4. Optimize data fetching with caching 