# BaseProductForm Component Documentation

## Overview

The BaseProductForm is a comprehensive, multi-step form component for managing products in the SokoClick platform. It serves both admin and seller contexts, providing a unified interface for creating and editing products with bilingual support (English and French).

## Features

- Multi-step form with validation
- Bilingual support (English/French)
- Image upload with drag-and-drop
- Delivery options management
- Role-based functionality (Admin/Seller)
- Progress tracking
- Form state persistence
- Responsive design
- Accessibility compliant

## Component Structure

```
BaseProductForm/
├── Steps/
│   ├── BasicInfoStep
│   ├── ImageUploadStep
│   └── DeliveryOptionsStep
├── Sections/
│   ├── BasicInfoSection
│   ├── ProductImagesSection
│   └── DeliveryOptionsSection
└── Actions/
    └── FormActionButtons
```

## Usage

### Basic Implementation

```typescript
import BaseProductForm from './components/shared/BaseProductForm';

// For Admin context
<BaseProductForm
  isEditing={false}
  productId={productId}
  onSuccess={handleSuccess}
  context="admin"
/>

// For Seller context
<BaseProductForm
  isEditing={false}
  productId={productId}
  onSuccess={handleSuccess}
  context="seller"
/>
```

### Props Interface

```typescript
interface BaseProductFormProps {
  isEditing?: boolean;        // Whether the form is in edit mode
  productId?: string;         // Product ID when editing
  onSuccess?: () => void;     // Callback after successful submission
  context: 'admin' | 'seller'; // User context
}
```

## Form Steps

### 1. Basic Information (Step 1)

- Product name (English/French)
- Description (English/French)
- Price and currency
- WhatsApp contact number
- Category selection
- Product condition
- Slot assignment (Admin only)

### 2. Product Images (Step 2)

- Multiple image upload (up to 5 images)
- Drag-and-drop support
- Image preview
- Progress tracking
- File validation (size, type)
- Error handling

### 3. Delivery Options (Step 3)

- Multiple delivery options
- Area coverage
- Estimated delivery time
- Delivery fees
- Add/remove options

## Validation

The form implements comprehensive validation at each step:

### Basic Info Validation
- Required fields
- Length constraints
- Format validation (WhatsApp number)
- Price range validation
- Category requirements

### Image Validation
- Minimum one image required
- File size limits (5MB per image)
- File type restrictions (JPG, PNG, WebP)
- Upload status verification

### Delivery Options Validation
- Minimum one option required
- Required fields per option
- Numeric value validation
- Area coverage requirements

## State Management

The form uses React's useState and custom hooks for state management:

```typescript
const {
  currentStep,
  formData,
  imageFiles,
  deliveryOptions,
  errors,
  isLoading,
  isSaving,
  isSubmitting,
  // ... other state
} = useProductForm({
  isEditing,
  productId,
  isAdmin,
  user,
  initialSlotId,
  onSuccess
});
```

## Error Handling

- Form-level validation
- Field-level error messages
- Upload error handling
- Server error handling
- User feedback
- Retry mechanisms

## Accessibility

The form implements the following accessibility features:

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Error announcements
- Loading states
- Screen reader support

## Internationalization

Built-in support for:
- English (en)
- French (fr)

Using the translation context:
```typescript
const { t } = useLanguage();
```

## Mobile Responsiveness

The form is fully responsive with:
- Flexible layouts
- Touch-friendly interfaces
- Adaptive image uploads
- Responsive validation messages
- Mobile-optimized buttons

## Security Features

- File type validation
- Size restrictions
- User role validation
- Data sanitization
- Upload restrictions
- Session handling

## Performance Considerations

- Lazy loading of steps
- Optimized image handling
- Memoized components
- Efficient state updates
- Controlled re-renders

## Integration Points

### Backend Integration
```typescript
// File upload service
const result = await fileUploadService.uploadFile(
  file, 
  'product-images',
  productId 
    ? `products/${productId}` 
    : `products/temp/${userId}`
);

// Supabase integration
const { data } = await supabase.auth.getUser();
```

### Form Submission
```typescript
const handleSubmit = async () => {
  // Validation
  // Data transformation
  // API submission
  // Success/error handling
};
```

## Best Practices

1. **Form State Management**
   - Use controlled components
   - Implement proper validation
   - Handle all edge cases

2. **Image Handling**
   - Validate before upload
   - Show upload progress
   - Handle failures gracefully

3. **User Experience**
   - Clear error messages
   - Progress indication
   - Intuitive navigation

4. **Performance**
   - Optimize image uploads
   - Minimize re-renders
   - Efficient state updates

## Common Issues and Solutions

1. **Image Upload Failures**
   - Implement retry mechanism
   - Clear error messaging
   - Fallback options

2. **Validation Errors**
   - Clear user feedback
   - Field-level validation
   - Real-time validation

3. **State Management**
   - Proper cleanup
   - Memory management
   - Error boundaries

## Testing

The component should be tested for:
- Form validation
- Image upload
- Step navigation
- Error handling
- Role-based access
- Responsive design
- Accessibility
- Internationalization

## Dependencies

- React
- TypeScript
- Supabase
- TailwindCSS
- React Router DOM
- File upload service

## Contributing

When contributing to this component:
1. Follow the existing code structure
2. Maintain bilingual support
3. Update documentation
4. Add proper tests
5. Consider accessibility
6. Follow security best practices

## License

[Your License Information] 