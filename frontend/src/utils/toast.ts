import { useToast } from '../components/ui/Toast';

/**
 * Examples of how to use the toast system
 */

// Basic usage guide for the toast system:
// 
// 1. First, make sure your component is a child of ToastProvider
//    (it's already set up in the ChakraProvider)
//
// 2. Use the useToast hook to get toast functions:
//    ```
//    const toast = useToast();
//    ```
//
// 3. Use the toast functions to show notifications:
//    ```
//    // Basic usage
//    toast.success('Operation successful!');
//    toast.error('Something went wrong');
//    toast.warning('Be careful with this action');
//    toast.info('Here is some information');
//
//    // With custom duration (in milliseconds)
//    toast.success('Operation successful!', 5000); // 5 seconds
//    ```

/**
 * Toast notification service to provide consistent error handling
 */
export class ToastService {
  /**
   * Show a success toast for successful operations
   * @param message The message to display
   */
  static success(message: string) {
    const toast = useToast();
    toast.success(message);
  }

  /**
   * Show an error toast for failed operations
   * @param error Error object or string message
   */
  static error(error: unknown) {
    const toast = useToast();
    const message = error instanceof Error ? error.message : 
                    typeof error === 'string' ? error : 
                    'An unexpected error occurred';
    toast.error(message);
  }

  /**
   * Show an error toast for API errors
   * @param error API error object or string message
   */
  static apiError(error: unknown) {
    const toast = useToast();
    let message = 'Failed to connect to the server';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract message from common API error formats
      const errorObj = error as any;
      message = errorObj.message || errorObj.error || errorObj.statusText || message;
    }

    toast.error(message);
  }

  /**
   * Show a warning toast
   * @param message The warning message to display
   */
  static warning(message: string) {
    const toast = useToast();
    toast.warning(message);
  }

  /**
   * Show an info toast for general information
   * @param message The information message to display
   */
  static info(message: string) {
    const toast = useToast();
    toast.info(message);
  }
} 