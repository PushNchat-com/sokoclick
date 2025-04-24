# SokoClick Toast Notification System

This document describes the toast notification system used throughout the SokoClick application.

## Overview

The toast notification system provides a consistent way to display notifications to users. It supports:

- Bilingual content (English and French)
- Different toast types (success, error, info, warning)
- Customizable display options
- Responsive design across all devices

## Setup

The toast system is already set up in the main application layout. The `<Toast />` component is included in the `App.tsx` file, so you don't need to add it to individual pages or components.

## Usage

### Basic Usage

Import the toast utility in your component:

```tsx
import { toast } from '../../utils/toast';
```

Then use one of the available methods to show a notification:

```tsx
// Simple string message
toast.success('Operation successful');
toast.error('An error occurred');
toast.info('Here is some information');
toast.warning('Warning message');

// With bilingual support using translation objects
toast.success({ en: 'Success message', fr: 'Message de succès' });
```

### With Translation Context

For components that already use the language context:

```tsx
import { toast } from '../../utils/toast';
import { useLanguage } from '../../store/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  
  const text = {
    successMessage: { 
      en: 'Operation completed successfully!', 
      fr: 'Opération terminée avec succès!' 
    }
  };
  
  const handleAction = () => {
    // Do something...
    
    // Show toast with translation
    toast.success(text.successMessage);
  };
  
  return (
    <button onClick={handleAction}>
      {t({ en: 'Save', fr: 'Enregistrer' })}
    </button>
  );
};
```

### Custom Options

You can customize the toast appearance and behavior:

```tsx
toast.success('Success message', {
  duration: 5000,       // Duration in milliseconds
  position: 'top-right' // Position on screen
});
```

## Available Toast Types

1. **Success**: Use for successful operations
   ```tsx
   toast.success(message, options);
   ```

2. **Error**: Use for error messages
   ```tsx
   toast.error(message, options);
   ```

3. **Info**: Use for informational messages
   ```tsx
   toast.info(message, options);
   ```

4. **Warning**: Use for warning messages
   ```tsx
   toast.warning(message, options);
   ```

5. **Custom**: Use for custom toast types
   ```tsx
   toast.custom(message, 'info', options);
   ```

## Dismissing Toasts

Toasts automatically dismiss after their duration (default: 4000ms for standard toasts, 5000ms for errors).

You can manually dismiss all toasts:

```tsx
toast.dismiss();
```

Or dismiss a specific toast by its ID:

```tsx
const toastId = toast.success('Message');
// Later:
toast.dismissById(toastId);
```

## Best Practices

1. **Use appropriate toast types**:
   - Success: For completed operations
   - Error: For failures and errors
   - Info: For general information
   - Warning: For potential issues

2. **Keep messages concise**: Toast messages should be brief and to the point.

3. **Always provide bilingual content**: Follow the SokoClick guidelines for bilingual support using the translation object format.

4. **Consider message duration**: Keep success messages shorter (3000ms) and error messages longer (5000ms) to ensure users can read them.

5. **Don't overuse toasts**: Only show notifications for important events.

## Examples

See the `ToastExample.tsx` component for complete examples of using the toast system with proper bilingual support. 