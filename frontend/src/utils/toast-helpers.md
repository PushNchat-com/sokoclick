# Toast System Documentation

## Overview

This application uses a standardized toast notification system based on the `components/ui/Toast.tsx` component. The toast system provides consistent notifications throughout the application.

## How to Use

### Basic Usage

1. Import the useToast hook in your component:
```tsx
import { useToast } from '../components/ui/Toast';
```

2. Initialize the hook in your component:
```tsx
const toast = useToast();
```

3. Use the toast methods:
```tsx
// Success notification
toast.success('Operation completed successfully');

// Error notification
toast.error('Something went wrong');

// Warning notification
toast.warning('Please be careful with this action');

// Information notification
toast.info('Here is some information');

// Generic toast with custom variant
toast.toast('Your message here', 'info', 3000); // message, variant, duration in ms
```

### Advanced Usage

- Set a custom duration (in milliseconds):
```tsx
toast.success('Operation successful!', 5000); // Shows for 5 seconds
```

- Hide a toast programmatically:
```tsx
const toastId = toast.success('Operation in progress');
// Later
toast.hide(toastId);
```

## Implementation Details

The application uses a single toast implementation found in `components/ui/Toast.tsx`. This component:

1. Provides a context and provider to manage toasts
2. Renders a toast container in a fixed position
3. Offers a hook to access toast functionality

The `ToastProvider` is included in the main App component, so any component in the application can use the `useToast` hook without additional setup.

## Backward Compatibility

For backward compatibility, the same API is available through `providers/ToastProvider.tsx`, which re-exports the functionality from the main component.

## Best Practices

- Always use descriptive messages
- Use the appropriate variant for the notification type
- Keep messages concise and actionable
- For error handling, try to provide specific error information 